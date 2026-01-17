import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { postService } from '../../services/postService';
import { Post } from '../../types';
import { Form, FormGroup, Input, Label, Select, ErrorText, Spinner } from '../../components/forms';

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

const FilterCard = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.space[5]};
  display: grid;
  gap: ${({ theme }) => theme.space[5]};
`;

const FiltersRow = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[5]};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  align-items: center;
  margin-top: ${({ theme }) => theme.space[2]};
`;

const FiltersForm = styled(Form)`
  gap: ${({ theme }) => theme.space[5]};
`;

const FilterGroup = styled(FormGroup)`
  gap: ${({ theme }) => theme.space[3]};
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const GhostButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[700]};
  cursor: pointer;
  transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
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
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
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

const LoadingState = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.space[2]};
  align-items: center;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

interface FiltersState {
  search: string;
  tag: string;
  category: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'dicas', label: 'Dicas' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'personagens', label: 'Personagens' },
  { value: 'regras', label: 'Regras' },
];

export const PostsPage: React.FC = () => {
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    tag: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ totalPages: number; totalItems: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tagsList = [filters.tag, filters.category].filter(Boolean);
      const response = await postService.getPosts({
        page,
        limit: 12,
        search: filters.search || undefined,
        tags: tagsList.length > 0 ? tagsList : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setPosts(response.posts);
      setPagination({ totalPages: response.pagination.totalPages, totalItems: response.pagination.totalItems });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Não foi possível carregar os posts.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleChange = (field: keyof FiltersState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleClear = () => {
    setFilters({ search: '', tag: '', category: '', sortBy: 'createdAt', sortOrder: 'DESC' });
    setPage(1);
  };

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Todos os posts</Title>
          <Subtitle>Encontre crônicas, dicas e histórias por tema ou palavra-chave.</Subtitle>
        </Header>

        <FilterCard>
          <FiltersForm onSubmit={handleApply}>
            <FiltersRow>
              <FilterGroup>
                <Label htmlFor="search">Pesquisar</Label>
                <Input id="search" placeholder="Busque por título, trecho ou autor" value={filters.search} onChange={handleChange('search')} />
              </FilterGroup>
              <FilterGroup>
                <Label htmlFor="tag">Tag</Label>
                <Input id="tag" placeholder="ex.: narrativa, dungeon" value={filters.tag} onChange={handleChange('tag')} />
              </FilterGroup>
              <FilterGroup>
                <Label htmlFor="category">Categoria</Label>
                <Select id="category" value={filters.category} onChange={handleChange('category')}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FilterGroup>
              <FilterGroup>
                <Label htmlFor="sort">Ordenar por</Label>
                <Select id="sort" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split(':');
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' }));
                }}>
                  <option value="createdAt:DESC">Mais recentes</option>
                  <option value="createdAt:ASC">Mais antigos</option>
                  <option value="viewCount:DESC">Mais vistos</option>
                </Select>
              </FilterGroup>
            </FiltersRow>
            <ActionRow>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Filtrando...' : 'Aplicar filtros'}
              </PrimaryButton>
              <GhostButton type="button" onClick={handleClear}>
                Limpar
              </GhostButton>
              {loading && (
                <LoadingState>
                  <Spinner aria-hidden="true" /> Atualizando lista...
                </LoadingState>
              )}
            </ActionRow>
          </FiltersForm>
          {error && <ErrorText>{error}</ErrorText>}
        </FilterCard>

        {error && <ErrorState>{error}</ErrorState>}

        {!loading && !error && posts.length === 0 && (
          <EmptyState>Nenhum post encontrado com esses filtros.</EmptyState>
        )}

        {!error && posts.length > 0 && (
          <PostsGrid>
            {posts.map((post) => (
              <Card key={post.id}>
                <CardTitle to={`/post/${post.id}`}>{post.title}</CardTitle>
                <CardMeta>
                  {post.author?.id ? (
                    <AuthorLink to={`/autor/${post.author.id}`}>
                      {post.author?.username ?? 'Autor desconhecido'}
                    </AuthorLink>
                  ) : (
                    <span>{post.author?.username ?? 'Autor desconhecido'}</span>
                  )}
                  <span>• {post.viewCount} visualizações</span>
                </CardMeta>
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

        {pagination && pagination.totalPages > 1 && (
          <Pagination>
            <GhostButton type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Página anterior
            </GhostButton>
            <span>
              Página {page} de {pagination.totalPages}
            </span>
            <GhostButton type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((prev) => prev + 1)}>
              Próxima página
            </GhostButton>
          </Pagination>
        )}
      </Content>
    </PageWrapper>
  );
};
