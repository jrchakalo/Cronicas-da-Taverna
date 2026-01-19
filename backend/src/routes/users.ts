import { Router } from 'express';
import { getUserById } from '../controllers/userController';
import { validateRequest, idParamSchema } from '../middleware/validation';

const router = Router();

router.get('/:id', validateRequest(idParamSchema, 'params'), getUserById);

export default router;
