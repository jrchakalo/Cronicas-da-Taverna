import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Form, FormGroup, Label, Input, TextArea, ErrorText, FormStatus, FileInput, Spinner } from '../../components/forms';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { ChangePasswordRequest } from '../../types';
import { useFileUpload } from '../../hooks/useFileUpload';

const PageWrapper = styled.section`
  padding: 48px 16px 80px;
`;

const Content = styled.div`
  max-width: 880px;
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

const Card = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const AvatarPreview = styled.img`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.full};
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
`;

const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`;

const TwoColumn = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ReadonlyField = styled.div`
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-size: ${({ theme }) => theme.fontSizes.base};
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

interface ProfileForm {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
}

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { uploadFile, uploading, error: uploadError, uploadedFile, clearUploadedFile } = useFileUpload();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileForm>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
    reset: resetPassword,
  } = useForm<ChangePasswordRequest>();

  useEffect(() => {
    reset({
      username: user?.username ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      avatar: user?.avatar ?? '',
      bio: user?.bio ?? '',
    });
    setAvatarPreview(user?.avatar ?? null);
  }, [user, reset]);

  useEffect(() => {
    if (uploadedFile?.url) {
      setAvatarPreview(uploadedFile.url);
      return;
    }

    if (!selectedAvatar) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedAvatar, uploadedFile?.url]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedAvatar(file);
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(null);
    clearUploadedFile();
    setAvatarPreview(user?.avatar ?? null);
  };

  const onSubmit = async (values: ProfileForm) => {
    setStatus(null);
    try {
      let avatarUrl = values.avatar;

      if (selectedAvatar && !uploadedFile?.url) {
        const uploadResult = await uploadFile(selectedAvatar);
        avatarUrl = uploadResult?.url;
      }

      await updateProfile({
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        bio: values.bio,
        avatar: avatarUrl,
      });
      setStatus({ type: 'success', message: 'Perfil atualizado com sucesso.' });
      toast.success('Perfil atualizado com sucesso.');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Não foi possível atualizar o perfil.';
      setStatus({ type: 'error', message });
      toast.error(message);
    }
  };

  const onChangePassword = async (values: ChangePasswordRequest) => {
    setPasswordStatus(null);
    try {
      await authService.changePassword(values);
      setPasswordStatus({ type: 'success', message: 'Senha atualizada com sucesso.' });
      toast.success('Senha atualizada com sucesso.');
      resetPassword();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.response?.data?.error ?? 'Não foi possível atualizar a senha.';
      setPasswordStatus({ type: 'error', message });
      toast.error(message);
    }
  };

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Meu perfil</Title>
          <Subtitle>Atualize seus dados e mantenha sua conta segura.</Subtitle>
        </Header>

        <Card>
          <h2>Dados básicos</h2>
          {status && (
            <FormStatus $variant={status.type} role={status.type === 'error' ? 'alert' : 'status'}>
              {status.message}
            </FormStatus>
          )}
          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormGroup>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                placeholder="Seu nome público"
                hasError={!!errors.username}
                {...register('username', {
                  required: 'Informe um nome de usuário',
                  minLength: { value: 3, message: 'Use no mínimo 3 caracteres' },
                  maxLength: { value: 50, message: 'Use no máximo 50 caracteres' },
                  pattern: { value: /^[a-zA-Z0-9._-]+$/, message: 'Use apenas letras, números e ._-' },
                })}
              />
              {errors.username && <ErrorText>{errors.username.message}</ErrorText>}
            </FormGroup>

            <TwoColumn>
              <FormGroup>
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" placeholder="Seu nome" hasError={!!errors.firstName} {...register('firstName', {
                  maxLength: { value: 100, message: 'Use no máximo 100 caracteres' },
                })} />
                {errors.firstName && <ErrorText>{errors.firstName.message}</ErrorText>}
              </FormGroup>
              <FormGroup>
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" placeholder="Seu sobrenome" hasError={!!errors.lastName} {...register('lastName', {
                  maxLength: { value: 100, message: 'Use no máximo 100 caracteres' },
                })} />
                {errors.lastName && <ErrorText>{errors.lastName.message}</ErrorText>}
              </FormGroup>
            </TwoColumn>

            <FormGroup>
              <Label htmlFor="avatar">Foto do perfil</Label>
              <AvatarRow>
                {avatarPreview ? (
                  <AvatarPreview src={avatarPreview} alt="Foto de perfil" />
                ) : (
                  <ReadonlyField>Sem foto</ReadonlyField>
                )}
                <div>
                  <FileInput id="avatar" onChange={handleAvatarChange} />
                  {uploadError && <ErrorText>{uploadError}</ErrorText>}
                </div>
              </AvatarRow>
              {selectedAvatar && (
                <ActionRow>
                  <PrimaryButton type="button" onClick={handleRemoveAvatar}>
                    Remover foto selecionada
                  </PrimaryButton>
                </ActionRow>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="bio">Bio</Label>
              <TextArea
                id="bio"
                placeholder="Conte um pouco sobre você"
                hasError={!!errors.bio}
                {...register('bio', {
                  maxLength: { value: 500, message: 'Use no máximo 500 caracteres' },
                })}
              />
              {errors.bio && <ErrorText>{errors.bio.message}</ErrorText>}
            </FormGroup>

            <TwoColumn>
              <FormGroup>
                <Label>Email</Label>
                <ReadonlyField>{user?.email ?? '-'}</ReadonlyField>
              </FormGroup>
            </TwoColumn>

            <ActionRow>
              <PrimaryButton type="submit" disabled={isSubmitting || uploading}>
                {isSubmitting || uploading ? (
                  <>
                    <Spinner aria-hidden="true" /> Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </PrimaryButton>
            </ActionRow>
          </Form>
        </Card>

        <Card>
          <h2>Segurança</h2>
          {passwordStatus && (
            <FormStatus $variant={passwordStatus.type} role={passwordStatus.type === 'error' ? 'alert' : 'status'}>
              {passwordStatus.message}
            </FormStatus>
          )}
          <Form onSubmit={handleSubmitPassword(onChangePassword)} noValidate>
            <TwoColumn>
              <FormGroup>
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  hasError={!!passwordErrors.currentPassword}
                  {...registerPassword('currentPassword', {
                    required: 'Informe sua senha atual',
                    minLength: { value: 6, message: 'Mínimo de 6 caracteres' },
                  })}
                />
                {passwordErrors.currentPassword && <ErrorText>{passwordErrors.currentPassword.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  hasError={!!passwordErrors.newPassword}
                  {...registerPassword('newPassword', {
                    required: 'Informe a nova senha',
                    minLength: { value: 8, message: 'Mínimo de 8 caracteres' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Use letras e números' },
                  })}
                />
                {passwordErrors.newPassword && <ErrorText>{passwordErrors.newPassword.message}</ErrorText>}
              </FormGroup>
            </TwoColumn>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                hasError={!!passwordErrors.confirmPassword}
                {...registerPassword('confirmPassword', {
                  required: 'Confirme a nova senha',
                })}
              />
              {passwordErrors.confirmPassword && <ErrorText>{passwordErrors.confirmPassword.message}</ErrorText>}
            </FormGroup>

            <ActionRow>
              <PrimaryButton type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Atualizando...' : 'Atualizar senha'}
              </PrimaryButton>
            </ActionRow>
          </Form>
        </Card>
      </Content>
    </PageWrapper>
  );
};
