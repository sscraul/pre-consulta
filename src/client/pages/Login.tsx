import React, { useState } from 'react';
import { FileText, LockKeyhole, LogIn, AlertCircle } from 'lucide-react';

export default function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
      <form onSubmit={handleSubmit} className="surface-card relative w-full max-w-md space-y-7 p-6 shadow-2xl shadow-slate-900/10 sm:p-9">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Pré-Ficha Clínica</h1>
            <p className="mt-1 text-sm text-slate-500">Acesso à recepção clínica</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Usuário</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="field-control w-full px-3 py-3 text-base sm:text-sm" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Senha</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="field-control w-full px-3 py-3 text-base sm:text-sm" />
          </label>
        </div>

        <button disabled={loading} className="primary-action flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50">
          <LogIn className="w-4 h-4" /> {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" /> Sessão protegida por cookie seguro</p>
      </form>
    </main>
  );
}
