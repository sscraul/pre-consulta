# Relatório de escopo — Primeira Ficha

Data da análise: 11 de agosto de 2026.  
Método: inspeção funcional, autenticada e somente leitura das telas disponibilizadas; nenhum questionário, resposta, convite, exportação, plano ou dado foi criado, alterado ou excluído.

## Síntese

O **Primeira Ficha** é um SaaS de pré-anamnese clínica. Ele transforma um questionário configurável em uma ficha digital para o paciente, coleta consentimento e respostas, usa IA para organizar o material em um resumo e uma pré-anamnese, e entrega o resultado ao profissional em uma área protegida. Há ainda distribuição por link/QR Code, equipe com papéis, retenção LGPD, exportações e controle por assinatura.

O fluxo principal é:

`profissional configura questionário → envia link ou disponibiliza QR → paciente consente e responde → IA organiza → profissional revisa/copia/exporta`.

## Perfis e permissões observados

| Perfil | Capacidades observadas |
|---|---|
| Administrador da clínica | Configura clínica e retenção, questionários, equipe, planos, IA, exportações e própria conta. |
| Médico | Vê apenas seus próprios questionários e respostas. |
| Secretária | Pode gerar links; não vê as respostas clínicas. |
| Paciente | Acessa formulário público, aceita termos/LGPD e envia respostas. |

## Funcionalidades

### 1. Painel operacional

- Indicadores: respostas de hoje, pendências e volume mensal.
- Busca por paciente ou questionário.
- Filtros: todos, pendentes e respondidos.
- Lista cronológica de respostas, com estado `Respondido` e indicação de `Resumo IA pronto`.
- Lista de questionários ativos, com título, descrição, edição e QR Code fixo.
- Área de links pendentes (links individualizados que ainda não foram respondidos).

### 2. Criação e edição de questionários

Há dois pontos de partida:

1. **Gerar com IA**: o profissional informa o contexto da consulta; há atalhos para cirurgia refrativa (LASIK/PRK), catarata, glaucoma e olho seco. A plataforma informa que inclui automaticamente nome, idade e profissão; o conteúdo pode ser editado antes de publicar.
2. **Em branco**: inicia sem perguntas predefinidas.

No editor, o questionário possui título e descrição, e um construtor de perguntas com:

- tipos comprovados: texto curto, texto longo, número, sim/não e múltipla escolha;
- alternativas editáveis, adição/remoção e seleção múltipla;
- obrigatoriedade;
- ordenação e inserção de pergunta em posições intermediárias;
- lógica condicional: `mostrar apenas se` uma resposta anterior tiver determinado valor;
- opção por pergunta de **Detalhar com IA**: se a resposta for clinicamente relevante, a IA pode fazer perguntas complementares;
- adicionar/remover perguntas e salvar ou apagar o questionário;
- seções da pré-anamnese herdadas do perfil ou, opcionalmente, específicas por questionário.

O modelo analisado tinha 18 perguntas possíveis, incluindo identificação, motivo da consulta, comorbidades, cirurgias, antecedentes familiares, correção visual, telas, sintomas, medicamentos e alergias. Perguntas condicionais não entram quando a condição não ocorre, por isso a sessão de exemplo mostra 17/18 respondidas.

### 3. Distribuição para pacientes

- **QR Code/link fixo do questionário**: ideal para recepção/sala de espera. Não é vinculado previamente a paciente; quem o usa vai direto para respostas concluídas, sem passar por pendências.
- O QR fixo pode ser ativado/desativado, copiado como link ou QR Code e baixado como arquivo.
- A plataforma também suporta **link/QR individual vinculado a paciente**, pois este fluxo é explicitamente citado nos planos e na área de pendências.

### 4. Formulário público

Antes das perguntas, o paciente vê:

- explicação da finalidade da ficha;
- transparência sobre uso de IA somente para organização;
- aviso expresso de que IA não diagnostica, trata ou substitui avaliação profissional;
- orientação para urgências;
- aceite obrigatório de Termos de Uso, Política de Privacidade e tratamento de dados pessoais e de saúde;
- seletor de idioma;
- rodapé jurídico e páginas verticais para dentistas e nutricionistas.

### 5. Sessão clínica e resultado da IA

Após o envio, há uma sessão vinculada ao questionário/paciente com:

- nome, questionário e data/hora;
- completude das respostas e visualização de pendências;
- **Resumo do paciente** curto;
- **Pré-anamnese para prontuário** estruturada, em texto copiável;
- botão Copiar em ambos os blocos;
- ação **Regenerar com IA** quando ajustes de instruções exigirem um novo texto;
- exportação de dados/ficha (o produto cita PDF nos planos);
- anonimização e exclusão da ficha;
- aviso clínico: material auxiliar, sujeito à revisão profissional e sem substituição de anamnese/exame/decisão clínica.

### 6. Preferências e LGPD

