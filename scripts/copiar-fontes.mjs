/**
 * Copia os .woff2 de node_modules (Fontsource) para public/fontes/.
 *
 * Por que copiar em vez de deixar o Vite resolver: o preload de §7.3.1 precisa
 * de uma URL estável, e ativo processado pelo Vite sai com hash no nome. Com
 * public/ o nome é previsível e o <link rel="preload"> pode apontar para ele.
 *
 * node_modules continua sendo a fonte da verdade — public/fontes/ é gerado e
 * está no .gitignore. Roda dentro de `npm run dev` e `npm run build`.
 *
 * Só o subset `latin`: cobre todo o português (ç ã õ á ê). Ver o comentário
 * longo em src/styles/fontes.css e PLAN.md.
 */
import { mkdir, copyFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'public', 'fontes');

const ARQUIVOS = [
  '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2',
  '@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2',
  '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2',
  '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
];

await mkdir(destino, { recursive: true });

let total = 0;

for (const relativo of ARQUIVOS) {
  const origem = join(raiz, 'node_modules', relativo);
  const nome = relativo.split('/').pop();

  const { size } = await stat(origem);
  await copyFile(origem, join(destino, nome));

  total += size;
  console.log(`  ${String(size).padStart(7)} B  ${nome}`);
}

console.log(`  ${String(total).padStart(7)} B  TOTAL (${(total / 1024).toFixed(1)} KiB)`);
