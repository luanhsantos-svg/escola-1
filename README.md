# Tabulação Escolar - App Web

Sistema web completo para correção automatizada, lançamento de respostas e dashboard escolar inspirado em planilhas de provão/bimestre.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Prisma ORM + PostgreSQL
- Autenticação por e-mail/senha com JWT em cookie HttpOnly
- RBAC: `ADMIN`, `TEACHER`, `VIEWER`

## Funcionalidades
- **Provas**: criação/listagem de exames com seções por disciplina e status.
- **Gabaritos**: página separada para lançamento de gabarito por disciplina com modo de colagem rápida.
- **Lançamentos**: grade por turma com respostas A-E, presença e salvamento por aluno.
- **Dashboard**: tabulação geral com média por disciplina por prova.
- **Relatórios**: exportação CSV por turma e impressão limpa do navegador (PDF via print).
- **Auditoria**: alterações de gabarito/respostas/provas em `AuditLog`.

## Como rodar
1. Copie variáveis:
```bash
cp .env.example .env
```
2. Instale dependências:
```bash
npm install
```
3. Migração + client:
```bash
npx prisma migrate dev
npx prisma generate
```
4. Seed:
```bash
npm run prisma:seed
```
5. Suba o app:
```bash
npm run dev
```

## Usuários seed
- admin@escola.com / 123456
- math@escola.com / 123456
- port@escola.com / 123456
- viewer@escola.com / 123456

## API principal
- `POST /api/auth/login`
- `POST /api/auth/reset-password`
- `GET|POST /api/exams`
- `POST /api/answer-keys`
- `POST /api/responses`
- `GET /api/dashboard?examId=...`
- `GET /api/reports/csv?classroomId=...`

## Produção
- Configure `JWT_SECRET` forte e banco PostgreSQL gerenciado.
- Use HTTPS e rotacione segredos periodicamente.
- Ative monitoramento (logs/auditoria + APM).
