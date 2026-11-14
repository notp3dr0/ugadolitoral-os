# Roteiro · Comercial Uga do Litoral (v2)

> Origem: escrito pelo agente a partir do pedido do Pedro (2026-11-04).
> Skill: `apple-motion` (régua de tempo e molas) com a identidade do portfólio.
> Status: **aprovado (v2.2, 2026-11-04)**. Em implementação.
>
> **v2 (2026-11-04), pedidos do Pedro:** fotos trocadas pelas 10 que ele marcou com estrela no Drive;
> sai o contador 80; sai o cartão final com o nome; o vídeo termina em AGENDA ABERTA em vermelho com
> @uga_do_litoral embaixo; texto sempre entrando com letras embaralhadas (o efeito da página inicial);
> efeitos: profundidade 2.5D nas fotos e vazamento de luz vermelho nas trocas.
> **v2.1 (2026-11-04):** entram as 3 fotos que faltavam (rosa, inflável claro, inflável escuro); Brandão
> e as silhuetas trocam de lugar (planos 3 e 10); o plano 14 vira a parede gigante com as 80 fotos do
> acervo, pra mostrar o tamanho do portfólio (sem número na tela).
> **v2.2 (2026-11-04):** inflável escuro no plano 7, inflável claro no 12, rosa no 13 (última foto). Aprovado pelo Pedro.
> Recusados por ele, não usar: flash de câmera, obturador, foto dentro da letra, tiras, chicote com borrão,
> efeitos da galeria motion-prompt.

## 1. Ideia

**Linha central:** "O show acaba. A foto fica."
Da Apple vem o acabamento: corte no beat, mola leve, uma frase curta por vez, o golpe da trilha caindo
no fecho. Do Uga vem a cara: preto, P&B e luz de palco, vermelho, lettering do site. Em cima disso, três
efeitos que se repetem e viram a assinatura do vídeo:

| efeito | como é | onde |
|---|---|---|
| **Letras embaralhadas** | cada letra sorteia caracteres e trava na certa, da esquerda pra direita, como "FOTOGRAFIA · VÍDEO · EDIÇÃO" na entrada do site. Trava em ~8 frames por palavra | todo texto, inclusive as etiquetas pequenas |
| **Profundidade 2.5D** | a foto ganha mapa de profundidade e a câmera anda dentro dela: o artista descola do fundo, a luz de palco passa por trás. Movimento lento, contínuo, nunca parado | toda foto |
| **Vazamento de luz vermelho** | uma mancha de luz de palco vermelha (`#fa1717` puxando pro laranja) atravessa a tela por ~10 frames e esconde a troca de uma foto pra outra | 3 trocas no 30 s, 2 no 15 s, sempre num tempo forte da trilha |

O resto das trocas é corte seco no beat. É o contraste que faz o vazamento pesar quando aparece.

## 2. Identidade (do CSS do portfólio, 2026-11-04)

| peça | regra |
|---|---|
| Frases | Arial (Helvetica) Bold 700, espaçamento −0.06em, 1 linha, off-white `#f2f0eb` no preto, preto no off-white |
| AGENDA ABERTA | mesma família, caixa-alta, vermelho `#fa1717`, grande |
| @uga_do_litoral | Arial 400, pequeno, off-white, centralizado embaixo |
| Etiqueta | monoespaçada caixa-alta, cinza `#c0c0c0` (preta sobre foto clara): nome do artista, como o `media-label` do acervo |
| Fundo | preto `#000`; cartão claro em off-white `#f2f0eb` |
| Textura | grão fino de filme por cima de tudo |
| Proibido | gradiente, fonte, logo ou interface da Apple; caixa atrás de texto; sombra; contorno |

## 3. Fotos (as 10 com estrela no Drive)

