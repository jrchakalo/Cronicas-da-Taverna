import React from 'react';
import { render, screen } from './test-utils';
import App from './App';

test('exibe a tela de login para visitantes', async () => {
  render(<App />, { route: '/login' });

  const title = await screen.findByRole('heading', { name: /bem vindo de volta/i });
  expect(title).toBeInTheDocument();

  const submitButton = screen.getByRole('button', { name: /entrar/i });
  expect(submitButton).toBeInTheDocument();
});

test('mostra link para cadastro a partir do login', async () => {
  render(<App />, { route: '/login' });

  await screen.findByRole('heading', { name: /bem vindo de volta/i });
  const registerLink = screen.getByRole('link', { name: /cadastre-se aqui/i });
  expect(registerLink).toHaveAttribute('href', '/register');
});