import { Notification, User } from '../models';
import { NotificationType } from '../models/Notification';
import { getIO } from '../realtime/socket';

interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
}

export const createNotification = async (payload: NotificationPayload) => {
  const notification = await Notification.create({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata ?? null,
  });

  const io = getIO();
  if (io) {
    io.emit('notification:created', {
      notification: notification.toJSON(),
      userId: payload.userId,
    });
  }

  return notification;
};

export const notifyModerators = async (payload: Omit<NotificationPayload, 'userId'>) => {
  const moderators = await User.findAll({
    where: { role: ['moderator', 'admin'] },
  });

  await Promise.all(
    moderators.map((moderator) =>
      createNotification({
        userId: moderator.id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata ?? null,
      })
    )
  );
};
