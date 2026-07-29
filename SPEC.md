# SPEC — Bala traçante do site pessoal

**Status:** pronta para implementação · **Escopo:** primeira fatia ponta a ponta

Esta spec descreve **uma fatia fina que atravessa o sistema inteiro e vai ao ar**. Ela não descreve
o site completo. As páginas `/aparicoes`, `/sobre` e `/trabalhar-comigo` ficam para uma segunda
spec, escrita depois que esta estiver no ar — sobre terreno conhecido.

Quem implementa não tem acesso à conversa que gerou este documento. Tudo que é necessário está
aqui ou nos ADRs em `docs/adr/`.

---

## 1. Ponto de partida

O diretório contém hoje o template **AstroWind vanilla** (um único commit, zero customização).
**Ele é descartado por inteiro.** Ver [ADR 0001](docs/adr/0001-astro-limpo-em-vez-de-astrowind.md).

Primeira ação da implementação:

```bash
# Preserve apenas isto do estado atual:
#   .git/  .claude/  docs/  SPEC.md  LICENSE.md
# Apague todo o resto, então crie o projeto Astro na raiz.
```

Não faça `git rm` do histórico. O commit inicial do AstroWind permanece no histórico; o que muda é
a árvore de trabalho.

---

## 2. Fonte de verdade do design

O design vem de um projeto Claude Design, acessível pela ferramenta `DesignSync`:

- **projectId:** `a510bff4-fd88-43ee-a11e-0fd76d1a8052`
- **Protótipo (layout e conteúdo de referência):** `Site Giuliano Mendonça.dc.html`
- **Diretório do design system:**
  `_ds/giuliano-mendon-a-design-system-c9be522d-1447-42ff-a2fd-8b749704938e/`

### 2.1 Arquivos a copiar para `src/styles/tokens/`

Busque com `DesignSync method=get_file` e grave **sem edição**:

| Origem (dentro do diretório do DS) | Destino |
| --- | --- |
| `tokens/colors.css` | `src/styles/tokens/colors.css` |
| `tokens/typography.css` | `src/styles/tokens/typography.css` |
| `tokens/spacing.css` | `src/styles/tokens/spacing.css` |
| `tokens/radius-shadow.css` | `src/styles/tokens/radius-shadow.css` |
| `tokens/motion.css` | `src/styles/tokens/motion.css` |
| `tokens/base.css` | `src/styles/tokens/base.css` |
| `styles.css` | `src/styles/tokens/ds.css` |

**`tokens/fonts.css` NÃO é copiado.** Ele faz `@import` do Google Fonts, o que contradiz a
declaração do rodapé e faz falhar a checagem de requisições externas em §7.3.3. O próprio arquivo
admite isso num comentário: *"no custom/licensed font files were provided, so these are the closest
editorial + engineered matches on Google Fonts. Swap the @import for self-hosted @font-face rules
once real font files are supplied."*

### 2.1.1 Fontes, self-hosted

As três famílias vêm do npm via **Fontsource**, que existe exatamente para isto — os arquivos
`.woff2` ficam em `node_modules` e o Astro os copia para `dist/`, servidos da própria origem.

**Confirme os nomes exatos dos pacotes no npm antes de instalar** — nem toda família tem versão
variable, e o nome muda entre `@fontsource/x` e `@fontsource-variable/x`. Não deduza pelo padrão.

Pesos mínimos necessários, retirados do uso real no protótipo:

| família | uso | pesos | itálico |
| --- | --- | --- | --- |
| Newsreader | `--font-display` | 400, 500 | sim (o wordmark usa `<em>`) |
| IBM Plex Sans | `--font-body` | 400, 600 | não |
| IBM Plex Mono | `--font-mono` | 400 | não |

Não instale pesos além destes. Cada um é um arquivo a mais no orçamento de §7.3.3.

Subset: latin + latin-ext (o conteúdo é português, precisa de `ç`, `ã`, `õ`, `á`, `ê`). Se o pacote
Fontsource já entrega por `unicode-range`, importe só os subsets latinos, não o pacote inteiro.

`src/styles/fontes.css` concentra os `@font-face` de fallback com `size-adjust` /
`ascent-override` / `descent-override` exigidos por §7.3.1. É o único arquivo que sabe de fonte.

