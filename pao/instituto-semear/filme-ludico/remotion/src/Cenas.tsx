import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Arvore, Celula, Pessoa } from "./Desenhos";
import { Casa, Chefao, Onibus, Xerox } from "./Personagens";
import { Burst, escalaBurst } from "./Efeitos";
import { C, CHEGA, CL, POPPINS, SAI, VAIVEM, tremor } from "./marca";
import { naCena } from "./roteiro";

// ---------- peças comuns ----------
const Titulo: React.FC<{ texto: string; de: number; top: number; tam: number; cor?: string; rot?: number }> = ({ texto, de, top, tam, cor = C.marrom, rot = 0 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 0, width: 1080, textAlign: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: tam, color: cor, letterSpacing: "-0.03em", lineHeight: 0.95,
      opacity: f >= de ? 1 : 0, rotate: `${rot}deg`,
      scale: interpolate(f, [de, de + 7], [1.9, 1], { ...CL, easing: CHEGA }) }}>
      {texto}
    </div>
  );
};

const Etiqueta: React.FC<{ texto: string; de: number; top: number; fundo: string; cor?: string; tam?: number }> = ({ texto, de, top, fundo, cor = C.branco, tam = 58 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 0, width: 1080, display: "flex", justifyContent: "center", opacity: f >= de ? 1 : 0,
      scale: interpolate(f, [de, de + 8], [0.3, 1], { ...CL, easing: CHEGA }) }}>
      <div style={{ background: fundo, color: cor, fontFamily: POPPINS, fontWeight: 900, fontSize: tam, padding: "10px 34px", borderRadius: 999, letterSpacing: "0.02em" }}>{texto}</div>
    </div>
  );
};

