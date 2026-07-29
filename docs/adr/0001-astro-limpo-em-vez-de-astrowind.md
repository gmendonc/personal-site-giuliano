# 0001 — Astro limpo em vez de reaproveitar o AstroWind

**Data:** 2026-07-28 · **Status:** aceito

## Contexto

O repositório `personal-site-giuliano` continha o template **AstroWind v1.0.0-beta.51** em estado
vanilla. Verificado:

- `git log --oneline` → um único commit, `2e17616 Initial commit`, 2025-04-01.
- `src/config.yaml:2` → `name: AstroWind`, com o `googleSiteVerificationId` do autor do template.
- `src/pages/index.astro:16` → landing do template, CTA "Get template" apontando para
  `github.com/onwidget/astrowind`.
- `src/navigation.ts:6` → menu `Homes > SaaS / Startup / Mobile App / Personal`.
- `src/data/post/` → os 6 posts de demonstração do template.
- `src/assets/images/` → `app-store.png`, `google-play.png`, `hero-image.png`.

Não havia uma linha de conteúdo ou customização do Giuliano. O que existia era infraestrutura
genérica: 22 widgets de marketing, 4 homepages alternativas, 6 landing pages, páginas de pricing e
services.

Em paralelo, o design foi definido em um projeto Claude Design com design system próprio
(terracota/grafite/ivory, Newsreader + IBM Plex) e um protótipo de 5 páginas.

## Decisão

Descartar o AstroWind inteiro e criar um projeto Astro limpo na mesma raiz, preservando `.git/`
(o histórico permanece) e reescrevendo a árvore de trabalho.

## Alternativas descartadas

**Podar o AstroWind, mantendo o esqueleto.** O ganho seria SEO, sitemap, RSS, otimização de imagem
e content collections já configurados. Descartada porque a poda é trabalhosa e traiçoeira — 22
widgets, 10 páginas de demo e uma cadeia de configuração em `src/config.yaml` + `vendor/integration/`
que precisa ser entendida antes de ser removida. Sobra é o modo de falha típico: código morto que
ninguém tem certeza se pode apagar. O que se ganharia, em Astro 5, custa cerca de um dia para
reconstruir sob medida.

**Manter o AstroWind com Tailwind, mapeando os tokens.** Ver [ADR 0002](0002-css-com-tokens-em-vez-de-tailwind.md).

## Consequências aceitas

- É preciso reconstruir SEO/OpenGraph, sitemap, RSS e otimização de imagem. Estimativa: um dia.
  Astro 5 traz `@astrojs/rss`, `@astrojs/sitemap` e `astro:assets` de fábrica, então é configuração,
  não implementação.
- Perde-se qualquer atualização futura do template upstream. Isso não é perda real: o site não é
  um fork do AstroWind e nunca receberia merge dele.
- O histórico Git fica com um primeiro commit que não tem relação com o código atual. Aceito —
  preservar o histórico custa zero e apagá-lo não ganha nada.
