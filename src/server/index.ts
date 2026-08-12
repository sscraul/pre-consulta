import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { db } from './db';
import { generateTemplateWithAI, generateDeepenQuestionWithAI, generatePreAnamneseWithAI } from './aiService';
import { cryptoNativeId } from './utils';
import { hashPassword, verifyPassword, createSession, destroySession, authRequired, cookieOptions } from './auth';

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.PUBLIC_ORIGIN || true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.disable('x-powered-by');
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.path !== '/health' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.originalUrl}`);
    return;
  }
  next();
});
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ------------------------------------------------------------
// Bootstrap do usuário admin a partir do .env
// ------------------------------------------------------------
function bootstrapAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const existing: any = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  if (existing) {
    if (!verifyPassword(password, existing.password_hash)) {
      db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
        hashPassword(password),
        existing.id,
      );
      db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(existing.id);
      console.log('Senha do admin atualizada a partir do .env.');
    }
    return;
  }
  db.prepare(`INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)`).run(
    cryptoNativeId(),
    username,
    hashPassword(password),
  );
  console.log('Usuário admin criado a partir do .env.');
}

bootstrapAdmin();

// Limpar sessões expiradas periodicamente
setInterval(() => {
  db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).run(new Date().toISOString());
}, 60 * 60 * 1000);

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde um minuto.' },
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    return;
  }

  const user: any = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    return;
  }

  const token = createSession(user.id);
  res.cookie('sid', token, cookieOptions());
  res.json({ message: 'Login realizado.' });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies?.sid;
  if (token) destroySession(token);
  res.clearCookie('sid', cookieOptions());
  res.json({ message: 'Logout realizado.' });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: (req as any).user });
});

// ------------------------------------------------------------
// ROTAS PÚBLICAS (paciente)
// ------------------------------------------------------------
app.get('/api/public/templates/:id', (req, res) => {
  try {
    const templateId = req.params.id;
    const template: any = db.prepare(`SELECT * FROM templates WHERE id = ?`).get(templateId);
    if (!template) return res.status(404).json({ error: 'Formulário indisponível ou desativado.' });

    if (template.status !== 'active') {
      return res.status(403).json({ error: 'Este questionário ainda está em modo Rascunho. Altere o status para "Publicado (Ativo)" no painel para aceitar respostas de pacientes.' });
    }

    const sections: any[] = db
      .prepare(`SELECT * FROM sections WHERE template_id = ? ORDER BY sort_order ASC`)
      .all(templateId);

    for (const section of sections) {
      const questions: any[] = db
        .prepare(`SELECT * FROM questions WHERE section_id = ? ORDER BY sort_order ASC`)
        .all(section.id);
      section.questions = questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        help_text: q.help_text,
        type: q.type,
        required: !!q.required,
        ai_deepen: !!q.ai_deepen,
        options: db
          .prepare(`SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC`)
          .all(q.id),
      }));
    }

    res.json({
      id: template.id,
      title: template.title,
      description: template.description,
      specialty: template.specialty,
      sections,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar questionário.' });
  }
});

app.post('/api/public/ai/deepen-question', async (req, res) => {
  const { question_text, answer } = req.body;
  if (!question_text || !answer) {
    res.status(400).json({ error: 'Dados insuficientes.' });
    return;
  }

  try {
    const followup = await generateDeepenQuestionWithAI(question_text, answer);
    res.json({ followup_question: followup });
  } catch (error) {
    res.status(500).json({ error: 'Erro no aprofundamento.' });
  }
});

app.post('/api/public/responses', async (req, res) => {
  try {
    const { template_id, patient_name, patient_cpf, patient_phone, patient_birthdate, answers } = req.body;

    if (!template_id || !patient_name || !patient_phone) {
      res.status(400).json({ error: 'Nome, Telefone e Template são obrigatórios.' });
      return;
    }

    const template: any = db.prepare(`SELECT * FROM templates WHERE id = ? AND status = 'active'`).get(template_id);
    if (!template) {
      res.status(404).json({ error: 'Formulário encerrado. Não é possível enviar novas respostas.' });
      return;
    }

    const aiResult = await generatePreAnamneseWithAI(
      { name: patient_name, birthdate: patient_birthdate, phone: patient_phone },
      answers,
    );

    const responseId = cryptoNativeId();
    db.prepare(`
      INSERT INTO responses
      (id, template_id, patient_name, patient_cpf, patient_phone, patient_birthdate, answers_json, patient_summary, pre_anamnese, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `).run(
      responseId,
      template_id,
      patient_name,
      patient_cpf || '',
      patient_phone,
      patient_birthdate || '',
      JSON.stringify(answers),
      aiResult.patient_summary,
      aiResult.pre_anamnese,
    );

    res.json({ id: responseId, message: 'Ficha enviada com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar a ficha.' });
  }
});

// ------------------------------------------------------------
// ROTAS ADMINISTRATIVAS (protegidas por sessão)
// ------------------------------------------------------------
app.get('/api/templates', authRequired, (req, res) => {
  try {
    const templates = db.prepare(`SELECT * FROM templates ORDER BY created_at DESC`).all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar templates.' });
  }
});

app.get('/api/templates/:id', authRequired, (req, res) => {
  try {
    const templateId = req.params.id;
    const template: any = db.prepare(`SELECT * FROM templates WHERE id = ?`).get(templateId);
    if (!template) return res.status(404).json({ error: 'Template não encontrado.' });

    const sections: any[] = db
      .prepare(`SELECT * FROM sections WHERE template_id = ? ORDER BY sort_order ASC`)
      .all(templateId);

    for (const section of sections) {
      const questions: any[] = db
        .prepare(`SELECT * FROM questions WHERE section_id = ? ORDER BY sort_order ASC`)
        .all(section.id);
      for (const question of questions) {
        question.options = db
          .prepare(`SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC`)
          .all(question.id);
      }
      section.questions = questions;
    }
    template.sections = sections;

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar detalhes do template.' });
  }
});

app.post('/api/templates', authRequired, (req, res) => {
  try {
    const { title, description, specialty, status, sections } = req.body;
    const templateId = cryptoNativeId();

    db.prepare(`INSERT INTO templates (id, title, description, specialty, status) VALUES (?, ?, ?, ?, ?)`).run(
      templateId,
      title || 'Novo Questionário',
      description || '',
      specialty || 'Geral',
      status || 'draft',
    );

    if (sections && Array.isArray(sections)) {
      saveSectionsAndQuestions(templateId, sections);
    }

    res.json({ id: templateId, message: 'Template salvo com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar template.' });
  }
});

app.put('/api/templates/:id', authRequired, (req, res) => {
  try {
    const templateId = req.params.id;
    const { title, description, specialty, status, sections } = req.body;

    db.prepare(
      `UPDATE templates SET title = ?, description = ?, specialty = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).run(title, description, specialty, status, templateId);

    if (sections && Array.isArray(sections)) {
      const oldSections: any[] = db.prepare(`SELECT id FROM sections WHERE template_id = ?`).all(templateId);
      for (const s of oldSections) {
        const oldQuestions: any[] = db.prepare(`SELECT id FROM questions WHERE section_id = ?`).all(s.id);
        for (const q of oldQuestions) {
          db.prepare(`DELETE FROM question_options WHERE question_id = ?`).run(q.id);
        }
        db.prepare(`DELETE FROM questions WHERE section_id = ?`).run(s.id);
      }
      db.prepare(`DELETE FROM sections WHERE template_id = ?`).run(templateId);

      saveSectionsAndQuestions(templateId, sections);
    }

    res.json({ message: 'Template atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar template.' });
  }
});

