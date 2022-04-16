import { html } from 'lit-html';
import eventBus from '../event-bus';

interface MarkupButtonsProps {
  readonly className?: string;
}

export function markupButtons({ className }: MarkupButtonsProps) {
  className = ['markup-buttons'].filter((c) => c).join('');

  function insertMarkup(before: string, after: string) {
    eventBus.emit('markup-click', { before, after });
  }

  const insertBold = () => insertMarkup('[b]', '[/b]');
  const insertItalic = () => insertMarkup('[i]', '[/i]');
  const insertUnderline = () => insertMarkup('[u]', '[/u]');
  const insertStrike = () => insertMarkup('[s]', '[/s]');
  const insertSuperscript = () => insertMarkup('[sup]', '[/sup]');
  const insertSubscript = () => insertMarkup('[sub]', '[/sub]');
  const insertSpoiler = () => insertMarkup('[spoiler]', '[/spoiler]');

  return html`<div class=${className}>
    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_bold"
      title="Полужирный, Alt+B"
      @click=${insertBold}
    >
      Тт
    </button>

    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_italic"
      title="Курсив. Alt+I"
      @click=${insertItalic}
    >
      Тт
    </button>

    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_underline"
      title="Подчёркнутый"
      @click=${insertUnderline}
    >
      Тт
    </button>

    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_strike"
      title="Зачёркнутый, Alt+T"
      @click=${insertStrike}
    >
      Тт
    </button>

    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_superscript"
      title="Надстрочный"
      @click=${insertSuperscript}
    >
      <sup>Тт</sup>
    </button>

    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_subscript"
      title="Подстрочный"
      @click=${insertSubscript}
    >
      <sub>Тт</sub>
    </button>

    <button
      type="button"
      class="markup-buttons__button markup-buttons__button_spoiler"
      title="Спойлер, Alt+P"
      @click=${insertSpoiler}
    >
      Спойлер
    </button>
  </div>`;
}

export default markupButtons;