### 2.2 Valores que a implementação pode conferir sem buscar

Sanidade rápida — se o que você buscou não bate com isto, buscou o arquivo errado:

- `--brand` = `--terracotta-500` = `#B8532E`
- `--page` = `--ivory-100` = `#F7F2E9`
- `--text-strong` = `--graphite-900` = `#1F1D1B`
- `--font-display` = `'Newsreader',Georgia,'Times New Roman',serif`
- `--font-body` = `'IBM Plex Sans',system-ui,…`
- `--font-mono` = `'IBM Plex Mono',ui-monospace,…`
- `--container` = `1200px`, `--container-narrow` = `760px`

### 2.3 Componentes do design system

O DS declara 11 componentes React (`Badge`, `Button`, `Card`, `IconButton`, `Tag`, `Checkbox`,
`Input`, `Radio`, `Select`, `Switch`, `Textarea`). **Não importe o bundle React.** Reimplemente
como `.astro` **apenas os que esta fatia usa**: `Button`, `Badge`, `Tag`. Os outros ficam para
quando houver formulário.

Use `DesignSync get_file` em `components/core/core.card.html` como referência visual dos três.

---

## 3. Correções obrigatórias ao protótipo

O protótipo é um artefato de design, não um contrato. Três pontos dele estão errados ou
autocontraditórios e **devem** ser corrigidos:

### 3.1 Motion

`tokens/motion.css` define `--dur-fast/base/slow` como `0ms`, mas o protótipo hardcoda
`200ms cubic-bezier(0.2,0,0,1)` em cards e no fundo da página. Resolva em
`src/styles/overrides.css`, um lugar só:

```css
:root {
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-base: 0ms; --dur-slow: 0ms; }
}
```

No resto do código, sempre `var(--dur-base)`. Nenhuma duração literal.

### 3.2 Tema escuro

O protótipo aplica o tema escuro por JavaScript, escrevendo ~13 valores de cor via
`style.setProperty`. Isso coloca os valores claros em `colors.css` e os escuros em JS — duas
fontes para a mesma decisão.

Em vez disso, `src/styles/overrides.css` recebe um bloco único:

```css
:root[data-theme="dark"] {
  --page:#1F1D1B; --surface:#2B2926; --surface-2:#3D3A35; --surface-3:#524E48;
  --surface-card:#26241F; --text-strong:#F7F2E9; --text-body:#E7DFD0;
  --text-muted:#ADA598; --text-subtle:#8A8378; --border:#3D3A35;
  --border-strong:#524E48; --accent-subtle:#2E2A20;
  --text-link:#DE8E6D; --text-link-hover:#EAB39B;
}
```

O JavaScript faz **apenas** duas coisas: ler a preferência e trocar `data-theme` no `<html>`.
Nenhum valor de cor em JS. Há teste que verifica isso (§7.2).

Um script inline no `<head>`, antes de qualquer CSS pintar, aplica o tema salvo — senão a página
pisca claro antes de escurecer. Ordem de precedência: `localStorage` → `prefers-color-scheme` →
claro.

### 3.3 Rodapé

O protótipo declara no rodapé: *"site estático, sem rastreadores, sem cookies, sem pop-up de
assinatura. Fontes autoexecutadas, nenhuma biblioteca de animação, nenhuma imagem de banco.
Peso-alvo por página: menos de 100 kB."*

Isso é requisito, não decoração — os testes em §7.3 verificam quase tudo aí. **A exceção é o
número.** "Menos de 100 kB por página" foi descartado: media um proxy, não a premissa. As premissas
declaradas são **rápido, responsivo e hospedagem barata**, e um contador de bytes de HTML+CSS+JS não
mede nenhuma das três — com fontes fora da conta ele passaria com várias vezes de folga sem nunca
morder, e com fontes dentro ele proibiria a terceira família sem que isso deixasse o site mais
rápido de forma perceptível.

Substitua a declaração inteira por uma que promete só o que é verificável, e promete mais:

> Declaração técnica — site estático, sem rastreadores, sem cookies e sem pop-up de assinatura.
> Nenhuma requisição a servidor de terceiros: fontes, estilos e scripts saem daqui. Nenhuma
> biblioteca de animação, nenhuma imagem de banco.

