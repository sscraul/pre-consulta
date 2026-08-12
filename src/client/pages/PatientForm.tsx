import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Lock, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  help_text?: string;
  type: 'short_text' | 'long_text' | 'number' | 'single_choice' | 'multiple_choice';
  required: boolean;
  ai_deepen: boolean;
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
      .then((res) => res.json())
      .then((data) => setTemplate(data))
      .catch((e) => setErrorMsg('Questionário indisponível ou excluído.'));
  }, [templateId]);

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

    // Formatar payload final
    const answersList: { question: string; answer: string; followupAnswer?: string }[] = [];

    if (template) {
      for (const sec of template.sections) {
        for (const q of sec.questions) {
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
          <h2 className="text-xl font-bold text-slate-900">Questionário Indisponível</h2>
          <p className="text-slate-600 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Carregando formulário...</div>;
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pré-Anamnese Enviada!</h2>
            <p className="text-slate-600 text-sm mt-2">
              Obrigado, <span className="font-semibold text-slate-800">{patientName}</span>. Suas informações foram enviadas com segurança ao consultório.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 text-left space-y-1">
            <p className="font-semibold text-slate-700">O que acontece agora?</p>
            <p>O médico revisará suas respostas antes ou durante o seu atendimento. Você já pode fechar esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cabeçalho do Consultório */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            <Lock className="w-3.5 h-3.5" /> Formulário Seguro de Pré-Atendimento
          </div>
          <h1 className="text-2xl font-bold">{template.title}</h1>
          <p className="text-blue-100 text-xs max-w-lg mx-auto">{template.description}</p>
        </div>

        {/* PASSO 1: TERMO DE CONSENTIMENTO E LGPD */}
        {step === 'consent' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-2xl border border-blue-100 text-slate-800">
              <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-semibold text-slate-900 text-sm">Privacidade e Proteção de Dados (LGPD)</p>
                <p>
                  Suas respostas serão utilizadas exclusivamente pela equipe médica para personalizar e agilizar a sua consulta.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
              <p className="font-bold flex items-center gap-1 text-amber-800">
                <Sparkles className="w-4 h-4 text-amber-600" /> Aviso Importante sobre Inteligência Artificial:
              </p>
              <p className="leading-relaxed">
                Este formulário utiliza assistente de IA exclusivamente para auxiliar na organização das perguntas e na sintaxe do resumo. A IA <strong>não realiza diagnósticos, tratamentos ou decisões médicas</strong>. Toda conduta é decidida pessoalmente pelo profissional responsável.
              </p>
            </div>

            <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                Concordo com o tratamento de meus dados pessoais e de saúde para fins exclusivos de pré-anamnese médica, conforme os Termos de Privacidade acima.
              </span>
            </label>

            <button
              disabled={!acceptedTerms}
              onClick={() => setStep('form')}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
            >
              Iniciar Preenchimento <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASSO 2: FORMULÁRIO DE IDENTIFICAÇÃO E PERGUNTAS */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Bloco Obrigatório de Identificação */}
            <div className="space-y-4 border-b border-slate-200 pb-6">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                Dados de Identificação do Paciente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="(00) 90000-0000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Data de Nascimento</label>
                  <input
                    type="date"
                    value={patientBirthdate}
                    onChange={(e) => setPatientBirthdate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Blocos de Seções de Perguntas */}
            {template.sections.map((sec, secIdx) => (
              <div key={sec.id || secIdx} className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {secIdx + 2}
                    </span>
                    {sec.title}
                  </h3>
                  {sec.description && <p className="text-xs text-slate-500 mt-1">{sec.description}</p>}
                </div>

                <div className="space-y-6">
                  {sec.questions.map((q) => (
                    <div key={q.id} className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                      <label className="block text-sm font-semibold text-slate-800">
                        {q.question_text} {q.required && <span className="text-rose-500">*</span>}
                      </label>
                      {q.help_text && <p className="text-xs text-slate-500">{q.help_text}</p>}

                      {/* Renderização conforme tipo de pergunta */}
                      {q.type === 'short_text' && (
                        <input
                          type="text"
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          onBlur={(e) => handleDeepenAI(q, e.target.value)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                        />
                      )}

                      {q.type === 'long_text' && (
                        <textarea
                          required={q.required}
                          rows={3}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          onBlur={(e) => handleDeepenAI(q, e.target.value)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                        />
                      )}

                      {q.type === 'single_choice' && (
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <label key={oIdx} className="flex items-center gap-3 text-xs font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                required={q.required}
                                value={opt.option_value}
                                checked={answers[q.id] === opt.option_value}
                                onChange={(e) => {
                                  handleAnswerChange(q.id, e.target.value);
                                  handleDeepenAI(q, e.target.value);
                                }}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              {opt.option_label}
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <label key={oIdx} className="flex items-center gap-3 text-xs font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                value={opt.option_value}
                                onChange={(e) => {
                                  const current = answers[q.id] ? answers[q.id].split(', ') : [];
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
                              {opt.option_label}
                            </label>
                          ))}
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
                  ))}
                </div>
              </div>
            ))}

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
