import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Form, FormGroup, Label, Input, TextArea, ErrorText, FormStatus, FileInput, Spinner } from '../../components/forms';
import { CreatePostRequest } from '../../types';
import { useFileUpload } from '../../hooks/useFileUpload';
import { postService } from '../../services/postService';

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

const TwoColumn = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};

  @media (min-width: ${({ theme }) => theme.media.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Preview = styled.div`
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: ${({ theme }) => theme.space[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const PreviewImage = styled.img`
  width: 100%;
  border-radius: ${({ theme }) => theme.radii.md};
  object-fit: cover;
  max-height: 240px;
`;

const SubmitRow = styled.div`
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
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
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
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

interface CreatePostForm extends CreatePostRequest {
  tagsInput?: string;
}

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const { uploadFile, uploading, error: uploadError, uploadedFile, clearUploadedFile } = useFileUpload();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreatePostForm>();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile?.url) {
      setPreviewUrl(uploadedFile.url);
      return;
    }

    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile, uploadedFile?.url]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setUploadedImageUrl(null);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setUploadedImageUrl(null);
    clearUploadedFile();
  };

  const onSubmit = async (values: CreatePostForm) => {
    setStatus(null);

    try {
      let imageUrl = uploadedImageUrl || uploadedFile?.url || undefined;

      if (selectedFile && !uploadedFile?.url) {
        const uploadResult = await uploadFile(selectedFile);
        imageUrl = uploadResult?.url;
        setUploadedImageUrl(uploadResult?.url ?? null);
      }

      const tags = values.tagsInput
        ? values.tagsInput
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;

      const payload: CreatePostRequest = {
        title: values.title,
        content: values.content,
        excerpt: values.excerpt,
        tags,
        imageUrl,
      };

      const response = await postService.createPost(payload);
      setStatus({ type: 'success', message: 'Post publicado com sucesso!' });
      toast.success('Post publicado com sucesso!');
      reset();
      removeImage();
      navigate(`/post/${response.post.id}`);
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'Não foi possível publicar seu post agora.';
      setStatus({ type: 'error', message });
      toast.error(message);
    }
  };

  return (
    <PageWrapper>
      <Content>
        <Header>
          <Title>Novo post</Title>
          <Subtitle>Compartilhe suas ideias e inspire outras pessoas.</Subtitle>
        </Header>

        {status && (
          <FormStatus $variant={status.type} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.message}
          </FormStatus>
        )}

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormGroup>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Um título objetivo e claro"
              hasError={!!errors.title}
              aria-invalid={!!errors.title}
              {...register('title', {
                required: 'O título é obrigatório',
                maxLength: {
                  value: 255,
                  message: 'Use no máximo 255 caracteres',
                },
              })}
            />
            {errors.title && <ErrorText>{errors.title.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="excerpt">Resumo</Label>
            <TextArea
              id="excerpt"
              placeholder="Uma prévia rápida do conteúdo"
              hasError={!!errors.excerpt}
              {...register('excerpt', {
                maxLength: {
                  value: 500,
                  message: 'Use no máximo 500 caracteres',
                },
              })}
            />
            {errors.excerpt && <ErrorText>{errors.excerpt.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="content">Conteúdo</Label>
            <TextArea
              id="content"
              placeholder="Escreva seu post em markdown"
              hasError={!!errors.content}
              {...register('content', {
                required: 'O conteúdo é obrigatório',
                minLength: {
                  value: 20,
                  message: 'O conteúdo deve ter pelo menos 20 caracteres',
                },
              })}
            />
            {errors.content && <ErrorText>{errors.content.message}</ErrorText>}
          </FormGroup>

          <TwoColumn>
            <FormGroup>
              <Label htmlFor="tagsInput">Tags</Label>
              <Input
                id="tagsInput"
                placeholder="ex: react, backend, aws"
                {...register('tagsInput')}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="image">Imagem de capa</Label>
              <FileInput id="image" accept="image/*" onChange={handleFileChange} />
            </FormGroup>
          </TwoColumn>

          {(previewUrl || uploadError) && (
            <Preview>
              {previewUrl && <PreviewImage src={previewUrl} alt="Preview da capa" />}
              {uploadError && <ErrorText>{uploadError}</ErrorText>}
              {selectedFile && (
                <GhostButton type="button" onClick={removeImage}>
                  Remover imagem
                </GhostButton>
              )}
            </Preview>
          )}

          <SubmitRow>
            <PrimaryButton type="submit" disabled={isSubmitting || uploading}>
              {(isSubmitting || uploading) && <Spinner aria-hidden="true" />}
              {uploading ? 'Enviando imagem...' : isSubmitting ? 'Publicando...' : 'Publicar'}
            </PrimaryButton>
            <GhostButton type="button" onClick={() => navigate(-1)}>
              Cancelar
            </GhostButton>
          </SubmitRow>
        </Form>
      </Content>
    </PageWrapper>
  );
};