"Nenhuma requisição a terceiro" é promessa mais forte que um número de kB, é integralmente testável
(§7.3.3), e é ela que de fato entrega as três premissas de uma vez: sem latência de terceiro, sem
rastreio, e com toda a banda dentro do CDN gratuito.

### 3.4 Contraste — três tokens do design system reprovam em WCAG AA

Calculado a partir dos hexadecimais em `tokens/colors.css` pela fórmula de luminância relativa da
WCAG 2.1. É aritmética determinística sobre valores documentados, não medição em navegador.

| par | ratio | AA texto normal (4.5) | onde o protótipo usa |
| --- | --- | --- | --- |
| `--text-subtle` `#8A8378` sobre `--page` | **3.36** | ✗ | eyebrows, datas, metadados, "há 5 dias", rodapé — tudo entre 10.5px e 12.5px |
| `--brand` `#B8532E` sobre `--page` | **4.36** | ✗ | "Ler →", "Ver toda a biblioteca →", numerais `01`/`02`/`03`, anos da trajetória |
| `--accent` `#D9A441` sobre `--petrol-400` | **4.35** | ✗ | eyebrow do bloco Aparições |
| `--text-subtle` sobre `--surface-card` | 3.75 | ✗ | metadados dentro de card |
| `--text-subtle` no tema escuro | 4.48 | ✗ por 0.02 | idem |

O que **passa**, para referência: `--text-strong` 15.07 · `--text-body` 13.01 · `--text-muted` 5.17 ·
`--text-link` `#9E4526` 5.65 · `--ivory-50` sobre petrol 9.38 · `--gold-300` sobre `--graphite-900` 7.47.

Os três casos que reprovam são todos **texto pequeno**, que é justamente onde AA é mais necessário.
Correções, em `src/styles/overrides.css`:

- **`--brand` em texto pequeno vira `--text-link`** (`--terracotta-600`, 5.65). Regra: `--brand` fica
  para display grande, bordas e preenchimentos; texto abaixo de 18px usa `--text-link`. Custo zero,
  a diferença é quase imperceptível.
- **`--text-subtle` precisa escurecer** até ≥ 4.5 sobre `--page`. Não há degrau na rampa graphite
  entre o 400 (`#8A8378`, 3.36) e o 500 (`#6B655D`, 5.17) — ou se usa o 500, ou se cria um valor
  intermediário. **Usar `--graphite-500` é o caminho barato**, ao custo de perder a distinção visual
  entre `--text-muted` e `--text-subtle`, que passam a ser a mesma cor.
- **`--accent` sobre petrol** precisa de um dourado mais claro (direção `--gold-200` `#E7C57E`).

> **Esta é decisão de design, não de implementação.** As duas primeiras correções são seguras e
> devem ser aplicadas. A terceira, e a questão de colapsar `--text-subtle` em `--text-muted`, mudam
> a aparência do design system e são do Giuliano. Se ninguém decidiu quando a implementação chegar
> aqui: aplique as duas primeiras, deixe a terceira como está, e **reporte o teste de acessibilidade
> falhando** em vez de silenciá-lo. O ideal é corrigir na origem, no projeto Claude Design, para que
> `tokens/colors.css` volte a ser fonte de verdade.

---

## 4. Modelo de conteúdo

Este é o coração da fatia. Cinco formatos, com ícone e rótulo:

| chave | rótulo | ícone |
| --- | --- | --- |
| `ensaio` | Ensaio | `▤` |
| `nota` | Nota | `○` |
| `caso` | Caso | `▲` |
| `padrao` | Padrão | `◆` |
| `biblioteca` | Biblioteca | `▢` |

### 4.1 `src/content/tipos.ts` — dono único dessa decisão

Um módulo, uma exportação de dados. Tudo o mais deriva dele: o enum do schema zod, os chips de
filtro, o ícone nas listas, o rótulo no `Badge`.

