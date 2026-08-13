import React, { useEffect, useState } from 'react';
import { ClipboardList, Copy, Check, RefreshCw, Trash2, User, Phone, Calendar, Sparkles, FileText } from 'lucide-react';

interface PatientResponse {
  id: string;
  template_title: string;
  patient_name: string;
  patient_cpf: string;
  patient_phone: string;
  patient_birthdate: string;
  answers_json: string;
  patient_summary: string;
  pre_anamnese: string;
  created_at: string;
}

export default function ResponsesList() {
  const [responses, setResponses] = useState<PatientResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<PatientResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResponses = async () => {
    try {
      const res = await fetch('/api/responses');
      const data = await res.json();
      setResponses(data);
      if (data.length > 0 && !selectedResponse) {
        setSelectedResponse(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const copyPreAnamnese = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRegenerateAI = async (id: string) => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/responses/${id}/regenerate-ai`, { method: 'POST' });
      const data = await res.json();
      if (selectedResponse && selectedResponse.id === id) {
        setSelectedResponse({
          ...selectedResponse,
          patient_summary: data.patient_summary,
          pre_anamnese: data.pre_anamnese
        });
      }
      fetchResponses();
    } catch (e) {
      alert('Erro ao regenerar pré-anamnese');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta ficha clínica permanentemente?')) return;
    await fetch(`/api/responses/${id}`, { method: 'DELETE' });
    if (selectedResponse?.id === id) setSelectedResponse(null);
    fetchResponses();
  };

  if (loading) {
    return <div className="surface-card flex items-center justify-center gap-3 p-10 text-sm text-slate-500"><span className="loading-dot animate-pulse" /> Carregando fichas...</div>;
  }

  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200/80 pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Acompanhamento clínico</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Dossiê clínico</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Visualize a pré-anamnese sintetizada por IA e copie o texto direto para o prontuário.
        </p>
      </div>

      {responses.length === 0 ? (
        <div className="surface-card mx-auto max-w-xl space-y-4 p-10 text-center sm:p-12">
          <ClipboardList className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-950">Nenhuma ficha recebida ainda</h3>
          <p className="text-sm leading-6 text-slate-500">
            Envie o link do questionário para os pacientes na sala de espera para começar a receber as pré-anamneses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-7">
          {/* Painel Esquerdo: Lista de Pacientes */}
          <div className="surface-card overflow-hidden lg:col-span-4">
            <div className="border-b border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fila de atendimento</p>
              <h3 className="mt-1 text-sm font-bold text-slate-950">Respondidos ({responses.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {responses.map((resp) => {
                const isSelected = selectedResponse?.id === resp.id;
                return (
                  <button
                    key={resp.id}
                    onClick={() => setSelectedResponse(resp)}
                    className={`min-h-[88px] w-full p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                      isSelected ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-950">{resp.patient_name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(resp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-slate-500">{resp.template_title || 'Questionário'}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                      <Phone className="w-3 h-3" /> {resp.patient_phone}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel Direito: Dossiê Clínico Detalhado */}
          <div className="lg:col-span-8 space-y-6">
            {selectedResponse ? (
              <div className="surface-card space-y-6 p-5 sm:p-7">
                {/* Cabeçalho do Paciente */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950">
                      <User className="w-5 h-5 text-blue-600" /> {selectedResponse.patient_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedResponse.patient_phone}
                      </span>
                      {selectedResponse.patient_birthdate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Nasc: {selectedResponse.patient_birthdate}
                        </span>
                      )}
                      <span className="text-slate-400">| {selectedResponse.template_title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerateAI(selectedResponse.id)}
                      disabled={regenerating}
                      className="flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Regenerar com IA"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} /> Regenerar IA
                    </button>
                    <button
                      onClick={() => handleDelete(selectedResponse.id)}
                      className="min-h-10 min-w-10 rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Excluir Ficha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Resumo da IA */}
                {selectedResponse.patient_summary && (
                  <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 shadow-inner shadow-blue-100/40">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" /> Resumo Executivo da IA
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedResponse.patient_summary}
                    </p>
                  </div>
                )}

                {/* Pré-Anamnese para Prontuário */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" /> Pré-Anamnese Pronta para Prontuário
                    </h4>

                    {/* BOTÃO PRINCIPAL DO PRD: COPIAR PARA CLIPBOARD */}
                    <button
                      onClick={() => copyPreAnamnese(selectedResponse.pre_anamnese, selectedResponse.id)}
                      className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {copiedId === selectedResponse.id ? (
                        <>
                          <Check className="w-4 h-4" /> Copiado para o Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copiar Pré-Anamnese
                        </>
                      )}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs leading-relaxed text-slate-100 shadow-inner shadow-black/30">
                    {selectedResponse.pre_anamnese}
                  </div>
                </div>

                {/* Respostas Brutas do Paciente */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    Respostas Declaradas do Paciente
                  </h4>
                  <div className="space-y-2">
                    {JSON.parse(selectedResponse.answers_json || '[]').map((ans: any, idx: number) => (
                      <div key={idx} className="space-y-1 rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-xs">
                        <p className="font-semibold text-slate-900">{ans.question}</p>
                        <p className="text-slate-700 font-medium">Resposta: {ans.answer}</p>
                        {ans.followupAnswer && (
                          <p className="text-blue-700 bg-blue-50/80 p-1.5 rounded-lg border border-blue-100 mt-1">
                            <span className="font-semibold">Detalhamento IA:</span> {ans.followupAnswer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-card p-8 text-center text-slate-400">
                Selecione uma ficha ao lado para abrir o dossiê clínico.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
