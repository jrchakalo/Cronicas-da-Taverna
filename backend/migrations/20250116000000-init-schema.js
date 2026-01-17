/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';
    const tagsColumn = isPostgres ? Sequelize.ARRAY(Sequelize.STRING) : Sequelize.JSON;

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resetPasswordToken: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      resetPasswordTokenExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('user', 'moderator', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      excerpt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tags: {
        type: tagsColumn,
        allowNull: true,
        defaultValue: [],
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      viewCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('comments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'flagged'),
        allowNull: false,
        defaultValue: 'pending',
      },
      moderatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      moderatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      moderationNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      flaggedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      flaggedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('likes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('follows', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      followerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      followingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    const metadataColumn = isPostgres ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      message: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      metadata: {
        type: metadataColumn,
        allowNull: true,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('comment_likes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      commentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('comment_reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      commentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('post_reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('posts', ['authorId']);
    await queryInterface.addIndex('posts', ['isPublished']);
    await queryInterface.addIndex('posts', ['publishedAt']);
    if (isPostgres) {
      await queryInterface.addIndex('posts', ['tags'], {
        using: 'gin',
        name: 'posts_tags_gin_idx',
      });
    }

    await queryInterface.addIndex('comments', ['postId']);
    await queryInterface.addIndex('comments', ['authorId']);
    await queryInterface.addIndex('comments', ['parentId']);

    await queryInterface.addIndex('likes', ['userId', 'postId'], {
      unique: true,
      name: 'likes_user_post_unique',
    });

    await queryInterface.addIndex('follows', ['followerId', 'followingId'], {
      unique: true,
      name: 'follows_unique',
    });

    await queryInterface.addIndex('comment_likes', ['userId', 'commentId'], {
      unique: true,
      name: 'comment_likes_unique',
    });

    await queryInterface.addIndex('comment_reports', ['userId', 'commentId'], {
      unique: true,
      name: 'comment_reports_unique',
    });

    await queryInterface.addIndex('post_reports', ['userId', 'postId'], {
      unique: true,
      name: 'post_reports_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

    await queryInterface.dropTable('post_reports');
    await queryInterface.dropTable('comment_reports');
    await queryInterface.dropTable('comment_likes');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('follows');
    await queryInterface.dropTable('likes');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('users');

    if (isPostgres) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_comments_status";');
    }
  },
};
