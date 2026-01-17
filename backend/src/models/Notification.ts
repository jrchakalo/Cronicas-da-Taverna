import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type NotificationType =
  | 'new_post'
  | 'comment_created'
  | 'comment_moderated'
  | 'comment_pending'
  | 'post_flagged'
  | 'comment_flagged';

interface NotificationAttributes {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'isRead' | 'metadata'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public type!: NotificationType;
  public title!: string;
  public message!: string;
  public metadata?: Record<string, any> | null;
  public isRead!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
  }
);

export default Notification;
