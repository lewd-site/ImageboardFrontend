import { html, render } from 'lit-html';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';
import config from './config';
import Post, { PostDto } from './models/post';
import { BoardDto } from './models/board';
import Thread, { ThreadDto } from './models/thread';
import { post as postTemplate } from './templates/post';
import { convertPostDtoToModel, convertThreadDtoToModel } from './types';
import { delay } from './utils';
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

document.addEventListener('DOMContentLoaded', () => {
  const thread: Thread | null =
    typeof window.ssr?.thread !== 'undefined' ? convertThreadDtoToModel(window.ssr.thread) : null;

  const posts: Post[] = (window.ssr?.posts || []).map(convertPostDtoToModel);

  const postListElement = document.getElementById('post-list');
  if (postListElement !== null) {
    postListElement.replaceChildren();
    render(html`${posts.map((post) => postTemplate({ className: 'thread-page__post', post: post }))}`, postListElement);
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

  function initSSE() {
    eventSource = new EventSource(config.sse.host);
    eventSource.addEventListener('post_created', onPostCreated);
    eventSource.addEventListener('error', () => eventSource.close());
  }

  initSSE();

  setInterval(() => {
    if (eventSource.readyState === EventSource.CLOSED) {
      initSSE();
    }
  }, SSE_RECONNECT_INTERVAL);
});
