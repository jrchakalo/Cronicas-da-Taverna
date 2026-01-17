import { beforeEach, describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Follow, Post, User } from '../models';
import postsRouter from '../routes/posts';
import { generateToken } from '../utils/jwt';

let sequence = 0;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/posts', postsRouter);
  return app;
};

const createUser = async (overrides: Partial<{ role: 'user' | 'moderator' | 'admin'; isActive: boolean }> = {}) => {
  sequence += 1;
  return User.create({
    username: `follow${sequence}`,
    email: `follow${sequence}@example.com`,
    password: 'Password123!',
    role: overrides.role ?? 'user',
    isActive: overrides.isActive ?? true,
  });
};

describe('Following feed', () => {
  beforeEach(async () => {
    await Follow.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await Post.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    sequence = 0;
  });

  it('should return only posts from followed authors', async () => {
    const follower = await createUser();
    const followedAuthor = await createUser();
    const otherAuthor = await createUser();

    await Follow.create({ followerId: follower.id, followingId: followedAuthor.id });

    const followedPost = await Post.create({
      title: 'Post seguido',
      content: 'Conteúdo do autor seguido',
      authorId: followedAuthor.id,
      isPublished: true,
    });

    await Post.create({
      title: 'Post não seguido',
      content: 'Conteúdo de outro autor',
      authorId: otherAuthor.id,
      isPublished: true,
    });

    const token = generateToken({
      id: follower.id,
      email: follower.email,
      username: follower.username,
      role: follower.role,
    });

    const app = buildApp();
    const response = await request(app)
      .get('/posts/following')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].id).toBe(followedPost.id);
    expect(response.body.posts[0].author.id).toBe(followedAuthor.id);
  });
});
