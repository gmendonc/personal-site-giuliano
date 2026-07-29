import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { pecasPublicadas } from '../lib/biblioteca';
import { SITE_TITULO, SITE_DESCRICAO } from '../config';

/**
 * Um <item> por peça não-rascunho. Rascunho não entra (SPEC §7.4).
 *
 * Este arquivo escapou do refactor de base path (§7.5) por não ser .astro:
 * o link do RSS saía sem o subcaminho `/personal-site-giuliano`, apontando
 * pra raiz errada do domínio. Achado revisando o RSS gerado, não por teste
 * automatizado — não havia um (agora há, em ponta-a-ponta.spec.ts).
 *
 * `context.site` é só a origem (o `site` de astro.config.ts) — NÃO inclui
 * `base`. Por isso o `<link>` do canal precisa ser remontado à mão com os
 * dois; o `link` de cada item usa o mesmo `base` para o mesmo motivo.
 */
export async function GET(context: APIContext) {
  const pecas = await pecasPublicadas();
  const base = import.meta.env.BASE_URL;
  /* `site` sempre existe em runtime — vem de `site` em astro.config.ts,
     configurado e nunca ausente neste projeto. */
  const raiz = new URL(base, context.site!);

  return rss({
    title: SITE_TITULO,
    description: SITE_DESCRICAO,
    site: raiz,
    items: pecas.map((peca) => ({
      title: peca.data.titulo,
      description: peca.data.resumo,
      pubDate: peca.data.data,
      link: `${base}biblioteca/${peca.id}/`,
    })),
    customData: '<language>pt-br</language>',
  });
}
