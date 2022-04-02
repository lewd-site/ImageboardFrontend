import { html } from 'lit-html';
import config from '../config';
import File from '../models/file';
import Post from '../models/post';
import Thread from '../models/thread';

interface PostFilesProps {
  readonly className?: string;
  readonly post: Post | Thread;
  readonly files: File[];
}

const MAX_NAME_LENGTH = 20;
const DEFAULT_THUMBNAIL_SIZE = 96;
const THUMBNAIL_SIZE = 250;
const TRANSPARENT = ['webp', 'png', 'gif'];

function formatFileName(name: string): string {
  if (name.length > MAX_NAME_LENGTH) {
    const nameParts = name.split('.');
    const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;

    if (extension !== null) {
      return name.substring(0, MAX_NAME_LENGTH - 4 - extension.length) + '[…].' + extension;
    }

    return name.substring(0, MAX_NAME_LENGTH - 4) + '[…]';
  }

  return name;
}

function formatFileDimensions(file: File): string {
  const dimensions = [formatFileSize(file.size)];

  if (file.width !== null && file.height !== null) {
    dimensions.push(`${file.width}x${file.height}`);
  }

  if (file.length !== null) {
    dimensions.push(formatDuration(file.length));
  }

  return dimensions.join(', ');
}

function formatFileSize(size: number): string {
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const index = size === 0 ? 0 : Math.floor((31 - Math.clz32(size)) / 10);
  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatDuration(seconds: number): string {
  const ss = (Math.floor(seconds) % 60).toString().padStart(2, '0');
  const mm = (Math.floor(seconds / 60) % 60).toString().padStart(2, '0');
  const hh = (Math.floor(seconds / 3600) % 60).toString().padStart(2, '0');
  if (+hh > 0) {
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

export function postFiles({ className, post, files }: PostFilesProps) {
  if (!files.length) {
    return undefined;
  }

  className = [className, 'post-files'].filter((c) => typeof c !== 'undefined').join(' ');

  return html`<ul class=${className}>
    ${files.map((file, index) => {
      const fileType = file.type.split('/').shift() || 'image';

      const fallbackExtension = TRANSPARENT.includes(file.extension) ? 'png' : 'jpg';
      const fallbackMimeType = TRANSPARENT.includes(file.extension) ? 'image/png' : 'image/jpeg';

      const originalUrl = `${config.content.host}/original/${file.hash}.${file.extension}`;
      const thumbnailUrl = `${config.content.host}/thumbnails/${file.hash}.webp`;
      const thumbnailFallbackUrl = `${config.content.host}/thumbnails/${file.hash}.${fallbackExtension}`;

      const width = file.width || DEFAULT_THUMBNAIL_SIZE;
      const height = file.height || DEFAULT_THUMBNAIL_SIZE;
      const thumbnailWidth = Math.round(width / Math.max(1, width / THUMBNAIL_SIZE, height / THUMBNAIL_SIZE));
      const thumbnailHeight = Math.round(height / Math.max(1, width / THUMBNAIL_SIZE, height / THUMBNAIL_SIZE));

      return html`<li class=${`post-files__item post-file post-file_${fileType}`}>
        <div class="post-file__info">
          <div class="post-file__name">
            <a class="post-file__info-link" href=${originalUrl} target="_blank">${formatFileName(file.name)}</a>
          </div>

          <div class="post-file__dimensions">${formatFileDimensions(file)}</div>
        </div>

        <a
          class="post-file__link"
          href=${originalUrl}
          target="_blank"
          data-gallery=${JSON.stringify({
            id: `${post.id}-${index}`,
            original: { url: originalUrl, type: file.type, width: file.width || 800, height: file.height || 44 },
          })}
        >
          <picture class="post-file__picture">
            <source srcset=${thumbnailUrl} type="image/webp" />
            <source srcset=${thumbnailFallbackUrl} type=${fallbackMimeType} />

            <img
              class="post-file__image"
              src=${thumbnailFallbackUrl}
              alt=""
              title=${file.name}
              width=${thumbnailWidth}
              height=${thumbnailHeight}
            />
          </picture>
        </a>
      </li>`;
    })}
  </ul>`;
}

export default postFiles;
