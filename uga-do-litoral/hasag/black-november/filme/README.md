# HASAG · Black November · filme

Comercial animado vertical (1080x1920, 24 fps, 19 s) em Remotion. Roteiro em `../roteiro.md`.

## Rodar

```bash
npm install
npm run trilha     # gera public/audio/trilha.wav (Python com numpy)
npm run dev        # abre o Remotion Studio, composição "BlackNovember"
npm run quadros    # PNGs de quadros-chave em out/quadros, pra revisão rápida
npm run render     # MP4 final em out/hasag-black-november.mp4
```

A trilha não vai pro git (o `.gitignore` da raiz bloqueia áudio): rode `npm run trilha` antes do
primeiro preview numa máquina nova.

## Onde mexer

| arquivo | o que tem |
|---|---|
| `src/theme.ts` | cores, tempo (144 BPM, um tempo = 10 frames), medidas do símbolo, frames de cada plano |
| `src/planos.tsx` | os oito planos, um componente por plano. É aqui que se ajusta o que acontece em cada um |
| `src/figura.tsx` | o personagem: figura de costas (P1), busto com os colares (P2 e P6), antebraço (P7) |
| `src/g1.tsx` | a Pulseira G1 em anel: 15 pérolas, 4 rondelas, corrente e fecho |
| `src/pecas.tsx` | pérola com crescente, bola de strass, cruz, estrela, etiqueta |
| `src/simbolo.tsx` | o símbolo HSG e o eclipse como dois círculos |
| `src/simbolo-paths.ts` | traçados gerados de `../../marca/hasag-simbolo.svg` (não editar à mão) |
| `scripts/trilha.py` | a trilha-guia; usa os mesmos números de frame de `theme.ts` |

O texto da oferta e o CTA estão no topo do P8, em `src/planos.tsx` (`OFERTA` e `CTA`).
