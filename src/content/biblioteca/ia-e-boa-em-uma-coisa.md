---
titulo: 'IA é boa em uma coisa: dizer o quanto duas coisas são parecidas'
resumo: Uma nota curta, meio-cozida, sobre desmontar o pedestal da tecnologia.
tipo: nota
data: 2026-07-14
tags:
  - fundamentos
---

Nota curta, ainda meio-cozida. Escrevo para não perder.

Qualquer IA, no fundo, é muito boa em uma única coisa: dizer o quanto duas coisas
são parecidas. Um classificador diz o quanto esta imagem se parece com as imagens
que ele viu rotuladas como "defeito". Um modelo de linguagem diz o quanto esta
continuação se parece com as continuações que ele viu. Busca semântica é
literalmente isso, sem disfarce.

Isso não diminui a tecnologia. Semelhança é um primitivo poderoso — boa parte do que
chamamos de raciocínio, quando olhamos de perto, é reconhecimento de padrão com
outro nome. Meu mestrado, em 2008, era sobre reconhecimento de padrões em modelos
3D. Hoje se chamaria de IA. Na época se chamava só de pesquisa.

O que essa formulação faz é tirar a tecnologia do pedestal, e isso tem consequência
prática imediata. Se o sistema responde por semelhança, então:

- Ele vai errar com confiança quando o caso novo *parecer* com um caso conhecido sem
  *ser* um caso conhecido. Fraude bem feita é exatamente isso.
- A qualidade do que sai depende inteiramente do que ele viu. "O modelo é ruim"
  quase sempre quer dizer "os exemplos não cobrem o seu caso".
- Perguntar "ele entende?" é a pergunta errada. A pergunta útil é "parecido com o
  quê, e isso é o critério que eu queria?"

Entender isso é o que separa quem usa IA com critério de quem compra promessa.

Fica para desenvolver: onde essa formulação quebra. Ela descreve bem o que o sistema
computa e mal o que ele produz em cadeia longa — várias etapas de semelhança
encadeadas fazem algo que não é obviamente semelhança. Ainda não sei escrever essa
parte sem cair em hand-waving.
