# PLAN — Bala traçante do site pessoal

Sequenciamento e estado. O **o quê** está na [SPEC.md](SPEC.md); aqui fica o **em que ordem** e o **onde estamos**.

Regra: um estágio por vez, commit ao fim de cada um, e este arquivo atualizado antes do commit. Sessão nova começa lendo `SPEC.md` e depois este arquivo.

**Estado:** no ar em `gmendonc.github.io/personal-site-giuliano/`, §7.5 completo, texto real e
retrato do Giuliano integrados, bug de base path no RSS achado e corrigido ·
**Atualizado em:** 2026-07-29

---

## ⚠️ Leia isto antes de qualquer coisa

Histórico da sessão, para quem chegar depois: o agente não tinha permissão para apagar a
árvore do AstroWind sozinho (o classificador recusou três tentativas), então o projeto foi
construído em `_novo/` primeiro. O Giuliano rodou a remoção manualmente. A promoção
(`_novo/*` → raiz) foi feita com `find _novo -mindepth 1 -maxdepth 1 -exec mv {} .` — **não**
`shopt -s dotglob`, que é bashismo e falha em zsh, o shell deste ambiente.

Commit `3ed46fe` foi feito e enviado (`git push`). A Action rodou: o job `verificar` passou
inteiro (build, check, lint, 39 unitários, `test:dist`, 68 e2e — tudo no CI, não só local). O
job `publicar` falhou com 404 — GitHub Pages não estava habilitado no repositório. Corrigido
pelo Giuliano em Settings → Pages → Source → GitHub Actions.

### Bug real encontrado ao investigar antes de re-rodar

Antes de simplesmente re-rodar o job, chequei `gh api repos/.../pages` e confirmei
`cname: null` — o site não tem domínio próprio; está publicado como Pages de **projeto**, em
`https://gmendonc.github.io/personal-site-giuliano/`. Todo o código (SPEC e implementação)
assumia site na raiz de um domínio: `href="/biblioteca"`, `SITE_URL` placeholder em
`giulianomendonca.com`, `astro.config.ts` sem `base`. Publicado assim, a navegação inteira
quebraria — link do menu levaria para `gmendonc.github.io/biblioteca` (404), não para
`gmendonc.github.io/personal-site-giuliano/biblioteca`.

Corrigido antes de re-rodar, não depois: `base: '/personal-site-giuliano/'` em
`astro.config.ts`, `SITE_URL` agora é só a origem (`https://gmendonc.github.io`), e todo
`href`/`src`/`url()` que era absoluto de raiz (11 em `.astro`, 2 em `config.ts`/script de
filtro, 4 em `fontes.css`) passou a usar `import.meta.env.BASE_URL` — ou, dentro do `<script>`
que roda no navegador, um atributo `data-base` (mais garantido que confiar em substituição de
`import.meta.env` dentro de script de cliente).

**Armadilha encontrada:** `import.meta.env.BASE_URL` só sai com barra final se `base` for
configurado **com** barra final (`/personal-site-giuliano/`, não `/personal-site-giuliano`).
Sem isso, `${BASE_URL}biblioteca` virava `.../personal-site-giulianobiblioteca`, grudado — visto
quebrar antes de corrigir.

**Efeito em ferramenta local:** com `base` configurado, `astro preview` só serve sob esse
subcaminho (`curl localhost:4321/` → 404; `curl localhost:4321/personal-site-giuliano/` → 200).
Isso quebrava `playwright.config.ts` (baseURL) e os ~30 `page.goto('/…')` nos specs e2e, e
`scripts/lighthouse.mjs`. Todos corrigidos: `baseURL` agora inclui o subcaminho, e todo
`goto()` usa caminho relativo sem barra inicial (`goto('biblioteca')`, não
`goto('/biblioteca')`) — com barra inicial, a resolução de URL descarta o subcaminho do
`baseURL` e volta pra raiz do domínio, o mesmo bug, agora nos testes.

Depois da correção: build, check, lint, 39 unitários, 68 e2e (incluindo os 9 de
acessibilidade rodados à parte para conferir) e Lighthouse — todos verdes de novo, local,
contra o subcaminho correto. Números de Lighthouse idênticos aos de antes da mudança
(Perf 99 · LCP 1804–1955 ms · CLS 0 · TBT 0 · A11y 95/100/100) — o `base` não custou
performance.

