# 0003 — Newsletter como link para o Substack, não formulário inline

**Data:** 2026-07-28 · **Status:** aceito para a primeira fatia · **Revisar quando:** a publicação
existir e houver dado de conversão

## Contexto

O Giuliano quer criar a newsletter no **Substack** e pediu a alternativa mais fácil para coletar
assinantes. A publicação ainda não existe.

O protótipo mostra um formulário inline (`input` de e-mail + botão) em três posições: abaixo do
hero, no fim de cada peça, e no rodapé. O rodapé do protótipo declara publicamente que o site é
"estático, sem rastreadores, sem cookies, sem pop-up de assinatura", com peso-alvo abaixo de 100 kB
por página.

O que foi verificado sobre o Substack:

- O mecanismo nativo de embed é um **iframe**, obtido em Settings > Growth features / "Import your
  email list" > "Embed form".
- O iframe tem **`width="480"` hardcoded e não é customizável**; abaixo de 480px de viewport ele
  estoura o container ou é cortado.
  Fontes: [Supascribe](https://supascribe.com/guides/substack-subscribe-form-embed),
  [SubstackAPI](https://substackapi.com/docs/how-to-embed-your-substack-signup-form-on-any-website).
- **Não foi possível verificar** nenhum endpoint HTTP de POST documentado, nem parâmetro de
  preenchimento por query string, que permitisse construir um formulário próprio. O artigo oficial
  do Substack sobre o assunto retornou HTTP 403 à consulta, e a documentação de terceiros não expõe
  a especificação. Isso é ausência de evidência, não evidência de ausência — um endpoint pode
  existir sem estar documentado.

## Decisão

Na primeira fatia, o bloco de newsletter mantém o layout do protótipo mas troca o par
`input + botão` por um botão único **"Assinar no Substack →"**, que abre a página de assinatura em
nova aba.

A decisão fica encapsulada em `src/components/Newsletter.astro`, com uma única propriedade
(`variante`). Nenhuma página menciona Substack; a URL vive em `src/config.ts`.

## Alternativas descartadas

**Iframe nativo do Substack, embutido.** É o caminho oficialmente suportado e converte melhor,
porque o assinante não sai do site. Descartado nesta fatia por três custos somados: (a) largura
fixa de 480px quebra em telas pequenas, num site cujo design especifica radius, tracking e cor em
cada detalhe; (b) o iframe carrega recursos de terceiro e define cookies do Substack, o que torna
falsa a declaração do rodapé como está escrita; (c) acrescenta um modo de falha externo à primeira
fatia, cujo objetivo é provar o pipeline próprio ponta a ponta.

**Formulário próprio postando para um endpoint não documentado do Substack.** Descartado: depender
de comportamento não documentado de um terceiro significa que a assinatura pode parar de funcionar
sem aviso e sem erro visível — o pior tipo de falha para um formulário.

**Serviço intermediário (SubstackAPI, Supascribe).** Resolvem o problema de estilo e entregam
formulário inline customizável. Descartados por colocarem um terceiro no caminho dos endereços de
e-mail dos assinantes, o que é uma decisão de privacidade que não cabe ao implementador tomar, e
por contradizerem a promessa do rodapé.

## Consequências aceitas

- **Conversão menor que a de um formulário inline.** Este é o custo principal e é real: cada clique
  a mais e cada saída do site derruba assinatura. Aceito conscientemente em troca de coerência com
  a declaração pública do rodapé e de uma primeira fatia sem dependência externa.
- Nenhuma função serverless é necessária, e portanto **a decisão de hospedagem fica em aberto**. O
  site continua servível por qualquer host estático, incluindo GitHub Pages. Esse é um efeito
  colateral desejável: a escolha de host não fica presa a esta.
- Sem formulário próprio, não há como medir conversão no site. Medir do lado do Substack (origem
  do assinante) é o que resta, e é grosseiro.
- A revisão desta decisão custa a edição de **um arquivo**. É a razão de o componente existir com
  interface de uma propriedade.
