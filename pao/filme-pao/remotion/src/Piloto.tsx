// Piloto de 8 s: testa olhar, piscada, asa, contato com o botão e reação emocional.
// Três planos, cortes secos como no original:
//   A (0–2,5 s)  PAÓ lê o post fraco: sacada, leitura, piscada → meia pálpebra, "hm"
//   B (2,5–4,5 s) insert: a asa prepara, aperta o botão vermelho, segura, aperta de novo
//   C (4,5–8 s)  o balão apagado segura… e acende; a sala reage; PAÓ explode de alegria
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { E, piscada, respira, track, tremor } from "./anim";
import { AsaGrande, Balao, Botao, CorpoCanto, Faiscas, Pedestal, Post, Sala } from "./Cenario";
import { COR, Pao } from "./Pao";

export const PILOTO = { A: 75, B: 60, C: 105 };
export const PILOTO_TOTAL = PILOTO.A + PILOTO.B + PILOTO.C;

const Camera: React.FC<{ escala: number; x?: number; y?: number; origem?: string; children: React.ReactNode }> = ({
  escala,
  x = 0,
  y = 0,
  origem = "50% 55%",
  children,
}) => (
  <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${escala})`, transformOrigin: origem }}>
    {children}
  </AbsoluteFill>
);

// ── Plano A ──────────────────────────────────────────────────────────────
const PlanoA: React.FC = () => {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const v = h > w;

  // leitura: antecipação mínima pro lado oposto, sacada até o post, micro-sacadas
  const ler = track(f, [
    [0, 0.05],
    [7, -0.08, E.io],
    [12, 0.8, E.out],
    [21, 0.58, E.out],
    [29, 0.9, E.out],
    [37, 0.62, E.out],
    [44, 0.7, E.out],
    [51, 0.15, E.out], // depois da piscada, o olhar foge do post
  ]);
  const desce = track(f, [[44, 0], [53, 0.35, E.out]]);
  const palp = piscada(f, 44, 0, 0.45);
  const pose = {
    olharX: v ? (ler - 0.4) * 0.5 : ler,
    olharY: (v ? -0.85 : -0.25) + desce * (v ? 1.6 : 1),
    palpE: palp,
    palpD: palp,
    incl: track(f, [[44, 0], [51, 7, E.out]]),
    bico: track(f, [[56, 0], [60, 0.28, E.out], [67, 0.28], [71, 0, E.io]]),
    giro: v ? 0 : track(f, [[0, 0], [8, -1.5], [14, 3, E.out], [50, 3], [62, 1.5]]),
    asaE: track(f, [[50, 0], [64, -5]]),
    asaD: track(f, [[50, 0], [64, -5]]),
    achata: respira(f) * track(f, [[50, 1], [64, 0.97, E.out]]),
  };
  const boia = Math.sin(f / 18) * 6;
  return (
    <Camera escala={track(f, [[0, 1], [75, 1.05, E.lin]])}>
      <Sala w={w} h={h} aceso={() => 0} />
      <Post
        x={v ? w * 0.5 : w * 0.7}
        y={(v ? h * 0.33 : h * 0.43) + boia}
        w={v ? w * 0.52 : w * 0.22}
        likes="2"
        coment="0"
        compart="0"
        giro={v ? -2 : 3}
      />
      <Pao pose={pose} x={v ? w * 0.5 : w * 0.36} y={v ? h * 0.955 : h * 0.98} altura={v ? 700 : 640} id="pa" />
    </Camera>
  );
};

// ── Plano B ──────────────────────────────────────────────────────────────
const PlanoB: React.FC = () => {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const v = h > w;
  const bx = w * 0.5;
  const by = v ? h * 0.47 : h * 0.52;
  const tam = v ? w * 0.8 : w * 0.4;
  const asaTam = tam * 0.3;
  // a asa vem em diagonal, do corpo (canto inferior direito) até a tampa.
  // d = distância da ponta até o ponto de contato, ao longo do eixo da asa.
  const ang = -34;
  const rad = (-ang * Math.PI) / 180;
  const d = track(f, [
    [0, 1500],
    [9, 1500],
    [17, 230, E.out], // entra e para: preparação
    [24, 320, E.io], // recua (o "carregar" do gesto)
    [29, -6, E.in], // golpe: 5 quadros acelerando até o contato
    [30, -16, E.snap], // empurra junto com a tampa
    [37, -18],
    [41, 26, E.out], // alivia
    [46, -14, E.in], // segunda apertada, menor
    [50, -14],
    [60, 1600, E.in], // sai
  ]);
  const ponta = { x: bx + tam * 0.04 + Math.sin(rad) * d, y: by - tam * 0.02 + Math.cos(rad) * d };
  const aperto = track(f, [
    [28, 0],
    [30, 1, E.snap],
    [33, 0.8, E.out],
    [36, 0.9],
    [41, 0.35, E.out],
    [46, 0.85, E.in],
    [49, 0.75],
    [55, 0, E.out],
  ]);
  const brilho = track(f, [[29, 0], [30, 1, E.snap], [42, 0, E.out], [45, 0], [46, 0.6, E.snap], [56, 0, E.out]]);
  const t1 = tremor(f, 30, 7, 9);
  const t2 = tremor(f, 46, 5, 4);
  return (
    <Camera escala={track(f, [[0, 1], [60, 1.05, E.lin]])} x={t1.x + t2.x} y={t1.y + t2.y}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 65% at 50% 52%, ${COR.bege} 0%, #D9C3AA 60%, #8F6E52 100%)`,
        }}
      />
      {/* trilhos do painel */}
      <AbsoluteFill>
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              left: bx + s * tam * 0.62 - 14,
              top: 0,
              width: 28,
              height: h,
              background: "rgba(36,38,33,0.12)",
              borderRadius: 14,
            }}
          />
        ))}
      </AbsoluteFill>
      <Botao x={bx} y={by} tam={tam} aperto={aperto} brilho={brilho} />
      <AsaGrande x={ponta.x} y={ponta.y} ang={ang + track(f, [[17, -4], [24, -7], [29, 0, E.in], [60, 0]])} tam={asaTam} />
      <CorpoCanto cx={v ? w * 1.02 : w * 0.98} cy={v ? h * 1.08 : h * 1.22} r={v ? w * 0.55 : h * 0.62} />
    </Camera>
  );
};

