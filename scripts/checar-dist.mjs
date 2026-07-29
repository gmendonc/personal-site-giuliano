/**
 * Checagens sobre dist/, depois do build — SPEC §7.3.3.
 *
 * Isto é a forma executável da declaração do rodapé. Se alguma destas falhar,
 * o rodapé está mentindo.
 *
 * Uso: npm run build && npm run test:dist
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, relative, dirname } from 'node:path';

const DIST = join(process.cwd(), 'dist');

const LIMITE_IMAGEM = 200 * 1024;
const LIMITE_IMAGEM_POR_PAGINA = 500 * 1024;
const LIMITE_FONTES = 200 * 1024;

const EXT_IMAGEM = new Set(['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']);
const EXT_TEXTO = new Set(['.html', '.css', '.js']);

const falhas = [];
const notas = [];

const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;

async function percorrer(dir) {
  const encontrados = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...(await percorrer(caminho)));
    else encontrados.push(caminho);
  }
  return encontrados;
}

const arquivos = await percorrer(DIST).catch(() => {
  console.error('dist/ não existe. Rode `npm run build` antes.');
  process.exit(1);
});

/* ---------- 1. Zero requisições a host externo ---------- */

/*
 * O que conta como requisição, e o que não conta.
 *
 * A SPEC §7.3.3 diz "nenhum src, href, @import ou url() aponta para fora".
 * Tomado ao pé da letra, isso proíbe o <a href> do botão de assinatura — que a
 * própria SPEC §6 e o ADR 0003 EXIGEM que aponte para o provedor externo. Os
 * dois não podem estar certos ao mesmo tempo.
 *
 * O que a regra quer proteger é a promessa do rodapé: "nenhuma requisição a
 * servidor de terceiros". Um <a href> não faz requisição nenhuma — ele é
 * destino de navegação, e só sai do ar quando a pessoa clica e conscientemente
 * deixa o site. O que faz requisição no carregamento é <link>, <script>,
 * <img>, @import e url().
 *
 * Então o teste mede o que a promessa promete: recurso carregado, não link
 * clicável. Os links externos são listados abaixo, para ficarem visíveis.
 */
