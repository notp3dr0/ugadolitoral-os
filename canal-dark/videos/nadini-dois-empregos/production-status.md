# Status de produção · Nadini e os dois empregos

- **Fase:** 2, CONCLUÍDO em 2026-11-03.
- **Entrega:** `entregas/nadini-dois-empregos.mp4` (~51 MB).
  - Medido: 1080×1920, 30 fps, 1898 frames, 63,27 s, H.264 + AAC.
  - Áudio: −14,0 LUFS integrado, pico −1,5 dBFS (conferido com ffmpeg `ebur128`).
- **Versão aprovada:** roteiro v1 ("aceito demais esse roteiro", 2026-11-03) com o final trocado pelo loop infinito
  (v2: cenas 8 e 9), escolhido pelo Pedro, que mandou começar na mesma sessão. O roteiro v1 e o `scene-plan.ts` ficam
  como referência; a versão produzida está em `src/data/scenes.ts`.
- **Mudanças pedidas durante a produção:**
  - A Nadini é uma mulher japonesa de cabelo longo cinza-escuro: pele clara, olhos amendoados, batom, cabelo até a
    cintura com mechas na frente dos ombros e franja.
  - O céu é azul de dia, com nuvens que andam devagar e emendam no loop (antes era estúdio escuro da marca).
  - A mensagem terminava com a palavra "Cicatriz", que não entendi e não usei para nada.
- **Verificações feitas:**
  - `tsc --noEmit` sem erros.
  - O ESLint não rodou (o scaffold não traz `eslint.config`).
  - Quatro rodadas de stills com folha de contato, uma por correção (rostos sumidos, vitrine da padaria, enquadramento
    da cena 8, cabelo e céu).
  - Quadros extraídos do MP4 final: o último e o primeiro (emenda do loop) batem.
  - Pico e RMS por segundo, e loudness integrado depois da normalização.
- **O que NÃO foi verificado:** o agente não ouve áudio. A mixagem foi medida, não escutada. A dicção da voz do Gemini
  precisa ser ouvida pelo Pedro. A transcrição automática ouviu "Nadine" (falas 1 e 8) e "Bipo" (fala 3) onde o
  texto diz "Nadini" e "Bipou". Pode ser erro do transcritor ou pronúncia da voz: só escutando se sabe. Se a voz
  falar "Nadine", regere a fala escrevendo "Nádini" ou "Nadíni" em `scripts/narration.json`.
- **Voz:** Gemini TTS, voz pré-definida Charon, texto puro (sem instrução de estilo: este modelo lê a instrução em voz
  alta). Alterna entre modelos para fugir do limite do plano grátis: gemini-3.8-flash-tts, gemini-3.8-flash-lite-tts e
  gemini-3.1-flash-tts-preview (qual falou o quê está em `scripts/out/vo-models.json`). Sem custo. Os tempos por palavra
  vêm do Parakeet local (`scripts/align_words.py`), alinhados ao texto aprovado.
- **Ajustes técnicos (sem mudar o conteúdo aprovado):**
  - Duração: 60 s planejados viraram 63,27 s. São 57,3 s de fala mais as pausas e ~1,15 s de rebobinar no fim.
  - Cortes derivados da voz real.
  - O ponteiro do relógio sobe de 8h até 14h na cena 2.
  - Fala 3: `Bipou.` ficou como no roteiro; o cronômetro da catapulta mostra "x,xx s".
- **Pendências:**
  - Ouvir a voz e regerar só a fala que soar estranha: `node scripts/voiceover_gemini.mjs sN`, depois
    `python scripts/align_words.py`, `python scripts/prepare_vo.py` e `python scripts/music.py`.
  - Trocar a narração pela voz do Pedro no VoiceStudio, se quiser (o app está instalado, mas sem modelo baixado).
  - Confirmar se Nadini e Aline são pessoas reais e se topam aparecer.
  - Trocar a chave do Gemini (ficou exposta em 2026-11-02).
  - Nome e identidade do canal seguem provisórios.
- **Projeto:** nesta pasta (Remotion + R3F, composição `NadiniDoisEmpregos`).
  - Dados: `src/data/scenes.ts`.
  - Mundo 3D: `src/world/` (maquete em `Town.tsx`, elenco em `Characters.tsx` e `Person.tsx`).
  - Camadas 2D: `src/scenes/Overlays.tsx`.
  - Áudio: voz em `public/audio/vo/`, 28 efeitos em `scripts/sfx.py`, trilha em `scripts/music.py` (em loop, sem fade).
- **Para renderizar de novo:**
  `npx remotion render src/index.ts NadiniDoisEmpregos out/nadini-raw.mp4 --gl=angle --concurrency=4 --crf=17` e depois
  `python scripts/loudnorm.py out/nadini-raw.mp4 entregas/nadini-dois-empregos.mp4`.
