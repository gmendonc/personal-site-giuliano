# 0002 — CSS sobre custom properties em vez de Tailwind

**Data:** 2026-07-28 · **Status:** aceito

## Contexto

O design system do projeto é distribuído como **CSS custom properties**: sete arquivos de token
(`colors`, `typography`, `spacing`, `radius-shadow`, `motion`, `base`) mais um `styles.css`. O
protótipo consome esses tokens diretamente, em `style` inline — cada regra é literalmente
`color:var(--text-strong)`, `border-radius:var(--radius-lg)`.

O AstroWind, base anterior, usa Tailwind 3 com paleta própria e um `CustomStyles.astro` de ponte.

O site tem 5 páginas e é mantido por uma pessoa.

## Decisão

Não usar Tailwind. Escrever CSS que consome os tokens do design system diretamente, mantendo os
arquivos de token como cópia não editada da fonte em `src/styles/tokens/`.

## Alternativas descartadas

**Mapear os tokens em `tailwind.config.js` e escrever classes utilitárias.** Custo real: duas
representações da mesma paleta convivendo (o token CSS e a classe Tailwind), e cada regra do
protótipo precisando de tradução manual para utilitário. Pior: o dark mode do Tailwind funciona por
variante de classe (`dark:bg-…`), enquanto o design system troca tema por override de custom
properties. Os dois mecanismos brigam — ou você duplica cada cor como variante Tailwind, ou usa
Tailwind só para layout e CSS para cor, o que é o pior dos dois mundos.

**Tailwind 4, que é nativamente baseado em custom properties.** Resolveria a briga de dark mode.
Descartado por proporção: para 5 páginas escritas por uma pessoa a partir de um protótipo que já é
CSS, uma camada de build de utilitários não elimina complexidade que exista — acrescenta uma
ferramenta a manter. O critério é o teste de ganho líquido: um elemento de design precisa **remover**
complexidade que existiria sem ele.

## Consequências aceitas

- Não há autocomplete de classe utilitária, e não há purga automática de CSS morto. Em um site
  deste tamanho, CSS morto é encontrável lendo.
- A consistência de espaçamento passa a depender de disciplina (`var(--space-6)`) em vez de ser
  imposta por vocabulário fechado. Mitigação: a convenção "nenhum valor literal de cor fora de
  `src/styles/tokens/`" é verificada por teste; espaçamento não é, e depende de revisão.
- Se o projeto crescer muito além do previsto e ganhar outra pessoa mantendo, essa decisão fica
  mais cara. É reversível — os tokens continuam sendo a fonte, e um `tailwind.config.js` que os
  consome pode ser acrescentado depois sem reescrever conteúdo.
