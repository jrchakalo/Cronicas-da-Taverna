import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';

import { Comment, Post } from '../../types';
import { postService } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import { useComments } from '../../hooks/useComments';
import { Form, FormGroup, TextArea, Label, ErrorText, Spinner } from '../../components/forms';
import { connectRealtime, subscribeToEvent } from '../../services/realtime';

const PageWrapper = styled.section`
  padding: 48px 16px 80px;
`;

const Content = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.gray[600]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const CoverImage = styled.img`
  width: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  object-fit: cover;
  max-height: 360px;
`;

const MarkdownContent = styled.div`
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.7;

  h2 {
    margin-top: ${({ theme }) => theme.space[6]};
  }

  pre {
    border-radius: ${({ theme }) => theme.radii.md};
    overflow: hidden;
  }

  code {
    font-family: ${({ theme }) => theme.fonts.mono};
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
`;

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const LikeButton = styled.button<{ $liked?: boolean }>`
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 8px 16px;
  background: ${({ theme, $liked }) =>
    $liked ? theme.colors.primary[100] : theme.colors.gray[100]};
  color: ${({ theme, $liked }) =>
    $liked ? theme.colors.primary[700] : theme.colors.gray[700]};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme, $liked }) =>
      $liked ? theme.colors.primary[500] : theme.colors.gray[200]};
    color: ${({ theme, $liked }) => ($liked ? '#ffffff' : theme.colors.gray[700])};
  }
`;

const CommentsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const CommentCard = styled.article`
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[4]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const CommentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const CommentContent = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.6;
`;

const ReplyList = styled.div`
  border-left: 2px solid ${({ theme }) => theme.colors.gray[100]};
  margin-left: ${({ theme }) => theme.space[4]};
  padding-left: ${({ theme }) => theme.space[3]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const SubmitButton = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 18px;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  padding: ${({ theme }) => theme.space[8]} 0;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ErrorState = styled.div`
  color: ${({ theme }) => theme.colors.red[500]};
