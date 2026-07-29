import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config';

export default defineConfig({
  site: SITE_URL,
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
