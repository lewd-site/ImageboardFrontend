import { html } from 'lit-html';
import dayjs from 'dayjs';
import Post from '../models/post';
import markup from './markup';
import postFiles from './post-files';
import eventBus from '../event-bus';

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

  function onReplyClick(e: Event) {
    eventBus.emit('reply-click', post.id);
  }

  return html`<section class=${className} id=${`post_${post.id}`}>
    <div class="post__header">
      <span class="post__author">
        <span class="post__name">${formatName(post)}</span>
        <span class="post__tripcode">${post.tripcode || ''}</span>
      </span>

      <time class="post__date" datetime=${post.createdAt.toISOString()}>${date}</time>

      <span class="post__actions">
        <span class="post__id">${post.id}</span>

        <button type="button" class="post__reply" @click=${onReplyClick}>
          <span class="icon icon_reply-mask"></span>
        </button>
      </span>
    </div>

    <div class="post__content">
      ${postFiles({ className: 'post__files', post, files: post.files })}

      <div class="post__message">${markup(post.parsedMessage)}</div>
    </div>

    <div class="post__footer"></div>
  </section>`;
}

export default post;
