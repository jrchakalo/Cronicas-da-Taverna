import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

import { Post, User } from '../../types';
import { postService } from '../../services/postService';
import { followService } from '../../services/followService';
import { Spinner } from '../../components/forms';

const PageWrapper = styled.section`
  padding: 48px 16px 80px;
`;

const Content = styled.div`
  max-width: 1100px;
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

const SectionsGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[6]};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: 260px 1fr;
    align-items: start;
  }
`;

const SidebarCard = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const FollowList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[3]};
`;

const FollowItem = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.gray[700]};
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const FollowName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const FollowBio = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FeedGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[5]};
`;

const PostCard = styled.article`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const PostTitle = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const PostExcerpt = styled.div`
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const Tags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const LoadMoreButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 10px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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

const getPreview = (content: string, maxLength = 240) => {
  if (!content) {
    return '';
  }

  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength).trim()}...`;
};

export const FollowingPage: React.FC = () => {
  const [following, setFollowing] = useState<Array<Pick<User, 'id' | 'username' | 'avatar' | 'bio'>>>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; hasNextPage: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowing = useCallback(async () => {
    setFollowingLoading(true);
    try {
      const response = await followService.listFollowing();
      const users = response.following.map((item) => item.following).filter(Boolean);
      setFollowing(users);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível carregar seus autores seguidos.';
      toast.error(message);
    } finally {
      setFollowingLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await postService.getFollowingPosts({ page, limit: 8 });
      setPosts((current) => (page === 1 ? response.posts : [...current, ...response.posts]));
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        hasNextPage: response.pagination.hasNextPage,
      });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível carregar o feed de autores.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLoadMore = () => {
    if (pagination?.hasNextPage) {
      setPage((current) => current + 1);
    }
  };

  const feedEmpty = !loading && !error && posts.length === 0;

  const formattedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        preview: getPreview(post.excerpt ?? post.content),
        relativeDate: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR }),
      })),
    [posts]
  );

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Seguindo</Title>
          <Subtitle>Acompanhe o que seus autores favoritos estão publicando.</Subtitle>
        </Header>

        <SectionsGrid>
          <SidebarCard>
            <SectionTitle>Autores seguidos</SectionTitle>
            {followingLoading && (
              <LoadingState>
                <Spinner aria-hidden="true" /> Carregando...
              </LoadingState>
            )}
            {!followingLoading && following.length === 0 && (
              <EmptyState>Você ainda não segue nenhum autor.</EmptyState>
            )}
            {!followingLoading && following.length > 0 && (
              <FollowList>
                {following.map((author) => (
                  <FollowItem key={author.id} to={`/autor/${author.id}`}>
                    <FollowName>{author.username}</FollowName>
                    {author.bio && <FollowBio>{author.bio}</FollowBio>}
                  </FollowItem>
                ))}
              </FollowList>
            )}
          </SidebarCard>

          <div>
            <SectionTitle>Feed dos autores</SectionTitle>

            {loading && page === 1 && (
              <LoadingState>
                <Spinner aria-hidden="true" /> Carregando posts...
              </LoadingState>
            )}

            {error && !loading && <EmptyState>{error}</EmptyState>}

            {feedEmpty && <EmptyState>Nenhum post novo por aqui ainda.</EmptyState>}

            {!loading && !error && posts.length > 0 && (
              <FeedGrid>
                {formattedPosts.map((post) => (
                  <PostCard key={post.id}>
                    <PostTitle to={`/post/${post.id}`}>{post.title}</PostTitle>
                    <PostMeta>
                      <span>por {post.author?.username ?? 'Autor desconhecido'}</span>
                      <span>•</span>
                      <span>{post.relativeDate}</span>
                      <span>•</span>
                      <span>{post.viewCount} visualizações</span>
                    </PostMeta>
                    <PostExcerpt>
                      <ReactMarkdown>{post.preview}</ReactMarkdown>
                    </PostExcerpt>
                    {post.tags && post.tags.length > 0 && (
                      <Tags>
                        {post.tags.map((tag) => (
                          <Tag key={`${post.id}-${tag}`}>{tag}</Tag>
                        ))}
                      </Tags>
                    )}
                  </PostCard>
                ))}
              </FeedGrid>
            )}

            {pagination?.hasNextPage && (
              <LoadMoreButton type="button" onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Carregando...' : 'Carregar mais'}
              </LoadMoreButton>
            )}
          </div>
        </SectionsGrid>
      </Content>
    </PageWrapper>
  );
};
