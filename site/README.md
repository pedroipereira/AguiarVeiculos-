# Site e painel — Aguiar Veículos

Aplicação Next.js com React, TypeScript e Supabase. A estrutura do repositório está no [README principal](../README.md) quando este diretório estiver no repositório público.

## Desenvolvimento local

Execute os comandos a partir desta pasta (`site/`):

1. Instale as dependências com `npm ci`.
2. Inicie o Supabase local com `npx supabase start` (requer Docker).
3. Copie `.env.local.example` para `.env.local` e preencha com a URL e a chave pública do ambiente de desenvolvimento.
4. Execute `npm run dev`.

Para usar um ambiente Supabase já existente, configure suas variáveis em vez de iniciar a instância local. Não use dados de produção para testes que alteram registros.

## Verificações

- `npm test`: suíte Vitest, com Supabase simulado e sem dependência de rede.
- `npm run typecheck`: verificação de tipos, variáveis e parâmetros sem uso, incluindo os testes.
- `npm run build`: build de produção; requer a configuração de ambiente e pode precisar de rede para baixar fontes.

O antigo comando `npm run lint` foi retirado porque não havia ESLint instalado nem configurado. A checagem de tipos não é apresentada como lint.

## Variáveis

| Nome | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `PUXAPLACA_TOKEN` | Consulta de placas, somente no servidor |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de atendimento |

Não versionar `.env.local` nem configurar a chave service role para esta aplicação. O exemplo contém apenas nomes e dados públicos de configuração.

## Banco e conteúdo

Migrações ficam em `supabase/migrations/`. O `seed.sql` contém dados de demonstração para desenvolvimento; não executá-lo em produção como parte do deploy.

Veículos, clientes, depoimentos e imagens cadastrados são mantidos no Supabase. Alterar arquivos locais ou publicar código não modifica automaticamente esse conteúdo.

Crie as contas administrativas pelo ambiente de autenticação autorizado e mantenha o cadastro público desativado: o modelo atual concede acesso administrativo aos usuários autenticados.

## Produção

O repositório público é `pedroipereira/AguiarVeiculos-`, com branch `main` e Root Directory `site/` na Vercel. Atualizar a `main` pode publicar o site. Use uma branch de trabalho e um pull request para revisar alterações.

Os materiais comerciais, fotos originais e entregas de marketing ficam no workspace interno da agência. Não copiá-los para o repositório público.
