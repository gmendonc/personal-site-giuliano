@~/.claude/shared/desenvolvimento.md

# Site pessoal — Giuliano Mendonça

## O que é

Site pessoal de Giuliano Mendonça: executivo de IA que escreve sobre IA aplicada, decisão e gestão
do conhecimento. Um blog editorial com modelo de conteúdo de cinco formatos, mais páginas
institucionais. Público: lideranças que decidem sobre IA, e organizadores de evento avaliando um
palestrante.

## Stack

- Linguagem e versão: TypeScript, Node ≥ 20
- Framework: Astro 5, `output: 'static'`
- Estilo: CSS puro sobre custom properties do design system. **Não há Tailwind.** Ver ADR 0002.
- Build: `astro build`
- Hospedagem: GitHub Pages (reversível — nenhum código depende disso). Ver ADR 0003.

## Comandos

- Testes unitários: `npm test`
- Testes ponta a ponta e responsividade: `npm run test:e2e`
- Checagens sobre `dist/` (requisições externas, cookies, peso de imagem e fonte): `npm run test:dist`
- Lighthouse e acessibilidade: `npm run test:perf`
- Type check: `npm run check`
- Lint: `npm run lint`
- Dev local: `npm run dev`
- Build: `npm run build`

## Convenções deste projeto

- **Seção usada uma vez fica inline na página.** Só vira componente em `src/components/` quando
  existir um segundo ponto de chamada. Ver a justificativa em `SPEC.md`, seção "Avaliação da
  estrutura".
- **Os tokens do design system são copiados, não editados.** Arquivos em `src/styles/tokens/` vêm
  do projeto Claude Design (`DesignSync`, projectId `a510bff4-fd88-43ee-a11e-0fd76d1a8052`).
  Ajuste local vai em `src/styles/overrides.css`, nunca dentro de `tokens/`.
- **Nenhum valor de cor literal fora de `src/styles/tokens/`.** No resto do código, sempre
  `var(--token)`. Há teste que verifica isso.
- **Conteúdo é Markdown em `src/content/biblioteca/`,** com frontmatter validado por zod em
  `src/content/config.ts`. Build quebra em item inválido — é assim de propósito.
- Textos de interface em português do Brasil.

## Armadilhas

- **`tokens/motion.css` vem do design system com `--dur-fast/base/slow` em `0ms`,** enquanto o
  protótipo hardcoda `200ms`. O projeto resolve isso em `src/styles/overrides.css`, com valores
  reais e um bloco `prefers-reduced-motion` que os zera. Não volte a hardcodar duração.
- **`tokens/fonts.css` vem do design system com `@import` do Google Fonts.** Esse arquivo **não é
  usado** — as fontes são self-hosted via Fontsource. Importá-lo reintroduz um terceiro e faz
  `test:dist` falhar.
- **Não existe limite de kB por página, de propósito.** As premissas são rápido, responsivo e
  hospedagem barata, e elas são medidas por Lighthouse (LCP, CLS) e por orçamento de imagem — não
  por contador de bytes de HTML. Ver `SPEC.md` §3.3 e §7.3.
- **A troca de fonte é o principal risco de CLS.** Newsreader entra por `swap`; sem `@font-face` de
  fallback com `size-adjust`/`ascent-override` calibrado, o layout salta e `test:perf` falha. Não
  resolva isso subindo o limite de CLS.
- **Três tokens do design system reprovam em WCAG AA para texto pequeno** (`--text-subtle`,
  `--brand` e `--accent` sobre petrol). Ver `SPEC.md` §3.4 — há correção prescrita para dois deles
  e uma falha conhecida documentada para o terceiro. Não silencie o teste de contraste.
- O tema escuro é `:root[data-theme="dark"]` em CSS. O JS só troca o atributo. Se você se pegar
  escrevendo valor de cor em JavaScript, parou no lugar errado.

## Fora de escopo

- Sem Tailwind, sem framework de UI (React/Vue/Svelte), sem biblioteca de animação.
- Sem analytics, sem cookies, sem pop-up de assinatura. O rodapé promete isso publicamente.
- Sem CMS. Conteúdo é arquivo no repositório.
- Sem backend próprio. Nada que exija runtime de servidor.
