# Escola+ - Controle de Atividades Escolares

Aplicativo web (HTML/CSS/JS) para controle de turmas, matérias, alunos, atividades, dashboard inteligente e impressão de boletins.

## Funcionalidades

- Cadastro de várias turmas e matérias.
- Cadastro de alunos individual e em lote.
- Exclusão de alunos, matérias e atividades.
- Lançamento em lote por turma:
  - **Tarefa/Pauta:** botões coloridos `R` (verde), `NR` (vermelho) e `F` (amarelo).
  - **Trabalho/Avaliação:** notas de 0 a 10 e opção de limpar lançamentos.
- Campo de **data** e **descrição** no registro de atividade.
- Dashboard com filtros de **turma + matéria**, gráficos comparativos e estatísticas da seleção.
- Boletim com filtros de **turma + matéria + aluno**, impressão individual e em lote.
- Boletim com:
  - quantidade de atividades realizadas no período,
  - campo para peso por atividade,
  - cálculo de nota final ponderada,
  - mensagem motivacional por faixa de nota.
- Exportação/importação de dados JSON.

## Como executar

Basta abrir `index.html` no navegador ou usar um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.
