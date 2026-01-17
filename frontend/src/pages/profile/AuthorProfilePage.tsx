import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { Post, PublicUser } from '../../types';
import { userService } from '../../services/userService';
import { Spinner } from '../../components/forms';
import { useAuth } from '../../hooks/useAuth';
import { followService } from '../../services/followService';

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

const HeaderCard = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.space[5]};
  display: grid;
  gap: ${({ theme }) => theme.space[4]};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: auto 1fr;
    align-items: center;
  }
`;

const Avatar = styled.div`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const FollowButton = styled.button<{ $active?: boolean }>`
  align-self: flex-start;
  border: 1px solid ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 14px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[600] : 'transparent'};
  color: ${({ theme, $active }) => ($active ? '#ffffff' : theme.colors.primary[600])};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
    color: #ffffff;
  }
`;

const Name = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Bio = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Meta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  flex-wrap: wrap;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const PostsGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[5]};
`;

const Card = styled.article`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const CardTitle = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const CardExcerpt = styled.div`
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
  background: ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[8]} 0;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[6]} 0;
  color: ${({ theme }) => theme.colors.red[500]};
`;

export const AuthorProfilePage: React.FC = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await userService.getPublicProfile(Number(id));
        setProfile(response.user);
        setPosts(response.user.posts ?? []);
        if (isAuthenticated && response.user.id) {
          const status = await followService.getStatus(response.user.id);
          setIsFollowing(status.following);
        }
      } catch (err: any) {
        const message = err?.response?.data?.error ?? 'Não foi possível carregar este autor.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, isAuthenticated]);

  const handleToggleFollow = async () => {
    if (!profile?.id || !isAuthenticated || user?.id === profile.id) {
      return;
    }
    setIsToggling(true);
    try {
      if (isFollowing) {
        const response = await followService.unfollow(profile.id);
        setIsFollowing(response.following);
      } else {
        const response = await followService.follow(profile.id);
        setIsFollowing(response.following);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const initials = useMemo(() => profile?.username?.charAt(0)?.toUpperCase() ?? 'U', [profile?.username]);

  return (
    <PageWrapper>
      <Content>
        {loading && (
          <LoadingState>
            <Spinner aria-hidden="true" /> Carregando autor...
          </LoadingState>
        )}

        {error && !loading && <ErrorState>{error}</ErrorState>}

        {!loading && profile && (
          <>
            <HeaderCard>
              <Avatar>
                {profile.avatar ? (
                  <AvatarImage src={profile.avatar} alt={profile.username} />
                ) : (
                  <span>{initials}</span>
                )}
              </Avatar>
              <HeaderInfo>
                <Name>{profile.username}</Name>
                <Bio>{profile.bio || 'Este autor ainda não adicionou uma bio.'}</Bio>
                <Meta>
                  <span>{posts.length} post(s)</span>
                </Meta>
                {isAuthenticated && user?.id !== profile.id && (
                  <FollowButton type="button" onClick={handleToggleFollow} $active={isFollowing} disabled={isToggling}>
                    {isToggling ? 'Atualizando...' : isFollowing ? 'Seguindo' : 'Seguir'}
                  </FollowButton>
                )}
              </HeaderInfo>
            </HeaderCard>

            {posts.length === 0 ? (
              <EmptyState>Este autor ainda não publicou nenhuma crônica.</EmptyState>
            ) : (
              <PostsGrid>
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardTitle to={`/post/${post.id}`}>{post.title}</CardTitle>
                    <CardExcerpt>
                      <ReactMarkdown
                        allowedElements={['p', 'strong', 'em', 'del', 'code', 'a', 'ul', 'ol', 'li', 'blockquote', 'br']}
                        unwrapDisallowed
                      >
                        {post.excerpt || `${post.content?.slice(0, 200)}${post.content && post.content.length > 200 ? '...' : ''}`}
                      </ReactMarkdown>
                    </CardExcerpt>
                    {post.tags && post.tags.length > 0 && (
                      <Tags>
                        {post.tags.map((tag) => (
                          <Tag key={tag}>#{tag}</Tag>
                        ))}
                      </Tags>
                    )}
                  </Card>
                ))}
              </PostsGrid>
            )}
          </>
        )}
      </Content>
    </PageWrapper>
  );
};