const Barra: React.FC<{ top: number; valor: number; cor: string; pisca?: boolean }> = ({ top, valor, cor, pisca }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 130, width: 820, display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ fontFamily: POPPINS, fontWeight: 900, fontSize: 56, color: C.tinta }}>MÊS</div>
      <div style={{ flex: 1, height: 50, borderRadius: 25, border: `7px solid ${C.tinta}`, background: C.branco, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(1, valor)) * 100}%`, height: "100%", background: pisca && Math.floor(f / 4) % 2 ? C.marrom : cor }} />
      </div>
    </div>
  );
};

const Chao: React.FC<{ top: number }> = ({ top }) => (
  <div style={{ position: "absolute", top, left: 60, width: 960, height: 16, borderRadius: 8, background: C.marrom }} />
);

// ---------- 1 · gancho ----------
export const Gancho: React.FC = () => {
  const f = useCurrentFrame();
  const t = f + 8; // abre no meio do pulo: é a miniatura
  const k = Math.min(1, t / 26);
  const px = interpolate(t, [0, 26], [120, 880], CL);
  const py = 1130 - Math.sin(k * Math.PI) * 420;
  const carimbo = naCena("gancho", "n1", "tutorial");
  const confete = Array.from({ length: 46 }, (_, i) => i);
  const cores = [C.azul, C.oliva, C.marrom, C.branco, C.petroleo, C.azul2];
  return (
    <AbsoluteFill style={{ background: C.amarelo, translate: tremor(f, carimbo, 12, 28) }}>
      {confete.map((i) => {
        const y = -60 - ((i * 53) % 420) + Math.max(0, f - 10) * (13 + (i % 5) * 3);
        return <div key={i} style={{ position: "absolute", left: (i * 97) % 1080, top: y, width: 22, height: 34, background: cores[i % cores.length], rotate: `${(f * (6 + (i % 7)) + i * 40) % 360}deg`, borderRadius: i % 3 ? 4 : 17, opacity: f >= 10 ? 1 : 0 }} />;
      })}
      <div style={{ position: "absolute", top: 230, left: 0, width: 1080, textAlign: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: 118, lineHeight: 0.98, letterSpacing: "-0.03em", color: C.tinta, opacity: interpolate(f, [carimbo - 4, carimbo], [1, 0], CL) }}>PASSOU NO<br />VESTIBULAR?</div>
      <div style={{ position: "absolute", left: 270, top: 900, width: 540, height: 150, background: C.petroleo, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: 76, color: C.branco }}>
        VESTIBULAR
        <div style={{ position: "absolute", right: -40, top: -50, width: 110, height: 110, borderRadius: 55, background: C.oliva, color: C.branco, fontSize: 80, display: "flex", alignItems: "center", justifyContent: "center", border: `8px solid ${C.branco}`,
          scale: interpolate(f, [12, 18], [0, 1], { ...CL, easing: CHEGA }) }}>✓</div>
      </div>
      <Chao top={1060} />
      <div style={{ position: "absolute", left: px - 100, top: py - 230, rotate: `${interpolate(t, [0, 26], [-25, 18], CL)}deg` }}>
        <Pessoa i={4} altura={230} borda />
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, width: 1080, display: "flex", justifyContent: "center", opacity: f >= carimbo ? 1 : 0,
        scale: interpolate(f, [carimbo, carimbo + 6], [2.6, 1], { ...CL, easing: CHEGA }), rotate: "-7deg" }}>
        <div style={{ background: C.marrom, border: `12px solid ${C.branco}`, borderRadius: 28, padding: "18px 44px", textAlign: "center", fontFamily: POPPINS, fontWeight: 900, color: C.branco, fontSize: 132, lineHeight: 0.95, letterSpacing: "-0.03em" }}>
          TUTORIAL<br />CONCLUÍDO
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2 · mapa de fases ----------
const TRILHA: [number, number][] = [[150, 1010], [270, 1010], [390, 1010], [510, 1010], [510, 890], [510, 770], [630, 770], [750, 770], [870, 770], [870, 650], [870, 530]];
const CELS: [number, number][] = [[0, 1], [1, 4], [2, 0], [0, 5], [3, 2], [4, 1], [2, 7], [5, 8], [1, 9], [3, 6], [6, 1]];
export const Mapa: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.papel, translate: `${interpolate(f, [0, 7], [1080, 0], { ...CL, easing: CHEGA })}px 0px` }}>
      <Titulo texto="FASE 2" de={3} top={150} tam={220} />
      <div style={{ position: "absolute", top: 362, width: 1080, textAlign: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 56, color: C.tinta, opacity: f >= naCena("mapa", "n2", "chegar") ? 1 : 0 }}>CHEGAR ATÉ O FIM</div>
      {TRILHA.map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x - 58, top: y - 58, scale: interpolate(f, [6 + i * 2, 12 + i * 2], [0, 1], { ...CL, easing: CHEGA }) }}>
          <Celula r={CELS[i][0]} c={CELS[i][1]} tam={116} style={{ background: C.branco, borderRadius: 10 }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 860, top: 420, opacity: f >= naCena("mapa", "n2", "fim") ? 1 : 0, scale: interpolate(f, [naCena("mapa", "n2", "fim"), naCena("mapa", "n2", "fim") + 8], [0, 1], { ...CL, easing: CHEGA }) }}>
        <div style={{ width: 12, height: 120, background: C.tinta }} />
        <div style={{ position: "absolute", left: 12, top: 0, background: C.amarelo, fontFamily: POPPINS, fontWeight: 900, fontSize: 40, padding: "6px 16px", color: C.marrom }}>FIM</div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 820 + Math.sin(f / 4) * 6 }}><Pessoa i={4} altura={140} /></div>
    </AbsoluteFill>
  );
};

// ---------- 3 · obstáculos e o chefão (personagens) ----------
const VILOES = [
  { id: "onibus", x: 20, base: 1110, w: 380, cai: naCena("obstaculos", "n3", "Passagem") - 8 },
  { id: "casa", x: 395, base: 1110, w: 290, cai: naCena("obstaculos", "n3", "aluguel") - 8 },
  { id: "xerox", x: 720, base: 1110, w: 300, cai: naCena("obstaculos", "n3", "xerox") - 8 },
] as const;
export const Obstaculos: React.FC = () => {
  const f = useCurrentFrame();
  const chefe = naCena("obstaculos", "n3", "fim");
  const desce = naCena("obstaculos", "n3", "chefão") - 4;
  const [vo, vx, vc] = [VILOES[0].cai + 8, VILOES[2].cai + 8, VILOES[1].cai + 8];
  const vida = f < vo ? 1 : f < vx ? 0.75 : f < vc ? 0.55 : f < chefe ? 0.36 : 0.1;
  const chefeY = f < desce ? -700 : f < chefe - 6 ? interpolate(f, [desce, desce + 18], [-560, 200], { ...CL, easing: VAIVEM }) + Math.sin(f / 2) * 8 : interpolate(f, [chefe - 6, chefe], [170, 230], { ...CL, easing: SAI });
  const furia = f >= chefe ? 1 : 0.3;
  const sacode = [tremor(f, chefe, 16, 38), ...VILOES.map((v) => tremor(f, v.cai + 8, 6, 12))].find((v) => v !== "0px 0px") ?? "0px 0px";
  return (
    <AbsoluteFill style={{ background: C.papel, translate: sacode, scale: interpolate(f, [chefe, chefe + 4, chefe + 22], [1, 1.07, 1], { ...CL, easing: VAIVEM }) }}>
      <Barra top={190} valor={vida} cor={C.amarelo} pisca={f >= chefe} />
      <div style={{ position: "absolute", left: 260, top: chefeY, rotate: `${Math.sin(f / 5) * 2}deg` }}>
        <Chefao largura={560} furia={furia} dia={Math.round(interpolate(f, [desce, chefe], [1, 30], CL))} />
      </div>
      <Chao top={1112} />
      {VILOES.map((v) => {
        const Comp = v.id === "onibus" ? Onibus : v.id === "casa" ? Casa : Xerox;
        const altura = v.id === "onibus" ? (v.w * 240) / 380 : v.id === "casa" ? (v.w * 320) / 300 : (v.w * 290) / 300;
        return (
          <div key={v.id} style={{ position: "absolute", left: v.x, top: interpolate(f, [v.cai, v.cai + 8], [-450, v.base - altura], { ...CL, easing: SAI }),
            scale: `${interpolate(f, [v.cai + 8, v.cai + 11, v.cai + 16], [1, 1.12, 1], CL)} ${interpolate(f, [v.cai + 8, v.cai + 11, v.cai + 16], [1, 0.8, 1], CL)}`,
            transformOrigin: "50% 100%", rotate: `${f > v.cai + 16 ? Math.sin((f + v.cai) / 6) * 2.5 : 0}deg` }}>
            <Comp largura={v.w} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 4 · três caixas de item ----------
const Caixa: React.FC<{ x: number; de: number }> = ({ x, de }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - de, fps, config: { damping: 9, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: x - 125, top: 680 + Math.sin((f + de * 3) / 7) * 14, width: 250, height: 250, scale: s, rotate: `${(1 - s) * 90}deg`,
      background: C.amarelo, border: `10px solid ${C.tinta}`, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: 180, color: C.marrom }}>?</div>
  );
};
export const Caixas: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <AbsoluteFill style={{ background: C.azul }} />
      <Etiqueta texto="O SEMEAR LIBERA" de={naCena("caixas", "n4", "Semear")} top={300} fundo={C.petroleo} tam={52} />
      <Titulo texto="3 POWER-UPS" de={naCena("caixas", "n4", "power")} top={400} tam={150} cor={C.branco} />
      <Caixa x={220} de={4} />
      <Caixa x={540} de={9} />
      <Caixa x={860} de={14} />
    </AbsoluteFill>
  );
};

// ---------- 5 · bolsa ----------
export const Bolsa: React.FC = () => {
  const f = useCurrentFrame();
  const vida = interpolate(f, [naCena("bolsa", "n5", "segura"), naCena("bolsa", "n5", "segura") + 20], [0.1, 1], { ...CL, easing: CHEGA });
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <Titulo texto="BOLSA" de={3} top={200} tam={250} />
      <div style={{ position: "absolute", left: 390, top: 520 - interpolate(f, [0, 8], [0, 220], { ...CL, easing: CHEGA }), width: 300, height: 90, background: C.amarelo, border: `10px solid ${C.tinta}`, borderRadius: 20, rotate: `${interpolate(f, [0, 8], [0, -30], CL)}deg`, opacity: interpolate(f, [8, 14], [1, 0], CL) }} />
      <div style={{ position: "absolute", left: 390, top: 520, width: 300, height: 300, borderRadius: 150, background: C.amarelo, border: `18px solid ${C.marrom}`, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: POPPINS, fontWeight: 900, fontSize: 120, color: C.marrom, scale: escalaBurst(f / 30 - 0.3) }}>R$</div>
      <Burst x={540} y={670} escala={3.2} disparo={0.3} />
      <Barra top={930} valor={vida} cor={C.oliva} />
      <Etiqueta texto="+ MÊS" de={naCena("bolsa", "n5", "mês")} top={1020} fundo={C.oliva} tam={56} />
    </AbsoluteFill>
  );
};

// ---------- 6 · mentoria ----------
export const Mentoria: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const agulha = spring({ frame: f - 4, fps, config: { damping: 7 } });
  const caminho = interpolate(f, [naCena("mentoria", "n6", "mostra"), naCena("mentoria", "n6", "mapa") + 6], [1, 0], { ...CL, easing: VAIVEM });
  const mapa = naCena("mentoria", "n6", "mapa");
  return (
    <AbsoluteFill style={{ background: C.amarelo }}>
      <Titulo texto="MENTORIA" de={2} top={190} tam={190} />
      <Burst x={540} y={580} escala={3.2} disparo={0.25} anel={C.marrom} />
      <div style={{ position: "absolute", left: 390, top: 430, width: 300, height: 300, borderRadius: 150, background: C.branco, border: `16px solid ${C.marrom}`, scale: escalaBurst(f / 30 - 0.25) }}>
        <div style={{ position: "absolute", left: 128, top: 30, width: 12, height: 210, background: `linear-gradient(${C.azul} 50%, ${C.tinta} 50%)`, borderRadius: 6, rotate: `${interpolate(agulha, [0, 1], [200, 28])}deg` }} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><clipPath id="mentoria-revela"><rect x={0} y={0} width={1080 * (1 - caminho)} height={1920} /></clipPath></defs>
        <path d="M 150 1060 C 300 900, 480 1080, 620 930 S 860 820, 920 800" fill="none" stroke={C.petroleo} strokeWidth={16} strokeLinecap="round" strokeDasharray="2 34" clipPath="url(#mentoria-revela)" />
      </svg>
      <div style={{ position: "absolute", left: 890, top: 720, opacity: f >= mapa + 4 ? 1 : 0, scale: interpolate(f, [mapa + 4, mapa + 10], [0, 1], { ...CL, easing: CHEGA }), width: 60, height: 60, borderRadius: "50% 50% 50% 0", rotate: "-45deg", background: C.marrom }} />
      <div style={{ position: "absolute", left: 100, top: 980 }}><Pessoa i={4} altura={120} borda /></div>
      <Etiqueta texto="MAPA ATIVADO" de={mapa + 6} top={760} fundo={C.petroleo} tam={52} />
    </AbsoluteFill>
  );
};

// ---------- 7 · rede ----------
const ENTRA = naCena("rede", "n7", "ninguém");
const JOGADORES = [
  { x: 180, y: 900, de: ENTRA - 10, nome: "PLAYER 2", i: 8, dx: -700 },
  { x: 900, y: 900, de: ENTRA + 4, nome: "PLAYER 3", i: 12, dx: 700 },
  { x: 190, y: 560, de: ENTRA + 18, nome: "+ MENTOR", i: 2, dx: -700 },
];
const SOZINHO = naCena("rede", "n7", "sozinho");
export const Rede: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <Titulo texto="REDE" de={3} top={170} tam={240} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {JOGADORES.map((j, k) => (
          <line key={k} x1={540} y1={760} x2={j.x} y2={j.y} stroke={C.oliva2} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={interpolate(f, [j.de + 6, j.de + 14], [1, 0], CL)} />
        ))}
        <line x1={180} y1={900} x2={900} y2={900} stroke={C.oliva2} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={interpolate(f, [ENTRA + 30, ENTRA + 40], [1, 0], CL)} />
      </svg>
      <Burst x={540} y={760} escala={2.1} disparo={SOZINHO / 30} />
      <div style={{ position: "absolute", left: 540 - 85, top: 760 - 100, scale: escalaBurst((f - SOZINHO) / 30) }}><Pessoa i={4} altura={200} /></div>
      {JOGADORES.map((j) => (
        <div key={j.nome} style={{ position: "absolute", left: j.x - 70, top: j.y - 85, translate: `${interpolate(f, [j.de, j.de + 9], [j.dx, 0], { ...CL, easing: CHEGA })}px 0px` }}>
          <Pessoa i={j.i} altura={170} />
          <div style={{ position: "absolute", top: -58, left: -60, width: 260, textAlign: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: 36, color: C.marrom }}>{j.nome}</div>
        </div>
      ))}
      <Etiqueta texto="MODO CO-OP" de={SOZINHO} top={1040} fundo={C.oliva2} tam={56} />
    </AbsoluteFill>
  );
};

// ---------- 8 · fase final: o time corre e vira a árvore ----------
export const ARVORE_ALTURA = 780;
export const ARVORE_TOPO = 300;
export const Final: React.FC = () => {
  const f = useCurrentFrame();
  const dip = naCena("final", "n8", "diploma");
  const sai = interpolate(f, [dip + 8, dip + 18], [1, 0], CL);
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <div style={{ opacity: sai }}>
        <Titulo texto="FASE FINAL" de={1} top={190} tam={170} />
        {Array.from({ length: 14 }, (_, i) => {
          const x = ((i * 120 - f * 16) % 1680 + 1680) % 1680 - 240;
          return <div key={i} style={{ position: "absolute", left: x, top: 1000 }}><Celula r={i % 7} c={(i * 3) % 10} tam={116} style={{ background: C.branco, borderRadius: 10 }} /></div>;
        })}
        {[210, 380, 550, 720].map((x, k) => (
          <div key={x} style={{ position: "absolute", left: x - 60, top: 850 - Math.abs(Math.sin((f + k * 4) / 4)) * 34 }}><Pessoa i={[4, 8, 12, 2][k]} altura={140} /></div>
        ))}
        <div style={{ position: "absolute", left: interpolate(f, [dip - 24, dip], [1200, 840], { ...CL, easing: CHEGA }), top: 650 }}>
          <div style={{ width: 14, height: 350, background: C.tinta }} />
          <div style={{ position: "absolute", left: 14, top: 0, background: C.amarelo, border: `7px solid ${C.tinta}`, fontFamily: POPPINS, fontWeight: 900, fontSize: 52, padding: "10px 20px", color: C.marrom }}>DIPLOMA</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: ARVORE_TOPO, left: 0, width: 1080, display: "flex", justifyContent: "center" }}>
        <Arvore
          altura={ARVORE_ALTURA}
          voo={(i) => interpolate(f, [dip + 12 + i * 1.8, dip + 38 + i * 1.8], [0, 1], { ...CL, easing: CHEGA })}
          origens={(i) => [[-400, 2600], [1900, 2600], [780, 2900], [-600, 900], [2200, 900]][i % 5] as [number, number]}
          maos={interpolate(f, [dip + 26, dip + 62], [0, 1], { ...CL, easing: CHEGA })}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------- 9 · a marca ----------
export const Marca: React.FC = () => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 14], [0, 1], { ...CL, easing: VAIVEM });
  const altura = ARVORE_ALTURA - 230 * k;
  const frase: [string, number][] = (["Ninguém", "zera", "essa", "sozinho"] as const).map((w) => [w === "sozinho" ? "sozinho." : w, naCena("marca", "n9", w)]);
  const inst = naCena("marca", "n9", "Instituto"), sem = naCena("marca", "n9", "Semear");
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <div style={{ position: "absolute", top: ARVORE_TOPO - 110 * k, left: 0, width: 1080, display: "flex", justifyContent: "center" }}>
        <Arvore altura={altura} />
      </div>
      <div style={{ position: "absolute", top: 790, width: 1080, textAlign: "center", fontFamily: POPPINS, fontWeight: 400, fontSize: 52, letterSpacing: "0.45em", color: C.marrom, opacity: interpolate(f, [inst, inst + 6], [0, 1], CL) }}>INSTITUTO</div>
      <div style={{ position: "absolute", top: 830, width: 1080, textAlign: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 190, letterSpacing: "-0.03em", color: C.marrom, lineHeight: 1.1,
        opacity: interpolate(f, [sem, sem + 6], [0, 1], CL), scale: interpolate(f, [sem, sem + 8], [1.15, 1], { ...CL, easing: CHEGA }) }}>semear</div>
      <div style={{ position: "absolute", top: 1100, width: 1080, textAlign: "center", fontFamily: POPPINS, fontWeight: 900, fontSize: 78, color: C.tinta, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {frase.map(([w, de]) => (
          <span key={w} style={{ display: "inline-block", margin: "0 12px", opacity: f >= de ? 1 : 0, scale: interpolate(f, [de, de + 6], [0.5, 1], { ...CL, easing: CHEGA }) }}>{w}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
