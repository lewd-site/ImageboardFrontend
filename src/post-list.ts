import { html, render } from 'lit-html';
import ApiClient from './api/client';
import config from './config';
import { PostDto } from './models/post';
import { Store } from './store';
import { post as postTemplate } from './templates/post';
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
}

export default initPostList;