app.delete('/api/templates/:id', authRequired, (req, res) => {
  try {
    db.prepare(`DELETE FROM templates WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Template excluído.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir template.' });
  }
});

app.post('/api/ai/generate-template', authRequired, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório.' });

    const aiTemplate = await generateTemplateWithAI(prompt);
    res.json(aiTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar template com IA.' });
  }
});

app.get('/api/responses', authRequired, (req, res) => {
  try {
    const responses = db.prepare(`
      SELECT r.*, t.title as template_title
      FROM responses r
      LEFT JOIN templates t ON r.template_id = t.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar respostas.' });
  }
});

app.post('/api/responses/:id/regenerate-ai', authRequired, async (req, res) => {
  try {
    const responseId = req.params.id;
    const responseRow: any = db.prepare(`SELECT * FROM responses WHERE id = ?`).get(responseId);
    if (!responseRow) return res.status(404).json({ error: 'Ficha não encontrada.' });

    const answers = JSON.parse(responseRow.answers_json);
    const aiResult = await generatePreAnamneseWithAI(
      { name: responseRow.patient_name, birthdate: responseRow.patient_birthdate, phone: responseRow.patient_phone },
      answers,
    );

    db.prepare(`UPDATE responses SET patient_summary = ?, pre_anamnese = ? WHERE id = ?`).run(
      aiResult.patient_summary,
      aiResult.pre_anamnese,
      responseId,
    );

    res.json({ patient_summary: aiResult.patient_summary, pre_anamnese: aiResult.pre_anamnese });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao regenerar IA.' });
  }
});

app.delete('/api/responses/:id', authRequired, (req, res) => {
  try {
    db.prepare(`DELETE FROM responses WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Resposta removida.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir resposta.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ------------------------------------------------------------
// Auxiliares
// ------------------------------------------------------------
function saveSectionsAndQuestions(templateId: string, sections: any[]) {
  sections.forEach((sec, sIdx) => {
    const sectionId = cryptoNativeId();
    db.prepare(`INSERT INTO sections (id, template_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
      sectionId,
      templateId,
      sec.title,
      sec.description || '',
      sIdx,
    );

    if (sec.questions && Array.isArray(sec.questions)) {
      sec.questions.forEach((q: any, qIdx: number) => {
        const questionId = cryptoNativeId();
        db.prepare(`
          INSERT INTO questions (id, section_id, question_text, help_text, type, required, ai_deepen, condition_question_id, condition_operator, condition_value, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          questionId,
          sectionId,
          q.question_text,
          q.help_text || '',
          q.type || 'short_text',
          q.required ? 1 : 0,
          q.ai_deepen ? 1 : 0,
          q.condition_question_id || null,
          q.condition_operator || null,
          q.condition_value || null,
          qIdx,
        );

        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: any, oIdx: number) => {
            const optId = cryptoNativeId();
            const label = typeof opt === 'string' ? opt : opt.option_label || opt.label || opt.option_value || opt.value;
            const val = typeof opt === 'string' ? opt : opt.option_value || opt.value || opt.option_label || opt.label;
            db.prepare(`INSERT INTO question_options (id, question_id, option_label, option_value, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
              optId,
              questionId,
              label,
              val,
              oIdx,
            );
          });
        }
      });
    }
  });
}

const clientDist = path.resolve(process.cwd(), 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
