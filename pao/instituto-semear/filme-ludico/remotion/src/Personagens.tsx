import React from "react";
import { useCurrentFrame } from "remotion";
import { C, POPPINS } from "./marca";

// Olho de desenho animado: branco, pupila que mexe e pisca. `bravo` desenha a sobrancelha.
const Olho: React.FC<{ x: number; y: number; r: number; olhar?: [number, number]; bravo?: -1 | 1 }> = ({ x, y, r, olhar = [0, 0], bravo }) => {
  const f = useCurrentFrame();
  const pisca = f % 70 > 66 ? 0.15 : 1;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r} ry={r * pisca} fill={C.branco} stroke={C.tinta} strokeWidth={r * 0.28} />
      {pisca > 0.5 && <circle cx={x + olhar[0] * r * 0.35} cy={y + olhar[1] * r * 0.35} r={r * 0.45} fill={C.tinta} />}
      {bravo && <path d={`M ${x - r * 1.1} ${y - r * (bravo > 0 ? 1.7 : 1.3)} L ${x + r * 1.1} ${y - r * (bravo > 0 ? 1.3 : 1.7)}`} stroke={C.tinta} strokeWidth={r * 0.4} strokeLinecap="round" />}
    </g>
  );
};

const Rotulo: React.FC<{ texto: string; fundo: string; tam?: number }> = ({ texto, fundo, tam = 46 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: -64, display: "flex", justifyContent: "center" }}>
    <div style={{ background: fundo, color: C.branco, border: `6px solid ${C.tinta}`, borderRadius: 999, padding: "4px 22px", fontFamily: POPPINS, fontWeight: 900, fontSize: tam, letterSpacing: "0.01em" }}>{texto}</div>
  </div>
);

// PASSAGEM: o ônibus
export const Onibus: React.FC<{ largura: number }> = ({ largura }) => {
  const f = useCurrentFrame();
  const sacode = Math.sin(f / 2.2) * 3;
  return (
    <div style={{ position: "relative", width: largura, height: (largura * 240) / 380 }}>
      <svg viewBox="0 0 380 240" width={largura} style={{ overflow: "visible" }}>
        <g transform={`translate(0 ${sacode})`}>
          <rect x={10} y={20} width={360} height={170} rx={34} fill={C.azul} stroke={C.tinta} strokeWidth={8} />
          <rect x={14} y={128} width={352} height={22} fill={C.amarelo} />
          {[36, 112, 188].map((x) => <rect key={x} x={x} y={44} width={62} height={58} rx={10} fill={C.branco} stroke={C.tinta} strokeWidth={6} />)}
          <rect x={272} y={40} width={84} height={82} rx={14} fill={C.branco} stroke={C.tinta} strokeWidth={6} />
          <Olho x={298} y={80} r={14} olhar={[-1, 0.3]} />
          <Olho x={332} y={80} r={14} olhar={[-1, 0.3]} />
          <path d="M 296 168 Q 316 184 338 168" fill="none" stroke={C.tinta} strokeWidth={7} strokeLinecap="round" />
          <rect x={356} y={150} width={18} height={20} rx={4} fill={C.amarelo} stroke={C.tinta} strokeWidth={4} />
        </g>
        {[92, 290].map((x) => (
          <g key={x} transform={`rotate(${(f * 25) % 360} ${x} 200)`}>
            <circle cx={x} cy={200} r={32} fill={C.tinta} />
            <rect x={x - 4} y={176} width={8} height={48} fill={C.papel} />
          </g>
        ))}
      </svg>
      <Rotulo texto="PASSAGEM" fundo={C.azul} />
    </div>
  );
};

// XEROX: a copiadora cuspindo folha
export const Xerox: React.FC<{ largura: number }> = ({ largura }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: largura, height: (largura * 290) / 300 }}>
      <svg viewBox="0 0 300 290" width={largura} style={{ overflow: "visible" }}>
        {[0, 1, 2].map((k) => {
          const t = ((f + k * 9) % 27) / 27;
          return <rect key={k} x={-10 - t * 140} y={110 - t * 120 + Math.sin(t * 9) * 10} width={70} height={90} fill={C.branco} stroke={C.tinta} strokeWidth={4} transform={`rotate(${-30 * t} ${30 - t * 140} ${150 - t * 120})`} opacity={1 - t} />;
        })}
        <rect x={20} y={70} width={260} height={200} rx={26} fill={C.oliva2} stroke={C.tinta} strokeWidth={8} />
        <rect x={10} y={36} width={280} height={44} rx={14} fill={C.oliva} stroke={C.tinta} strokeWidth={8} />
        <rect x={206} y={96} width={52} height={24} rx={6} fill={C.amarelo} stroke={C.tinta} strokeWidth={4} />
        <circle cx={232 + (Math.floor(f / 6) % 2) * 0} cy={140} r={9} fill={Math.floor(f / 6) % 2 ? C.amarelo : C.branco} stroke={C.tinta} strokeWidth={3} />
        <Olho x={100} y={145} r={22} olhar={[0.5, 0.2]} />
        <Olho x={162} y={145} r={22} olhar={[0.5, 0.2]} />
        <rect x={80} y={196} width={110} height={22} rx={11} fill={C.tinta} />
        <rect x={98} y={204} width={74} height={24 + Math.abs(Math.sin(f / 4)) * 26} fill={C.branco} stroke={C.tinta} strokeWidth={4} />
      </svg>
      <Rotulo texto="XEROX" fundo={C.oliva2} />
    </div>
  );
};

