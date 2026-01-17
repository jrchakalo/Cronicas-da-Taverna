import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { GlobalStyle } from './styles/GlobalStyle';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/posts/HomePage';
import { PostsPage } from './pages/posts/PostsPage';
import { FollowingPage } from './pages/posts/FollowingPage';
import { CommentModerationPage } from './pages/moderation/CommentModerationPage';
import { PostModerationPage } from './pages/moderation/PostModerationPage';
import { CreatePostPage } from './pages/posts/CreatePostPage';
import { EditPostPage } from './pages/posts/EditPostPage';
import { PostDetailPage } from './pages/posts/PostDetailPage';
import { MyPostsPage } from './pages/posts/MyPostsPage';
import { SobrePage } from './pages/static/SobrePage';
import { PrivacidadePage } from './pages/static/PrivacidadePage';
import { TermosPage } from './pages/static/TermosPage';
import { ContatoPage } from './pages/static/ContatoPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AuthorProfilePage } from './pages/profile/AuthorProfilePage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'user' | 'moderator' | 'admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route
          path="/seguindo"
          element={
            <ProtectedRoute>
              <FollowingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/autor/:id" element={<AuthorProfilePage />} />
        <Route path="/sobre" element={<SobrePage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/contato" element={<ContatoPage />} />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/posts/:id/editar"
          element={
            <ProtectedRoute>
              <EditPostPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/me/posts"
          element={
            <ProtectedRoute>
              <MyPostsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/moderation/comments"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'admin']}>
              <CommentModerationPage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/moderation/posts"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'admin']}>
              <PostModerationPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  // Apenas retorne a parte visual, sem os Providers
  return (
    <>
      <GlobalStyle />
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;