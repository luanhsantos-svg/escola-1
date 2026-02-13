'use client';

import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
    if (res.ok) window.location.href = '/app/dashboard';
    else setError('Credenciais inválidas');
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-bold">Entrar</h1>
        <input name="email" placeholder="E-mail" className="input" required />
        <input name="password" type="password" placeholder="Senha" className="input" required />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary w-full">Login</button>
      </form>
    </main>
  );
}
