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

export const PrivacidadePage: React.FC = () => {
  return (
    <PageWrapper>
      <Content>
        <Title>Política de Privacidade</Title>
        <p>
          Esta política descreve como coletamos e usamos dados pessoais conforme a LGPD (Lei 13.709/2018).
          Coletamos apenas informações necessárias para autenticação, personalização do perfil e segurança
          da plataforma.
        </p>
        <p>
          Dados coletados: nome/nick, email, foto de perfil, conteúdo publicado e registros técnicos
          essenciais para segurança (ex.: logs de acesso). Não vendemos nem compartilhamos seus dados
          com terceiros para fins comerciais.
        </p>
        <p>
          Seus direitos: confirmação de tratamento, acesso, correção, anonimização, exclusão e
          revogação de consentimento. Para exercer seus direitos, utilize a página de Contato.
        </p>
        <p>
          Tempo de retenção: mantemos dados enquanto a conta estiver ativa ou enquanto houver obrigação
          legal. Você pode solicitar exclusão a qualquer momento.
        </p>
        <p>
          Para dúvidas, entre em contato pela página de Contato.
        </p>
      </Content>
    </PageWrapper>
  );
};