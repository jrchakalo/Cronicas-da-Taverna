import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CommentLikeAttributes {
  id: number;
  userId: number;
  commentId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CommentLikeCreationAttributes extends Optional<CommentLikeAttributes, 'id'> {}

class CommentLike extends Model<CommentLikeAttributes, CommentLikeCreationAttributes>
  implements CommentLikeAttributes {
  public id!: number;
  public userId!: number;
  public commentId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CommentLike.init(
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
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comment_likes',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'commentId'],
      },
    ],
  }
);

export default CommentLike;
