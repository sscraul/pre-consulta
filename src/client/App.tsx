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
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">Verificando sessão...</div>;
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAdminView('templates')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20"><FileText className="w-6 h-6" /></div>
            <div><h1 className="font-bold text-slate-900 text-lg leading-none">Pré-Ficha Clínica</h1><p className="text-xs text-slate-500 mt-0.5">Pré-anamnese & Inteligência Clínica</p></div>
          </div>
          <nav className="flex items-center gap-2">
            <button onClick={() => setAdminView('templates')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${adminView === 'templates' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}><FileText className="w-4 h-4" /> Questionários</button>
            <button onClick={() => setAdminView('responses')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${adminView === 'responses' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}><ClipboardList className="w-4 h-4" /> Dossiê de Fichas</button>
            <button onClick={() => openTemplateEditor()} className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Novo Questionário</button>
            <button onClick={logout} title="Sair" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><LogOut className="w-4 h-4" /></button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {adminView === 'templates' && <TemplateList onEditTemplate={(id) => openTemplateEditor(id)} onOpenPatientLink={openPatientView} />}
        {adminView === 'editor' && <TemplateEditor templateId={activeTemplateId} onSaved={() => setAdminView('templates')} onCancel={() => setAdminView('templates')} />}
        {adminView === 'responses' && <ResponsesList />}
      </main>
    </div>
  );
}
