import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config';

/**
 * Subcaminho do GitHub Pages de projeto. Anda em par com SITE_URL
 * (src/config.ts) — ver o comentário lá para o que fazer quando um domínio
 * próprio existir.
 *
 * Testado localmente, não só em produção: o dev server, o `astro preview` e
 * os testes e2e usam este mesmo `base`. A alternativa — deixar `base` só na
 * config de CI — reproduziria a classe exata de bug que motivou esta mudança:
 * funciona no preview local, quebra no ar.
 *
 * BARRA FINAL OBRIGATÓRIA. Sem ela, esta versão do Astro devolve
 * `import.meta.env.BASE_URL` sem barra — e todo `${BASE_URL}biblioteca` no
 * código vira `.../personal-site-giulianobiblioteca`, grudado. Visto
 * quebrar, corrigido aqui: fonte única, sem precisar tratar em cada chamada.
 */
const BASE_PATH = '/personal-site-giuliano/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
  build: {
    /* Todo o CSS entra inline no HTML.
     *
     * Com 'auto', o build deixava DOIS <link rel=stylesheet> bloqueando a
     * renderização em toda página (17,3 kB + 8,8 kB). No perfil mobile do
     * Lighthouse isso são duas idas ao servidor antes do primeiro pixel, e o
     * LCP media ~2,1 s contra o limite de 1,8 s de §7.3.1.
     *
     * O custo é que o CSS deixa de ser cacheado entre páginas e cada HTML
     * cresce. Aceito de propósito: o site tem 26 kB de CSS no total, e peso de
     * página não é portão nesta spec (§3.3) — LCP é.
     */
    inlineStylesheets: 'always',
  },
});
