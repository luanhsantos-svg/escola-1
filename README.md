# Sistema de Tabulação Escolar

Aplicativo web em **Next.js + Prisma + Postgres** para correção automatizada e tabulação escolar de provas por turma/disciplina.

## Se o link abriu mostrando texto do README
Isso acontece quando o projeto foi publicado como **site estático** (ex.: GitHub Pages) em vez de executar o servidor Next.js.

> Este sistema **não é estático**. Ele precisa de runtime Node + banco Postgres.

Use uma das opções:
- Deploy em Vercel/Render/Railway com variáveis de ambiente; ou
- Docker Compose local/servidor (passos abaixo).

## Funcionalidades principais
- RBAC: `ADMIN`, `TEACHER`, `VIEWER`
- Página separada de **Gabaritos**
- Página de **Lançamentos** em grade por turma
- **Dashboard** com KPIs e estatísticas
- **Relatórios CSV** + impressão limpa
- Auditoria de alterações

## Stack
- Next.js (App Router) + TypeScript + TailwindCSS
- Prisma ORM + PostgreSQL
- Login com e-mail/senha (JWT em cookie HTTP-only)

## Configuração local
1. Copie o ambiente:
   ```bash
   cp .env.example .env
   ```
2. Instale dependências:
   ```bash
   npm install
   ```
3. Execute migração e seed:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
4. Rode localmente:
   ```bash
   npm run dev
   ```

## Docker (produção rápida)
```bash
docker compose up --build
```

Depois:
- App: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/api/health`

## Usuários seed
- Admin: `admin@escola.com / 123456`
- Professor matemática: `mat@escola.com / 123456`
- Professor português: `port@escola.com / 123456`
- Direção (somente leitura): `viewer@escola.com / 123456`

## Variáveis obrigatórias
- `DATABASE_URL`
- `AUTH_SECRET`
