import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { postService } from '../../services/postService';
import { ReportedPostEntry } from '../../types';
import { Spinner } from '../../components/forms';

const PageWrapper = styled.section`
  padding: 0 ${({ theme }) => theme.space[4]};
`;

const Content = styled.div`
  max-width: 1040px;
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
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const Card = styled.article`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[5]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const CardTitle = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
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
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const DangerButton = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.red[600]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.red[700]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  padding: ${({ theme }) => theme.space[8]} 0;
`;

export const PostModerationPage: React.FC = () => {
  const [reports, setReports] = useState<ReportedPostEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await postService.getReportedPosts();
      setReports(response.reports ?? []);
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'Não foi possível carregar as denúncias.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleHide = async (postId: number) => {
    setActingId(postId);
    try {
      const response = await postService.hidePost(postId);
      toast.success(response.message);
      setReports((current) => current.filter((item) => item.postId !== postId));
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'Não foi possível tirar o post do ar.';
      toast.error(message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Denúncias de posts</Title>
          <Subtitle>Revise posts denunciados pela comunidade.</Subtitle>
        </Header>

        {loading && (
          <LoadingState>
            <Spinner aria-hidden="true" /> Carregando denúncias...
          </LoadingState>
        )}

        {!loading && reports.length === 0 && (
          <EmptyState>Nenhum post denunciado no momento.</EmptyState>
        )}

        {reports.map((entry) => (
          <Card key={entry.postId}>
            <CardTitle to={`/post/${entry.postId}`}>{entry.post?.title ?? 'Post'}</CardTitle>
            <CardMeta>
              <span>Autor: {entry.post?.author?.username ?? 'Desconhecido'}</span>
              <span>• {entry.reportCount} denúncia(s)</span>
            </CardMeta>
            <ActionRow>
              <DangerButton
                type="button"
                onClick={() => handleHide(entry.postId)}
                disabled={actingId === entry.postId}
              >
                {actingId === entry.postId ? 'Removendo...' : 'Tirar do ar'}
              </DangerButton>
            </ActionRow>
          </Card>
        ))}
      </Content>
    </PageWrapper>
  );
};
