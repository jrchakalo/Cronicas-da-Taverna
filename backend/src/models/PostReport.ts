import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PostReportAttributes {
  id: number;
  userId: number;
  postId: number;
  reason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostReportCreationAttributes extends Optional<PostReportAttributes, 'id' | 'reason'> {}

class PostReport extends Model<PostReportAttributes, PostReportCreationAttributes>
  implements PostReportAttributes {
  public id!: number;
  public userId!: number;
  public postId!: number;
  public reason?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PostReport.init(
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
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'post_reports',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'postId'],
      },
    ],
  }
);

export default PostReport;
