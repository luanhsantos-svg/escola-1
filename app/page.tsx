import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Sistema de Tabulação Escolar</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Correção automatizada e tabulação de provas por turma e disciplina</h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            Plataforma web para substituir planilhas no provão/bimestre com lançamento rápido de gabaritos,
            respostas, presença e relatórios com filtros.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">Entrar no sistema</Link>
            <Link href="/app/dashboard" className="btn-secondary">Acessar dashboard</Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="card p-4">
            <h2 className="font-semibold">Gabaritos por disciplina</h2>
            <p className="mt-2 text-sm text-slate-600">Cada professor lança o gabarito apenas das disciplinas atribuídas.</p>
          </article>
          <article className="card p-4">
            <h2 className="font-semibold">Lançamento em grade</h2>
            <p className="mt-2 text-sm text-slate-600">Tabela por turma com presença, respostas e cálculo automático de acertos.</p>
          </article>
          <article className="card p-4">
            <h2 className="font-semibold">Dashboard e relatórios</h2>
            <p className="mt-2 text-sm text-slate-600">KPIs, taxa de ausência, questões mais erradas, CSV e impressão limpa.</p>
          </article>
        </section>
      </div>
    </main>
  );
}
