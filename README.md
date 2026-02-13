# Sistema de Tabulação Escolar

Aplicativo web (Next.js + Prisma + Postgres) para gerenciamento de provas, gabaritos, lançamento de respostas, dashboard estatístico e relatórios.

## Funcionalidades principais
- RBAC: `ADMIN`, `TEACHER`, `VIEWER`.
- Página separada de gabaritos por disciplina.
- Lançamento de respostas por turma/disciplina em tabela.
- Dashboard com KPIs, taxa de ausência e questões com maior erro.
- Exportação CSV e impressão amigável.
- Auditoria de alterações em gabaritos/respostas/provas.

## Stack
- Next.js (App Router) + TypeScript + TailwindCSS
- Prisma ORM + PostgreSQL
- Autenticação por e-mail/senha com cookie assinado JWT

## Setup
1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` e `AUTH_SECRET`.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Gere client Prisma e migre:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
4. Rode em desenvolvimento:
   ```bash
   npm run dev
   ```

## Usuários seed
- Admin: `admin@escola.com / 123456`
- Professor matemática: `mat@escola.com / 123456`
- Professor português: `port@escola.com / 123456`
- Direção (somente leitura): `viewer@escola.com / 123456`

## Observações de produção
- Configure HTTPS, `AUTH_SECRET` forte e estratégia de backup do Postgres.
- Evolução futura: Google OAuth e envio real de e-mail para reset.
