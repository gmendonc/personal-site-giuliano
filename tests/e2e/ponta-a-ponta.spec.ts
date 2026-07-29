import { test, expect } from '@playwright/test';

/** SPEC §7.4 — ponta a ponta. */

test('a home tem exatamente um h1, com o título do protótipo', async ({ page }) => {
  await page.goto('');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('Descomplicando a tecnologia');
});

test('a lista densa da home mostra 5 itens, em ordem de data decrescente', async ({ page }) => {
  await page.goto('');
  const itens = page.locator('.lista-densa li');

  await expect(itens).toHaveCount(5);

  const datas = await itens
    .locator('time')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('datetime') ?? ''));

  expect(datas).toEqual([...datas].sort().reverse());
});

test('a home lista os mesmos 5 itens mais recentes que a biblioteca', async ({ page }) => {
  await page.goto('biblioteca');
  const naBiblioteca = await page.locator('#lista li .item-titulo').allTextContents();

  await page.goto('');
  const naHome = await page.locator('.lista-densa li .item-titulo').allTextContents();

  expect(naHome).toEqual(naBiblioteca.slice(0, 5));
});

test.describe('/biblioteca', () => {
  test('a contagem exibida é igual ao número de li visíveis', async ({ page }) => {
    await page.goto('biblioteca');

    const visiveis = await page.locator('#lista li:visible').count();
    const contagem = await page.locator('#contagem').textContent();

    expect(contagem?.trim()).toBe(`${visiveis}${visiveis === 1 ? ' item' : ' itens'}`);
  });

  test('o chip Ensaio reduz a lista, e a contagem acompanha', async ({ page }) => {
    await page.goto('biblioteca');

    const total = await page.locator('#lista li:visible').count();
    await page.locator('[data-filtro="ensaio"]').click();

    const visiveis = page.locator('#lista li:visible');
    const restantes = await visiveis.count();

    expect(restantes).toBeGreaterThan(0);
    expect(restantes).toBeLessThan(total);

    const tipos = await visiveis.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.tipo),
    );
    expect(new Set(tipos)).toEqual(new Set(['ensaio']));

    const contagem = await page.locator('#contagem').textContent();
    expect(contagem?.trim()).toBe(`${restantes}${restantes === 1 ? ' item' : ' itens'}`);
  });

  test('o filtro sobrevive a um recarregamento com ?tipo= na URL', async ({ page }) => {
    await page.goto('biblioteca?tipo=ensaio');

    const tipos = await page
      .locator('#lista li:visible')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.tipo));

    expect(new Set(tipos)).toEqual(new Set(['ensaio']));
  });

  test('o chip Todos devolve a lista completa', async ({ page }) => {
    await page.goto('biblioteca?tipo=ensaio');
    const filtrados = await page.locator('#lista li:visible').count();

    await page.locator('[data-filtro="todos"]').click();
    const todos = await page.locator('#lista li:visible').count();

    expect(todos).toBeGreaterThan(filtrados);
  });
});

test('clicar no primeiro item leva à peça, e o h1 de lá é o título clicado', async ({ page }) => {
  await page.goto('biblioteca');

  const primeiro = page.locator('#lista li').first();
  const titulo = (await primeiro.locator('.item-titulo').textContent())?.trim();

  await primeiro.locator('a').click();

  await expect(page).toHaveURL(/\/biblioteca\/[^/]+$/);
  await expect(page.locator('h1')).toHaveText(titulo ?? '');
});

