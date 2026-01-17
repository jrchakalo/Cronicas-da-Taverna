import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { listNotifications, markNotificationRead, markAllRead, deleteNotification, deleteAllNotifications } from '../controllers/notificationController';
import { validateRequest, idParamSchema } from '../middleware/validation';

const router = Router();

router.get('/', authenticateToken, listNotifications);
router.post('/read-all', authenticateToken, markAllRead);
router.post('/:id/read', authenticateToken, validateRequest(idParamSchema, 'params'), markNotificationRead);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema, 'params'), deleteNotification);
router.delete('/', authenticateToken, deleteAllNotifications);

export default router;
