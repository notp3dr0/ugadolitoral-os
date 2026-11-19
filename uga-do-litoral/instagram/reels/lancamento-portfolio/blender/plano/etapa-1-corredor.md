# Etapa 1 · O corredor no Blender

Objetivo: o mesmo corredor do site, com as mesmas medidas e as mesmas fotos nos mesmos lugares, existindo
como cena do Blender com luz de verdade. Sem animação ainda. Termina em quadros parados pro Pedro escolher
o motor e o clima.

## Passo 1 · Exportar a planta do site (`blender/exportar.mjs`)

Um script Node que abre `bastidor.html?semente=fixa` com o Playwright (copie o jeito de abrir de
`../captura/filmar.mjs`) e grava `blender/dados/corredor.json` com tudo em metros, no sistema do motor
(three.js: Y pra cima, câmera olhando pra -Z):

- `paredes`: de `plan.walls` (cada uma com `a`, `b`, `normal`); pé-direito 3,3 m (`HALL_HEIGHT`).
- `piso`: as células de `floorCells()` (`U = 1.7` m).
- `copias`: de `world.prints.items`, pra cada uma: posição, rotação (quaternion), largura e altura do
  mesh, e o arquivo da foto (`-lg.webp`), o artista e a ala.
- `trilho`: `plan.rail.at(s)` amostrado a cada 5 cm, e `plan.rail.total`.
- `porta`: `plan.door` (posição, `facing`), tamanho e posição das folhas e da placa PALCO (leia de
  `world.dressing.door` e de `bastidor/dressing.js`).
- `enfeites`: o que der pra ler de `world.dressing` com posição e tamanho (luminárias, placas de nome de
  ala, setlist, caixas de equipamento, luz vermelha das passagens). Texto de placa como texto.
- `telas`: de `world.projections` (posição, tamanho, qual filme).

Critério: o JSON tem 109 cópias, e a soma do trilho bate com `plan.rail.total` (uns 163 m). Imprima um
resumo ao final.

## Passo 2 · Montar a cena (`blender/montar_cena.py`)

Script do Blender que lê `corredor.json` e gera `blender/cena/corredor.blend` do zero:

- **Conversão de eixos:** three (x, y, z) → Blender (x, -z, y). Escreva uma função só e use sempre.
- **Geometria:** paredes, piso e teto como malhas com espessura real (parede com 20 cm, pra a luz não
  vazar). Rodapé e junta de concreto discretos se ajudarem a dar escala.
- **Materiais (procedurais, sem baixar textura):** concreto aparente nas paredes (rugosidade alta, variação
  sutil, marcas de forma), piso de concreto polido com reflexo leve e irregular (é o que mais vende a
  luz), teto escuro.
- **Cópias:** um plano por cópia com a foto como textura emissiva fraca + difusa (a foto tem que ler com
  as cores certas: confira contra o arquivo), papel com 2 mm de afastamento da parede, borda branca fina,
  brilho de papel fotográfico. Converta os `.webp` pra PNG/JPG numa pasta `blender/dados/fotos/` se o
  Blender não ler webp direto.
- **Luz:** escuro por padrão. Luminárias pequenas no teto iluminando cada cópia (facho estreito, quente),
  o vermelho de saída de emergência nas passagens vazando no concreto, a placa PALCO acesa. Volume leve
  (neblina) só se couber no orçamento de tempo.
- **Porta do PALCO:** duas folhas com pivô (pra abrir na etapa 2), placa, e atrás dela um espaço escuro.
- **Organização:** coleções `corredor`, `copias`, `luzes`, `porta`, `enfeites`, com nomes estáveis.

## Passo 3 · Câmeras e render (`blender/render.py`)

Um script que recebe: arquivo da cena, formato (`v` = 1080×1920, `h` = 1920×1080), motor, faixa de
quadros, pasta de saída. Lente: o motor usa campo de visão vertical de 80° no vertical e 62° no
horizontal; comece daí e ajuste pelo olho (no Blender, defina pelo campo de visão, não pela distância
focal). Cor: saída em sRGB, com transformação de vista que não lave o preto (teste Standard e AgX e
escolha olhando: o preto do filme tem que continuar preto e o vermelho, vermelho).

## Passo 4 · Quatro quadros parados, nos dois formatos e nos dois motores

Posições (use as poses do `../captura/planos.js`, avaliadas no tempo indicado, via um pequeno exportador
`blender/exportar_camera.mjs` que grava a pose por quadro de um plano em JSON):

1. `B1_travessia` no quadro local 110 (o corredor com cópias dos dois lados).
2. `C2a` no quadro local 0 (uma cópia de frente).
3. `C7_porta` no quadro local 60 (a porta ao fundo) e no 90 (a porta abrindo; abra as folhas à mão no script).

Cada um em vertical e horizontal, em EEVEE e em Cycles, com o tempo de render anotado na imagem.
Monte `blender/revisao/etapa-1.jpg`: pra cada posição, lado a lado, o quadro atual da v2
(`../quadros/<ID>/cor/`), o EEVEE e o Cycles. Abra e olhe.

## Critérios de pronto

- As cópias estão nos mesmos lugares do site (sobreponha um quadro do Blender ao passe `fio` do mesmo
  plano: as molduras têm que coincidir a poucos pixels).
- As fotos leem com as cores do arquivo, sem lavar nem tingir.
- O preto é preto; nada de cena cinza "de render padrão".
- Tempo por quadro medido em cada motor, sem contar o arranque.
- Rodar `exportar.mjs` e `montar_cena.py` de novo recria a mesma cena.

## Parar aqui

Mostre a folha ao Pedro com uma recomendação de motor (qual, por quê, quanto custa em horas pro filme
inteiro nos dois formatos) e espere a resposta. Linha no `andamento.md`.
