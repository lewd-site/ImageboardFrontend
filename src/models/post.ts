import File, { FileDto } from './file';
import { Node } from './markup';

export interface PostDto {
  readonly id: number;
  readonly slug: string;
  readonly parent_id: number;
  readonly name: string | null;
  readonly tripcode: string | null;
  readonly message: string;
  readonly message_parsed: Node[];
  readonly files: FileDto[];
  readonly created_at: string;
}

export class Post {
  public constructor(
    public readonly id: number,
    public readonly slug: string,
    public readonly parentId: number,
    public readonly name: string | null,
    public readonly tripcode: string | null,
    public readonly message: string | null,
    public readonly parsedMessage: Node[],
    public readonly files: File[],
    public readonly createdAt: Date
  ) {}
}

export default Post;
