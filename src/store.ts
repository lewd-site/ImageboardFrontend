import Board, { BoardDto } from './models/board';
import Notification from './models/notification';
import Post, { PostDto } from './models/post';
import Thread, { ThreadDto } from './models/thread';
import { convertBoardDtoToModel, convertPostDtoToModel, convertThreadDtoToModel } from './types';

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

export interface State {
  readonly boards: Board[];
  readonly board: Board | null;
  readonly threads: Thread[];
  readonly thread: Thread | null;
  readonly posts: Post[];
  readonly notifications: Notification[];
}

export type Listener = (state: State, prevState: State) => void;
export type Unsubscribe = () => void;

interface ReplacePostsAction {
  readonly type: 'replace_posts';
  readonly posts: Post[];
}

interface AddPostAction {
  readonly type: 'add_post';
  readonly post: Post;
}

interface AddNotificationAction {
  readonly type: 'add_notification';
  readonly notification: Notification;
}

interface RemoveNotificationAction {
  readonly type: 'remove_notification';
  readonly id: number;
}

interface ShowNotificationAction {
  readonly type: 'show_notification';
  readonly id: number;
}

interface HideNotificationAction {
  readonly type: 'hide_notification';
  readonly id: number;
}

export type Action =
  | ReplacePostsAction
  | AddPostAction
  | AddNotificationAction
  | RemoveNotificationAction
  | ShowNotificationAction
  | HideNotificationAction;

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'replace_posts':
      return { ...state, posts: action.posts };

    case 'add_post':
      return { ...state, posts: [...state.posts, action.post] };

    case 'add_notification':
      return { ...state, notifications: [...state.notifications, action.notification] };

    case 'remove_notification':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };

    case 'show_notification':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id !== action.id ? n : { ...n, fade: false })),
      };

    case 'hide_notification':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id !== action.id ? n : { ...n, fade: true })),
      };

    default:
      return state;
  }
}

export class Store {
  protected _listeners: Listener[] = [];

  public constructor(protected _state: State) {}

  public get state(): State {
    return { ...this._state };
  }

  public subscribe = (listener: Listener): Unsubscribe => {
    this._listeners.push(listener);

    return () => this._listeners.filter((l) => l !== listener);
  };

  public dispatch = (action: Action) => {
    const newState = reduce(this._state, action);
    if (newState === this._state) {
      return;
    }

    for (const listener of this._listeners) {
      listener(newState, this._state);
    }

    this._state = newState;
  };
}

const MIN_DELAY = 50;
const FADE_DELAY = 200;

export function deleteNotification(store: Store, id: number): void {
  store.dispatch({ type: 'hide_notification', id });
  setTimeout(() => store.dispatch({ type: 'remove_notification', id }), FADE_DELAY);
}

export function createNotification(
  store: Store,
  message: string,
  timeToLive: number | null = Notification.DEFAULT_TTL
): Notification {
  const notification = new Notification(message, timeToLive);
  store.dispatch({ type: 'add_notification', notification });
  setTimeout(() => store.dispatch({ type: 'show_notification', id: notification.id }), MIN_DELAY);

  if (timeToLive !== null) {
    setTimeout(() => deleteNotification(store, notification.id), timeToLive);
  }

  return notification;
}

function getInitialState(): State {
  return {
    boards: typeof window.ssr?.boards !== 'undefined' ? window.ssr.boards.map(convertBoardDtoToModel) : [],
    board: typeof window.ssr?.board !== 'undefined' ? convertBoardDtoToModel(window.ssr.board) : null,
    threads: typeof window.ssr?.threads !== 'undefined' ? window.ssr.threads.map(convertThreadDtoToModel) : [],
    thread: typeof window.ssr?.thread !== 'undefined' ? convertThreadDtoToModel(window.ssr.thread) : null,
    posts: typeof window.ssr?.posts !== 'undefined' ? window.ssr.posts.map(convertPostDtoToModel) : [],
    notifications: [],
  };
}

export function createStore(): Store {
  const initialState = getInitialState();
  return new Store(initialState);
}

export default createStore;
