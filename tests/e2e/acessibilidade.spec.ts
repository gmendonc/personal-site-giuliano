import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** SPEC §7.3.4 — acessibilidade. */

const ROTAS = ['', 'biblioteca', 'biblioteca/nao-existe-estrategia-de-ia'];

/**
 * FALHA CONHECIDA E DOCUMENTADA — SPEC §3.4 e §7.3.4.
 *
 * --accent (#D9A441) sobre --petrol-400 (#1F4B43) dá 4.35, abaixo do mínimo AA
 * de 4.5 para texto pequeno. São os eyebrows da faixa Aparições na home.
 *
 * A SPEC diz explicitamente que se espera que este par continue falhando até o
 * Giuliano decidir, e manda marcá-lo como falha conhecida COM O RATIO REAL no
 * relatório — não silenciar. É o que este bloco faz: os nós deste par exato
 * são separados e reportados alto; qualquer outra violação grave reprova.
 *
 * Corrigir exige um dourado mais claro (direção --gold-200), o que muda a
 * aparência do design system. O certo é corrigir na origem, no projeto Claude
 * Design, para que tokens/colors.css volte a ser fonte de verdade.
 */
const PAR_CONHECIDO = { frente: '#d9a441', fundo: '#1f4b43' };

const ehParConhecido = (resumo: string) =>
  resumo.toLowerCase().includes(PAR_CONHECIDO.frente) &&
  resumo.toLowerCase().includes(PAR_CONHECIDO.fundo);

for (const rota of ROTAS) {
  for (const tema of ['claro', 'escuro'] as const) {
    test(`axe · ${rota} · tema ${tema} · zero violações serious/critical`, async ({ page }) => {
      await page.goto(rota);

      if (tema === 'escuro') {
        await page.getByRole('button', { name: 'Alternar tema' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      }

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

      const conhecidas: string[] = [];
      const inesperadas: string[] = [];

      for (const v of graves) {
        for (const no of v.nodes) {
          const resumo = no.failureSummary ?? '';
          const alvo = no.target.join(' ');

          if (v.id === 'color-contrast' && ehParConhecido(resumo)) {
            const ratio = resumo.match(/contrast of ([\d.]+)/)?.[1] ?? '?';
            conhecidas.push(`${alvo} — ratio ${ratio}`);
          } else {
            inesperadas.push(`${v.id} (${v.impact}) em ${alvo} :: ${resumo.replace(/\s+/g, ' ').slice(0, 160)}`);
          }
        }
      }

      if (conhecidas.length > 0) {
        console.warn(
          `\n  ⚠ FALHA CONHECIDA (SPEC §3.4) em ${rota} [${tema}] — ` +
            `--accent sobre --petrol-400, mínimo AA 4.5:\n` +
            conhecidas.map((c) => `      ${c}`).join('\n') +
            `\n    Aguarda decisão do Giuliano. Não silencie sem resolver na origem.\n`,
        );
      }

      expect(inesperadas).toEqual([]);
    });
  }
}

test('Tab alcança botão de tema, chips de filtro e itens da lista, com foco visível', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('biblioteca');

  const alcancados: string[] = [];

  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press('Tab');

    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;

      const estilo = getComputedStyle(el);
      return {
        marca: `${el.tagName.toLowerCase()}.${el.className || '(sem classe)'}`,
        temFoco: estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none',
      };
    });

    if (!info) continue;
    alcancados.push(info.marca);

    expect(info.temFoco, `sem foco visível em ${info.marca}`).toBe(true);
  }

  const juntos = alcancados.join(' ');
  expect(juntos, 'o botão de tema deveria ser alcançável por Tab').toContain('botao-tema');
  expect(juntos, 'os chips de filtro deveriam ser alcançáveis por Tab').toContain('tag');
  expect(juntos, 'os itens da lista deveriam ser alcançáveis por Tab').toContain('item-link');
});

test('o link de pular para o conteúdo é o primeiro alvo de Tab', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('Tab');

  const classe = await page.evaluate(() => document.activeElement?.className ?? '');
  expect(classe).toContain('pular-para-conteudo');
});

test('o ícone de formato é decorativo, e o rótulo textual acompanha', async ({ page }) => {
  await page.goto('biblioteca');

  /* O ícone não deve ser lido pelo leitor de tela — quem carrega o significado
     é o rótulo em .item-tipo, que fica ao lado. */
  const primeiroItem = page.locator('#lista li').first();
  await expect(primeiroItem.locator('.item-icone')).toHaveAttribute('aria-hidden', 'true');
  await expect(primeiroItem.locator('.item-tipo')).not.toHaveText('');
});
