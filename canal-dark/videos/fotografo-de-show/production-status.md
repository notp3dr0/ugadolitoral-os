# Status de produção · Como funciona a carreira de fotógrafo de show?

- **Fase atual:** **CONCLUÍDO** (2026-11-04). MP4 em `video/out/fotografo-de-show.mp4`.
- **Medido:** 1080×1920, 30 fps, 2700 quadros, 90,0 s, H.264 + AAC 48 kHz estéreo, 99 MB. Loudness −14,1 LUFS
  (normalizado de −16,3, alvo −14 / −1,5 dBTP), LRA 2,5. Quadros extraídos do MP4 conferidos com os stills.
- **Não verificado:** o agente não ouve áudio (sotaque da voz, mixagem e trilha precisam do ouvido do Pedro).
- **Renderizar de novo:** em `video/`: `npx remotion render src/index.ts FotografoDeShow out/fotografo-de-show-raw.mp4 --gl=angle --concurrency=4 --crf=17` e depois `python scripts/loudnorm.py out/fotografo-de-show-raw.mp4 out/fotografo-de-show.mp4`.
- **Frente:** Canal Dark (decidido pelo Pedro em 2026-11-04; antes estava em `uga-do-litoral/instagram/reels/`). Sem uso comercial, segundo o Pedro.
- **Versão do roteiro:** v1 (2026-11-04), aprovada pelo Pedro em 2026-11-04 ("o roteiro eu adorei, vamos começar
  a produzir"), com duas mudanças pedidas por ele: tudo ambientado em **São Paulo** e **voz e efeitos pelo
  ElevenLabs**. Pediu os quadros antes do render final.
- **Skill:** `remotion-problem-resolve-video`.

## Arquivos
- `roteiro.md`, `scene-plan.ts`: planejamento aprovado (referência da v1).
- `video/`: projeto Remotion (composição `FotografoDeShow`, 2700 frames). `video/src/data/scenes.ts` é o plano vivo.
- `revisao/`: folhas por cena (`cena-01.png` … `cena-12.png`) e `index.html` com os 60 quadros.

## O que já existe (gerado e conferido)
- Narração ElevenLabs, voz padrão **Eric** (`cjVigY5qzO86Huf0OWal`), modelo `eleven_v4`, pt, velocidade 1,08:
  12 falas, 81,3 s medidos (`video/public/audio/vo/`). Cortes das cenas derivados da voz real.
- 36 efeitos ElevenLabs (`video/scripts/sfx_eleven.py` → `video/public/audio/sfx/`).
- Trilha boom bap sintetizada em código, 88 BPM (`video/scripts/music_boombap.py` → `public/audio/music.wav`).
- Mundo 3D de São Paulo: quarteirão (padaria, telemarketing em pilotis, quartinho, casa de show AO VIVO,
  mercadinho, ponto de ônibus com catraca), skyline com Copan, MASP, Banespa e antenas, fiação, pichação, garoa.

## Ajustes técnicos feitos sem mudar o conteúdo
- Cortes realinhados à voz real: 192 / 235 / 236 / 110 / 218 / 246 / 238 / 247 / 152 / 248 / 264 / 314 frames.
- Pausas maiores depois da câmera chegar, de "Ninguém paga" e de "Sem crédito".
- Poses de câmera recalculadas pro quadro vertical; casa de show mais funda pra caber a câmera do gancho.
- Gancho: o rosto aparece primeiro e a câmera sobe em "fotógrafo" (antes começava já fotografando).
- Badge final "VISIBILIDADE NÃO PAGA" com subtítulo "a parcela da câmera" (antes numa linha só).
- Assinatura final: "PIX, NÃO CREDENCIAL" (fotógrafo de show · como funciona) no lugar de "UGA DO LITORAL · agenda aberta", porque o Canal Dark ainda não tem nome. Badges na paleta do canal.
- Neon "AO VIVO" escondido nos planos de dentro do show; câmera da cena 2 passa por cima da placa da padaria.

## Pendências
- **ElevenLabs grátis:** sem licença comercial e com crédito obrigatório (pôr "voz: elevenlabs.io" na legenda do post).
  Se o canal for monetizado, isso vira uso comercial: assinar o Starter e regerar a voz (os tempos se ajustam sozinhos).
- Fora do padrão do canal, por pedido do Pedro: voz e efeitos do ElevenLabs (o padrão é VoiceStudio e efeitos em código).