```ts
export const TIPOS = {
  ensaio:     { rotulo: 'Ensaio',     icone: '▤' },
  nota:       { rotulo: 'Nota',       icone: '○' },
  caso:       { rotulo: 'Caso',       icone: '▲' },
  padrao:     { rotulo: 'Padrão',     icone: '◆' },
  biblioteca: { rotulo: 'Biblioteca', icone: '▢' },
} as const;

export type Tipo = keyof typeof TIPOS;
export const CHAVES_TIPO = Object.keys(TIPOS) as [Tipo, ...Tipo[]];
```

**Critério de aceite estrutural:** acrescentar um sexto formato deve exigir editar **este arquivo e
mais nenhum**. O teste em §7.1 verifica isso.

### 4.2 `src/content/config.ts` — schema

Collection `biblioteca`, glob de `src/content/biblioteca/*.md`:

| campo | tipo | obrigatório | nota |
| --- | --- | --- | --- |
| `titulo` | string | sim | |
| `resumo` | string | sim | aparece nas listas e no `<meta description>` |
| `tipo` | enum de `CHAVES_TIPO` | sim | |
| `data` | date | sim | data de publicação |
| `atualizado` | date | não | só faz sentido em `padrao` |
| `permanente` | boolean | não, default `false` | `padrao` usa `true`; ver §4.4 |
| `rascunho` | boolean | não, default `false` | excluído do build de produção |
| `tags` | string[] | não, default `[]` | não usadas nesta fatia; o campo existe para não migrar depois |

O enum **deve** vir de `CHAVES_TIPO`, não ser redigitado. Item com `tipo` inválido quebra o build —
esse é o comportamento desejado, não conserte.

### 4.3 Conteúdo inicial

Três arquivos em `src/content/biblioteca/`. **Pelo menos um precisa ser texto real do Giuliano**,
exportado do Obsidian à mão — o objetivo da bala traçante é provar que o frontmatter é escrevível
por uma pessoa, não por um script. Os outros dois podem ser derivados do protótipo:

- `nao-existe-estrategia-de-ia.md` — `tipo: ensaio`
- `ia-e-boa-em-uma-coisa.md` — `tipo: nota`
- `quatro-frentes.md` — `tipo: padrao`, `permanente: true`

**Fora de escopo desta fatia:** exportação automatizada do Obsidian, resolução de links `[[wiki]]`,
transclusões, decisão sobre o que é público. Isso é uma fase própria, depois. O que esta spec
garante é que o schema seja barato de preencher à mão.

### 4.4 URLs

- `/biblioteca/[slug]` para todo item, incluindo os permanentes.
- `permanente: true` **não muda a URL nesta fatia.** Ele existe para marcar, no conteúdo, o que
  depois ganhará rota estável própria. Não invente `/padroes/` agora.
- Slug = nome do arquivo. Sem data na URL — datas na URL envelhecem o conteúdo.

---

## 5. Rotas e layout desta fatia

| rota | conteúdo |
| --- | --- |
| `/` | Home |
| `/biblioteca` | Lista completa, ordenada por data desc |
| `/biblioteca/[slug]` | Item individual |
| `/rss.xml` | Feed |
| `/404` | Página de erro |

**Não implemente** `/aparicoes`, `/sobre`, `/trabalhar-comigo`, nem a busca. A navegação do header
mostra os quatro itens do protótipo; os três não implementados ficam **visíveis e desabilitados**
(sem `href`, `aria-disabled="true"`, cor `--text-subtle`). Link para 404 é pior que link inerte.

### 5.1 Home — blocos, na ordem

Retirados do protótipo. Reproduza o layout; o conteúdo textual do protótipo é o conteúdo real,
salvo onde indicado.

1. **Hero** — grid `1.35fr 0.65fr`. Eyebrow em mono, `<h1>` "Descomplicando a tecnologia",
   subtítulo, régua, quatro parágrafos de bio. Retrato 4:5 à direita.
   O protótipo marca o subtítulo com `<!-- REVISÃO PENDENTE -->`. Use "Inteligência artificial com
   resultado" e deixe o comentário no código.
   **Não há foto ainda** — use o mesmo placeholder do protótipo (`--surface-2`, borda, rótulo
   "retrato 4:5"). Não use foto de banco.
2. **Newsletter inline** — ver §6.
3. **Comece por aqui** — três cards em lista, numerados `01`/`02`/`03`. Os três apontam para
   `/biblioteca` nesta fatia.