Commitado (`a2a3b21`), enviado, e a Action rodou de novo: `verificar` (build, check, lint,
39 unitários, `test:dist`, 68 e2e — tudo no CI) e `publicar`, os dois verdes. Confirmado por
`curl` que home, `/biblioteca`, uma peça individual, `/rss.xml` e uma fonte respondem 200 na
URL publicada.

> **Lição registrada:** uma sessão anterior construiu tudo isto num diretório temporário fora
> do repositório, e ele foi apagado entre sessões — o trabalho se perdeu inteiro. Não use
> `/tmp` nem scratchpad para trabalho de projeto. Escreva no repo.
>
> **Segunda lição:** "funciona no `npm run build` local" não prova que funciona publicado,
> quando o local e o publicado servem de raízes diferentes. `base` devia ter sido decidido
> (e testado localmente) antes do primeiro push, não descoberto depois pela falha do deploy.

---

## Achados verificados

Medidos e conferidos, não deduzidos. Não refaça esta investigação.

### Fontes — a SPEC erra em dois pontos

| o que a SPEC diz | o que é verdade | consequência |
| --- | --- | --- |
| §2.1.1: instalar as três famílias do Fontsource | **`@fontsource-variable/ibm-plex-mono` não existe no npm.** As outras cinco existem em 5.3.0. | Mono tem que vir do pacote estático `@fontsource/ibm-plex-mono`. |
| §2.1.1: "Subset: latin + latin-ext (o português precisa de ç ã õ á ê)" | **Falso.** `ç ã õ á ê` estão todos no subset `latin` (U+00E0–U+00FF). `latin-ext` cobre Europa Central/Oriental (ł, ș, ő), que o conteúdo não usa. | Embarcar latin-ext custa ~81 kB e não entrega um glifo. Só `latin`. |

Pacotes variáveis do Fontsource **não têm entrada de CSS por subset** — `wght.css` puxa
vietnamese + latin-ext + latin de uma vez. Para ficar só no latin é preciso escrever o
`@font-face` à mão em `src/styles/fontes.css`, apontando para o `.woff2` específico.

Orçamento real, eixo `wght`, subset `latin` (limite de §7.3.3: 200 kB):

| arquivo | bytes |
| --- | --- |
| `newsreader-latin-wght-normal.woff2` | 58 084 |
| `newsreader-latin-wght-italic.woff2` | 64 520 |
| `ibm-plex-sans-latin-wght-normal.woff2` | 45 712 |
| `ibm-plex-mono-latin-400-normal.woff2` | 14 708 |
| **total** | **183 024 B = 178,7 KiB** ✅ |

O eixo variável `wght` cobre 400+500 (Newsreader) e 400+600 (Plex Sans) em **um arquivo cada** —
os pesos que a SPEC pede não custam arquivo extra. Não use os arquivos `opsz`/`standard`: são
2× maiores.

O itálico do Newsreader custa 64,5 kB — 35% do orçamento de fonte — e serve só ao wordmark
`Giuliano <em>Mendonça</em>` no header e no rodapé. Cabe no limite, mas é a primeira coisa a
cortar se algo mais entrar. **Decisão do Giuliano** (ver tabela no fim).

### Fallback métrico para CLS (§7.3.1)

Calculado de `@capsizecss/metrics` (tabelas hhea/OS-2 reais), não estimado. Métricas de origem:
`newsreader` upm 2000 asc 1470 desc −530 xWidthAvg 857 · `iBMPlexSans` upm 1000 asc 1025
desc −275 xw 451 · `georgia` upm 2048 asc 1878 desc −449 xw 913 · `arial` upm 2048 asc 1854
desc −434 xw 913.

```css
@font-face { font-family:'Newsreader Fallback'; src:local('Georgia');
  size-adjust:96.1192%; ascent-override:76.4676%; descent-override:27.5699%; line-gap-override:0%; }
@font-face { font-family:'Plex Sans Fallback'; src:local('Arial');
  size-adjust:101.1663%; ascent-override:101.3184%; descent-override:27.1830%; line-gap-override:0%; }
```

Os tokens `--font-display` / `--font-body` precisam ser reescritos em `overrides.css` para
inserir essas famílias antes de Georgia e de system-ui. `tokens/` não se edita.

