"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@escola.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (!res.ok) return setError("Credenciais inválidas");
    router.push("/provas");
  }

  return (
    <main className="mx-auto mt-20 max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Entrar</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
        <input className="w-full rounded border p-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" />
        <button className="w-full rounded bg-brand-600 py-2 text-white">Login</button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
