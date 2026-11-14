# Status de produção · Como a raquete de mosquito funciona?

- **Fase:** 2, CONCLUÍDO em 2026-11-03.
- **Entrega:** `entregas/raquete-mosquito.mp4` (~103 MB).
  - Medido: 1080×1920, 30 fps, 2730 frames, 91,0 s, H.264 + AAC.
  - Áudio: −14,0 LUFS integrado, pico real −1,5 dBTP.
- **Verificações feitas:**
  - `tsc` sem erros.
  - Duas rodadas de stills com folha de contato.
  - Teste de render contínuo.
  - Quadros extraídos do MP4 final.
  - Pico e RMS por segundo.
  - O agente não ouve o áudio: a mixagem foi medida, não escutada.
- **Corrigido na revisão:**
  - O flash do estalo vazava desde o frame 0.
  - A foto do João saía preta.
  - O cabo saía opaco no render contínuo (o material não recompilava).
  - O enquadramento do final cortava a raquete.
  - Rosto do João trocado de foto por avatar a pedido do Pedro (2026-11-03), com re-render completo.
- **Aprovação:** em 2026-11-03 o Pedro aprovou o roteiro v1 ("faça") com uma mudança: o personagem passa
  a ser o João Gabriel.
- **Mudança aplicada (v1.1):**
  - O dorminhoco é o João Gabriel, como avatar low-poly (cabeça, cabelo, óculos, olhos que abrem e
    fecham, bochecha vermelha no tapa). Sem foto: só o nome dele aparece, no rótulo e na fala.
  - A narração passou a falar dele: "Zumbido no ouvido do João Gabriel", "Então o João precisa…",
    "volta pro ouvido do João", "E se for o dedo do João?", "O João dorme." O texto final está em
    `scripts/narration.json`.
  - Conteúdo técnico, ordem das cenas e badges continuam os aprovados.
- **Ajustes técnicos (sem mudar conteúdo):**
  - **Voz:** o VoiceStudio não abriu (o processo fecha logo ao iniciar e a API 127.0.0.1:3900 não sobe).
    Usei a alternativa gratuita prevista no roteiro: edge-tts `pt-BR-AntonioNeural`, com velocidade +18%.
  - **Duração:** subiu de 90 s para 91 s (2730 frames). São 82,1 s de fala, mais as pausas e ~2,8 s de
    respiro pro gag final.
  - **Cortes:** derivados da voz real, nos frames 0, 254, 450, 643, 896, 1162, 1387, 1659, 1914, 2192 e
    2433.
  - **Badge renomeado:** "MULTIPLICADOR DE TENSÃO" virou "MULTIPLICADOR", com o subtítulo "milhares de
    volts", pra caber.
  - **Peças internas:** subiram no cabo pra não ficar atrás da legenda.
  - **Balança e voltímetro:** viraram cartões 2D. O "3D" é a balança, que mostra 0,002 g; um mosquito
    pesa ~2 mg.
- **Pasta:** `canal-dark/videos/raquete-mosquito/` (movida de `uga-do-litoral/instagram/reels/` em 2026-11-03).
- **Projeto:** nesta pasta.
  - Remotion + R3F, composição `RaqueteMosquito`.
  - Dados das cenas em `src/data/scenes.ts`.
  - Mundo 3D em `src/world/`.
  - Camadas 2D em `src/scenes/Overlays.tsx`.
- **Áudio:** voz em `public/audio/vo/`, 28 efeitos sintetizados (`scripts/sfx.py`) e trilha própria
  (`scripts/music.py`).
- **Para renderizar de novo:**
  `npx remotion render src/index.ts RaqueteMosquito out/raquete-mosquito-raw.mp4 --gl=angle --concurrency=4 --crf=17`
  e depois `python scripts/loudnorm.py out/raquete-mosquito-raw.mp4 entregas/raquete-mosquito.mp4`.
- **Para trocar a voz pelo VoiceStudio:** abrir o app, gerar `public/audio/vo/sN.mp3` com o perfil
  "joao gabriel", recriar os tempos por palavra e rodar `python scripts/prepare_vo.py`.