- MFA/2FA para acesso aos dados clínicos.
- Nome do usuário e nome da clínica.
- Retenção automática de fichas respondidas: 1 a 120 meses; apaga identificação, respostas e resumos.
- Retenção de links pendentes: 1 a 60 dias; links expiram e a sessão é eliminada.
- Subespecialidade livre para contextualizar sugestões da IA.
- Seções padrão da pré-anamnese, reordenáveis e editáveis. No exemplo: Identificação, Queixa e duração, Antecedentes Pessoais e Antecedentes Familiares.
- Instruções textuais para a IA gerar a página de respostas/pré-anamnese e para formular aprofundamentos.
- Restaurar padrões e salvar preferências.
- Portabilidade: download de ZIP com JSON técnico e PDF resumido.
- Exclusão permanente da conta; se for o único dono, remove também clínica, questionários, fichas e assinatura.

### 7. Equipe

- Convite por e-mail.
- Papéis médico e secretária.
- Reenvio/cópia manual do link de convite caso o e-mail não chegue.
- Separação explícita entre poder gerar links (secretária) e acesso ao conteúdo clínico (médico).

### 8. Relatórios e planos

- CSV administrativo por período: envios, respostas, pendências, expirados, taxa de conclusão e tempo médio; sem conteúdo clínico.
- ZIP clínico por período: fichas, respostas e resumos de IA; inclui alerta de dados sensíveis.
- Planos observados:
  - Essencial — R$ 79/mês: 1 médico, 1 secretária, 80 fichas/mês.
  - Crescimento — R$ 149/mês: até 3 médicos, 3 secretárias, 300 fichas/mês, CSV de ficha e relatório administrativo.
  - Profissional — R$ 299/mês: até 7 médicos, secretárias ilimitadas, 700 fichas/mês, CSV, JSON e exportação clínica em lote.

## Arquitetura funcional recomendada para sua versão pessoal

Para uso pessoal, eu dividiria o produto em quatro módulos, sem iniciar com multiempresa/planos:

1. **Construtor**: questionário, pergunta, alternativa, condição e configuração de aprofundamento por IA.
2. **Coleta pública**: link seguro, consentimento versionado, respostas, progresso e expiração.
3. **Dossiê clínico**: respostas normalizadas, resumo, pré-anamnese, revisão manual, cópia e PDF.
4. **Governança**: autenticação/MFA, RBAC, trilha de auditoria, retenção e exportação/eliminação de dados.

Modelo conceitual mínimo:

`usuário → clínica (opcional) → questionário → perguntas/condições → link/sessão → paciente → respostas → geração IA → resumo/pré-anamnese → exportação/auditoria`.

## Prioridade de implementação (MVP pessoal)

1. Login seguro, um profissional e um questionário editável.
2. Link público com consentimento, perguntas condicionais e armazenamento criptografado.
3. Tela de sessão com respostas, resumo e pré-anamnese por IA, sempre revisáveis.
4. PDF, cópia para prontuário, expiração/retenção e exclusão.
5. Só depois: QR fixo, templates com IA, equipe, relatórios e multiusuário.

## Requisitos não negociáveis para dados de saúde

- Dados de saúde são dados pessoais sensíveis: privacidade, controle de acesso, backup, retenção e descarte precisam existir desde o MVP.
- Registre a versão do consentimento, data/hora, propósito e vínculo da sessão.
- Nunca deixe a IA diagnosticar, prescrever ou tomar decisão; apresente saída como rascunho revisável pelo profissional.
- Minimize dados e não envie identificadores desnecessários ao provedor de IA.
- Aplique autorização no servidor/banco, e não apenas na interface; mantenha trilha de auditoria de visualização, exportação e exclusão.

## Stack: evidências e inferência

**Observado publicamente:** é uma SPA com bundle versionado em `/assets/index-BzVJWpTO.js`, padrão muito comum de build Vite; há Microsoft Clarity, Google Ads/Analytics e Meta Pixel. A interface e as rotas são client-side.

**Inferência com confiança moderada:** sendo um projeto criado no Lovable, o caminho mais provável é **React + TypeScript + Vite**, com UI baseada em Tailwind/shadcn e backend Supabase (Postgres, Auth, Storage e Edge Functions). Isso é o padrão de geração do Lovable, mas não foi possível confirmar o repositório, as variáveis de ambiente ou o provedor de backend apenas pela interface pública. Portanto, trate Supabase/Tailwind/shadcn como hipótese de arquitetura, não como fato comprovado.

## Diferença entre replicar e adaptar

Você não precisa reproduzir o SaaS inteiro. Para seu uso, a combinação de questionário configurável, lógica condicional, consentimento, uma geração de IA estruturada e entrega em PDF/cópia resolve o núcleo clínico. Planos, cobrança, convites e exportações em massa podem ficar fora da primeira versão.
