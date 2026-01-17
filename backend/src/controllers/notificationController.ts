import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { Notification } from '../models';

export const listNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id: Number(id), userId: req.user.id },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    await notification.update({ isRead: true });

    res.status(200).json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.status(200).json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id: Number(id), userId: req.user.id },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    await notification.destroy();

    res.status(200).json({ message: 'Notificação removida' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAllNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await Notification.destroy({ where: { userId: req.user.id } });

    res.status(200).json({ message: 'Todas as notificações foram removidas' });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
