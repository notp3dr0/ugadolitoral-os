# Estúdio de motion

Kit de 20 repositórios open-source (lista do post de @e1genqq no X, baixada em 2026-11-02) pra produzir motion, 3D, som e vídeo. Cada um foi clonado raso (`--depth 1`) em `repos/`. A pasta `repos/` não sobe pro GitHub: é código de terceiros e pesa ~3 GB. Só este índice sobe.

Fluxo: conceito → cena → motion → som → corte final.

| # | pasta em `repos/` | pra quê | etapa |
|---|---|---|---|
| 01 | 01-remotion | vídeo programado em React (o motor) | motion |
| 02 | 02-remotion-skills | skills oficiais do Remotion pra agente (únicas que são skill de verdade) | motion |
| 03 | 03-anime | coreografia de timeline | motion |
| 04 | 04-motion | animação de UI e layout | motion |
| 05 | 05-manim | diagramas e equações animados | motion |
| 06 | 06-lottie-web | animação vetorial leve | motion |
| 07 | 07-blender-mcp | Claude controla o Blender (cenas 3D) | cena |
| 08 | 08-three | cenas 3D e câmera | cena |
| 09 | 09-three-gpu-pathtracer | luz e reflexo realistas | cena |
| 10 | 10-jolt-physics | colisão e física | cena |
| 11 | 11-postprocessing | bloom, profundidade de campo, cor | cena |
| 12 | 12-three-quarks | partículas e VFX | cena |
| 13 | 13-tweakpane | controles ao vivo dos parâmetros | cena |
| 14 | 14-comfyui | geração de imagem/vídeo por nós | cena |
| 15 | 15-cosyvoice | narração em voz | som |
| 16 | 16-librosa | detecção de batida (sync com música) | som |
| 17 | 17-whisperx | legenda palavra por palavra | som |
| 18 | 18-obs-studio | captura de tela | corte |
| 19 | 19-lossless-cut | cortes sem reencodar | corte |
| 20 | 20-ffmpeg | encode e entrega final | corte |

Notas:
- O post chamava o 07 de `mcp-for-blender` e o 15 de `QwenAudio/CosyVoice`; os links redirecionam pra `ahujasid/blender-mcp` e `FunAudioLLM/CosyVoice`.
- Nada foi instalado nem executado. Só baixado. Instalar dependência (npm, pip) é um passo à parte, quando o roteiro disser o que vamos usar de fato.
- O primeiro uso é o filme institucional do Semear, que mora em `pao/instituto-semear/filme-institucional/`.

## Plugin Edit Labs AI (2026-11-03)

`repos/edit-labs-ai/` (github.com/paullabs/edit-labs-ai) é um plugin do Claude Code, não uma lib: 9 skills de edição de vídeo vertical (cortes de podcast, colagem em camadas, curiosidade histórica, explicador Vox, documentário de arquivo, decupagem, time de motion), 11 agentes e um motor de colagem. Instalado com escopo `local` neste projeto (marketplace apontando pra essa pasta). Skills chamam por `/edit-labs-ai:edit-labs-ai`. Exige o conector Higgsfield. Os scripts `bin/` são feitos pra macOS/bash (brew); no Windows ainda não foram testados.

## 15 estilos de motion design (2026-11-04)

`repos/21-mg-styles-15/` (github.com/Vincentwei1021/mg-styles-15, licença MIT) traz 15 estilos de motion, um filme de 10 s por estilo, cada um com o prompt completo e o código-fonte. Tudo é código (SVG, Canvas, WebGL, Three.js; Blender só no 3D), inclusive o som (`audio.py` sintetiza música e efeitos). Clonado raso, ~1,2 GB, fora do git.

Como usar: abrir `prompts/<estilo>.md`, trocar só o `Creative seed` (história, marca, texto, cores) pelo nosso, manter o `Signature features` (é o que faz o estilo ser reconhecível) e mandar pro agente. Vertical 1080×1920 é só mudar o `Output`. O renderizador (`harness/render.mjs`) captura cada quadro no Chrome e o ffmpeg junta com o áudio.

| # | estilo | prompt | fonte |
|---|---|---|---|
| 01 | Frame-by-frame / line boil (desenho "tremido") | 05-cel-boil | demos/05-cel-boil |
| 02 | Isométrico 2.5D | 03-isometric | demos/03-isometric |
| 03 | Flat vector | 01-flat-vector | demos/01-flat-vector |
| 04 | Line art (traço contínuo) | 02-line-art | demos/02-line-art |
| 05 | Render 3D (look C4D/Blender) | 04-3d-render | demos/04-3d-render |
| 06 | Shape morph | 08-morph | demos/08-morph |
| 07 | Sticker explainer | 19-paperclip | demos/19-paperclip |
| 08 | HUD cyberpunk / FUI | 22-hud | demos/22-hud |
| 09 | Colagem / recorte | 06-collage | demos/06-collage |
| 10 | Aurora e glassmorphism | 12-aurora-glass | demos/12-aurora-glass |
| 11 | Bauhaus geométrico | 09-bauhaus | demos/09-bauhaus |
| 12 | Synthwave / VHS anos 80 | 10-synthwave | demos/10-synthwave |
| 13 | Pixel art | 20-pixel | demos/20-pixel |
| 14 | Liquid motion | 07-liquid | demos/07-liquid |
| 15 | Legendas de variety show (9:16) | 18-hanazi | demos/18-hanazi |

Pra rodar um demo: Node 22.12+, Chrome (no Windows, `MG_CHROME=<caminho>`), ffmpeg e Python 3.11+. Depois `npm install`, `pip install -r requirements.txt`, `python demos/<x>/audio.py` e `node harness/render.mjs demos/<x>`. Nada disso foi instalado ainda; as fontes não vêm no repo (lista em `assets/fonts/README.md`). Os scripts são pensados pra macOS, então no Windows pode precisar de ajuste.
