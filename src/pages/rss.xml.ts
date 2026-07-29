import rss from '@astrojs/rss';
import { pecasPublicadas } from '../lib/biblioteca';
import { SITE_TITULO, SITE_DESCRICAO, SITE_URL } from '../config';

/** Um <item> por peça não-rascunho. Rascunho não entra (SPEC §7.4). */
export async function GET() {
  const pecas = await pecasPublicadas();

  return rss({
    title: SITE_TITULO,
    description: SITE_DESCRICAO,
    site: SITE_URL,
    items: pecas.map((peca) => ({
      title: peca.data.titulo,
      description: peca.data.resumo,
      pubDate: peca.data.data,
      link: `/biblioteca/${peca.id}/`,
    })),
    customData: '<language>pt-br</language>',
  });
}
