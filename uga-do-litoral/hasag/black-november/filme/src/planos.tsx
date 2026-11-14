import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {balanco, C, easeIn, easeInOut, easeOut, easeOutBack, H, mix, paleta, ramp, SIM, soco, W, zoomEm} from "./theme";
import {Eclipse, encaixe, Estrutura, Simbolo} from "./simbolo";
import {Braco, Busto, Figurinha} from "./figura";
import {AnelG1, ehRondela} from "./g1";
import {Estrela, Etiqueta} from "./pecas";
import {FONTE} from "./fonte";

const Quadro: React.FC<{fundo: string; children: React.ReactNode; style?: React.CSSProperties}> = ({fundo, children, style}) => (
  <AbsoluteFill style={{backgroundColor: fundo, ...style}}>
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {children}
    </svg>
  </AbsoluteFill>
);

const borrao = (px: number): React.CSSProperties => (px > 0.2 ? {filter: `blur(${px.toFixed(1)}px)`} : {});

const Nuvens: React.FC<{cor: string; desloc: number; faixas: [number, number, number, number][]}> = ({cor, desloc, faixas}) => (
  <g fill={cor}>
    {faixas.map(([x, y, w, h], i) => (
      <rect key={i} x={x + desloc * (i % 2 ? 1 : 0.6)} y={y} width={w} height={h} rx={h / 2} />
    ))}
  </g>
);

const Rotulo: React.FC<{de: number; frame: number; children: React.ReactNode; dx?: number}> = ({de, frame, children, dx = -24}) => {
  const t = easeOut(ramp(frame, de, de + 8));
  return (
    <g opacity={t} transform={`translate(${dx * (1 - t)} 0)`}>
      {children}
    </g>
  );
};

// ---------- P1 · plano geral: o símbolo é o lugar. A câmera mergulha na figura ----------

export const P1: React.FC = () => {
  const frame = useCurrentFrame();
  const {transform} = encaixe(540, 690, SIM.sol.r * 3.17); // sol a 40% da largura
  const dx = 138 - 46 * easeInOut(ramp(frame, 0, 50)); // a lua já entra mordendo no frame 0
  const sombra = 0.55 + 0.95 * easeOut(ramp(frame, 0, 50));
  const push = 1 + 0.08 * easeInOut(ramp(frame, 0, 40)) + 2.4 * easeIn(ramp(frame, 34, 50));
  const pes = 1560;
  return (
    <Quadro fundo={C.paper} style={borrao(12 * easeIn(ramp(frame, 40, 50)))}>
      <g transform={zoomEm(540, 1440, push)}>
        <rect x={-200} y={-200} width={W + 400} height={1400} fill="url(#g-ceu-dia)" />
        <circle cx={540} cy={690} r={620} fill="url(#g-halo)" />
        <Nuvens
          cor={C.cloud}
          desloc={frame * 0.9}
          faixas={[
            [-120, 318, 560, 26],
            [600, 432, 640, 30],
            [-60, 560, 300, 20],
            [760, 250, 420, 22],
          ]}
        />
        <g transform={transform}>
          <Estrutura cor={C.red} />
          <Eclipse dx={dx} ceu={C.paper} id="p1-vao" />
        </g>
        <rect x={-200} y={1150} width={W + 400} height={H} fill="url(#g-chao)" />
        <g fill={C.redShade}>
          {Array.from({length: 9}).map((_, i) => {
            const t = Math.pow((i + 1) / 10, 1.7);
            const y = 1170 + 720 * t;
            const meia = 60 + 330 * t;
            return <rect key={i} x={540 - meia} y={y} width={meia * 2} height={5 + 20 * t} />;
          })}
        </g>
        <g transform={`translate(0 ${pes}) scale(1 ${-sombra}) translate(0 ${-pes})`} opacity={0.85}>
          <Figurinha x={540} pes={pes} altura={260} cor={C.redShade} />
        </g>
        <Figurinha x={540} pes={pes} altura={260} />
        <g fill="none" stroke={C.paper} strokeWidth={2.6} strokeLinecap="round">
          <path d="M526 1353 Q540 1362 554 1353" />
          <path d="M524 1359 Q540 1371 556 1359" />
          <path d="M522 1366 Q540 1381 558 1366" />
        </g>
      </g>
      {/* primeiro plano: anda mais que o fundo (paralaxe) */}
      <g fill={C.black} transform={zoomEm(540, 1800, 1 + 0.18 * easeInOut(ramp(frame, 0, 50)))}>
        <path d="M0 1920 L0 1668 L64 1716 L118 1636 L176 1742 L250 1790 L318 1920Z" />
        <path d="M1080 1920 L1080 1700 L1024 1760 L972 1672 L906 1788 L842 1826 L784 1920Z" />
      </g>
    </Quadro>
  );
};

