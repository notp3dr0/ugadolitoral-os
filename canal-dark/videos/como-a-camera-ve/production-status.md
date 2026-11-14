# Status de produção · Como a câmera transforma luz em foto?

- **Fase:** 2. Concluído com voz provisória; falta trocar pela voz do Pedro.
- **Roteiro:** v1, de 2026-11-03, aprovado pelo Pedro em 2026-11-03 ("renderize, aprovo o vídeo").
- **Entrega:** `entregas/como-a-camera-ve-v1-voz-provisoria.mp4`.
  - Formato: H.264 + AAC, 1080×1920, 30 fps, 1710 frames, 57,0 s.
  - Áudio: −14,0 LUFS, pico −1,5 dBFS.
- **Voz atual:** edge-tts `pt-BR-AntonioNeural` (+6%), provisória. O VoiceStudio não abriu nesta
  máquina em 2026-11-03: o executável fechava sozinho e a porta 3900 recusava conexão.

## Trocar pela voz do Pedro (VoiceStudio aberto)
```
python scripts/voz_voicestudio.py
python scripts/prepare_vo.py
python scripts/music.py
npx remotion render src/index.ts ComoACameraVe out/como-a-camera-ve-raw.mp4 --gl=angle --concurrency=4 --crf=17
python scripts/loudnorm.py out/como-a-camera-ve-raw.mp4 entregas/como-a-camera-ve-v1.mp4
```
- Os cortes, a legenda e a trilha se derivam da voz nova sozinhos.
- Se a fala total mudar muito, ajuste `SECONDS` em `src/utils/timing.ts`. A conta é: fim da última
  fala + ~2 s.
- Se o script avisar que a contagem de palavras não bate, confira os índices `W()` em
  `src/data/scenes.ts`.

## Ajustes técnicos em relação ao roteiro aprovado (o conteúdo não mudou)
- A duração caiu de 64 s pra 57 s, porque os cortes passaram a ser derivados da voz real (50,6 s de
  fala).
- Na s2, o badge SEM IMAGEM e o card entram em "mancha" (índice 14), não em "sensor". A fala tem uma
  palavra a mais do que eu tinha contado.
- O obturador ganhou duas coisas: um abre-e-fecha rápido no "congela" e a reabertura no começo da
  s7, pra o sensor aparecer durante o ISO.
- O triângulo final foi desenhado em 2D em vez de 3D, pra ficar legível.
- As poses de câmera foram reenquadradas depois da revisão dos stills.

## Verificações feitas
- `tsc` limpo.
- Duas rodadas de stills (`out/sheet.png`, `out/sheet2.png`).
- `ffprobe`, `audiocheck` e `loudnorm`.
- Três quadros extraídos do MP4 final.

## O que não foi verificado
- Não houve audição: o agente não ouve áudio.
- A pronúncia de "ISO" na voz final ainda não foi conferida.
