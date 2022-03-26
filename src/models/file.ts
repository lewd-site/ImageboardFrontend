export interface FileDto {
  readonly hash: string;
  readonly name: string;
  readonly extension: string;
  readonly path: string;
  readonly type: string;
  readonly size: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly length: number | null;
  readonly created_at: string;
}

export class File {
  public constructor(
    public readonly hash: string,
    public readonly name: string,
    public readonly extension: string,
    public readonly path: string,
    public readonly type: string,
    public readonly size: number,
    public readonly width: number | null,
    public readonly height: number | null,
    public readonly length: number | null,
    public readonly createdAt: Date
  ) {}
}

export default File;
