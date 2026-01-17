import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { followUser, unfollowUser, getFollowStatus, listFollowing } from '../controllers/followController';
import { validateRequest, idParamSchema } from '../middleware/validation';

const router = Router();

router.get('/', authenticateToken, listFollowing);
router.get('/:userId/status', authenticateToken, getFollowStatus);
router.post('/:userId', authenticateToken, validateRequest(idParamSchema, 'params'), followUser);
router.delete('/:userId', authenticateToken, validateRequest(idParamSchema, 'params'), unfollowUser);

export default router;
