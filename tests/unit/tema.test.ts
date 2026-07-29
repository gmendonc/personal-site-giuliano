import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const RAIZ_SRC = join(process.cwd(), 'src');

async function arquivos(dir: string, filtro: RegExp): Promise<string[]> {
  const entradas = await readdir(dir, { withFileTypes: true });
  const achados: string[] = [];

  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) achados.push(...(await arquivos(caminho, filtro)));
    else if (filtro.test(entrada.name)) achados.push(caminho);
  }

  return achados;
}

/**
 * SPEC §7.2 — nenhum valor de cor em JavaScript.
 *
 * O protótipo aplicava o tema escuro escrevendo ~13 cores via
 * style.setProperty, o que colocava os valores claros em CSS e os escuros em
 * JS: duas fontes para a mesma decisão. Aqui o JS só troca data-theme, e as
 * cores vivem em src/styles/overrides.css, num bloco só.
 */
describe('Tema (SPEC §7.2)', () => {
  it('nenhum hexadecimal de 6 dígitos em .ts/.js/.astro fora de src/styles/', async () => {
    const encontrados = await arquivos(RAIZ_SRC, /\.(ts|js|astro)$/);
    const ofensores: string[] = [];

    for (const arquivo of encontrados) {
      if (relative(RAIZ_SRC, arquivo).startsWith('styles')) continue;

      const conteudo = await readFile(arquivo, 'utf8');
      const achado = conteudo.match(/#[0-9A-Fa-f]{6}\b/);
      if (achado) ofensores.push(`${relative(process.cwd(), arquivo)}: ${achado[0]}`);
    }

    expect(ofensores).toEqual([]);
  });

  it('o bloco do tema escuro existe em overrides.css, e não em JavaScript', async () => {
    const overrides = await readFile(join(RAIZ_SRC, 'styles', 'overrides.css'), 'utf8');
    expect(overrides).toMatch(/:root\[data-theme=['"]dark['"]\]/);
  });

  it('nenhum style.setProperty de cor no código — o JS só troca o atributo', async () => {
    const encontrados = await arquivos(RAIZ_SRC, /\.(ts|js|astro)$/);
    const ofensores: string[] = [];

    for (const arquivo of encontrados) {
      const conteudo = await readFile(arquivo, 'utf8');
      if (/style\.setProperty\(/.test(conteudo)) {
        ofensores.push(relative(process.cwd(), arquivo));
      }
    }

    expect(ofensores).toEqual([]);
  });

  it('a única chave de localStorage usada é "tema"', async () => {
    const encontrados = await arquivos(RAIZ_SRC, /\.(ts|js|astro)$/);
    const chaves = new Set<string>();

    for (const arquivo of encontrados) {
      const conteudo = await readFile(arquivo, 'utf8');
      for (const [, chave] of conteudo.matchAll(
        /localStorage\.(?:get|set|remove)Item\(\s*['"]([^'"]+)['"]/g,
      )) {
        chaves.add(chave);
      }
    }

    expect([...chaves]).toEqual(['tema']);
  });
});

/**
 * SPEC §3.1 — nenhuma duração literal no código.
 *
 * tokens/motion.css já vem com os valores corretos da origem; o projeto
 * consome sempre var(--dur-*). Duração escrita à mão em componente é
 * exatamente o que a SPEC quer impedir.
 */
describe('Motion (SPEC §3.1)', () => {
  it('nenhuma duração literal em ms fora de src/styles/tokens/', async () => {
    const encontrados = await arquivos(RAIZ_SRC, /\.(ts|js|astro|css)$/);
    const ofensores: string[] = [];

    for (const arquivo of encontrados) {
      if (relative(RAIZ_SRC, arquivo).startsWith(join('styles', 'tokens'))) continue;

      const conteudo = await readFile(arquivo, 'utf8');
      /* Pega "200ms" em transition/animation, não em texto corrido. */
      const achado = conteudo.match(/(?:transition|animation)[^;{]*?\b\d+m?s\b/);
      if (achado) ofensores.push(`${relative(process.cwd(), arquivo)}: ${achado[0].slice(0, 60)}`);
    }

    expect(ofensores).toEqual([]);
  });
});
