# Camada de estilo

## Regra que não se quebra

`tokens/` é **cópia não editada** do design system (projeto Claude Design,
`projectId a510bff4-fd88-43ee-a11e-0fd76d1a8052`). Ajuste local vai em
`overrides.css`, nunca dentro de `tokens/`.

Nenhum valor de cor literal fora de `tokens/` e `overrides.css`. No resto do código,
sempre `var(--token)`. Há teste que verifica isso.

## Ordem de carga

`global.css` é a entrada única e importa nesta ordem: os seis arquivos de token,
depois `fontes.css`, depois `overrides.css`. O override vem por último para vencer na
cascata sem precisar de `!important`.

## ⚠️ `tokens/ds.css` não é importado — de propósito

`ds.css` é a cópia de `styles.css` do design system, guardada aqui por procedência
(SPEC §2.1 manda copiá-la). Ele **não entra no build**, e não deve entrar: a primeira
linha dele é

```css
@import url('./tokens/fonts.css');
```

e `tokens/fonts.css` faz `@import` do Google Fonts. Importar `ds.css` reintroduz um
servidor de terceiro, torna falsa a declaração do rodapé e faz `npm run test:dist`
falhar na checagem de requisições externas.

As fontes deste site são self-hosted via Fontsource. Quem manda nelas é `fontes.css`.

## Arquivos

| arquivo | papel |
| --- | --- |
| `tokens/*.css` | cópia do design system. Não edite. |
| `tokens/ds.css` | procedência apenas. **Não importe.** |
| `fontes.css` | `@font-face` das três famílias e os fallbacks métricos. Único arquivo que sabe de fonte. |
| `overrides.css` | fallback nas famílias, piso de 16px no mobile, correções de contraste, tema escuro. |
| `global.css` | entrada única, layout compartilhado, utilitários de acessibilidade. |
| `prosa.css` | tipografia do corpo em Markdown. Importado só pela página da peça. |

## O que NÃO está aqui

Não há override de `--dur-*`. A SPEC §3.1 pede um, partindo de que
`tokens/motion.css` viria com as durações em `0ms` — o que não é mais verdade. O
arquivo já vem correto da origem, e duplicar os valores aqui criaria duas fontes para
a mesma decisão. Ver PLAN.md, "Achados verificados".
