import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Camera2D } from "../../engine/Camera2D";
import { Captions } from "../../engine/Captions";
import { FadeBlack, Film, Flash, Fog } from "../../engine/Fx";
import { ClockBadge } from "../../engine/Hud";
import { Dust, Flashlight, LightBeam } from "../../engine/Light";
import { LOOK_VOCE, POSE, Puppet, blend, walkPose } from "../../engine/Puppet";
import { ACCENT, Bandeja, CameraDetalhe, Cais, Fachada, Foto, LAB, LABSET, Laboratorio, PAPER, ParedeFlash, REC, Recepcao, RelogioDetalhe, dyingLight } from "../../revelacao/sets";
import { BEATS, Beat, BeatId, DURATION, WORDS, beat, wordAt } from "./timeline";
import { EASE, prog, sec } from "../../utils/anim";
import { FONT, FPS, H, PAL, W } from "../../theme";

// Revelação · EP01 · Pose 01. Um componente por plano; a montagem e o som vêm da timeline.

const useBeat = (id: BeatId) => {
  const b = beat(id);
  return { b, total: sec(b.dur) };
};

const VOCE_RIM = LOOK_VOCE;

/* ---------------- planos ---------------- */

const P1Letreiro: React.FC = () => {
  const { total } = useBeat("letreiro");
  return (
    <>
      <Camera2D keys={[{ f: 0, x: 540, y: 1260, zoom: 1.18 }, { f: total, x: 540, y: 760, zoom: 1.04, ease: "soft" }]}>
        <Fachada />
      </Camera2D>
      <Fog density={0.75} y={300} h={1500} seed="fachada" />
    </>
  );
};

const P2Cais: React.FC = () => {
  const { total } = useBeat("cais");
  return (
    <>
      <Camera2D keys={[{ f: 0, x: 540, y: 1120, zoom: 1.0 }, { f: total, x: 540, y: 930, zoom: 1.32, ease: "linear" }]}>
        <Cais />
      </Camera2D>
      <Fog density={0.95} y={600} h={700} seed="cais" speed={1.4} />
      <Fog density={0.5} y={1200} h={600} seed="cais2" speed={0.7} />
    </>
  );
};

const P3Entra: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("entra");
  const walk = prog(frame, 0, total * 0.5, EASE.linear);
  const door = 1 - prog(frame, total * 0.52, total * 0.64, EASE.in);
  const lock = prog(frame, total * 0.8, total * 0.9, EASE.hit);
  const x = 320 + walk * 420;
  const pose = walk < 1 ? walkPose(frame / 24, 0.9) : blend(POSE.stand, { ...POSE.stand, neck: -10 }, prog(frame, total * 0.55, total * 0.65));
  return (
    <Camera2D
      worldW={REC.w}
      keys={[
        { f: 0, x: 470, y: 1200, zoom: 1.3 },
        { f: Math.round(total * 0.5), x: 680, y: 1210, zoom: 1.4, ease: "inOut" },
        { f: Math.round(total * 0.72), x: 640, y: 1200, zoom: 1.42 },
        { f: Math.round(total * 0.8), x: REC.lock[0], y: REC.lock[1], zoom: 2.6, ease: "out" },
        { f: total, x: REC.lock[0], y: REC.lock[1], zoom: 2.75, ease: "linear" },
      ]}
    >
      <Recepcao doorOpen={door} lockTurn={lock}>
        <Puppet x={x} y={REC.floorY} pose={pose} look={VOCE_RIM} />
      </Recepcao>
      <LightBeam from={[710, 900]} to={[980, 1500]} w0={260} w1={520} color="#9fb6ff" opacity={0.3} />
      <Dust box={[560, 800, 600, 700]} count={36} seed="rec" color="#cdd8ff" />
    </Camera2D>
  );
};

const P4Relogio: React.FC = () => {
  const { total } = useBeat("relogio");
  return (
    <Camera2D keys={[{ f: 0, x: 540, y: 960, zoom: 1.0 }, { f: total, x: 560, y: 900, zoom: 1.2, ease: "linear" }]}>
      <RelogioDetalhe />
    </Camera2D>
  );
};

