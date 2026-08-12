# Pré-Ficha Clínica

Aplicação pessoal para criação de questionários de pré-anamnese, coleta pública por link e consolidação auxiliar com Gemini.

## Desenvolvimento local

```bash
npm install
npm run dev
```

- Painel: `http://localhost:3000/dashboard`
- Questionário público: `http://localhost:3000/q/<template-id>`
- API: `http://localhost:3001`

## Produção / Coolify

A aplicação roda em um único container e serve o frontend compilado pelo Express.

Variáveis obrigatórias:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
ADMIN_USERNAME=
ADMIN_PASSWORD=
NODE_ENV=production
PORT=3001
PUBLIC_ORIGIN=https://preconsulta.raulcamargo.med.br
```

No Coolify:

1. Crie uma aplicação apontando para o repositório `sscraul/pre-consulta`.
2. Use o `Dockerfile` da raiz.
3. Publique a porta interna `3001`.
4. Configure o domínio `preconsulta.raulcamargo.med.br`.
5. Ative HTTPS automático.
6. Configure as variáveis acima no painel do Coolify, nunca no repositório.
7. Use `/health` como health check.

URLs finais:

- Painel: `https://preconsulta.raulcamargo.med.br/dashboard`
- Login: `https://preconsulta.raulcamargo.med.br/login`
- Questionário: `https://preconsulta.raulcamargo.med.br/q/<template-id>`

O SQLite fica em `db/pre-ficha.db`. Em produção, monte um volume persistente do Coolify em `/app/db`; sem volume, os dados serão perdidos ao recriar o container.

## Repositório

O código deve ser publicado em `https://github.com/sscraul/pre-consulta`. Não versionar `.env` nem o arquivo SQLite local.
