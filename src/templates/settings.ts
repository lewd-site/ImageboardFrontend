import { html } from 'lit-html';
import { Store } from '../store';

export function settings(store: Store) {
  const { state } = store;
  const { settings } = state;
  const { nsfw } = settings;

  function onCheckboxInput(e: Event) {
    if (!(e.target instanceof HTMLInputElement)) {
      return;
    }

    if (e.target.checked) {
      store.dispatch({ type: 'enable_nsfw' });
    } else {
      store.dispatch({ type: 'disable_nsfw' });
    }
  }

  return html`<form class="settings__form">
    <div class="settings__header">
      <h2 class="settings__title">Настройки</h2>

      <button type="button" id="settings-close" class="settings__close">
        <span class="icon icon_close-mask"></span>
      </button>
    </div>

    <div class="settings__row">
      <label class="settings__checkbox checkbox">
        <input type="checkbox" class="checkbox__input" name="nsfw" .checked=${nsfw} @input=${onCheckboxInput} />

        <span class="checkbox__mark">
          <span class="icon icon_check-mask"></span>
        </span>

        NSFW-режим
      </label>
    </div>
  </form>`;
}

export default settings;