4. **Textos recentes** — três cards em grid. Capa: placeholder `16/10` com o rótulo "capa ilustrada
   própria · linha + aquarela". Fonte: os três itens mais recentes da collection.
5. **Lista densa** — cinco itens mais recentes, grid `118px 22px 1fr auto`: data · ícone · título ·
   tipo e idade. Termina em "Ver toda a biblioteca →".
6. **Identidades paralelas** — dois blocos ("O praticante" / "O autor"), texto do protótipo. Ambos
   apontam para `/biblioteca` nesta fatia.
7. **Aparições** — faixa escura em `--petrol-400`, três colunas. **Conteúdo estático inline na
   página.** Não crie collection de aparições nesta fatia; são três itens fixos e uma collection
   aqui seria um módulo raso. O link "Todas as aparições →" fica inerte.

### 5.2 `/biblioteca`

Título, texto de abertura, chips de filtro por tipo, contagem de resultados, lista densa com resumo,
e o bloco "Padrões nomeados" no fim.

Os chips de filtro nesta fatia são **links para `?tipo=ensaio`** resolvidos no cliente com um
`<script>` de ~15 linhas que esconde/mostra `<li>` por `data-tipo`. Sem framework, sem roteamento.
A busca por texto fica fora.

### 5.3 `/biblioteca/[slug]`

Coluna única em `--container-narrow` (760px). Eyebrow com tipo e data, `<h1>`, resumo, corpo em
`--font-body` com `--lh-body`. Bloco de newsletter no fim. Estilos de tipografia do Markdown
(h2, h3, listas, citação, código) vivem em `src/styles/prosa.css`.

### 5.4 Header e footer

Como no protótipo. Header sticky com `backdrop-filter`. O botão "buscar" **não entra nesta fatia** —
remova-o, não o deixe inerte, porque um botão que não faz nada é pior que ausência. O botão de tema
fica e funciona.

Footer em `--graphite-900`, quatro colunas, e a declaração técnica corrigida de §3.3.

### 5.5 Responsivo

O protótipo só existe em desktop (1200px). Todos os grids de coluna múltipla colapsam para uma
coluna abaixo de 860px. `--gutter` já é `clamp(1.25rem,5vw,4rem)` — use-o em vez do `32px` fixo do
protótipo. A lista densa vira duas linhas no mobile: título em cima, metadados embaixo.

---

## 6. Newsletter

Provedor: **Substack** (a publicação ainda não existe; será criada pelo Giuliano).

**Nesta fatia a assinatura é um link para a página do Substack, não um formulário inline.**
Justificativa completa em [ADR 0003](docs/adr/0003-newsletter-como-link-para-substack.md); em
resumo: o embed nativo do Substack é um `iframe` com `width="480"` hardcoded e não customizável,
que estoura o container abaixo de 480px, e não há endpoint de POST documentado que permita um
formulário próprio.

### 6.1 Interface do componente

Um componente, três pontos de chamada, uma propriedade:

```astro
<!-- src/components/Newsletter.astro -->
<!-- Props: variante: 'inline' | 'rodape' -->
```

O componente esconde **qual é o provedor e como a assinatura acontece**. Nenhuma página menciona
Substack. Quando a implementação mudar (embed, formulário próprio, outro provedor), muda este
arquivo e mais nenhum.

A URL do Substack fica em `src/config.ts` como `NEWSLETTER_URL`, com valor placeholder
`https://giulianomendonca.substack.com` até a publicação existir.

### 6.2 Aparência

Mantenha o bloco do protótipo — fundo `--accent-subtle`, o texto "Uma carta a cada duas semanas…",
a contagem de leitores. Troque o par `input + botão` por um `Button` único: **"Assinar no Substack →"**,
com `target="_blank" rel="noopener"`.

A contagem de leitores segue a lógica do protótipo: só aparece quando o número justificar. Enquanto
não houver assinantes, **omita a linha inteira** — não renderize o placeholder `[N] leitores`.

---

## 7. Verificação

O contrato desta spec são os testes abaixo. Prosa acima descreve intenção; o que segue é o que a
máquina checa sozinha.

