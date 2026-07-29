import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TIPOS, CHAVES_TIPO } from '../../src/content/tipos';

const RAIZ_SRC = join(process.cwd(), 'src');
const DIR_CONTEUDO = join(RAIZ_SRC, 'content', 'biblioteca');
const DONO_DA_DECISAO = join('src', 'content', 'tipos.ts');

/** Percorre src/ devolvendo todo arquivo de código, exceto o dono da decisão. */
async function arquivosDeCodigo(dir: string): Promise<string[]> {
  const entradas = await readdir(dir, { withFileTypes: true });
  const encontrados: string[] = [];

  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);

    if (entrada.isDirectory()) {
      encontrados.push(...(await arquivosDeCodigo(caminho)));
      continue;
    }

    if (!/\.(ts|js|astro)$/.test(entrada.name)) continue;
    if (caminho.endsWith(DONO_DA_DECISAO)) continue;

    encontrados.push(caminho);
  }

  return encontrados;
}

describe('TIPOS — o dono único da decisão de formatos (SPEC §4.1)', () => {
  it('tem exatamente 5 chaves, cada uma com rotulo e icone não vazios', () => {
    const chaves = Object.keys(TIPOS);
    expect(chaves).toHaveLength(5);

    for (const chave of chaves) {
      const { rotulo, icone } = TIPOS[chave as keyof typeof TIPOS];
      expect(rotulo.trim().length).toBeGreaterThan(0);
      expect(icone.trim().length).toBeGreaterThan(0);
    }
  });

  it('CHAVES_TIPO e Object.keys(TIPOS) são o mesmo conjunto', () => {
    expect([...CHAVES_TIPO].sort()).toEqual(Object.keys(TIPOS).sort());
  });
});

describe('Anti-vazamento — a decisão não pode existir em um segundo módulo', () => {
  it('nenhum ícone de formato aparece em src/ fora de tipos.ts', async () => {
    const icones = Object.values(TIPOS).map((t) => t.icone);
    const arquivos = await arquivosDeCodigo(RAIZ_SRC);
    const vazamentos: string[] = [];

    for (const arquivo of arquivos) {
      const conteudo = await readFile(arquivo, 'utf8');
      for (const icone of icones) {
        if (conteudo.includes(icone)) vazamentos.push(`${arquivo}: ${icone}`);
      }
    }

    expect(vazamentos).toEqual([]);
  });

  /**
   * Os rótulos são checados como LITERAL DE STRING, não como texto corrido.
   * Prosa que por acaso usa a palavra não é vazamento; código que redigita o
   * rótulo é.
   *
   * A EXCEÇÃO: "Biblioteca" é ao mesmo tempo o rótulo de um formato e o nome
   * de uma seção do site — a rota /biblioteca, o <h1> daquela página, o item
   * de menu. Esses usos são legítimos e não têm nada a ver com o mapa de
   * formatos; proibi-los obrigaria a renomear a seção, que a SPEC §5 fixa.
   *
   * Então o teste separa os dois casos:
   *
   *  - rótulo que só existe como formato → literal nenhum, em lugar nenhum;
   *  - rótulo que também nomeia seção → só reprova se aparecer ACOMPANHADO de
   *    outro rótulo de formato no mesmo arquivo.
   *
   * A segunda regra é a assinatura do modo de falha real: quem redigita o mapa
   * redigita vários rótulos juntos. Um "Biblioteca" sozinho é nome de seção;
   * "Biblioteca" ao lado de "Ensaio" é o mapa vazando.
   */
  const ROTULOS_QUE_TAMBEM_NOMEIAM_SECAO = new Set(['Biblioteca']);

  it('nenhum rótulo exclusivo de formato aparece como literal em src/', async () => {
    const rotulos = Object.values(TIPOS)
      .map((t) => t.rotulo)
      .filter((r) => !ROTULOS_QUE_TAMBEM_NOMEIAM_SECAO.has(r));

    const padrao = new RegExp(`['"\`](${rotulos.join('|')})['"\`]`);
    const arquivos = await arquivosDeCodigo(RAIZ_SRC);
    const vazamentos: string[] = [];

    for (const arquivo of arquivos) {
      const conteudo = await readFile(arquivo, 'utf8');
      const achado = conteudo.match(padrao);
      if (achado) vazamentos.push(`${arquivo}: ${achado[0]}`);
    }

    expect(vazamentos).toEqual([]);
  });

  it('nenhum arquivo redigita o mapa — dois ou mais rótulos juntos', async () => {
    const rotulos = Object.values(TIPOS).map((t) => t.rotulo);
    const arquivos = await arquivosDeCodigo(RAIZ_SRC);
    const vazamentos: string[] = [];

    for (const arquivo of arquivos) {
      const conteudo = await readFile(arquivo, 'utf8');

      const presentes = rotulos.filter((rotulo) =>
        new RegExp(`['"\`]${rotulo}['"\`]`).test(conteudo),
      );

      if (presentes.length >= 2) {
        vazamentos.push(`${arquivo}: ${presentes.join(', ')}`);
      }
    }

    expect(vazamentos).toEqual([]);
  });
});

/* Arquivos começados por "__" são fixtures transitórias, escritas e apagadas
   por schema.test.ts. O Vitest roda arquivos de teste em paralelo, então elas
   podem existir enquanto este arquivo varre o diretório — daí o filtro. */
const ehFixture = (nome: string) => nome.startsWith('__');

describe('Conteúdo', () => {
  it('todo item da collection resolve para um ícone', async () => {
    const arquivos = (await readdir(DIR_CONTEUDO)).filter(
      (n) => n.endsWith('.md') && !ehFixture(n),
    );
    expect(arquivos.length).toBeGreaterThan(0);

    for (const arquivo of arquivos) {
      const bruto = await readFile(join(DIR_CONTEUDO, arquivo), 'utf8');
      const tipo = bruto.match(/^tipo:\s*(\S+)\s*$/m)?.[1];

      expect(tipo, `${arquivo} não declara tipo`).toBeDefined();
      expect(TIPOS[tipo as keyof typeof TIPOS], `${arquivo} usa tipo desconhecido`).toBeDefined();
    }
  });

  it('há pelo menos 5 peças publicadas — §7.4 exige 5 na lista densa', async () => {
    const arquivos = (await readdir(DIR_CONTEUDO)).filter((n) => n.endsWith('.md') && !ehFixture(n));
    let publicadas = 0;

    for (const arquivo of arquivos) {
      const bruto = await readFile(join(DIR_CONTEUDO, arquivo), 'utf8');
      if (!/^rascunho:\s*true\s*$/m.test(bruto)) publicadas += 1;
    }

    expect(publicadas).toBeGreaterThanOrEqual(5);
  });

  it('há pelo menos uma peça em rascunho — fixture do teste de exclusão de §7.4', async () => {
    const arquivos = (await readdir(DIR_CONTEUDO)).filter((n) => n.endsWith('.md') && !ehFixture(n));
    let rascunhos = 0;

    for (const arquivo of arquivos) {
      const bruto = await readFile(join(DIR_CONTEUDO, arquivo), 'utf8');
      if (/^rascunho:\s*true\s*$/m.test(bruto)) rascunhos += 1;
    }

    expect(rascunhos).toBeGreaterThanOrEqual(1);
  });
});
