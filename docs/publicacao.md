# Publicação

## Configuração existente

- Repositório: `pedroipereira/AguiarVeiculos-`.
- Branch de produção: `main`.
- Vercel Root Directory: `site/`.
- Domínio: `aguiarveiculos.com`.
- Banco, autenticação e arquivos enviados: Supabase.

## Procedimento

1. Trabalhe em branch baseada na `main` atual.
2. Revise o diff, as variáveis necessárias e as migrações envolvidas.
3. Execute as verificações de [CONTRIBUTING.md](../CONTRIBUTING.md).
4. Abra o pull request e confira o preview quando a integração disponibilizá-lo.
5. Integre quando estiver pronto para produção. A Vercel acompanha a `main`.
6. Confira o resultado do deploy, home, estoque, ficha do veículo e acesso ao painel.

Não renomear o repositório, a branch de produção ou `site/` sem atualizar as integrações correspondentes.

## Variáveis

Use os nomes documentados em [site/.env.local.example](../site/.env.local.example). Os valores ficam em `.env.local` no desenvolvimento e nas configurações da hospedagem. Não inserir chaves em commits, logs ou documentos.

O cadastro público de usuários deve permanecer desativado conforme o modelo atual de autorização. O sistema atual considera usuários autenticados como administradores; permissões por papel são uma melhoria separada desta organização.

## Recuperação

Se um deploy causar regressão, use uma versão anterior na hospedagem ou um commit de reversão revisado. Não reescreva o histórico remoto. Uma reversão de código não desfaz automaticamente migrações ou alterações de dados no Supabase.
