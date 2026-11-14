# Template Remotion · série 2D de bonecos de peças

Vertical 1080×1920, 30 fps. Bonecos articulados em SVG, câmera 2D, luz volumétrica, POV com lanterna, legenda de 2–3 palavras e som sintetizado em código. Nasceu do estudo do teaser de referência em `../../referencias/trancados-teaser-estudo.md`: cada recurso do motor existe porque aparece lá.

É o par do template 3D low-poly das skills da raiz (`remotion-problem-resolve-video`). Aquele é para educativo problema → solução; este é para **série narrativa em episódios**.

## Rodar

```bash
npm install
npm run sfx        # gera public/audio/*.wav (síntese em código)
npm run dev        # Remotion Studio, composição "EpisodioDemo"
npx remotion render EpisodioDemo out/ep.mp4
npm run stills -- 30 120 316   # PNGs de frames específicos em out/stills (revisão rápida)
npm run lint       # tsc
```

`demo/preview.mp4` é o render de referência (540×960, 21 s). A demo é só técnica: personagens e frases são genéricos, existe pra provar cada recurso.

## Como é organizado

| Pasta | O que tem |
|---|---|
| `src/data/episode.ts` | **O contrato do episódio**: planos (tempo, entrada, intenção), legenda e efeitos sonoros. É o único arquivo que muda por episódio. |
| `src/engine/` | O motor: `Camera2D`, `Puppet` (rig e poses), `Light` (feixe, poeira, lanterna), `Fx` (grão, vinheta, flash, estilhaço, fumaça, fade), `Captions`, `Hud` (relógio, contagem de dias, título). |
| `src/sets/Sets.tsx` | Cenários (quarto, rua em paralaxe, corredor POV, porta de aço, fresta, fachada com horda). Troque os desenhos por série. |
| `src/scenes/EpisodioDemo.tsx` | Um plano por tipo do teaser, montado a partir do contrato. Copie e adapte. |
| `scripts/sfx.py` | Síntese dos sons (susto, tiro, madeira, batida, rangido, respiração, cama grave). |

## Como fazer um episódio

1. Roteiro aprovado e continuidade conferida (skill `biblia-serie`).
2. Escrever o **contrato** em `src/data/episodios/epNN.ts` (cópia do `episode.ts`): lista de planos com tipo, tempo e transição; `WORDS` com o tempo real da narração; `CUES` com o som.
3. Narração: gerar a voz e medir palavra por palavra, como no fluxo do template 3D (`voiceover.py` e `prepare_vo.py` da skill `remotion-problem-resolve-video`). Os tempos vão pra `WORDS`.
4. Montar cada plano reaproveitando o motor. Cenário novo = componente novo em `sets/`.
5. Conferir com `npm run stills` e com `medir_referencia.py` (skill `estudar-referencia-video`) contra as regras abaixo.
6. Renderizar.

## Regras de montagem (valem pra todo episódio)

1. **Calmo = câmera andando.** Sempre um `Camera2D` com pelo menos duas keys (deriva). Parada só no susto.
2. **Susto = preto + silêncio + corte seco + grave.** Cama de som some ~0,2 s antes, ~0,4 s de preto e silêncio total, corte seco para plano fixo, impacto de grave ~12 dB acima do resto, tremor curto e flash. Veja o plano `susto` e os `CUES`.
3. **Transição tem função.** Dissolve e fade nas cenas calmas; corte seco no susto e na ação. Nada de transição enfeitada.
4. **Variar o tipo de plano.** Detalhe sem personagem, médio, POV com mãos, geral de revelação. Dois planos seguidos do mesmo tipo é sinal de que falta um.
5. **Uma cor de acento por episódio** (`FINAL_ACCENT`): legenda destacada, contorno do personagem importante, um detalhe do cenário. O resto é noite azul-arroxeada.
6. **Legenda:** 2–3 palavras, uma colorida (a que carrega o sentido), centralizada no terço do meio.
7. **Protagonista em cena** em boa parte da altura do quadro. POV é exceção, não regra.
8. **Marcas diegéticas** (relógio, contagem de dias) dão cara de série sem narrar.
9. **Grão e vinheta** em todo plano; vinheta vermelha crescendo um pouco antes do susto.
10. **Fecho:** preto e cartão de título, sem voz.

## Limites conhecidos

- O boneco é de peças simples (cabeça oval, olho de bolinha, tronco retangular). Os cenários do demo são esquemáticos: a série real precisa de desenho próprio.
- `Puppet` cobre pose em pé, sentado, mira, recuo, susto, correr e rastejar, mais caminhada procedural. Quadrúpede (cachorro) não existe ainda.
- A demo não tem voz. Em episódio real a mixagem precisa ser nivelada (o teaser de referência mede ~−14 LUFS com tudo junto; a demo, sem voz, fica em ~−20).
- Fonte Montserrat via `@remotion/google-fonts` (baixa na primeira renderização, precisa de internet).
