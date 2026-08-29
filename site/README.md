# Aguiar Veículos — Site

## Rodando localmente
1. `npm install`
2. `npx supabase start` (requer Docker) — sobe Postgres/Auth/Storage local e aplica `supabase/migrations/`.
3. Copie `.env.local.example` para `.env.local` e preencha com a `API URL`/`anon key` impressas pelo `supabase start`.
4. `npm run dev`

## Testes
`npm test` — roda a suíte Vitest (unitários e de integração leve, com Supabase mockado; nenhum teste depende de rede).

## Deploy (Vercel + Supabase de produção)
1. Crie um projeto Supabase de produção (via painel Supabase, ou pelo conector MCP autorizado nesta sessão) e rode `npx supabase link` + `npx supabase db push` para aplicar as migrations.
2. No painel do projeto Supabase: Authentication → crie o usuário admin (e-mail/senha) que vai logar em `/admin`.
   Importante: mantenha o cadastro público (signup) desativado nas configurações de Auth do projeto Supabase — a política de RLS dá a qualquer usuário autenticado acesso total às tabelas `vehicles` (incluindo a placa) e `leads`, então o único jeito de manter isso restrito ao time da loja é nunca permitir que estranhos criem conta.
3. Na Vercel: importe o repositório, aponte o "Root Directory" para `site/`, e configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (do projeto Supabase de produção)
   - `APIPLACAS_API_KEY` (nunca em texto puro fora do painel da Vercel)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER=5598991030107`
4. Deploy. Depois de validar o preview, aponte o DNS de `aguiarveiculos.com` para a Vercel (registro A/CNAME conforme instruções da própria Vercel ao adicionar o domínio no projeto).
5. Cadastre os primeiros depoimentos e a foto/história do "15 anos" pelo painel `/admin` antes de divulgar o link (itens em aberto 1 e 8 da spec).
