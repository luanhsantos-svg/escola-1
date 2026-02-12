# Escola+ - Controle de Atividades Escolares

Aplicativo web (HTML/CSS/JS) para controle de turmas, matérias, alunos, atividades, dashboard e impressão de boletins.

## Funcionalidades

- Cadastro de várias turmas e matérias.
- Cadastro de alunos individual e em lote.
- Exclusão de alunos, matérias e atividades.
- Lançamento em lote de atividades por turma:
  - **Tarefa/Pauta:** R, NR, F.
  - **Trabalho/Avaliação:** notas de 0 a 10 e opção de limpar lançamentos.
- Campo de **data** e **descrição** no registro de atividade.
- Tela de **dashboard** com tabelas comparativas, gráficos, ranking e estatísticas da turma.
- Tela de **boletim escolar** com opção de impressão individual e por lote.
- Exportação/importação de dados JSON.

## Como executar

Basta abrir `index.html` no navegador ou usar um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.
