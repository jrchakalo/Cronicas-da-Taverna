# Tech Blog (Fullstack)

Blog fullstack com autenticação, posts em markdown, comentários com moderação, likes e atualizações em tempo real. Backend em Node.js/Express + PostgreSQL + Socket.IO + S3, frontend em React.

## ✨ Demo
- Frontend (Vercel): **link aqui**
- Backend (Render): **link aqui**

## ✅ Funcionalidades
- Autenticação JWT (login/registro)
- Feed de posts com tags e contadores
- Post detail com markdown + highlight
- Curtidas em tempo real
- Comentários com moderação (pending/approved/flagged)
- Upload de imagem no S3

## 🧱 Stack
**Backend:** Node.js, Express, TypeScript, Sequelize, PostgreSQL, Socket.IO, AWS S3
**Frontend:** React, TypeScript, Styled Components, React Router, React Hook Form, React Query

## 🏗️ Arquitetura
- `backend/` API REST + realtime via Socket.IO
- `frontend/` SPA em React
- `docker-compose.yml` para desenvolvimento local

## 🚀 Rodando localmente
1) Clone o repositório
2) Configure os envs
3) Suba o banco e a API
4) Rode o frontend

### Backend
```
cp .env.example backend/.env
```
Preencha as variáveis (DB, JWT, S3). Depois:
```
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend
```
cp frontend/.env.example frontend/.env.local
cd frontend
npm install
npm start
```

## ⚙️ Variáveis de ambiente (resumo)
**Backend:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (local)
- `DATABASE_URL` (produção Render)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`

**Frontend:**
- `REACT_APP_API_URL` (ex: https://api.seudominio.com/api)
- `REACT_APP_SOCKET_URL` (ex: https://api.seudominio.com)

## 📦 Scripts úteis
```
npm run dev        # backend + frontend
npm run build      # build completo
npm run test       # testes
```

## 🗄️ Migrations (Sequelize CLI)
As migrations ficam em backend/migrations e são executadas com:

```
cd backend
npm run migrate
```

## 🤖 CI/CD
O pipeline de CI roda lint, testes e build em backend e frontend via GitHub Actions:
- [.github/workflows/ci.yml](.github/workflows/ci.yml)

## 🌐 Deploy
Veja o passo a passo em [docs/DEPLOY.md](docs/DEPLOY.md).

## 🧩 Próximos passos (ideias)
- Editor rich text com preview ao vivo
- Página de perfil do autor
- Permissões granulares para moderação

---

Feito para portfólio por **Seu Nome**.
```
