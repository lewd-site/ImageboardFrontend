import { html } from 'lit-html';
import dayjs from 'dayjs';
import Post from '../models/post';
import markup from './markup';
import postFiles from './post-files';

interface PostProps {
  readonly className?: string;
  readonly post: Post;
}

const DEFAULT_NAME = 'Anonymous';

function formatName(post: Post): string {
  if (post.name !== null && post.name.length) {
    return post.name;
  }

  if (post.tripcode !== null && post.tripcode.length) {
    return '';
  }

  return DEFAULT_NAME;
}

export function post({ className, post }: PostProps) {
  className = [
    className,
    'post',
    post.files.length > 0 ? (post.files.length > 1 ? 'post_multiple-files' : 'post_single-file') : 'post_without-files',
  ]
    .filter((c) => typeof c !== 'undefined')
    .join(' ');

  const date = dayjs.utc(post.createdAt).format('L LTS');

  return html`<section class=${className} id=${`post_${post.id}`}>
    <div class="post__header">
      <span class="post__author">
        <span class="post__name">${formatName(post)}</span>
        <span class="post__tripcode">${post.tripcode || ''}</span>
      </span>

      <time class="post__date" datetime=${post.createdAt.toISOString()}>${date}</time>

      <span class="post__id">${post.id}</span>
    </div>

    <div class="post__content">
      ${postFiles({ className: 'post__files', post, files: post.files })}

      <div class="post__message">${markup(post.parsedMessage)}</div>
    </div>

    <div class="post__footer"></div>
  </section>`;
}
