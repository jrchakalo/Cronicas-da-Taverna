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

export const TermosPage: React.FC = () => {
  return (
    <PageWrapper>
      <Content>
        <Title>Termos de Uso</Title>
        <p>
          Ao usar o Crônicas da Taverna, você concorda em respeitar a comunidade, evitar conteúdo ofensivo
          e seguir as decisões de moderação.
        </p>
        <p>
          Não permitimos: discursos de ódio, assédio, doxxing, conteúdo sexual explícito ou ilegal.
          Conteúdos que violem as regras podem ser removidos a qualquer momento.
        </p>
        <p>
          Comentários e posts podem passar por moderação automática e humana. Ao publicar, você autoriza
          que o conteúdo seja revisado para garantir a segurança da comunidade.
        </p>
      </Content>
    </PageWrapper>
  );
};