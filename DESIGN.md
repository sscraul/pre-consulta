---
name: Pré-Ficha Clínica
description: Sistema visual para uma recepção clínica eficiente, clara e acolhedora.
colors:
  primary: "#2563eb"
  primary-deep: "#1d4ed8"
  primary-soft: "#eff6ff"
  primary-soft-hover: "#dbeafe"
  primary-deep-hover: "#1e40af"
  neutral-bg: "#f8fafc"
  surface: "#ffffff"
  text: "#0f172a"
  text-muted: "#64748b"
  border: "#e2e8f0"
  success: "#059669"
  warning: "#d97706"
  danger: "#e11d48"
  danger-soft: "#fff1f2"
  warning-border: "#fcd34d"
  warning-soft: "#fffbeb"
  warning-deep: "#92400e"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-deep}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: Pré-Ficha Clínica

## Overview

**Creative North Star: "Recepção clínica eficiente"**

O sistema visual traduz uma recepção clínica organizada: cada ação é fácil de localizar, cada informação tem uma hierarquia clara e a interface transmite cuidado sem parecer decorativa. A base é clara e arejada, com azul confiável para ações e estados de orientação.

Cards elevados, bordas suaves e sombras visíveis criam uma sensação de espaço e separação entre tarefas. A linguagem é profissional, clara e acolhedora, adequada tanto ao uso rápido do médico e da secretária quanto ao preenchimento por pacientes em dispositivos móveis.

**Key Characteristics:**
- Superfícies brancas elevadas sobre fundo neutro frio.
- Azul como ação principal e sinal de orientação.
- Hierarquia sans-serif objetiva, com títulos fortes e textos auxiliares discretos.
- Cantos arredondados e estados sem ambiguidade.

## Colors

A paleta combina azul clínico confiável com neutros frios e estados semânticos reservados para comunicar situação, não decoração.

### Primary
- **Azul de atendimento** (`{colors.primary}`): ações principais, navegação ativa, links de paciente e foco visual.
- **Azul profundo** (`{colors.primary-deep}`): hover, texto sobre fundos azuis claros e maior ênfase.

### Neutral
- **Fundo de recepção** (`{colors.neutral-bg}`): canvas geral da aplicação.
- **Superfície clínica** (`{colors.surface}`): cards, formulários e painéis.
- **Texto principal** (`{colors.text}`): títulos, dados e conteúdo de decisão.
- **Texto auxiliar** (`{colors.text-muted}`): descrições, metadados e estados de carregamento.
- **Linha de separação** (`{colors.border}`): bordas e divisores de baixa ênfase.

### Named Rules
**The Signal-Only Color Rule.** Azul comunica ação e orientação; verde, âmbar e rosa comunicam estados sem competir com a ação principal.

## Typography

**Display Font:** `ui-sans-serif, system-ui, sans-serif`
**Body Font:** `ui-sans-serif, system-ui, sans-serif`

**Character:** A tipografia é direta, legível e familiar. Peso e tamanho fazem a maior parte do trabalho; não há necessidade de efeitos decorativos ou combinações tipográficas.

### Hierarchy
- **Headline** (700, `1.5rem`–`1.875rem`, normal): títulos de página e áreas de trabalho.
- **Title** (700, `1.125rem`–`1.25rem`, normal): títulos de cards e blocos.
- **Body** (400–500, `0.875rem`–`1rem`, `1.5`): instruções, descrições e dados.
- **Label** (600, `0.75rem`–`0.875rem`): campos, badges, metadados e ações compactas.

## Layout

O painel usa um container central amplo (`max-width: 1280px`) com gutters responsivos de `16px` a `32px`. A navegação fica em uma barra superior fixa, enquanto o conteúdo principal usa ritmo vertical de `24px` a `32px`.

Cards de templates usam uma grade de uma coluna no mobile, duas no tablet e três no desktop, com `24px` de intervalo. Formulários e dossiês priorizam leitura vertical; ações relacionadas ficam agrupadas e próximas ao conteúdo que modificam.

