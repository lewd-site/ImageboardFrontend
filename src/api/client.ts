import config from '../config';
import { ApiError, ValidationError } from '../errors';
import Board, { BoardDto } from '../models/board';
import Post, { PostDto } from '../models/post';
import Thread, { ThreadDto } from '../models/thread';
import { convertBoardDtoToModel, convertPostDtoToModel, convertThreadDtoToModel } from '../types';
import { ErrorResponse, ItemResponse, ListResponse } from './types';

async function validateResponse(response: Response) {
  if (response.status < 400) {
    return;
  }

  if (response.status === 400) {
    const data = (await response.json()) as ErrorResponse;
    throw new ValidationError(response.status, data.field, data.message);
  }

  throw new ApiError(response.status, response.statusText);
}

export class ApiClient {
  protected static readonly BASE_URL = 'api/v1';

  public async browseBoards(): Promise<Board[]> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards`;
    const response = await fetch(url);
    await validateResponse(response);

    const data = (await response.json()) as ListResponse<BoardDto>;
    return data.items.map(convertBoardDtoToModel);
  }

  public async readBoard(slug: string): Promise<Board> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}`;
    const response = await fetch(url);
    await validateResponse(response);

    const data = (await response.json()) as ItemResponse<BoardDto>;
    return convertBoardDtoToModel(data.item);
  }

  public async browseThreads(slug: string): Promise<Thread[]> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads`;
    const response = await fetch(url);
    await validateResponse(response);

    const data = (await response.json()) as ListResponse<ThreadDto>;
    return data.items.map(convertThreadDtoToModel);
  }

  public async readThread(slug: string, threadId: number): Promise<Thread> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads/${threadId}`;
    const response = await fetch(url);
    await validateResponse(response);

    const data = (await response.json()) as ItemResponse<ThreadDto>;
    return convertThreadDtoToModel(data.item);
  }

  public async addThread(slug: string, subject: string, name: string, message: string, files: File[]): Promise<Thread> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads`;
    const body = new FormData();
    body.append('subject', subject);
    body.append('name', name);
    body.append('message', message);
    for (const file of files) {
      body.append('files', file, file.name);
    }

    const response = await fetch(url, { method: 'post', body });
    await validateResponse(response);

    const data = (await response.json()) as ItemResponse<ThreadDto>;
    return convertThreadDtoToModel(data.item);
  }

  public async browsePosts(slug: string, threadId: number): Promise<Post[]> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads/${threadId}/posts`;
    const response = await fetch(url);
    await validateResponse(response);

    const data = (await response.json()) as ListResponse<PostDto>;
    return data.items.map(convertPostDtoToModel);
  }

  public async addPost(slug: string, threadId: number, name: string, message: string, files: File[]): Promise<Post> {
    const url = `${config.api.host}/${ApiClient.BASE_URL}/boards/${slug}/threads/${threadId}/posts`;
    const body = new FormData();
    body.append('name', name);
    body.append('message', message);
    for (const file of files) {
      body.append('files', file, file.name);
    }

    const response = await fetch(url, { method: 'post', body });
    await validateResponse(response);

    const data = (await response.json()) as ItemResponse<PostDto>;
    return convertPostDtoToModel(data.item);
  }
}

export default ApiClient;
