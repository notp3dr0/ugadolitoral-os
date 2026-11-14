import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Camera2D } from "../engine/Camera2D";
import { Captions } from "../engine/Captions";
import { FadeBlack, Film, Flash, Shards, Smoke } from "../engine/Fx";
import { ClockBadge, TitleCard } from "../engine/Hud";
import { Dust, Flashlight, LightBeam } from "../engine/Light";
import { LOOK_GHOUL, LOOK_HERO, POSE, Puppet, blend, walkPose } from "../engine/Puppet";
import { CorridorSet, DoorDetail, HordeWide, ROOM, RoomSet, SteelDoor, StreetDusk, WindowGapScare } from "../sets/Sets";
import { FINAL_ACCENT, SHOTS, WORDS, ShotDef } from "../data/episode";
import { EASE, prog, sec } from "../utils/anim";
import { FPS, H, PAL, W } from "../theme";
import { Soundtrack } from "../audio/Soundtrack";

// Episódio de DEMONSTRAÇÃO. Existe pra provar cada recurso do motor, um por plano.
// Conteúdo e personagens aqui são genéricos: a série real troca os planos e mantém o motor.

const HERO_RIM = { ...LOOK_HERO, rim: `${FINAL_ACCENT}b0` };

/* ---- planos ---- */

const PlanoPorta: React.FC = () => (
  <Camera2D
    keys={[
      { f: 0, x: 540, y: 700, zoom: 1.35 },
      { f: 66, x: 540, y: 980, zoom: 1.12, ease: "soft" },
    ]}
  >
    <DoorDetail />
  </Camera2D>
);

const PlanoQuarto: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame / 18) * 1.6;
  const hero = blend(POSE.stand, { ...POSE.stand, lean: 3, neck: 4 }, 0.5 + breathe / 3);
  return (
    <Camera2D
      worldW={ROOM.w}
      keys={[
        { f: 0, x: 780, y: 1010, zoom: 1.0 },
        { f: 90, x: 930, y: 940, zoom: 1.28, ease: "soft" },
      ]}
    >
      <RoomSet>
        <Puppet x={700} y={ROOM.floorY} pose={hero} look={HERO_RIM} />
      </RoomSet>
      <LightBeam from={[1070, 690]} to={[860, 1500]} w0={300} w1={560} />
      <Dust box={[760, 560, 520, 940]} count={44} seed="quarto" />
    </Camera2D>
  );
};

const PlanoRua: React.FC = () => {
  const frame = useCurrentFrame();
  const total = sec(4.8);
  const pan = prog(frame, 0, total, EASE.linear);
  const dark = prog(frame, sec(2.6), total, EASE.soft);
  const hero = walkPose(frame / 26, 0.9);
  return (
    <>
      <Camera2D keys={[{ f: 0, zoom: 1.0 }, { f: total, zoom: 1.08, ease: "linear" }]}>
        <StreetDusk pan={pan} darkness={dark * 0.9} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Puppet x={380 + pan * 120} y={1300} scale={0.62} pose={hero} look={{ ...LOOK_HERO, rim: null }} />
        </svg>
      </Camera2D>
      {/* aviso visual antes do susto: vinheta vermelha crescendo */}
      <Film tint={PAL.blood} tintOpacity={prog(frame, sec(3.8), total, EASE.in) * 0.55} />
    </>
  );
};

const PlanoSusto: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Camera2D hit={{ f: 3, amp: 26, dur: 16 }} keys={[{ f: 0, zoom: 1.0 }]}>
        <WindowGapScare rise={prog(frame, 0, 4, EASE.hit)} />
      </Camera2D>
      <Flash at={3} dur={7} peak={0.8} />
    </>
  );
};

const PlanoTiro: React.FC = () => {
  const frame = useCurrentFrame();
  const aim = blend(POSE.stand, POSE.aim, prog(frame, 0, 8, EASE.out));
  const pose = frame >= 18 ? blend(POSE.recoil, POSE.aim, prog(frame, 18, 30, EASE.hit)) : aim;
  const broken = frame >= 18 ? 3 : 0;
  const rifle = (
    <g>
      <rect x={-8} y={-30} width={16} height={178} rx={4} fill="#2a2a38" stroke={PAL.ink} strokeWidth={3} />
      <rect x={-12} y={-44} width={24} height={56} rx={8} fill="#4a3a2a" stroke={PAL.ink} strokeWidth={3} />
    </g>
  );
  return (
    <>
      <Camera2D worldW={ROOM.w} hit={{ f: 18, amp: 14, dur: 12 }} keys={[{ f: 0, x: 800, y: 1000, zoom: 1.0 }, { f: 54, x: 840, y: 990, zoom: 1.08 }]}>
        <RoomSet broken={broken}>
          <Puppet x={520} y={ROOM.floorY} pose={pose} look={HERO_RIM} hand={rifle} />
        </RoomSet>
        <LightBeam from={[1070, 690]} to={[860, 1500]} w0={300} w1={560} opacity={0.3} />
      </Camera2D>
      {/* efeitos em coordenadas de tela (câmera ~ x800,y1000: tela = mundo - (260, 40)) */}
      <Shards x={800} y={780} at={18} count={26} power={1.1} />
      <Smoke x={500} y={1210} at={18} />
      <Flash at={18} dur={5} peak={0.35} color="#ffe6b0" />
    </>
  );
};

