import { config } from 'dotenv';
config();

const baseUrl = process.env.API_URL || 'http://127.0.0.1:3001';

async function post(path, payload, cookie) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`${path}: resposta não-JSON (${response.status})`); }
  if (!response.ok) throw new Error(`${path}: ${body.error || response.status}`);
  return body;
}

const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
});
if (!loginResponse.ok) throw new Error(`Login: ${loginResponse.status}`);
const cookie = loginResponse.headers.get('set-cookie')?.split(';')[0];

const template = await post('/api/ai/generate-template', { prompt: 'Pré-consulta para catarata' }, cookie);
if (!template.title || !template.sections?.length) throw new Error('Template sem estrutura válida');

const deepen = await post('/api/public/ai/deepen-question', {
  question_text: 'Já realizou cirurgia ocular?',
  answer: 'Sim, cirurgia de miopia em 2018',
});
if (!deepen.followup_question) throw new Error('Aprofundamento sem pergunta');

console.log('Gemini OK:', template.title, '| aprofundamento OK');
