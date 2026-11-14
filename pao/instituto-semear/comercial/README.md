# Comercial 20 s · Instituto Semear (2026-11-03)

Motion de 20 s, 120 BPM, feito sem Remotion e sem HyperFrames: uma página HTML cujo estado é função do
tempo (`window.seek(t)`), fotografada quadro a quadro pelo Playwright e juntada no ffmpeg.

| arquivo | o que é |
|---|---|
| `entregas/semear-comercial-16x9.mp4` / `-9x16.mp4` | finais (30 fps, −14 LUFS) |
| `index.html` | o filme (`?f=h` ou `?f=v`) |
| `render.cjs` | `node render.cjs h` renderiza; `node render.cjs h folha 3.3 8.6` tira quadros soltos pra conferir |
| `trilha.py` | música original + efeitos, sintetizados (`python trilha.py`) |
| `capturar.cjs` | recaptura o site (isemear.org.br) e os estados de interface |
| `assets/ui/` | capturas reais do site (2×) · `assets/capturas/` páginas inteiras |
| `assets/marca/` | logo e estampa vetorizadas dos posts P56 (as mesmas do filme "Um gesto") |

Montar de novo: `python trilha.py`, `node render.cjs h`, `node render.cjs v`, e o mux com `loudnorm=I=-14` (ver histórico da sessão).

Batidas: 0–3 gancho "Entrar na faculdade não basta." · 3–6,5 o site se monta · 6,5–9 bolsa-auxílio (menu Faça parte →
Seja um jovem → seleção no card) · 9–11,5 três pilares (cliques nas abas) · 11,5–14 rede de contatos (carrossel de parceiros)
· 14–17 **1% de taxa de evasão** (número publicado na home, seção Impacto, lido em 2026-11-03) · 17–20 logo + "Vem gerar a mudança conosco." (frase do site).