const P5Camera: React.FC = () => {
  const { total } = useBeat("camera");
  return (
    <Camera2D keys={[{ f: 0, x: 760, y: 880, zoom: 1.25 }, { f: Math.round(total * 0.4), x: 700, y: 900, zoom: 1.22 }, { f: total, x: 330, y: 1120, zoom: 1.45, ease: "soft" }]}>
      <CameraDetalhe counter="36" />
    </Camera2D>
  );
};

const P6Lab: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("lab");
  const work = { ...POSE.stand, lean: 14, neck: -18, armF: [24, 52] as [number, number], armB: [18, 56] as [number, number] };
  const pose = blend(work, { ...work, armF: [30, 46] }, 0.5 + 0.5 * Math.sin(frame / 14));
  return (
    <Camera2D worldW={LABSET.w} keys={[{ f: 0, x: 640, y: 1180, zoom: 1.35 }, { f: total, x: 720, y: 1200, zoom: 1.5, ease: "soft" }]}>
      <Laboratorio>
        <Puppet x={560} y={LABSET.floorY} pose={pose} look={VOCE_RIM} />
      </Laboratorio>
      <LightBeam from={[700, 400]} to={[620, 1500]} w0={200} w1={760} color="#ff3a22" opacity={0.3} />
      <Dust box={[300, 400, 800, 1000]} count={40} seed="lab" color="#ff9a80" />
    </Camera2D>
  );
};

const P7Bandeja: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("bandeja");
  return (
    <Camera2D keys={[{ f: 0, zoom: 1.0 }, { f: total, zoom: 1.06, ease: "linear" }]}>
      <Bandeja slide={prog(frame, 0, total * 0.6, EASE.out)}>
        <Foto w={PAPER.w} h={PAPER.h} emerge={0} />
      </Bandeja>
    </Camera2D>
  );
};

const P8Emerge: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("emerge");
  return (
    <Camera2D keys={[{ f: 0, x: 540, y: 980, zoom: 1.0 }, { f: total, x: 540, y: 980, zoom: 1.24, ease: "linear" }]}>
      <Bandeja tongs={false}>
        <Foto w={PAPER.w} h={PAPER.h} emerge={prog(frame, total * 0.08, total * 0.72, EASE.soft)} />
      </Bandeja>
    </Camera2D>
  );
};

const P9Carimbo: React.FC = () => {
  const { total } = useBeat("carimbo");
  return (
    <Camera2D keys={[{ f: 0, x: 540, y: 980, zoom: 1.24 }, { f: Math.round(total * 0.35), x: 760, y: 1275, zoom: 2.7, ease: "out" }, { f: total, x: 765, y: 1278, zoom: 2.85, ease: "linear" }]}>
      <Bandeja tongs={false}>
        <Foto w={PAPER.w} h={PAPER.h} emerge={1} />
      </Bandeja>
    </Camera2D>
  );
};

const P10Hud: React.FC = () => {
  const { total } = useBeat("hud");
  const holdPhoto = { ...POSE.stand, armF: [62, 34] as [number, number], neck: 4 };
  return (
    <>
      <Camera2D worldW={REC.w} keys={[{ f: 0, x: 2080, y: 1200, zoom: 1.4 }, { f: total, x: 2110, y: 1190, zoom: 1.5, ease: "linear" }]}>
        <Recepcao>
          <Puppet x={2190} y={REC.floorY} flip pose={holdPhoto} look={VOCE_RIM} hand={<rect x={-30} y={0} width={70} height={80} fill={LAB.paper} stroke={PAL.ink} strokeWidth={3} />} />
        </Recepcao>
      </Camera2D>
    </>
  );
};

