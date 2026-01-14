# Documento legado

Este guia foi mantido apenas por histórico. Para o deploy atual, consulte [docs/DEPLOY.md](docs/DEPLOY.md).

# TypeScript in Tech Challenge Blog

## Overview

This document explains how TypeScript is used throughout our Tech Challenge Blog application, covering both backend and frontend implementations, benefits, and best practices.

## Why TypeScript?

TypeScript provides several key benefits:

1. **Type Safety**: Catch errors at compile time, not runtime
2. **Better IDE Support**: Enhanced autocomplete, refactoring, and navigation
3. **Improved Developer Experience**: Self-documenting code with type definitions
4. **Easier Refactoring**: Confident code changes with type checking
5. **Better Team Collaboration**: Clear interfaces and contracts

## Backend TypeScript Implementation

### Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Type Definitions

#### Custom Types (backend/src/types/index.ts)
```typescript
import { Request } from 'express';

// Extend Express Request with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

// API Request types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  tags?: string[];
}

// JWT payload structure
export interface JWTPayload {
  id: number;
  email: string;
  username: string;
  iat: number;
  exp: number;
}
```

### Sequelize Models with TypeScript

#### User Model Example
```typescript
import { 
  DataTypes, 
  Model, 
  Optional, 
  Association 
} from 'sequelize';

// Define attributes interface
interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes (optional fields for creation)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

// Model class with type safety
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstName?: string;
  public lastName?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods with proper typing
  public getPosts!: HasManyGetAssociationsMixin<Post>;
  public createPost!: HasManyCreateAssociationMixin<Post>;

  // Static associations for TypeScript
  public static associations: {
    posts: Association<User, Post>;
  };

  // Instance methods with return type annotations
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Override toJSON to exclude password
  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}
```

### Typed Controllers

#### Auth Controller Example
```typescript
import { Response } from 'express';
import { AuthenticatedRequest, LoginRequest } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // TypeScript ensures we're accessing the right properties
    const user = await User.findOne({ where: { email } });
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Method exists because of our model typing
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Type-safe token generation
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(200).json({
      message: 'Login successful',
      user: user.toJSON(), // Excludes password automatically
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Middleware Typing

#### Authentication Middleware
```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, JWTPayload } from '../types';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    // Type-safe JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload;
    
    // Verify user still exists
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Add typed user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

## Frontend TypeScript Implementation

### Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

### Frontend Type Definitions

#### API Types (frontend/src/types/index.ts)
```typescript
// Shared types with backend
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  tags?: string[];
  isPublished: boolean;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
  commentCount?: number;
  likeCount?: number;
  isLiked?: boolean;
}

// API Response types
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: PaginationMeta;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}
```

### Typed React Components

#### Functional Component with Props
```typescript
import React from 'react';

// Props interface
interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  showActions?: boolean;
}

// Typed functional component
export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onEdit,
  onDelete,
  showActions = false
}) => {
  // TypeScript knows post has all Post properties
  const handleLike = () => {
    if (onLike && post.id) {
      onLike(post.id);
    }
  };

  return (
    <div className="post-card">
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      
      {post.author && (
        <div className="author">
          By {post.author.username}
        </div>
      )}
      
      {showActions && (
        <div className="actions">
          <button onClick={handleLike}>
            {post.isLiked ? 'Unlike' : 'Like'} ({post.likeCount})
          </button>
          
          {onEdit && (
            <button onClick={() => onEdit(post)}>
              Edit
            </button>
          )}
          
          {onDelete && (
            <button onClick={() => onDelete(post.id)}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

### Custom Hooks with TypeScript

#### useAuth Hook
```typescript
import { useState, useContext, createContext, ReactNode } from 'react';
import { User } from '../types';

// Context type definition
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create typed context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component with typed props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Typed hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### API Service Types

#### Typed API Service
```typescript
import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data;
  },
};
```

### Form Handling with TypeScript

#### React Hook Form Integration
```typescript
import { useForm } from 'react-hook-form';
import { LoginFormData } from '../types';

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      await authService.login(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Invalid email address',
          },
        })}
        type="email"
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
        })}
        type="password"
        placeholder="Password"
      />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
};
```

## Styled Components with TypeScript

### Typed Theme
```typescript
// Theme type definition
export interface Theme {
  colors: {
    primary: Record<string, string>;
    gray: Record<string, string>;
  };
  fonts: {
    body: string;
    heading: string;
  };
  space: Record<string | number, string>;
}

// Styled component with theme typing
import styled from 'styled-components';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Button = styled.button<ButtonProps>`
  padding: ${({ size, theme }) => {
    switch (size) {
      case 'sm': return theme.space[2];
      case 'lg': return theme.space[4];
      default: return theme.space[3];
    }
  }};
  
  background-color: ${({ variant, theme }) => 
    variant === 'secondary' 
      ? theme.colors.gray[200] 
      : theme.colors.primary[500]
  };
  
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
`;
```

## TypeScript Best Practices

### 1. Use Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

### 2. Proper Error Handling
```typescript
// Type-safe error handling
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return `API Error: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Unknown error occurred';
};
```

### 3. Generic Types
```typescript
// Generic API response type
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Generic hook for API calls
function useApiCall<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData<T>(url)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

### 4. Utility Types
```typescript
// Pick specific properties
type UserSummary = Pick<User, 'id' | 'username' | 'avatar'>;

// Make all properties optional
type PartialUser = Partial<User>;

// Omit specific properties
type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// Record type for key-value pairs
type UserRoles = Record<string, 'admin' | 'user' | 'moderator'>;
```

## Common TypeScript Patterns

### 1. Discriminated Unions
```typescript
interface LoadingState {
  status: 'loading';
}

interface SuccessState {
  status: 'success';
  data: Post[];
}

interface ErrorState {
  status: 'error';
  error: string;
}

type AsyncState = LoadingState | SuccessState | ErrorState;

const handleState = (state: AsyncState) => {
  switch (state.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <PostList posts={state.data} />;
    case 'error':
      return <ErrorMessage message={state.error} />;
  }
};
```

### 2. Type Guards
```typescript
const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'number' && typeof obj.username === 'string';
};

const processUserData = (data: unknown) => {
  if (isUser(data)) {
    // TypeScript now knows data is User type
    console.log(data.username);
  }
};
```

### 3. Mapped Types
```typescript
// Make all properties readonly
type ReadonlyUser = Readonly<User>;

// Make all properties required
type RequiredUser = Required<User>;

// Create validation type
type UserValidation = {
  [K in keyof User]?: string; // Each property can have a validation message
};
```

## Benefits in Our Application

### 1. Compile-Time Error Catching
```typescript
// This will cause a TypeScript error
const user: User = {
  id: 1,
  username: "john",
  email: "john@example.com",
  isActive: "yes", // Error: Type 'string' is not assignable to type 'boolean'
};
```

### 2. Better IDE Support
- Autocomplete for object properties
- Method signature hints
- Refactoring support
- Go-to definition

### 3. Self-Documenting Code
```typescript
// Interface serves as documentation
interface CreatePostRequest {
  title: string;        // Required field
  content: string;      // Required field
  excerpt?: string;     // Optional field
  tags?: string[];      // Optional array of strings
}
```

### 4. Safer Refactoring
When you change an interface, TypeScript will show all places that need updates.

This comprehensive guide demonstrates how TypeScript enhances our application's reliability, developer experience, and maintainability across both backend and frontend codebases.