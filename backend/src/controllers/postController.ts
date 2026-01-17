import { Response } from 'express';
import { Op } from 'sequelize';
import { Post, User, Comment, Like, Follow, PostReport } from '../models';
import { AuthenticatedRequest, CreatePostRequest, UpdatePostRequest, PostQuery } from '../types';
import { sequelize } from '../config/database';
import { getIO } from '../realtime/socket';
import { createNotification, notifyModerators } from '../utils/notifications';

export const getPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      tags,
      authorId,
    }: PostQuery = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const allowedSortFields = new Set(['createdAt', 'publishedAt', 'viewCount', 'title']);
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const offset = (pageNumber - 1) * limitNumber;

    const whereClause: any = {
      isPublished: true,
    };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause.tags = {
        [Op.overlap]: tagArray,
      };
    }

    if (authorId) {
      whereClause.authorId = parseInt(authorId);
    }

    const totalItems = await Post.count({ where: whereClause });

    const posts = await Post.findAll({
      where: whereClause,
      limit: limitNumber,
      offset,
      order: [[safeSortBy, safeSortOrder]],
      subQuery: false,
      attributes: {
        include: [
          [
            sequelize.literal('COUNT(DISTINCT("comments"."id"))'),
            'commentCount',
          ],
          [
            sequelize.literal('COUNT(DISTINCT("likes"."id"))'),
            'likeCount',
          ],
        ],
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'bio'],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: [],
          required: false,
          where: {
            status: 'approved',
          },
        },
        {
          model: Like,
          as: 'likes',
          attributes: [],
          required: false,
        },
      ],
      group: ['Post.id', 'author.id'],
    });

    const postIds = posts.map((post) => post.id);

    let likedPostIds = new Set<number>();
    if (req.user && postIds.length > 0) {
      const userLikes = await Like.findAll({
        attributes: ['postId'],
        where: {
          userId: req.user.id,
          postId: postIds,
        },
      });

      likedPostIds = new Set(userLikes.map((like) => like.postId));
    }

    const postsWithCounts = posts.map((post) => {
      const postJson = post.toJSON() as any;

      postJson.commentCount = Number(post.get('commentCount') ?? 0);
      postJson.likeCount = Number(post.get('likeCount') ?? 0);
      postJson.isLiked = req.user ? likedPostIds.has(post.id) : false;

      return postJson;
    });

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limitNumber) : 0;

    res.status(200).json({
      posts: postsWithCounts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowingPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNumber - 1) * limitNumber;

    const follows = await Follow.findAll({ where: { followerId: req.user.id } });
    const followingIds = follows.map((follow) => follow.followingId);

    if (followingIds.length === 0) {
      res.status(200).json({
        posts: [],
        pagination: {
          currentPage: pageNumber,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      return;
    }

    const totalItems = await Post.count({
      where: { authorId: followingIds, isPublished: true },
    });

    const posts = await Post.findAll({
      where: { authorId: followingIds, isPublished: true },
      limit: limitNumber,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'bio'] }],
    });

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limitNumber) : 0;

    res.status(200).json({
      posts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error('Get following posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const REPORT_THRESHOLD = 3;

export const getPostById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(parseInt(id), {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'bio'],
        },
      ],
    });

    if (!post || !post.isPublished) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    const commentCount = await Comment.count({
      where: {
        postId: post.id,
        status: 'approved',
      },
    });

    const likeCount = await Like.count({ where: { postId: post.id } });
    const isLiked = req.user 
      ? await Like.findOne({ where: { postId: post.id, userId: req.user.id } }) !== null
      : false;

    res.status(200).json({
      post: {
        ...post.toJSON(),
        commentCount,
        likeCount,
        isLiked,
      },
    });
  } catch (error) {
    console.error('Get post by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { title, content, excerpt, imageUrl, tags }: CreatePostRequest = req.body;

    const post = await Post.create({
      title,
      content,
      excerpt,
      imageUrl,
      tags: tags || [],
      authorId: req.user.id,
      isPublished: true,
      publishedAt: new Date(),
    });

    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'bio'],
        },
      ],
    });

    const io = getIO();
    if (io && createdPost) {
      io.emit('post:created', {
        post: createdPost.toJSON(),
      });
    }

    const followers = await Follow.findAll({
      where: { followingId: req.user.id },
    });

    await Promise.all(
      followers.map((follow) =>
        createNotification({
          userId: follow.followerId,
          type: 'new_post',
          title: 'Novo post na taverna',
          message: `${req.user?.username ?? 'Um autor'} publicou um novo post.`,
          metadata: {
            postId: createdPost?.id,
            authorId: req.user?.id,
          },
        })
      )
    );

    res.status(201).json({
      message: 'Post created successfully',
      post: createdPost,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { title, content, excerpt, imageUrl, tags }: UpdatePostRequest = req.body;

    const post = await Post.findByPk(parseInt(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user is the author
    if (post.authorId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to update this post' });
      return;
    }

    await post.update({
      title,
      content,
      excerpt,
      imageUrl,
      tags,
    });

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });

    const io = getIO();
    if (io && updatedPost) {
      io.emit('post:updated', {
        post: updatedPost.toJSON(),
      });
    }

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reportPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    const post = await Post.findByPk(Number(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (post.authorId === req.user.id) {
      res.status(400).json({ error: 'Você não pode denunciar seu próprio post' });
      return;
    }

    const existing = await PostReport.findOne({
      where: { userId: req.user.id, postId: post.id },
    });

    if (existing) {
      res.status(409).json({ error: 'Post já denunciado por você' });
      return;
    }

    await PostReport.create({
      userId: req.user.id,
      postId: post.id,
      reason: reason ?? null,
    });

    const reportCount = await PostReport.count({ where: { postId: post.id } });

    if (reportCount >= REPORT_THRESHOLD) {
      await notifyModerators({
        type: 'post_flagged',
        title: 'Post denunciado',
        message: 'Um post atingiu o limite de denúncias.',
        metadata: { postId: post.id, reports: reportCount },
      });
    }

    res.status(200).json({
      message: 'Denúncia registrada. A moderação será avisada se atingir o limite.',
      reportCount,
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReportedPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await PostReport.findAll({
      attributes: [
        'postId',
        [sequelize.fn('COUNT', sequelize.col('PostReport.id')), 'reportCount'],
      ],
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title', 'authorId', 'isPublished', 'createdAt'],
          include: [
            { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
          ],
        },
      ],
      group: ['PostReport.postId', 'post.id', 'post->author.id'],
      order: [[sequelize.literal('COUNT("PostReport"."id")'), 'DESC']],
    });

    res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error('Get reported posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const hidePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(Number(id));

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    await post.update({ isPublished: false });

    res.status(200).json({ message: 'Post removido do ar', post });
  } catch (error) {
    console.error('Hide post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const post = await Post.findByPk(parseInt(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user is the author
    if (post.authorId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to delete this post' });
      return;
    }

    await post.destroy();

    const io = getIO();
    if (io) {
      io.emit('post:deleted', {
        postId: post.id,
      });
    }

    res.status(200).json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const likePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const post = await Post.findByPk(parseInt(id));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const existingLike = await Like.findOne({
      where: { postId: post.id, userId: req.user.id },
    });

    if (existingLike) {
      await existingLike.destroy();
      res.status(200).json({ message: 'Post unliked', liked: false });
    } else {
      await Like.create({ postId: post.id, userId: req.user.id });
      res.status(200).json({ message: 'Post liked', liked: true });
    }

    const io = getIO();
    if (io) {
      io.emit('post:likeToggled', {
        postId: post.id,
        liked: !existingLike,
        userId: req.user.id,
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};