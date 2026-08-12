import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'db', 'pre-ficha.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Inicialização de tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    specialty TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'inactive'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    help_text TEXT,
    type TEXT NOT NULL, -- 'short_text', 'long_text', 'number', 'single_choice', 'multiple_choice'
    required INTEGER NOT NULL DEFAULT 0,
    ai_deepen INTEGER NOT NULL DEFAULT 0, -- 1 se aprofunda com IA
    condition_question_id TEXT,
    condition_operator TEXT, -- 'equals', 'contains'
    condition_value TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS question_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    option_label TEXT NOT NULL,
    option_value TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_cpf TEXT,
    patient_phone TEXT NOT NULL,
    patient_birthdate TEXT,
    answers_json TEXT NOT NULL, -- JSON com mapa de respostas e aprofundamentos
    patient_summary TEXT, -- Resumo IA para o paciente/médico
    pre_anamnese TEXT, -- Pré-anamnese formatada por IA para clipboard
    status TEXT NOT NULL DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
  );
`);

console.log('Banco de dados SQLite inicializado.');

// Tabelas de autenticação e sessão
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);
