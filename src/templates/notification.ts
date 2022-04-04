import { html, TemplateResult } from 'lit-html';
import Notification from '../models/notification';
import { deleteNotification, Store } from '../store';

interface NotificationProps {
  readonly className?: string;
  readonly notification: Notification;
  readonly store: Store;
}

export function notification({ className, notification, store }: NotificationProps): TemplateResult {
  className = [className, 'notification', notification.fade ? 'notification_fade' : undefined]
    .filter((c) => typeof c !== 'undefined')
    .join(' ');

  const onClick = (e: Event) => {
    e.preventDefault();

    deleteNotification(store, notification.id);
  };

  return html`<div class=${className} @click=${onClick}>
    <span class="notification__message">${notification.message}</span>
  </div>`;
}

export default notification;
