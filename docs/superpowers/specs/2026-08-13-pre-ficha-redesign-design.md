# Pré-Ficha Clínica Redesign Design

## Objetivo

Redesenhar a experiência visual e a hierarquia da aplicação Pré-Ficha Clínica para comunicar uma recepção clínica eficiente: profissional, clara, acolhedora e operacionalmente rápida. O redesign preserva as rotas, contratos de API, dados clínicos, comportamento de IA e decisões médicas existentes.

## Direção aprovada

- Modo de uso: `Operate`.
- Estratégia: redesign estrutural incremental por superfície.
- Metáfora: “Recepção clínica eficiente”.
- Linguagem: profissional, clara e acolhedora.
- Materialidade: superfícies elevadas, cards e sombras mais marcados, sem ruído decorativo.
- Paleta: azul clínico para ações e orientação; neutros frios para canvas e texto; cores semânticas para estados.
- Tipografia: system sans, com hierarquia por tamanho, peso e espaçamento.

## Usuários e fluxos preservados

- Médico: administra questionários, revisa IA e copia a pré-anamnese para o prontuário.
- Secretária: localiza questionários ativos e compartilha links.
- Paciente: acessa o link público, consente e responde pelo celular.
- A IA continua auxiliar e revisável; nenhum texto visual pode sugerir diagnóstico automático.
- Nenhuma alteração será feita no backend, banco, autenticação ou contratos de API.

## Superfícies e ordem de implementação

### 1. Shell administrativo

Arquivos principais: `src/client/App.tsx`, `src/client/index.css`.

- Cabeçalho com marca, navegação ativa, ação “Novo” e saída.
- Estado de sessão carregando com superfície coerente.
- Container responsivo e ritmo espacial compartilhado.
- Componentes visuais reutilizáveis somente quando já houver repetição real entre telas.

### 2. Login

Arquivo principal: `src/client/pages/Login.tsx`.

- Card elevado de acesso com identidade clara.
- Campos com foco visível, erro legível e estado de carregamento.
- Ação primária dominante, sem alterar o fluxo de autenticação.

### 3. Questionários

Arquivo principal: `src/client/pages/TemplateList.tsx`.

- Título, descrição e ação principal com hierarquia clara.
- Cards com status, especialidade, descrição e ações agrupadas.
- “Copiar link para paciente” como ação primária do card.
- Estados vazio, carregando e erro com a mesma linguagem visual.
- Grid de uma coluna no mobile, duas no tablet e três no desktop.

### 4. Editor

Arquivo principal: `src/client/pages/TemplateEditor.tsx`.

- Separar visualmente dados gerais, assistente de IA, seções e perguntas.
- Tornar publicação/salvamento mais evidente sem criar novos estados de domínio.
- Reduzir competição entre controles de ordenação, edição e exclusão.
- Preservar condicionais, alternativas, obrigatoriedade e aprofundamento por IA.

### 5. Dossiê clínico

Arquivo principal: `src/client/pages/ResponsesList.tsx`.

- Lista de pacientes com seleção evidente.
- Resumo de IA, pré-anamnese e respostas brutas em camadas distintas.
- “Copiar pré-anamnese” como ação de maior destaque.
- Aviso de revisão médica sempre associado ao conteúdo gerado por IA.
- Layout adaptável para leitura e cópia no desktop e mobile.

### 6. Formulário público

Arquivo principal: `src/client/pages/PatientForm.tsx`.

- Fluxo mobile-first e progressivo.
- Consentimento, progresso, pergunta atual, aprofundamento e envio claramente separados.
- Campos com alvos de toque confortáveis e tipografia mínima de `16px`.
- Estados de carregamento, erro, envio concluído e questionário indisponível.
- Nenhuma linguagem que transforme a IA em autoridade clínica.

## Sistema visual

`DESIGN.md` e `.impeccable/design.json` são a fonte de tokens e padrões:

- Fundo geral `#f8fafc`, superfícies `#ffffff`.
- Primário `#2563eb`, hover `#1d4ed8`, primário suave `#eff6ff`.
- Texto principal `#0f172a`, auxiliar `#64748b`, borda `#e2e8f0`.
- Raios de `8px`, `12px`, `16px` e `24px` conforme o peso do componente.
- Sombras de shell, card, hover e destaque primário.
- System sans em toda a aplicação.

## Estados obrigatórios

Cada superfície deve manter ou melhorar seus estados existentes: carregando, vazio, sucesso, erro, foco, hover, desabilitado, ativo/inativo e destrutivo. Estados sem dados não devem parecer falhas e ações destrutivas devem continuar exigindo confirmação quando já exigem hoje.

## Acessibilidade e responsividade

- Manter navegação por teclado e foco visível.
- Usar texto ou ícone junto a cor para comunicar status.
- Garantir contraste adequado entre texto e superfícies.
- Manter controles de toque com pelo menos `44px` quando aplicável.
- Validar desktop e mobile após a implementação.

## Critérios de sucesso

- `npm run build` passa.
- `npm run check:types` passa.
- A aplicação preserva login, navegação, CRUD de questionários, edição, cópia de links, leitura do dossiê e formulário público.
- As seis superfícies seguem a mesma linguagem visual documentada.
- O detector visual do Impeccable não aponta problemas críticos nos arquivos alterados.
- Uma inspeção final cobre viewport desktop e mobile, além dos principais estados vazios e carregando.

## Fora do escopo

- Alterar backend, banco, autenticação, IA ou contratos de API.
- Criar multiempresa, MFA, cobrança, QR Code, PDF ou métricas.
- Adicionar bibliotecas de componentes ou dependências sem necessidade comprovada.
- Criar conteúdo clínico, depoimentos, métricas ou claims novos.
