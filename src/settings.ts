import { render } from 'lit-html';
import { Store } from './store';
import settings from './templates/settings';

const SETTINGS_ID = 'settings';
const TOGGLE_ID = 'header-settings';
const CLOSE_ID = 'settings-close';

const SETTINGS_CLASS = 'layout__settings';
const SETTINGS_HIDDEN_CLASS = `${SETTINGS_CLASS}_hidden`;

const LOCAL_STORAGE_SETTINGS_NSFW_KEY = 'settings.nsfw';

function onNSFWChange(enabled: boolean) {
  if (enabled) {
    document.body.classList.add('nsfw');
  } else {
    document.body.classList.remove('nsfw');
  }

  localStorage.setItem(LOCAL_STORAGE_SETTINGS_NSFW_KEY, enabled ? 'true' : 'false');
}

export function initSettings(store: Store) {
  const settingsElement = document.getElementById(SETTINGS_ID);
  if (settingsElement === null) {
    return;
  }

  store.subscribe((state, prevState) => {
    if (state.settings.nsfw !== prevState.settings.nsfw) {
      onNSFWChange(state.settings.nsfw);
      setTimeout(() => render(settings(store), settingsElement));
    }
  });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.code === 'KeyB') {
        const { state } = store;
        const { settings } = state;
        const { nsfw } = settings;
        store.dispatch({ type: nsfw ? 'disable_nsfw' : 'enable_nsfw' });
      }
    },
    { passive: true }
  );

  const { state } = store;
  onNSFWChange(state.settings.nsfw);

  settingsElement.replaceChildren();
  render(settings(store), settingsElement);

  const toggleSettingsElement = document.getElementById(TOGGLE_ID);
  if (toggleSettingsElement !== null) {
    toggleSettingsElement.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      settingsElement.classList.toggle(SETTINGS_HIDDEN_CLASS);
    });

    settingsElement.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
      settingsElement.classList.add(SETTINGS_HIDDEN_CLASS);
    });
  }

  const closeElement = document.getElementById(CLOSE_ID);
  if (closeElement) {
    closeElement.addEventListener('click', (e) => {
      e.preventDefault();
      settingsElement.classList.add(SETTINGS_HIDDEN_CLASS);
    });
  }
}

export default initSettings;
