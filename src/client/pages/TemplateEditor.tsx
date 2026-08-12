import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, ArrowLeft, Save, Layers, GripVertical, GitFork, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface Option {
  id?: string;
  option_label: string;
  option_value: string;
}

interface Question {
  id: string;
  question_text: string;
  help_text?: string;
  type: 'short_text' | 'long_text' | 'number' | 'single_choice' | 'multiple_choice';
  required: boolean;
  ai_deepen: boolean;
  condition_question_id?: string | null;
  condition_operator?: 'equals' | 'not_equals' | 'contains' | 'is_answered' | 'is_empty' | string | null;
  condition_value?: string | null;
  options: Option[];
}

interface Section {
  id?: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface TemplateEditorProps {
  templateId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

type DragItem =
  | { type: 'section'; secIdx: number }
  | { type: 'question'; secIdx: number; qIdx: number }
  | { type: 'option'; secIdx: number; qIdx: number; optIdx: number };

function generateClientQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeOption(opt: any, idx: number): Option {
  if (typeof opt === 'string') {
    return {
      option_label: opt,
      option_value: opt
    };
  }
  const label = opt?.option_label ?? opt?.label ?? opt?.option_value ?? opt?.value ?? `Opção ${idx + 1}`;
  const val = opt?.option_value ?? opt?.value ?? opt?.option_label ?? opt?.label ?? `Opção ${idx + 1}`;
  return {
    id: opt?.id,
    option_label: String(label),
    option_value: String(val)
  };
}

function normalizeQuestion(q: any): Question {
  const qType = q?.type || 'short_text';
  let opts: Option[] = [];
  if (Array.isArray(q?.options)) {
    opts = q.options.map(normalizeOption);
  }
  if ((qType === 'single_choice' || qType === 'multiple_choice') && opts.length === 0) {
    opts = [
      { option_label: 'Opção 1', option_value: 'Opção 1' },
      { option_label: 'Opção 2', option_value: 'Opção 2' }
    ];
  }

  return {
    id: q?.id || generateClientQuestionId(),
    question_text: q?.question_text || '',
    help_text: q?.help_text || '',
    type: qType,
    required: Boolean(q?.required),
    ai_deepen: Boolean(q?.ai_deepen),
    condition_question_id: q?.condition_question_id || null,
    condition_operator: q?.condition_operator || 'equals',
    condition_value: q?.condition_value || '',
    options: opts
  };
}

function normalizeSections(rawSections: any[]): Section[] {
  if (!Array.isArray(rawSections)) return [];
  return rawSections.map((sec) => ({
    id: sec?.id,
    title: sec?.title || '',
    description: sec?.description || '',
    questions: Array.isArray(sec?.questions) ? sec.questions.map(normalizeQuestion) : []
  }));
}

export default function TemplateEditor({ templateId, onSaved, onCancel }: TemplateEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('Oftalmologia Geral');
  const [status, setStatus] = useState('active');
  const [sections, setSections] = useState<Section[]>([]);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado centralizado de Drag and Drop
  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DragItem | null>(null);

  useEffect(() => {
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setSpecialty(data.specialty || 'Oftalmologia Geral');
          setStatus(data.status || 'active');
          setSections(normalizeSections(data.sections || []));
        })
        .catch(() => alert('Erro ao carregar questionário'));
    } else {
      setSections([
        {
          title: 'Identificação e Queixa Principal',
          description: 'Dados preliminares e motivo da consulta',
          questions: [
            {
              id: generateClientQuestionId(),
              question_text: 'Qual o principal motivo da sua consulta hoje?',
              type: 'long_text',
              required: true,
              ai_deepen: true,
              condition_question_id: null,
              condition_operator: 'equals',
              condition_value: '',
              options: []
            }
          ]
        }
      ]);
    }
  }, [templateId]);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      setTitle(data.title || '');
      setDescription(data.description || '');
      setSpecialty(data.specialty || 'Geral');
      setStatus('draft');
      setSections(normalizeSections(data.sections || []));
    } catch (e) {
      alert('Erro ao gerar com IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Nova Seção ${sections.length + 1}`,
        description: '',
        questions: []
      }
    ]);
  };

  const addQuestion = (secIdx: number) => {
    const newSecs = [...sections];
    newSecs[secIdx].questions.push({
      id: generateClientQuestionId(),
      question_text: '',
      type: 'short_text',
      required: false,
      ai_deepen: false,
      condition_question_id: null,
      condition_operator: 'equals',
      condition_value: '',
      options: []
    });
    setSections(newSecs);
  };

  const addOption = (secIdx: number, qIdx: number) => {
    const newSecs = [...sections];
    const currentOptions = newSecs[secIdx].questions[qIdx].options || [];
    const nextNum = currentOptions.length + 1;
    newSecs[secIdx].questions[qIdx].options = [
      ...currentOptions,
      {
        option_label: `Opção ${nextNum}`,
        option_value: `Opção ${nextNum}`
      }
    ];
    setSections(newSecs);
  };

  // --- REORDENAÇÃO DE SEÇÕES ---
  const moveSection = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= sections.length) return;
    const newSecs = [...sections];
    const [moved] = newSecs.splice(fromIdx, 1);
    newSecs.splice(toIdx, 0, moved);
    setSections(newSecs);
  };

  const dropSection = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= sections.length) return;
    const newSecs = [...sections];
    const [moved] = newSecs.splice(fromIdx, 1);
    newSecs.splice(toIdx, 0, moved);
    setSections(newSecs);
  };

  // --- REORDENAÇÃO DE PERGUNTAS ---
  const moveQuestion = (secIdx: number, qIdx: number, direction: 'up' | 'down') => {
    const toQIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
    const qList = sections[secIdx].questions;
    if (toQIdx < 0 || toQIdx >= qList.length) return;
    const newSecs = [...sections];
    const [moved] = newSecs[secIdx].questions.splice(qIdx, 1);
    newSecs[secIdx].questions.splice(toQIdx, 0, moved);
    setSections(newSecs);
  };

  const dropQuestion = (srcSecIdx: number, srcQIdx: number, targetSecIdx: number, targetQIdx: number) => {
    if (srcSecIdx === targetSecIdx && srcQIdx === targetQIdx) return;
    const newSecs = [...sections];
    const [moved] = newSecs[srcSecIdx].questions.splice(srcQIdx, 1);
    newSecs[targetSecIdx].questions.splice(targetQIdx, 0, moved);
    setSections(newSecs);
  };

  // --- REORDENAÇÃO DE ALTERNATIVAS ---
  const moveOption = (secIdx: number, qIdx: number, optIdx: number, direction: 'up' | 'down') => {
    const toOptIdx = direction === 'up' ? optIdx - 1 : optIdx + 1;
    const optList = sections[secIdx].questions[qIdx].options;
    if (toOptIdx < 0 || toOptIdx >= optList.length) return;
    const newSecs = [...sections];
    const [moved] = newSecs[secIdx].questions[qIdx].options.splice(optIdx, 1);
    newSecs[secIdx].questions[qIdx].options.splice(toOptIdx, 0, moved);
    setSections(newSecs);
  };

  const dropOption = (secIdx: number, qIdx: number, srcOptIdx: number, targetOptIdx: number) => {
    if (srcOptIdx === targetOptIdx) return;
    const newSecs = [...sections];
    const [moved] = newSecs[secIdx].questions[qIdx].options.splice(srcOptIdx, 1);
    newSecs[secIdx].questions[qIdx].options.splice(targetOptIdx, 0, moved);
    setSections(newSecs);
  };

  // Helper para buscar todas as perguntas que antecedem a pergunta atual
  const getPriorQuestions = (currentSecIdx: number, currentQIdx: number) => {
    const priors: { id: string; label: string; type: string; options: Option[] }[] = [];
    sections.forEach((sec, sI) => {
      sec.questions.forEach((q, qI) => {
        if (sI < currentSecIdx || (sI === currentSecIdx && qI < currentQIdx)) {
          if (q.id) {
            priors.push({
              id: q.id,
              label: `${sec.title || `Seção ${sI + 1}`} > ${q.question_text || `Pergunta sem título (${qI + 1})`}`,
              type: q.type,
              options: q.options || []
            });
          }
        }
      });
    });
    return priors;
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Informe o título do questionário');
    setSaving(true);

    const body = { title, description, specialty, status, sections };
    try {
      if (templateId) {
        await fetch(`/api/templates/${templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }
      onSaved();
    } catch (e) {
      alert('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button onClick={onCancel} className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-700"
          >
            <option value="active">Publicado (Ativo)</option>
            <option value="draft">Rascunho</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Questionário'}
          </button>
        </div>
      </div>

      {/* Caixa de IA Assistente */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Criar ou Ajustar com Inteligência Artificial</h3>
            <p className="text-blue-200 text-xs">
              Digite a especialidade ou contexto da consulta (ex: "Pré-consulta para catarata") e a IA montará as seções e perguntas.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Pré-consulta para cirurgia refrativa (LASIK/PRK)..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleGenerateAI}
            disabled={isGeneratingAI || !aiPrompt.trim()}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition flex items-center gap-2 shadow-md"
          >
            {isGeneratingAI ? 'Gerando...' : 'Gerar Template'}
          </button>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">Informações do Questionário</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Título do Questionário</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pré-Anamnese Geral"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Especialidade / Rótulo</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Oftalmologia"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Descrição Explicativa para o Paciente</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ex: Preencha antes da consulta para agilizar seu atendimento..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Seções e Perguntas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Seções do Formulário ({sections.length})
          </h3>
          <button
            onClick={addSection}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Adicionar Seção
          </button>
        </div>

        {sections.map((sec, secIdx) => {
          const isDraggingThisSec = activeDrag?.type === 'section' && activeDrag.secIdx === secIdx;
          const isDroppingThisSec = dropTarget?.type === 'section' && dropTarget.secIdx === secIdx;

          return (
            <div
              key={sec.id || secIdx}
              onDragOver={(e) => {
                if (activeDrag?.type === 'section') {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropTarget({ type: 'section', secIdx });
                }
              }}
              onDragLeave={(e) => {
                if (activeDrag?.type === 'section') {
                  e.stopPropagation();
                  setDropTarget(null);
                }
              }}
              onDrop={(e) => {
                if (activeDrag?.type === 'section') {
                  e.preventDefault();
                  e.stopPropagation();
                  dropSection(activeDrag.secIdx, secIdx);
                  setActiveDrag(null);
                  setDropTarget(null);
                }
              }}
              className={`bg-white rounded-2xl border p-6 space-y-6 shadow-sm transition-all ${
                isDraggingThisSec
                  ? 'opacity-40 border-blue-400 border-2'
                  : isDroppingThisSec
                  ? 'border-blue-500 border-2 bg-blue-50/20 shadow-md'
                  : 'border-slate-200'
              }`}
            >
              {/* Header da Seção */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1 mt-1">
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setActiveDrag({ type: 'section', secIdx });
                    }}
                    onDragEnd={() => {
                      setActiveDrag(null);
                      setDropTarget(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title="Arraste para reordenar esta seção"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={secIdx === 0}
                      onClick={() => moveSection(secIdx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 transition"
                      title="Mover seção para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={secIdx === sections.length - 1}
                      onClick={() => moveSection(secIdx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 transition"
                      title="Mover seção para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => {
                      const newSecs = [...sections];
                      newSecs[secIdx].title = e.target.value;
                      setSections(newSecs);
                    }}
                    placeholder="Nome da Seção (ex: Antecedentes Oculares)"
                    className="w-full text-base font-bold text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={sec.description || ''}
                    onChange={(e) => {
                      const newSecs = [...sections];
                      newSecs[secIdx].description = e.target.value;
                      setSections(newSecs);
                    }}
                    placeholder="Descrição da seção (opcional)"
                    className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setSections(sections.filter((_, i) => i !== secIdx));
                  }}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition"
                  title="Excluir Seção"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Perguntas da Seção */}
              <div className="space-y-4">
                {sec.questions.map((q, qIdx) => {
                  const priorQuestions = getPriorQuestions(secIdx, qIdx);
                  const hasCondition = Boolean(q.condition_question_id);
                  const referencedQuestion = priorQuestions.find((p) => p.id === q.condition_question_id);

                  const isDraggingThisQ = activeDrag?.type === 'question' && activeDrag.secIdx === secIdx && activeDrag.qIdx === qIdx;
                  const isDroppingThisQ = dropTarget?.type === 'question' && dropTarget.secIdx === secIdx && dropTarget.qIdx === qIdx;

                  return (
                    <div
                      key={q.id || qIdx}
                      onDragOver={(e) => {
                        if (activeDrag?.type === 'question') {
                          e.preventDefault();
                          e.stopPropagation();
                          setDropTarget({ type: 'question', secIdx, qIdx });
                        }
                      }}
                      onDragLeave={(e) => {
                        if (activeDrag?.type === 'question') {
                          e.stopPropagation();
                          setDropTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (activeDrag?.type === 'question') {
                          e.preventDefault();
                          e.stopPropagation();
                          dropQuestion(activeDrag.secIdx, activeDrag.qIdx, secIdx, qIdx);
                          setActiveDrag(null);
                          setDropTarget(null);
                        }
                      }}
                      className={`rounded-xl p-4 border space-y-3 transition-all ${
                        isDraggingThisQ
                          ? 'opacity-30 border-blue-400 border-2 bg-blue-50'
                          : isDroppingThisQ
                          ? 'border-blue-500 border-2 bg-blue-50/60 shadow-md'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 flex-1">
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setActiveDrag({ type: 'question', secIdx, qIdx });
                            }}
                            onDragEnd={() => {
                              setActiveDrag(null);
                              setDropTarget(null);
                            }}
                            className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200/70 transition"
                            title="Arraste para reordenar esta pergunta"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={qIdx === 0}
                              onClick={() => moveQuestion(secIdx, qIdx, 'up')}
                              className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded disabled:opacity-20 transition"
                              title="Mover pergunta para cima"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={qIdx === sec.questions.length - 1}
                              onClick={() => moveQuestion(secIdx, qIdx, 'down')}
                              className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded disabled:opacity-20 transition"
                              title="Mover pergunta para baixo"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={q.question_text}
                            onChange={(e) => {
                              const newSecs = [...sections];
                              newSecs[secIdx].questions[qIdx].question_text = e.target.value;
                              setSections(newSecs);
                            }}
                            placeholder={`Pergunta ${qIdx + 1}`}
                            className="flex-1 font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white ml-1"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newType = e.target.value as Question['type'];
                              const newSecs = [...sections];
                              newSecs[secIdx].questions[qIdx].type = newType;
                              if ((newType === 'single_choice' || newType === 'multiple_choice') && (!q.options || q.options.length === 0)) {
                                newSecs[secIdx].questions[qIdx].options = [
                                  { option_label: 'Opção 1', option_value: 'Opção 1' },
                                  { option_label: 'Opção 2', option_value: 'Opção 2' }
                                ];
                              }
                              setSections(newSecs);
                            }}
                            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
                          >
                            <option value="short_text">Texto Curto</option>
                            <option value="long_text">Texto Longo</option>
                            <option value="number">Número</option>
                            <option value="single_choice">Escolha Única</option>
                            <option value="multiple_choice">Múltipla Escolha</option>
                          </select>

                          <button
                            onClick={() => {
                              const newSecs = [...sections];
                              newSecs[secIdx].questions = newSecs[secIdx].questions.filter((_, i) => i !== qIdx);
                              setSections(newSecs);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Configuração de Aprofundamento por IA e Obrigatoriedade */}
                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/60 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => {
                              const newSecs = [...sections];
                              newSecs[secIdx].questions[qIdx].required = e.target.checked;
                              setSections(newSecs);
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Obrigatória
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          <input
                            type="checkbox"
                            checked={q.ai_deepen}
                            onChange={(e) => {
                              const newSecs = [...sections];
                              newSecs[secIdx].questions[qIdx].ai_deepen = e.target.checked;
                              setSections(newSecs);
                            }}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Sparkles className="w-3.5 h-3.5" /> Aprofundar com IA se relevante
                        </label>

                        {/* Botão para ativar/desativar lógica condicional */}
                        {priorQuestions.length > 0 && (
                          <label className={`flex items-center gap-1.5 cursor-pointer font-medium px-2.5 py-1 rounded-md border transition ${
                            hasCondition ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}>
                            <input
                              type="checkbox"
                              checked={hasCondition}
                              onChange={(e) => {
                                const newSecs = [...sections];
                                if (e.target.checked) {
                                  newSecs[secIdx].questions[qIdx].condition_question_id = priorQuestions[priorQuestions.length - 1].id;
                                  newSecs[secIdx].questions[qIdx].condition_operator = 'equals';
                                  newSecs[secIdx].questions[qIdx].condition_value = priorQuestions[priorQuestions.length - 1].options?.[0]?.option_value || '';
                                } else {
                                  newSecs[secIdx].questions[qIdx].condition_question_id = null;
                                  newSecs[secIdx].questions[qIdx].condition_operator = 'equals';
                                  newSecs[secIdx].questions[qIdx].condition_value = '';
                                }
                                setSections(newSecs);
                              }}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <GitFork className="w-3.5 h-3.5" /> Exibição Condicional
                          </label>
                        )}
                      </div>

                      {/* Bloco de Configuração da Lógica Condicional */}
                      {hasCondition && (
                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs space-y-2.5 mt-2">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                            <GitFork className="w-4 h-4 text-amber-600" />
                            <span>Regra de Exibição Condicional:</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                                Exibir somente se a pergunta:
                              </label>
                              <select
                                value={q.condition_question_id || ''}
                                onChange={(e) => {
                                  const newSecs = [...sections];
                                  const targetQId = e.target.value;
                                  newSecs[secIdx].questions[qIdx].condition_question_id = targetQId;
                                  const targetQ = priorQuestions.find((p) => p.id === targetQId);
                                  if (targetQ && targetQ.options && targetQ.options.length > 0) {
                                    newSecs[secIdx].questions[qIdx].condition_value = targetQ.options[0].option_value;
                                  }
                                  setSections(newSecs);
                                }}
                                className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                              >
                                {priorQuestions.map((pq) => (
                                  <option key={pq.id} value={pq.id}>
                                    {pq.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                                Condição:
                              </label>
                              <select
                                value={q.condition_operator || 'equals'}
                                onChange={(e) => {
                                  const newSecs = [...sections];
                                  newSecs[secIdx].questions[qIdx].condition_operator = e.target.value;
                                  setSections(newSecs);
                                }}
                                className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                              >
                                <option value="equals">For igual a</option>
                                <option value="not_equals">Não for igual a</option>
                                <option value="contains">Conter / Incluir</option>
                                <option value="is_answered">For respondida (qualquer valor)</option>
                                <option value="is_empty">Estiver em branco / não respondida</option>
                              </select>
                            </div>

                            {q.condition_operator !== 'is_answered' && q.condition_operator !== 'is_empty' && (
                              <div>
                                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                                  Valor esperado:
                                </label>
                                {referencedQuestion && referencedQuestion.options && referencedQuestion.options.length > 0 ? (
                                  <select
                                    value={q.condition_value || ''}
                                    onChange={(e) => {
                                      const newSecs = [...sections];
                                      newSecs[secIdx].questions[qIdx].condition_value = e.target.value;
                                      setSections(newSecs);
                                    }}
                                    className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                                  >
                                    <option value="">Selecione uma alternativa...</option>
                                    {referencedQuestion.options.map((opt, oI) => (
                                      <option key={oI} value={opt.option_value}>
                                        {opt.option_label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Digite o valor esperado..."
                                    value={q.condition_value || ''}
                                    onChange={(e) => {
                                      const newSecs = [...sections];
                                      newSecs[secIdx].questions[qIdx].condition_value = e.target.value;
                                      setSections(newSecs);
                                    }}
                                    className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-[11px] text-amber-800 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            Esta pergunta só será exibida no formulário se o paciente selecionar a resposta configurada acima.
                          </p>
                        </div>
                      )}

                      {/* Opções para Múltipla Escolha / Escolha Única com Drag and Drop e Ordenação */}
                      {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                        <div className="space-y-2 pl-3 border-l-2 border-blue-300 mt-3 pt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700">Alternativas da Pergunta:</p>
                            <span className="text-[11px] text-slate-400">
                              {q.options?.length || 0} {q.options?.length === 1 ? 'alternativa' : 'alternativas'} (arraste ou use as setas para reordenar)
                            </span>
                          </div>

                          <div className="space-y-2">
                            {(q.options || []).map((opt, oIdx) => {
                              const isDraggingThisOpt = activeDrag?.type === 'option' && activeDrag.secIdx === secIdx && activeDrag.qIdx === qIdx && activeDrag.optIdx === oIdx;
                              const isDroppingThisOpt = dropTarget?.type === 'option' && dropTarget.secIdx === secIdx && dropTarget.qIdx === qIdx && dropTarget.optIdx === oIdx;

                              return (
                                <div
                                  key={oIdx}
                                  onDragOver={(e) => {
                                    if (activeDrag?.type === 'option' && activeDrag.secIdx === secIdx && activeDrag.qIdx === qIdx) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDropTarget({ type: 'option', secIdx, qIdx, optIdx: oIdx });
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    if (activeDrag?.type === 'option') {
                                      e.stopPropagation();
                                      setDropTarget(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    if (activeDrag?.type === 'option' && activeDrag.secIdx === secIdx && activeDrag.qIdx === qIdx) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      dropOption(secIdx, qIdx, activeDrag.optIdx, oIdx);
                                      setActiveDrag(null);
                                      setDropTarget(null);
                                    }
                                  }}
                                  className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all ${
                                    isDraggingThisOpt
                                      ? 'opacity-30 border-blue-400 bg-blue-50'
                                      : isDroppingThisOpt
                                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                                      : 'border-transparent hover:bg-slate-100/70'
                                  }`}
                                >
                                  {/* Handle de Arraste da Alternativa */}
                                  <div
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      setActiveDrag({ type: 'option', secIdx, qIdx, optIdx: oIdx });
                                    }}
                                    onDragEnd={() => {
                                      setActiveDrag(null);
                                      setDropTarget(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200/70 transition"
                                    title="Arraste para reordenar esta alternativa"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>

                                  {/* Botões Subir/Descer Alternativa */}
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      disabled={oIdx === 0}
                                      onClick={() => moveOption(secIdx, qIdx, oIdx, 'up')}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded disabled:opacity-20 transition"
                                      title="Mover alternativa para cima"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={oIdx === (q.options?.length || 1) - 1}
                                      onClick={() => moveOption(secIdx, qIdx, oIdx, 'down')}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded disabled:opacity-20 transition"
                                      title="Mover alternativa para baixo"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <span className="text-xs font-semibold text-slate-400 w-4 text-center">
                                    {oIdx + 1}.
                                  </span>

                                  <input
                                    type="text"
                                    value={opt.option_label || ''}
                                    placeholder={`Texto da Alternativa ${oIdx + 1}`}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const newSecs = [...sections];
                                      newSecs[secIdx].questions[qIdx].options[oIdx] = {
                                        ...newSecs[secIdx].questions[qIdx].options[oIdx],
                                        option_label: val,
                                        option_value: val
                                      };
                                      setSections(newSecs);
                                    }}
                                    className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-medium flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSecs = [...sections];
                                      newSecs[secIdx].questions[qIdx].options = newSecs[secIdx].questions[qIdx].options.filter((_, i) => i !== oIdx);
                                      setSections(newSecs);
                                    }}
                                    className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 rounded hover:bg-rose-50 transition font-medium"
                                  >
                                    Remover
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => addOption(secIdx, qIdx)}
                            className="text-xs text-blue-600 font-semibold hover:text-blue-800 hover:underline flex items-center gap-1 pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Opção
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => addQuestion(secIdx)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Pergunta nesta Seção
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Legenda de ordenação */}
      <p className="text-[11px] text-slate-400 text-center">
        Arraste pelo ícone <span className="inline-flex align-middle"><GripVertical className="w-3.5 h-3.5" /></span> ou use as setas <span className="inline-flex align-middle"><ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3" /></span> para reordenar seções, perguntas e alternativas.
      </p>
    </div>
  );
}