// ---------- P2 · peito, de frente: um avanço contínuo, com um soco de câmera em cada palma ----------

export const P2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ramp(frame, 0, 50);
  const chegada = 0.86 + 0.14 * easeOut(ramp(frame, 0, 12));
  const escala = chegada * (1 + 0.5 * easeInOut(ramp(frame, 6, 46))) + soco(frame, [20, 30, 40]);
  const sobe = 950 * easeIn(ramp(frame, 40, 50)); // a câmera levanta para o sol
  const faixa = 54 - 46 * easeInOut(t);
  const m = Math.sin(frame / 7);
  const blur = 9 * (1 - easeOut(ramp(frame, 0, 8))) + 10 * easeIn(ramp(frame, 42, 50));
  return (
    <Quadro fundo={paleta(C.sky.slice(0, 4), easeInOut(t))} style={borrao(blur)}>
      <rect x={0} y={0} width={W} height={H} fill="url(#g-ceu-sombra)" />
      <g transform={`translate(0 ${sobe})`}>
        <Nuvens
          cor="rgba(0,0,0,0.07)"
          desloc={frame * 0.7}
          faixas={[
            [-200, 250, 520, 30],
            [700, 430, 620, 34],
            [-120, 600, 300, 24],
          ]}
        />
        <g transform={zoomEm(540, 900, escala)}>
          <Busto
            modo="dia"
            faixa={faixa}
            cruzes={[2.2 * m, 3 * Math.sin((frame - 4) / 7), 2.2 * m]}
            longo={3 * Math.sin(frame / 11)}
            dread={2 * m}
          />
        </g>
      </g>
    </Quadro>
  );
};

// ---------- P3 · close no sol: para no desenho do símbolo ----------

const SOL = {x: 540, y: 880, r: 300};
const LUA_R = (SOL.r * SIM.luaR) / SIM.sol.r;

export const P3: React.FC = () => {
  const frame = useCurrentFrame();
  const {transform} = encaixe(SOL.x, SOL.y, SOL.r);
  const entra = -950 * (1 - easeOut(ramp(frame, 0, 12)));
  const dx =
    frame <= 28
      ? 78 - (78 - SIM.dxSimbolo) * easeInOut(ramp(frame, 0, 28))
      : frame <= 36
        ? SIM.dxSimbolo
        : SIM.dxSimbolo - (SIM.dxSimbolo - 6) * easeIn(ramp(frame, 36, 44));
  // na parada o céu clareia até o branco: por um instante é o símbolo, cor por cor
  const claro = easeInOut(ramp(frame, 25, 31)) * (1 - easeInOut(ramp(frame, 34, 41)));
  const ceu = mix(mix(C.sky[4], C.sky[5], ramp(frame, 0, 44)), C.paper, claro);
  const push = 1 + 0.08 * easeInOut(ramp(frame, 0, 44));
  return (
    <Quadro fundo={ceu} style={borrao(9 * (1 - easeOut(ramp(frame, 0, 9))))}>
      <g transform={`translate(0 ${entra}) ${zoomEm(SOL.x, SOL.y, push)}`}>
        <circle cx={SOL.x} cy={SOL.y} r={760} fill="url(#g-halo)" opacity={0.35 + 0.65 * claro} />
        <g transform={transform}>
          <Estrutura cor={C.red} />
          <Eclipse dx={dx} ceu={ceu} id="p3-vao" />
        </g>
      </g>
      <rect x={0} y={0} width={W} height={H} fill="url(#g-ceu-sombra)" />
    </Quadro>
  );
};

// ---------- P4 e P5 · a totalidade ----------

type TotalProps = {
  ceu: string;
  estrutura: string;
  lua: string;
  luaDx?: number;
  corona: number;
  escala: number;
  giro: number;
  children?: React.ReactNode;
};

const RAIOS = Array.from({length: 22}).map((_, i) => ({ang: i * 16.36 + ((i * 37) % 11), comp: 1.5 + ((i * 53) % 10) / 9, larg: 10 + ((i * 29) % 7) * 3}));

