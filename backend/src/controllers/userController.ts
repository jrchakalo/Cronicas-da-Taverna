import { Request, Response } from 'express';
import { Post, User } from '../models';
import { AuthenticatedRequest } from '../types';

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(Number(id), {
      attributes: ['id', 'username', 'avatar', 'bio', 'createdAt'],
      include: [
        {
          model: Post,
          as: 'posts',
          attributes: ['id', 'title', 'excerpt', 'imageUrl', 'tags', 'viewCount', 'createdAt'],
          where: { isPublished: true },
          required: false,
          separate: true,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// TEMPORARY: Promote user to moderator (remove after use)
export const promoteSelfToModerator = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    user.role = 'moderator';
    await user.save();

    res.status(200).json({ 
      message: 'Você agora é moderador!',
      role: user.role 
    });
  } catch (error) {
    console.error('Promote to moderator error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
