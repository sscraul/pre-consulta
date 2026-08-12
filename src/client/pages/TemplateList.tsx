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
    return <div className="p-8 text-center text-slate-500">Carregando questionários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Questionários & Templates</h2>
          <p className="text-sm text-slate-500">
            Selecione um questionário para enviar o link ao paciente ou editar sua estrutura.
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Nenhum questionário cadastrado</h3>
          <p className="text-slate-500 text-sm">
            Crie seu primeiro questionário do zero ou peça ajuda para a IA gerar um template em poucos segundos.
          </p>
          <button
            onClick={() => onEditTemplate()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            Criar Primeiro Questionário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-6 flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {tpl.specialty || 'Geral'}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      tpl.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {tpl.status === 'active' ? 'Ativo' : 'Rascunho'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-2">{tpl.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-3 mb-6">
                  {tpl.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={() => copyPatientLink(tpl.id)}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 border border-blue-200"
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
                    className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 py-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Testar Formulário
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTemplate(tpl.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
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
