# Etapa 4 · A versão horizontal (1920×1080)

Pré-requisito: v3 vertical aprovada. Objetivo: o mesmo filme, recomposto pra horizontal. **Não é corte do
vertical**: cada parte é refeita no formato. Mesma música, mesma grade, mesmos cortes.

Tudo do horizontal vive em pastas próprias: `../quadros/<ID>_blh/` (Blender) e `../quadros/<ID>_h/`
(o resto), `../tempo-h.json` (cópia do `tempo.json` com largura 1920 e altura 1080) e
`../montagem-h.json`.

## Parte por parte

| trecho | quadros | o que fazer | onde |
|---|---|---|---|
| planta se desenhando | [0, 168) | refilmar pelo arreio do site em 1920×1080; a planta deitada ocupa melhor o quadro: gire pra isso | `../captura/` (aceitar formato por argumento) |
| corredor (fim da A, B, cópias, mergulho, porta, palco) | vários | renderizar de novo no Blender com a câmera horizontal: mesma trajetória, lente de 62° de campo vertical como ponto de partida. No corredor largo dá pra ver as duas paredes de cópias: componha pra isso | `blender/` |
| passe `fio` desses planos | idem | refilmar pelo arreio do site em 1920×1080 | `../captura/` |
| cópias de frente (`C2*`) | 18 cada | no horizontal uma cópia vertical sozinha deixa muito concreto: enquadre **duas ou três cópias vizinhas** por plano, com a do meio em foco | `blender/` |
| mergulho | 31 | termina com a foto cobrindo a **altura** do quadro, centrada, com a parede escura dos lados; o corte seguinte bate com isso | `blender/` |
| fotos em tela cheia | [544, 598) | as fotos são verticais: **não cortar**. Três fotos lado a lado por batida (a da vez no centro, maior e acesa; as vizinhas menores e mais escuras), e a cada batida a fila anda uma posição pro lado, carregando o movimento | `../pos/` |
| acervo | [598, 651) | regravar a cena em 1920×1080 (`../cenas/G2_acervo.html` aceitando o formato); a grade abrindo funciona melhor deitada | `../cenas/` |
| showreel do site | [651, 759) | filmar a home no **layout de computador** (viewport 1920×1080): abertura embaralhando, a colagem espalhada com um card sendo arrastado de verdade, o voo pra galeria, a grade com o lápis. Mesmos cortes internos (locais 27, 54, 81) e as mesmas correções da v2 (sem card vazio, nome legível) | `../captura/site.mjs` |
| trechos dos filmes | 4 trechos | trocar pelos filmes horizontais nativos (0, 1, 3 e 4 são 16:9; evite os que têm legenda queimada ou glitch: ver `../pos/filmes.json`). Vertical nativo só se entrar com a mesma solução das fotos, sem corte | `../pos/` |
| AGENDA ABERTA | [866, 960) | regravar em 1920×1080: no horizontal o título cabe em uma linha só; site e @ embaixo; margens seguras de vídeo horizontal (5% em cada borda) | `../cenas/` |

O laboratório (`../pos/montar.py`) precisa aceitar o formato: tamanho do quadro vindo do arquivo de tempo,
grão e flash independentes da resolução, e o montador de fotos lado a lado. Faça isso sem mudar o
resultado do vertical (remonte a v3 vertical depois e confira que saiu igual).

## Ordem

1. Formato por argumento no arreio (`captura/`), nas cenas (`cenas/`) e no laboratório (`pos/`), com o
   vertical conferido igual.
2. Showreel do site, acervo e cartela em horizontal (são rápidos e não dependem de render).
3. Corredor no Blender em horizontal, por faixas, em segundo plano.
4. Fotos lado a lado e trechos de filme.
5. Montagem: `../saida/showreel-v3-horizontal.mp4` e a versão leve.

## Critérios de pronto

- 1920×1080, 960 quadros, 32,0 s, cortes no quadro exato, som em sincronia.
- Nenhuma foto do Pedro cortada ou esticada; nenhum rosto fora do quadro.
- Texto legível numa tela de computador e num celular deitado.
- Folhas de revisão em `../saida/revisao-v3h/`, abertas e olhadas.
- As três versões anteriores (v1, v2, v3 vertical) intactas.

## Parar aqui

Mostre a v3 horizontal ao Pedro. Linha no `andamento.md`.