**Ferramentas:** Vitest (unitário) + Playwright (ponta a ponta) + um script Node para o orçamento.
Se preferir outra ferramenta equivalente, troque — o que não é negociável é que cada item abaixo
falhe sozinho quando violado.

### 7.1 Modelo de conteúdo

- `TIPOS` tem exatamente 5 chaves, e cada uma tem `rotulo` e `icone` não vazios.
- `CHAVES_TIPO` e `Object.keys(TIPOS)` são o mesmo conjunto.
- **Teste anti-vazamento:** um `grep` sobre `src/` (excluindo `src/content/tipos.ts`) não encontra
  nenhum dos cinco caracteres de ícone `▤ ○ ▲ ◆ ▢` nem as strings `'Ensaio'`, `'Nota'`, `'Caso'`,
  `'Padrão'`, `'Biblioteca'` em literal. Se encontrar, a decisão vazou para um segundo módulo.
- Todo item da collection resolve para um ícone: para cada entrada, `TIPOS[item.data.tipo]` é
  definido.
- Um arquivo de fixture com `tipo: inexistente` faz `astro build` falhar. **Veja este teste falhar
  antes de fazê-lo passar** — se ele passa com o schema removido, ele não testa nada.

### 7.2 Tema

- `grep -rE '#[0-9A-Fa-f]{6}' src/ --include='*.ts' --include='*.js' --include='*.astro'` não
  retorna nada fora de `src/styles/`. Nenhum valor de cor em JavaScript.
- Playwright: carregar `/`, clicar no botão de tema → `<html data-theme="dark">`; recarregar →
  continua `dark`; clicar de novo → atributo removido ou `light`; recarregar → continua claro.
- Playwright: com `colorScheme: 'dark'` no contexto e `localStorage` vazio, a página abre escura.
- Playwright: nenhum flash — avalie `document.documentElement.dataset.theme` no primeiro
  `document_start` e confirme que já está definido antes do `load`.

### 7.3 As três premissas, como teste

As premissas declaradas são, nesta ordem: **rápido**, **responsivo**, **hospedagem barata**. Os
testes abaixo medem cada uma diretamente. Não há limite fixo de kB por página — ver §3.3.

#### 7.3.1 Rápido — Lighthouse sobre o build

Lighthouse CI contra `npm run preview`, em `/`, `/biblioteca` e um item, perfil mobile com o
throttling padrão da ferramenta:

| métrica | limite | por quê este número |
| --- | --- | --- |
| Performance | ≥ 95 | site estático sem framework deve chegar a 100; 95 é folga de ruído |
| LCP | ≤ 1.8 s | o limiar "bom" do Core Web Vitals é 2.5 s |
| CLS | ≤ 0.05 | o limiar "bom" é 0.1; aqui o único risco real é troca de fonte |
| TBT | ≤ 50 ms | quase não há JavaScript |
| Acessibilidade | ≥ 95 | ver §3.4 e §7.3.4 |

**São limites de partida, não medições.** Calibre-os no primeiro build e reporte os valores reais.

O gargalo previsível é a fonte de display: o LCP da home é o `<h1>` em Newsreader. Requisitos que a
implementação deve cumprir, e que este teste cobra indiretamente:

- `<link rel="preload" as="font" type="font/woff2" crossorigin>` para a fonte de display, **e só
  para ela** — precarregar as três anula o ganho.
- `font-display: swap` nas três famílias.
- `@font-face` de fallback com `size-adjust` / `ascent-override` / `descent-override` calibrados
  contra Georgia (display) e system-ui (corpo). **Sem isso o swap desloca o layout e o CLS estoura.**
  É aqui que este teste vai falhar primeiro.

#### 7.3.2 Responsivo — Playwright em quatro larguras

375, 768, 1024 e 1440 px, sobre `/`, `/biblioteca` e um item:

- `document.body.scrollWidth <= window.innerWidth`. Sem rolagem horizontal.
- Nenhum elemento com `getBoundingClientRect().right > window.innerWidth + 1`.
- Em 375: todo grid de coluna múltipla renderiza em uma coluna só — `getComputedStyle(el).gridTemplateColumns`
  tem um único track.
- Em 375: alvos de toque (botão de tema, chips de filtro, links da lista densa) têm altura ≥ 44 px.
- Em 375: nenhum texto de corpo computado abaixo de 16px.

