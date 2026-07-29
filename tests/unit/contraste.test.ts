import { describe, expect, it } from 'vitest';
import { contrasteEntre } from './ajuda/cores';

/**
 * Contraste WCAG AA (SPEC §3.4).
 *
 * Os números não são copiados da SPEC: são recalculados a partir dos
 * hexadecimais que estão hoje em tokens/colors.css e overrides.css, pela
 * fórmula de luminância relativa da WCAG 2.1. Se alguém mexer num token, a
 * conta muda aqui.
 */

const AA_TEXTO_NORMAL = 4.5;

describe('Correções aplicadas — devem passar em AA', () => {
  it('--text-subtle sobre --page (corrigido para --graphite-500)', () => {
    const ratio = contrasteEntre('--text-subtle', '--page');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it('--text-subtle sobre --surface-card', () => {
    const ratio = contrasteEntre('--text-subtle', '--surface-card');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it('--text-subtle sobre --page, no tema escuro', () => {
    const ratio = contrasteEntre('--text-subtle', '--page', 'escuro');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it('--text-link sobre --page — o substituto de --brand em texto pequeno', () => {
    const ratio = contrasteEntre('--text-link', '--page');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it('--text-link sobre --page, no tema escuro', () => {
    const ratio = contrasteEntre('--text-link', '--page', 'escuro');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  /* O Badge pinta --text-link sobre --brand-subtle. No tema escuro isso dava
     2.25, porque a lista da SPEC §3.2 troca o primeiro e esquece o segundo.
     Ver a nota em overrides.css. */
  it.each([['claro'], ['escuro']] as const)(
    '--text-link sobre --brand-subtle no tema %s — o par do Badge',
    (tema) => {
      const ratio = contrasteEntre('--text-link', '--brand-subtle', tema);
      expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
    },
  );
});

describe('Já passavam — travados para não regredir', () => {
  it.each([
    ['--text-strong', '--page'],
    ['--text-body', '--page'],
    ['--text-muted', '--page'],
  ])('%s sobre %s', (frente, fundo) => {
    const ratio = contrasteEntre(frente, fundo);
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it.each([
    ['--text-strong', '--page'],
    ['--text-body', '--page'],
    ['--text-muted', '--page'],
  ])('%s sobre %s, no tema escuro', (frente, fundo) => {
    const ratio = contrasteEntre(frente, fundo, 'escuro');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it('--ivory-50 sobre --petrol-400 — texto da faixa Aparições', () => {
    const ratio = contrasteEntre('--ivory-50', '--petrol-400');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });

  it('--ivory-50 sobre --graphite-900 — texto do rodapé', () => {
    const ratio = contrasteEntre('--ivory-50', '--graphite-900');
    expect(ratio, `ratio real: ${ratio}`).toBeGreaterThanOrEqual(AA_TEXTO_NORMAL);
  });
});

/**
 * FALHA CONHECIDA E DOCUMENTADA — SPEC §3.4.
 *
 * --accent (#D9A441) sobre --petrol-400 (#1F4B43) reprova em AA para texto
 * pequeno. É o eyebrow do bloco Aparições na home.
 *
 * A correção exige um dourado mais claro (direção --gold-200 #E7C57E), o que
 * muda a aparência do design system — decisão do Giuliano, não da
 * implementação. O ideal é corrigir na origem, no projeto Claude Design, para
 * que tokens/colors.css volte a ser fonte de verdade.
 *
 * O teste NÃO está silenciado: ele afirma o ratio real. No dia em que alguém
 * corrigir o token, este teste quebra e obriga a atualizar a decisão aqui —
 * que é exatamente o comportamento desejado para uma dívida registrada.
 */
describe('Falha conhecida — --accent sobre --petrol-400 (SPEC §3.4)', () => {
  it('continua reprovando em AA, com o ratio registrado', () => {
    const ratio = contrasteEntre('--accent', '--petrol-400');

    console.warn(
      `\n  ⚠ FALHA CONHECIDA (SPEC §3.4): --accent sobre --petrol-400 = ${ratio}` +
        `\n    Mínimo AA para texto pequeno: ${AA_TEXTO_NORMAL}. Aguarda decisão do Giuliano.\n`,
    );

    expect(ratio).toBeLessThan(AA_TEXTO_NORMAL);
    expect(ratio).toBeCloseTo(4.35, 1);
  });
});
