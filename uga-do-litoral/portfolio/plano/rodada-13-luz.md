# Rodada 13 · a luz do Blender no corredor do site (piloto: um lance)

Escrito pelo Opus em 2026-11-17, a pedido do Pedro ("pegar a estrutura do showreel e pôr no site").
Leia o `LEIA-PRIMEIRO.md` antes. Esta rodada **não troca o corredor inteiro**: prova em um lance, mede,
e o Pedro decide se estende.

## Por quê

O showreel (`uga-do-litoral/instagram/reels/lancamento-portfolio/blender/`) reconstruiu o corredor no
Blender a partir dos dados do próprio site e renderizou com luz física: sombra, círculo de luz nas fotos,
concreto com volume. O site é `MeshBasicMaterial` chapado, sem luz (ver `bastidor/dressing.js`, linha 2).
Calcular aquela luz ao vivo não cabe no celular; **pintar a luz uma vez (bake) e mostrar pronta** cabe,
e costuma deixar o site mais leve.

## O que já existe e se reaproveita

- `blender/exportar.mjs`: abre o motor do site e tira planta, cópias, porta e telas → `dados/corredor.json`.
- `blender/montar_cena.py`: monta `cena/corredor.blend` a partir desse JSON (materiais Principled, luzes).
- A planta do site é a mesma a cada visita (o que é sorteado são as fotos e os encontros, não as paredes).
  Muda quando entram fotos novas (o corredor cresce): aí se refaz o bake. Por isso tudo é **script**.

## Passos

1. **Escolher o lance piloto.** O 2º lance (o primeiro reto depois da entrada, onde todo visitante passa).
2. **Bake no Blender, por script** (`blender/bake_site.py`, novo, na pasta do showreel; não tocar nos
   arquivos do filme): paredes, piso e teto do lance, com as luminárias e os spots sobre cada vaga de foto.
   Cycles, bake de **luz difusa + oclusão** (sem a cor da foto: a foto continua sendo textura própria,
   porque é sorteada). Um atlas por lance, 2048 px, UV2 gerado pelo script (Smart UV ou unwrap por face,
   com margem de 8 px).
3. **Exportar** o lance como glTF (`.glb`) com UV2, e o atlas em **KTX2** (compressão de GPU) e WebP de
   reserva. Meta: até 1,5 MB por lance somando tudo.
4. **No site** (`site-lab/bastidor/`): carregar o `.glb` do lance (GLTFLoader + KTX2Loader do three 0.170,
   vendorizados), aplicar o atlas como `lightMap` (ou multiplicar no `MeshBasicMaterial`), esconder as
   paredes geradas daquele trecho. Os círculos de luz "falsos" de `dressing.js` saem daquele lance.
   As fotos ficam por cima, como hoje, e ganham o halo do spot que agora está pintado na parede.
5. **Chave de teste:** `?luz=blender` liga o lance novo; sem ela o site fica como está. Só vira padrão
   depois do OK do Pedro.
6. **Medir** com `ferramentas/medir-bastidor.mjs` (celular simulado): MB baixados, quadro pior, texturas
   vivas. Comparar com e sem `?luz=blender`. Prints lado a lado do mesmo ponto: site atual, site com bake,
   render do Blender.

## Critérios

- A diferença aparece num print parado (sombra no rodapé, círculo de luz na foto, textura do concreto).
- Celular simulado: quadro pior não piora mais que 10 %; peso extra do lance ≤ 1,5 MB.
- Nada muda sem `?luz=blender`. Todas as suítes passam.

## O que fica pra depois (se o piloto for aprovado)

Os outros lances, a porta do PALCO e a sala; reflexo fingido no chão; ajustar fumaça, água e encontros
pra conversar com a luz nova; carregar lance a lance enquanto a pessoa anda.

## Relatório ao Pedro (até 10 linhas)

O que mudou, os números antes e depois, o print lado a lado, e o link de prévia (branch `rodada-13`).

## Como foi feito (2026-11-17, Opus)

Desvio do plano, pra melhor: em vez de exportar um lance em glTF, o bake foi feito **na própria geometria do
site** (paredes na ordem de `plan.walls`, piso célula a célula) e cobre o **corredor inteiro**. Sem modelo novo,
sem GLTFLoader/KTX2: o site só ganha um segundo UV e um `lightMap` no material que já existia.

- `showreel/blender/bake_site.py`: abre `cena/corredor.blend` (só lê), esconde a casca do filme, as cópias
  (sorteadas), a neblina e o contraluz do palco; monta os alvos; Cycles 512 amostras, luz difusa direta +
  indireta sem cor. Paredes: atlas 2048 (54 px/m, um quadro por parede); piso: 2048×1024 visto de cima.
  Tempo: 279 s + 101 s na GTX 1660 Super.
- `showreel/blender/bake_site_pos.py`: tira o ruído (borrão de 1,6 px), grava em sRGB 8 bits (WebP) com a
  escala no `mapa.json`. Paredes 90 KB, piso 29 KB.
- Site: `bastidor/luz.js` + `bastidor/luz/` (os dois WebP e o `mapa.json`). Liga com `?luz=blender`
  (`&ganho=` ajusta; padrão 4). A assinatura da planta protege: se o corredor mudar (fotos novas), a luz
  velha não entra e o site fica como hoje. Quando entrar foto nova: rodar `exportar.mjs`, `montar_cena.py`,
  `bake_site.py`, `bake_site_pos.py` e copiar `luz_site/` pra `site-lab/bastidor/luz/`.
- As cópias ocupam sempre as primeiras vagas, na ordem: o cone pintado cai onde a foto está, toda visita.
- A luz falsa sai com a luz pintada (poças aditivas escondidas; vermelho aditivo a 35 %, só pra pulsar).
  A passagem de som escurece o mapa junto.
- Teste: `ferramentas/luz.mjs` (prints em `saida/luz/`, com e sem; `node luz.mjs 2.5 4` compara ganhos).
