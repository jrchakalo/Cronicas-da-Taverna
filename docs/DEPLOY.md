# Deploy (Render + Vercel)

Este guia publica o backend no **Render** e o frontend no **Vercel**, mantendo Socket.IO funcional.

## 1) Backend no Render

### 1.1 Criar banco PostgreSQL
1. Crie um PostgreSQL no Render.
2. Copie a `DATABASE_URL` gerada.

### 1.2 Criar Web Service
1. Render → **New Web Service** → conecte o repositório.
2. **Root Directory**: `backend`
3. **Build Command**:
   ```
   npm install && npm run build
   ```
4. **Start Command**:
   ```
   npm run start
   ```
5. Configure as variáveis de ambiente:

**Obrigatórias:**
- `NODE_ENV=production`
- `DATABASE_URL=<sua_url_do_render>`
- `JWT_SECRET=<segredo_forte_32+>`
- `JWT_REFRESH_SECRET=<segredo_forte_32+_diferente>`
- `AWS_ACCESS_KEY_ID=<sua_key>`
- `AWS_SECRET_ACCESS_KEY=<sua_secret>`
- `AWS_S3_BUCKET=<seu_bucket>`
- `AWS_REGION=<sua_regiao>`
- `CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app`

**Opcional:**
- `JWT_EXPIRES_IN=7d`
- `JWT_REFRESH_EXPIRES_IN=30d`

### 1.3 Healthcheck
O backend expõe `GET /health`.

## 2) Frontend no Vercel

1. Vercel → **New Project** → selecione o repositório.
2. **Root Directory**: `frontend`
3. Framework preset: **Create React App**
4. Variáveis de ambiente:
- `REACT_APP_API_URL=https://seu-backend.onrender.com/api`
- `REACT_APP_SOCKET_URL=https://seu-backend.onrender.com`

## 3) CORS e Realtime
O Socket.IO usa o mesmo domínio do backend. Certifique-se de incluir a URL do Vercel em `CORS_ALLOWED_ORIGINS`.

## 4) S3 (obrigatório)
O upload usa S3 real. Garanta que o bucket permita leitura pública **ou** configure o frontend para usar URLs assinadas.

## 5) Checklist final
- [ ] Backend on Render funcionando
- [ ] Frontend no Vercel consumindo `/api`
- [ ] Login/registro ok
- [ ] Upload de imagem ok
- [ ] Realtime ok