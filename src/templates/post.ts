import { html } from 'lit-html';
import Post from '../models/post';
import markup from './markup';
import postFiles from './post-files';

interface PostProps {
  readonly className?: string;
  readonly post: Post;
}

export function post({ className, post }: PostProps) {
  className = [className, 'post'].filter((c) => typeof c !== 'undefined').join(' ');

  return html`<section class=${className} id=${`post_${post.id}`}>
    <div class="post__header">
      <span class="post__author">
        <span class="post__name">${post.name || ''}</span>
        <span class="post__tripcode">${post.tripcode || ''}</span>
      </span>

      <time class="post__date" datetime=${post.createdAt.toISOString()}>
        ${post.createdAt.toLocaleDateString()} ${post.createdAt.toLocaleTimeString()}
      </time>

      <span class="post__id">${post.id}</span>
    </div>

    <div class="post__content">
      ${postFiles({ className: 'post__files', post, files: post.files })}

      <div class="post__message">${markup(post.parsedMessage)}</div>
    </div>

    <div class="post__footer"></div>
  </section>`;
}
