# Status de produção · Comercial Uga do Litoral

- **Fase atual:** v1 renderizada (2026-11-04). **Aguardando o Pedro assistir.**
- **Roteiro:** v2.2 aprovado (2026-11-04).
- **Skills:** `apple-motion` (tempo, molas, bed, master, checagem) + `remotion-best-practices`.
- **Frente:** Uga do Litoral, Reels/Stories. Fecho: AGENDA ABERTA em vermelho + @uga_do_litoral.

## Entregas
- `comercial-uga-30s.mp4`: 1080 × 1920, 30 fps, 900 frames, −17,4 LUFS / −2,1 dBTP.
- `comercial-uga-15s.mp4`: 1080 × 1920, 30 fps, 450 frames, −17,4 LUFS / −2,6 dBTP.
- `check_render.py`: ritmo, duração de plano e loudness dentro do p10..p90 da Apple nas duas.
  Preto puro acima da média da Apple (30% e 22%): vem dos cartões e do fecho, é a marca.

## Como refazer
```
cd video
npm install
python -I scripts/prep.py                      # fotos leves + mapas de profundidade (Depth Anything V2, ONNX)
python -I ~/.claude/skills/apple-motion/scripts/synth_audio.py public/audio30 --bpm 120 --bars 13
python -I ~/.claude/skills/apple-motion/scripts/synth_audio.py public/audio15 --bpm 144 --bars 8
npx remotion render Comercial30 out/comercial-30s-raw.mp4
npx remotion render Comercial15 out/comercial-15s-raw.mp4
bash ~/.claude/skills/apple-motion/scripts/master.sh out/comercial-30s-raw.mp4 ../comercial-uga-30s.mp4
bash ~/.claude/skills/apple-motion/scripts/master.sh out/comercial-15s-raw.mp4 ../comercial-uga-15s.mp4
```
Modelo de profundidade: `~/.cache/depth-anything/model.onnx` (onnx-community/depth-anything-v2-small).
Fotos originais em `video/public/fotos/` (fora do git). Os planos moram em `video/src/plans.ts`.

## Efeitos
- Letras embaralhadas (`Scramble.tsx`, mesmo algoritmo do `intro.js` do portfólio).
- Profundidade 2.5D (`DepthPhoto.tsx`, shader WebGL sobre o mapa de profundidade).
- Vazamento de luz vermelho (`LightLeak.tsx`, mistura normal com núcleo quente: em "screen" sumia nas fotos vermelhas).
- Parede do acervo (`Wall.tsx`, 12 × 10 células com as 80 fotos, pra borda nunca aparecer).
- Recusados pelo Pedro: flash de câmera, obturador, foto dentro da letra, tiras, chicote com borrão, galeria motion-prompt.

## Pendências
- Pedro assistir e pedir ajustes.
- O guia de marca diz Barlow Condensed; o site usa Arial/Helvetica bold. Corrigir no `/atualizar`.
- Registrar em integrações: o conector do Drive baixa até 10 MB (salva em arquivo, decodifica com Python).
