export class ApiError extends Error {
  public constructor(public readonly status: number, message?: string) {
    super(message);
  }
}

export class ValidationError extends ApiError {
  public constructor(status: number, public readonly field?: string, message?: string) {
    super(status, message);
  }
}
