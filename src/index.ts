import { html, render } from 'lit-html';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';
import ApiClient from './api/client';
import config from './config';
import Post, { PostDto } from './models/post';
import Board, { BoardDto } from './models/board';
import Thread, { ThreadDto } from './models/thread';
import { post as postTemplate } from './templates/post';
import { convertBoardDtoToModel, convertPostDtoToModel, convertThreadDtoToModel } from './types';
import { delay, isAtBottom, scrollToBottom } from './utils';
import initSidebar from './sidebar';
import initPostForm from './post-form';
import '@lewd-site/components';
import '../node_modules/normalize.css/normalize.css';
import './styles/index.scss';

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

    initSidebar();

    if (board) {
      initPostForm(apiClient, board, thread);
    }
  },
  { passive: true }
);
