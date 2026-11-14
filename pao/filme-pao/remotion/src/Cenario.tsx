// Cenários e objetos do filme, cada um separado do personagem.
import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import { COR } from "./Pao";

export const SALA = {
  centro: "#E46F1E",
  meio: "#B9420F",
  borda: "#5E1A07",
  apagado: "#5A1F0B",
  aceso: "#FFD27A",
  acesoForte: "#FFF3D6",
};

// Ícones de engajamento em caixa 48x48 (contorno, como na prancha)
const ICONE: Record<string, string> = {
  coracao:
    "M24 41 C12 32 4 25 4 16 C4 9.5 9 5 15 5 C19 5 22 7 24 10 C26 7 29 5 33 5 C39 5 44 9.5 44 16 C44 25 36 32 24 41 Z",
  comentario:
    "M9 7 H39 A5 5 0 0 1 44 12 V29 A5 5 0 0 1 39 34 H21 L12 42 V34 H9 A5 5 0 0 1 4 29 V12 A5 5 0 0 1 9 7 Z",
  compartilhar: "M28 6 L44 20 L28 34 V25 C18 25 10 28 4 40 C6 26 14 16.5 28 15 Z",
  sino: "M24 5 C25.8 5 27 6.3 27 8 C33.5 9.5 37.5 14.5 37.5 21 V29.5 L41.5 35 H6.5 L10.5 29.5 V21 C10.5 14.5 14.5 9.5 21 8 C21 6.3 22.2 5 24 5 Z M19.5 38 H28.5 C28.5 40.8 26.5 43 24 43 C21.5 43 19.5 40.8 19.5 38 Z",
};
export type TipoIcone = keyof typeof ICONE;
const ORDEM: TipoIcone[] = ["coracao", "comentario", "compartilhar", "sino"];

