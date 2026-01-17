import { sequelize } from '../config/database';
import User from './User';
import Post from './Post';
import Comment from './Comment';
import Like from './Like';
import Follow from './Follow';
import Notification from './Notification';
import CommentLike from './CommentLike';
import CommentReport from './CommentReport';
import PostReport from './PostReport';

// User associations
User.hasMany(Post, {
  foreignKey: 'authorId',
  as: 'posts',
});

User.hasMany(Comment, {
  foreignKey: 'authorId',
  as: 'comments',
});

User.hasMany(Comment, {
  foreignKey: 'moderatedBy',
  as: 'moderatedComments',
});

User.hasMany(Comment, {
  foreignKey: 'flaggedBy',
  as: 'flaggedComments',
});

User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes',
});

User.hasMany(Follow, {
  foreignKey: 'followerId',
  as: 'following',
});

User.hasMany(Follow, {
  foreignKey: 'followingId',
  as: 'followers',
});

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
});

User.hasMany(CommentLike, {
  foreignKey: 'userId',
  as: 'commentLikes',
});

User.hasMany(CommentReport, {
  foreignKey: 'userId',
  as: 'commentReports',
});

User.hasMany(PostReport, {
  foreignKey: 'userId',
  as: 'postReports',
});

// Post associations
Post.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

Post.hasMany(Comment, {
  foreignKey: 'postId',
  as: 'comments',
});

Post.hasMany(Like, {
  foreignKey: 'postId',
  as: 'likes',
});

Post.hasMany(PostReport, {
  foreignKey: 'postId',
  as: 'reports',
});

// Comment associations
Comment.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

Comment.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent',
});

Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
});

Comment.hasMany(CommentLike, {
  foreignKey: 'commentId',
  as: 'likes',
});

Comment.hasMany(CommentReport, {
  foreignKey: 'commentId',
  as: 'reports',
});

Comment.belongsTo(User, {
  foreignKey: 'moderatedBy',
  as: 'moderator',
});

Comment.belongsTo(User, {
  foreignKey: 'flaggedBy',
  as: 'flaggedByUser',
});

// Like associations
Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Like.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

CommentLike.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

CommentLike.belongsTo(Comment, {
  foreignKey: 'commentId',
  as: 'comment',
});

CommentReport.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

CommentReport.belongsTo(Comment, {
  foreignKey: 'commentId',
  as: 'comment',
});

PostReport.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

PostReport.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

Follow.belongsTo(User, {
  foreignKey: 'followerId',
  as: 'follower',
});

Follow.belongsTo(User, {
  foreignKey: 'followingId',
  as: 'following',
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export {
  sequelize,
  User,
  Post,
  Comment,
  Like,
  Follow,
  Notification,
  CommentLike,
  CommentReport,
  PostReport,
};

export default {
  sequelize,
  User,
  Post,
  Comment,
  Like,
  Follow,
  Notification,
  CommentLike,
  CommentReport,
  PostReport,
};