const PADROES_RECURSO = [
  ['<link href>', /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi],
  ['<script src>', /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi],
  ['src', /<(?:img|iframe|source|video|audio|embed|track)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi],
  ['srcset', /<(?:img|source)\b[^>]*\bsrcset\s*=\s*["']([^"']+)["']/gi],
  ['@import', /@import\s+(?:url\(\s*)?["']([^"']+)["']/gi],
  ['url()', /url\(\s*["']?([^"')]+)["']?\s*\)/gi],
];

const EXTERNO = /^(?:https?:)?\/\//i;

/* A origem do próprio site aparece legitimamente em canonical, og:url e no
   feed. Não é terceiro — é declaração de identidade. Precisa bater com
   SITE_URL em src/config.ts — os dois mudam juntos. */
const ORIGEM_PROPRIA = /^https:\/\/gmendonc\.github\.io/;

const linksExternos = new Set();

for (const arquivo of arquivos) {
  if (!EXT_TEXTO.has(extname(arquivo))) continue;

  const conteudo = await readFile(arquivo, 'utf8');

  for (const [rotulo, padrao] of PADROES_RECURSO) {
    for (const [, url] of conteudo.matchAll(padrao)) {
      if (!EXTERNO.test(url)) continue;
      if (ORIGEM_PROPRIA.test(url)) continue;
      falhas.push(`recurso de terceiro (${rotulo}) em ${relative(DIST, arquivo)} → ${url}`);
    }
  }

  /* Links de saída: registrados, não reprovados. */
  for (const [, url] of conteudo.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    if (EXTERNO.test(url) && !ORIGEM_PROPRIA.test(url)) linksExternos.add(url);
  }
}

for (const url of linksExternos) {
  notas.push(`link de saída (não é requisição, só navega quando clicado): ${url}`);
}

/* Também pega o caso do fonts.css do Google voltando por engano. */
for (const arquivo of arquivos) {
  if (!EXT_TEXTO.has(extname(arquivo))) continue;
  const conteudo = await readFile(arquivo, 'utf8');
  if (/fonts\.(googleapis|gstatic)\.com/.test(conteudo)) {
    falhas.push(`Google Fonts em ${relative(DIST, arquivo)} — tokens/ds.css foi importado?`);
  }
}

/* ---------- 2. Zero cookies, e localStorage só para o tema ---------- */

for (const arquivo of arquivos) {
  const ext = extname(arquivo);
  if (ext !== '.js' && ext !== '.html') continue;

  const conteudo = await readFile(arquivo, 'utf8');

  if (conteudo.includes('document.cookie')) {
    falhas.push(`document.cookie em ${relative(DIST, arquivo)}`);
  }

  for (const [, chave] of conteudo.matchAll(
    /localStorage\.(?:get|set|remove)Item\(\s*["']([^"']+)["']/g,
  )) {
    if (chave !== 'tema') {
      falhas.push(`localStorage com chave "${chave}" em ${relative(DIST, arquivo)}`);
    }
  }
}

/* ---------- 3. Orçamento de imagem ---------- */

const imagensPorPagina = new Map();

for (const arquivo of arquivos) {
  if (!EXT_IMAGEM.has(extname(arquivo))) continue;

  const { size } = await stat(arquivo);

  if (size > LIMITE_IMAGEM) {
    falhas.push(`imagem acima de 200 kB: ${relative(DIST, arquivo)} — ${kib(size)}`);
  }

  const pagina = dirname(relative(DIST, arquivo));
  imagensPorPagina.set(pagina, (imagensPorPagina.get(pagina) ?? 0) + size);
}

for (const [pagina, total] of imagensPorPagina) {
  if (total > LIMITE_IMAGEM_POR_PAGINA) {
    falhas.push(`soma de imagens acima de 500 kB em ${pagina || '/'} — ${kib(total)}`);
  }
}

/* Toda imagem de conteúdo precisa de width e height, senão CLS. */
for (const arquivo of arquivos) {
  if (extname(arquivo) !== '.html') continue;

  const conteudo = await readFile(arquivo, 'utf8');

  for (const [tag] of conteudo.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) {
      falhas.push(`<img> sem width/height em ${relative(DIST, arquivo)} — ${tag.slice(0, 90)}`);
    }
  }
}

if (imagensPorPagina.size === 0) {
  notas.push('nenhuma imagem em dist/ — esta fatia usa só placeholders em CSS (SPEC §9)');
}

/* ---------- 4. Orçamento de fonte ---------- */

let totalFontes = 0;
const fontes = [];

for (const arquivo of arquivos) {
  if (extname(arquivo) !== '.woff2') continue;
  const { size } = await stat(arquivo);
  totalFontes += size;
  fontes.push([relative(DIST, arquivo), size]);
}

for (const [nome, size] of fontes.sort((a, b) => b[1] - a[1])) {
  notas.push(`fonte ${kib(size).padStart(10)}  ${nome}`);
}
notas.push(`fonte ${kib(totalFontes).padStart(10)}  TOTAL (limite: ${kib(LIMITE_FONTES)})`);

if (totalFontes > LIMITE_FONTES) {
  falhas.push(
    `total de .woff2 acima de 200 kB — ${kib(totalFontes)}. ` +
      'Antes de subir o limite: cortar o itálico do Newsreader (64,5 kB, serve só ao wordmark).',
  );
}

/* ---------- 5. Peso por página — LINHA DE BASE, não portão ---------- */

/* SPEC §3.3 descartou o limite de 100 kB por página: ele mede um proxy, não a
   premissa. Aqui o número é registrado para comparação futura e NÃO reprova.
   O que reprova está acima. */
const pesoPorPagina = new Map();

for (const arquivo of arquivos) {
  if (!EXT_TEXTO.has(extname(arquivo))) continue;
  const { size } = await stat(arquivo);
  const pagina = relative(DIST, arquivo);
  if (extname(arquivo) === '.html') pesoPorPagina.set(pagina, size);
}

let pesoCompartilhado = 0;
for (const arquivo of arquivos) {
  const ext = extname(arquivo);
  if (ext !== '.css' && ext !== '.js') continue;
  pesoCompartilhado += (await stat(arquivo)).size;
}

notas.push('');
notas.push(`peso   ${kib(pesoCompartilhado).padStart(10)}  CSS+JS compartilhado (linha de base)`);
for (const [pagina, size] of [...pesoPorPagina].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
  notas.push(`peso   ${kib(size).padStart(10)}  ${pagina} (HTML, linha de base)`);
}

/* ---------- Relatório ---------- */

console.log('\nChecagens sobre dist/ (SPEC §7.3.3)\n');
for (const nota of notas) console.log(nota ? `  · ${nota}` : '');

if (falhas.length > 0) {
  console.error(`\n  ${falhas.length} falha(s):\n`);
  for (const falha of falhas) console.error(`  ✗ ${falha}`);
  console.error('');
  process.exit(1);
}

console.log('\n  ✓ zero recursos carregados de host externo');
console.log('  ✓ zero cookies; localStorage só com a chave "tema"');
console.log('  ✓ orçamento de imagem e de fonte dentro do limite');
console.log('  · peso por página é linha de base e não reprova nada — SPEC §3.3\n');
