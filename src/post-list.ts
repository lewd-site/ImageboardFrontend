import { html, render } from 'lit-html';
import ApiClient from './api/client';
import config from './config';
import { PostDto } from './models/post';
import { Store } from './store';
import postTemplate from './templates/post';
import { convertPostDtoToModel } from './types';
import { delay, isAtBottom, scrollToBottom } from './utils';

const POST_LIST_ID = 'post-list';
const POST_CLASS = 'thread-page__post';

const SSE_RECONNECT_INTERVAL = 5000;

async function onSSEOpen(store: Store, apiClient: ApiClient) {
  const { state } = store;
  const { thread } = state;
  if (thread === null) {
    return;
  }

  const posts = await apiClient.browsePosts(thread.slug, thread.id);
  store.dispatch({ type: 'replace_posts', posts });
}

const ICON_WIDTH = 64;
const ICON_HEIGHT = 64;

let icon: HTMLLinkElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let image: HTMLImageElement | null = null;

function initFavicon() {
  const originalIcon = document.head.querySelector('link[rel="icon"]');
  if (!originalIcon) {
    return;
  }

  icon = originalIcon.cloneNode(true) as HTMLLinkElement;
  icon.href = '';

  document.head.querySelectorAll('link[rel="icon"]').forEach((element) => element.remove());
  document.head.insertAdjacentElement('beforeend', icon);

  const canvas = document.createElement('canvas');
  canvas.width = ICON_WIDTH;
  canvas.height = ICON_HEIGHT;
  context = canvas.getContext('2d');

  const img = new Image();
  img.src = '/favicon-32x32.png';
  img.onload = () => (image = img);
}

function updateFavicon(unreadPostsCount: number) {
  if (icon === null || context === null) {
    return;
  }

  context.clearRect(0, 0, ICON_WIDTH, ICON_HEIGHT);

  if (image !== null) {
    context.drawImage(image, 0, 0, ICON_WIDTH, ICON_HEIGHT);
  }

  if (unreadPostsCount > 0) {
    context.fillStyle = '#ff1133';
    context.beginPath();
    context.arc((ICON_WIDTH * 3) / 4, (ICON_HEIGHT * 1) / 4, ICON_WIDTH / 4, 0, 2 * Math.PI);
    context.fill();
  }

  icon.href = context.canvas.toDataURL('image/png');
}

const originalTitle = document.title;

function updateTitle(unreadPostsCount: number) {
  document.title = unreadPostsCount ? `[${unreadPostsCount}] ${originalTitle}` : originalTitle;
}

let unreadPostsCount = 0;
let visible = !document.hidden;

function onPostCreated(store: Store, event: any) {
  const { state } = store;
  const { thread } = state;
  if (thread === null) {
    return;
  }

  const postDto: PostDto = JSON.parse(event.data);
  const post = convertPostDtoToModel(postDto);
  if (post.parentId !== thread.id) {
    return;
  }

  unreadPostsCount = visible ? 0 : unreadPostsCount + 1;
  updateTitle(unreadPostsCount);
  updateFavicon(unreadPostsCount);

  store.dispatch({ type: 'add_post', post });
}

let eventSource: EventSource | null = null;

function initSSE(store: Store, apiClient: ApiClient) {
  eventSource = new EventSource(config.sse.host);
  eventSource.addEventListener('open', () => onSSEOpen(store, apiClient), { passive: true });
  eventSource.addEventListener('post_created', (event: any) => onPostCreated(store, event), { passive: true });
  eventSource.addEventListener('error', () => eventSource?.close(), { passive: true });
}

export function initPostList(store: Store, apiClient: ApiClient) {
  const postListElement = document.getElementById(POST_LIST_ID);
  if (postListElement === null) {
    return;
  }

  store.subscribe(async (state, prevState) => {
    if (state.posts === prevState.posts) {
      return;
    }

    const scroll = isAtBottom();
    render(html`${state.posts.map((post) => postTemplate({ className: POST_CLASS, post }))}`, postListElement);

    if (scroll) {
      await delay();
      scrollToBottom();
    }
  });

  const { state } = store;
  const { posts } = state;

  postListElement.replaceChildren();
  render(html`${posts.map((post) => postTemplate({ className: POST_CLASS, post }))}`, postListElement);
  scrollToBottom(false);

  initSSE(store, apiClient);

  setInterval(() => {
    if (eventSource?.readyState === EventSource.CLOSED) {
      initSSE(store, apiClient);
    }
  }, SSE_RECONNECT_INTERVAL);

  document.addEventListener(
    'visibilitychange',
    () => {
      visible = !document.hidden;
      if (!visible) {
        return;
      }

      unreadPostsCount = 0;
      updateTitle(unreadPostsCount);
      updateFavicon(unreadPostsCount);
    },
    { passive: true }
  );

  initFavicon();
}

export default initPostList;
