import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

import { Post } from '../../types';
import { postService } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import {
  connectRealtime,
  disconnectRealtime,
  subscribeToEvent,
} from '../../services/realtime';
import { Spinner } from '../../components/forms';

const PageWrapper = styled.section`
  padding: 0 ${({ theme }) => theme.space[4]};
`;

const FeedContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const HeroSection = styled.section`
  max-height: 50vh;
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const HeroLead = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const HeroPrimaryButton = styled(Link)`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
    transform: translateY(-1px);
  }
`;

const HeroSecondaryLink = styled(Link)`
  align-self: center;
  color: ${({ theme }) => theme.colors.primary[700]};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  &:hover {
    text-decoration: underline;
  }
`;

const FeedHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const FeedTitle = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const FeedSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const PostsGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[5]};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.media.lg}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled.article`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
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

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const AuthorLink = styled(Link)`
  color: ${({ theme }) => theme.colors.gray[600]};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
    text-decoration: underline;
  }
`;

const CardExcerpt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
  font-size: ${({ theme }) => theme.fontSizes.base};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  em {
    font-style: italic;
  }
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

const CardFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`;

const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const LikeButton = styled.button<{ $liked?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 8px 16px;
  background: ${({ theme, $liked }) =>
    $liked ? `${theme.colors.primary[100]}` : theme.colors.gray[100]};
  color: ${({ theme, $liked }) =>
    $liked ? theme.colors.primary[700] : theme.colors.gray[700]};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: background 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme, $liked, disabled }) => {
      if (disabled) {
        return $liked ? theme.colors.primary[100] : theme.colors.gray[100];
      }
      return $liked ? theme.colors.primary[500] : theme.colors.gray[200];
    }};
    color: ${({ theme, $liked, disabled }) => {
      if (disabled) {
        return $liked ? theme.colors.primary[700] : theme.colors.gray[700];
      }
      return $liked ? '#ffffff' : theme.colors.gray[700];
    }};
  }
`;

const LikeText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

const LikeCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const CTASection = styled.section`
  align-self: center;
  width: 100%;
  max-width: 720px;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const CTAHeading = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CTASubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const CTAButton = styled(Link)`
  align-self: flex-start;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
    transform: translateY(-1px);
  }
`;

const CTAGhostButton = styled(Link)`
  align-self: flex-start;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary[700]};
  border: 1px solid ${({ theme }) => theme.colors.primary[100]};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: border-color 0.2s ease-in-out, color 0.2s ease-in-out, transform 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    color: ${({ theme }) => theme.colors.primary[600]};
    transform: translateY(-1px);
  }
`;

const CTAActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const FeaturedSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const FeaturedCard = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: 1.1fr 1fr;
    align-items: center;
  }
`;

const FeaturedImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  object-fit: cover;
  min-height: 200px;
  max-height: 280px;
`;

const FeaturedContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const FeaturedTitle = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const FeaturedMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FeaturedExcerpt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[10]} 0;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[8]} 0;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[8]} 0;
  color: ${({ theme }) => theme.colors.red[500]};
`;

const sanitizeCounter = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const mergePostPayload = (incoming: any, previous?: Post): Post => {
  const likeCount = sanitizeCounter(incoming?.likeCount, previous?.likeCount ?? 0);
  const commentCount = sanitizeCounter(incoming?.commentCount, previous?.commentCount ?? 0);
  const isLiked =
    typeof incoming?.isLiked === 'boolean'
      ? incoming.isLiked
      : previous?.isLiked ?? false;

  return {
    ...previous,
    ...incoming,
    likeCount,
    commentCount,
    isLiked,
  } as Post;
};

const useRelativeDate = (value?: string) => {
  return useMemo(() => {
    if (!value) {
      return null;
    }

    try {
      return formatDistanceToNow(new Date(value), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return null;
    }
  }, [value]);
};

interface PostCardProps {
  post: Post;
  onLike: (post: Post) => void;
  isProcessing: boolean;
}

const ThumbsUpIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-thumbs-up"
  >
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    <path d="M7 10v12" />
  </svg>
);