export const Icone: React.FC<{
  tipo: TipoIcone;
  x: number;
  y: number;
  tam: number;
  aceso: number; // 0 apagado .. 1 aceso
  cheio?: boolean;
}> = ({ tipo, x, y, tam, aceso, cheio = false }) => {
  const cor = interpolateColors(aceso, [0, 1], [SALA.apagado, SALA.aceso]);
  return (
    <svg
      viewBox="0 0 48 48"
      width={tam}
      height={tam}
      style={{
        position: "absolute",
        left: x - tam / 2,
        top: y - tam / 2,
        overflow: "visible",
        filter: aceso > 0.05 ? `drop-shadow(0 0 ${tam * 0.18 * aceso}px rgba(255,190,90,${0.9 * aceso}))` : undefined,
        opacity: 0.55 + aceso * 0.45,
      }}
    >
      <path
        d={ICONE[tipo]}
        fill={cheio ? cor : "none"}
        stroke={cor}
        strokeWidth={3.4}
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Sala laranja das notificações: fundo radial + parede de ícones.
// `aceso(i, x, y)` diz quanto cada ícone da parede está aceso.
export const Sala: React.FC<{
  w: number;
  h: number;
  aceso: (i: number, x: number, y: number) => number;
  deslocX?: number;
  brilho?: number; // 0..1, o ambiente reage quando acende
}> = ({ w, h, aceso, deslocX = 0, brilho = 0 }) => {
  const vertical = h > w;
  const cols = vertical ? 4 : 7;
  const linhas = vertical ? 6 : 3;
  const passoX = w / cols;
  const passoY = (vertical ? h * 0.62 : h * 0.62) / linhas;
  const tam = Math.min(passoX, passoY) * 0.42;
  const icones: React.ReactNode[] = [];
  let i = 0;
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < cols; c++) {
      const x = passoX * (c + 0.5) + (l % 2 ? passoX * 0.25 : -passoX * 0.25) + deslocX;
      const y = passoY * (l + 0.55);
      icones.push(
        <Icone key={i} tipo={ORDEM[(c + l) % 4]} x={x} y={y} tam={tam} aceso={aceso(i, x, y)} />,
      );
      i++;
    }
  }
  const centro = interpolateColors(brilho, [0, 1], [SALA.centro, "#F59A3A"]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 70% at 50% 58%, ${centro} 0%, ${SALA.meio} 55%, ${SALA.borda} 100%)`,
        overflow: "hidden",
      }}
    >
      {icones}
      {/* chão: faixa mais clara com reflexo */}
      <div
        style={{
          position: "absolute",
          left: -w * 0.2,
          width: w * 1.4,
          top: h * (vertical ? 0.8 : 0.78),
          height: h * 0.5,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 20%, rgba(255,170,80,${0.35 + brilho * 0.3}) 0%, rgba(120,30,8,0.0) 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Post com pouco engajamento (o "card" da prancha)
export const Post: React.FC<{
  x: number;
  y: number;
  w: number;
  likes: string;
  coment: string;
  compart: string;
  giro?: number;
}> = ({ x, y, w, likes, coment, compart, giro = 0 }) => {
  const h = w * 1.12;
  const fonte = `700 ${w * 0.075}px "Segoe UI", "Arial Rounded MT Bold", sans-serif`;
  const ic = w * 0.085;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        background: "#FFFFFF",
        borderRadius: w * 0.07,
        boxShadow: `0 ${w * 0.04}px ${w * 0.1}px rgba(60,10,0,0.35)`,
        transform: `rotate(${giro}deg)`,
        overflow: "hidden",
      }}
    >
      {/* foto do post: pôr do sol simples */}
      <svg viewBox="0 0 100 80" width={w} height={w * 0.8} style={{ display: "block" }}>
        <defs>
          <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7C5CC4" />
            <stop offset="0.55" stopColor="#F08A6A" />
            <stop offset="1" stopColor="#FFC98A" />
          </linearGradient>
        </defs>
        <rect width="100" height="80" fill="url(#ceu)" />
        <circle cx="62" cy="46" r="11" fill="#FFE3A3" />
        <path d="M0 58 Q25 40 48 56 T100 50 V80 H0 Z" fill="#6A3C8C" />
        <path d="M0 66 Q30 54 60 66 T100 64 V80 H0 Z" fill="#4A2A6A" />
      </svg>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: w * 0.06,
          padding: `${w * 0.06}px ${w * 0.07}px`,
          font: fonte,
          color: COR.corpo,
        }}
      >
        {(
          [
            ["coracao", likes, COR.vermelho],
            ["comentario", coment, COR.corpo],
            ["compartilhar", compart, COR.corpo],
          ] as const
        ).map(([t, n, cor]) => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: w * 0.02 }}>
            <svg viewBox="0 0 48 48" width={ic} height={ic}>
              <path d={ICONE[t]} fill={t === "coracao" ? cor : "none"} stroke={cor} strokeWidth={4} strokeLinejoin="round" />
            </svg>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
};

// Pedestal redondo (mesa onde fica o balão)
export const Pedestal: React.FC<{ x: number; y: number; w: number; brilho?: number }> = ({
  x,
  y,
  w,
  brilho = 0,
}) => (
  <svg
    viewBox="0 0 200 120"
    width={w}
    height={w * 0.6}
    style={{ position: "absolute", left: x - w / 2, top: y - w * 0.1, overflow: "visible" }}
  >
    <path d="M78 22 L70 112 H130 L122 22 Z" fill="#C9A88A" />
    <path d="M78 22 L74 112 H92 L94 22 Z" fill="#E9D2BB" opacity={0.6} />
    <ellipse cx="100" cy="112" rx="46" ry="8" fill="#8A3A16" opacity={0.5} />
    <ellipse cx="100" cy="20" rx="98" ry="20" fill={interpolateColors(brilho, [0, 1], ["#E8D3BE", "#FFF1DC"])} />
    <ellipse cx="100" cy="17" rx="90" ry="15" fill={interpolateColors(brilho, [0, 1], [COR.bege, "#FFFFFF"])} />
  </svg>
);

// O balão de comentário principal: apagado (cinza) → aceso (a virada)
export const Balao: React.FC<{ x: number; y: number; tam: number; aceso: number; escala?: number }> = ({
  x,
  y,
  tam,
  aceso,
  escala = 1,
}) => {
  const corpo = interpolateColors(aceso, [0, 0.6, 1], ["#6E6A66", "#E9A24A", "#FFC65C"]);
  const miolo = interpolateColors(aceso, [0, 1], ["#8C8782", "#FFF6DE"]);
  const ponto = interpolateColors(aceso, [0, 1], ["#57534F", "#E37A1C"]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - tam / 2,
        top: y - tam / 2,
        width: tam,
        height: tam,
        transform: `scale(${escala})`,
        transformOrigin: "50% 90%",
      }}
    >
      {/* halo */}
      <div
        style={{
          position: "absolute",
          inset: -tam * 0.6,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,214,130,${0.75 * aceso}) 0%, rgba(255,160,60,${0.35 * aceso}) 35%, rgba(255,120,30,0) 68%)`,
        }}
      />
      <svg viewBox="0 0 48 48" width={tam} height={tam} style={{ position: "absolute", overflow: "visible" }}>
        <path d={ICONE.comentario} fill={corpo} />
        <path
          d="M11 10.5 H37 A3.5 3.5 0 0 1 40.5 14 V27 A3.5 3.5 0 0 1 37 30.5 H11 A3.5 3.5 0 0 1 7.5 27 V14 A3.5 3.5 0 0 1 11 10.5 Z"
          fill={miolo}
          opacity={0.35 + aceso * 0.4}
        />
        {[16, 24, 32].map((cx) => (
          <circle key={cx} cx={cx} cy={20.5} r={2.6} fill={ponto} />
        ))}
      </svg>
    </div>
  );
};

