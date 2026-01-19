# Deploy (Render + Vercel)

Este guia detalha o processo completo de publicação do backend no **Render** e frontend no **Vercel**, com Socket.IO funcional e CI/CD integrado.

---

## Pré-requisitos

Antes de iniciar o deploy, certifique-se de ter:

- [ ] Conta no [Render](https://render.com) (plano gratuito disponível)
- [ ] Conta no [Vercel](https://vercel.com) (plano gratuito disponível)
- [ ] Conta AWS com acesso ao S3
- [ ] Repositório GitHub com o código
- [ ] Secrets JWT gerados (mínimo 32 caracteres cada)

### Gerando Secrets Seguros

```bash
# No terminal, gere secrets fortes:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Execute 2x para JWT_SECRET e JWT_REFRESH_SECRET
```

---

## 1) Backend no Render

### 1.1 Criar banco PostgreSQL

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configurações:
   - **Name**: `cronicas-taverna-db` (ou nome de sua preferência)
   - **Database**: `tech_challenge_blog`
   - **User**: deixe o padrão ou escolha um nome
   - **Region**: escolha a região mais próxima
   - **PostgreSQL Version**: 15 ou superior
   - **Plan**: Free (512 MB RAM, expira em 90 dias) ou Starter (7 USD/mês)
4. Clique em **"Create Database"**
5. Aguarde a criação (1-2 minutos)
6. Na página do banco, copie:
   - **Internal Database URL** (se backend e DB na mesma região)
   - **External Database URL** (se precisar acessar de fora)
   - Você vai usar a **Internal Database URL** para o backend

### 1.2 Configurar AWS S3

1. Acesse [AWS Console](https://console.aws.amazon.com/s3/)
2. Crie um novo bucket:
   - **Bucket name**: `cronicas-taverna-uploads` (deve ser único globalmente)
   - **Region**: mesma região do backend (recomendado)
   - **Block Public Access**: desmarque se quiser URLs públicas, ou mantenha e use URLs assinadas
   - **Versioning**: opcional
3. Configure permissões (opcional para desenvolvimento):
   - Vá em **Permissions** → **Bucket Policy**
   - Para permitir leitura pública:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::cronicas-taverna-uploads/*"
       }
     ]
   }
   ```
4. Crie credenciais IAM:
   - Vá em **IAM** → **Users** → **Add user**
   - Nome: `cronicas-taverna-s3-user`
   - Attach policy: `AmazonS3FullAccess` ou crie uma policy customizada
   - Salve `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`

### 1.3 Criar Web Service no Render

1. Render Dashboard → **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configurações do serviço:

   **Basic Settings:**
   - **Name**: `cronicas-taverna-backend`
   - **Region**: mesma do banco de dados
   - **Branch**: `main` (ou `master`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command** (⚠️ IMPORTANTE - deve compilar o TypeScript):
     ```bash
     npm install --include=dev && npm run build
     ```
     > **Nota crítica:** Use `--include=dev` para instalar devDependencies (necessário para @types/* e TypeScript). Se você vir erros como `Could not find a declaration file for module 'express'`, significa que os tipos não foram instalados.
   
   - **Start Command**:
     ```bash
     npm run start
     ```
     ou simplesmente:
     ```bash
     node dist/index.js
     ```

4. **Advanced Settings:**
   - **Pre-Deploy Command** (executa migrations antes do deploy):
     ```bash
     npm run migrate
     ```
     > **Nota:** Este comando roda APÓS o build e ANTES de iniciar o servidor. É onde as migrations do banco são executadas.
   
   - **Auto-Deploy**: ✓ Yes (deploy automático quando houver push no `main`)

5. **Environment Variables** - Clique em "Add Environment Variable" e adicione:

   **Obrigatórias:**
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<cole_a_Internal_Database_URL_aqui>
   
   # JWT - Use os secrets gerados anteriormente
   JWT_SECRET=<seu_secret_64_caracteres>
   JWT_REFRESH_SECRET=<outro_secret_64_caracteres_diferente>
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   
   # AWS S3
   AWS_ACCESS_KEY_ID=<sua_aws_access_key>
   AWS_SECRET_ACCESS_KEY=<sua_aws_secret_key>
   AWS_S3_BUCKET=cronicas-taverna-uploads
   AWS_REGION=us-east-1
   
   # CORS - Importante! Atualize depois com a URL do Vercel
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   
   # Upload
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif
   
   # Security
   BCRYPT_SALT_ROUNDS=12
   PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=30
   ```

6. Clique em **"Create Web Service"**
7. Aguarde o deploy (3-5 minutos na primeira vez)
8. Após o deploy, copie a URL gerada (ex: `https://cronicas-taverna-backend.onrender.com`)

### 1.4 Testar o Backend

```bash
# Healthcheck
curl https://cronicas-taverna-backend.onrender.com/health

# Resposta esperada:
# {"status":"ok","timestamp":"..."}

# Testar registro
curl -X POST https://cronicas-taverna-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"Senha123!","username":"testuser"}'
```

### 1.5 Verificar Logs

No Render Dashboard:
1. Acesse seu Web Service
2. Clique na aba **"Logs"**
3. Verifique se há erros
4. Confirme que as migrations foram executadas

---

## 2) Frontend no Vercel

### 2.1 Criar Projeto no Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..."** → **"Project"**
3. Importe seu repositório do GitHub
4. Configurações do projeto:

   **Build Settings:**
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (preenchido automaticamente)
   - **Output Directory**: `build` (preenchido automaticamente)
   - **Install Command**: `npm install` (preenchido automaticamente)

### 2.2 Configurar Variáveis de Ambiente

Na página de configuração do projeto, vá em **"Environment Variables"**:

```env
# Substitua pela URL real do seu backend no Render
REACT_APP_API_URL=https://cronicas-taverna-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://cronicas-taverna-backend.onrender.com
```

**Importante:** Aplique estas variáveis para todos os ambientes:
- ✓ Production
- ✓ Preview
- ✓ Development

### 2.3 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Após o deploy, copie a URL gerada (ex: `https://cronicas-taverna.vercel.app`)

### 2.4 Atualizar CORS no Backend

**IMPORTANTE:** Agora que você tem a URL do Vercel, volte ao Render e atualize o backend:

1. Render Dashboard → Seu Web Service → **"Environment"**
2. Edite `CORS_ALLOWED_ORIGINS`:
   ```env
   CORS_ALLOWED_ORIGINS=https://cronicas-taverna.vercel.app
   ```
   Se tiver múltiplas origens (ex: staging + produção):
   ```env
   CORS_ALLOWED_ORIGINS=https://cronicas-taverna.vercel.app,https://staging.cronicas-taverna.vercel.app
   ```
3. Salve e aguarde o redeploy automático

### 2.5 Testar o Frontend

1. Acesse `https://cronicas-taverna.vercel.app`
2. Tente fazer login/registro
3. Teste upload de imagem
4. Verifique se notificações em tempo real funcionam

---

## 3) CORS e Socket.IO

### Como funciona

O Socket.IO usa o mesmo domínio do backend (`wss://seu-backend.onrender.com`). O frontend se conecta via:

```javascript
io('https://cronicas-taverna-backend.onrender.com', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
})
```

### Solução de Problemas CORS

Se encontrar erros de CORS:

1. Verifique se `CORS_ALLOWED_ORIGINS` no backend inclui a URL do Vercel **exata**
2. Não adicione trailing slash: ❌ `https://app.vercel.app/` ✓ `https://app.vercel.app`
3. Verifique os logs do Render para ver requisições bloqueadas
4. Teste com cURL para isolar o problema:
   ```bash
   curl -H "Origin: https://cronicas-taverna.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://cronicas-taverna-backend.onrender.com/api/auth/login -i
   ```

---

## 4) S3 e Upload de Arquivos

### Configuração para Produção

**Opção 1: Bucket Público (mais simples)**
- Configure o bucket como público (veja seção 1.2)
- URLs dos uploads serão públicas: `https://bucket.s3.region.amazonaws.com/uploads/file.jpg`

**Opção 2: Bucket Privado com URLs Assinadas (mais seguro)**
- Mantenha o bucket privado
- O backend gera URLs assinadas temporárias
- Código já implementado em `backend/src/utils/s3.ts`

### Teste de Upload

```bash
# Faça login e pegue o token
TOKEN="seu_token_aqui"

# Teste upload
curl -X POST https://cronicas-taverna-backend.onrender.com/api/upload/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/caminho/para/imagem.jpg"

# Resposta esperada:
# {"url":"https://bucket.s3.amazonaws.com/uploads/..."}
```

---

## 5) CI/CD com GitHub Actions

O pipeline está configurado em `.github/workflows/ci.yml` e executa automaticamente:

### O que o CI faz

**Backend:**
- ✓ Instala dependências
- ✓ Executa ESLint
- ✓ Roda testes com Jest
- ✓ Faz build TypeScript

**Frontend:**
- ✓ Instala dependências  
- ✓ Roda testes
- ✓ Faz build React

### Quando o CI roda

- A cada push em qualquer branch
- A cada Pull Request
- Antes de fazer merge no `main`

### Como funciona com Deploy

1. Você faz push para `main`
2. GitHub Actions roda o CI
3. Se CI passar ✓ → Render e Vercel detectam o push
4. Deploy automático é iniciado
5. Render executa migrations antes do deploy
6. Aplicação é atualizada sem downtime

### Configurar Secrets no GitHub (opcional)

Para testes de integração com banco real no CI:

1. GitHub → Seu Repositório → **Settings** → **Secrets and variables** → **Actions**
2. Adicione secrets:
   - `DATABASE_URL_TEST`
   - `JWT_SECRET_TEST`
   - `JWT_REFRESH_SECRET_TEST`

---

## 6) Monitoramento e Manutenção

### Healthcheck

O backend expõe `GET /health`:

```javascript
{
  "status": "ok",
  "timestamp": "2026-01-19T12:00:00.000Z"
}
```

Configure monitoramento externo:
- [UptimeRobot](https://uptimerobot.com/) (gratuito)
- [Better Uptime](https://betteruptime.com/)
- Render tem uptime monitoring built-in

### Logs

**Backend (Render):**
- Dashboard → Web Service → **Logs**
- Suporta filtros por timestamp e nível

**Frontend (Vercel):**
- Dashboard → Project → **Deployments** → Clique no deployment → **Functions** (logs serverless)
- Para erros do cliente, configure Sentry ou LogRocket

### Backup do Banco de Dados

**Render (plano pago):**
- Backups automáticos diários
- Retenção de 7 dias

**Render (plano gratuito):**
- Faça backups manuais:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Escalabilidade

**Render:**
- Plano gratuito: 1 instância, 512 MB RAM
- Plano Starter: pode escalar horizontalmente
- Configure auto-scaling nas settings

**Vercel:**
- Auto-scaling automático
- Edge Network global
- Sem configuração necessária

---

## 7) Checklist Final de Deploy

### Backend ✓
- [ ] PostgreSQL criado e DATABASE_URL configurada
- [ ] Web Service criado no Render
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Pre-deploy command (migrations) configurada
- [ ] Deploy concluído com sucesso
- [ ] Healthcheck `/health` respondendo 200
- [ ] Registro de usuário funcionando
- [ ] Login gerando tokens JWT
- [ ] Upload para S3 funcionando

### Frontend ✓
- [ ] Projeto criado no Vercel
- [ ] `REACT_APP_API_URL` apontando para Render
- [ ] `REACT_APP_SOCKET_URL` apontando para Render
- [ ] Deploy concluído com sucesso
- [ ] Login/registro funcionando na UI
- [ ] Upload de imagens funcionando
- [ ] Notificações realtime funcionando
- [ ] Navegação entre páginas funcionando

### Segurança e CORS ✓
- [ ] `CORS_ALLOWED_ORIGINS` inclui URL do Vercel
- [ ] Secrets JWT têm 32+ caracteres
- [ ] AWS credentials configuradas corretamente
- [ ] Bucket S3 com permissões adequadas
- [ ] HTTPS funcionando (automático no Render e Vercel)

### CI/CD ✓
- [ ] Pipeline GitHub Actions passando
- [ ] Auto-deploy configurado no Render
- [ ] Auto-deploy configurado no Vercel
- [ ] Migrations rodando antes do deploy
- [ ] Rollback disponível (Render e Vercel mantêm histórico)

---

## 8) Troubleshooting Comum

### Erro: "Could not find a declaration file for module 'express'" (ou outros módulos)
**Causa:** Os tipos TypeScript (`@types/*`) não foram instalados. Isso acontece quando `devDependencies` não são instaladas no build.

**Solução:**
1. Render Dashboard → Seu Web Service → **Settings**
2. Altere o **Build Command** para:
   ```bash
   npm install --include=dev && npm run build
   ```--include=dev 
   O flag `--include=dev` força a instalação de `devDependencies` durante o build
3. Salve e faça **Manual Deploy** → "Clear build cache & deploy"

**Solução alternativa (recomendada):**
Mover os pacotes `@types/*` e `typescript` para `dependencies` no `package.json`:

```bash
cd backend
npm install --save @types/express @types/node typescript
npm uninstall --save-dev @types/express @types/node typescript
git add package.json package-lock.json
git commit -m "fix: move TypeScript types to dependencies for Render"
git push
```

### Erro: "Cannot find module 'dist/index.js'" ou "MODULE_NOT_FOUND"
**Causa:** O TypeScript não foi compilado durante o build.

**Solução:**
1. Render Dashboard → Seu Web Service → **Settings**
2. Procure por **Build Command**
3. Certifique-se que está:
   ```bash
   npm install && npm run build
   ```
   **NÃO** apenas `npm install`
4. Salve e faça um **Manual Deploy** clicando em "Manual Deploy" → "Clear build cache & deploy"

**Verificação local:**
```bash
cd backend
npm install
npm run build
# Deve criar a pasta dist/
ls -la dist/
# Deve mostrar index.js e outros arquivos compilados
```

### Erro: "Cannot connect to database"
- Verifique se `DATABASE_URL` está correta
- Confirme que o banco está na mesma região do backend
- Use **Internal Database URL** no Render (mais rápida)

### Erro: CORS blocked
- Confirme que `CORS_ALLOWED_ORIGINS` inclui a URL do Vercel **exata**
- Não use trailing slash
- Aguarde o redeploy após alterar variável

### Erro: "JWT malformed"
- Verifique se `JWT_SECRET` e `JWT_REFRESH_SECRET` estão configurados
- Confirme que ambos têm pelo menos 32 caracteres
- Certifique-se de que não há espaços extras

### Erro: S3 upload failed
- Verifique `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`
- Confirme que o IAM user tem permissões no bucket
- Verifique se `AWS_S3_BUCKET` está correto
- Teste credenciais com AWS CLI localmente

### Erro: Socket.IO não conecta
- Verifique se `REACT_APP_SOCKET_URL` está correto (sem `/api`)
- Confirme que não há trailing slash
- Abra DevTools → Network → WS para ver tentativas de conexão
- Verifique logs do Render para conexões WebSocket

### Deploy lento no Render (plano gratuito)
- Primeira requisição após inatividade pode levar 30-60s (cold start)
- Backend hiberna após 15 minutos de inatividade
- Considere Starter plan ($7/mês) para evitar hibernação

---

## 9) Próximos Passos

- [ ] Configurar domínio customizado (Vercel e Render suportam)
- [ ] Implementar analytics (Google Analytics, Plausible)
- [ ] Configurar error tracking (Sentry)
- [ ] Adicionar testes E2E (Playwright, Cypress)
- [ ] Configurar monitoramento de performance
- [ ] Implementar cache com Redis (Render add-on)
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar rate limiting mais robusto

---

## Recursos Úteis

- [Documentação Render](https://render.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [Socket.IO Deployment](https://socket.io/docs/v4/deployment/)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)