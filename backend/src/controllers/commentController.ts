import { Response } from 'express';
import { Op, Order } from 'sequelize';
import { Comment, Post, User, CommentLike, CommentReport } from '../models';
import {
  AuthenticatedRequest,
  CreateCommentRequest,
  FlagCommentRequest,
  ModerationActionRequest,
} from '../types';
import { getIO } from '../realtime/socket';
import { createNotification, notifyModerators } from '../utils/notifications';
import { sequelize } from '../config/database';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

const COMMENT_STATUSES: CommentStatus[] = ['pending', 'approved', 'rejected', 'flagged'];
const REPORT_THRESHOLD = 3;

const isModerator = (req: AuthenticatedRequest): boolean =>
  !!req.user && (req.user.role === 'moderator' || req.user.role === 'admin');

const normalizeStatuses = (
  status?: CommentStatus | CommentStatus[]
): CommentStatus[] => {
  if (!status) {
    return [];
  }

  return Array.isArray(status) ? status : [status];
};

const buildStatusCondition = (statuses: CommentStatus[]) => {
  if (statuses.length === 1) {
    return statuses[0];
  }

  return {
    [Op.in]: Array.from(new Set(statuses)),
  };
};

const baseAuthorInclude = {
  model: User,
  as: 'author',
  attributes: ['id', 'username', 'avatar'],
};

const moderatorInclude = {
  model: User,
  as: 'moderator',
  attributes: ['id', 'username'],
};

const flaggedByInclude = {
  model: User,
  as: 'flaggedByUser',
  attributes: ['id', 'username'],
};

const buildRepliesInclude = (
  statusCondition: unknown,
  includeModerationDetails: boolean
) => {
  const include = [{ ...baseAuthorInclude }];

  if (includeModerationDetails) {
    include.push({ ...moderatorInclude }, { ...flaggedByInclude });
  }

  const repliesOrder: Order = [['createdAt', 'ASC']];

  return {
    model: Comment,
    as: 'replies',
    where: { status: statusCondition },
    required: false,
    include,
    order: repliesOrder,
  } as any;
};

const getPaginationMeta = (totalItems: number, page: number, limit: number) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    currentPage: page,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const attachCommentMeta = (
  comment: any,
  likeMap: Map<number, number>,
  likedSet: Set<number>
) => {
  const json = comment.toJSON ? comment.toJSON() : comment;
  json.likeCount = likeMap.get(json.id) ?? 0;
  json.isLiked = likedSet.has(json.id);
  if (json.replies && Array.isArray(json.replies)) {
    json.replies = json.replies.map((reply: any) =>
      attachCommentMeta(reply, likeMap, likedSet)
    );
  }
  return json;
};