const P11Pov: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("pov");
  const sweep = -110 + 52 * prog(frame, 0, total * 0.55, EASE.inOut) - 18 * prog(frame, total * 0.55, total, EASE.inOut);
  const dieStart = total - sec(0.9);
  const light = dyingLight(frame, dieStart, total - 3);
  return (
    <>
      <Camera2D worldW={REC.w} shake={3} keys={[{ f: 0, x: 1880, y: 1000, zoom: 1.0 }, { f: total, x: 1960, y: 1000, zoom: 1.12, ease: "linear" }]}>
        <Recepcao labGlow={light} />
      </Camera2D>
      <Flashlight x={300} y={1820} angle={sweep} length={1900} spread={15} dark={0.86} />
      {/* a foto na mão, no rodapé */}
      <div style={{ position: "absolute", left: 600, top: 1440, width: 300, height: 310, transform: "rotate(-8deg)", boxShadow: "0 8px 20px rgba(0,0,0,.6)" }}>
        <Foto w={300} h={310} emerge={1} />
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={660} cy={1760} r={56} fill={LOOK_VOCE.skin} stroke={PAL.ink} strokeWidth={4} />
        <rect x={520} y={1820} width={460} height={140} rx={60} fill={LOOK_VOCE.cloth} stroke={PAL.ink} strokeWidth={4} />
        <rect x={200} y={1700} width={110} height={34} rx={10} fill="#2b2b3a" stroke={PAL.ink} strokeWidth={4} transform={`rotate(${sweep} 300 1720)`} />
        <circle cx={270} cy={1800} r={52} fill={LOOK_VOCE.skin} stroke={PAL.ink} strokeWidth={4} />
      </svg>
      {/* aviso: vinheta vermelha crescendo, e a luz morrendo no fim */}
      <Film tint={ACCENT} tintOpacity={prog(frame, total * 0.4, dieStart, EASE.in) * 0.5} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: frame >= dieStart ? 1 - light * 0.7 : 0 }} />
    </>
  );
};

const P13Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("flash");
  return (
    <>
      <Camera2D hit={{ f: 1, amp: 30, dur: 16 }} keys={[{ f: 0, zoom: 1.0 }]}>
        <ParedeFlash lit={1 - prog(frame, 2, total, EASE.out) * 0.8} />
      </Camera2D>
      <Flash at={0} dur={8} peak={1} />
    </>
  );
};

const P14Segunda: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("segunda");
  const flick = frame < 14 ? (Math.sin(frame * 3) > 0 ? 1 : 0.4) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: flick }}>
      <Camera2D keys={[{ f: 0, x: 540, y: 980, zoom: 1.05 }, { f: total, x: 560, y: 960, zoom: 1.28, ease: "linear" }]}>
        <Bandeja tongs={false}>
          <Foto w={PAPER.w} h={PAPER.h} emerge={prog(frame, 0, total * 0.35, EASE.soft) * 0.6 + 0.4} view={{ x: 1180, y: 1120, zoom: 0.8 }} voceDeCostas doorOpen={0} />
        </Bandeja>
      </Camera2D>
    </div>
  );
};

const P15Interruptor: React.FC = () => {
  const frame = useCurrentFrame();
  const { total } = useBeat("interruptor");
  const shadow = prog(frame, 0, total * 0.85, EASE.in);
  return (
    <>
      <Camera2D worldW={LABSET.w} keys={[{ f: 0, x: LABSET.switch[0] - 120, y: LABSET.switch[1], zoom: 1.9 }, { f: total, x: LABSET.switch[0] - 60, y: LABSET.switch[1] + 20, zoom: 2.15, ease: "linear" }]}>
        <Laboratorio />
      </Camera2D>
      {/* sombra comprida avançando pela parede, vinda da esquerda */}
      <div style={{ position: "absolute", left: -900 + shadow * 980, top: 0, width: 900, height: H, background: "linear-gradient(90deg, rgba(0,0,0,.95) 60%, rgba(0,0,0,0))" }} />
      <RegraCard n={1} text="Nunca acenda a luz branca com papel na bandeja." appear={prog(frame, total * 0.45, total * 0.6, EASE.out)} />
    </>
  );
};

const RegraCard: React.FC<{ n: number; text: string; appear: number }> = ({ n, text, appear }) => (
  <div
    style={{
      position: "absolute",
      left: 90,
      right: 90,
      top: 1400,
      padding: "26px 34px",
      background: "rgba(10,3,3,.86)",
      borderLeft: `8px solid ${ACCENT}`,
      borderRadius: 8,
      fontFamily: FONT,
      color: "#fff",
      opacity: appear,
      transform: `translateY(${(1 - appear) * 40}px)`,
    }}
  >
    <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, color: ACCENT }}>REGRA {n}</div>
    <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.15, marginTop: 8 }}>{text.toUpperCase()}</div>
  </div>
);

