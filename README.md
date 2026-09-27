# Aguiar Veículos

Site e painel de administração da Aguiar Veículos, em Presidente Dutra — MA.

- Site: https://aguiarveiculos.com
- Aplicação: Next.js, React, TypeScript e Supabase.
- Diretório da aplicação e raiz configurada na Vercel: `site/`.

## Estrutura

```text
.github/                 Modelo de pull request
docs/                   Documentação técnica
site/
   src/                  Páginas, componentes e regras da aplicação
   public/               Arquivos públicos usados pelo site
   supabase/             Configuração e migrações do banco
   tests/                Testes automatizados
```

## Começar

Consulte [a instalação local](site/README.md), [a organização do código](docs/estrutura.md) e [o fluxo de contribuição](CONTRIBUTING.md).

## Publicação

A branch `main` está ligada à Vercel; sua atualização pode publicar o site. Consulte [o procedimento de publicação](docs/publicacao.md). Mantenha a aplicação em `site/`.

## Materiais do cliente

Este repositório concentra o código e sua documentação. Estratégia comercial, fontes de pesquisa, fotos originais e matrizes de identidade são mantidas no workspace interno da agência.

Na organização de 27/09/2026, os materiais existentes fora da aplicação foram preservados nesse workspace e retirados da árvore atual deste repositório. Os commits anteriores continuam disponíveis. Os arquivos públicos da aplicação foram preservados, inclusive imagens e vídeo antigos, para não quebrar URLs existentes.
