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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pré-Ficha Clínica</h1>
            <p className="text-sm text-slate-500 mt-1">Acesso administrativo</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-slate-700">Usuário</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-slate-700">Senha</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </label>
        </div>

        <button disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 flex items-center justify-center gap-2">
          <LogIn className="w-4 h-4" /> {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1"><LockKeyhole className="w-3.5 h-3.5" /> Sessão protegida por cookie seguro</p>
      </form>
    </main>
  );
}
