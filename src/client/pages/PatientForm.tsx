import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Lock, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

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
  section_title?: string;
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

function getParentAnswerValues(
  parentQ: Question | undefined,
  currentAnswers: Record<string, string>
): string[] {
  if (!parentQ) return [];
  const raw = (currentAnswers[parentQ.id] || '').trim();
  if (!raw) return [];
  // Tenta JSON.parse primeiro (novo formato robusto para múltipla escolha)
  // Fallback para split legado (dados antigos usavam ", ")
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((v: any) => typeof v === 'string' && v.length > 0);
  } catch { /* não é JSON, continua com fallback */ }
  return raw.split(', ').map((v) => v.trim()).filter((v) => v.length > 0);
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

  const values = getParentAnswerValues(parentQ, currentAnswers);
  const hasAnswer = values.length > 0;
  const operator = q.condition_operator || 'equals';
  const expectedValue = (q.condition_value || '').trim();
  const expectedLower = expectedValue.toLowerCase();

  switch (operator) {
    case 'equals':
      // Para múltipla escolha: basta um dos valores selecionados bater com o esperado
      return values.some((v) => v.toLowerCase() === expectedLower);
    case 'not_equals':
      // A pergunta aparece se NENHUM dos valores selecionados for o esperado
      return hasAnswer && !values.some((v) => v.toLowerCase() === expectedLower);
    case 'contains':
      return values.some((v) => v.toLowerCase().includes(expectedLower));
    case 'is_answered':
      return hasAnswer;
    case 'is_empty':
      return !hasAnswer;
    default:
      return values.some((v) => v.toLowerCase() === expectedLower);
  }
}