// ── Plano C ──────────────────────────────────────────────────────────────
const PlanoC: React.FC = () => {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const v = h > w;
  const bal = { x: v ? w * 0.5 : w * 0.68, y: v ? h * 0.3 : h * 0.38, tam: v ? w * 0.42 : w * 0.21 };
  const acende = 30;
  const aceso = track(f, [[acende, 0], [acende + 5, 1, E.out]]);
  const escala = track(f, [[acende, 1], [acende + 5, 1.14, E.out], [acende + 12, 0.97, E.io], [acende + 17, 1]]);
  const diag = Math.hypot(w, h);
  const acesoParede = (_i: number, x: number, y: number) => {
    const d = (Math.hypot(x - bal.x, y - bal.y) / diag) * 34; // onda a partir do balão
    return track(f, [[acende + 2 + d, 0], [acende + 6 + d, 1, E.out]]);
  };

  // ação do PAÓ
  const salto = track(f, [[40, 0], [47, -80, E.out], [55, 0, E.in]]);
  const quica = f > 62 ? -Math.abs(Math.sin((f - 62) / 6)) * 14 * Math.max(0, 1 - (f - 62) / 40) : 0;
  const bate = f > 58 ? Math.sin((f - 58) / 2.6) * 18 * Math.max(0.25, 1 - (f - 58) / 45) : 0;
  const asas = track(f, [[0, 0], [12, 8, E.out], [33, 8], [39, -6, E.io], [47, 78, E.out], [58, 55, E.io]]) + bate;
  const achata =
    track(f, [
      [0, 1],
      [33, 1],
      [40, 0.86, E.io], // antecipação: agacha
      [46, 1.12, E.out], // estica no pulo
      [54, 1.02],
      [56, 0.9, E.snap], // pouso
      [64, 1, E.back],
    ]) * (f < 30 ? respira(f) : 1);
  const palp = track(f, [[0, 0], [20, 0], [28, 0.22, E.io], [acende + 3, 0, E.out]]);
  const pose = {
    olharX: v ? 0 : 0.8,
    olharY: v ? -0.9 : -0.35,
    pupila: track(f, [[0, 1], [10, 0.86], [acende, 0.86], [acende + 4, 1.35, E.back], [60, 1.2]]),
    palpE: palp,
    palpD: palp,
    feliz: track(f, [[50, 0], [58, 1, E.out]]),
    bico: track(f, [[acende + 1, 0], [acende + 4, 0.5, E.out], [44, 1, E.out], [70, 0.7], [100, 0.5]]),
    asaE: asas,
    asaD: asas,
    achata,
    giro: v ? 0 : track(f, [[0, 1], [12, 5, E.out], [acende, 5], [acende + 4, -3, E.out], [50, 0, E.io]]),
    y: salto + quica,
  };
  const t = tremor(f, acende + 1, 8, 7);
  return (
    <Camera
      escala={track(f, [[0, 1], [acende, 1.01], [60, 1.06, E.out], [105, 1.08, E.lin]])}
      x={t.x}
      y={t.y}
    >
      <Sala w={w} h={h} aceso={acesoParede} brilho={track(f, [[acende, 0], [acende + 8, 1, E.out], [90, 0.75]])} />
      <Faiscas f={f} x={bal.x} y={bal.y + bal.tam * 0.3} espalha={bal.tam * 0.7} n={12} forca={track(f, [[0, 0.4], [20, 1], [acende + 10, 0.3]])} />
      <Pedestal x={bal.x} y={bal.y + bal.tam * 0.55} w={bal.tam * 1.3} brilho={aceso} />
      <Balao x={bal.x} y={bal.y} tam={bal.tam} aceso={aceso} escala={escala} />
      {/* corações que sobem do balão depois de acender */}
      {[0, 1, 2, 3].map((i) => {
        const ini = acende + 8 + i * 9;
        const tt = track(f, [[ini, 0], [ini + 40, 1, E.out]]);
        if (f < ini) return null;
        const r = bal.tam * 0.16 * track(f, [[ini, 0.3], [ini + 6, 1.15, E.back], [ini + 10, 1]]);
        return (
          <svg
            key={i}
            viewBox="0 0 48 48"
            width={r * 2}
            height={r * 2}
            style={{
              position: "absolute",
              left: bal.x + (i % 2 ? 1 : -1) * bal.tam * (0.35 + i * 0.08) - r,
              top: bal.y - bal.tam * 0.2 - tt * bal.tam * 1.1 - r,
              opacity: 1 - tt * 0.9,
              transform: `rotate(${(i % 2 ? 1 : -1) * 12}deg)`,
            }}
          >
            <path
              d="M24 41 C12 32 4 25 4 16 C4 9.5 9 5 15 5 C19 5 22 7 24 10 C26 7 29 5 33 5 C39 5 44 9.5 44 16 C44 25 36 32 24 41 Z"
              fill={COR.vermelho}
              stroke="#FFD27A"
              strokeWidth={2.5}
            />
          </svg>
        );
      })}
      <Pao pose={pose} x={v ? w * 0.5 : w * 0.3} y={v ? h * 0.95 : h * 0.97} altura={v ? 720 : 620} id="pc" />
    </Camera>
  );
};

