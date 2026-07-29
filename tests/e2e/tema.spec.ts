import { test, expect } from '@playwright/test';

/** SPEC §7.2 — o tema é CSS; o JavaScript só troca data-theme. */

test.describe('Alternância de tema', () => {
  test('alterna, persiste no recarregamento, e volta ao claro', async ({ page }) => {
    await page.goto('');
    const raiz = page.locator('html');
    const botao = page.getByRole('button', { name: 'Alternar tema' });

    await expect(raiz).not.toHaveAttribute('data-theme', 'dark');

    await botao.click();
    await expect(raiz).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(raiz).toHaveAttribute('data-theme', 'dark');

    await botao.click();
    /* O atributo é removido, não trocado por "light". */
    await expect(raiz).not.toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(raiz).not.toHaveAttribute('data-theme', 'dark');
  });

  test('o tema escuro sobrevive à navegação entre páginas', async ({ page }) => {
    await page.goto('');
    await page.getByRole('button', { name: 'Alternar tema' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('link', { name: 'Ver toda a biblioteca →' }).click();
    await expect(page).toHaveURL(/\/biblioteca/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.locator('#lista li a').first().click();
    await expect(page).toHaveURL(/\/biblioteca\/.+/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('o rótulo do botão acompanha o tema', async ({ page }) => {
    await page.goto('');

    /* Os dois rótulos existem no DOM; quem troca é o CSS, para o texto já sair
       certo no primeiro paint. Então o teste olha visibilidade, não
       textContent — que traria os dois. */
    const paraEscuro = page.locator('.rotulo-para-escuro');
    const paraClaro = page.locator('.rotulo-para-claro');

    await expect(paraEscuro).toBeVisible();
    await expect(paraClaro).toBeHidden();

    await page.getByRole('button', { name: 'Alternar tema' }).click();

    await expect(paraEscuro).toBeHidden();
    await expect(paraClaro).toBeVisible();
  });
});

test.describe('Preferência do sistema', () => {
  test.use({ colorScheme: 'dark' });

  test('com localStorage vazio e prefers-color-scheme dark, abre escura', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('localStorage vence a preferência do sistema', async ({ page }) => {
    await page.goto('');
    await page.evaluate(() => localStorage.setItem('tema', 'light'));
    await page.reload();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Sem flash', () => {
  test.use({ colorScheme: 'dark' });

  test('data-theme já está definido quando o DOM termina de ser lido', async ({ page }) => {
    /* Registra, no exato momento do DOMContentLoaded, se o atributo já estava
       posto. Se estava, foi um script síncrono durante o parsing que o pôs —
       antes de qualquer pintura — e não houve flash.
       (MutationObserver não serve aqui: no document_start o
       document.documentElement ainda pode não existir para ser observado.) */
    await page.addInitScript(() => {
      const alvo = window as unknown as { __temaNoDCL: string | null };
      alvo.__temaNoDCL = null;
      document.addEventListener('DOMContentLoaded', () => {
        alvo.__temaNoDCL = document.documentElement.dataset.theme ?? 'ausente';
      });
    });

    await page.goto('', { waitUntil: 'load' });

    const noDCL = await page.evaluate(
      () => (window as unknown as { __temaNoDCL: string | null }).__temaNoDCL,
    );

    expect(noDCL, 'data-theme deveria estar posto já no DOMContentLoaded').toBe('dark');
  });

  test('o script de tema é inline no <head>, não um arquivo externo adiado', async ({ page }) => {
    /* Um <script src> com defer só roda depois do parsing, e aí a página já
       pintou clara. A garantia de ausência de flash depende de o script ser
       inline e síncrono, dentro do <head>. */
    await page.goto('');

    const inline = await page.evaluate(() =>
      [...document.head.querySelectorAll('script')].some(
        (s) =>
          !s.src &&
          !s.defer &&
          !s.async &&
          (s.textContent ?? '').includes('dataset.theme') &&
          (s.textContent ?? '').includes('localStorage'),
      ),
    );

    expect(inline, 'o script de tema deveria ser inline e síncrono no <head>').toBe(true);
  });
});
