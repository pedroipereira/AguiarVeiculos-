# Novo site institucional — Aguiar Veículos

Status: aprovado para virar plano de implementação
Data: 2026-08-28

## Contexto e objetivo

A Aguiar Veículos já teve um site (`aguiarveiculos.com`, domínio ainda ativo e em posse da empresa) e quer relançá-lo. A referência de estrutura é o site da [Belloni Motors](https://bellonimotors.com/) (concessionária premium de São Paulo, catalogada em `marketing/estrategia.md`) — não como cópia, mas como inspiração de sequência narrativa: hero → prova de confiança/diferenciais → estoque → "por que confiar na gente" → pessoa por trás da marca → prova social visual → contato. A identidade visual, o tom de voz e o conteúdo são 100% da Aguiar Veículos (ver `identidade/marca.md` e `marketing/voz-e-tom.md`).

Diferente do Belloni (site estático de vitrine), a Aguiar precisa que o **time interno consiga atualizar o estoque sozinho** (adicionar/remover carro, trocar fotos, marcar como vendido) sem depender de programação a cada mudança. Isso exige um painel administrativo com banco de dados por trás, não apenas um site estático.

## Arquitetura

- **Frontend**: Next.js (App Router). Escolhido por permitir páginas de catálogo dinâmicas (puxando do banco) e páginas institucionais rápidas/otimizadas para SEO local (buscas do tipo "carro seminovo Presidente Dutra").
- **Backend/dados**: Supabase.
  - Postgres para os dados estruturados (veículos, fotos).
  - Supabase Storage para as imagens dos veículos e da galeria.
  - Supabase Auth para proteger o painel `/admin` (login com e-mail/senha; 1 usuário admin no lançamento, extensível depois).
- **Hospedagem**: Vercel (deploy automático a partir do repositório Git).
- **Domínio**: `aguiarveiculos.com` (já ativo, propriedade da Aguiar) — DNS repontado para a Vercel no lançamento. Não é necessário registrar domínio novo.

**Dependência externa**: o conector Supabase MCP desta sessão precisa ser autorizado pelo usuário (via `/mcp` ou `claude mcp`) antes de eu conseguir provisionar o projeto Supabase real. Até lá, o desenvolvimento local pode seguir com um projeto Supabase de desenvolvimento criado manualmente ou com dados mockados.

## Modelo de dados (Postgres)

**`vehicles`**
- `id` (uuid, pk)
- `brand`, `model`, `version` (texto)
- `year_model`, `year_fabrication` (inteiro)
- `mileage_km` (inteiro)
- `price_cents` (inteiro — evita ponto flutuante)
- `fuel_type`, `transmission`, `color` (texto)
- `description` (texto longo)
- `is_featured` (boolean, default false) — controla se aparece na home
- `status` (enum: `available` | `sold`)
- `created_at`, `updated_at`

**`vehicle_images`**
- `id` (uuid, pk)
- `vehicle_id` (fk → vehicles)
- `storage_path` (referência ao arquivo no Supabase Storage)
- `display_order` (inteiro, define ordem de exibição)

**Autenticação**
- Usuários admin via Supabase Auth (tabela nativa `auth.users`), sem tabela de perfil customizada no MVP — checagem de acesso ao `/admin` é só "está autenticado ou não".

## Mapa do site

### Público

- **`/` (Home)** — inspirada na sequência do Belloni, com conteúdo e ordem final ajustados no plano de implementação conforme o que fizer mais sentido para o conteúdo real:
  1. Hero — logo, tagline curta, headline com bordão da marca (ex.: variações de "realizando sonhos sobre rodas"), 2 CTAs ("Ver estoque" / WhatsApp), imagem da fachada/loja.
  2. Diferenciais em cards — grounded em `marketing/estrategia.md` (procedência garantida, financiamento em até 60x, +10 bancos parceiros, aceita troca, veículos revisados/higienizados com garantia, 15 anos na região).
  3. Estoque em destaque — veículos com `is_featured = true`, puxados do banco; CTA "Ver todo o estoque" → `/estoque`.
  4. "Por que a Aguiar Veículos" — 2 a 3 pilares curtos (procedência/transparência, financiamento facilitado, clientes que voltam — tema recorrente nas legendas reais do Instagram).
  5. "15 anos" (equivalente à seção de fundador do Belloni) — foto e história curta do Antonio Aguiar. **Pendente**: foto e detalhes reais da história (ver Itens em aberto).
  6. Galeria/showroom — fotos reais da loja (pode reaproveitar acervo do Instagram, com autorização).
  7. Contato — WhatsApp fixo, Instagram, endereço com mapa (BR-135, Campo Dantas, Presidente Dutra - MA), telefone, horário de funcionamento.
- **`/estoque`** — catálogo completo (`status = available`), com filtro por marca, faixa de preço e ano.
- **`/estoque/[slug]`** — página de detalhe do veículo: galeria de fotos, ficha técnica completa, botão "Tenho interesse" → abre WhatsApp com mensagem pré-preenchida citando o carro.

### Admin (`/admin`, atrás de login)
- Login (Supabase Auth).
- Lista de veículos com busca/filtro simples.
- Formulário de criar/editar veículo (campos do modelo de dados acima + upload de múltiplas fotos + reordenar fotos + marcar destaque + marcar vendido/disponível).
- Excluir veículo (com confirmação).

## Conteúdo e identidade

- Cores, tipografia e logo: `identidade/marca.md` (Graphite `#111111`, Aguiar Red `#D32027`, Card Gray `#F4F4F4`, Support Gray `#6E6E6E`).
- Tom de voz de todo o texto do site: `marketing/voz-e-tom.md` (caloroso, grato, com acabamento mais moderno/profissional, mantendo a essência).
- Diferenciais e estrutura: `marketing/estrategia.md`.
- Nenhum texto, imagem ou código do site da Belloni Motors será reaproveitado literalmente — apenas a sequência/tipo de seção serve de referência.

## Fora de escopo (MVP)

- Checkout/pagamento online (venda continua sendo fechada via WhatsApp, como já é hoje).
- Múltiplos usuários/permissões no admin (fica para uma fase futura, se necessário).
- Integração com CRM ou banco de financiamento.
- Blog ou conteúdo institucional adicional além das seções listadas.
- Multilíngue.

## Erros e casos-limite

- Estoque vazio (nenhum veículo `is_featured`): a seção "estoque em destaque" da home não deve quebrar — mostra um estado vazio ou oculta a seção.
- Veículo sem fotos: exibir uma imagem placeholder no card/detalhe, nunca quebrar o layout.
- Upload de imagem: validar tipo (jpg/png/webp) e tamanho máximo antes de subir ao Storage.
- Rotas `/admin/*` inacessíveis sem sessão válida — redireciona para `/admin/login`.
- Página de detalhe de veículo inexistente ou vendido/removido: página 404 amigável, não erro cru.

## Testes

- Testes de integração das rotas de API/admin (CRUD de veículo).
- Teste manual do fluxo público: home → estoque → detalhe → clique "Tenho interesse" (WhatsApp abre com mensagem correta).
- Teste manual do fluxo admin: login → cadastrar veículo com fotos → aparece no site público → marcar como destaque → aparece na home → marcar como vendido → some do `/estoque`.

## Itens em aberto (não bloqueiam o início da implementação, mas precisam ser resolvidos antes do lançamento)

1. Foto e texto da história do Antonio Aguiar para a seção "15 anos".
2. Autorização do conector Supabase MCP nesta sessão (ou criação manual do projeto Supabase pelo usuário, com credenciais repassadas).
3. Wording final validado dos cards de diferenciais e dos pilares "Por que a Aguiar Veículos" (rascunho neste documento, ajustável no plano).
4. Confirmação de quais fotos da galeria/showroom serão usadas (reaproveitar do acervo do Instagram ou fotos novas).
5. Redirecionamento de DNS do domínio `aguiarveiculos.com` para a Vercel — ação a ser feita pelo usuário (ou orientada por mim) próximo ao lançamento.
