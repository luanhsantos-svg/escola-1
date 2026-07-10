# Portal Escolar Integrado

Aplicação web que reúne **BI de simulados**, **controle de frequência**, **busca ativa**, **turmas e alunos** e **relatórios pedagógicos** em um único painel.

## Funcionalidades

- Dashboard geral com desempenho, frequência, faltas e alertas.
- Cadastro livre de turmas e estudantes.
- Importação de estudantes por CSV, XLS ou XLSX.
- Simulados com quantidade variável de questões e disciplinas.
- Gabarito e lançamento de respostas por estudante.
- Indicadores por turma, estudante e questão.
- Registro diário de presença, falta, justificativa e atraso.
- Busca ativa automática para faltas do dia e frequência crítica.
- Relatório individual com meta seguinte mínima configurável.
- Tema claro/escuro, cor principal e logo da escola.
- Perfis de administrador, professor e consulta.
- Backup e restauração em JSON.
- Instalação como aplicativo web (PWA).

## Acesso de demonstração

| Perfil | Usuário | Senha |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Professor | `professor` | `prof123` |
| Consulta | `consulta` | `consulta123` |

## Executar localmente

Abra o `index.html` em um servidor local. Exemplo:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicação

O projeto é estático e pode ser publicado diretamente no GitHub Pages. O workflow incluído publica o conteúdo da branch `main` após o merge.

## Observação importante

Esta versão é um MVP local e usa `localStorage`; portanto, autenticação e dados não são adequados para uso institucional com informações reais sem um backend seguro. A próxima etapa recomendada é integrar Supabase ou Firebase, com banco de dados, autenticação real, permissões e backup em nuvem.
