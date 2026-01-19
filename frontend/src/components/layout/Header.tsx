import React, { useState } from 'react';
import { Link, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';
import { ThemeMode, useThemeMode } from '../../hooks/useThemeMode';
import { useNotifications } from '../../hooks/useNotifications';

const HeaderContainer = styled.header<{ $mode: ThemeMode }>`
  ${({ $mode }) =>
    $mode === 'dark'
      ? `
        --nav-bg: linear-gradient(135deg, #14101f 0%, #0b0a12 100%);
        --nav-surface: #171225;
        --nav-border: rgba(255, 255, 255, 0.08);
        --nav-text: #f5f0ff;
        --nav-muted: #d6ccf5;
        --nav-hover: rgba(167, 139, 250, 0.16);
        --nav-active: rgba(167, 139, 250, 0.28);
        --nav-glow: rgba(167, 139, 250, 0.35);
      `
      : `
        --nav-bg: linear-gradient(135deg, #241a3a 0%, #1a142d 100%);
        --nav-surface: #221a37;
        --nav-border: rgba(255, 255, 255, 0.12);
        --nav-text: #f7f2ff;
        --nav-muted: #d8ccff;
        --nav-hover: rgba(167, 139, 250, 0.22);
        --nav-active: rgba(167, 139, 250, 0.32);
        --nav-glow: rgba(167, 139, 250, 0.5);
      `};
  background: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
  position: static;
  z-index: 1000;
  /* Intentional performance issue: Missing will-change property */
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: ${({ theme }) => theme.media.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Logo = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: var(--nav-text);
  text-decoration: none;
  
  &:hover {
    color: #ffffff;
    text-decoration: none;
  }
`;

const LogoMark = styled.img`
  width: 72px;
  height: 72px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.12));
`;

const NavLink = styled(RouterNavLink)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: var(--nav-text);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    background-color: var(--nav-hover);
    color: #ffffff;
  }

  &.active {
    background-color: var(--nav-active);
    color: #ffffff;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    box-shadow: 0 0 0 1px var(--nav-glow);
  }
`;

const NavGroup = styled.nav<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.media.md}) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    padding: ${({ theme }) => theme.space[3]} 0;
    border-top: 1px solid var(--nav-border);
    display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.media.md}) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.media.md}) {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background-color 0.2s ease-in-out;
  
  &:hover {
    background-color: var(--nav-hover);
  }
`;

const UserDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--nav-surface);
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid var(--nav-border);
  box-shadow: ${({ theme }) => theme.shadows.md};
  min-width: 180px;
  z-index: 1001;
  padding: ${({ theme }) => theme.space[2]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

const UserMenuLink = styled(Link)`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: var(--nav-text);
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: var(--nav-hover);
  }
`;

const ModerationButton = styled.button`
  border: 1px solid var(--nav-border);
  background: rgba(167, 139, 250, 0.18);
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: var(--nav-text);
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background: var(--nav-hover);
    border-color: var(--nav-glow);
  }
`;

const ModerationDropdown = styled(UserDropdown)`
  min-width: 220px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: var(--nav-muted);
`;

const MobileMenuButton = styled.button`
  border: 1px solid var(--nav-border);
  background: var(--nav-surface);
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: var(--nav-text);
  display: none;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: var(--nav-hover);
  }

  @media (max-width: ${({ theme }) => theme.media.md}) {
    display: inline-flex;
  }
`;

// Botão reaproveitável com "variants" simples para manter consistência visual no topo da página.
const ActionButton = styled.button<{ $variant?: 'solid' | 'ghost' }>`
  border: ${({ $variant, theme }) =>
    $variant === 'ghost' ? '1px solid transparent' : '1px solid transparent'};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;

  ${({ $variant, theme }) =>
    $variant === 'ghost'
      ? `color: var(--nav-text);
         background: transparent;
         &:hover { background: var(--nav-hover); color: #ffffff; }
        `
      : `background: ${theme.colors.primary[600]};
         color: #ffffff;
         &:hover { background: ${theme.colors.primary[700]}; color: #ffffff; }
        `};
`;

const ThemeToggle = styled.button`
  border: 1px solid var(--nav-border);
  background: var(--nav-surface);
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 6px;
  color: var(--nav-text);
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background: var(--nav-hover);
    border-color: var(--nav-glow);
  }
`;

const NotificationButton = styled.button<{ $hasUnread?: boolean }>`
  border: 1px solid var(--nav-border);
  background: var(--nav-surface);
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 6px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: var(--nav-text);
  position: relative;

  &:hover {
    background: var(--nav-hover);
  }

`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-size: 10px;
  display: grid;
  place-items: center;
  padding: 0 4px;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--nav-surface);
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid var(--nav-border);
  box-shadow: ${({ theme }) => theme.shadows.md};
  min-width: 280px;
  max-width: 320px;
  z-index: 1001;
  padding: ${({ theme }) => theme.space[2]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const NotificationItem = styled.button<{ $unread?: boolean }>`
  border: none;
  background: ${({ $unread }) => ($unread ? 'var(--nav-active)' : 'transparent')};
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  cursor: pointer;
  color: var(--nav-text);

  &:hover {
    background: var(--nav-hover);
  }
`;

const NotificationMeta = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.space[2]};
  align-items: center;
`;

const NotificationTag = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: rgba(167, 139, 250, 0.2);
  color: var(--nav-muted);
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const NotificationDelete = styled.button`
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--nav-muted);
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.red[600]};
  }
