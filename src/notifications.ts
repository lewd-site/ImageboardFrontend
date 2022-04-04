import { render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { Store } from './store';
import notificationTemplate from './templates/notification';

const NOTIFICATIONS_ID = 'notifications';
const NOTIFICATION_CLASS = 'notifications__notification';

export function initNotifications(store: Store) {
  const notificationsElement = document.getElementById(NOTIFICATIONS_ID);
  if (notificationsElement === null) {
    return;
  }

  const { state } = store;
  const { notifications } = state;
  notificationsElement.replaceChildren();
  render(
    repeat(
      notifications,
      (notification) => notification.id,
      (notification) => notificationTemplate({ className: NOTIFICATION_CLASS, notification, store })
    ),
    notificationsElement
  );

  store.subscribe((state, prevState) => {
    if (state.notifications === prevState.notifications) {
      return;
    }

    const { notifications } = state;

    render(
      repeat(
        notifications,
        (notification) => notification.id,
        (notification) => notificationTemplate({ className: NOTIFICATION_CLASS, notification, store })
      ),
      notificationsElement
    );
  });
}

export default initNotifications;
