import Link from 'next/link';

const items = [
  ['Provas', '/app/provas'],
  ['Gabaritos', '/app/gabaritos'],
  ['Lançamentos', '/app/lancamentos'],
  ['Dashboard', '/app/dashboard'],
  ['Relatórios', '/app/relatorios'],
  ['Cadastros', '/app/cadastros']
];

export function Sidebar() {
  return (
    <aside className="w-full md:w-64 card p-4 h-fit md:sticky top-4">
      <h1 className="font-bold text-lg text-brand">Tabulação Escolar</h1>
      <nav className="mt-4 space-y-1">
        {items.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm hover:bg-brand-muted">
            {label}
          </Link>
        ))}
      </nav>
      <details className="mt-6 text-sm">
        <summary className="cursor-pointer font-medium">Ajuda</summary>
        <p className="mt-2 text-slate-600">Selecione prova, turma e disciplina para começar. Use colar sequência para ganho de velocidade.</p>
      </details>
    </aside>
  );
}
