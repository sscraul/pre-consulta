import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Check, Sparkles, Send, ExternalLink } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  specialty: string;
  status: string;
  created_at: string;
}

interface TemplateListProps {
  onEditTemplate: (id?: string) => void;
  onOpenPatientLink: (id: string) => void;
}

export default function TemplateList({ onEditTemplate, onOpenPatientLink }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const copyPatientLink = (templateId: string) => {
    const url = `${window.location.origin}/q/${templateId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(templateId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este questionário?')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  if (loading) {
    return <div className="surface-card flex items-center justify-center gap-3 p-10 text-sm text-slate-500"><span className="loading-dot animate-pulse" /> Carregando questionários...</div>;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Recepção clínica</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Questionários</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Selecione um questionário para enviar o link ao paciente ou editar sua estrutura.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Links ativos até você desativar</div>
      </div>

      {templates.length === 0 ? (
        <div className="surface-card mx-auto max-w-xl space-y-5 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-950">Comece pela sua primeira ficha</h3>
          <p className="text-sm leading-6 text-slate-500">
            Crie seu primeiro questionário do zero ou peça ajuda para a IA gerar um template em poucos segundos.
          </p>
          <button
            onClick={() => onEditTemplate()}
            className="primary-action px-5 py-2.5 text-sm shadow-md shadow-blue-600/15"
          >
            Criar Primeiro Questionário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="surface-card group flex flex-col justify-between p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[var(--shadow-card-hover)] sm:p-6"
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="status-pill border-blue-100 bg-blue-50 text-blue-700">
                    {tpl.specialty || 'Geral'}
                  </span>
                  <span
                    className={`status-pill ${
                      tpl.status === 'active'
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                        : 'border-amber-100 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {tpl.status === 'active' ? 'Ativo' : 'Rascunho'}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-950">{tpl.title}</h3>
                <p className="mb-6 line-clamp-3 text-sm leading-6 text-slate-600">
                  {tpl.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => copyPatientLink(tpl.id)}
                  className="secondary-action flex min-h-11 w-full items-center justify-center gap-2 border border-blue-200 px-3 py-2 text-sm transition"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" /> Link Copiado!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Copiar Link para Paciente
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onOpenPatientLink(tpl.id)}
                    className="flex min-h-11 items-center gap-1 py-1 font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Testar Formulário
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTemplate(tpl.id)}
                      className="min-h-10 min-w-10 rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="min-h-10 min-w-10 rounded-xl p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