const PostCard: React.FC<PostCardProps> = ({ post, onLike, isProcessing }) => {
  const relativeDate = useRelativeDate(post.createdAt);
  const likeCount = sanitizeCounter(post.likeCount);
  const commentCount = sanitizeCounter(post.commentCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle to={`/post/${post.id}`}>{post.title}</CardTitle>
        <CardMeta>
            {post.author?.id ? (
              <AuthorLink to={`/autor/${post.author.id}`}>
                {post.author?.username ?? 'Autor desconhecido'}
              </AuthorLink>
            ) : (
              <span>{post.author?.username ?? 'Autor desconhecido'}</span>
            )}
          {relativeDate && <span>• {relativeDate}</span>}
          <span>• {sanitizeCounter(post.viewCount)} visualizações</span>
        </CardMeta>
      </CardHeader>

      <CardExcerpt as="div">
        <ReactMarkdown
          allowedElements={['p', 'strong', 'em', 'del', 'code', 'a', 'ul', 'ol', 'li', 'blockquote', 'br']}
          unwrapDisallowed
        >
          {post.excerpt || `${post.content?.slice(0, 180)}${post.content && post.content.length > 180 ? '...' : ''}`}
        </ReactMarkdown>
      </CardExcerpt>

      {post.tags && post.tags.length > 0 && (
        <Tags>
          {post.tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </Tags>
      )}

      <CardFooter>
        <Stats>
          <span>{likeCount} curtidas</span>
          <span>{commentCount} comentários</span>
        </Stats>

        <LikeButton
          type="button"
          onClick={() => onLike(post)}
          disabled={isProcessing}
          $liked={post.isLiked}
        >
          {isProcessing ? (
            <Spinner aria-hidden="true" />
          ) : (
            <LikeText>
              <ThumbsUpIcon />
              {post.isLiked ? 'Curtido' : 'Curtir'}
            </LikeText>
          )}
          <LikeCount>{likeCount}</LikeCount>
        </LikeButton>
      </CardFooter>
    </Card>
  );
};

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<number | null>(null);

  const featuredPost = useMemo(() => {
    if (posts.length === 0) {
      return null;
    }

    return posts.reduce((current, next) => {
      const currentLikes = sanitizeCounter(current.likeCount);
      const nextLikes = sanitizeCounter(next.likeCount);
      return nextLikes > currentLikes ? next : current;
    }, posts[0]);
  }, [posts]);

  const featuredRelativeDate = useRelativeDate(featuredPost?.createdAt);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await postService.getPosts({ limit: 20 });
      setPosts(response.posts);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não conseguimos carregar os posts agora.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectRealtime();
      return;
    }

    const socket = connectRealtime();
    if (!socket) {
      return;
    }

    // Comentário: ao conectar, garantimos que os eventos mantenham o feed atualizado sem recarregar a página.
    const unsubscribePostCreated = subscribeToEvent<{ post: Post }>('post:created', ({ post }) => {
      setPosts((current) => {
        const next = current.filter((item) => item.id !== post.id);
        return [mergePostPayload(post), ...next];
      });
    });

    const unsubscribePostUpdated = subscribeToEvent<{ post: Post }>('post:updated', ({ post }) => {
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? mergePostPayload(post, item) : item
        )
      );
    });

    const unsubscribePostDeleted = subscribeToEvent<{ postId: number }>('post:deleted', ({ postId }) => {
      setPosts((current) => current.filter((item) => item.id !== postId));
    });

    const unsubscribePostLiked = subscribeToEvent<{ postId: number; liked: boolean; userId: number }>(
      'post:likeToggled',
      ({ postId, liked, userId }) => {
        setPosts((current) =>
          current.map((item) => {
            if (item.id !== postId) {
              return item;
            }

            if (user?.id && userId === user.id) {
              return item;
            }

            const baseline = sanitizeCounter(item.likeCount);
            const likeCount = liked ? baseline + 1 : Math.max(0, baseline - 1);
            const isLiked = user?.id === userId ? liked : item.isLiked;

            return {
              ...item,
              likeCount,
              isLiked,
            };
          })
        );
      }
    );

    const unsubscribeCommentCreated = subscribeToEvent<{ comment: { postId: number } }>(
      'comment:created',
      ({ comment }) => {
        if (!comment?.postId) {
          return;
        }
        setPosts((current) =>
          current.map((item) =>
            item.id === comment.postId
              ? { ...item, commentCount: sanitizeCounter(item.commentCount) + 1 }
              : item
          )
        );
      }
    );

    const unsubscribeCommentDeleted = subscribeToEvent<{ commentId: number; postId: number }>(
      'comment:deleted',
      ({ postId }) => {
        setPosts((current) =>
          current.map((item) =>
            item.id === postId
              ? { ...item, commentCount: Math.max(0, sanitizeCounter(item.commentCount) - 1) }
              : item
          )
        );
      }
    );

    return () => {
      unsubscribePostCreated();
      unsubscribePostUpdated();
      unsubscribePostDeleted();
      unsubscribePostLiked();
      unsubscribeCommentCreated();
      unsubscribeCommentDeleted();
    };
  }, [isAuthenticated, user?.id]);

  const handleLike = useCallback(
    async (post: Post) => {
      if (!isAuthenticated) {
        toast.info('Faça login para curtir os posts.');
        return;
      }

      setLikingPostId(post.id);
      try {
        const response = await postService.likePost(post.id);
        setPosts((current) =>
          current.map((item) => {
            if (item.id !== post.id) {
              return item;
            }

            const currentCount = sanitizeCounter(item.likeCount);
            const likeCount = response.liked
              ? currentCount + 1
              : Math.max(0, currentCount - 1);

            return {
              ...item,
              likeCount,
              isLiked: response.liked,
            };
          })
        );
      } catch (err: any) {
        const message = err?.response?.data?.error ?? 'Não foi possível curtir agora.';
        toast.error(message);
      } finally {
        setLikingPostId(null);
      }
    },
    [isAuthenticated]
  );

  return (
    <PageWrapper>
      <FeedContainer>
        <HeroSection>
          <HeroContent>
            <HeroTitle>Crônicas da Taverna</HeroTitle>
            <HeroLead>
              Relatos de campanhas, diários de sessão e ideias narrativas para RPG de mesa.
            </HeroLead>
            <HeroActions>
              <HeroPrimaryButton to="/posts">Ler histórias</HeroPrimaryButton>
              <HeroSecondaryLink to={isAuthenticated ? '/create' : '/login'}>
                Publicar um relato
              </HeroSecondaryLink>
            </HeroActions>
          </HeroContent>
        </HeroSection>

        <FeedHeader>
          <FeedTitle>Últimas Crônicas</FeedTitle>
          <FeedSubtitle>Histórias recém-publicadas pela comunidade.</FeedSubtitle>
        </FeedHeader>

        {loading && (
          <LoadingState>
            <Spinner aria-hidden="true" /> Carregando histórias fresquinhas...
          </LoadingState>
        )}

        {error && !loading && <ErrorState>{error}</ErrorState>}

        {!loading && !error && posts.length === 0 && (
          <EmptyState>
            Ainda não temos posts por aqui. Volte mais tarde ou seja o primeiro a compartilhar algo!
          </EmptyState>
        )}

        {!loading && !error && posts.length > 0 && (
          <PostsGrid>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                isProcessing={likingPostId === post.id}
              />
            ))}
          </PostsGrid>
        )}

        {featuredPost && (
          <FeaturedSection>
            <FeedTitle>Crônica em Destaque</FeedTitle>
            <FeaturedCard>
              {featuredPost.imageUrl ? (
                <FeaturedImage src={featuredPost.imageUrl} alt={featuredPost.title} loading="lazy" />
              ) : null}
              <FeaturedContent>
                <FeaturedTitle to={`/post/${featuredPost.id}`}>{featuredPost.title}</FeaturedTitle>
                <FeaturedMeta>
                  {featuredPost.author?.id ? (
                    <AuthorLink to={`/autor/${featuredPost.author.id}`}>
                      {featuredPost.author?.username ?? 'Autor desconhecido'}
                    </AuthorLink>
                  ) : (
                    <span>{featuredPost.author?.username ?? 'Autor desconhecido'}</span>
                  )}
                  {featuredPost.createdAt && (
                    <span>• {featuredRelativeDate ?? 'Publicado recentemente'}</span>
                  )}
                </FeaturedMeta>
                <FeaturedExcerpt>
                  {featuredPost.excerpt || featuredPost.content?.slice(0, 240)}
                </FeaturedExcerpt>
                {featuredPost.tags && featuredPost.tags.length > 0 && (
                  <Tags>
                    {featuredPost.tags.map((tag) => (
                      <Tag key={`featured-${tag}`}>#{tag}</Tag>
                    ))}
                  </Tags>
                )}
              </FeaturedContent>
            </FeaturedCard>
          </FeaturedSection>
        )}

        <CTASection>
          <CTAHeading>Tem uma boa história de mesa?</CTAHeading>
          <CTASubtitle>
            Transforme suas sessões em crônicas e compartilhe com outros mestres.
          </CTASubtitle>
          <CTAActions>
            <CTAButton to={isAuthenticated ? '/create' : '/login'}>Publicar um relato</CTAButton>
            {!isAuthenticated && <CTAGhostButton to="/register">Criar conta</CTAGhostButton>}
          </CTAActions>
        </CTASection>

      </FeedContainer>
    </PageWrapper>
  );
};
