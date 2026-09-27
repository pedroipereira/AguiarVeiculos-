# Como trabalhar neste repositório

1. Atualize a referência da `main` e confira as alterações locais antes de começar.
2. Crie uma branch específica: `feat/`, `fix/` ou `chore/` com uma descrição curta.
3. Faça mudanças relacionadas a um único objetivo. Não envie credenciais nem materiais internos do cliente.
4. Revise o diff e faça as verificações correspondentes à mudança.
5. Abra um pull request com problema, resultado e evidências da verificação.
6. Integre na `main` quando a mudança estiver pronta para publicação. Confira a Vercel e as páginas afetadas.

## Verificação

Em `site/`, use `npm ci`, `npm test`, `npx tsc --noEmit` e `npm run build` para alterações de código. O build depende das variáveis de ambiente da aplicação e pode precisar de rede para as fontes. Nunca copie valores de produção para a descrição do pull request.

Para alterações somente documentais, valide caminhos e links relativos e confira que nenhum arquivo de aplicação ou configuração de deploy foi alterado.

O script `npm run lint` existente usa `next lint`; não o considere uma verificação concluída sem confirmar sua compatibilidade com a versão instalada. A organização documental não altera esse script.

## Banco de dados

Migrações ficam em `site/supabase/migrations/`. Mudanças em tabelas, políticas e dados precisam de revisão própria. Não executar `seed.sql` em produção como parte de uma atualização do site.

## Conteúdo

Veículos, clientes, depoimentos e imagens enviados pelo painel ficam no Supabase. Um commit de código não atualiza esses cadastros automaticamente.