// ALUGUEL: a casinha com placa
export const Casa: React.FC<{ largura: number }> = ({ largura }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: largura, height: (largura * 320) / 300 }}>
      <svg viewBox="0 0 300 320" width={largura} style={{ overflow: "visible" }}>
        <rect x={204} y={40} width={34} height={60} fill={C.marrom} stroke={C.tinta} strokeWidth={6} />
        {[0, 1].map((k) => {
          const t = ((f + k * 15) % 30) / 30;
          return <circle key={k} cx={221 + Math.sin(t * 6) * 8} cy={30 - t * 70} r={10 + t * 14} fill={C.branco} stroke={C.tinta} strokeWidth={3} opacity={1 - t} />;
        })}
        <path d="M 14 136 L 150 22 L 286 136 Z" fill={C.petroleo} stroke={C.tinta} strokeWidth={8} strokeLinejoin="round" />
        <rect x={46} y={128} width={208} height={186} fill={C.marrom} stroke={C.tinta} strokeWidth={8} />
        <rect x={70} y={150} width={64} height={64} rx={8} fill={C.amarelo} stroke={C.tinta} strokeWidth={6} />
        <rect x={166} y={150} width={64} height={64} rx={8} fill={C.amarelo} stroke={C.tinta} strokeWidth={6} />
        <Olho x={102} y={182} r={18} olhar={[0.6, 0]} />
        <Olho x={198} y={182} r={18} olhar={[0.6, 0]} />
        <rect x={124} y={236} width={52} height={78} rx={8} fill={C.amarelo} stroke={C.tinta} strokeWidth={6} />
        <circle cx={164} cy={278} r={5} fill={C.tinta} />
      </svg>
      <Rotulo texto="ALUGUEL" fundo={C.marrom} />
    </div>
  );
};

// O CHEFÃO: o calendário-monstro do fim do mês
export const Chefao: React.FC<{ largura: number; furia: number; dia?: number }> = ({ largura, furia, dia = 30 }) => {
  const f = useCurrentFrame();
  const braco = Math.sin(f / 2) * 18 * (0.4 + furia);
  return (
    <div style={{ position: "relative", width: largura, height: (largura * 500) / 560 }}>
      <svg viewBox="0 0 560 500" width={largura} style={{ overflow: "visible" }}>
        <g transform={`rotate(${-20 + braco} 40 300)`}><path d="M 40 300 L -40 240" stroke={C.tinta} strokeWidth={22} strokeLinecap="round" /><circle cx={-48} cy={232} r={30} fill={C.marrom} stroke={C.tinta} strokeWidth={8} /></g>
        <g transform={`rotate(${20 - braco} 520 300)`}><path d="M 520 300 L 600 240" stroke={C.tinta} strokeWidth={22} strokeLinecap="round" /><circle cx={608} cy={232} r={30} fill={C.marrom} stroke={C.tinta} strokeWidth={8} /></g>
        <rect x={30} y={60} width={500} height={420} rx={40} fill={C.branco} stroke={C.tinta} strokeWidth={11} />
        <path d="M 30 172 L 30 100 Q 30 60 70 60 L 490 60 Q 530 60 530 100 L 530 172 Z" fill={C.marrom} stroke={C.tinta} strokeWidth={11} strokeLinejoin="round" />
        {[110, 215, 325, 430].map((x) => <rect key={x} x={x} y={24} width={26} height={74} rx={13} fill={C.tinta} />)}
        <text x={280} y={138} textAnchor="middle" fontFamily={POPPINS} fontWeight={900} fontSize={58} fill={C.branco}>FIM DO MÊS</text>
        <Olho x={180} y={262} r={40} olhar={[0, 0.4]} bravo={1} />
        <Olho x={380} y={262} r={40} olhar={[0, 0.4]} bravo={-1} />
        <path d="M 150 350 Q 280 330 410 350 L 400 420 Q 280 440 160 420 Z" fill={C.tinta} />
        <path d={`M 160 352 ${Array.from({ length: 8 }, (_, k) => `L ${177 + k * 31} ${376 + Math.sin(f / 3) * 3 * furia} L ${192 + k * 31} 350`).join(" ")}`} fill={C.branco} stroke={C.tinta} strokeWidth={3} strokeLinejoin="round" />
        <text x={498} y={462} textAnchor="end" fontFamily={POPPINS} fontWeight={900} fontSize={54} fill={C.azul}>{String(dia).padStart(2, "0")}</text>
      </svg>
      <Rotulo texto="CHEFÃO" fundo={C.petroleo} tam={52} />
    </div>
  );
};
