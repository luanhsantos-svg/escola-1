# Backend Google Apps Script

Esta pasta contém a primeira versão do backend real do **Portal Escolar Integrado**.

## Arquitetura

- **Google Sheets:** banco de dados.
- **Google Apps Script:** API, autenticação, permissões, regras e auditoria.
- **Frontend HTML/CSS/JavaScript:** interface publicada separadamente.

## Instalação inicial

1. Crie um projeto no Google Apps Script.
2. Copie os arquivos desta pasta para o projeto, mantendo os nomes.
3. Execute manualmente a função `setupSystem()`.
4. Autorize o acesso solicitado pelo Google.
5. Abra o registro da execução e copie:
   - URL da planilha criada;
   - usuário administrador;
   - senha temporária.
6. Em **Implantar → Nova implantação**, escolha **Aplicativo da web**.
7. Configure a execução como proprietário do projeto.
8. Defina o acesso conforme a política da escola. Para usar o frontend hospedado no GitHub Pages, a API precisa aceitar acesso externo; as ações protegidas continuam exigindo login e token.
9. Copie a URL terminada em `/exec`.

## Abas criadas

- `CONFIGURACAO`
- `USUARIOS`
- `TURMAS`
- `ALUNOS`
- `SIMULADOS`
- `RESULTADOS`
- `FREQUENCIA`
- `METAS`
- `AUDITORIA`

## Status de frequência

| Código | Situação | Conta como presença | Exige observação |
|---|---|---:|---:|
| `P` | Presente | Sim | Não |
| `F` | Falta | Não | Não |
| `J` | Justificada | Não | Sim |
| `AT` | Atestado | Não | Sim |
| `JR` | Justificada pelo responsável | Não | Sim |
| `A` | Atraso | Sim | Não |

## Ações disponíveis na API

### Públicas

- `health`
- `login`

### Protegidas

- `bootstrap`
- `logout`
- `dashboard`
- `listAttendance`
- `saveAttendance`
- `attendanceSummary`

As requisições `POST` usam este formato:

```json
{
  "action": "dashboard",
  "token": "TOKEN_DA_SESSAO",
  "payload": {}
}
```

## Segurança inicial

- As senhas não são gravadas em texto simples.
- Cada senha usa salt próprio e SHA-256.
- As sessões ficam no cache do Apps Script por até seis horas.
- Alterações de frequência e logins são registrados em `AUDITORIA`.
- O primeiro administrador recebe uma senha temporária gerada na execução de `setupSystem()`.

## Próxima etapa

Conectar `api-client.js` às telas atuais, começando pelo login, carregamento das turmas e lançamento de frequência.
