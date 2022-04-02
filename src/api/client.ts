import config from '../config';
import { ApiError } from '../errors';
import Board, { BoardDto } from '../models/board';
import Post, { PostDto } from '../models/post';
import Thread, { ThreadDto } from '../models/thread';
import { convertBoardDtoToModel, convertPostDtoToModel, convertThreadDtoToModel } from '../types';
import { ItemResponse, ListResponse } from './types';

export class ApiClient {
  protected static readonly BASE_URL = 'api/v1';

  public async browseBoards(): Promise<Board[]> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards`;
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = (await response.json()) as ListResponse<BoardDto>;

    return data.items.map(convertBoardDtoToModel);
  }

  public async readBoard(slug: string): Promise<Board> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}`;
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = (await response.json()) as ItemResponse<BoardDto>;

    return convertBoardDtoToModel(data.item);
  }

  public async browseThreads(slug: string): Promise<Thread[]> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads`;
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = (await response.json()) as ListResponse<ThreadDto>;

    return data.items.map(convertThreadDtoToModel);
  }

  public async readThread(slug: string, threadId: number): Promise<Thread> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads/${threadId}`;
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = (await response.json()) as ItemResponse<ThreadDto>;

    return convertThreadDtoToModel(data.item);
  }

  public async browsePosts(slug: string, threadId: number): Promise<Post[]> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads/${threadId}/posts`;
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new ApiError(response.status, response.statusText);
    }

    const data = (await response.json()) as ListResponse<PostDto>;

    return data.items.map(convertPostDtoToModel);
  }
}

export default ApiClient;