test('/rss.xml é XML válido, com um item por peça publicada', async ({ page, request }) => {
  await page.goto('biblioteca');
  const publicadas = await page.locator('#lista li').count();

  const resposta = await request.get('rss.xml');
  expect(resposta.status()).toBe(200);

  const xml = await resposta.text();
  expect(xml).toContain('<?xml');
  expect(xml).toContain('<rss');

  expect(xml.match(/<item>/g) ?? []).toHaveLength(publicadas);

  /* Os <link> do RSS precisam levar o subcaminho de base do GitHub Pages, não
     só a origem. Esta checagem pegou um bug real: rss.xml.ts é .ts, não
     .astro, e escapou do refactor de base path — o link saía para
     gmendonc.github.io/biblioteca/… em vez de …/personal-site-giuliano/biblioteca/…
     Só contar <item> não pegava isso; é preciso olhar o conteúdo do link. */
  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect(link, `link do RSS sem o subcaminho de base: ${link}`).toContain(
      '/personal-site-giuliano/',
    );
  }
});

test('peça marcada como rascunho não aparece, não entra no RSS e não gera rota', async ({
  page,
  request,
}) => {
  const SLUG = 'tres-perguntas-antes-do-piloto';

  await page.goto('biblioteca');
  await expect(page.locator(`#lista a[href*="${SLUG}"]`)).toHaveCount(0);

  const rss = await (await request.get('rss.xml')).text();
  expect(rss).not.toContain(SLUG);

  const rota = await request.get(`biblioteca/${SLUG}`);
  expect(rota.status()).toBe(404);
});

test('os itens de menu não implementados são visíveis e inertes', async ({ page }) => {
  await page.goto('');

  for (const rotulo of ['Aparições', 'Sobre', 'Trabalhar comigo']) {
    const item = page.locator('.nav-item', { hasText: rotulo }).first();
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(await item.evaluate((el) => el.tagName.toLowerCase())).not.toBe('a');
  }
});

test('o botão de buscar do protótipo não existe nesta fatia', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('button', { name: /buscar/i })).toHaveCount(0);
});

test('o bloco de newsletter não menciona o provedor fora do próprio componente', async ({
  page,
}) => {
  await page.goto('');

  /* SPEC §6.1: nenhuma página menciona o provedor. Ele aparece só no rótulo do
     botão, que é renderizado por Newsletter.astro. */
  const mencoesForaDoBotao = await page.evaluate(() => {
    const corpo = document.body.cloneNode(true) as HTMLElement;
    corpo.querySelectorAll('.newsletter').forEach((n) => n.remove());
    return (corpo.textContent ?? '').includes('Substack');
  });

  expect(mencoesForaDoBotao).toBe(false);
});

test('o botão de assinatura abre a URL configurada em nova aba', async ({ page }) => {
  await page.goto('');

  const botao = page.getByRole('link', { name: /Assinar/ }).first();
  await expect(botao).toHaveAttribute('target', '_blank');
  await expect(botao).toHaveAttribute('rel', /noopener/);
  await expect(botao).toHaveAttribute('href', /^https:\/\//);
});

test('a contagem de leitores some enquanto for zero', async ({ page }) => {
  await page.goto('');
  /* SPEC §6.2: não renderizar o placeholder "[N] leitores" do protótipo. */
  await expect(page.locator('.newsletter-leitores')).toHaveCount(0);
  await expect(page.getByText('[N] leitores')).toHaveCount(0);
});

test('o rodapé traz a declaração técnica corrigida, sem o número de kB', async ({ page }) => {
  await page.goto('');
  const declaracao = page.locator('.rodape-declaracao');

  await expect(declaracao).toContainText('Nenhuma requisição a servidor de terceiros');
  await expect(declaracao).not.toContainText('100 kB');
});

test('a peça permanente aparece em Padrões nomeados', async ({ page }) => {
  await page.goto('biblioteca');

  const chips = page.locator('.padrao-chip');
  await expect(chips).toHaveCount(1);
  /* Regex, não string exata: o href leva o prefixo de base do GitHub Pages
     (/personal-site-giuliano), e este teste não deveria conhecer esse
     detalhe de deploy — só que a rota final está certa. */
  await expect(chips.first()).toHaveAttribute('href', /\/biblioteca\/quatro-frentes$/);
});

test('/404 responde e traz saída para a biblioteca', async ({ page }) => {
  const resposta = await page.goto('rota-que-nao-existe');
  expect(resposta?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Esta página não existe');
});
