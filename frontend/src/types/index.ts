export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
  commentCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  parentId?: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatedBy?: number | null;
  moderatedAt?: string | null;
  moderationNotes?: string | null;
  flaggedBy?: number | null;
  flaggedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
  moderator?: Pick<User, 'id' | 'username'> | null;
  flaggedByUser?: Pick<User, 'id' | 'username'> | null;
  post?: Pick<Post, 'id' | 'title'>;
  replies?: Comment[];
  likeCount?: number;
  isLiked?: boolean;
}

export interface Like {
  id: number;
  userId: number;
  postId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PostsResponse {
  posts: Post[];
  pagination: PaginationMeta;
}

export interface PublicProfileResponse {
  user: PublicUser & { posts?: Post[] };
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface ReportedPostEntry {
  postId: number;
  reportCount: number;
  post: Post & { author?: User };
}

export interface ReportedPostsResponse {
  reports: ReportedPostEntry[];
}

export interface ReportedCommentEntry {
  commentId: number;
  reportCount: number;
  comment: Comment;
}

export interface ReportedCommentsResponse {
  reports: ReportedCommentEntry[];
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: PaginationMeta;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {}

export interface CreateCommentRequest {
  content: string;
  postId: number;
  parentId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UploadResponse {
  message: string;
  file: {
    url: string;
    key: string;
    bucket: string;
    etag: string;
  };
}