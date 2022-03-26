import File, { FileDto } from './file';
import { Node } from './markup';

export interface ThreadDto {
  readonly id: number;
  readonly slug: string;
  readonly subject: string | null;
  readonly name: string | null;
  readonly tripcode: string | null;
  readonly message: string;
  readonly message_parsed: Node[];
  readonly files: FileDto[];
  readonly created_at: string;
  readonly bumped_at: string;
  readonly post_count: number;
}

export class Thread {
  public constructor(
    public readonly id: number,
    public readonly slug: string,
    public readonly subject: string | null,
    public readonly name: string | null,
    public readonly tripcode: string | null,
    public readonly message: string | null,
    public readonly parsedMessage: Node[],
    public readonly files: File[],
    public readonly createdAt: Date,
    public readonly bumpedAt: Date,
    public readonly postCount: number
  ) {}
}

export default Thread;
