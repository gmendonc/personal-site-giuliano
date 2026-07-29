/** Configuração do site. Valores que mudam sem tocar em markup. */

/**
 * Origem canônica (só o domínio, sem subcaminho), usada por RSS, sitemap e
 * URLs absolutas de OpenGraph.
 *
 * VERIFICADO em 2026-07-29 via `gh api repos/.../pages`: o repositório não tem
 * domínio próprio (`cname: null`). O site está publicado como GitHub Pages de
 * projeto, em `https://gmendonc.github.io/personal-site-giuliano/`. Por isso
 * este valor é só a origem, e o subcaminho `/personal-site-giuliano` vive
 * separado, em `base` (astro.config.ts) — os dois têm que mudar juntos.
 *
 * Se um domínio próprio for anexado depois, os dois voltam: SITE_URL vira o
 * domínio novo, e `base` em astro.config.ts vira '/'. Nesse dia, revise
 * também `src/styles/fontes.css`: os quatro `url()` de fonte têm o subcaminho
 * hardcoded, porque CSS não lê `import.meta.env.BASE_URL`.
 */
export const SITE_URL = 'https://gmendonc.github.io';

export const SITE_TITULO = 'Giuliano Mendonça';

export const SITE_DESCRICAO =
  'IA aplicada, decisão e gestão do conhecimento — escrito de dentro de quem está implantando.';

export const SITE_SUBTITULO = 'Descomplicando a tecnologia';

/**
 * Assinatura da newsletter. Quem consome isto é Newsletter.astro e mais
 * ninguém — nenhuma página menciona o provedor (SPEC §6.1, ADR 0003).
 * A publicação ainda não existe; a URL é placeholder até o Giuliano criá-la.
 */
export const NEWSLETTER_URL = 'https://giulianomendonca.substack.com';

/**
 * Contagem de leitores. Enquanto for 0, a linha inteira some da interface —
 * não renderizamos o placeholder "[N] leitores" do protótipo (SPEC §6.2).
 */
export const NEWSLETTER_LEITORES = 0;

/**
 * Itens do menu. Os três sem `href` ficam visíveis e inertes (SPEC §5).
 *
 * `href` é relativo, sem barra inicial — quem consome (Cabecalho.astro,
 * Rodape.astro) prefixa com `import.meta.env.BASE_URL`. Não hardcode `/aqui`
 * em lugar nenhum: com o site publicado em subcaminho, `/aqui` aponta para a
 * raiz do domínio, não para a raiz do site.
 */
export const NAVEGACAO = [
  { rotulo: 'Biblioteca', href: 'biblioteca' },
  { rotulo: 'Aparições', href: null },
  { rotulo: 'Sobre', href: null },
  { rotulo: 'Trabalhar comigo', href: null },
] as const;