export default function PatientForm({ templateId, onBack }: { templateId: string; onBack?: () => void }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState<'consent' | 'form' | 'submitted'>('consent');

  // Respostas indexadas por ID da pergunta
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
  const [deepenQuestions, setDeepenQuestions] = useState<Record<string, string>>({});
  const [loadingDeepen, setLoadingDeepen] = useState<Record<string, boolean>>({});

  const [submittedPatientName, setSubmittedPatientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estado do carrossel de perguntas
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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
        setCurrentQIndex(0);
      })
      .catch(() => setErrorMsg('Questionário indisponível, em rascunho ou excluído.'));
  }, [templateId]);

  const allQuestionsMap = useMemo(() => {
    const map = new Map<string, Question>();
    if (template?.sections) {
      for (const sec of template.sections) {
        for (const q of sec.questions) {
          map.set(q.id, { ...q, section_title: sec.title });
        }
      }
    }
    return map;
  }, [template]);

  // Lista linear de todas as perguntas visíveis na ordem correta
  const visibleQuestions = useMemo(() => {
    const list: (Question & { section_title: string; section_desc?: string })[] = [];
    if (!template?.sections) return list;

    for (const sec of template.sections) {
      for (const q of sec.questions) {
        if (isQuestionVisible(q, allQuestionsMap, answers)) {
          list.push({ ...q, section_title: sec.title, section_desc: sec.description });
        }
      }
    }
    return list;
  }, [template, allQuestionsMap, answers]);

  // Garantir que currentQIndex não fique fora dos limites quando questions mudam
  useEffect(() => {
    if (currentQIndex >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentQIndex(Math.max(0, visibleQuestions.length - 1));
    }
  }, [visibleQuestions.length, currentQIndex]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleDeepenAI = useCallback(async (question: Question, answerValue: string) => {
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
  }, []);

  const goNext = () => {
    if (currentQIndex < visibleQuestions.length - 1) {
      setSlideDirection('right');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQIndex((prev) => prev + 1);
        setSlideDirection(null);
        setTimeout(() => setIsAnimating(false), 50);
      }, 250);
    }
  };

  const goPrev = () => {
    if (currentQIndex > 0) {
      setSlideDirection('left');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQIndex((prev) => prev - 1);
        setSlideDirection(null);
        setTimeout(() => setIsAnimating(false), 50);
      }, 250);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template) return;

    // Validar se a pergunta atual está respondida (se obrigatória)
    const currentQ = visibleQuestions[currentQIndex];
    if (currentQ && currentQ.required && !(answers[currentQ.id] || '').trim()) {
      return alert(`Por favor, responda à pergunta obrigatória: "${currentQ.question_text}"`);
    }

    setSubmitting(true);
    setErrorMsg('');

    // Coletar todas as respostas visíveis
    const answersList: { question: string; answer: string; followupAnswer?: string }[] = [];
    let detectedName = '';
    let detectedPhone = '';
    let detectedBirthdate = '';
    let detectedCpf = '';

    for (const sec of template.sections) {
      for (const q of sec.questions) {
        if (!isQuestionVisible(q, allQuestionsMap, answers)) continue;
        const mainAns = answers[q.id];
        if (mainAns && mainAns.trim()) {
          answersList.push({
            question: q.question_text,
            answer: mainAns.trim(),
            followupAnswer: followupAnswers[q.id]?.trim() || undefined
          });

          const qL = q.question_text.toLowerCase();
          if (!detectedName && (qL.includes('nome') || qL.includes('paciente'))) detectedName = mainAns.trim();
          if (!detectedPhone && (qL.includes('telefone') || qL.includes('whatsapp') || qL.includes('celular') || qL.includes('contato'))) detectedPhone = mainAns.trim();
          if (!detectedBirthdate && (qL.includes('nasc') || qL.includes('idade'))) detectedBirthdate = mainAns.trim();
          if (!detectedCpf && qL.includes('cpf')) detectedCpf = mainAns.trim();
        }
      }
    }

    if (!detectedName && answersList.length > 0) detectedName = answersList[0].answer;
    setSubmittedPatientName(detectedName || 'Paciente');

    try {
      const res = await fetch('/api/public/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          patient_name: detectedName,
          patient_phone: detectedPhone,
          patient_birthdate: detectedBirthdate,
          patient_cpf: detectedCpf,
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

  const currentQ = visibleQuestions[currentQIndex];
  const totalQuestions = visibleQuestions.length;
  const isFirst = currentQIndex === 0;
  const isLast = currentQIndex === totalQuestions - 1;
  const progress = totalQuestions > 0 ? ((currentQIndex + 1) / totalQuestions) * 100 : 0;

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
        {/* TELA DE TERMO E CONSENTIMENTO */}
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

        {/* TELA DE SUCESSO */}
        {step === 'submitted' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-6">
            {/* Foto do Dr. Raul Camargo */}
            <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36">
              <div className="absolute inset-0 bg-blue-100 rounded-full scale-110 blur-md opacity-60"></div>
              <img
                src="/assets/dr-raul-camargo.jpg"
                alt="Dr. Raul Camargo"
                className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900">
                {submittedPatientName ? <>Muito obrigado, {submittedPatientName}!</> : <>Pré-Ficha Enviada!</>}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Suas respostas foram organizadas e já estão com nossa equipe médica. Aguarde com tranquilidade — você será chamado para sua consulta Oftalmológica em breve.
              </p>
            </div>

            {/* Mensagem de conforto */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 max-w-md mx-auto space-y-3">
              <Sparkles className="w-6 h-6 text-blue-500 mx-auto" />
              <p className="text-sm text-blue-900 font-medium leading-relaxed italic">
                "Aqui cuidamos de você com dedicação e carinho. Sua saúde ocular é nossa prioridade, e estamos prontos para oferecer o melhor atendimento. Fique à vontade!"
              </p>
              <p className="text-xs text-blue-700 font-semibold">
                — Dr. Raul Camargo
              </p>
            </div>

            {/* Card de conforto — café e suco */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 max-w-md mx-auto space-y-3 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-2xl">
                <span>☕</span>
                <span>🧃</span>
                <span>🛋️</span>
              </div>
              <p className="text-sm text-amber-900 font-bold leading-relaxed">
                Fique à vontade!
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Enquanto aguarda sua consulta Oftalmológica, aproveite para relaxar na recepção. <strong>Sirva-se de um café quentinho ou um suco refrescante</strong> — está tudo à sua disposição. ⏳✨
              </p>
            </div>

            <div className="text-xs text-slate-500 max-w-md mx-auto space-y-1">
              <p className="font-medium text-slate-700">
                💡 Dica: Ao chegar à recepção, informe que já preencheu a pré-ficha digital.
              </p>
              <p>Desejamos uma excelente consulta! 👁️💙</p>
            </div>
          </div>
        )}

        {/* FORMULÁRIO EM CARROSSEL DE PERGUNTAS */}
        {step === 'form' && (
          <div className="space-y-6">
            {/* Barra de progresso */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{template.title}</span>
                <span className="font-bold text-blue-600">
                  {currentQIndex + 1} / {totalQuestions}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                {currentQ?.section_title || ''}
              </p>
            </div>

            {/* Card da pergunta com animação de slide */}
            {currentQ && (
              <div className="relative overflow-hidden">
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isAnimating
                      ? slideDirection === 'right'
                        ? 'opacity-0 -translate-x-10'
                        : slideDirection === 'left'
                        ? 'opacity-0 translate-x-10'
                        : ''
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
                    {/* Cabeçalho da pergunta */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                        {currentQ.section_title}
                      </p>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {currentQ.question_text}
                        {currentQ.required && <span className="text-rose-500 ml-1">*</span>}
                      </h3>
                      {currentQ.help_text && (
                        <p className="text-xs text-slate-500">{currentQ.help_text}</p>
                      )}
                    </div>

                    {/* Campo de resposta */}
                    <div className="space-y-3">
                      {currentQ.type === 'short_text' && (
                        <input
                          type="text"
                          required={currentQ.required}
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          onBlur={(e) => handleDeepenAI(currentQ, e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition"
                          autoFocus
                        />
                      )}

                      {currentQ.type === 'long_text' && (
                        <textarea
                          required={currentQ.required}
                          rows={4}
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          onBlur={(e) => handleDeepenAI(currentQ, e.target.value)}
                          placeholder="Descreva detalhadamente..."
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition resize-none"
                          autoFocus
                        />
                      )}

                      {currentQ.type === 'number' && (
                        <input
                          type="number"
                          required={currentQ.required}
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          onBlur={(e) => handleDeepenAI(currentQ, e.target.value)}
                          placeholder="0"
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition"
                          autoFocus
                        />
                      )}

                      {currentQ.type === 'single_choice' && (
                        <div className="space-y-2.5">
                          {currentQ.options.map((opt, oIdx) => {
                            const isSelected = answers[currentQ.id] === opt.option_value;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => {
                                  handleAnswerChange(currentQ.id, opt.option_value);
                                  handleDeepenAI(currentQ, opt.option_value);
                                }}
                                className={`w-full text-left flex items-center gap-3 text-sm font-medium p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <span>{opt.option_label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {currentQ.type === 'multiple_choice' && (
                        <div className="space-y-2.5">
                          {currentQ.options.map((opt, oIdx) => {
                            let currentVals: string[] = [];
                            try {
                              const parsed = answers[currentQ.id] ? JSON.parse(answers[currentQ.id]) : [];
                              if (Array.isArray(parsed)) currentVals = parsed;
                            } catch { /* fallback para formato legado */ }
                            // Se não conseguiu parsear como array (dado legado), tenta split
                            if (currentVals.length === 0 && answers[currentQ.id]) {
                              currentVals = answers[currentQ.id].split(', ').filter((v) => v.length > 0);
                            }
                            const isSelected = currentVals.includes(opt.option_value);
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => {
                                  let updated: string[];
                                  if (isSelected) {
                                    updated = currentVals.filter((v) => v !== opt.option_value);
                                  } else {
                                    updated = [...currentVals, opt.option_value];
                                  }
                                  const valStr = JSON.stringify(updated);
                                  handleAnswerChange(currentQ.id, valStr);
                                  handleDeepenAI(currentQ, valStr);
                                }}
                                className={`w-full text-left flex items-center gap-3 text-sm font-medium p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span>{opt.option_label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Loading de aprofundamento da IA */}
                      {loadingDeepen[currentQ.id] && (
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 animate-pulse pt-2 font-medium">
                          <Sparkles className="w-3.5 h-3.5" /> Analisando se são necessários mais detalhes...
                        </p>
                      )}

                      {/* Pergunta Complementar Dinâmica da IA */}
                      {deepenQuestions[currentQ.id] && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
                          <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-600" /> {deepenQuestions[currentQ.id]}
                          </p>
                          <input
                            type="text"
                            placeholder="Sua resposta em poucas palavras..."
                            value={followupAnswers[currentQ.id] || ''}
                            onChange={(e) => setFollowupAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                            className="w-full text-sm border border-blue-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-xs font-semibold text-rose-600 text-center">{errorMsg}</p>}

            {/* Botões de navegação */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirst || isAnimating}
                className="flex-1 py-3.5 bg-white border-2 border-slate-200 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || isAnimating}
                  className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {submitting ? 'Enviando...' : 'Concluir e Enviar'} <CheckCircle2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isAnimating}
                  className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botão de voltar ao início (opcional) */}
            {!isFirst && (
              <button
                type="button"
                onClick={() => {
                  setSlideDirection('left');
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentQIndex(0);
                    setSlideDirection(null);
                    setTimeout(() => setIsAnimating(false), 50);
                  }, 250);
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 font-medium transition"
              >
                ← Reiniciar do início
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
