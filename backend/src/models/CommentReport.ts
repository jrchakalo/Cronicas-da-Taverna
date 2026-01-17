import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CommentReportAttributes {
  id: number;
  userId: number;
  commentId: number;
  reason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentReportCreationAttributes extends Optional<CommentReportAttributes, 'id' | 'reason'> {}

class CommentReport extends Model<CommentReportAttributes, CommentReportCreationAttributes>
  implements CommentReportAttributes {
  public id!: number;
  public userId!: number;
  public commentId!: number;
  public reason?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CommentReport.init(
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'comment_reports',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'commentId'],
      },
    ],
  }
);

export default CommentReport;