const CenaTotal: React.FC<TotalProps> = ({ceu, estrutura, lua, luaDx = 0, corona, escala, giro, children}) => {
  const {transform} = encaixe(SOL.x, SOL.y, SOL.r);
  return (
    <Quadro fundo={ceu}>
      <g transform={zoomEm(SOL.x, SOL.y, escala)}>
        <g transform={transform}>
          <Estrutura cor={estrutura} />
        </g>
        {/* coroa: raios finos girando devagar e o brilho que vaza da borda */}
        <g opacity={corona * 0.55} transform={`rotate(${giro} ${SOL.x} ${SOL.y})`}>
          {RAIOS.map((r, i) => (
            <path
              key={i}
              transform={`translate(${SOL.x} ${SOL.y}) rotate(${r.ang})`}
              d={`M${LUA_R * 0.9} ${-r.larg} L${LUA_R * r.comp} 0 L${LUA_R * 0.9} ${r.larg}Z`}
              fill="url(#g-raio)"
            />
          ))}
        </g>
        <circle cx={SOL.x} cy={SOL.y} r={LUA_R * 2.4} fill="url(#g-corona)" opacity={corona} />
        <circle cx={SOL.x + luaDx} cy={SOL.y} r={LUA_R} fill={lua} />
        {children}
      </g>
      <rect x={0} y={0} width={W} height={H} fill="url(#g-ceu-sombra)" />
    </Quadro>
  );
};

export const P4: React.FC = () => {
  const frame = useCurrentFrame();
  const t = easeOut(ramp(frame, 0, 10));
  // o anel de diamante: o último ponto do sol estoura e some
  const flare = frame < 3 ? easeOut(frame / 3) : 1 - easeIn(ramp(frame, 3, 13));
  const s = SOL.r / SIM.sol.r;
  return (
    <CenaTotal
      ceu={mix(C.sky[5], C.eclipseSky, t)}
      estrutura={mix(C.red, C.eclipseDeep, t)}
      lua={mix(C.sky[5], C.black, easeOut(ramp(frame, 0, 6)))}
      luaDx={6 * s * (1 - t)}
      corona={easeOut(ramp(frame, 2, 16))}
      escala={1.08 + 0.02 * ramp(frame, 0, 16)}
      giro={frame * 0.35}
    >
      {flare > 0.01 ? (
        <>
          <circle cx={SOL.x - SOL.r} cy={SOL.y} r={120 * flare} fill="url(#g-halo)" />
          <Estrela x={SOL.x - SOL.r} y={SOL.y} r={210 * flare} />
        </>
      ) : null}
    </CenaTotal>
  );
};

// ---------- P5 · as contas de Baily fecham a G1. No fim, a câmera entra no disco ----------

