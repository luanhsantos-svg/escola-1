import Link from "next/link";

const items = [
  ["/provas", "Provas"],
  ["/gabaritos", "Gabaritos"],
  ["/lancamentos", "Lançamentos"],
  ["/dashboard", "Dashboard"],
  ["/relatorios", "Relatórios"],
  ["/cadastros", "Cadastros"]
];

export function Sidebar() {
  return (
    <aside className="w-full border-b bg-white p-3 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <h1 className="mb-4 text-lg font-semibold">Tabulação Escolar</h1>
      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {items.map(([href, label]) => (
          <Link key={href} href={href} className="rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