### `tokens/motion.css` já foi corrigido na origem

A SPEC §3.1 e o `CLAUDE.md` dizem que o arquivo vem com `--dur-fast/base/slow` em `0ms`.
**Não vem mais.** O arquivo buscado hoje traz `120ms / 200ms / 340ms` e já inclui o bloco
`prefers-reduced-motion` que os zera.

Reescrever esses valores em `overrides.css` criaria o problema que a SPEC quer evitar — a mesma
decisão em dois arquivos. **O override de motion não deve ser escrito.** O que continua valendo
é a regra: nenhuma duração literal no código, sempre `var(--dur-base)`.

### `components/core/core.card.html` não existe

A SPEC §2.3 manda usar esse arquivo como referência visual de `Button`/`Badge`/`Tag`. Ele não
está no projeto Claude Design. O que existe é `styles.css` mais os seis arquivos de token. Use
`tokens/base.css` (tem `.eyebrow`, `.display`, `.lead`, `.mono-label`) como referência.

### `styles.css` do DS é armadilha

Copiado para `src/styles/tokens/ds.css` por procedência (§2.1 manda), mas **não pode ser
importado**: a primeira linha dele é `@import url("./tokens/fonts.css")`, e esse arquivo puxa o
Google Fonts. Importá-lo quebra `test:dist`. Deixe-o fora do grafo de import e documente.

### Contraste (§3.4) — conferido pela fórmula da WCAG 2.1

Os números da SPEC batem. Correções a aplicar em `overrides.css`: `--text-subtle` sobe para
`--graphite-500` (3.36 → 5.17) e, no tema escuro, para `--graphite-300`; texto pequeno em
terracota usa `var(--text-link)` (5.65) no lugar de `var(--brand)` (4.36).

`--accent` sobre `--petrol-400` = **4.35**, continua reprovando. É decisão do Giuliano; o teste
deve reportar o ratio real, não silenciar.

### Conteúdo real e retrato — integrados em 2026-07-29

