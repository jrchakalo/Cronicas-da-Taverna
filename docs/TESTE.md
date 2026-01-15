# Tutorial completo (com comandos, passo a passo)

Este guia é para quem tem pouca experiência. **Execute os comandos exatamente na ordem.**

## 0) Pré‑requisitos (instalar tudo)

### 0.1 Instalar Homebrew (macOS)
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 0.2 Instalar Node.js 18
```
brew install node@18
echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node -v
```

### 0.3 Instalar PostgreSQL (opção local)
```
brew install postgresql@15
brew services start postgresql@15
psql --version
```

### 0.4 Instalar Docker Desktop (opcional)
1. Baixe em https://www.docker.com/products/docker-desktop/
2. Instale e abra o Docker Desktop
3. Teste:
```
docker --version
```

## 1) Clonar o repositório
```
git clone <URL_DO_SEU_REPOSITORIO>
cd tech-challenge
```

## 2) Criar banco local (PostgreSQL)

### 2.1 Criar usuário e banco (Postgres local)
```
psql postgres
```
Agora dentro do psql, rode:
```
CREATE USER admin WITH PASSWORD 'sua_senha_forte';
CREATE DATABASE tech_challenge_blog OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE tech_challenge_blog TO admin;
\q
```

### 2.2 (Alternativa) Subir Postgres com Docker
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge
cp .env.example .env
```
Edite o arquivo `.env` e configure:
```
DB_NAME=tech_challenge_blog
DB_USER=admin
DB_PASSWORD=sua_senha_forte
```
Depois rode:
```
docker compose up -d postgres
```

## 3) Criar acesso AWS + bucket S3 (obrigatório)

### 3.1 Criar usuário IAM
1. Acesse https://aws.amazon.com
2. Entre no **AWS Console**
3. Vá em **IAM → Users → Create user**
4. Nome: `tech-blog-uploader`
5. Permissões: **AmazonS3FullAccess**
6. Gere uma **Access key**
7. Salve:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### 3.2 Criar bucket
1. Vá em **S3 → Create bucket**
2. Nome único (ex.: `tech-blog-uploads-seunome`)
3. Região (ex.: `us-east-1`)
4. Salve:
   - `AWS_S3_BUCKET`
   - `AWS_REGION`

### 3.3 Tornar imagens públicas (para testes)
1. No bucket: **Permissions → Block public access**
2. Desative o bloqueio
3. Confirme que **Object Ownership** está como *Bucket owner enforced* (ACLs desativadas)
4. Em **Bucket policy**, cole (troque NOME_DO_BUCKET):
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::NOME_DO_BUCKET/*"
    }
  ]
}
```

## 4) Configurar variáveis de ambiente

### 4.1 Backend
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge
cp backend/.env.example backend/.env
```
Abra `backend/.env` e preencha:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tech_challenge_blog
DB_USER=admin
DB_PASSWORD=sua_senha_forte

JWT_SECRET=coloque_um_segredo_grande_aqui
JWT_REFRESH_SECRET=coloque_outro_segredo_grande_aqui

AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_S3_BUCKET=nome_do_bucket
AWS_REGION=us-east-1

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 4.2 Frontend
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge
cp frontend/.env.example frontend/.env.local
```
Abra `frontend/.env.local` e preencha:
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 5) Instalar dependências

### 5.1 Backend
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge/backend
npm install
```

### 5.2 Frontend
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge/frontend
npm install
```

## 6) Rodar backend
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge/backend
npm run dev
```
Teste a saúde (em outro terminal):
```
curl http://localhost:3001/health
```

## 7) Rodar frontend
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge/frontend
npm start
```
Abra no navegador:
```
http://localhost:3000
```

## 8) Testes manuais (passo a passo)

### 8.1 Cadastro e login
1. Abra o site
2. Clique em “Criar conta”
3. Cadastre um usuário
4. Faça login

### 8.2 Criar post
1. Clique em “Write”
2. Preencha título e conteúdo
3. Selecione uma imagem
4. Clique em “Publicar”
5. Verifique se a imagem abre (link do S3)

### 8.3 Curtidas
1. Clique em “Curtir”
2. Abra outra aba no mesmo post
3. Veja se o contador atualiza

### 8.4 Comentários
1. Escreva um comentário
2. Verifique se ficou pendente

### 8.5 Moderação
Abra outro terminal e rode:
```
psql postgres
```
```
UPDATE users SET role = 'moderator' WHERE email = 'seu@email.com';
\q
```
Depois no navegador:
1. Faça login de novo
2. Acesse `/moderation/comments`
3. Aprove ou rejeite comentários
4. Volte ao post e confira se os aprovados aparecem

## 9) Testes automatizados (opcional)
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge
npm run test
```

## 10) Build local (sanidade)
```
cd /Users/jrchakalo/Documents/Projetos/tech-challenge
npm run build
```

## 11) Pronto para deploy
Se tudo passou, siga [docs/DEPLOY.md](docs/DEPLOY.md).