const P16Escolha: React.FC = () => {
  const frame = useCurrentFrame();
  const b = beat("escolha");
  const t = frame / FPS + b.from;
  const a1 = wordAt("f15", "Um:") ?? b.from + 1.2;
  const a2 = wordAt("f15", "Dois:") ?? b.from + 3.2;
  const pill = (n: string, text: string, at: number) => {
    const k = prog(t * FPS, at * FPS - 2, at * FPS + 8, EASE.out);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "26px 34px", background: "rgba(255,255,255,.06)", border: "2px solid rgba(255,255,255,.18)", borderRadius: 18, opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
        <div style={{ width: 76, height: 76, borderRadius: 38, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, fontWeight: 900 }}>{n}</div>
        <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.1 }}>{text}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#0a0303", fontFamily: FONT, color: "#fff" }}>
      <div style={{ position: "absolute", left: 140, top: 300, width: 800, height: 820, opacity: 0.18, filter: "blur(1px)" }}>
        <Foto w={800} h={820} emerge={1} />
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 560, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: 4 }}>VOCÊ DECIDE</div>
        {pill("1", "REVELAR A POSE 02 AGORA", a1)}
        {pill("2", "ESPERAR O AMANHECER", a2)}
        <div style={{ marginTop: 20, fontSize: 34, fontWeight: 800, letterSpacing: 3, color: ACCENT, opacity: prog(t * FPS, (a2 + 1.2) * FPS, (a2 + 1.6) * FPS) }}>COMENTA 1 OU 2 · A MAIORIA DECIDE</div>
      </div>
      <Film grain={0.14} vignette={0.7} />
    </AbsoluteFill>
  );
};

const P17Fecho: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAL.night0, fontFamily: FONT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
      <div style={{ fontSize: 124, fontWeight: 900, letterSpacing: 10 }}>REVELAÇÃO</div>
      <div style={{ marginTop: 24, fontSize: 44, fontWeight: 800, letterSpacing: 10, color: ACCENT }}>POSE 01 / 36</div>
      <div style={{ marginTop: 140, fontSize: 40, fontWeight: 800, letterSpacing: 2, opacity: prog(frame, 20, 34) }}>ACHOU O QUE MUDOU NA FOTO?</div>
      <div style={{ marginTop: 14, fontSize: 40, fontWeight: 900, letterSpacing: 6, color: ACCENT, opacity: prog(frame, 30, 44) }}>COMENTA</div>
    </AbsoluteFill>
  );
};

const VIEW: Partial<Record<BeatId, React.FC>> = {
  letreiro: P1Letreiro, cais: P2Cais, entra: P3Entra, relogio: P4Relogio, camera: P5Camera, lab: P6Lab,
  bandeja: P7Bandeja, emerge: P8Emerge, carimbo: P9Carimbo, hud: P10Hud, pov: P11Pov,
  flash: P13Flash, segunda: P14Segunda, interruptor: P15Interruptor, escolha: P16Escolha, fecho: P17Fecho,
  // "preto" não tem plano: é preto e silêncio total
};

/* ---------------- montagem ---------------- */

const ShotWrap: React.FC<{ b: Beat; children: React.ReactNode }> = ({ b, children }) => {
  const frame = useCurrentFrame();
  const inF = sec(b.inS ?? 0);
  const dissolve = b.inT === "dissolve" ? prog(frame, 0, inF, EASE.soft) : 1;
  return (
    <AbsoluteFill style={{ opacity: dissolve, background: PAL.night0 }}>
      {children}
      <FadeBlack total={sec(b.dur)} inF={b.inT === "fadeblack" ? inF : 0} outF={sec(b.outBlack ?? 0)} />
    </AbsoluteFill>
  );
};

/** Relógio do canto: 03:10 no plano "hud" e correndo até 03:17 no "pov". */
const Hora: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hud = beat("hud");
  const pov = beat("pov");
  if (t < hud.from || t >= pov.from + pov.dur - 0.9) return null;
  const m = t < pov.from ? 10 : 10 + Math.min(7, Math.floor(prog(frame, sec(pov.from), sec(pov.from + pov.dur - 1.0), EASE.in) * 7.999));
  return <ClockBadge time={`03:${String(m).padStart(2, "0")}`} label="dia 1 · pose 01" />;
};

/* ---------------- som ---------------- */