Em telas pequenas, a navegação pode quebrar em duas linhas e campos mantêm fonte mínima de `16px` para evitar zoom involuntário em dispositivos móveis.

## Elevation & Depth

A profundidade é elevada e funcional. O fundo neutro separa o canvas das superfícies brancas; bordas definem limites e sombras marcam cards interativos, formulários e o shell persistente. Sombras devem ser visíveis, mas suaves o bastante para não criar ruído em telas clínicas.

### Shadow Vocabulary
- **Shell** (`shadow-sm`): barra superior fixa e separação constante do conteúdo.
- **Card resting** (`shadow-sm`): cards de templates, dossiês e formulários.
- **Card hover** (`shadow-md`): confirmação de que um card ou ação é interativo.
- **Primary emphasis** (`shadow-lg` com azul translúcido): login, ações primárias e superfícies de IA.

### Named Rules
**The Layered Reception Rule.** Toda elevação deve explicar uma camada de trabalho; não usar sombra apenas para enfeitar uma superfície plana.

## Shapes

A forma é amigável e controlada: campos e controles usam cantos de `8px` a `12px`, cards usam `16px` e superfícies de destaque podem usar `24px`. Badges de status são pill-shaped. Bordas são finas, claras e servem para separar estados e grupos.

## Components

### Buttons
- **Shape:** cantos suavemente arredondados (`12px`), altura confortável para toque.
- **Primary:** azul de atendimento com texto branco, padding aproximado de `12px 20px`, peso `600`.
- **Hover / Focus:** azul profundo no hover; foco visível por mudança de borda ou ring azul.
- **Secondary / Ghost:** fundo azul muito claro ou superfície neutra, texto azul/ardósia; usado para ações auxiliares.

### Chips
- **Style:** badges compactos com pill shape, fundo tonal claro, texto semântico e borda discreta quando necessário.
- **State:** azul para especialidade/identidade, verde para ativo, âmbar para rascunho e rosa para ações destrutivas.

### Cards / Containers
- **Corner Style:** arredondamento de `16px` a `24px`.
- **Background:** branco sobre fundo `slate-50`.
- **Shadow Strategy:** `shadow-sm` em repouso e `shadow-md` no hover.
- **Border:** `1px` em neutro claro; azul quando selecionado ou em foco.
- **Internal Padding:** `24px` em cards de trabalho; `48px` em estados vazios destacados.

### Inputs / Fields
- **Style:** fundo branco, borda neutra, cantos de `12px`, padding vertical de aproximadamente `10px`.
- **Focus:** borda azul e ring quando o controle recebe foco.
- **Error / Disabled:** rosa claro com texto rosa para erro; opacidade reduzida para disabled.

### Navigation
- **Style:** barra branca sticky, linha inferior neutra e sombra sutil.
- **Default:** texto ardósia, ações compactas e ícones Lucide de `16px`.
- **Active:** fundo azul muito claro e texto azul profundo.
- **Primary action:** botão azul preenchido para “Novo”.

### AI Assistance
Blocos de IA usam uma superfície azul profunda ou azul tonal, ícone Sparkles e texto explicativo curto. A aparência deve sinalizar assistência e revisão, nunca diagnóstico definitivo.

## Do's and Don'ts

### Do:
- **Do** use azul preenchido para a ação principal da tela.
- **Do** keep primary actions at least `44px` tall when used in touch flows.
- **Do** use cards and tonal surfaces to separate workflows.
- **Do** pair every status color with a text label or icon.
- **Do** preserve visible focus states for keyboard and mobile accessibility.

### Don't:
- **Don't** use saturated colors as decoration without semantic meaning.
- **Don't** flatten all content into one undifferentiated white surface.
- **Don't** use shadows so strong that they compete with titles or actions.
- **Don't** present AI output without its auxiliary/reviewable context.
- **Don't** introduce a new radius, font family, or accent color for a one-off component.