O Giuliano colou o texto de `Iniciando a Jornada da IA.md` (export do Obsidian) e colocou
`Giuliano_perfil.png` na raiz do projeto. Isso resolve a pendência de §4.3 ("pelo menos uma
peça precisa ser texto real, não derivado do protótipo").

**Mojibake na colagem.** O texto chegou com UTF-8 lido como Latin-1 (`Ã§Ã£o` no lugar de
`ção`) — comum quando texto passa por um pipeline de clipboard que não preserva a codificação
original. Corrigido com `s.encode('latin1').decode('utf-8')`, mas **13 pontos** tinham um byte
a menos: a letra "É" e as contrações "à"/"às" mojibake em bytes que incluem um caractere de
controle (`0x89`) ou um espaço não separável (`0xA0`), e algum estágio do pipeline engoliu
esse byte. Resolvido por gramática — "É medida que" não existe em português, "À medida que" é
a expressão fixa correta — não por heurística de contagem de espaço, que sozinha bate errado
em pelo menos um caso. Cada uma das 13 correções foi conferida lendo a frase resultante.

**Onde o texto foi colocado.** Este ensaio tem quase a mesma tese da peça sintética
`nao-existe-estrategia-de-ia.md` que eu tinha escrito ("ninguém precisa de estratégia de IA,
precisa de estratégia de negócio"). Perguntado, o Giuliano escolheu **substituir** — mesmo
slug, preserva a URL e o RSS já publicados, tira do ar a versão inventada. `titulo` virou
"Iniciando a jornada da IA" (do nome do arquivo original, não da minha versão anterior);
`data` é 2026-07-29 (dia da integração, escolhido pelo Giuliano); os `#` do corpo (Introdução,
O que é IA, etc.) foram rebaixados para `##` — o `<h1>` da página já vem do frontmatter via
`Base.astro`, então um `#` no corpo criaria um segundo `<h1>` na mesma página.

**Retrato.** 928×1120 (proporção 0,829, perto do 4:5 pedido em §5.1 mas não exato) — cabe na
caixa existente com `object-fit: cover`, sem distorcer. Processado por `astro:assets`
(`<Image>`), 1,4 MB → 39,6 KiB em WebP, dentro do limite de 200 kB por imagem de §7.3.3.
`loading="eager"` e `fetchpriority="high"`: o padrão do componente é `lazy`, que teria adiado
a busca de um elemento acima da dobra e candidato a LCP — visto isso antes de publicar, não
depois. LCP da home subiu de ~1955 para ~2105 ms (a foto virou concorrente do `<h1>` pelo
posto de LCP), ainda dentro do limite calibrado de 2200 ms.

**Bug real achado ao revisar a saída, não por teste.** O `<link>` do RSS saía sem o
subcaminho de base: `gmendonc.github.io/biblioteca/…` em vez de
`gmendonc.github.io/personal-site-giuliano/biblioteca/…`. `src/pages/rss.xml.ts` é `.ts`, não
`.astro` — escapou do refactor de base path porque a varredura por `href`/`src` só olhou
arquivos Astro. `context.site` (o equivalente de `Astro.site` dentro de um endpoint) só traz a
origem, nunca o `base`; corrigido remontando com `new URL(import.meta.env.BASE_URL,
context.site)`. Reforçado com teste: `ponta-a-ponta.spec.ts` agora lê o conteúdo de cada
`<link>` do RSS e falha se algum não contiver `/personal-site-giuliano/` — antes só contava
`<item>`, o que não pegava esse tipo de erro. **Lição:** todo endpoint `.ts` que gera URL
precisa da mesma auditoria de base path que as páginas `.astro` já tiveram; não existe uma
única varredura de código que cubra os dois.

**Teste corrigido:** a seção "Referências" da peça real tem links dentro de `<li>` (lista com
citação), não dentro de `<p>` — o teste de alvo de toque de §7.3.2 só excluía links dentro de
`.prosa p`. Ampliado para `.prosa p, .prosa li`: link em texto corrido, seja em parágrafo ou
item de lista, não é alvo de toque isolado.

Reverificado do zero depois de tudo isso: build, check, lint, 39 unitários, 68 e2e, `test:dist`,
Lighthouse — todos verdes.

---

## Estágio 1 — Esqueleto andante

Prova a esteira inteira antes de existir site. Se o deploy for deixado para o fim, ele vira o problema mais caro no pior momento.

- [x] Descartar o AstroWind e promover o projeto para a raiz (SPEC §1) — feito 2026-07-29
- [x] Copiar os tokens do design system (SPEC §2.1), sem `fonts.css`
- [x] Uma rota `/` renderizando markdown real da collection
- [x] GitHub Action de deploy escrita — **ainda não executada**, falta o primeiro push
- [ ] ~~`overrides.css` com as durações de motion (SPEC §3.1)~~ — **não fazer**, ver achados

**Pronto quando:** a URL pública abre e mostra o texto do markdown. Nada de tema, RSS ou filtro.
**Falta:** commit + push + primeira execução da Action. Local já cumpre o critério —
`npm run build` gera `dist/index.html` com um markdown real renderizado.
**Commit:** `—`

---

## Estágio 2 — Modelo de conteúdo

O coração da fatia. Primeiro estágio com teste.

- [x] `src/content/tipos.ts` (SPEC §4.1)
- [x] `src/content/config.ts` com o enum vindo de `CHAVES_TIPO` (SPEC §4.2)
- [x] Os markdowns de SPEC §4.3 (6 publicados + 1 rascunho) — **falta o texto real do Obsidian**
- [x] Rotas `/biblioteca` e `/biblioteca/[slug]` (SPEC §5.2, §5.3)
- [x] Vitest e os testes de SPEC §7.1, incluindo o anti-vazamento
- [x] Fixture com `tipo: inexistente` quebrando o build — **visto falhar antes de passar** (ver nota abaixo)

**Atenção — a SPEC se contradiz aqui.** §4.3 pede **três** arquivos; §7.4 exige que a lista densa
da home mostre **cinco** itens e que o filtro reduza a lista. Três arquivos não satisfazem o
teste, e a própria SPEC declara os testes como o contrato (§7). Resolver com ~6 peças publicadas
cobrindo os cinco formatos, mais **uma com `rascunho: true`** para o teste de exclusão de §7.4.

**Atenção 2 — o teste anti-vazamento de §7.1 precisa de cuidado.** "Biblioteca" é ao mesmo tempo
rótulo de formato e nome de seção do site (`/biblioteca`, `<h1>`, item de menu). Grep cru pela
palavra reprova uso legítimo. Testar os **ícones** em qualquer lugar de `src/` e os **rótulos**
como literal entre aspas — que é o modo de falha real: alguém redigitar o mapa em outro módulo.

**Pronto quando:** `npm test` verde e as peças renderizam nas duas rotas.
**Commit:** `—`

> Ao fechar este estágio, instalar o Stop hook em `.claude/settings.json`. Antes disso ele bloquearia todo turno.

---

## Estágio 3 — Tema

- [x] Bloco `:root[data-theme="dark"]` em `overrides.css` (SPEC §3.2)
- [x] Script inline no `<head>`, precedência `localStorage` → `prefers-color-scheme` → claro
- [x] Botão de tema no header
- [x] Playwright e SPEC §7.2, incluindo o teste de ausência de flash

O rótulo do botão (`escuro`/`claro`) deve trocar por CSS, com dois `<span>` e
`:root[data-theme="dark"]`, não por JavaScript — senão o texto pisca errado no primeiro paint.

**Pronto quando:** `npm run test:e2e` verde, e o grep de cor hexadecimal em JS não retorna nada.
**Commit:** `—`

---

## Estágio 4 — Home

- [x] Os sete blocos de SPEC §5.1, na ordem, **inline** em `index.astro` (§8)
- [x] `Newsletter.astro` com as variantes `inline` e `rodape` (SPEC §6)
- [x] Header e footer de SPEC §5.4, com a declaração corrigida de §3.3
- [x] `Button`, `Badge`, `Tag` como `.astro` (SPEC §2.3)

**Pronto quando:** os testes de `<h1>` e da lista densa em SPEC §7.4 passam.
**Commit:** `—`

---

## Estágio 5 — Resto

- [x] `/rss.xml` (SPEC §7.4: um `<item>` por peça não-rascunho)
- [x] `/404`
- [x] Responsivo de SPEC §5.5
- [x] Filtro por chip em `/biblioteca` (SPEC §5.2)
- [x] Restante de SPEC §7.4, incluindo o teste de scroll horizontal a 375px

**Cuidado com §7.3.2:** "nenhum texto de corpo abaixo de 16px em 375px" reprova `--text-sm`
(14px), usado em resumo de card e da lista densa. Resolver subindo o token dentro de
`@media (max-width:860px)` em `overrides.css` — um lugar só. Rótulos em mono usam `--text-2xs`
e ficam de fora, corretamente: são metadado, não corpo.

**Pronto quando:** SPEC §7.4 inteiro verde.
**Commit:** `—`

---

## Estágio 6 — Orçamento

O risco técnico conhecido desta fatia.

- [x] Script de orçamento de SPEC §7.3 (`npm run test:dist`)
- [x] Lighthouse de §7.3.1 (`npm run test:perf`)
- [x] Registrar os **números reais** abaixo antes de qualquer ajuste

> **Esta tabela foi corrigida em 2026-07-29.** A versão anterior media kB por página e limitava
> `.woff2` a 150 kB. Os dois números vinham do protótipo e foram **descartados pela SPEC**: §3.3
> explica por que o contador de bytes por página não mede nenhuma das três premissas, e §7.3.3
> fixa o limite de fonte em 200 kB. O `PLAN` estava atrás da `SPEC`.

### A regra dos 100 kB por página não é mais um portão

Ela **não reprova build, não falha teste e não bloqueia estágio**. O raciocínio está em SPEC §3.3
e vale repetir aqui, porque é a parte que mais tenta voltar sozinha: as premissas declaradas são
*rápido*, *responsivo* e *hospedagem barata*, e um contador de bytes de HTML+CSS+JS não mede
nenhuma das três. Com as fontes fora da conta ele passaria com folga de várias vezes sem nunca
morder; com as fontes dentro, proibiria a terceira família sem deixar o site perceptivelmente
mais rápido.

O que mede *rápido* é Lighthouse (LCP, CLS, TBT). O que mede *hospedagem barata* é banda de
imagem e ausência de terceiro. Esses são os portões.

O peso por página continua sendo **medido e registrado** — como linha de base para comparar
depois, e porque um salto grande é sinal de que algo entrou sem querer. Se um dia passar de
~100 kB, isso é assunto para uma olhada, não para um teste vermelho.

**Portões (falham o build) — medidos em 2026-07-29:**

| Medida | Limite (SPEC §7.3) | Real | |
| --- | --- | --- | --- |
| Performance (mobile, 3 rotas) | ≥ 95 | **99 · 99 · 99** | ✅ |
| LCP | ≤ 2,2 s *(calibrado, ver abaixo)* | **1804 · 1955 · 1953 ms** | ✅ |
| CLS | ≤ 0,05 | **0 · 0 · 0** | ✅ |
| TBT | ≤ 50 ms | **0 · 0 · 0 ms** | ✅ |
| Acessibilidade | ≥ 95 | **95 · 100 · 100** | ✅ |
| Total `.woff2` em `dist/` | < 200 kB | **178,7 KiB** | ✅ |
| Imagem individual | < 200 kB | sem imagem nesta fatia | ✅ |
| Soma de imagens por página | < 500 kB | sem imagem nesta fatia | ✅ |
| Recursos carregados de host externo | 0 | **0** | ✅ |
| Cookies · chaves de `localStorage` | 0 · só `tema` | **0 · só `tema`** | ✅ |

Fontes, individualmente: Newsreader itálico 63,0 · Newsreader normal 56,7 · Plex Sans 44,6 ·
Plex Mono 14,4 KiB.

### LCP: limite calibrado de 1,8 s para 2,2 s

A SPEC declara os limites como "de partida, não medições" e manda calibrá-los no primeiro
build reportando os valores reais. Nove medições, três rotas, três configurações:

| configuração | LCP nas três rotas |
| --- | --- |
| CSS externo (2 `<link>` bloqueantes) | 2107 · 1956 · 1954 |
| CSS inline (configuração final) | 1956 · 1954 · 1803 |
| CSS inline, sem preload de fonte | 1956 · 1804 · 1953 |

Faixa 1803–2107 ms, mediana ~1956, ruído entre execuções ±150 ms.

O que rendeu: `inlineStylesheets: 'always'` tirou duas idas ao servidor do caminho crítico
(~150 ms, e Performance de 98 para 99). O que não rendeu: remover o preload da fonte não
mudou nada além do ruído — ficou, porque a SPEC pede e não custa.

Por que 1,8 s não fecha: o throttling simulado do Lighthouse (RTT 150 ms, 1,6 Mbps) gasta
~450 ms só em DNS+TCP+TLS antes do primeiro byte. Para uma página real isso fica no piso da
ferramenta; não é folga que o código consiga produzir. 2,2 s fica acima do pior caso
observado e bem abaixo dos 2,5 s que o Core Web Vitals chama de "bom" — que é a justificativa
que a própria SPEC dá para o número.

**Linha de base (só registra, nunca reprova):**

| Medida | Real |
| --- | --- |
| CSS+JS compartilhado em `dist/` | 0 KiB — Vite decidiu inlinar os `<script>` de tema/filtro em cada página, em vez de extrair chunk compartilhado. Não investigado a fundo: não é portão, e não achei indício de que a mudança de `base` tenha causado isso |
| `/` — HTML | 47,2 KiB |
| `/biblioteca` — HTML | 34,3 KiB |
| `/biblioteca/nao-existe-estrategia-de-ia` — HTML | 38,7 KiB *(a mais longa: ensaio real de ~1.900 palavras + referências)* |
| item individual (as demais) — HTML | 28,1–28,6 KiB |
| retrato (`src/assets/retrato.png` → WebP) | 39,6 KiB, 800×966 |
| `/` — peso total transferido, cache vazio (Chromium via Playwright, §7.5 passo 7) | **188,5 KiB antes do retrato** — refazer a medição inclui a foto agora |

**Pronto quando:** `npm run test:dist` e `npm run test:perf` rodam e os números estão na tabela. Se estourar, reportar antes de mexer no limite.
**Commit:** `—`

---

## Estágio 7 — Fechamento

- [x] SPEC §7.5 completo, **no site publicado**, com a saída de cada passo colada aqui
- [ ] Subagente `revisor` sobre o diff acumulado, tendo a `SPEC.md` como critério
- [ ] Tratar o que for classificado como "Bloqueia"

### §7.5 nos passos 1–4 — resumo

Build, testes e deploy: ver "Achados verificados" acima. Commit publicado: `a2a3b21`.
Executado pela GitHub Action, não à mão — os números de `npm test` / `test:e2e` / `test:perf`
já estão nas seções de Estágio 2–6.

### §7.5 passos 5–8 — no site publicado, verificado em 2026-07-29

Rodado com Chromium de verdade via Playwright contra
`https://gmendonc.github.io/personal-site-giuliano/` — não `curl`: o navegador executa o JS
de tema e de filtro, e a rede inteira foi capturada durante o fluxo.

**Passo 5 — tema escuro sobrevive a três navegações.**
Home → clique no botão de tema (`data-theme` vira `dark`) → clique em "Ver toda a
biblioteca →" (`.../biblioteca/`, tema continua `dark`) → clique no chip "Ensaio" (contagem
cai para "2 itens", todos os `<li>` visíveis com `data-tipo="ensaio"`) → clique no primeiro
item (`.../biblioteca/nao-existe-estrategia-de-ia/`, `<h1>` bate com o título clicado, tema
continua `dark`). **As três navegações mantiveram o tema. ✅**

> Nota de honestidade: a peça aberta neste fluxo (`nao-existe-estrategia-de-ia`) é uma das
> sete que eu escrevi a partir das teses do protótipo, não o texto real exportado do Obsidian
> do Giuliano — essa decisão continua pendente, registrada na tabela abaixo.

**Passo 6 — zero requisição a terceiro.**
17 requisições capturadas ao longo do fluxo inteiro (home, alternância de tema, biblioteca,
filtro, peça). Domínios vistos: **`{ "gmendonc.github.io" }`** — um só. **Zero terceiros. ✅**

**Passo 7 — peso total transferido da home, cache vazio.**
Contexto novo do Playwright (sem cache de disco compartilhado, equivalente a "recarregar com
cache vazio"): **5 requisições, 188,5 KiB no total.**

| recurso | KiB |
| --- | --- |
| HTML da home | 9,8 |
| `newsreader-latin-wght-italic.woff2` | 63,0 |
| `newsreader-latin-wght-normal.woff2` | 56,7 |
| `ibm-plex-sans-latin-wght-normal.woff2` | 44,6 |
| `ibm-plex-mono-latin-400-normal.woff2` | 14,4 |

Sem limite a bater (§3.3) — linha de base para comparar depois. Bate com a soma já medida em
`test:dist` (fontes 178,7 KiB + HTML ~9,8 KiB ≈ 188,5 KiB).

**Passo 8 — botão de assinatura.**
Clique em "Assinar no Substack →" abriu **nova aba** em
`https://giulianomendonca.substack.com/`. **URL configurada, nova aba confirmada. ✅**

**Pronto quando:** §7.5 passa no ar e o Revisor não reporta bloqueante.
**Commit:** `a2a3b21`

---

## Desvios da spec

Registre aqui o que foi implementado diferente do que a spec pede, e por quê. Spec é hipótese; quando ela erra, quem se corrige é ela.

| Estágio | O que mudou | Por quê |
| --- | --- | --- |
| 1 | `overrides.css` **não** redefine `--dur-*` | `tokens/motion.css` já vem correto da origem; redefinir criaria duas fontes para a mesma decisão — o problema que §3.1 quer evitar |
| 1 | Fonte só no subset `latin`, não `latin+latin-ext` | `ç ã õ á ê` estão no `latin`; `latin-ext` custaria ~81 kB sem entregar glifo, e estouraria o limite de §7.3.3 |
| 1 | `@font-face` escrito à mão em vez de importar o CSS do Fontsource | pacote variável não tem entrada por subset; importar o pacote traz vietnamese e latin-ext junto |
| 1 | `.woff2` copiados para `public/fontes/` por script | o `<link rel=preload>` de §7.3.1 precisa de URL estável, e ativo processado pelo Vite sai com hash |
| 2 | ~6 peças publicadas + 1 rascunho, em vez de 3 | §4.3 pede 3, mas §7.4 exige 5 na lista densa e um filtro que reduza; a SPEC declara os testes como contrato |
| 2 | Anti-vazamento testa rótulo como literal entre aspas, ícone em qualquer lugar | "Biblioteca" é também nome de seção; grep cru reprovaria uso legítimo e o teste viraria ruído |
| 5 | `--text-sm` sobe para 1rem abaixo de 860px | §7.3.2 exige ≥16px em texto de corpo a 375px, e `--text-sm` é resumo de card |
| 6 | Orçamento separado em "portão" e "linha de base"; os 100 kB/página saem de portão e viram referência solta | `PLAN` ainda trazia o limite de 100 kB/página que §3.3 descartou, e 150 kB de fonte contra os 200 kB de §7.3.3. Peso de página continua medido — só não reprova nada |
| 6 | Limite de LCP calibrado de 1,8 s para 2,2 s | Autorizado por §7.3.1 ("limites de partida, não medições"). Nove medições, faixa 1803–2107 ms. 1,8 s fica no piso do throttling simulado do Lighthouse |
| 6 | `inlineStylesheets: 'always'` em vez de `'auto'` | Com `'auto'` sobravam dois `<link>` bloqueantes (17,3 + 8,8 kB) em toda página. Inline tirou ~150 ms de LCP e subiu Performance para 99. Custo: CSS não cacheia entre páginas — aceito, já que peso de página não é portão |
| 3 | Chips de filtro usam `aria-current`, não `aria-pressed` | `aria-pressed` só vale em `role=button`; num `<a>` é violação **crítica** de `aria-allowed-attr`, pega pelo axe em §7.3.4 |
| 3 | `--brand-subtle` e `--brand-border` acrescentados ao bloco do tema escuro | Lacuna na lista de 13 valores de §3.2: ela troca `--text-link` para um terracota claro mas deixa `--brand-subtle` quase branco. O Badge usa os dois juntos e dava **2.25** no escuro |
| 4 | Wordmark usa `--text-link`, não `--brand` | O wordmark tem 22px. A WCAG só trata como "texto grande" a partir de 24px com peso normal, então ainda vale o mínimo de 4.5 — e `--brand` dá 4.36. O limiar de 18px citado em §3.4 é menor que o da WCAG, e este caso cai no vão |
| 2 | `<time datetime>` da lista densa usa a data de publicação, não a de revisão | O atributo tem que casar com o texto que embrulha, que é a data de publicação. Usar a de revisão bagunçava a leitura de ordem cronológica — foi assim que o teste de §7.4 pegou |

## Decisões devolvidas ao Giuliano

| Item | Onde | Status |
| --- | --- | --- |
| `--accent` sobre `--petrol-400` = 4.35, reprova em AA. Corrigir exige dourado mais claro (`--gold-200`) e muda o design system | SPEC §3.4 | **pendente** — teste reporta o ratio, não silencia |
| Colapsar `--text-subtle` em `--text-muted` é o efeito colateral da correção de contraste. Alternativa: criar degrau intermediário na rampa graphite | SPEC §3.4 | aplicado como "caminho barato"; reverter custa uma linha |
| Itálico do Newsreader custa 64,5 kB (35% do orçamento de fonte) para o wordmark. Cabe, mas é o primeiro corte se algo entrar | SPEC §2.1.1 | mantido |
| ~~Cortar IBM Plex Mono~~ — desnecessário: com subset `latin` o total fica em 178,7 kB, dentro dos 200 kB | SPEC §7.3.3 | **resolvido** |
| URL real da publicação no Substack | SPEC §6.1 | placeholder `giulianomendonca.substack.com` |
| Domínio de publicação. **Resolvido para agora:** confirmado via API que não há domínio próprio (`cname: null`); site publicado em `gmendonc.github.io/personal-site-giuliano/`, `SITE_URL` e `base` já ajustados para isso. Se um domínio próprio for anexado depois, os dois voltam — `SITE_URL` vira o domínio, `base` vira `/`, e `src/styles/fontes.css` precisa de edição manual (não lê `BASE_URL`) | SPEC §7.5 passo 4 | resolvido para o estado atual; decisão de domínio próprio continua aberta |
| Texto real exportado do Obsidian para pelo menos uma peça (§4.3) | SPEC §4.3 | **resolvido em 2026-07-29** — "Iniciando a jornada da IA" substitui a peça sintética `nao-existe-estrategia-de-ia.md`, mesmo slug. As outras 5 publicadas + 1 rascunho continuam derivadas do protótipo |
| Retrato do hero (§5.1, §9 dizia "nunca placeholder de banco, mas também não tinha foto ainda") | SPEC §5.1 | **resolvido em 2026-07-29** — `src/assets/retrato.png`, processado por `astro:assets`, 39,6 KiB em WebP |
