# Portal Escolar Integrado

Sistema de gestão pedagógica que reúne **BI de simulados**, **controle de frequência**, **busca ativa**, **turmas e alunos**, **metas** e **relatórios** em um único painel.

## Situação do projeto

A interface visual já possui um protótipo funcional. A criação da versão real começou pela fundação do backend na branch `agent/fundacao-sistema-escolar`.

### Fase 1 — Fundação do sistema

- Google Sheets como banco de dados.
- Google Apps Script como backend e API.
- Criação automática das abas do sistema.
- Autenticação com senha protegida por salt e SHA-256.
- Sessões com duração de até seis horas.
- Perfis de administrador, professor e consulta.
- Auditoria de logins e lançamentos.
- Dashboard inicial com desempenho, frequência e alertas.
- Módulo de frequência com os status:
  - Presente;
  - Falta;
  - Justificada;
  - Atestado;
  - Justificada pelo responsável;
  - Atraso.
- Cliente JavaScript preparado para conectar as telas à API.

## Arquitetura definida

```text
Interface web
    ↓
api-client.js
    ↓
Google Apps Script
    ↓
Google Sheets
```

A escolha preserva o modelo já desenvolvido no BI de simulados e permite evolução incremental para PWA e aplicativo móvel.

## Estrutura de dados

O instalador `setupSystem()` cria estas abas:

- `CONFIGURACAO`
- `USUARIOS`
- `TURMAS`
- `ALUNOS`
- `SIMULADOS`
- `RESULTADOS`
- `FREQUENCIA`
- `METAS`
- `AUDITORIA`

## Funcionalidades planejadas

- Dashboard geral com filtros por turma, aluno, disciplina e simulado.
- Cadastro e importação de turmas e estudantes.
- Gabaritos e resultados por questão.
- Desempenho por aluno, turma, disciplina e habilidade.
- Ranking, alertas e evolução entre avaliações.
- Seis simulados, cada um valendo um ponto.
- Conversão da nota final pela regra `(Nota Final ÷ 6) × 10`.
- Frequência diária e análises estatísticas.
- Busca ativa e histórico de intervenções.
- Boletim em PDF e exportação para Excel.
- Backup, temas e personalização da escola.

## Pastas principais

- `apps-script/`: backend, banco, autenticação e regras.
- `api-client.js`: conexão da interface com o backend.
- `index.html`, `styles.css` e `app.js`: frontend atual.

## Executar o protótipo visual

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Instalar o backend

Consulte [`apps-script/README.md`](apps-script/README.md). O primeiro passo é copiar os arquivos para um projeto do Google Apps Script e executar `setupSystem()`.

## Próximas implementações

1. Conectar o login da interface à autenticação real.
2. Carregar turmas e alunos da planilha.
3. Conectar o lançamento de frequência.
4. Migrar simulados, gabaritos e resultados.
5. Implementar relatórios, boletim e exportações.

> Não use os usuários e senhas demonstrativos do protótipo com dados reais. A versão institucional deve operar pelo backend da pasta `apps-script/`.