// Botão circular vermelho (visto de cima, em 3/4), com a cara do PAÓ em relevo.
export const Botao: React.FC<{
  x: number;
  y: number;
  tam: number;
  aperto: number; // 0 solto .. 1 afundado
  brilho: number;
}> = ({ x, y, tam, aperto, brilho }) => {
  const desce = aperto * 14;
  return (
    <svg
      viewBox="0 0 300 260"
      width={tam}
      height={tam * (260 / 300)}
      style={{ position: "absolute", left: x - tam / 2, top: y - tam * 0.43, overflow: "visible" }}
    >
      <defs>
        <radialGradient id="tampa" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#D8402C" />
          <stop offset="0.6" stopColor={COR.vermelho} />
          <stop offset="1" stopColor="#7A160D" />
        </radialGradient>
      </defs>
      {/* brilho de contato */}
      <ellipse cx="150" cy="140" rx={150 + brilho * 40} ry={95 + brilho * 26} fill="#FF6A3D" opacity={brilho * 0.45} />
      {/* base (moldura carvão) */}
      <ellipse cx="150" cy="170" rx="140" ry="78" fill="#141512" />
      <ellipse cx="150" cy="150" rx="140" ry="78" fill={COR.corpo} />
      <ellipse cx="150" cy="146" rx="118" ry="64" fill="#0E0F0D" />
      {/* lateral da tampa */}
      <path
        d={`M40 ${118 + desce} V${150} A110 60 0 0 0 260 150 V${118 + desce} Z`}
        fill="#6E140B"
      />
      {/* tampa */}
      <ellipse cx="150" cy={118 + desce} rx="110" ry="60" fill="url(#tampa)" />
      <ellipse cx="128" cy={100 + desce} rx="56" ry="20" fill="#FFFFFF" opacity={0.18} />
      {/* cara do PAÓ em relevo */}
      <g transform={`translate(150 ${118 + desce}) scale(1 0.55)`} opacity={0.55}>
        <circle cx="-30" cy="-6" r="24" fill="none" stroke="#F2E5D5" strokeWidth="7" />
        <circle cx="30" cy="-6" r="24" fill="none" stroke="#F2E5D5" strokeWidth="7" />
        <circle cx="-30" cy="-6" r="8" fill="#F2E5D5" />
        <circle cx="30" cy="-6" r="8" fill="#F2E5D5" />
        <path d="M-10 26 Q0 40 10 26 Z" fill="#F2E5D5" />
      </g>
    </svg>
  );
};

// Asa em close (entra no quadro pra apertar). (x, y) é a PONTA da asa;
// ela gira em torno da ponta, então o contato fica parado onde precisa.
export const AsaGrande: React.FC<{ x: number; y: number; ang: number; tam: number }> = ({ x, y, ang, tam }) => (
  <svg
    viewBox="0 0 200 440"
    width={tam}
    height={tam * 2.2}
    style={{
      position: "absolute",
      left: x - tam / 2,
      top: y - tam * 0.033,
      overflow: "visible",
      transform: `rotate(${ang}deg)`,
      transformOrigin: "50% 1.5%",
    }}
  >
    <path d="M100 6 C164 6 198 66 194 156 C190 256 172 380 168 640 H20 C18 380 8 256 6 156 C2 66 36 6 100 6 Z" fill={COR.corpo} />
    {/* penas: dois sulcos sutis e um brilho de borda */}
    <path d="M62 60 C44 110 40 170 44 230" stroke="#3A3C36" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M100 70 C92 130 92 190 96 250" stroke="#2E302B" strokeWidth="7" fill="none" strokeLinecap="round" />
  </svg>
);

// Pedaço do corpo do PAÓ no canto do quadro (dá a escala e a origem da asa)
export const CorpoCanto: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <svg style={{ position: "absolute", left: cx - r, top: cy - r, overflow: "visible" }} width={r * 2} height={r * 2} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="100" fill={COR.corpo} />
    <ellipse cx="62" cy="128" rx="58" ry="52" fill={COR.vermelho} />
  </svg>
);

// Faíscas que sobem atrás do balão enquanto ele espera
export const Faiscas: React.FC<{ f: number; x: number; y: number; espalha: number; n?: number; forca?: number }> = ({
  f,
  x,
  y,
  espalha,
  n = 10,
  forca = 1,
}) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const ciclo = 34 + (i % 5) * 7;
      const t = ((f + i * 11) % ciclo) / ciclo;
      const px = x + Math.sin(i * 12.9) * espalha;
      const py = y - t * espalha * 1.4;
      const r = (3 + (i % 3) * 2) * (1 - t);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: px - r,
            top: py - r,
            width: r * 2,
            height: r * 2.6,
            borderRadius: "50%",
            background: "#FFE2A0",
            opacity: Math.sin(t * Math.PI) * forca,
            boxShadow: "0 0 10px rgba(255,200,120,0.9)",
          }}
        />
      );
    })}
  </>
);
