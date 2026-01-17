import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { Follow, User } from '../models';

export const getFollowStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { userId } = req.params;
    const targetId = Number(userId);

    const existing = await Follow.findOne({
      where: { followerId: req.user.id, followingId: targetId },
    });

    res.status(200).json({ following: !!existing });
  } catch (error) {
    console.error('Get follow status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const followUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { userId } = req.params;
    const targetId = Number(userId);

    if (targetId === req.user.id) {
      res.status(400).json({ error: 'Você não pode seguir a si mesmo' });
      return;
    }

    const targetUser = await User.findByPk(targetId);
    if (!targetUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const existing = await Follow.findOne({
      where: { followerId: req.user.id, followingId: targetId },
    });

    if (existing) {
      res.status(409).json({ error: 'Você já segue este usuário' });
      return;
    }

    await Follow.create({ followerId: req.user.id, followingId: targetId });

    res.status(201).json({ message: 'Agora você segue este autor', following: true });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { userId } = req.params;
    const targetId = Number(userId);

    await Follow.destroy({
      where: { followerId: req.user.id, followingId: targetId },
    });

    res.status(200).json({ message: 'Você deixou de seguir este autor', following: false });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listFollowing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const follows = await Follow.findAll({
      where: { followerId: req.user.id },
      include: [{ model: User, as: 'following', attributes: ['id', 'username', 'avatar', 'bio'] }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      following: follows.map((item) => item.toJSON()),
    });
  } catch (error) {
    console.error('List following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
