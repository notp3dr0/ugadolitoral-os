# SPEC · "Um gesto" · Instituto Semear

GOAL:    quem assiste sente que um gesto de apoio faz uma rede inteira de jovens florescer, e termina
         olhando a marca do Semear sem que ninguém peça nada.
OUTPUT:  HyperFrames · h16x9 1920×1080 e v9x16 1080×1920 · 30 fps (gerados por `gerar.cjs`)
TIME:    27,0 s × 30 = 810 frames · trilha ~96 BPM (18,75 frames por batida), quando entrar

LOOK:    meio = papel e tinta chapada, a própria linguagem da identidade nova do Semear.
         chão `#EDEDED` + textura de papel (ruído, alpha ≤ 9%) · tinta marrom `#975F30` (mãos, chão, títulos)
         · pessoas oliva `#85933C` + cabeça amarela `#FFBB00` · linhas da rede `#5E682C`
         · estampa: azul `#237B9F`, azul escuro `#196282`, amarelo, oliva, oliva escuro `#5E682C`, marrom.
         Sem sombra, sem brilho, sem gradiente, sem vinheta.
         Tipo: Poppins (fonte do site oficial). Falas: 600, marrom, 54 px (h) / 64 px (v).
         Gesto: 300 itálico tinta `#1F1F1F`, "mudança" e "gesto" em 800 itálico, 58 px (h) / 66 px (v).
         Crédito: 400, 26 px (h) / 30 px (v). Logo: "INSTITUTO" 300 com tracking largo, "semear" 700.
OBJECTS: a logo do Semear **vetorizada do post de anúncio da identidade (P56-01)**, separada em
         17 pessoinhas (corpo + cabeça) e mãos-tronco + chão. A estampa é **vetorizada do post P56-04**,
         célula por célula. Nada desses desenhos é inventado.
MOTION:  chegada `expo.out`/`power4.out` · câmera `power2.inOut` · voo das pessoas `power3.inOut`
         · rebobinar `power3.in` · acender: `back.out(2)` em escala 0,85→1 (0,5 s), cor em 0,25 s
         · palavras: blur 6→0 + opacidade em 0,13 s, no tempo da voz · saída de legenda 0,15 s.
SHOTS:
  0–90     Gancho: logo inteira (0–12f) → rebobina (12–33f) até uma semente que cai e pousa em 33f. Voz fem. + frase.
  90–210   Acende: câmera empurra (1,7×), anel da semente, linha até A, A ganha cor em 135f.
  210–345  Caminhos: câmera 1,3×; linhas A→B, A→C, B–C; B e C acendem; estampa em contorno nos cantos.
  345–495  Rede: câmera volta a 1×; 14 pessoas acendem em ondas a partir de A; linhas entre vizinhas; estampa preenche.
  495–630  Árvore: linhas e estampa saem; as 17 voam pra copa (cada uma no seu tempo); mãos sobem do chão.
  630–720  Pouso: a árvore encolhe até a assinatura; "INSTITUTO semear" entra palavra por palavra.
  720–810  Marca parada. Nada se mexe.
BANNED:  fundo escuro; brilho, partículas, glow; gradientes; tudo entrando por fade + slide-up;
         título que se mexe depois de pousar; logo no canto; respiração/flutuação em loop;
         redesenhar a logo à mão; inventar estampa.
QA:      f0 (logo inteira legível, é a miniatura) · f33 (semente pousada) · f150 (A colorida, frase lida)
         · f330 (rede de 3 + estampa contorno) · f450 (rede cheia) · f600 (árvore = logo) · f780 (assinatura parada, sem nada além dela)
