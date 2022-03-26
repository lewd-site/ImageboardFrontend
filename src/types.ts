import Board, { BoardDto } from './models/board';
import File, { FileDto } from './models/file';
import Post, { PostDto } from './models/post';
import Thread, { ThreadDto } from './models/thread';

export function convertBoardDtoToModel(board: BoardDto): Board {
  return new Board(board.slug, board.title, new Date(board.created_at), +board.post_count);
}

export function convertThreadDtoToModel(thread: ThreadDto): Thread {
  return new Thread(
    +thread.id,
    thread.slug,
    thread.subject,
    thread.name,
    thread.tripcode,
    thread.message,
    thread.message_parsed,
    thread.files.map(convertFileDtoToModel),
    new Date(thread.created_at),
    new Date(thread.bumped_at),
    +thread.post_count
  );
}

export function convertPostDtoToModel(post: PostDto): Post {
  return new Post(
    +post.id,
    post.slug,
    +post.parent_id,
    post.name,
    post.tripcode,
    post.message,
    post.message_parsed,
    post.files.map(convertFileDtoToModel),
    new Date(post.created_at)
  );
}

export function convertFileDtoToModel(file: FileDto): File {
  return new File(
    file.hash,
    file.name,
    file.extension,
    file.path,
    file.type,
    +file.size,
    file.width ? +file.width : null,
    file.height ? +file.height : null,
    file.length ? +file.length : null,
    new Date(file.created_at)
  );
}
