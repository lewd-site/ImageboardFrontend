import Board, { BoardDto } from './models/board';
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

export type Action = ReplacePostsAction | AddPostAction;

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'replace_posts':
      return { ...state, posts: action.posts };

    case 'add_post':
      return { ...state, posts: [...state.posts, action.post] };

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

function getInitialState(): State {
  return {
    boards: typeof window.ssr?.boards !== 'undefined' ? window.ssr.boards.map(convertBoardDtoToModel) : [],
    board: typeof window.ssr?.board !== 'undefined' ? convertBoardDtoToModel(window.ssr.board) : null,
    threads: typeof window.ssr?.threads !== 'undefined' ? window.ssr.threads.map(convertThreadDtoToModel) : [],
    thread: typeof window.ssr?.thread !== 'undefined' ? convertThreadDtoToModel(window.ssr.thread) : null,
    posts: typeof window.ssr?.posts !== 'undefined' ? window.ssr.posts.map(convertPostDtoToModel) : [],
  };
}

export function createStore(): Store {
  const initialState = getInitialState();
  return new Store(initialState);
}

export default createStore;
