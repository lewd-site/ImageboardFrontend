let nextNotificationId = 1;

export class Notification {
  public static readonly DEFAULT_TTL: number = 5000;

  public readonly id: number = nextNotificationId++;
  public readonly createdAt: Date = new Date();

  public fade = true;

  public constructor(
    public readonly message: string,
    public readonly timeToLive: number | null = Notification.DEFAULT_TTL
  ) {}
}

export default Notification;
