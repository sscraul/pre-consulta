import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Lock, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  help_text?: string;
  type: 'short_text' | 'long_text' | 'number' | 'single_choice' | 'multiple_choice';
  required: boolean;
  ai_deepen: boolean;
  condition_question_id?: string | null;
  condition_operator?: string | null;
  condition_value?: string | null;
  options: { option_label: string; option_value: string }[];
}

interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface Template {
  id: string;
  title: string;
  description: string;
  specialty: string;
  sections: Section[];
}

function isQuestionVisible(
  q: Question,
  allQuestionsMap: Map<string, Question>,
  currentAnswers: Record<string, string>,
  visited = new Set<string>()
): boolean {
  if (!q.condition_question_id) return true;
  if (visited.has(q.id)) return false;
  visited.add(q.id);

  const parentQ = allQuestionsMap.get(q.condition_question_id);
  if (!parentQ) return true;

  if (!isQuestionVisible(parentQ, allQuestionsMap, currentAnswers, visited)) {
    return false;
  }

  const parentAnswer = (currentAnswers[q.condition_question_id] || '').trim();
  const operator = q.condition_operator || 'equals';
  const expectedValue = (q.condition_value || '').trim();

  switch (operator) {
    case 'equals':
      return parentAnswer.toLowerCase() === expectedValue.toLowerCase();
    case 'not_equals':
      return parentAnswer.length > 0 && parentAnswer.toLowerCase() !== expectedValue.toLowerCase();
    case 'contains':
      return parentAnswer.toLowerCase().includes(expectedValue.toLowerCase());
    case 'is_answered':
      return parentAnswer.length > 0;
    case 'is_empty':
      return parentAnswer.length === 0;
    default:
      return parentAnswer.toLowerCase() === expectedValue.toLowerCase();
  }
}

