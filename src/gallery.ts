import config from './config';
import Post from './models/post';
import { Store } from './store';

const GALLERY_ID = 'gallery';

function addPostFiles(galleryElement: HTMLElement, post: Post) {
  post.files.forEach((file, index) =>
    (galleryElement as any).addFile({
      id: `${post.id}-${index}`,
      original: {
        url: `${config.content.host}/original/${file.hash}.${file.extension}`,
        type: file.type,
        width: file.width,
        height: file.height,
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
