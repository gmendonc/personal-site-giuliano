/**
 * Gera os @font-face de fallback com size-adjust / ascent-override /
 * descent-override exigidos por SPEC §7.3.1 — sem eles a troca de fonte
 * desloca o layout e o CLS estoura.
 *
 * As métricas vêm de @capsizecss/metrics (tabelas hhea/OS-2 reais de cada
 * fonte), não de chute. A saída é colada em src/styles/fontes.css, que é o
 * único arquivo que sabe de fonte.
 *
 * Uso: node scripts/gerar-fallback-fontes.mjs
 */
import { entireMetricsCollection as colecao } from '@capsizecss/metrics/entireMetricsCollection';

/**
 * Calcula os overrides que fazem a fonte de fallback ocupar a mesma caixa da
 * fonte real. size-adjust equaliza a largura média do glifo 'x'; os overrides
 * de ascent/descent reproduzem a altura de linha depois dessa escala.
 */
function calcularOverrides(nomeReal, nomeFallback) {
  const real = colecao[nomeReal];
  const fallback = colecao[nomeFallback];
  if (!real) throw new Error(`métrica ausente: ${nomeReal}`);
  if (!fallback) throw new Error(`métrica ausente: ${nomeFallback}`);

  const sizeAdjust = real.xWidthAvg / real.unitsPerEm / (fallback.xWidthAvg / fallback.unitsPerEm);
  const escala = real.unitsPerEm * sizeAdjust;

  return {
    sizeAdjust: sizeAdjust * 100,
    ascent: (real.ascent / escala) * 100,
    descent: (Math.abs(real.descent) / escala) * 100,
    lineGap: (real.lineGap / escala) * 100,
  };
}

const pct = (n) => `${n.toFixed(4)}%`;

function regra({ familia, local, real, fallback }) {
  const o = calcularOverrides(real, fallback);
  return [
    `/* ${real} → ${fallback} · gerado por scripts/gerar-fallback-fontes.mjs */`,
    `@font-face {`,
    `  font-family: '${familia}';`,
    `  src: local('${local}');`,
    `  size-adjust: ${pct(o.sizeAdjust)};`,
    `  ascent-override: ${pct(o.ascent)};`,
    `  descent-override: ${pct(o.descent)};`,
    `  line-gap-override: ${pct(o.lineGap)};`,
    `}`,
  ].join('\n');
}

console.log(
  [
    regra({
      familia: 'Newsreader Fallback',
      local: 'Georgia',
      real: 'newsreader',
      fallback: 'georgia',
    }),
    '',
    regra({
      familia: 'Plex Sans Fallback',
      local: 'Arial',
      real: 'iBMPlexSans',
      fallback: 'arial',
    }),
  ].join('\n'),
);
