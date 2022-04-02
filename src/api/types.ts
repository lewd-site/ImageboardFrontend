export interface ListResponse<T> {
  readonly items: T[];
}

export interface ItemResponse<T> {
  readonly item: T;
}

export interface ErrorResponse {
  readonly status: number;
  readonly field?: string;
  readonly message: string;
}
