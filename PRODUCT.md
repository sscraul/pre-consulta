# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O usuário principal é o médico responsável pelo consultório, que cria e revisa questionários e valida o material clínico. A secretária pode apoiar o envio dos links. O paciente acessa apenas o formulário público para consentir e responder à pré-anamnese.

## Product Purpose

A Pré-Ficha Clínica coleta informações antes da consulta oftalmológica e consolida as respostas em um resumo e uma pré-anamnese auxiliar para revisão médica. O sucesso é reduzir o tempo de coleta e facilitar a transferência do conteúdo validado para o prontuário.

## Positioning

O produto combina questionários configuráveis, aprofundamento contextual por IA e geração de uma pré-anamnese estruturada pronta para copiar no prontuário, sempre com decisão final do médico.

## Operating Context

O paciente preenche a ficha por um link, normalmente na sala de espera ou antes da consulta. O médico ou a secretária compartilha links de questionários ativos. O médico consulta o dossiê recebido e copia a pré-anamnese revisada para o prontuário.

## Capabilities and Constraints

- MVP pessoal, single-admin e focado em pré-anamnese oftalmológica.
- Questionários têm seções, perguntas, alternativas, obrigatoriedade e condicionais.
- A IA pode gerar propostas de questionários, perguntas de aprofundamento e pré-anamnese, mas suas saídas são auxiliares e revisáveis.
- Cada paciente responde em uma sessão independente; abandonos não ficam como rascunhos no painel.
- O armazenamento atual usa SQLite persistente; a aplicação é React/Vite com backend Express.
- Dados pessoais e de saúde exigem tratamento compatível com LGPD.
- Estão fora do MVP atual: multiempresa, cobrança, QR Code, PDF, retenção automática, relatórios administrativos e MFA.

## Brand Commitments

O produto usa o nome Pré-Ficha Clínica e está associado à marca profissional do Dr. Raul Camargo. O domínio previsto é `preconsulta.raulcamargo.med.br`.

## Evidence on Hand

- Implementação existente em `src/client` e `src/server`.
- PRD em `PRD-pre-ficha-pessoal.md`.
- Contexto técnico em `docs/PROJECT_CONTEXT.md`.
- Fotografia profissional em `public/assets/dr-raul-camargo.jpg`.
- Não há depoimentos, métricas, estudos de caso ou outras provas comerciais confirmadas; não devem ser fabricados.

## Product Principles

- Eficiência clínica antes de complexidade operacional.
- Coleta rápida por link e sessão isolada por paciente.
- IA como apoio, nunca como autoridade clínica.
- O médico mantém revisão e decisão final.
- Minimização e proteção de dados pessoais e de saúde.

## Accessibility & Inclusion

A interface deve funcionar em dispositivos móveis usados por pacientes e evitar barreiras de toque, leitura e preenchimento. Não foi definido um padrão formal adicional além das boas práticas de acessibilidade web.
