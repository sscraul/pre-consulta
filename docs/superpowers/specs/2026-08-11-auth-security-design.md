# Especificação de Autenticação e Segurança — Pré-Ficha

**Domínio Base:** `preconsulta.raulcamargo.med.br`  
**Objetivo:** Proteger todo o painel administrativo e dados de pacientes com autenticação SQLite/Cookie seguro, mantendo a coleta pública de pré-anamnese por URL dedicada.

---

## 1. Rotas e URLs

- **Painel Administrativo (Protegido):** `https://preconsulta.raulcamargo.med.br/dashboard`
- **Login Administrativo:** `https://preconsulta.raulcamargo.med.br/login` (redireciona para `/dashboard` se autenticado)
- **Questionário Público (Aberto):** `https://preconsulta.raulcamargo.med.br/q/:templateId`

---

## 2. Autenticação e Sessões (SQLite)

- **Tabela `users`:** armazena `username` (`raulcamargo`), `password_hash` (PBKDF2/scrypt/argon2 com salt por usuário), `created_at` e `updated_at`.
- **Tabela `sessions`:** armazena `id` (token seguro de 256 bits), `user_id`, `created_at` e `expires_at`.
- **Cookie de Sessão:** `sid`, configurado como `HttpOnly`, `SameSite=Lax`, `Path=/`, e `Secure` quando em HTTPS.
- **Bootstrap de Usuário:** ao inicializar a API, se a tabela `users` estiver vazia ou com credencial alterada via `.env`, o usuário `raulcamargo` é atualizado com hash seguro no SQLite.

---

## 3. Autorização de APIs (Backend)

- **Rotas Protegidas (Exigem cookie de sessão válido):**
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `GET /api/templates`
  - `POST /api/templates`
  - `PUT /api/templates/:id`
  - `DELETE /api/templates/:id`
  - `POST /api/ai/generate-template`
  - `GET /api/responses`
  - `POST /api/responses/:id/regenerate-ai`
  - `DELETE /api/responses/:id`
- **Rotas Públicas (Abertas apenas para paciente):**
  - `POST /api/auth/login` (com limite de tentativas de login por IP)
  - `GET /api/public/templates/:id` (retorna apenas questionário ativo para preenchimento)
  - `POST /api/public/ai/deepen-question` (aprofundamento em tempo real)
  - `POST /api/public/responses` (envio final da ficha)

---

## 4. Endurecimento de Segurança

1. **Credenciais:** Chaves e senhas lidas via `.env`. A senha não é salva em texto puro em nenhum momento.
2. **Proteção contra Força Bruta:** Limite básico de tentativas no endpoint de login (máximo 5 tentativas por minuto por IP).
3. **Validação de Status do Template:** Apenas templates ativos (`status = 'active'`) aceitam novas respostas do paciente.
4. **Header e HTTPS Ready:** Servidor configurado para honrar proxies (como Nginx/Caddy/Cloudflare no domínio `preconsulta.raulcamargo.med.br`) com `X-Forwarded-Proto`.