const SOM: [string, number, number][] = [
  // [arquivo, quadro global, volume]
  ["ambiente", 0, 0.5],
  ["olhar", 11, 0.5],
  ["hm", 56, 0.9],
  ["whoosh", PILOTO.A + 12, 0.7],
  ["clique", PILOTO.A + 29, 1],
  ["clique-leve", PILOTO.A + 45, 0.7],
  ["faiscas", PILOTO.A + PILOTO.B + 2, 0.5],
  ["acende", PILOTO.A + PILOTO.B + 30, 1],
  ["pulo", PILOTO.A + PILOTO.B + 40, 0.7],
  ["piado", PILOTO.A + PILOTO.B + 44, 0.8],
  ["pouso", PILOTO.A + PILOTO.B + 55, 0.7],
];

export const Piloto: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence durationInFrames={PILOTO.A}>
      <PlanoA />
    </Sequence>
    <Sequence from={PILOTO.A} durationInFrames={PILOTO.B}>
      <PlanoB />
    </Sequence>
    <Sequence from={PILOTO.A + PILOTO.B} durationInFrames={PILOTO.C}>
      <PlanoC />
    </Sequence>
    {SOM.map(([arq, q, vol]) => (
      <Sequence key={arq + q} from={q}>
        <Audio src={staticFile(`sfx/${arq}.wav`)} volume={vol * 0.7} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