type Cue = { at: number; src: string; vol: number; dur: number; fadeOut?: number; name: string };
const S = (id: BeatId) => beat(id);
const CUES: Cue[] = [
  { name: "cama até o susto", src: "audio/bed.wav", at: 0, vol: 0.2, dur: S("pov").from + S("pov").dur - 0.25, fadeOut: 0.8 },
  { name: "mar e vento", src: "audio/waves.wav", at: S("cais").from - 0.4, vol: 0.5, dur: S("cais").dur + 1.0, fadeOut: 0.8 },
  { name: "porta rangendo", src: "audio/creak.wav", at: S("entra").from + 0.2, vol: 0.35, dur: 1.6 },
  { name: "tranca", src: "audio/lock_click.wav", at: S("entra").from + S("entra").dur * 0.8, vol: 0.75, dur: 0.6 },
  { name: "um tique só (relógio parado)", src: "audio/tick.wav", at: S("relogio").from + 0.5, vol: 0.5, dur: 0.3 },
  { name: "contador", src: "audio/tick.wav", at: S("camera").from + S("camera").dur * 0.7, vol: 0.4, dur: 0.3 },
  { name: "gotas no laboratório", src: "audio/drip.wav", at: S("lab").from, vol: 0.4, dur: S("pov").from - S("lab").from, fadeOut: 0.6 },
  { name: "papel no revelador", src: "audio/slosh.wav", at: S("bandeja").from + 0.2, vol: 0.5, dur: 1.8 },
  { name: "subida da revelação", src: "audio/riser.wav", at: S("emerge").from + 0.3, vol: 0.3, dur: 4.0, fadeOut: 0.8 },
  { name: "lâmpada vermelha morrendo", src: "audio/bulb_die.wav", at: S("pov").from + S("pov").dur - 0.9, vol: 0.6, dur: 0.9 },
  // preto: SILÊNCIO TOTAL
  { name: "FLASH", src: "audio/flash_pop.wav", at: S("flash").from, vol: 0.9, dur: 2.0 },
  { name: "GRAVE do susto", src: "audio/bass_hit.wav", at: S("flash").from, vol: 1.0, dur: 1.6 },
  { name: "papel mexendo", src: "audio/slosh.wav", at: S("segunda").from + 0.3, vol: 0.3, dur: 1.8 },
  { name: "cama baixa volta", src: "audio/bed.wav", at: S("segunda").from + 0.4, vol: 0.14, dur: S("escolha").from - S("segunda").from, fadeOut: 0.6 },
  { name: "batimento da escolha", src: "audio/pulse.wav", at: S("escolha").from, vol: 0.45, dur: S("escolha").dur, fadeOut: 0.5 },
];

const fadeVol = (base: number, dur: number, fadeOut = 0) => (f: number) => {
  const left = (sec(dur) - f) / Math.max(1, sec(fadeOut));
  return fadeOut > 0 ? base * Math.max(0, Math.min(1, left)) : base;
};

const Som: React.FC = () => (
  <>
    {BEATS.flatMap((b) =>
      b.vo.map((v) => (
        <Sequence key={v.key} name={`Voz · ${v.key}`} from={sec(v.at)} durationInFrames={sec(v.seconds) + 6} layout="none">
          <Audio src={staticFile(`audio/vo/ep01/${v.key}.wav`)} volume={1} />
        </Sequence>
      )),
    )}
    {CUES.map((c, i) => (
      <Sequence key={i} name={`Som · ${c.name}`} from={Math.max(0, sec(c.at))} durationInFrames={Math.max(1, sec(c.dur))} layout="none">
        <Audio src={staticFile(c.src)} volume={fadeVol(c.vol, c.dur, c.fadeOut)} />
      </Sequence>
    ))}
  </>
);

/* ---------------- episódio ---------------- */

export const EP01_DURATION = DURATION;

export const Ep01: React.FC<{ comSom?: boolean }> = ({ comSom = true }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {BEATS.map((b, i) => {
      const View = VIEW[b.id];
      if (!View) return null;
      const next = BEATS[i + 1];
      const overlap = next && next.inT === "dissolve" ? sec(next.inS ?? 0) : 0;
      const isCard = b.id === "escolha" || b.id === "fecho";
      return (
        <Sequence key={b.id} name={`Plano · ${b.id}`} from={sec(b.from)} durationInFrames={sec(b.dur) + overlap} layout="none">
          <ShotWrap b={b}>
            <View />
            {isCard ? null : <Film grain={0.16} vignette={0.8} />}
          </ShotWrap>
        </Sequence>
      );
    })}
    <Hora />
    <Captions words={WORDS} accent={ACCENT} y={1190} />
    {comSom ? <Som /> : null}
  </AbsoluteFill>
);
