# Organização do código

| Caminho | Responsabilidade |
|---|---|
| `site/src/app/(public)/` | Home, estoque, ficha do veículo e financiamento |
| `site/src/app/admin/` | Login e painel administrativo |
| `site/src/app/actions/` | Operações chamadas pela interface |
| `site/src/app/api/admin/` | Rotas administrativas e consultas externas |
| `site/src/components/` | Componentes agrupados por área |
| `site/src/lib/` | Validação, consultas, ações, formatação e regras |
| `site/src/middleware.ts` | Controle de acesso às rotas |
| `site/supabase/migrations/` | Evolução do esquema e políticas do banco |
| `site/tests/` | Testes da aplicação |
| `site/public/` | Recursos públicos servidos pelo site |

## Limites do repositório

Os materiais comerciais e de criação ficam na área interna do projeto. Arquivos enviados pelo administrador ficam no armazenamento e no banco Supabase.

As imagens e o vídeo legados de `site/public/` foram mantidos nesta organização porque referências externas ou cadastros do banco podem apontar para suas URLs. A retirada exige uma conferência própria.

## Documentação histórica

Planos e especificações antigos, antes em `docs/superpowers/`, foram preservados junto aos materiais internos em 27/09/2026. Também continuam consultáveis nos commits anteriores. As orientações atuais estão nos documentos da raiz e nesta pasta.
