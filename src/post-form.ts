import { render } from 'lit-html';
import ApiClient from './api/client';
import { ApiError, ValidationError } from './errors';
import eventBus from './event-bus';
import { createNotification, deleteNotification, Store } from './store';
import markupButtons from './templates/markup-buttons';
import { delay, isAtBottom, scrollToBottom } from './utils';

const FORM_ID = 'post-form';
const PLACEHOLDER_ID = 'post-form-placeholder';
const CLOSE_ID = 'post-form-close';
const MARKUP_ID = 'post-form-markup';

const FORM_CLASS = 'post-form';
const FORM_FIXED_CLASS = `${FORM_CLASS}_fixed`;
const FORM_ROW_CLASS = `${FORM_CLASS}__row`;
const FORM_SELECTOR = `.${FORM_CLASS}`;

const SUBJECT_SELECTOR = '[name="subject"]';
const NAME_SELECTOR = '[name="name"]';
const MESSAGE_SELECTOR = '[name="message"]';
const FILES_SELECTOR = '[name="files"]';
const SUBMIT_SELECTOR = '[type="submit"]';

const LOCAL_STORAGE_SUBJECT_KEY = 'post-form.subject';
const LOCAL_STORAGE_NAME_KEY = 'post-form.name';
const LOCAL_STORAGE_MESSAGE_KEY = 'post-form.message';

function restoreField(element: HTMLInputElement | HTMLTextAreaElement | null, localeStorageKey: string) {
  if (element === null) {
    return;
  }

  const value = localStorage.getItem(localeStorageKey);
  if (value === null) {
    return;
  }

  element.value = value;
}

function saveField(element: HTMLInputElement | HTMLTextAreaElement | null, localeStorageKey: string): void {
  if (element === null) {
    return;
  }

  localStorage.setItem(localeStorageKey, element.value);
}

function resetField(element: HTMLInputElement | HTMLTextAreaElement | null): void {
  if (element === null) {
    return;
  }

  if (element instanceof HTMLInputElement && element.type === 'file') {
    element.type = 'text';
    element.value = '';
    element.type = 'file';
  }

  element.value = '';
}

function getValue(element: HTMLInputElement | HTMLTextAreaElement | null, defaultValue = ''): string {
  return element?.value || defaultValue;
}

function getFiles(element: HTMLInputElement | null): File[] {
  if (element === null) {
    return [];
  }

  const fileList = element.files;
  if (fileList === null) {
    return [];
  }

  const files: File[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const item = fileList.item(i);
    if (item !== null) {
      files.push(item);
    }
  }

  return files;
}

const fields: { [key: string]: string } = {
  subject: '????????',
  name: '??????',
  message: '??????????????????',
  files: '????????',
};

const messages: { [key: string]: string } = {
  required: '???????? "{field}" ?????????????????????? ?????? ????????????????????',
  'max-length': '???????? "{field}" ?????????????? ??????????????',
  pattern: '???????? "{field}" ?????????? ???????????????????????? ????????????',
  'max-size': '???????? ?????????? ?????????????? ?????????????? ????????????',
  'max-width': '???????? ?????????? ?????????????? ?????????????? ????????????????????',
  'max-height': '???????? ?????????? ?????????????? ?????????????? ????????????????????',
  mimetype: '???????????????????????????????? ?????? ??????????',
};

function formatErrorMessage(error: ValidationError): string {
  const field = typeof error.field !== 'undefined' ? fields[error.field] || error.field : '';
  const message = messages[error.message] || error.message;

  return message.replace(/\{field\}/gi, field);
}