export default function PatientForm({ templateId, onBack }: { templateId: string; onBack?: () => void }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState<'consent' | 'form' | 'submitted'>('consent');

  // Dados de identificação do paciente
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientBirthdate, setPatientBirthdate] = useState('');
  const [patientCpf, setPatientCpf] = useState('');

  // Respostas do formulário
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
  const [deepenQuestions, setDeepenQuestions] = useState<Record<string, string>>({});
  const [loadingDeepen, setLoadingDeepen] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/public/templates/${templateId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Não encontrado');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.sections)) {
          data.sections = data.sections.map((sec: any) => ({
            ...sec,
            questions: (sec.questions || []).map((q: any, qIdx: number) => ({
              ...q,
              id: q.id || `q_${qIdx}`,
              options: (q.options || []).map((opt: any, oI: number) => {
                if (typeof opt === 'string') return { option_label: opt, option_value: opt };
                return {
                  option_label: opt.option_label || opt.label || opt.option_value || opt.value || `Opção ${oI + 1}`,
                  option_value: opt.option_value || opt.value || opt.option_label || opt.label || `Opção ${oI + 1}`
                };
              })
            }))
          }));
        }
        setTemplate(data);
      })
      .catch(() => setErrorMsg('Questionário indisponível, em rascunho ou excluído.'));
  }, [templateId]);

  const allQuestionsMap = useMemo(() => {
    const map = new Map<string, Question>();
    if (template?.sections) {
      for (const sec of template.sections) {
        for (const q of sec.questions) {
          map.set(q.id, q);
        }
      }
    }
    return map;
  }, [template]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleDeepenAI = async (question: Question, answerValue: string) => {
    if (!question.ai_deepen || !answerValue || answerValue.length < 3) return;

    setLoadingDeepen((prev) => ({ ...prev, [question.id]: true }));
    try {
      const res = await fetch('/api/public/ai/deepen-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_text: question.question_text, answer: answerValue })
      });
      const data = await res.json();
      if (data.followup_question) {
        setDeepenQuestions((prev) => ({ ...prev, [question.id]: data.followup_question }));
      }
    } catch (e) {
      console.warn('Erro ao aprofundar com IA', e);
    } finally {
      setLoadingDeepen((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      return alert('Nome e Telefone são campos obrigatórios para o seu atendimento.');
    }

    setSubmitting(true);
    setErrorMsg('');

    // Formatar payload final apenas com perguntas visíveis
    const answersList: { question: string; answer: string; followupAnswer?: string }[] = [];

    if (template) {
      for (const sec of template.sections) {
        for (const q of sec.questions) {
          if (!isQuestionVisible(q, allQuestionsMap, answers)) {
            continue;
          }
          const mainAns = answers[q.id];
          if (mainAns) {
            answersList.push({
              question: q.question_text,
              answer: mainAns,
              followupAnswer: followupAnswers[q.id] || undefined
            });
          }
        }
      }
    }

    try {
      const res = await fetch('/api/public/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_birthdate: patientBirthdate,
          patient_cpf: patientCpf,
          answers: answersList
        })
      });

      if (res.ok) {
        setStep('submitted');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Erro ao enviar ficha.');
      }
    } catch (e) {
      setErrorMsg('Falha de conexão ao enviar a ficha.');
    } finally {
      setSubmitting(false);
    }
  };

  if (errorMsg && !template) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Questionário Não Encontrado</h2>
          <p className="text-slate-600 text-sm">{errorMsg}</p>
          <p className="text-xs text-slate-400">Verifique se o questionário está marcado como <strong>"Publicado (Ativo)"</strong> no painel de administração.</p>
          {onBack && (
            <button onClick={onBack} className="text-xs text-blue-600 font-semibold hover:underline">
              Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Header Institucional */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-tight">Pré-Ficha Clínica</h1>
              <p className="text-[11px] text-slate-500">{template.specialty || 'Atendimento Oftalmológico'}</p>
            </div>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg">
              Voltar
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* TELA DE TERMO E CONSENTIMENTO (LGPD) */}
        {step === 'consent' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" /> Pré-Anamnese Inteligente
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{template.title}</h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{template.description}</p>
            </div>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" /> Termo de Consentimento e Privacidade (LGPD)
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Este questionário é um instrumento de apoio pré-consulta. As informações fornecidas são confidenciais e serão encaminhadas diretamente à equipe médica para direcionar seu atendimento.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed font-medium">
                ⚠️ <strong>Aviso Importante:</strong> As perguntas e o resumo gerados por Inteligência Artificial têm caráter estritamente preliminar e não constituem diagnóstico, orientação de tratamento nem substituem a avaliação médica presencial.
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 font-medium leading-normal">
                Li e concordo com o envio das informações para a equipe médica e autorizo o processamento preliminar para fins de pré-atendimento.
              </span>
            </label>

            <button
              disabled={!acceptedTerms}
              onClick={() => setStep('form')}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
            >
              Iniciar Preenchimento <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TELA DE SUCESSO / CONFIRMAÇÃO */}
        {step === 'submitted' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Pré-Ficha Enviada com Sucesso!</h2>
              <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
                Obrigado, <strong>{patientName}</strong>! Suas respostas já foram organizadas e enviadas para o seu médico.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Ao chegar à clínica, informe na recepção que você já preencheu a pré-ficha digital. Desejamos uma excelente consulta!
            </div>
          </div>
        )}

        {/* FORMULÁRIO COMPLETO */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bloco 1: Identificação do Paciente */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">Seus Dados Pessoais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Data de Nascimento / Idade</label>
                  <input
                    type="text"
                    value={patientBirthdate}
                    onChange={(e) => setPatientBirthdate(e.target.value)}
                    placeholder="DD/MM/AAAA ou Idade"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={patientCpf}
                    onChange={(e) => setPatientCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Seções do Formulário */}
            {template.sections.map((sec, secIdx) => {
              const visibleQuestions = sec.questions.filter((q) => isQuestionVisible(q, allQuestionsMap, answers));
              if (visibleQuestions.length === 0) return null;

              return (
                <div key={sec.id || secIdx} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{sec.title}</h3>
                    {sec.description && <p className="text-xs text-slate-500">{sec.description}</p>}
                  </div>

                  <div className="space-y-5">
                    {sec.questions.map((q, qIdx) => {
                      const isVisible = isQuestionVisible(q, allQuestionsMap, answers);
                      if (!isVisible) return null;

                      return (
                        <div key={q.id || qIdx} className="space-y-2 pt-2 first:pt-0">
                          <label className="block text-xs font-bold text-slate-800">
                            {q.question_text} {q.required && <span className="text-rose-500">*</span>}
                          </label>
                          {q.help_text && <p className="text-[11px] text-slate-500">{q.help_text}</p>}

                          {q.type === 'short_text' && (
                            <input
                              type="text"
                              required={q.required}
                              value={answers[q.id] || ''}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              onBlur={(e) => handleDeepenAI(q, e.target.value)}
                              placeholder="Sua resposta..."
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                            />
                          )}

                          {q.type === 'long_text' && (
                            <textarea
                              required={q.required}
                              rows={3}
                              value={answers[q.id] || ''}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              onBlur={(e) => handleDeepenAI(q, e.target.value)}
                              placeholder="Descreva detalhadamente..."
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                            />
                          )}

                          {q.type === 'number' && (
                            <input
                              type="number"
                              required={q.required}
                              value={answers[q.id] || ''}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              onBlur={(e) => handleDeepenAI(q, e.target.value)}
                              placeholder="0"
                              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-900"
                            />
                          )}

                          {q.type === 'single_choice' && (
                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => (
                                <label key={oIdx} className="flex items-center gap-3 text-xs font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                                  <input
                                    type="radio"
                                    name={`q_${q.id}`}
                                    required={q.required && !answers[q.id]}
                                    value={opt.option_value}
                                    checked={answers[q.id] === opt.option_value}
                                    onChange={(e) => {
                                      handleAnswerChange(q.id, e.target.value);
                                      handleDeepenAI(q, e.target.value);
                                    }}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-slate-900">{opt.option_label}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.type === 'multiple_choice' && (
                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                const current = answers[q.id] ? answers[q.id].split(', ') : [];
                                const isChecked = current.includes(opt.option_value);
                                return (
                                  <label key={oIdx} className="flex items-center gap-3 text-xs font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                      type="checkbox"
                                      value={opt.option_value}
                                      checked={isChecked}
                                      onChange={(e) => {
                                        let updated: string[];
                                        if (e.target.checked) {
                                          updated = [...current, opt.option_value];
                                        } else {
                                          updated = current.filter((v) => v !== opt.option_value);
                                        }
                                        const valStr = updated.join(', ');
                                        handleAnswerChange(q.id, valStr);
                                        handleDeepenAI(q, valStr);
                                      }}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-slate-900">{opt.option_label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* Loading de aprofundamento da IA */}
                          {loadingDeepen[q.id] && (
                            <p className="text-xs text-blue-600 flex items-center gap-1.5 animate-pulse pt-1 font-medium">
                              <Sparkles className="w-3.5 h-3.5" /> Analisando se são necessários mais detalhes...
                            </p>
                          )}

                          {/* Pergunta Complementar Dinâmica da IA */}
                          {deepenQuestions[q.id] && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 p-3.5 rounded-xl space-y-2">
                              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-blue-600" /> {deepenQuestions[q.id]}
                              </p>
                              <input
                                type="text"
                                placeholder="Sua resposta em poucas palavras..."
                                value={followupAnswers[q.id] || ''}
                                onChange={(e) => setFollowupAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full text-xs border border-blue-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {errorMsg && <p className="text-xs font-semibold text-rose-600 text-center">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base rounded-2xl transition shadow-lg shadow-blue-500/20"
            >
              {submitting ? 'Enviando Ficha...' : 'Concluir e Enviar Pré-Anamnese'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
