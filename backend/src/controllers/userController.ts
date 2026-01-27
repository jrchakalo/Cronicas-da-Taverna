import { Request, Response } from 'express';
import { Post, User } from '../models';

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
