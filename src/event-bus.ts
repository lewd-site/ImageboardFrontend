export type Listener = (payload?: any) => void;
export type Unsubscribe = () => void;

export class EventBus {
  protected _listeners: { [event: string]: Listener[] } = {};

  public subscribe = (event: string, listener: Listener): Unsubscribe => {
    if (typeof this._listeners[event] === 'undefined') {
      this._listeners[event] = [];
    }

    this._listeners[event].push(listener);

    return () => this._listeners[event].filter((l) => l !== listener);
  };

  public emit = (event: string, payload?: any): void => {
    if (typeof this._listeners[event] === 'undefined') {
      return;
    }

    for (const listener of this._listeners[event]) {
      listener(payload);
    }
  };
}

export const eventBus = new EventBus();

export default eventBus;
