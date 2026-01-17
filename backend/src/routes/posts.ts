import { Router } from 'express';
import { 
  getPosts, 
  getFollowingPosts,
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  likePost,
  reportPost,
  getReportedPosts,
  hidePost
} from '../controllers/postController';
import { authenticateToken, optionalAuth, authorizeRoles } from '../middleware/auth';
import { validateRequest, createPostSchema, updatePostSchema, idParamSchema, reportSchema } from '../middleware/validation';

const router = Router();

// Public routes (with optional authentication)
router.get('/', optionalAuth, getPosts);
router.get('/following', authenticateToken, getFollowingPosts);
router.get('/moderation/reports', authenticateToken, authorizeRoles('moderator', 'admin'), getReportedPosts);
router.get('/:id', optionalAuth, validateRequest(idParamSchema, 'params'), getPostById);

// Protected routes
router.post('/', authenticateToken, validateRequest(createPostSchema), createPost);
router.put('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), validateRequest(updatePostSchema), updatePost);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), deletePost);
router.post('/:id/like', authenticateToken, validateRequest(idParamSchema, 'params'), likePost);
router.post(
  '/:id/report',
  authenticateToken,
  validateRequest(idParamSchema, 'params'),
  validateRequest(reportSchema),
  reportPost
);
router.post('/:id/hide', authenticateToken, authorizeRoles('moderator', 'admin'), validateRequest(idParamSchema, 'params'), hidePost);

export default router;