export const P5: React.FC = () => {
  const frame = useCurrentFrame();
  const raio = LUA_R + 4 + 51;
  const mergulho = easeIn(ramp(frame, 64, 80));
  const escala = 1.1 + 0.06 * easeInOut(ramp(frame, 0, 64)) + soco(frame, [40], 0.03, 4) + 5 * mergulho;
  const ordem = [3, 11, 7, 15];
  return (
    <AbsoluteFill style={borrao(12 * easeIn(ramp(frame, 70, 80)))}>
      <CenaTotal
        ceu={C.eclipseSky}
        estrutura={C.eclipseDeep}
        lua={C.black}
        corona={1 + 0.25 * soco(frame, [40], 1, 6)}
        escala={escala}
        giro={(16 + frame) * 0.35}
      >
        <g transform={`rotate(${-10 * (1 - easeOut(ramp(frame, 0, 46)))} ${SOL.x} ${SOL.y})`}>
          <AnelG1
            cx={SOL.x}
            cy={SOL.y}
            raio={raio}
            escala={(i) => easeOutBack(ramp(frame, 2 * i, 2 * i + 7))}
            estrela={(i) => {
              const s = frame - 2 * i;
              let v = s < 0 ? 0 : s < 2 ? 0.6 + 0.4 * (s / 2) : 1 - easeIn(ramp(s, 2, 9));
              // depois do clique, uma rondela pisca por tempo
              if (ehRondela(i) && frame >= 40) {
                const t = frame - 40;
                if (ordem[Math.floor(t / 10) % 4] === i) v = Math.max(v, 0.8 * (1 - easeOut(ramp(t % 10, 0, 6))));
              }
              return v;
            }}
            elos={8 * ramp(frame, 30, 38)}
            fecho={frame < 38 ? 0 : easeOutBack(ramp(frame, 38, 42))}
            clarao={frame >= 40 ? 1 - easeIn(ramp(frame, 40, 52)) : 0}
          />
        </g>
      </CenaTotal>
      <AbsoluteFill style={{opacity: 1 - ramp(frame, 60, 66)}}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <Rotulo de={48} frame={frame}>
            <Etiqueta x={560} y={1436} texto="G1" fonte={FONTE} />
          </Rotulo>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- P6 · abre de dentro do disco no peito: o giro e os dois tempos de balanço ----------

export const P6: React.FC = () => {
  const frame = useCurrentFrame();
  const iris = 1500 * easeOut(ramp(frame, 0, 14));
  const turn = easeInOut(ramp(frame, 6, 30));
  // cruzes: período de um tempo (10 frames), a do meio dois frames atrás, morrem em três idas
  const lat = balanco(frame, 8, -17, 10, 15);
  const meio = balanco(frame, 12, -21, 10, 16);
  // colar comprido: parte quatro frames depois do corpo, período de dois tempos, segue depois que o resto parou
  const longo = balanco(frame, 14, -40, 20, 46);
  const cruzLonga = balanco(frame, 16, -14, 20, 50);
  const em = (a: number) => frame >= a && frame < a + 3;
  const escala = 1.4 - 0.08 * easeOut(ramp(frame, 0, 16)) + 0.05 * easeInOut(ramp(frame, 16, 70)) + 0.3 * easeIn(ramp(frame, 70, 80));
  return (
    <AbsoluteFill style={{clipPath: `circle(${iris.toFixed(1)}px at 540px 900px)`}}>
      <Quadro fundo={C.eclipseSky}>
        <circle cx={540} cy={-120} r={900} fill="url(#g-corona)" opacity={0.35} />
        <Nuvens
          cor={C.eclipseDeep}
          desloc={frame * 0.5}
          faixas={[
            [-200, 250, 520, 30],
            [700, 430, 620, 34],
            [-120, 600, 300, 24],
          ]}
        />
        <g transform={zoomEm(540, 900, escala)}>
          <Busto
            modo="eclipse"
            turn={turn}
            corTee={C.eclipseDeep}
            cruzes={[lat, meio, lat]}
            curto={balanco(frame, 8, -10, 10, 15)}
            longo={longo}
            cruzLonga={cruzLonga}
            luz={210 + 60 * turn} // os crescentes migram de "10 horas" para "12 horas"
            dread={balanco(frame, 6, -16, 14, 20)}
            brilho={{esq: em(18), meio: em(22), dir: em(28), longa: em(34) || em(54)}}
          />
        </g>
        <rect x={0} y={0} width={W} height={H} fill="url(#g-ceu-sombra)" />
      </Quadro>
      <AbsoluteFill style={{opacity: 1 - ramp(frame, 70, 76)}}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <Rotulo de={40} frame={frame} dx={24}>
            <Etiqueta x={470} y={836} texto="1K2Q" fonte={FONTE} fio={124} lado="esq" ponto />
          </Rotulo>
          <Rotulo de={50} frame={frame} dx={24}>
            <Etiqueta x={486} y={1340} texto="RADIANT" fonte={FONTE} fio={56} lado="esq" />
          </Rotulo>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- P7 · corte no movimento para o punho: a G1 desliza e para com um clique ----------

export const P7: React.FC = () => {
  const frame = useCurrentFrame();
  const ang = -34 - 24 * easeOut(ramp(frame, 0, 22)); // o braço já entra subindo
  const t = ramp(frame, 12, 30);
  const pulseira = frame < 30 ? 1040 - 280 * easeIn(t) : 760 + balanco(frame, 30, -14, 8, 4);
  const estica = frame < 30 ? 1 + 0.35 * Math.sin(Math.PI * t) : 0.8 + 0.2 * easeOut(ramp(frame, 30, 35));
  const rabicho = frame < 30 ? 22 * easeIn(t) : balanco(frame, 30, 26, 10, 9, Math.PI / 2);
  const cam = 1.38 - 0.08 * easeOut(ramp(frame, 0, 14)) + soco(frame, [30], 0.025, 4);
  return (
    <Quadro fundo={C.eclipseSky}>
      <circle cx={900} cy={200} r={900} fill="url(#g-corona)" opacity={0.18} />
      <Nuvens
        cor={C.eclipseDeep}
        desloc={frame * 0.5}
        faixas={[
          [-160, 330, 560, 30],
          [640, 1560, 620, 34],
        ]}
      />
      <g transform={zoomEm(520, 1150, cam)}>
        <Braco px={10} py={1820} ang={ang} pulseira={pulseira} estica={estica} rabicho={rabicho} ceu={C.eclipseSky} />
      </g>
      <rect x={0} y={0} width={W} height={H} fill="url(#g-ceu-sombra)" />
      <Rotulo de={32} frame={frame}>
        <Etiqueta x={90} y={540} texto="PULSEIRA G1" fonte={FONTE} fio={56} />
      </Rotulo>
    </Quadro>
  );
};

// ---------- P8 · tela final: o sol volta como um crescente que varre o quadro ----------

const Emblema: React.FC<{cx: number; cy: number; r: number; giro: number}> = ({cx, cy, r, giro}) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.35} fill="url(#g-halo)" opacity={0.6} />
    <circle cx={cx} cy={cy} r={r} fill={C.black} />
    <g transform={`rotate(${giro} ${cx} ${cy})`}>
      <AnelG1 cx={cx} cy={cy} raio={r * 0.76} claro />
    </g>
  </g>
);

// A regra confirmada para 2026: compre qualquer colar e ganhe uma pulseira G1.
// O texto segue a hierarquia do banner da loja.
const OFERTA = {linha1: "GANHE UMA PULSEIRA G1", linha2a: "NA COMPRA DE ", linha2b: "QUALQUER COLAR."};
const CTA = "LINK NA BIO  ·  hasagstore.com.br";

const Entra: React.FC<{frame: number; de: number; dur?: number; dy?: number; dx?: number; escala?: number; cx?: number; cy?: number; children: React.ReactNode}> = ({
  frame,
  de,
  dur = 10,
  dy = 0,
  dx = 0,
  escala,
  cx = 540,
  cy = 960,
  children,
}) => {
  const t = ramp(frame, de, de + dur);
  const e = easeOut(t);
  const s = escala === undefined ? 1 : escala + (1 - escala) * easeOutBack(t);
  return (
    <g opacity={e} transform={`translate(${dx * (1 - e)} ${dy * (1 - e)}) ${zoomEm(cx, cy, s)}`}>
      {children}
    </g>
  );
};

export const P8: React.FC = () => {
  const frame = useCurrentFrame();
  const R = 2400 * easeInOut(ramp(frame, 0, 14));
  const esc = 132 / SIM.h;
  return (
    <AbsoluteFill>
      {/* o filete vermelho na borda do crescente que abre */}
      <AbsoluteFill style={{backgroundColor: C.red, clipPath: `circle(${(R + 30).toFixed(1)}px at 1150px 900px)`}} />
      <AbsoluteFill style={{clipPath: `circle(${R.toFixed(1)}px at 1230px 900px)`}}>
        <Quadro fundo={C.paper}>
          <rect x={0} y={0} width={W} height={H} fill="url(#g-ceu-dia)" />
          <g transform={zoomEm(540, 960, 1 + 0.025 * ramp(frame, 0, 96))}>
            <Entra frame={frame} de={8} escala={0.8} cx={540} cy={330}>
              <g transform={`translate(${540 - (SIM.w * esc) / 2} 262) scale(${esc})`}>
                <Simbolo />
              </g>
            </Entra>
            <Entra frame={frame} de={10} dy={60}>
              <text x={540} y={636} textAnchor="middle" fontFamily={FONTE} fontWeight={600} fontSize={248} fill={C.red}>
                BLACK
              </text>
            </Entra>
            <Entra frame={frame} de={14} dx={-50}>
              <text x={166} y={714} fontFamily={FONTE} fontStyle="italic" fontWeight={700} fontSize={66} fill={C.black}>
                November
              </text>
            </Entra>
            <Entra frame={frame} de={16} dur={14} escala={0} cx={540} cy={962}>
              <Emblema cx={540} cy={962} r={212} giro={frame * 0.3} />
            </Entra>
            <g fontFamily={FONTE} textAnchor="middle">
              <Entra frame={frame} de={24} dy={30}>
                <text x={540} y={1272} fontWeight={800} fontSize={66} fill={C.black}>
                  {OFERTA.linha1}
                </text>
              </Entra>
              <Entra frame={frame} de={28} dy={30}>
                <text x={540} y={1338} fontSize={48} fill={C.black}>
                  <tspan fontWeight={400}>{OFERTA.linha2a}</tspan>
                  <tspan fontWeight={800} fill={C.red}>
                    {OFERTA.linha2b}
                  </tspan>
                </text>
              </Entra>
              <Entra frame={frame} de={32} dy={30}>
                <rect x={232} y={1376} width={616} height={86} fill="none" stroke={C.black} strokeWidth={3} />
                <text x={540} y={1431} fontWeight={600} fontSize={34} letterSpacing={1} fill={C.black}>
                  {CTA}
                </text>
              </Entra>
            </g>
          </g>
        </Quadro>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
