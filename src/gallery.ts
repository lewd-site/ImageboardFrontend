import config from './config';
import Post from './models/post';
import { Store } from './store';

const GALLERY_ID = 'gallery';
const AUDIO_PLAYER_WIDTH = 800;
const AUDIO_PLAYER_HEIGHT = 44;

function addPostFiles(galleryElement: HTMLElement, post: Post) {
  post.files.forEach((file, index) =>
    (galleryElement as any).addFile({
      id: `${post.id}-${index}`,
      original: {
        url: `${config.content.host}/original/${file.hash}.${file.extension}`,
        type: file.type,
        width: file.width || AUDIO_PLAYER_WIDTH,
        height: file.height || AUDIO_PLAYER_HEIGHT,
      },
    })
  );
}

export function initGallery(store: Store) {
  const galleryElement = document.getElementById(GALLERY_ID);
  if (galleryElement === null) {
    return;
  }

  store.subscribe(async (state, prevState) => {
    if (state.posts === prevState.posts) {
      return;
    }

    const prevPostIds = new Set(prevState.posts.map((post) => post.id));

    for (const post of state.posts) {
      const isNew = !prevPostIds.has(post.id);
      if (isNew) {
        addPostFiles(galleryElement, post);
      }
    }
  });
}

export default initGallery;
