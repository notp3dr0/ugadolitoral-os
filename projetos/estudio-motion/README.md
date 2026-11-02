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
