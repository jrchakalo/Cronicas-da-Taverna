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

export const SobrePage: React.FC = () => {
  return (
    <PageWrapper>
      <Content>
        <Title>Sobre o Crônicas da Taverna</Title>
        <p>
          O Crônicas da Taverna é o braço editorial da comunidade Tavern of Disaster: um espaço
          para registrar campanhas, compartilhar anotações de sessão e guardar memórias de mesas
          que merecem viver para além do rolar dos dados.
        </p>
        <p>
          Aqui você encontra relatos curtos, análises de personagens, bastidores de narração e
          inspirações de mundos inteiros. Nosso compromisso é com o respeito à comunidade e a
          valorização do conteúdo criativo.
        </p>
        <p>
          Moderação ativa, curadoria humana e ferramentas de denúncia mantêm o ambiente saudável
          para todos os níveis de experiência.
        </p>
      </Content>
    </PageWrapper>
  );
};