import { test, expect } from '@playwright/test';

/** SPEC §7.3.2 — responsivo, medido em quatro larguras. */

const LARGURAS = [375, 768, 1024, 1440];
const ROTAS = ['', 'biblioteca', 'biblioteca/nao-existe-estrategia-de-ia'];

for (const largura of LARGURAS) {
  for (const rota of ROTAS) {
    test(`${largura}px · ${rota} · sem rolagem horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto(rota);

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(
        scrollWidth,
        `body.scrollWidth (${scrollWidth}) > innerWidth (${innerWidth})`,
      ).toBeLessThanOrEqual(innerWidth);
    });

    test(`${largura}px · ${rota} · nenhum elemento estoura a viewport`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto(rota);

      const estouros = await page.evaluate(() => {
        const limite = window.innerWidth + 1;
        return [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => el.getBoundingClientRect().right > limite)
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${el.className || '(sem classe)'}`);
      });

      expect(estouros).toEqual([]);
    });
  }
}

test.describe('375px — regras específicas de mobile', () => {
  test.use({ viewport: { width: 375, height: 900 } });

  for (const rota of ROTAS) {
    test(`${rota} · todo grid renderiza em uma coluna só`, async ({ page }) => {
      await page.goto(rota);

      const multiplos = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => getComputedStyle(el).display === 'grid')
          .map((el) => ({
            alvo: `${el.tagName.toLowerCase()}.${el.className || '(sem classe)'}`,
            tracks: getComputedStyle(el).gridTemplateColumns,
          }))
          /* "none" é grid de coluna implícita — uma coluna. Mais de um valor
             separado por espaço significa mais de um track. */
          .filter(({ tracks }) => tracks !== 'none' && tracks.trim().split(/\s+/).length > 1),
      );

      expect(multiplos).toEqual([]);
    });

    test(`${rota} · alvos de toque com 44px de altura`, async ({ page }) => {
      await page.goto(rota);

      const pequenos = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('a[href], button')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return false;
            /* Links dentro de parágrafo de prosa são texto corrido, não alvo
               isolado; o link de pular conteúdo fica fora da tela até receber
               foco. */
            if (el.closest('.prosa p')) return false;
            if (el.classList.contains('pular-para-conteudo')) return false;
            return r.height < 44;
          })
          .map((el) => {
            const r = el.getBoundingClientRect();
            return `${el.tagName.toLowerCase()}.${el.className || '(sem classe)'} — ${Math.round(r.height)}px`;
          }),
      );

      expect(pequenos).toEqual([]);
    });

    test(`${rota} · nenhum texto de corpo abaixo de 16px`, async ({ page }) => {
      await page.goto(rota);

      /* "Texto de corpo" = o que é renderizado na família de corpo. Rótulos em
         mono são metadado (data, tipo, eyebrow) e não entram nesta régua. */
      const pequenos = await page.evaluate(() => {
        const temTextoProprio = (el: Element) =>
          [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());

        return [...document.querySelectorAll<HTMLElement>('body *')]
          .filter(temTextoProprio)
          .filter((el) => {
            const estilo = getComputedStyle(el);
            if (/mono/i.test(estilo.fontFamily)) return false;
            if (el.closest('.visualmente-oculto')) return false;
            return parseFloat(estilo.fontSize) < 16;
          })
          .map((el) => {
            const estilo = getComputedStyle(el);
            return `${el.tagName.toLowerCase()}.${el.className || '(sem classe)'} — ${estilo.fontSize}`;
          });
      });

      expect(pequenos).toEqual([]);
    });
  }

  test('/biblioteca · a lista densa vira duas linhas', async ({ page }) => {
    await page.goto('biblioteca');

    /* Título em cima, metadados embaixo: o corpo começa acima da linha de
       metadados (SPEC §5.5). */
    const { topoCorpo, topoMeta } = await page.evaluate(() => {
      const item = document.querySelector('#lista li .item-link')!;
      return {
        topoCorpo: item.querySelector('.item-corpo')!.getBoundingClientRect().top,
        topoMeta: item.querySelector('.item-data')!.getBoundingClientRect().top,
      };
    });

    expect(topoCorpo).toBeLessThan(topoMeta);
  });
});
