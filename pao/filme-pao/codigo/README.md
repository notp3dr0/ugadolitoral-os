# PAÓ · "para quem ama o que faz" · filme em código

Feito pela rota A do artigo "How to build motion design studio with Opus 5.5" (@0xMovez):
um `index.html` com `seek(t)` determinístico desenhando em canvas, Playwright capturando
quadro a quadro e ffmpeg juntando. Sem Remotion, sem HyperFrames.

Fonte da direção: `../roteiro-pedro/PAO-storyboard-e-roteiro/ROTEIRO-DE-EXECUCAO.md` (90 quadros, 21 blocos).

## Peças
- `lib/motion.js` · tempo: chaves com easing, molas em forma fechada, piscada medida, respiração, tremor.
- `lib/pao.js` · rig do PAÓ (medidas da imagem de identidade): corpo, peito, asas com alvo, pés com passo,
  olhos (anel, branco, pupila, brilho, pálpebras de cima e de baixo, feliz, espremido), bico, óculos
  (objeto separado), lágrimas, giro de rosto, modo pelúcia (fantasia).
- `lib/kit.js` · cenário e interface: ícones (apagado/aceso), sala laranja, mesas, o balão de comentário,
  chat, card de post, botão redondo todo vermelho, tecla POSTAR, celular, textos editáveis (Nunito).
- `cenas/cenas-a.js`, `cenas-b.js`, `cenas-c.js` · um desenho por plano, na ordem dos quadros 001–090.
- `roteiro.js` (+ `ROTEIRO_B`/`ROTEIRO_C` nas cenas) · ordem, duração, sons e enquadramento vertical de cada plano.
- `sons/voz_pao.py` · vocalizações do PAÓ no VoiceStudio (API local, porta 3900; voz "male, child, very high pitch";
  só tags não verbais: [sigh], [laughter], [surprise-ah/oh/wa], [dissatisfaction-hnn]).
- `sons/mix.py` · trilha original e efeitos sintetizados na linha do tempo + mixagem com as vozes.

## Rodar
```
npm install                                   # playwright (usa o Chromium já baixado)
node render.mjs --so-dados 1                  # exporta out/planos.json e out/cues.json
python -I sons/voz_pao.py                     # (VoiceStudio aberto) gera as vozes que faltarem
python -I sons/mix.py                         # out/trilha.wav
node render.mjs --fmt h --out out/filme-16x9-sem-som.mp4
node render.mjs --fmt v --out out/filme-9x16-sem-som.mp4
node render.mjs --meio 0.6 --outdir out/planos && python -I folha.py out/planos 6   # um still por plano
```
Ver no navegador: abrir `index.html?t=42` (ou `?fmt=v&t=42`).

Observação: o VS Code deixa `ELECTRON_RUN_AS_NODE=1` no terminal, e isso impede o VoiceStudio de abrir.
Abrir pelo menu Iniciar, ou com `env -u ELECTRON_RUN_AS_NODE "D:/VoiceStudio/app/VoiceStudio.exe"`.
