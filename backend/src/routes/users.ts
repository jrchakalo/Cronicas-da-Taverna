import { Router } from 'express';
import { getUserById, promoteSelfToModerator } from '../controllers/userController';
import { validateRequest, idParamSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:id', validateRequest(idParamSchema, 'params'), getUserById);

// TEMPORARY: Promote self to moderator (remove after use)
router.post('/promote-me', authenticateToken, promoteSelfToModerator);

export default router;