| código | arquivo | o que é | resolução | situação |
|---|---|---|---|---|
| P | IMG_3761 | público com a luz dourada do palco, artista ao fundo | 4095×6144 | ok |
| S | IMG_0909 | três silhuetas contra o branco, cabeças do público embaixo | 3167×4750 | ok |
| A | ALEE | salto sob luz vermelha | 1025×1534 | ok |
| B | BRANDÃO | P&B estourado, microfone, óculos | 1024×1536 | ok |
| D | DEREK | P&B, microfone, cordão | 1440×1919 | ok |
| K | KAYBLACK3 | sentado no sofá, cenário vermelho e dourado | 1600×2400 | ok |
| H | PHL | retrato, mãos juntas no rosto, óculos | 1365×2048 | ok |
| R | rosa (IMG_0180) | artista curvado sobre o público, fumaça rosa, celular em primeiro plano | 3847×5771 | ok |
| C | inflável claro | P&B estourado, artista curvado sob a escultura inflável | 4096×6144 | ok |
| E | inflável escuro | P&B, braço aberto, microfone cromado, inflável atrás | 4095×6144 | ok |
| W | parede do acervo | as 80 fotos do portfólio numa parede só, maior que a tela | 80 × 640 px | ok |

## 4. Versão 30 s

120 BPM · 1 beat = 15 frames = 0,5 s · bed de 13 compassos (`synth_audio.py --bpm 120 --bars 13`).
Seções: intro 0–8, build 8–16, main 16–36, break 36–44 (bateria sai), final 44–52,
**golpe no beat 52 (26,0 s)**. Fecho de 6 beats + 30 frames de cauda = **900 frames = 30,0 s**.

| # | beats | tempo (s) | o que se vê | texto | efeito / câmera | entra com |
|---|---|---|---|---|---|---|
| 1 | 0–8 | 0,0–4,0 | P · público e luz dourada | etiqueta embaralha no beat 2 | 2.5D: câmera avança devagar por cima das cabeças, a luz passa por trás | abre na foto |
| 2 | 8–10 | 4,0–5,0 | preto | **O show acaba.** | letras embaralhadas | corte |
| 3 | 10–13 | 5,0–6,5 | B · Brandão P&B | etiqueta `BRANDÃO` | 2.5D: avança lento, cabelo descola do fundo | corte |
| 4 | 13–16 | 6,5–8,0 | off-white | **A foto fica.** (preto) | letras embaralhadas | corte |
| 5 | 16–19 | 8,0–9,5 | A · ALEE no vermelho | etiqueta `ALEE` | 2.5D: avança no salto | **vazamento vermelho** no drop |
| 6 | 19–21 | 9,5–10,5 | D · Derek P&B | — | 2.5D: sobe | corte |
| 7 | 21–23 | 10,5–11,5 | E · inflável escuro, braço aberto | — | 2.5D: o artista descola do inflável | corte |
| 8 | 23–25 | 11,5–12,5 | K · Kayblack no sofá vermelho | — | 2.5D: recua, revela o cenário | **vazamento vermelho** |
| 9 | 25–31 | 12,5–15,5 | preto | **FOTOGRAFIA.** → **VÍDEO.** → **EDIÇÃO.** (no mesmo lugar, 2 beats cada) | cada palavra embaralha a anterior até virar a nova | corte |
| 10 | 31–36 | 15,5–18,0 | S · três silhuetas no branco | — | 2.5D: deslize lateral, silhuetas descolam do público | corte |
| 11 | 36–40 | 18,0–20,0 | H · PHL, retrato | — | 2.5D quase parado, respiro do break | corte |
| 12 | 40–44 | 20,0–22,0 | C · inflável claro | — | 2.5D: avança | **vazamento vermelho** no riser |
| 13 | 44–46 | 22,0–23,0 | R · rosa, sobre o público (última foto) | — | 2.5D: o celular em primeiro plano descola, a fumaça passa por trás | corte |
| 14 | 46–50 | 23,0–25,0 | W · parede gigante com as 80 fotos do acervo | etiqueta `ACERVO` | começa com uma foto enchendo a tela e a câmera recua rápido (mola), a parede se abre até mostrar dezenas de fotos, maior que a tela; segue recuando até o corte | corte no beat |
| 15 | 50–52 | 25,0–26,0 | preto | letras de AGENDA ABERTA sorteando sem parar | embaralhado | corte |
| 16 | 52–58 + cauda | 26,0–30,0 | preto | **AGENDA ABERTA** trava em vermelho **no golpe**; **@uga_do_litoral** embaralha embaixo 2 beats depois | segura até o fim | golpe da trilha |