#### 7.3.3 Hospedagem barata — o custo mora nas imagens

Hospedagem estática nesta escala é gratuita em GitHub Pages, Cloudflare Pages e Netlify. O que pode
tirar o site do tier gratuito não é HTML nem CSS — é **banda de imagem**, no dia em que uma peça
circular. O orçamento migra para onde o custo realmente mora:

- Nenhuma imagem individual em `dist/` acima de **200 kB**.
- Soma das imagens de uma mesma página acima de **500 kB** falha.
- Toda imagem de conteúdo passa por `astro:assets`, sai em AVIF ou WebP, e leva `width`/`height` no
  HTML — sem isso, CLS.
- Total de `.woff2` em `dist/` abaixo de **200 kB**. Se estourar: subsetar para latin, e só então
  cortar o IBM Plex Mono. Não suba o limite sem reportar o número.

E o teste que protege as três premissas de uma vez, rodando sobre `dist/` depois do build:

- **Zero requisições a host externo.** Nenhum `src`, `href`, `@import` ou `url()` em
  `dist/**/*.{html,css,js}` aponta para fora do próprio site. Isso pega o `fonts.css` do Google se
  ele voltar por engano, e é a forma executável da declaração do rodapé.
- **Zero cookies.** Nenhuma ocorrência de `document.cookie` em `dist/**/*.js`. `localStorage` é
  permitido apenas para a chave do tema — o teste verifica que a única chave usada é `tema`.

#### 7.3.4 Acessibilidade

- `axe-core` via Playwright em `/`, `/biblioteca` e um item, nos dois temas: zero violações de
  severidade *serious* ou *critical*.
- Contraste: os pares de §3.4 são verificados explicitamente. **Espera-se que
  `--accent` sobre `--petrol-400` continue falhando** até o Giuliano decidir — marque esse caso como
  falha conhecida e documentada, com o ratio real no relatório. Não use `expect.skip` sem o
  comentário apontando para §3.4.
- Navegação por teclado: `Tab` alcança botão de tema, links do header, chips de filtro e itens da
  lista, com foco visível (`--shadow-focus`) em todos.

### 7.4 Ponta a ponta

- `npm run build` termina com código 0 e `npm run check` não reporta erro de tipo.
- Playwright em `/`: existe exatamente um `<h1>`, com texto "Descomplicando a tecnologia".
- Playwright em `/`: a lista densa mostra 5 itens; os títulos e a ordem batem com os 5 mais
  recentes da collection por `data` desc.
- Playwright em `/biblioteca`: a contagem exibida é igual ao número de `<li>` visíveis. Clicar no
  chip "Ensaio" reduz a lista só a itens de tipo ensaio, e a contagem acompanha.
- Playwright: clicar no primeiro item da lista leva a `/biblioteca/<slug>` e o `<h1>` de lá é igual
  ao título clicado.
- `/rss.xml` é XML válido e tem um `<item>` por peça não-rascunho.
- Item com `rascunho: true` **não** aparece em `/biblioteca`, nem no RSS, nem gera rota.

(Os testes de viewport e rolagem horizontal ficam em §7.3.2, junto das demais checagens de
responsividade.)

### 7.5 Passo de verificação final — a prova de que a coisa funciona

Isto é o que fecha a bala traçante. Execute na ordem e reporte a saída de cada passo:

1. `npm run build && npm run check` — verde.
2. `npm test && npm run test:e2e && npm run test:dist` — verde.
3. `npm run test:perf` — **cole a tabela real de Lighthouse** (Performance, LCP, CLS, TBT,
   Acessibilidade) para as três rotas, mais o total de `.woff2` em `dist/`. Se algum limite de
   §7.3.1 não fechar, reporte o número antes de mexer no limite.
4. Deploy no GitHub Pages pela Action.
5. **No site publicado, não em localhost:** abrir a home, alternar para tema escuro, navegar até
   `/biblioteca`, filtrar por um tipo, abrir a peça que é texto real do Giuliano, e confirmar que o
   tema escuro sobreviveu às três navegações.
6. Abrir o DevTools na aba Network do site publicado e confirmar, com a lista de requisições em
   mãos, que **nenhuma** vai para um domínio de terceiro.
