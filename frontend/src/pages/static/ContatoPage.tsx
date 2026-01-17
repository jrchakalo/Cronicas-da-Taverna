import React from 'react';
import styled from 'styled-components';

const PageWrapper = styled.section`
  padding: 0 ${({ theme }) => theme.space[4]};
`;

const Content = styled.div`
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.7;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
`;

const Links = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};

  a {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[2]};
    padding: 8px 12px;
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid ${({ theme }) => theme.colors.gray[200]};
    background: ${({ theme }) => theme.colors.gray[50]};
    color: ${({ theme }) => theme.colors.primary[600]};
    text-decoration: none;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    transition: border-color 0.2s ease-in-out, transform 0.2s ease-in-out;

    &:hover {
      border-color: ${({ theme }) => theme.colors.primary[500]};
      transform: translateY(-1px);
    }
  }
`;

const Icon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

export const ContatoPage: React.FC = () => {
  return (
    <PageWrapper>
      <Content>
        <Title>Contato</Title>
        <p>
          Este canal é para falar diretamente com o criador do blog: sugestões de melhorias, bugs,
          parcerias e dúvidas sobre a plataforma.
        </p>
        <Links>
          <a href="https://www.instagram.com/jrch4kalo" target="_blank" rel="noreferrer">
            <Icon>
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
                className="lucide lucide-instagram"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </Icon>
            Instagram
          </a>
          <a href="https://github.com/jrchakalo" target="_blank" rel="noreferrer">
            <Icon>
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
                className="lucide lucide-github"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 0 5 0 5 0c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </Icon>
            GitHub
          </a>
        </Links>
      </Content>
    </PageWrapper>
  );
};