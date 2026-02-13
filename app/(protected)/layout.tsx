import { ReactNode } from 'react';
import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
        <Sidebar />
        <section className="flex-1 space-y-4">
          <header className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Usuário atual</p>
              <p className="font-semibold">{user.name} ({user.role})</p>
            </div>
            <form action="/api/auth/logout" method="post"><button className="btn-secondary">Sair</button></form>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