7. No mesmo DevTools, recarregar com cache vazio e registrar o **peso total transferido** da home.
   Não há limite a bater — o número entra no relatório como linha de base para comparar depois.
8. Clicar em "Assinar no Substack" e confirmar que abre a URL configurada em nova aba.

Se o passo 5 ou 6 falhar, a fatia não está pronta, ainda que todos os testes automatizados passem.

---

## 8. Avaliação da estrutura

Critério aplicado: **`ousterhout-philosophy-software-design`** — profundidade de módulo e
vazamento de informação. É a régua adequada para um projeto deste tamanho. Fronteira formal no
sentido de `martin-clean-architecture` seria over-engineering aqui: não há caso de uso, nem
adaptador, nem inversão de dependência a desenhar em um site estático de três rotas, e forçar esse
vocabulário só acrescentaria camadas sem eliminar complexidade — o que o próprio Martin chama de
falha da Regra da Dependência aplicada fora de escala.

### O que a estrutura acerta

**`src/content/tipos.ts` é o módulo mais importante do sistema.** Interface mínima (um objeto e um
tipo derivado) escondendo uma decisão que aparece em cinco lugares na interface do usuário: schema,
chips de filtro, ícone da lista densa, ícone da biblioteca, rótulo do badge. Sem ele, acrescentar
um sexto formato exigiria editar cinco arquivos — vazamento de informação clássico, e o teste em
§7.1 é literalmente o teste do livro ("nomeie a decisão, conte quantos módulos mudam").

**`Newsletter.astro` é um módulo profundo.** Uma propriedade de interface escondendo: o provedor,
o mecanismo de assinatura, a URL, e a regra de quando mostrar a contagem. Sabemos que essa
implementação vai mudar — a publicação do Substack nem existe ainda. Três pontos de chamada, e uma
troca de provedor toca um arquivo.

### O custo assumido, explicitamente

**Seções da home ficam inline, não viram componentes.** Hero, "Comece por aqui", "Identidades",
"Aparições" são markup dentro de `src/pages/index.astro`. Esse arquivo vai passar de 400 linhas.

Isso é deliberado, e é o ponto onde esta spec mais provavelmente vai incomodar quem implementar. O
teste de módulo raso: um `<Hero>` que recebe eyebrow, título, subtítulo, quatro parágrafos e um
retrato tem interface tão complexa quanto sua implementação — documentá-la custaria mais texto que
o markup que ela esconde, e há **um único** ponto de chamada. Extrair seria classitis: cinco
componentes, cada um individualmente simples, cujas interfaces somadas custam mais que o arquivo
longo. Comprimento não é motivo para dividir.

**A regra operacional:** extraia quando aparecer o segundo ponto de chamada, não antes. Nesta
fatia isso qualifica exatamente três coisas — `Newsletter` (3 chamadas), `ItemLista` (lista densa
da home + lista da biblioteca, mesma forma) e `Button`/`Badge`/`Tag` (muitas).

**O que aceitamos perder:** se as seções da home forem reaproveitadas em outra página na segunda
fatia, será preciso extraí-las então — trabalho que teríamos evitado extraindo agora. Achamos essa
aposta melhor que o inverso, porque extrair depois é mecânico e barato, enquanto desfazer cinco
abstrações erradas exige entender por que elas existiam.

---

## 9. Fora de escopo desta fatia

Declarado para que ninguém resolva problema que não foi pedido:

- Páginas `/aparicoes`, `/sobre`, `/trabalhar-comigo`.
- Busca por texto (o botão "buscar" do protótipo não é implementado, é removido).
- Formulário de contato, e portanto qualquer função serverless.
- Formulário de newsletter inline. Só link.
- Collection de aparições — os três itens da home são estáticos.
- Rota própria para `padrao` / URLs permanentes.
- Exportação automatizada do Obsidian, links `[[wiki]]`, transclusões.
- Capas ilustradas e retrato. Placeholders, e nunca foto de banco.
- Os componentes de formulário do DS (`Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`).
- Tags e filtro por tag — o campo existe no schema, a interface não.
- i18n. Site em português apenas.
- Analytics de qualquer tipo.
