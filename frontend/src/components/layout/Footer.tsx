import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  margin-top: auto;
  background-color: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const FooterTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: ${({ theme }) => theme.media.md}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BrandTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const BrandDescription = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FooterLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.gray[600]};
  text-decoration: none;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
    text-decoration: underline;
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: 24px;
`;

const FooterNote = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterTop>
          <BrandBlock>
            <BrandTitle>Crônicas da Taverna</BrandTitle>
            <BrandDescription>
              Um blog narrativo para campanhas de RPG, diários de mesa e bastidores da aventura.
            </BrandDescription>
          </BrandBlock>

          <FooterLinks>
            <FooterLink to="/sobre">Sobre</FooterLink>
            <FooterLink to="/privacidade">Privacidade</FooterLink>
            <FooterLink to="/termos">Termos</FooterLink>
            <FooterLink to="/contato">Contato</FooterLink>
          </FooterLinks>
        </FooterTop>

        <FooterBottom>
          <FooterNote>
            © {new Date().getFullYear()} Crônicas da Taverna. Todos os direitos reservados.
          </FooterNote>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};