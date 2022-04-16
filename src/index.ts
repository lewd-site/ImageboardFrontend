import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';
import ApiClient from './api/client';
import initGallery from './gallery';
import initNotifications from './notifications';
import initPostList from './post-list';
import initPostForm from './post-form';
import initSidebar from './sidebar';
import createStore from './store';
import '@lewd-site/components';
import '../node_modules/normalize.css/normalize.css';
import './styles/index.scss';

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.locale('ru');

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const apiClient = new ApiClient();
    const store = createStore();

    initSidebar();
    initPostForm(store, apiClient);
    initPostList(store, apiClient);
    initGallery(store);
    initNotifications(store);
  },
  { passive: true }
);
