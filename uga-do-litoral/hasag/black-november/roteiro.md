# HASAG · Black November · roteiro de produção

Vertical 1080x1920, 24 fps, 19 s (456 frames). Conceito: **Contas de Baily**.
Roteiro v2 aprovado pelo Pedro em 2026-11-10, com os ajustes de produção abaixo.

## A ideia em três frases

O miolo do símbolo HSG já é um eclipse parado: o filme dá play nele. Na totalidade, a luz que
vaza pela borda da lua forma uma fileira de contas, e essa fileira fecha a Pulseira G1. O colar é
o que o personagem já veste; a pulseira é o que o eclipse deixa, como a oferta.

## Regras de desenho

- Forma chapada sem contorno, figura em silhueta preta. Movimento a 24 qps com easing (2026-11-10:
  a versão a 12 desenhos, com cortes secos e degraus, ficou dura demais).
- De dia: off-white, vermelho do símbolo e preto. Na totalidade: o céu vira vermelho quase preto.
- Textura e gradiente entram para enriquecer: nácar nas pérolas, metal nas cruzes, halo no sol,
  coroa com raios na totalidade, vinheta e grão que ferve a cada dois frames.
- Corte seco só no golpe da totalidade e no clique do punho. O resto das trocas carrega movimento:
  mergulho na figura (P1→P2), câmera que sobe pro sol (P2→P3), entrada no disco e íris que abre
  no peito (P5→P6), corte no movimento do braço (P6→P7), crescente que varre o quadro (P7→P8).
- De dia a pérola é um disco liso. Na totalidade ela escurece um tom e ganha um crescente na
  proporção do símbolo (14% do diâmetro), do lado da luz.
- Strass é uma estrela de quatro pontas que dura de 2 a 4 frames.

## Ajustes de produção sobre o roteiro v2

- **144 BPM em vez de 140.** A 24 fps um tempo vira 10 frames exatos, e todo corte cai em frame
  inteiro.
- **Contas do P5 uma por desenho** (2 frames), não por semicolcheia: as 19 contas levam 38 frames.
  O fecho clica no frame 200, no primeiro tempo do compasso, e a batida volta ali.
- **As contas começam em cima à direita**, onde o sol vai voltar, e correm no sentido horário.
- **Cruz na totalidade em metal apagado com filete de luz.** Preta, como estava no roteiro, ela
  sumia na camiseta escura.
- **Etiquetas do P6:** "1K2Q" e "RADIANT", uma pra cada colar, porque os dois estão em quadro.
- **Camiseta vermelha** na abertura da jaqueta (veio do repost 2): a pérola branca lê melhor.
- **Clique do punho no frame 350**, a batida corta ali; 10 frames de silêncio com a ponta da
  corrente balançando, e a tela final entra no frame 360.
- **O 808 toca Sol 1 (G1)**, o nome da pulseira.

## Plano a plano

| plano | frames | tempo | o que acontece |
|---|---|---|---|
| P1 geral | 0 a 50 | 0:00 a 0:02 | Símbolo ampliado como arquitetura (sol a 40% da largura, laterais vazando do quadro). Figura de costas com 1/8 da altura. A lua, da cor do céu, já come a borda direita do sol. |
| P2 peito | 50 a 100 | 0:02 a 0:04 | De frente, câmera baixa. 1K2Q e Radiant em branco. Cortes secos no eixo nos frames 70, 80 e 90, cada um mais perto; a faixa de sol estreita e o céu escurece em degraus. |
| P3 sol | 100 a 144 | 0:04 a 0:06 | Close. A lua para na posição do vetor e segura 12 frames (130 a 142). No primeiro desenho da parada o céu volta ao branco: por um instante é o símbolo, cor por cor. |
| P4 totalidade | 144 a 160 | 0:06 a 0:07 | Dois frames invertidos, depois céu vermelho escuro e disco preto. 14 frames de silêncio. |
| P5 contas | 160 a 240 | 0:07 a 0:10 | 15 pérolas e 4 rondelas acendem em volta do disco, uma por desenho. Corrente no 198, clique do fecho no 200, a batida volta. Etiqueta "G1" no 210. |
| P6 peito | 240 a 320 | 0:10 a 0:13 | Enquadramento do terceiro corte do P2. O corpo gira uns 15 graus em 12 desenhos. Cruzes com período de 10 frames, a do meio dois desenhos atrás. Radiant parte quatro desenhos depois, período de 20 frames, e segue balançando. Crescentes migram de "10 horas" pra "12 horas". |
| P7 punho | 320 a 360 | 0:13 a 0:15 | Corte seco. O antebraço inclina em 6 desenhos, a G1 segura 2 e desliza em 8 até o punho da manga. Clique no 350. Etiqueta "PULSEIRA G1". |
| P8 tela final | 360 a 456 | 0:15 a 0:19 | Dois frames invertidos, depois off-white. Blocos entram nos frames 362, 370 e 380 e ficam parados 3 s. |

## Tela final (P8)

Símbolo, BLACK (vermelho), November (preto itálico), ilustração da G1 sobre disco preto,
"GANHE UMA PULSEIRA G1 / NA COMPRA DE QUALQUER COLAR.", "LINK NA BIO · hasagstore.com.br".
Texto na hierarquia do banner da loja. Tudo entre 13% e 76% da altura.

## Som

Trilha-guia sintetizada em `filme/scripts/trilha.py`. A batida escurece com a imagem (filtro
fechando no P2 e no P3), silêncio total na totalidade, uma nota por conta no P5, e o chimbal da
batida cheia é feito do som das pérolas. Serve pra aprovar ritmo; a final pede produtor ou som
gravado das peças.

## Versão de 15 s

Sai o P2, o punho entra no fim do P6 e a tela final cai pra 3 s. Ainda não montada.
