import { getCollection, type CollectionEntry } from 'astro:content';

export type Peca = CollectionEntry<'biblioteca'>;

/**
 * Todas as peças publicadas, mais recentes primeiro.
 *
 * Rascunho não aparece em lugar nenhum do build de produção: nem na
 * biblioteca, nem no RSS, nem como rota (SPEC §7.4). Em `astro dev` ele
 * continua visível, que é o ponto de ter o campo.
 */
export async function pecasPublicadas(): Promise<Peca[]> {
  const pecas = await getCollection('biblioteca', ({ data }) =>
    import.meta.env.PROD ? data.rascunho === false : true,
  );

  return pecas.sort((a, b) => b.data.data.getTime() - a.data.data.getTime());
}
