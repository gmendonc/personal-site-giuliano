# Site pessoal — Giuliano Mendonça

Blog editorial com modelo de conteúdo de cinco formatos. Astro 5, saída estática, CSS
sobre custom properties do design system. Sem Tailwind, sem framework de UI, sem
analytics, sem cookies.

O **o quê** está em [SPEC.md](../SPEC.md); o **em que ordem e onde estamos**, em
[PLAN.md](../PLAN.md); as decisões de arquitetura, em [docs/adr/](../docs/adr/).

## Comandos

| comando | o que faz |
| --- | --- |
| `npm run dev` | copia as fontes e sobe o servidor local |
| `npm run build` | copia as fontes e gera `dist/` |
| `npm run preview` | serve `dist/` em `localhost:4321` |
| `npm run check` | type check do Astro |
| `npm run lint` | ESLint |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | ponta a ponta, tema, responsivo e acessibilidade (Playwright) |
| `npm run test:dist` | checagens sobre `dist/`: terceiros, cookies, imagem, fonte |
| `npm run test:perf` | Lighthouse mobile nas três rotas |

`test:dist` e `test:perf` precisam de `npm run build` antes.

## Onde as decisões moram

Cada uma destas tem **um** dono. Mudar a decisão deve tocar um arquivo.

| decisão | arquivo |
| --- | --- |
| quais formatos de conteúdo existem | `src/content/tipos.ts` |
| provedor e mecanismo da newsletter | `src/components/Newsletter.astro` |
| quais fontes, quais subsets, quais fallbacks | `src/styles/fontes.css` |
| cores do tema escuro | `src/styles/overrides.css` |
| URL do site, menu, contagem de leitores | `src/config.ts` |

## Armadilhas

- **`src/styles/tokens/` é cópia não editada** do design system. Ajuste local vai em
  `overrides.css`. Ver `src/styles/README.md`.
- **`tokens/ds.css` não pode ser importado** — ele puxa o Google Fonts e quebra
  `test:dist`.
- **Nenhum valor de cor fora de `src/styles/`.** Há teste.
- **Nenhuma duração literal.** Sempre `var(--dur-base)`. Há teste.
- **`public/fontes/` é gerado** por `scripts/copiar-fontes.mjs` e está no
  `.gitignore`. Não edite à mão.
- Um item com `tipo` inválido **quebra o build de propósito**. Não conserte.