const PlanoPov: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame;
  return (
    <>
      <Camera2D shake={5} keys={[{ f: 0, zoom: 1.0 }, { f: sec(2.0), zoom: 1.16, ease: "linear" }]}>
        <CorridorSet>
          {/* algo se mexe ao fundo, quase invisível */}
          <Puppet x={540} y={1010} scale={0.2} pose={blend(POSE.crawl, { ...POSE.crawl, armF: [-70, -8] }, 0.5 + 0.5 * Math.sin(t / 7))} look={LOOK_GHOUL} />
        </CorridorSet>
      </Camera2D>
      <Flashlight x={360} y={1760} angle={-82} length={1700} spread={14} />
      <PovHands />
    </>
  );
};

/** Mãos em primeira pessoa no rodapé: uma com lanterna, outra com a arma. */
const PovHands: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g stroke={PAL.ink} strokeWidth={4}>
      <rect x={270} y={1710} width={90} height={26} rx={10} fill="#2b2b3a" transform="rotate(-82 360 1740)" />
      <circle cx={338} cy={1790} r={42} fill={PAL.skin} />
      <rect x={640} y={1500} width={34} height={320} rx={10} fill="#262634" transform="rotate(8 657 1660)" />
      <circle cx={700} cy={1800} r={48} fill={PAL.skin} />
      <rect x={560} y={1860} width={420} height={120} rx={50} fill={PAL.cloth} />
      <rect x={100} y={1860} width={400} height={120} rx={50} fill={PAL.cloth} />
    </g>
  </svg>
);

const PlanoPorta2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Camera2D hit={{ f: 14, amp: 10, dur: 14 }} shake={3} keys={[{ f: 0, x: 540, y: 960, zoom: 1.0 }, { f: sec(2.8), x: 540, y: 930, zoom: 1.1, ease: "linear" }]}>
        <SteelDoor eyes={prog(frame, 14, 62, EASE.linear)} />
      </Camera2D>
      <Flashlight x={300} y={1800} angle={-62} length={1900} spread={19} dark={0.8} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g stroke={PAL.ink} strokeWidth={4}>
          <rect x={560} y={1660} width={150} height={44} rx={10} fill="#262634" transform="rotate(-48 640 1680)" />
          <circle cx={690} cy={1790} r={50} fill={PAL.skin} />
          <rect x={560} y={1840} width={420} height={140} rx={56} fill={PAL.cloth} />
        </g>
      </svg>
    </>
  );
};

const PlanoGeral: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Camera2D keys={[{ f: 0, x: 540, y: 1250, zoom: 1.5 }, { f: sec(1.8), x: 540, y: 960, zoom: 1.0, ease: "out" }]}>
      <HordeWide reveal={prog(frame, 0, 40, EASE.linear)} />
    </Camera2D>
  );
};

const PlanoTitulo: React.FC = () => <TitleCard title="Título da série" sub="em breve" tag="template 2D · peças" accent={FINAL_ACCENT} />;

const SHOT_VIEW: Record<string, React.FC> = {
  porta: PlanoPorta,
  quarto: PlanoQuarto,
  rua: PlanoRua,
  susto: PlanoSusto,
  tiro: PlanoTiro,
  pov: PlanoPov,
  porta2: PlanoPorta2,
  geral: PlanoGeral,
  titulo: PlanoTitulo,
};

/* ---- montagem: cada plano vira uma Sequence com a transição que o contrato pede ---- */

const ShotWrap: React.FC<{ shot: ShotDef; children: React.ReactNode; total: number }> = ({ shot, children, total }) => {
  const frame = useCurrentFrame();
  const inF = sec(shot.inS ?? 0);
  const dissolve = shot.inT === "dissolve" ? prog(frame, 0, inF, EASE.soft) : 1;
  return (
    <AbsoluteFill style={{ opacity: dissolve, background: PAL.night0 }}>
      {children}
      <FadeBlack total={total} inF={shot.inT === "fadeblack" ? inF : 0} outF={sec(shot.outBlack ?? 0)} />
    </AbsoluteFill>
  );
};

export const EpisodioDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const showClock = frame > sec(2.2) && frame < sec(10.0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((shot, i) => {
        const View = SHOT_VIEW[shot.id];
        const next = SHOTS[i + 1];
        const overlap = next && next.inT === "dissolve" ? sec(next.inS ?? 0) : 0;
        const dur = sec(shot.dur) + overlap;
        return (
          <Sequence key={shot.id} name={`Plano · ${shot.id}`} from={sec(shot.from)} durationInFrames={dur} layout="none">
            <ShotWrap shot={shot} total={sec(shot.dur)}>
              <View />
              {shot.id !== "titulo" ? <Film grain={0.16} vignette={0.78} /> : null}
            </ShotWrap>
          </Sequence>
        );
      })}
      {showClock ? <ClockBadge time="03:17" label="dia 1" /> : null}
      <Captions words={WORDS} accent={FINAL_ACCENT} />
      <Soundtrack />
    </AbsoluteFill>
  );
};

export const FPS_DEMO = FPS;