`;

const NotificationTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: var(--nav-text);
`;

const NotificationMessage = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: var(--nav-muted);
`;

const NotificationActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

const NotificationActionButton = styled.button`
  border: none;
  background: transparent;
  color: var(--nav-text);
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const { notifications, unreadCount, hasUnread, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const canModerate = user?.role === 'moderator' || user?.role === 'admin';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };
  const handleNotificationClick = async (id: number, metadata?: Record<string, any> | null) => {
    await markAsRead(id);
    if (metadata?.postId) {
      navigate(`/post/${metadata.postId}`);
      setIsNotificationOpen(false);
    }
  };

  const handleDeleteNotification = async (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    await deleteNotification(id);
  };

  const getNotificationLabel = (type?: string) => {
    switch (type) {
      case 'new_post':
        return 'Novo post';
      case 'comment_created':
        return 'Comentário no post';
      case 'comment_pending':
        return 'Comentário pendente';
      case 'comment_moderated':
        return 'Comentário moderado';
      case 'post_flagged':
        return 'Post denunciado';
      case 'comment_flagged':
        return 'Comentário denunciado';
      default:
        return 'Atualização';
    }
  };

  const handleToggleModeration = () => {
    setIsModerationOpen((prev) => !prev);
  };

  const navId = 'primary-navigation';

  return (
    <HeaderContainer $mode={mode}>
      <HeaderContent>
        <HeaderTop>
          <Logo to="/">
            <LogoMark src="/cotlogo.png" alt="Crônicas da Taverna" />
            Crônicas da Taverna
          </Logo>
          <MobileMenuButton
            type="button"
            onClick={handleToggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls={navId}
          >
            Menu
          </MobileMenuButton>
        </HeaderTop>

        <NavGroup id={navId} $isOpen={isMenuOpen}>
          <NavLinks>
            <NavLink to="/" end onClick={() => setIsMenuOpen(false)}>
              Home
            </NavLink>

            <NavLink to="/posts" onClick={() => setIsMenuOpen(false)}>
              Posts
            </NavLink>

            {isAuthenticated && (
              <NavLink to="/seguindo" onClick={() => setIsMenuOpen(false)}>
                Seguindo
              </NavLink>
            )}

            {isAuthenticated && (
              <NavLink to="/create" onClick={() => setIsMenuOpen(false)}>
                Novo Post
              </NavLink>
            )}
          </NavLinks>

          <NavActions>
            {isAuthenticated ? (
              <>
                {canModerate && (
                  <UserMenu>
                    <ModerationButton type="button" onClick={handleToggleModeration}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-gavel"
                      >
                        <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" />
                        <path d="m16 16 6-6" />
                        <path d="m21.5 10.5-8-8" />
                        <path d="m8 8 6-6" />
                        <path d="m8.5 7.5 8 8" />
                      </svg>
                      Moderação
                    </ModerationButton>
                    {isModerationOpen && (
                      <ModerationDropdown>
                        <UserMenuLink to="/moderation/posts" onClick={() => setIsModerationOpen(false)}>
                          Moderação de posts
                        </UserMenuLink>
                        <UserMenuLink to="/moderation/comments" onClick={() => setIsModerationOpen(false)}>
                          Moderação de comentários
                        </UserMenuLink>
                      </ModerationDropdown>
                    )}
                  </UserMenu>
                )}
                <UserMenu>
                  <UserButton type="button" onClick={handleToggleUserMenu}>
                    <Avatar>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
                    <UserName>{user?.username}</UserName>
                  </UserButton>
                  {isUserMenuOpen && (
                    <UserDropdown>
                      <UserMenuLink to="/profile" onClick={() => setIsUserMenuOpen(false)}>
                        Meu perfil
                      </UserMenuLink>
                      <UserMenuLink to="/me/posts" onClick={() => setIsUserMenuOpen(false)}>
                        Meus posts
                      </UserMenuLink>
                    </UserDropdown>
                  )}
                </UserMenu>

                <UserMenu>
                  <NotificationButton
                    type="button"
                    onClick={handleToggleNotifications}
                    aria-label="Ver notificações"
                    $hasUnread={hasUnread}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-bell"
                    >
                      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673A4.997 4.997 0 0 1 18 11V8a6 6 0 0 0-12 0v3a4.997 4.997 0 0 1-2.74 4.326" />
                    </svg>
                    {hasUnread && <NotificationBadge>{unreadCount}</NotificationBadge>}
                  </NotificationButton>
                  {isNotificationOpen && (
                    <NotificationDropdown>
                      <NotificationActions>
                        <span>{hasUnread ? `${unreadCount} nova(s)` : 'Tudo em dia'}</span>
                        <div>
                          {hasUnread && (
                            <NotificationActionButton type="button" onClick={markAllAsRead}>
                              Marcar todas como lidas
                            </NotificationActionButton>
                          )}
                          {notifications.length > 0 && (
                            <NotificationActionButton type="button" onClick={clearAll}>
                              Limpar todas
                            </NotificationActionButton>
                          )}
                        </div>
                      </NotificationActions>
                      {notifications.length === 0 ? (
                        <NotificationMessage>Nenhuma notificação por enquanto.</NotificationMessage>
                      ) : (
                        notifications.slice(0, 6).map((item) => (
                          <NotificationItem
                            key={item.id}
                            type="button"
                            $unread={!item.isRead}
                            onClick={() => handleNotificationClick(item.id, item.metadata ?? null)}
                          >
                            <NotificationMeta>
                              <NotificationTitle>{item.title}</NotificationTitle>
                              <NotificationTag>{getNotificationLabel(item.type)}</NotificationTag>
                              <NotificationDelete
                                type="button"
                                onClick={(event) => handleDeleteNotification(event, item.id)}
                              >
                                Excluir
                              </NotificationDelete>
                            </NotificationMeta>
                            <NotificationMessage>{item.message}</NotificationMessage>
                          </NotificationItem>
                        ))
                      )}
                    </NotificationDropdown>
                  )}
                </UserMenu>

                <ActionButton $variant="ghost" onClick={handleLogout}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-log-out"
                  >
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  </svg>
                  Sair
                </ActionButton>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setIsMenuOpen(false)}>
                  Login
                </NavLink>
                <ActionButton as={Link} to="/register" onClick={() => setIsMenuOpen(false)}>
                  Criar conta
                </ActionButton>
              </>
            )}

            <ThemeToggle type="button" onClick={toggleMode} aria-label="Alternar tema">
              {mode === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-sun-medium"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v1" />
                  <path d="M12 20v1" />
                  <path d="M3 12h1" />
                  <path d="M20 12h1" />
                  <path d="m18.364 5.636-.707.707" />
                  <path d="m6.343 17.657-.707.707" />
                  <path d="m5.636 5.636.707.707" />
                  <path d="m17.657 17.657.707.707" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-moon"
                >
                  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
                </svg>
              )}
            </ThemeToggle>
          </NavActions>
        </NavGroup>
      </HeaderContent>
    </HeaderContainer>
  );
};