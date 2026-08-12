import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const gemini = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

async function generateJson<T>(systemInstruction: string, prompt: string): Promise<T | null> {
  if (!gemini) return null;

  try {
    const response = await gemini.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn(`Falha no Gemini (${geminiModel}); utilizando fallback local.`, error);
    return null;
  }
}

export async function generateTemplateWithAI(promptText: string) {
  const result = await generateJson<{
    title: string;
    description: string;
    specialty: string;
    sections: Array<{
      title: string;
      description?: string;
      questions: Array<{
        question_text: string;
        type: 'short_text' | 'long_text' | 'number' | 'single_choice' | 'multiple_choice';
        required: boolean;
        ai_deepen: boolean;
        options?: string[];
      }>;
    }>;
  }>(
    `Você é um assistente de pré-anamnese clínica para oftalmologia. Crie questionários auxiliares, claros e objetivos. Nunca diagnostique, prescreva ou tome decisões clínicas. Retorne apenas JSON válido no formato: {
  "title": "string",
  "description": "string",
  "specialty": "string",
  "sections": [{
    "title": "string",
    "description": "string",
    "questions": [{
      "question_text": "string",
      "type": "short_text|long_text|number|single_choice|multiple_choice",
      "required": true,
      "ai_deepen": false,
      "options": ["string"]
    }]
  }]
}. Use options apenas para perguntas de escolha. Marque ai_deepen como true somente onde uma resposta relevante mereça investigação complementar.`,
    `Monte um template editável de pré-consulta com base neste pedido: ${promptText}`,
  );

  if (result) return result;

  return generateTemplateFallback(promptText);
}

export async function generateDeepenQuestionWithAI(questionText: string, patientAnswer: string) {
  const result = await generateJson<{ followup_question: string | null }>(
    `Você é um assistente de anamnese médica. Gere UMA pergunta complementar curta, neutra e empática para esclarecer uma resposta clinicamente relevante. Não diagnostique, não prescreva e não assuste o paciente. Retorne somente JSON válido no formato { "followup_question": "string ou null" }.`,
    `Pergunta original: ${questionText}\nResposta do paciente: ${patientAnswer}`,
  );

  if (result?.followup_question) return result.followup_question;
  if (patientAnswer.toLowerCase().includes('sim') || patientAnswer.length > 5) {
    return `Poderia detalhar melhor como foi o diagnóstico ou a data aproximada de "${patientAnswer}"?`;
  }
  return null;
}

export async function generatePreAnamneseWithAI(
  patientInfo: { name: string; birthdate?: string; phone: string },
  answersList: { question: string; answer: string; followupAnswer?: string }[],
) {
  const formattedAnswers = answersList
    .map((answer) => `- ${answer.question}: ${answer.answer}${answer.followupAnswer ? ` (Detalhamento: ${answer.followupAnswer})` : ''}`)
    .join('\n');

  const result = await generateJson<{ patient_summary: string; pre_anamnese: string }>(
    `Você é um médico sintetizador de pré-anamnese. Organize fielmente as informações declaradas, sem inventar dados, diagnosticar, prescrever ou sugerir condutas. Retorne somente JSON válido no formato { "patient_summary": "2-3 frases", "pre_anamnese": "texto profissional estruturado para copiar no prontuário" }. Inclua ao final da pré-anamnese: "Material auxiliar gerado por IA, sujeito à revisão e confirmação médica."`,
    `Paciente: ${patientInfo.name}\nData de nascimento: ${patientInfo.birthdate || 'não informado'}\nTelefone: ${patientInfo.phone}\n\nRespostas declaradas:\n${formattedAnswers}`,
  );

  if (result) return result;
  return generatePreAnamneseFallback(patientInfo, answersList);
}

function generateTemplateFallback(promptText: string) {
  const promptLower = promptText.toLowerCase();
  let title = 'Pré-consulta Oftalmológica';
  let specialty = 'Oftalmologia Geral';

  if (promptLower.includes('refrativa')) {
    title = 'Pré-consulta para Cirurgia Refrativa (LASIK/PRK)';
    specialty = 'Cirurgia Refrativa';
  } else if (promptLower.includes('catarata')) {
    title = 'Pré-consulta para Avaliação de Catarata';
    specialty = 'Catarata';
  } else if (promptLower.includes('glaucoma')) {
    title = 'Pré-consulta de Acompanhamento de Glaucoma';
    specialty = 'Glaucoma';
  }

  return {
    title,
    description: `Questionário pré-consulta gerado para ${specialty}. Responda para agilizar seu atendimento.`,
    specialty,
    sections: [
      {
        title: 'Identificação do Paciente',
        description: 'Seus dados pessoais para contato e identificação.',
        questions: [
          { question_text: 'Nome Completo', type: 'short_text', required: true, ai_deepen: false },
          { question_text: 'Data de Nascimento', type: 'short_text', required: true, ai_deepen: false },
          { question_text: 'Telefone / WhatsApp', type: 'short_text', required: true, ai_deepen: false },
          { question_text: 'Profissão', type: 'short_text', required: false, ai_deepen: false },
        ],
      },
      {
        title: 'Queixa Principal e Histórico',
        description: 'Descreva os motivos da consulta.',
        questions: [
          { question_text: 'Qual o principal motivo da sua consulta hoje?', type: 'long_text', required: true, ai_deepen: true },
          { question_text: 'Há quanto tempo apresenta esses sintomas?', type: 'single_choice', required: true, ai_deepen: false, options: ['Menos de 1 semana', 'Entre 1 e 4 semanas', 'Mais de 1 mês', 'Mais de 6 meses'] },
          { question_text: 'Já realizou alguma cirurgia ocular prévia?', type: 'single_choice', required: true, ai_deepen: true, options: ['Não', 'Sim (Cirurgia Refrativa)', 'Sim (Catarata)', 'Sim (Outras)'] },
        ],
      },
      {
        title: 'Antecedentes e Medicamentos',
        description: 'Histórico de saúde e tratamentos em uso.',
        questions: [
          { question_text: 'Possui alguma doença sistêmica?', type: 'multiple_choice', required: false, ai_deepen: true, options: ['Diabetes', 'Hipertensão', 'Glaucoma Familiar', 'Alergias Medicamentosas'] },
          { question_text: 'Faz uso contínuo de colírios ou medicamentos?', type: 'long_text', required: false, ai_deepen: false },
        ],
      },
    ],
  };
}

function generatePreAnamneseFallback(
  patientInfo: { name: string; birthdate?: string; phone: string },
  answersList: { question: string; answer: string; followupAnswer?: string }[],
) {
  const answerLines = answersList
    .map((answer) => `• ${answer.question}: ${answer.answer}${answer.followupAnswer ? ` -> ${answer.followupAnswer}` : ''}`)
    .join('\n');
  const preAnamnese = `=== PRÉ-ANAMNESE CLÍNICA ===\nPaciente: ${patientInfo.name}\nData de Nascimento: ${patientInfo.birthdate || 'Não informado'} | Tel: ${patientInfo.phone}\n\nRESPOSTAS DECLARADAS\n${answerLines}\n\nMaterial auxiliar gerado por IA, sujeito à revisão e confirmação médica.`;

  return {
    patient_summary: `Paciente ${patientInfo.name} respondeu à pré-consulta. Queixa e histórico conforme respostas declaradas no formulário.`,
    pre_anamnese: preAnamnese,
  };
}