`;

const formatDate = (value?: string) => {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return null;
  }
};

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      return (
        <SyntaxHighlighter style={tomorrow} language={match[1]} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export const PostDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentValue, setCommentValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const postId = Number(id);
  const { comments, loading: loadingComments, error: commentsError, addComment } = useComments(
    Number.isNaN(postId) ? null : postId
  );

  const fetchPost = useCallback(async () => {
    if (!postId || Number.isNaN(postId)) {
      setError('Post inválido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await postService.getPostById(postId);
      setPost(response.post);
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível carregar o post.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const socket = connectRealtime();
    if (!socket) {
      return;
    }

    const unsubscribeCommentCreated = subscribeToEvent<{ comment: Comment }>('comment:created', ({ comment }) => {
      if (comment?.postId !== postId) {
        return;
      }

      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: (current.commentCount ?? 0) + 1,
            }
          : current
      );
    });

    return () => {
      unsubscribeCommentCreated();
    };
  }, [isAuthenticated, postId]);

  const handleLike = async () => {
    if (!post) {
      return;
    }

    if (!isAuthenticated) {
      toast.info('Faça login para curtir este post.');
      return;
    }

    try {
      const response = await postService.likePost(post.id);
      const nextLiked = response.liked;
      const currentLikes = post.likeCount ?? 0;
      setPost({
        ...post,
        isLiked: nextLiked,
        likeCount: nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
      });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível atualizar a curtida.';
      toast.error(message);
    }
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!commentValue.trim()) {
      return;
    }

    if (!isAuthenticated) {
      toast.info('Entre para comentar.');
      return;
    }

    setSubmitting(true);
    try {
      await addComment(commentValue.trim());
      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: (current.commentCount ?? 0) + 1,
            }
          : current
      );
      setCommentValue('');
      toast.success('Comentário enviado! Ele será exibido após moderação.');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível enviar seu comentário.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = useMemo(() => formatDate(post?.createdAt), [post?.createdAt]);

  if (loading) {
    return (
      <PageWrapper>
        <Content>
          <LoadingState>
            <Spinner aria-hidden="true" />
            Carregando post...
          </LoadingState>
        </Content>
      </PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <PageWrapper>
        <Content>
          <ErrorState>{error ?? 'Post não encontrado.'}</ErrorState>
          <SubmitButton type="button" onClick={() => navigate('/')}>Voltar ao feed</SubmitButton>
        </Content>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Content>
        <BackLink to="/">← Voltar ao feed</BackLink>

        <Header>
          <Title>{post.title}</Title>
          <Meta>
            <span>Por {post.author?.username ?? 'Autor desconhecido'}</span>
            {formattedDate && <span>• {formattedDate}</span>}
            <span>• {post.viewCount} visualizações</span>
          </Meta>
        </Header>

        {post.imageUrl && <CoverImage src={post.imageUrl} alt={post.title} />}

        {post.tags && post.tags.length > 0 && (
          <TagRow>
            {post.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </TagRow>
        )}

        <MarkdownContent>
          <ReactMarkdown components={markdownComponents}>
            {post.content}
          </ReactMarkdown>
        </MarkdownContent>

        <ActionsRow>
          <LikeButton type="button" onClick={handleLike} $liked={post.isLiked}>
            {post.isLiked ? 'Amei' : 'Curtir'} • {post.likeCount ?? 0}
          </LikeButton>
        </ActionsRow>

        <CommentsSection>
          <Header>
            <Title>Comentários</Title>
            <Meta>{post.commentCount ?? comments.length} comentários</Meta>
          </Header>

          <Form onSubmit={handleSubmitComment}>
            <FormGroup>
              <Label htmlFor="comment">Adicionar comentário</Label>
              <TextArea
                id="comment"
                value={commentValue}
                onChange={(event) => setCommentValue(event.target.value)}
                placeholder={
                  isAuthenticated
                    ? 'Escreva seu comentário...'
                    : 'Faça login para comentar'
                }
                disabled={!isAuthenticated}
              />
            </FormGroup>
            <SubmitButton type="submit" disabled={!isAuthenticated || submitting}>
              {submitting && <Spinner aria-hidden="true" />}
              {submitting ? 'Enviando...' : 'Enviar comentário'}
            </SubmitButton>
            {!isAuthenticated && <ErrorText>Você precisa estar logado para comentar.</ErrorText>}
          </Form>

          {loadingComments && (
            <LoadingState>
              <Spinner aria-hidden="true" />
              Carregando comentários...
            </LoadingState>
          )}

          {commentsError && <ErrorState>{commentsError}</ErrorState>}

          {!loadingComments && comments.length === 0 && (
            <EmptyState>Seja o primeiro a comentar.</EmptyState>
          )}

          {comments.map((comment) => (
            <CommentCard key={comment.id}>
              <CommentMeta>
                <span>{comment.author?.username ?? 'Usuário'}</span>
                {formatDate(comment.createdAt) && <span>• {formatDate(comment.createdAt)}</span>}
                <span>• {comment.status}</span>
              </CommentMeta>
              <CommentContent>{comment.content}</CommentContent>

              {comment.replies && comment.replies.length > 0 && (
                <ReplyList>
                  {comment.replies.map((reply) => (
                    <CommentCard key={reply.id}>
                      <CommentMeta>
                        <span>{reply.author?.username ?? 'Usuário'}</span>
                        {formatDate(reply.createdAt) && (
                          <span>• {formatDate(reply.createdAt)}</span>
                        )}
                        <span>• {reply.status}</span>
                      </CommentMeta>
                      <CommentContent>{reply.content}</CommentContent>
                    </CommentCard>
                  ))}
                </ReplyList>
              )}
            </CommentCard>
          ))}
        </CommentsSection>
      </Content>
    </PageWrapper>
  );
};