Texto: 5 momentos. Vazamento: 3. 2.5D: todas as 13 aparições de foto.

## 5. Versão 15 s

144 BPM · 1 beat = 12,5 frames = 0,417 s · bed de 8 compassos (`--bpm 144 --bars 8`, o mínimo).
Seções: intro 0–8, build 8–16, break 16–24, final 24–32, **golpe no beat 32 (13,3 s)**.
Fecho de 4 beats, cauda 0 = **450 frames = 15,0 s**. 144 BPM fica acima do ritmo mais rápido medido
nos vídeos da Apple (131); é o que faz caber.

| # | beats | tempo (s) | o que se vê | texto | efeito | entra com |
|---|---|---|---|---|---|---|
| 1 | 0–6 | 0,0–2,5 | P · público e luz dourada | — | 2.5D avançando | abre na foto |
| 2 | 6–8 | 2,5–3,3 | preto | **O show acaba.** | embaralhado | corte |
| 3 | 8–10 | 3,3–4,2 | B · Brandão | — | 2.5D | corte |
| 4 | 10–12 | 4,2–5,0 | off-white | **A foto fica.** | embaralhado | corte |
| 5 | 12–14 | 5,0–5,8 | A · ALEE no vermelho | — | 2.5D | **vazamento vermelho** |
| 6 | 14–16 | 5,8–6,7 | S · três silhuetas | — | 2.5D lateral | corte |
| 7 | 16–24 | 6,7–10,0 | H · PHL escurecido, 2.5D lento | **FOTOGRAFIA.** → **VÍDEO.** → **EDIÇÃO.** por cima | embaralhado | corte |
| 8 | 24–26 | 10,0–10,8 | K · Kayblack | — | 2.5D | **vazamento vermelho** |
| 9 | 26–28 | 10,8–11,7 | E · inflável escuro | — | 2.5D | corte |
| 10 | 28–30 | 11,7–12,5 | W · parede gigante do acervo | — | câmera recua rápido de uma foto até a parede inteira | corte |
| 11 | 30–32 | 12,5–13,3 | preto | AGENDA ABERTA sorteando | embaralhado | corte |
| 12 | 32–36 | 13,3–15,0 | preto | **AGENDA ABERTA** trava em vermelho no golpe; @uga_do_litoral embaixo | — | golpe |

## 6. Como cada efeito é feito

- **2.5D:** mapa de profundidade de cada foto gerado com o DepthFlow (código aberto, roda na GTX 1660
  Super) ou um mapa feito no próprio Remotion com shader. Câmera em velocidade de Apple (avanço ~4,5%
  da tela por segundo, deslize ~2,6%), mais lenta nos retratos.
- **Vazamento vermelho:** camada de luz em modo de mistura "tela" (screen), gerada em código, entra
  4 frames antes do corte e sai 6 depois. Sem arquivo de terceiros.
- **Letras embaralhadas:** mesmo princípio do `intro.js` do site (cada letra sorteia até travar),
  calculado por frame pra ficar idêntico em todo render.
- **Som:** bed CC0 gerado pela skill; um sopro baixo em cada vazamento; master em −17,4 LUFS / −2 dBTP.

## 7. Critérios de aceite

- 1080 × 1920, 30 fps, H.264; 30 s = 900 frames, 15 s = 450 frames.
- Todo plano começa no beat; AGENDA ABERTA trava exatamente no golpe da trilha.
- Nenhuma foto parada: todas com movimento 2.5D, sem rasgo visível nas bordas do recorte.
- Texto sem travessão; nada de fonte, logo ou gradiente da Apple.
- Nenhum dos efeitos recusados.
