# PRD — Plataforma Pessoal de Pré-Anamnese com IA

**Objetivo:** Sistema de uso pessoal e de consultório para criação de questionários, coleta de pré-anamnese por paciente na sala de espera ou pré-consulta, e consolidação do dossiê clínico via IA para cópia rápida no prontuário.  
**Versão:** 1.0 (MVP Pessoal)  
**Data:** 11/08/2026

---

## 1. Visão Geral e Princípios do Produto

1. **Eficiência Clínica First:** Foco na agilidade do consultório e na cópia direta da pré-anamnese para o clipboard.
2. **Sem Sobrecarga Operacional:** Envio rápido por link (copiado pela secretária ou pelo médico); sem necessidade de expiração automática ou gestão complexa de convites no MVP.
3. **Sessão Isolada por Paciente:** Um mesmo link pode ser acessado por múltiplos pacientes simultaneamente. Cada abertura gera uma sessão única de preenchimento.
4. **Descarte de Abandonos:** Sessões fechadas antes do envio final são totalmente descarregadas (zero rascunhos no painel).
5. **IA Auxiliar e Revisor Humano:** A IA gera sugestões de aprofundamento por pergunta e rascunho de pré-anamnese/resumo, cabendo ao médico a decisão final.

---

## 2. Perfis e Permissões

- **Médico (Dono):** Acesso completo a templates, construtor, sessões respondidas, geração de IA, retenção de dados e configurações.
- **Secretária:** Acesso simplificado para visualizar a lista de questionários ativos e copiar links para envio por WhatsApp/SMS aos pacientes.
- **Paciente:** Acessa a interface pública por link único de questionário, dá aceite nos termos LGPD/Clínicos e responde à ficha.

---

## 3. Módulos e Requisitos Funcionais

### Módulo A — Gestão de Templates e Construtor com IA

1. **Estrutura do Questionário:**
   - Organizado em **Seções e Blocos Editáveis** (ex: Identificação, Queixa Principal, Antecedentes Pessoais, Antecedentes Familiares, Medicamentos/Alergias).
   - Suporte a reordenação de seções e perguntas.
2. **Geração de Templates por IA (Assistente de Prompt):**
   - O médico digita o tema desejado (ex: "Pré-consulta para cirurgia refrativa", "Pré-consulta para catarata").
   - A IA gera uma proposta estruturada com seções, perguntas, alternativas e lógicas predefinidas.
   - O template gerado permanece em modo **Rascunho** até a revisão e aprovação final do médico.
3. **Tipos de Perguntas e Configurações:**
   - Texto curto, texto longo, número, opção única e múltipla escolha.
   - Flag de **Obrigatoriedade**.
   - **Lógica Condicional (Exibição):** Mostrar Pergunta B apenas se Pergunta A tiver a resposta X.
   - **Aprofundamento em Tempo Real por IA (por Pergunta):**
     - O médico ativa a flag "Aprofundar com IA" em perguntas estratégicas.
     - Se o paciente selecionar/responder algo clinicamente relevante (ex: cirurgia ocular prévia), a IA gera uma pergunta complementar dinâmica antes do envio.

### Módulo B — Coleta Pública (Experiência do Paciente)

1. **Entrada e Consentimento:**
   - Apresentação da finalidade da pré-anamnese.
   - Termo explicativo claro: a IA organiza dados, mas não faz diagnóstico ou prescrição.
   - Aceite obrigatório de Termos de Uso e Política de Privacidade (LGPD).
2. **Preenchimento e Sessão:**
   - Coleta de dados de identificação e contato preenchidos pelo próprio paciente.
   - Navegação fluida e reativa com suporte a condições e perguntas complementares de IA.
3. **Ciclo de Vida da Sessão:**
   - Ao abrir o link, cria-se uma sessão temporária no dispositivo do paciente.
   - Se o paciente fechar a aba ou abandonar o formulário antes de clicar em "Enviar", a sessão é **completamente descartada**. Ao reabrir, ele inicia do zero.
   - Ao enviar com sucesso, a sessão é finalizada e o link não permite novo envio para aquele identificador de sessão.

### Módulo C — Painel de Recepção e Dossiê Clínico

1. **Geração de Link (Recepção/Secretária):**
   - Lista de questionários ativos com botão "Copiar Link".
   - Links permanecem ativos até que o médico/secretária altere o status do questionário para Inativo/Cancelado.
2. **Painel de Respostas Recebidas:**
   - Exibição em tempo real das fichas respondidas com nome do paciente, data/hora e questionário de origem.
3. **Dossiê Clínico e IA Consolidadora:**
   - **Resumo do Paciente:** Visão sintética dos pontos de atenção.
   - **Pré-Anamnese para Prontuário:** Texto estruturado pronto para a rotina médica.
   - **Ação Principal:** Botão **"Copiar Pré-Anamnese"** para enviar o texto formatado direto ao Clipboard (área de transferência).
   - Botão **"Regenerar IA"** para reprocessar o rascunho com instruções ajustadas.

---

## 4. Requisitos Não Funcionais, LGPD e IA

1. **Privacidade e Criptografia:**
   - Armazenamento seguro de dados pessoais e de saúde.
   - Minimização de dados no envio para o provedor de IA (enviar apenas o contexto necessário das respostas, sem metadados sensíveis desnecessários).
2. **Segurança de Acesso:**
   - Autenticação forte para o médico e secretária (suporte a 2FA/MFA).
3. **Responsa Clínica e Legal:**
   - Todos os resumos de IA contêm aviso expresso: "Material auxiliar pré-consulta, sujeito à revisão e validação médica".

---

## 5. Escopo e Recorte do MVP

| Em Escopo (MVP Pessoal) | Fora do Escopo (Fases Futuras) |
|---|---|
| Envio manual por link | QR Code fixo ou totens |
| Link por template com sessões individuais simultâneas | Expiração automática de links |
| Paciente preenche a própria identificação | Preenchimento prévio do paciente pela secretária |
| Construtor de seções/blocos editáveis | Cobrança, planos SaaS e Stripe |
| Assistente de IA para criar templates | Exportação em PDF |
| Aprofundamento por IA ativável por pergunta | Relatórios administrativos e métricas |
| Botão "Copiar para Clipboard" | Histórico de rascunhos abandonados |

