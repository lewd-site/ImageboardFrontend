import ApiClient from './api/client';
import { ApiError } from './errors';
import { Store } from './store';

const FORM_ID = 'post-form';

const SUBJECT_SELECTOR = '[name="subject"]';
const NAME_SELECTOR = '[name="name"]';
const MESSAGE_SELECTOR = '[name="message"]';
const FILES_SELECTOR = '[name="files"]';

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

  subjectElement?.addEventListener('input', () => saveField(subjectElement, LOCAL_STORAGE_SUBJECT_KEY), {
    passive: true,
  });

  nameElement?.addEventListener('input', () => saveField(nameElement, LOCAL_STORAGE_NAME_KEY), { passive: true });
  messageElement?.addEventListener('input', () => saveField(messageElement, LOCAL_STORAGE_MESSAGE_KEY), {
    passive: true,
  });

  let submitting = false;

  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    const subject = getValue(subjectElement);
    const name = getValue(nameElement);
    const message = getValue(messageElement);
    const files = getFiles(filesElement);

    submitting = true;

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
      if (e instanceof ApiError) {
        // TODO: show error notification
        console.log(JSON.stringify(e));
      } else {
        throw e;
      }
    } finally {
      submitting = false;
    }
  });

  restoreFields();
}

export default initPostForm;
