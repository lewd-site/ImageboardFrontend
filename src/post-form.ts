import ApiClient from './api/client';
import { ApiError, ValidationError } from './errors';
import eventBus from './event-bus';
import { createNotification, deleteNotification, Store } from './store';
import { delay } from './utils';

const FORM_ID = 'post-form';

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
  subject: 'тема',
  name: 'имя',
  message: 'сообщение',
  files: 'файл',
};

const messages: { [key: string]: string } = {
  required: 'Поле "{field}" обязательно для заполнения',
  'max-length': 'Поле "{field}" слишком длинное',
  pattern: 'Поле "{field}" имеет недопустимый формат',
  'max-size': 'Файл имеет слишком большой размер',
  'max-width': 'Файл имеет слишком большое разрешение',
  'max-height': 'Файл имеет слишком большое разрешение',
  mimetype: 'Неподдерживаемый тип файла',
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

  const subjectElement = formElement.querySelector<HTMLInputElement>(SUBJECT_SELECTOR);
  const nameElement = formElement.querySelector<HTMLInputElement>(NAME_SELECTOR);
  const messageElement = formElement.querySelector<HTMLTextAreaElement>(MESSAGE_SELECTOR);
  const filesElement = formElement.querySelector<HTMLInputElement>(FILES_SELECTOR);
  const submitElement = formElement.querySelector<HTMLButtonElement>(SUBMIT_SELECTOR);

  function restoreFields() {
    restoreField(subjectElement, LOCAL_STORAGE_SUBJECT_KEY);
    restoreField(nameElement, LOCAL_STORAGE_NAME_KEY);
    restoreField(messageElement, LOCAL_STORAGE_MESSAGE_KEY);
    restoreField(filesElement, LOCAL_STORAGE_MESSAGE_KEY);
  }

  function resetForm() {
    resetField(subjectElement);
    resetField(messageElement);
    resetField(filesElement);

    localStorage.removeItem(LOCAL_STORAGE_SUBJECT_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MESSAGE_KEY);
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
    await delay();
    messageElement.focus();
    await delay();
    messageElement.setSelectionRange(cursor, cursor);
    saveField(messageElement, LOCAL_STORAGE_MESSAGE_KEY);
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

    const notification = createNotification(store, 'Отправка поста…', null);

    try {
      if (thread !== null) {
        await apiClient.addPost(board.slug, thread.id, name, message, files);
        resetForm();
      } else {
        const thread = await apiClient.addThread(board.slug, subject, name, message, files);
        resetForm();

        window.location.href = `/${board.slug}/res/${thread.id}`;
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        createNotification(store, 'Ошибка: ' + formatErrorMessage(e));
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

  subjectElement?.addEventListener('input', () => saveField(subjectElement, LOCAL_STORAGE_SUBJECT_KEY), {
    passive: true,
  });

  nameElement?.addEventListener('input', () => saveField(nameElement, LOCAL_STORAGE_NAME_KEY), { passive: true });
  messageElement?.addEventListener('input', () => saveField(messageElement, LOCAL_STORAGE_MESSAGE_KEY), {
    passive: true,
  });

  formElement.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      submitForm();
    }
  });

  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitForm();
  });

  restoreFields();

  submitElement?.setAttribute('title', 'Ctrl+Enter');

  eventBus.subscribe('reply-click', insertReply);
}

export default initPostForm;
