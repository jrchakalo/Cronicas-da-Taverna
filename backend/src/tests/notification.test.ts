import { beforeEach, describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Notification, User } from '../models';
import notificationsRouter from '../routes/notifications';
import { generateToken } from '../utils/jwt';

let sequence = 0;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/notifications', notificationsRouter);
  return app;
};

const createUser = async (overrides: Partial<{ role: 'user' | 'moderator' | 'admin'; isActive: boolean }> = {}) => {
  sequence += 1;
  return User.create({
    username: `notify${sequence}`,
    email: `notify${sequence}@example.com`,
    password: 'Password123!',
    role: overrides.role ?? 'user',
    isActive: overrides.isActive ?? true,
  });
};

describe('Notifications delete flow', () => {
  beforeEach(async () => {
    await Notification.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    sequence = 0;
  });

  it('should delete a single notification for the authenticated user', async () => {
    const user = await createUser();
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const notification1 = await Notification.create({
      userId: user.id,
      type: 'new_post',
      title: 'Novo post',
      message: 'Um novo post foi publicado',
    });
    await Notification.create({
      userId: user.id,
      type: 'comment_created',
      title: 'Novo comentário',
      message: 'Comentaram no seu post',
    });

    const app = buildApp();
    const response = await request(app)
      .delete(`/notifications/${notification1.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(await Notification.count({ where: { userId: user.id } })).toBe(1);
  });

  it('should delete all notifications for the authenticated user', async () => {
    const user = await createUser();
    const otherUser = await createUser();
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    await Notification.create({
      userId: user.id,
      type: 'new_post',
      title: 'Novo post',
      message: 'Um novo post foi publicado',
    });
    await Notification.create({
      userId: user.id,
      type: 'comment_pending',
      title: 'Comentário pendente',
      message: 'Um comentário aguarda revisão',
    });
    await Notification.create({
      userId: otherUser.id,
      type: 'comment_moderated',
      title: 'Comentário moderado',
      message: 'Seu comentário foi moderado',
    });

    const app = buildApp();
    const response = await request(app)
      .delete('/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(await Notification.count({ where: { userId: user.id } })).toBe(0);
    expect(await Notification.count({ where: { userId: otherUser.id } })).toBe(1);
  });
});
