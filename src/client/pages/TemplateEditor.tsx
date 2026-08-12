import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, ArrowLeft, Save, HelpCircle, Layers, CheckCircle2, GripVertical } from 'lucide-react';

interface Option {
  id?: string;
  option_label: string;
  option_value: string;
}

interface Question {
  id?: string;
  question_text: string;
  help_text?: string;
  type: 'short_text' | 'long_text' | 'number' | 'single_choice' | 'multiple_choice';
  required: boolean;
  ai_deepen: boolean;
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

export default function TemplateEditor({ templateId, onSaved, onCancel }: TemplateEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('Oftalmologia Geral');
  const [status, setStatus] = useState('active');
  const [sections, setSections] = useState<Section[]>([]);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  useEffect(() => {
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setSpecialty(data.specialty || 'Oftalmologia Geral');
          setStatus(data.status || 'active');
          setSections(data.sections || []);
        });
    } else {
      // Seção padrão inicial
      setSections([
        {
          title: 'Queixa Principal e Sintomas',
          description: 'Descreva os motivos da consulta',
          questions: [
            {
              question_text: 'Qual o principal sintoma que o traz ao consultório?',
              type: 'long_text',
              required: true,
              ai_deepen: true,
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
      setSections(data.sections || []);
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
      question_text: '',
      type: 'short_text',
      required: false,
      ai_deepen: false,
      options: []
    });
    setSections(newSecs);
  };

  const onDragStart = (secIdx: number) => {
    setDragIdx(secIdx);
  };

  const onDragOver = (e: React.DragEvent, secIdx: number) => {
    e.preventDefault();
    setDropIdx(secIdx);
  };

  const onDragLeave = () => {
    setDropIdx(null);
  };

  const onDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDropIdx(null);
      return;
    }
    const newSections = [...sections];
    const [moved] = newSections.splice(dragIdx, 1);
    newSections.splice(targetIdx, 0, moved);
    setSections(newSections);
    setDragIdx(null);
    setDropIdx(null);
  };

  const addOption = (secIdx: number, qIdx: number) => {
    const newSecs = [...sections];
    newSecs[secIdx].questions[qIdx].options.push({
      option_label: `Opção ${newSecs[secIdx].questions[qIdx].options.length + 1}`,
      option_value: `Opção ${newSecs[secIdx].questions[qIdx].options.length + 1}`
    });
    setSections(newSecs);
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

        {sections.map((sec, secIdx) => (
          <div
            key={secIdx}
            draggable
            onDragStart={() => onDragStart(secIdx)}
            onDragOver={(e) => onDragOver(e, secIdx)}
            onDragLeave={onDragLeave}
            onDrop={() => onDrop(secIdx)}
            className={`bg-white rounded-2xl border p-6 space-y-6 shadow-sm transition-all cursor-default ${
              dragIdx === secIdx ? 'opacity-40 border-blue-300 border-2' : dropIdx === secIdx ? 'border-blue-400 border-2 bg-blue-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing mt-1" title="Arraste para reordenar">
                <GripVertical className="w-5 h-5" />
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
              {sec.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      value={q.question_text}
                      onChange={(e) => {
                        const newSecs = [...sections];
                        newSecs[secIdx].questions[qIdx].question_text = e.target.value;
                        setSections(newSecs);
                      }}
                      placeholder={`Pergunta ${qIdx + 1}`}
                      className="flex-1 font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    />

                    <div className="flex items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newSecs = [...sections];
                          newSecs[secIdx].questions[qIdx].type = e.target.value as any;
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
                  <div className="flex items-center gap-6 pt-2 border-t border-slate-200/60 text-xs">
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
                  </div>

                  {/* Opções para Múltipla Escolha / Escolha Única */}
                  {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                    <div className="space-y-2 pl-2 border-l-2 border-slate-300 mt-2">
                      <p className="text-xs font-semibold text-slate-600">Alternativas da Pergunta:</p>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.option_label}
                            onChange={(e) => {
                              const newSecs = [...sections];
                              newSecs[secIdx].questions[qIdx].options[oIdx].option_label = e.target.value;
                              newSecs[secIdx].questions[qIdx].options[oIdx].option_value = e.target.value;
                              setSections(newSecs);
                            }}
                            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white flex-1"
                          />
                          <button
                            onClick={() => {
                              const newSecs = [...sections];
                              newSecs[secIdx].questions[qIdx].options = newSecs[secIdx].questions[qIdx].options.filter((_, i) => i !== oIdx);
                              setSections(newSecs);
                            }}
                            className="text-rose-500 text-xs px-1 hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(secIdx, qIdx)}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        + Adicionar Opção
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => addQuestion(secIdx)}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Pergunta nesta Seção
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Legenda de ordenação */}
      <p className="text-[11px] text-slate-400 text-center">
        Arraste as seções pelo ícone <span className="inline-flex align-middle"><GripVertical className="w-3.5 h-3.5" /></span> para reordenar o formulário.
      </p>
    </div>
  );
}
