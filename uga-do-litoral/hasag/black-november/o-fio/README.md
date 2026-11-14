# HASAG · Black November · O FIO

Comercial vertical de 36 s (1080 x 1920, 30 qps, 1080 quadros), feito só em JavaScript:
imagem em Canvas 2D desenhada em código, trilha e efeitos sintetizados em Node. Sem Remotion,
sem HyperFrames, sem biblioteca de animação. O roteiro aprovado está em `roteiro.md`.
Não substitui a v1 (`../filme/`): é outro filme.

## Ver

Abrir `index.html` no Chrome (dois cliques). Tem tocar/pausar, barra de quadros e o áudio junto.
Espaço toca e pausa; setas andam um quadro (com Shift, um segundo).

## Gerar de novo

```
npm install                      # só o playwright-core, pra dirigir o Chrome sem janela
node audio/gerar-trilha.mjs      # escreve audio/trilha.wav (48 kHz estéreo) e mede o loudness
node render/render.mjs           # quadros em render/quadros/ -> ../entregas/hasag-black-november-o-fio.mp4
node render/render.mjs --prancha # ../entregas/o-fio-prancha.png (24 quadros, um a cada 1,5 s)
```

Precisa de Node, ffmpeg no PATH e Chrome instalado (caminho em `CHROME`, se não for o padrão do Windows).
Os quadros temporários são apagados quando o MP4 fica pronto (`--manter` guarda).

Pra olhar quadros soltos sem renderizar tudo:

```
node render/render.mjs --quadros 420,822,1060            # PNG cheio em render/revisao/
node render/render.mjs --folha 0,60,119 --nome p1        # folha de contato
node render/render.mjs --teste personagem                # folha de modelo (src/zz-testes.js)
```

## Onde está cada coisa

- `src/filme.js` · a linha do tempo. `OFIO.renderFrame(ctx, quadro)` é pura: o mesmo quadro sai
  sempre igual (o acaso tem semente). Aqui ficam a ordem dos planos, as passagens e o acabamento.
- `src/plano-NN.js` · um arquivo por plano do roteiro (4, 5 e 6 dividem `plano-04-06.js`).
- `src/00-base.js` · paleta, easing, acaso com semente, grão e vinheta.
- `src/01-simbolo*.js` · o símbolo HSG. A estrutura é gerada de `../../marca/hasag-simbolo.svg`
  e entra como está; o eclipse do miolo são dois círculos com as medidas do guia da marca.
- `src/02-pecas.js` · pérola, rondela, bola de strass, cruzes, corrente, fecho, a G1 e o 1K2Q.
- `src/03-personagem.js` · o andarilho (lado, costas, busto), as sombras, as mãos.
- `src/04-cenario.js` · céu, sol, cidade, rua em perspectiva, poeira, a sacola.
- `audio/gerar-trilha.mjs` · trap a 150 BPM (1 tempo = 12 quadros), 808 com glide, e os efeitos
  do roteiro, tudo sintetizado. Normaliza perto de -14 LUFS medindo com o ffmpeg.
- `fontes/` · Jost (Google Fonts, licença OFL), a provisória do guia da marca.

## Conferido nas fotos da loja

- G1: 15 pérolas e 4 rondelas, ordem 3-R-3-R-3-R-3-R-3, corrente extensora e fecho lagosta.
- 1K2Q: corridas de 4 pérolas separadas por bolas de strass; três cruzes, a do meio maior e mais baixa.

Texto da tela final: só a oferta confirmada pelo Pedro em 2026-11-10. Sem preço, sem prazo.