export const getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { page, limit, status } = req.query as unknown as {
      page?: number;
      limit?: number;
      status?: CommentStatus | CommentStatus[];
    };

    const pageNumber = Math.max(1, page ?? 1);
    const limitNumber = Math.max(1, Math.min(100, limit ?? 20));

    const post = await Post.findByPk(Number(postId));
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const moderatorView = isModerator(req);
    const requestedStatuses = normalizeStatuses(status);
    const sanitizedStatuses = requestedStatuses.filter((candidate): candidate is CommentStatus =>
      COMMENT_STATUSES.includes(candidate)
    );

    if (requestedStatuses.length !== sanitizedStatuses.length) {
      res.status(400).json({ error: 'Invalid status filter provided' });
      return;
    }

    if (!moderatorView && sanitizedStatuses.some(item => item !== 'approved')) {
      res.status(403).json({ error: 'Insufficient permissions to view those comments' });
      return;
    }

    const fallbackStatuses: CommentStatus[] = moderatorView
      ? ['approved', 'pending', 'flagged']
      : ['approved', 'flagged'];
    const statusesToUse = sanitizedStatuses.length ? sanitizedStatuses : fallbackStatuses;
    const statusCondition = buildStatusCondition(statusesToUse);

    const comments = await Comment.findAndCountAll({
      where: {
        postId: Number(postId),
        parentId: null,
        status: statusCondition,
      } as any,
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
      order: [['createdAt', 'DESC']],
      include: [
        { ...baseAuthorInclude },
        buildRepliesInclude(statusCondition, moderatorView),
        ...(moderatorView ? [{ ...moderatorInclude }, { ...flaggedByInclude }] : []),
      ] as any,
    });

    const flattenIds = (items: any[]): number[] => {
      const ids: number[] = [];
      items.forEach((item) => {
        ids.push(item.id);
        if (item.replies) {
          ids.push(...flattenIds(item.replies));
        }
      });
      return ids;
    };

    const commentIds = flattenIds(comments.rows);
    const likeCounts = await CommentLike.findAll({
      attributes: ['commentId', [sequelize.fn('COUNT', sequelize.col('id')), 'likeCount']],
      where: { commentId: commentIds },
      group: ['commentId'],
    });

    const likeMap = new Map<number, number>();
    likeCounts.forEach((row: any) => {
      likeMap.set(Number(row.get('commentId')), Number(row.get('likeCount')));
    });

    let likedSet = new Set<number>();
    if (req.user && commentIds.length > 0) {
      const likedRows = await CommentLike.findAll({
        attributes: ['commentId'],
        where: { commentId: commentIds, userId: req.user.id },
      });
      likedSet = new Set(likedRows.map((row) => Number(row.commentId)));
    }

    const commentsWithMeta = comments.rows.map((comment) =>
      attachCommentMeta(comment, likeMap, likedSet)
    );

    res.status(200).json({
      comments: commentsWithMeta,
      pagination: getPaginationMeta(comments.count, pageNumber, limitNumber),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { content, postId, parentId }: CreateCommentRequest = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment || parentComment.postId !== postId) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    const comment = await Comment.create({
      content,
      postId,
      parentId,
      authorId: req.user.id,
      status: 'pending',
    });

    await comment.reload({
      include: [{ ...baseAuthorInclude }],
    });

    const io = getIO();
    if (io) {
      io.emit('comment:created', {
        comment: comment.toJSON(),
      });
    }

    if (post.authorId !== req.user.id) {
      await createNotification({
        userId: post.authorId,
        type: 'comment_created',
        title: 'Novo comentário no seu post',
        message: 'Um comentário foi enviado e aguarda moderação.',
        metadata: { postId: post.id, commentId: comment.id },
      });
    }

    await createNotification({
      userId: req.user.id,
      type: 'comment_pending',
      title: 'Comentário enviado',
      message: 'Seu comentário foi enviado para avaliação da moderação.',
      metadata: { postId: post.id, commentId: comment.id },
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to update this comment' });
      return;
    }

    await comment.update({
      content,
      status: 'pending',
      moderatedBy: null,
      moderatedAt: null,
      moderationNotes: null,
      flaggedBy: null,
      flaggedAt: null,
    });

    await comment.reload({
      include: [{ ...baseAuthorInclude }],
    });

    const io = getIO();
    if (io) {
      io.emit('comment:updated', {
        comment: comment.toJSON(),
      });
    }

    res.status(200).json({
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const moderatorView = isModerator(req);
    const isAuthor = comment.authorId === req.user.id;

    if (!isAuthor && !moderatorView) {
      res.status(403).json({ error: 'Not authorized to delete this comment' });
      return;
    }

    const commentId = comment.id;
    const postId = comment.postId;

    await comment.destroy();

    const io = getIO();
    if (io) {
      io.emit('comment:deleted', {
        commentId,
        postId,
      });
    }

    res.status(200).json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason }: ModerationActionRequest = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const moderationNotes = reason ?? comment.moderationNotes ?? null;

    await comment.update({
      status: 'approved',
      moderatedBy: req.user.id,
      moderatedAt: new Date(),
      moderationNotes,
      flaggedBy: null,
      flaggedAt: null,
    });

    await comment.reload({
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    const io = getIO();
    if (io) {
      io.emit('comment:moderated', {
        comment: comment.toJSON(),
        actorId: req.user.id,
        action: 'approved',
      });
    }

    await createNotification({
      userId: comment.authorId,
      type: 'comment_moderated',
      title: 'Comentário aprovado',
      message: 'Seu comentário foi aprovado pela moderação.',
      metadata: { postId: comment.postId, commentId: comment.id },
    });

    res.status(200).json({
      message: 'Comment approved successfully',
      comment,
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason }: ModerationActionRequest = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const moderationNotes = reason ?? comment.moderationNotes ?? null;

    await comment.update({
      status: 'rejected',
      moderatedBy: req.user.id,
      moderatedAt: new Date(),
      moderationNotes,
      flaggedBy: null,
      flaggedAt: null,
    });

    await comment.reload({
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    const io = getIO();
    if (io) {
      io.emit('comment:moderated', {
        comment: comment.toJSON(),
        actorId: req.user.id,
        action: 'rejected',
      });
    }

    await createNotification({
      userId: comment.authorId,
      type: 'comment_moderated',
      title: 'Comentário reprovado',
      message: 'Seu comentário foi reprovado pela moderação.',
      metadata: { postId: comment.postId, commentId: comment.id },
    });

    res.status(200).json({
      message: 'Comment rejected successfully',
      comment,
    });
  } catch (error) {
    console.error('Reject comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const flagComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { reason }: FlagCommentRequest = req.body;

    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId === req.user.id) {
      res.status(400).json({ error: 'You cannot flag your own comment' });
      return;
    }

    const existingReport = await CommentReport.findOne({
      where: { userId: req.user.id, commentId: comment.id },
    });

    if (existingReport) {
      res.status(409).json({ error: 'Comentário já denunciado por você' });
      return;
    }

    await CommentReport.create({
      userId: req.user.id,
      commentId: comment.id,
      reason: reason ?? null,
    });

    const reportCount = await CommentReport.count({
      where: { commentId: comment.id },
    });

    if (reportCount >= REPORT_THRESHOLD && comment.status !== 'rejected') {
      const moderationNotes = reason
        ? [comment.moderationNotes, `Motivo da denúncia: ${reason}`].filter(Boolean).join('\n')
        : comment.moderationNotes;

      await comment.update({
        status: 'flagged',
        flaggedBy: req.user.id,
        flaggedAt: new Date(),
        moderationNotes: moderationNotes ?? null,
      });

      await notifyModerators({
        type: 'comment_flagged',
        title: 'Comentário denunciado',
        message: 'Um comentário atingiu o limite de denúncias.',
        metadata: { commentId: comment.id, postId: comment.postId, reports: reportCount },
      });
    }

    await comment.reload({
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { ...flaggedByInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    const io = getIO();
    if (io) {
      io.emit('comment:moderated', {
        comment: comment.toJSON(),
        actorId: req.user.id,
        action: 'flagged',
      });
    }

    res.status(200).json({
      message: 'Denúncia registrada. A moderação será avisada se atingir o limite.',
      comment,
      reportCount,
    });
  } catch (error) {
    console.error('Flag comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleCommentLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const comment = await Comment.findByPk(Number(id));
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const existing = await CommentLike.findOne({
      where: { userId: req.user.id, commentId: comment.id },
    });

    if (existing) {
      await existing.destroy();
    } else {
      await CommentLike.create({ userId: req.user.id, commentId: comment.id });
    }

    const likeCount = await CommentLike.count({ where: { commentId: comment.id } });

    res.status(200).json({
      message: 'Comment like toggled',
      liked: !existing,
      likeCount,
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getModerationQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, status } = req.query as unknown as {
      page?: number;
      limit?: number;
      status?: CommentStatus | CommentStatus[];
    };

    const pageNumber = Math.max(1, page ?? 1);
    const limitNumber = Math.max(1, Math.min(100, limit ?? 20));

    const requestedStatuses = normalizeStatuses(status);
    const sanitizedStatuses = requestedStatuses.filter((candidate): candidate is CommentStatus =>
      COMMENT_STATUSES.includes(candidate)
    );

    if (requestedStatuses.length !== sanitizedStatuses.length) {
      res.status(400).json({ error: 'Invalid status filter provided' });
      return;
    }

    const fallbackStatuses: CommentStatus[] = ['pending', 'flagged'];
    const statusesToUse = sanitizedStatuses.length ? sanitizedStatuses : fallbackStatuses;
    const statusCondition = buildStatusCondition(statusesToUse);

    const comments = await Comment.findAndCountAll({
      where: {
        status: statusCondition,
      },
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
      order: [['createdAt', 'DESC']],
      include: [
        { ...baseAuthorInclude },
        { ...moderatorInclude },
        { ...flaggedByInclude },
        { model: Post, as: 'post', attributes: ['id', 'title'] },
      ],
    });

    res.status(200).json({
      comments: comments.rows,
      pagination: getPaginationMeta(comments.count, pageNumber, limitNumber),
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReportedComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await CommentReport.findAll({
      attributes: [
        'commentId',
        [sequelize.fn('COUNT', sequelize.col('CommentReport.id')), 'reportCount'],
      ],
      include: [
        {
          model: Comment,
          as: 'comment',
          attributes: ['id', 'content', 'status', 'postId', 'authorId', 'createdAt'],
          include: [
            { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
            { model: Post, as: 'post', attributes: ['id', 'title'] },
          ],
        },
      ],
      group: ['CommentReport.commentId', 'comment.id', 'comment->author.id', 'comment->post.id'],
      order: [[sequelize.literal('COUNT("CommentReport"."id")'), 'DESC']],
    });

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Get reported comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};