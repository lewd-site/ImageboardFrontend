import { html, render } from 'lit-html';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';
import config from './config';
import Post, { PostDto } from './models/post';
import Board, { BoardDto } from './models/board';
import Thread, { ThreadDto } from './models/thread';
import { post as postTemplate } from './templates/post';
import { convertBoardDtoToModel, convertPostDtoToModel, convertThreadDtoToModel } from './types';
import { delay } from './utils';
import '@lewd-site/components';
import '../node_modules/normalize.css/normalize.css';
import './styles/index.scss';
import ApiClient from './api/client';

declare global {
  interface Window {
    readonly ssr?: {
      readonly boards?: BoardDto[];
      readonly board?: BoardDto;

      readonly threads?: ThreadDto[];
      readonly thread?: ThreadDto;

      readonly posts?: PostDto[];
    };
  }
}

const SSE_RECONNECT_INTERVAL = 5000;

const SCROLL_MARGIN = 50;

function isAtBottom(): boolean {
  const scrollingElement = document.scrollingElement!;

  return scrollingElement.scrollTop + window.innerHeight >= scrollingElement.scrollHeight - SCROLL_MARGIN;
}

function scrollToBottom(smooth: boolean = true): void {
  const scrollingElement = document.scrollingElement!;

  window.scrollTo({ top: scrollingElement.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.locale('ru');

const apiClient = new ApiClient();

let board: Board | null = null;
let thread: Thread | null = null;
let posts: Post[] = [];

document.addEventListener(
  'DOMContentLoaded',
  () => {
    board = typeof window.ssr?.board !== 'undefined' ? convertBoardDtoToModel(window.ssr.board) : null;
    thread = typeof window.ssr?.thread !== 'undefined' ? convertThreadDtoToModel(window.ssr.thread) : null;
    posts = (window.ssr?.posts || []).map(convertPostDtoToModel);

    const postListElement = document.getElementById('post-list');
    if (postListElement !== null) {
      postListElement.replaceChildren();
      render(
        html`${posts.map((post) => postTemplate({ className: 'thread-page__post', post: post }))}`,
        postListElement
      );
      scrollToBottom(false);
    }

    const galleryElement = document.getElementById('gallery');

    async function onPostCreated(event: any) {
      const postDto: PostDto = JSON.parse(event.data);
      const post = convertPostDtoToModel(postDto);
      if (thread !== null && post.parentId === thread.id) {
        posts.push(post);

        if (postListElement !== null) {
          const scroll = isAtBottom();

          render(
            html`${posts.map((post) => postTemplate({ className: 'thread-page__post', post: post }))}`,
            postListElement
          );

          if (scroll) {
            await delay();
            scrollToBottom();
          }
        }

        if (galleryElement !== null) {
          post.files.forEach((file, index) =>
            (galleryElement as any).addFile({
              id: `${post.id}-${index}`,
              original: {
                url: `${config.content.host}/original/${file.hash}.${file.extension}`,
                type: file.type,
                width: file.width,
                height: file.height,
              },
            })
          );
        }
      }
    }

    let eventSource: EventSource;

    async function initSSE() {
      eventSource = new EventSource(config.sse.host);
      eventSource.addEventListener(
        'open',
        async () => {
          if (thread !== null) {
            posts = await apiClient.browsePosts(thread.slug, thread.id);
            if (postListElement !== null) {
              render(
                html`${posts.map((post) => postTemplate({ className: 'thread-page__post', post: post }))}`,
                postListElement
              );
            }
          }
        },
        { passive: true }
      );

      eventSource.addEventListener('post_created', onPostCreated, { passive: true });
      eventSource.addEventListener('error', () => eventSource.close(), { passive: true });
    }

    initSSE();

    setInterval(() => {
      if (eventSource.readyState === EventSource.CLOSED) {
        initSSE();
      }
    }, SSE_RECONNECT_INTERVAL);

    const formElement = document.getElementById('post-form');
    if (formElement !== null) {
      if (thread !== null) {
        formElement.addEventListener('submit', async (e) => {
          e.preventDefault();

          const nameElement = formElement.querySelector<HTMLInputElement>('[name="name"]')!;
          const messageElement = formElement.querySelector<HTMLTextAreaElement>('[name="message"]')!;
          const filesElement = formElement.querySelector<HTMLInputElement>('[name="files"]')!;

          const name = nameElement.value;
          const message = messageElement.value;

          const files: File[] = [];
          const fileList = filesElement.files;
          if (fileList !== null) {
            for (let i = 0; i < fileList.length; i++) {
              const item = fileList.item(i);
              if (item !== null) {
                files.push(item);
              }
            }
          }

          await apiClient.addPost(board!.slug, thread!.id, name, message, files);

          messageElement.value = '';

          filesElement.type = 'text';
          filesElement.value = '';
          filesElement.type = 'file';
        });
      } else {
        formElement.addEventListener('submit', async (e) => {
          e.preventDefault();

          const subjectElement = formElement.querySelector<HTMLInputElement>('[name="subject"]')!;
          const nameElement = formElement.querySelector<HTMLInputElement>('[name="name"]')!;
          const messageElement = formElement.querySelector<HTMLTextAreaElement>('[name="message"]')!;
          const filesElement = formElement.querySelector<HTMLInputElement>('[name="files"]')!;

          const subject = subjectElement.value;
          const name = nameElement.value;
          const message = messageElement.value;

          const files: File[] = [];
          const fileList = filesElement.files;
          if (fileList !== null) {
            for (let i = 0; i < fileList.length; i++) {
              const item = fileList.item(i);
              if (item !== null) {
                files.push(item);
              }
            }
          }

          const thread = await apiClient.addThread(board!.slug, subject, name, message, files);

          messageElement.value = '';

          filesElement.type = 'text';
          filesElement.value = '';
          filesElement.type = 'file';

          window.location.href = `/${board?.slug}/res/${thread.id}`;
        });
      }
    }
  },
  { passive: true }
);
