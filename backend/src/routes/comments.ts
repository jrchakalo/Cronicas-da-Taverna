import { Router } from 'express';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment,
  approveComment,
  rejectComment,
  flagComment,
  toggleCommentLike,
  getReportedComments,
  getModerationQueue,
} from '../controllers/commentController';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth';
import { 
  validateRequest, 
  createCommentSchema, 
  postIdParamSchema, 
  idParamSchema, 
  updateCommentSchema,
  moderationActionSchema,
  reportSchema,
  moderationQueueQuerySchema,
  commentListQuerySchema,
} from '../middleware/validation';

const router = Router();

// Public routes
router.get(
  '/post/:postId',
  optionalAuth,
  validateRequest(postIdParamSchema, 'params'),
  validateRequest(commentListQuerySchema, 'query'),
  getComments
);

// Protected routes
router.post('/', authenticateToken, validateRequest(createCommentSchema), createComment);
router.put('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), validateRequest(updateCommentSchema), updateComment);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), deleteComment);
router.post(
  '/:id/flag',
  authenticateToken,
  validateRequest(idParamSchema, 'params'),
  validateRequest(reportSchema),
  flagComment
);

router.post(
  '/:id/like',
  authenticateToken,
  validateRequest(idParamSchema, 'params'),
  toggleCommentLike
);

// Moderation routes
router.get(
  '/moderation/queue',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  validateRequest(moderationQueueQuerySchema, 'query'),
  getModerationQueue
);

router.get(
  '/moderation/reports',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  getReportedComments
);

router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(moderationActionSchema),
  approveComment
);

router.post(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('moderator', 'admin'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(moderationActionSchema),
  rejectComment
);

export default router;