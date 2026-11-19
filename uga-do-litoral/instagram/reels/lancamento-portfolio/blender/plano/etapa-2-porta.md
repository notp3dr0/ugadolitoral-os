# Etapa 2 · O plano-teste: a corrida até a porta do PALCO

Pré-requisito: etapa 1 aprovada, motor escolhido pelo Pedro. Objetivo: um plano só, completo, nos dois
formatos, dentro do filme, pra ele comparar com o atual e decidir se o Blender vale o filme inteiro.

O plano é o `C7_porta`: 111 quadros, entra em [759, 866) na montagem (batidas 56 a 64). No filme atual
ele é o trecho mais fraco: corredor escuro e chapado, e a porta abrindo quase não se lê.

## Passo 1 · A câmera

Exporte a pose do `C7_porta` quadro a quadro (posição, yaw, pitch, inclinação, campo de visão) com o
`exportar_camera.mjs` da etapa 1 e anime a câmera do Blender com um ponto-chave por quadro (sem
interpolação do Blender: a curva já vem pronta). O vertical usa a mesma trajetória da v2, pra o corte
com os trechos de filme continuar funcionando. No horizontal a trajetória é a mesma; ajuste só a lente.

## Passo 2 · O que acontece (marcos em quadros locais)

- **0 a 79:** corrida, uns 22 m até a porta, rápida. A luz faz o trabalho: as luminárias das cópias
  passando como faixas, o reflexo delas correndo no piso, a placa PALCO e o vermelho SILÊNCIO crescendo no
  fundo.
- **80 a 94 (batida 62 a 63):** as folhas abrem **pra quem chega** (como no `planos.js`). Do vão sai luz
  de palco: contraluz forte, com neblina, desenhando o facho no chão do corredor e a silhueta das folhas.
  É o momento que hoje não se lê e tem que virar o melhor quadro do plano.
- **94 a 97:** a câmera atravessa o vão.
- **98 a 106:** escurece até **preto total** (o escuro do palco). A partir do 107, preto.
- **Desfoque de movimento:** do próprio Blender, ligado no plano inteiro (obturador de meio quadro).
- **Profundidade de campo:** leve, foco na porta. Só se não estourar o orçamento.

## Passo 3 · Passes

Pra o laboratório (`../pos/montar.py`) continuar funcionando sem mudança de formato:

- `cor`: JPG qualidade 95, `000000.jpg` em diante.
- `prof`: PNG 16 bits em RG, distância da câmera em metros de 0 a 30 (`(R*256+G)/65535*30`; 65535 =
  vazio). Saia do passe de profundidade do Blender (atenção: Z do Blender é distância ao plano da câmera;
  converta pra distância radial).
- `fio`: não precisa refazer; copie o da v2 (`../quadros/C7_porta/fio/`) no vertical. No horizontal,
  refilme pelo arreio do site em 1920×1080 se for barato; se não, deixe sem e avise.

Saídas: `../quadros/C7_porta_bl/` (vertical) e `../quadros/C7_porta_blh/` (horizontal), com `pronto.json`.

## Passo 4 · O flash

Hoje o flash da seção C é simulado no Python pela profundidade. Com luz física, teste as duas opções no
quadro 0 do plano e escolha olhando: (a) manter o flash do laboratório por cima do render; (b) um flash
de verdade na cena (uma luz presa à câmera, animada: acende no quadro do corte e morre em 4 a 6 quadros,
nos quadros de corte que caem neste plano, ver `../montagem.json`), e desligar o do laboratório pra este
plano. Se (b), o `montar.py` precisa de um modo sem flash por fonte: acrescente sem quebrar o resto.

## Passo 5 · Dentro do filme

- Uma montagem de teste que troca só este plano: copie `../montagem.json` pra `../montagem-v3-teste.json`
  apontando `C7_porta` pra `C7_porta_bl`, e faça o `montar.py` aceitar o arquivo de montagem e o nome de
  saída por argumento (sem mudar o padrão). Saída: `../saida/teste-porta-vertical.mp4`, o filme inteiro.
- `../saida/teste-porta-comparacao.mp4`: só o trecho [745, 880), atual e Blender lado a lado, com som.
- `../saida/teste-porta-horizontal.mp4`: só o plano no formato horizontal, com o som do trecho (o resto
  do filme horizontal é da etapa 4).
- `blender/revisao/etapa-2.jpg`: 8 quadros do plano, atual em cima e Blender embaixo.

## Critérios de pronto

- Os cortes com os trechos de filme (quadros 759, 772, 786, 799, 813, 819, 826, 833) continuam no quadro
  exato e o movimento não dá tranco na volta pro corredor.
- A porta abrindo lê claramente num celular.
- Preto total no fim do plano (confira o valor do pixel).
- Tempo médio por quadro medido, e a conta de horas pro filme inteiro nos dois formatos.
- A v2 continua intacta.

## Parar aqui (portão)

Mostre ao Pedro o teste vertical, a comparação e o horizontal, com a conta de horas. Só segue pra etapa
3 se ele disser que sim. Linha no `andamento.md`.