export function initPostForm(store: Store, apiClient: ApiClient) {
  const formElement = document.getElementById(FORM_ID);
  if (formElement === null) {
    return;
  }

  const { state } = store;
  const { board, thread } = state;
  if (board === null) {
    return;
  }

  const placeholderElement = document.getElementById(PLACEHOLDER_ID);
  const closeElement = document.getElementById(CLOSE_ID);

  function updatePlaceholderHeight() {
    if (formElement === null || placeholderElement === null) {
      return;
    }

    const wrapperElement = formElement.closest(FORM_SELECTOR);
    if (wrapperElement === null) {
      return;
    }

    const rect = wrapperElement.getBoundingClientRect();
    const height = rect.height;
    placeholderElement.style.height = `${height}px`;
  }

  function makeFixed() {
    if (formElement === null) {
      return;
    }

    const wrapperElement = formElement.closest(FORM_SELECTOR);
    if (wrapperElement === null) {
      return;
    }

    wrapperElement.classList.add(FORM_FIXED_CLASS);
  }

  function makeNormal() {
    if (formElement === null) {
      return;
    }

    const wrapperElement = formElement.closest(FORM_SELECTOR);
    if (wrapperElement === null) {
      return;
    }

    wrapperElement.classList.remove(FORM_FIXED_CLASS);
  }

  const subjectElement = formElement.querySelector<HTMLInputElement>(SUBJECT_SELECTOR);
  const nameElement = formElement.querySelector<HTMLInputElement>(NAME_SELECTOR);
  const messageElement = formElement.querySelector<HTMLTextAreaElement>(MESSAGE_SELECTOR);
  const filesElement = formElement.querySelector<HTMLInputElement>(FILES_SELECTOR);
  const submitElement = formElement.querySelector<HTMLButtonElement>(SUBMIT_SELECTOR);

  function restoreFields() {
    restoreField(subjectElement, LOCAL_STORAGE_SUBJECT_KEY);
    restoreField(nameElement, LOCAL_STORAGE_NAME_KEY);
    restoreField(messageElement, LOCAL_STORAGE_MESSAGE_KEY);
  }

  function resetForm() {
    resetField(subjectElement);
    resetField(messageElement);
    resetField(filesElement);

    localStorage.removeItem(LOCAL_STORAGE_SUBJECT_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MESSAGE_KEY);
  }

  async function updateMessageElementHeight() {
    if (messageElement === null) {
      return;
    }

    const scrollingElement = document.scrollingElement || document.body;
    const { scrollHeight } = scrollingElement;
    const scroll = isAtBottom();

    messageElement.style.height = '0';
    messageElement.style.height = `${messageElement.scrollHeight}px`;

    if (scroll && scrollingElement.scrollHeight !== scrollHeight) {
      scrollingElement.scrollTop = scrollingElement.scrollHeight;
    }

    await delay();
    updatePlaceholderHeight();
  }

  async function insertReply(postId: number) {
    if (messageElement === null) {
      return;
    }

    const selection = window.getSelection();
    const quote = selection ? selection.toString().replace(/\r/g, '').trim() : '';

    const selectionStart = messageElement.selectionStart;
    const selectionEnd = messageElement.selectionEnd;

    const textBefore = messageElement.value.substring(0, selectionStart);
    const textAfter = messageElement.value.substring(selectionEnd);

    let cursor = selectionStart;
    let textToInsert = `>>${postId}` + (quote.length ? `\n${quote}`.replace(/\n/g, '\n> ') : '');

    if (textBefore.length && !textBefore.endsWith('\n')) {
      textToInsert = `\n${textToInsert}`;
    }

    if (textAfter.length) {
      if (textAfter.startsWith('\n')) {
        textToInsert = `${textToInsert}\n`;
      } else {
        textToInsert = `${textToInsert}\n\n`;
        cursor--;
      }
    } else {
      textToInsert = `${textToInsert}\n`;
    }

    cursor += textToInsert.length;
    messageElement.value = `${textBefore}${textToInsert}${textAfter}`;
    saveField(messageElement, LOCAL_STORAGE_MESSAGE_KEY);

    updateMessageElementHeight();
    makeFixed();

    await delay();

    messageElement.focus();

    await delay();

    messageElement.setSelectionRange(cursor, cursor);
  }

  async function insertMarkup({ before, after }: { before: string; after: string }) {
    if (messageElement === null) {
      return;
    }

    const selectionStart = messageElement.selectionStart;
    const selectionEnd = messageElement.selectionEnd;

    const textSelected = messageElement.value.substring(selectionStart, selectionEnd);
    const textToInsert = `${before}${textSelected}${after}`;

    const textBefore = messageElement.value.substring(0, selectionStart);
    const textAfter = messageElement.value.substring(selectionEnd);

    messageElement.value = `${textBefore}${textToInsert}${textAfter}`;
    saveField(messageElement, LOCAL_STORAGE_MESSAGE_KEY);

    updateMessageElementHeight();

    await delay();

    messageElement.focus();

    await delay();

    const start = selectionStart + before.length;
    const end = selectionEnd + before.length;
    messageElement.setSelectionRange(start, end);
  }

  let submitting = false;

  async function submitForm() {
    if (submitting || board === null) {
      return;
    }

    submitting = true;

    const subject = getValue(subjectElement);
    const name = getValue(nameElement);
    const message = getValue(messageElement);
    const files = getFiles(filesElement);

    const notification = createNotification(store, '???????????????? ?????????????', null);

    try {
      if (thread !== null) {
        await apiClient.addPost(board.slug, thread.id, name, message, files);
        resetForm();
        updateMessageElementHeight();
        makeNormal();
        scrollToBottom();
      } else {
        const thread = await apiClient.addThread(board.slug, subject, name, message, files);
        resetForm();
        updateMessageElementHeight();

        window.location.href = `/${board.slug}/res/${thread.id}`;
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        createNotification(store, '????????????: ' + formatErrorMessage(e));
      } else if (e instanceof ApiError) {
        console.log(JSON.stringify(e));
      } else {
        throw e;
      }
    } finally {
      deleteNotification(store, notification.id);

      submitting = false;
    }
  }

  if (placeholderElement !== null) {
    document.addEventListener('resize', updatePlaceholderHeight, { passive: true });
    updatePlaceholderHeight();
  }

  subjectElement?.addEventListener('input', () => saveField(subjectElement, LOCAL_STORAGE_SUBJECT_KEY), {
    passive: true,
  });

  nameElement?.addEventListener('input', () => saveField(nameElement, LOCAL_STORAGE_NAME_KEY), { passive: true });

  messageElement?.addEventListener(
    'input',
    () => {
      saveField(messageElement, LOCAL_STORAGE_MESSAGE_KEY);
      updateMessageElementHeight();
    },
    { passive: true }
  );

  formElement.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      submitForm();
    } else if (e.altKey) {
      switch (e.code) {
        case 'KeyB':
          e.preventDefault();
          e.stopPropagation();
          insertMarkup({ before: '[b]', after: '[/b]' });
          break;

        case 'KeyI':
          e.preventDefault();
          e.stopPropagation();
          insertMarkup({ before: '[i]', after: '[/i]' });
          break;

        case 'KeyT':
          e.preventDefault();
          e.stopPropagation();
          insertMarkup({ before: '[s]', after: '[/s]' });
          break;

        case 'KeyP':
          e.preventDefault();
          e.stopPropagation();
          insertMarkup({ before: '[spoiler]', after: '[/spoiler]' });
          break;

        default:
          console.log(e.key);
      }
    }
  });

  formElement.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });

  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitForm();
  });

  restoreFields();
  updateMessageElementHeight();

  submitElement?.setAttribute('title', 'Ctrl+Enter');

  eventBus.subscribe('reply-click', insertReply);
  eventBus.subscribe('markup-click', insertMarkup);

  closeElement?.addEventListener('click', (e) => {
    e.preventDefault();
    makeNormal();
  });

  const markupElement = document.getElementById(MARKUP_ID);
  if (markupElement) {
    markupElement.classList.add(FORM_ROW_CLASS);
    render(markupButtons({}), markupElement);
  }
}

export default initPostForm;
