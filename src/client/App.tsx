import React, { useState, useEffect } from 'react';
import TemplateList from './pages/TemplateList';
import TemplateEditor from './pages/TemplateEditor';
import PatientForm from './pages/PatientForm';
import ResponsesList from './pages/ResponsesList';
import Login from './pages/Login';
import { FileText, PlusCircle, ClipboardList, LogOut } from 'lucide-react';

type AdminView = 'templates' | 'editor' | 'responses';

export default function App() {
  const [adminView, setAdminView] = useState<AdminView>('templates');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/q/')) return;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => setAuthenticated(response.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const path = window.location.pathname;
  if (path.startsWith('/q/')) {
    const id = path.split('/q/')[1];
    return id ? <PatientForm templateId={id} /> : null;
  }

  if (authenticated === null) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center p-6">
        <div className="surface-card flex items-center gap-3 px-5 py-4 text-sm text-slate-600">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />
          Verificando sua sessão...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLoggedIn={() => { setAuthenticated(true); window.history.replaceState({}, '', '/dashboard'); }} />;
  }

  const openPatientView = (templateId: string) => {
    window.open(`/q/${templateId}`, '_blank', 'noopener,noreferrer');
  };
  const openTemplateEditor = (templateId?: string) => {
    setActiveTemplateId(templateId || null);
    setAdminView('editor');
  };
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
  };

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-10 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:h-[4.5rem] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8">
          <button className="flex items-center gap-3 text-left" onClick={() => setAdminView('templates')} aria-label="Ir para questionários">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><FileText className="h-5 w-5" /></div>
            <div><h1 className="text-base font-bold leading-none text-slate-950 sm:text-lg">Pré-Ficha Clínica</h1><p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">Recepção clínica eficiente</p></div>
          </button>
          <nav className="flex items-center gap-1.5 overflow-x-auto sm:gap-2" aria-label="Navegação principal">
            <button onClick={() => setAdminView('templates')} className={`${adminView === 'templates' ? 'nav-item-active' : 'nav-item'} whitespace-nowrap px-3 sm:px-4`}><FileText className="mr-1.5 inline h-4 w-4" /> Questionários</button>
            <button onClick={() => setAdminView('responses')} className={`${adminView === 'responses' ? 'nav-item-active' : 'nav-item'} whitespace-nowrap px-3 sm:px-4`}><ClipboardList className="mr-1.5 inline h-4 w-4" /> Dossiê</button>
            <button onClick={() => openTemplateEditor()} className="primary-action flex min-h-11 items-center gap-1.5 whitespace-nowrap px-3 text-xs shadow-md shadow-blue-600/15 sm:px-4 sm:text-sm"><PlusCircle className="h-4 w-4" /> Novo</button>
            <button onClick={logout} title="Sair" aria-label="Sair" className="logout-action p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"><LogOut className="mx-auto h-4 w-4" /></button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {adminView === 'templates' && <TemplateList onEditTemplate={(id) => openTemplateEditor(id)} onOpenPatientLink={openPatientView} />}
        {adminView === 'editor' && <TemplateEditor templateId={activeTemplateId} onSaved={() => setAdminView('templates')} onCancel={() => setAdminView('templates')} />}
        {adminView === 'responses' && <ResponsesList />}
      </main>
    </div>
  );
}
