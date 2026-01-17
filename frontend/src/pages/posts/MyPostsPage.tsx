import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { postService } from '../../services/postService';
import { Post } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/forms';

const PageWrapper = styled.section`
  padding: 48px 16px 80px;
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const PostRow = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const PostTitle = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PostMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;

const ActionButton = styled(Link)`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const DangerButton = styled.button`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.red[50]};
  color: ${({ theme }) => theme.colors.red[600]};
  border: 1px solid ${({ theme }) => theme.colors.red[100]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.red[100]};
    border-color: ${({ theme }) => theme.colors.red[500]};
  }
`;

const PrimaryButton = styled(Link)`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[8]} 0;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const LoadingState = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

export const MyPostsPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await postService.getPosts({ authorId: user.id, limit: 50 });
      setPosts(response.posts);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível carregar seus posts.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = async (postId: number) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este post? Esta ação não poderá ser desfeita.');
    if (!confirmed) {
      return;
    }

    try {
      await postService.deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      toast.success('Post excluído com sucesso.');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível excluir o post.';
      toast.error(message);
    }
  };

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Meus posts</Title>
          <Subtitle>Gerencie os conteúdos que você publicou na taverna.</Subtitle>
        </Header>

        <Card>
          <PrimaryButton to="/create">Novo post</PrimaryButton>
        </Card>

        {loading && (
          <LoadingState>
            <Spinner aria-hidden="true" /> Carregando seus posts...
          </LoadingState>
        )}

        {error && !loading && <EmptyState>{error}</EmptyState>}

        {!loading && !error && posts.length === 0 && (
          <EmptyState>Você ainda não publicou nenhum post.</EmptyState>
        )}

        {!loading && posts.length > 0 && (
          <Card>
            {posts.map((post) => (
              <PostRow key={post.id}>
                <PostTitle to={`/post/${post.id}`}>{post.title}</PostTitle>
                <PostMeta>
                  <span>{post.isPublished ? 'Publicado' : 'Rascunho'}</span>
                  <span>• {post.viewCount} visualizações</span>
                </PostMeta>
                <ActionRow>
                  <ActionButton to={`/post/${post.id}`}>Abrir</ActionButton>
                  <ActionButton to={`/posts/${post.id}/editar`}>Editar</ActionButton>
                  <DangerButton type="button" onClick={() => handleDeletePost(post.id)}>
                    Excluir
                  </DangerButton>
                </ActionRow>
              </PostRow>
            ))}
          </Card>
        )}
      </Content>
    </PageWrapper>
  );
};
