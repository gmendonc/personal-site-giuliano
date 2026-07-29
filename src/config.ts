/** Configuração do site. Valores que mudam sem tocar em markup. */

/**
 * Origem canônica, usada por RSS, sitemap e URLs absolutas de OpenGraph.
 *
 * SUPOSIÇÃO DE IMPLEMENTAÇÃO: a SPEC não declara o domínio. Este valor veio do
 * e-mail de contato do protótipo (ola@giulianomendonca.com). Se o site for
 * publicado em gmendonc.github.io/site-pessoal, troque aqui E acrescente
 * `base` em astro.config.ts — os dois andam juntos. Registrado em PLAN.md
 * como decisão pendente.
 */
export const SITE_URL = 'https://giulianomendonca.com';

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

/** Itens do menu. Os três sem `href` ficam visíveis e inertes (SPEC §5). */
export const NAVEGACAO = [
  { rotulo: 'Biblioteca', href: '/biblioteca' },
  { rotulo: 'Aparições', href: null },
  { rotulo: 'Sobre', href: null },
  { rotulo: 'Trabalhar comigo', href: null },
] as const;
