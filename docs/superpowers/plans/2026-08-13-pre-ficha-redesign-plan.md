# Pré-Ficha Clínica Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Aplicar o redesign visual aprovado às seis superfícies da Pré-Ficha Clínica sem alterar os fluxos de negócio ou contratos de API.

**Architecture:** Reaproveitar Tailwind e os padrões já existentes, consolidando tokens e primitives em `index.css` e ajustando as páginas existentes por superfície. Não adicionar biblioteca nem criar abstrações sem repetição real.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, lucide-react.

---

### Task 1: Consolidar tokens e estados globais

**Files:**
- Modify: `src/client/index.css`

- [x] Definir tokens de superfície, sombra, foco, transição e leitura no `:root`.
- [x] Adicionar classes utilitárias locais apenas para padrões repetidos: `app-shell`, `surface-card`, `primary-action`, `secondary-action`, `field-label` e `status-pill`.
- [x] Preservar as classes de animação do formulário e o bloqueio de zoom horizontal/mobile.
- [x] Rodar `npm run check:types`.

### Task 2: Redesenhar shell administrativo e login

**Files:**
- Modify: `src/client/App.tsx`
- Modify: `src/client/pages/Login.tsx`

- [x] Atualizar cabeçalho, navegação ativa, ação de criação e estado de verificação de sessão.
- [x] Garantir foco visível e áreas de toque mínimas.
- [x] Aplicar card de login elevado, erro, loading e ação primária sem alterar autenticação.
- [x] Rodar `npm run build`.

### Task 3: Redesenhar lista de questionários

**Files:**
- Modify: `src/client/pages/TemplateList.tsx`

- [x] Refinar cabeçalho, estado vazio, cards, status e ações.
- [x] Manter cópia de link, teste, edição e exclusão funcionando.
- [x] Validar grid responsivo e contraste.
- [x] Rodar `npm run check:types`.

### Task 4: Redesenhar editor de questionários

**Files:**
- Modify: `src/client/pages/TemplateEditor.tsx`

- [x] Separar visualmente informações, assistente IA, seções e perguntas.
- [x] Melhorar hierarquia de salvar, cancelar, publicar, reordenar e excluir.
- [x] Preservar todos os campos e callbacks existentes.
- [x] Rodar `npm run build`.

### Task 5: Redesenhar dossiê e formulário público

**Files:**
- Modify: `src/client/pages/ResponsesList.tsx`
- Modify: `src/client/pages/PatientForm.tsx`

- [x] Destacar paciente selecionado, resumo auxiliar, pré-anamnese e respostas brutas.
- [x] Destacar cópia da pré-anamnese e manter aviso de revisão médica.
- [x] Aplicar formulário mobile-first com consentimento, progresso, pergunta e estados de envio.
- [x] Preservar submissão pública, aprofundamento IA e descarte de sessão.
- [x] Rodar `npm run check:types` e `npm run build`.

### Task 6: Verificação visual e correções

**Files:**
- Modify: arquivos UI alterados conforme achados.

- [x] Inspecionar a rota pública publicada em desktop e mobile e as rotas administrativas autenticadas em produção como referência.
- [x] Rodar `node /Users/raulcamargo/.agents/skills/impeccable/scripts/detect.mjs --json` nos arquivos alterados.
- [x] Corrigir problemas de contraste heurísticos, foco, overflow, densidade e estados identificados.
- [x] Rodar novamente `npm run check:types`, `npm run build` e o detector.
- [x] Revisar `git diff` e manter fora do escopo qualquer mudança de backend ou dependência.
