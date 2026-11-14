import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Soundtrack } from "./audio/Soundtrack";
import { AnimatedCaptions } from "./components/AnimatedCaptions";
import { Background } from "./components/Background";
import { CameraController } from "./components/CameraController";
import { Lighting } from "./components/Lighting";
import { FREEZE_AT } from "./components/optics";
import { PhotoCard } from "./components/PhotoCard";
import { BadgeLayer } from "./components/TechnicalBadge";
import { World } from "./components/World";
import { scenes, track } from "./data/scenes";
import { MODULES } from "./scenes/Scenes";
import { CAMERA } from "./theme";

// Orquestra o vídeo a partir do array tipado de cenas (src/data/scenes.ts):
// um canvas 3D com a câmera em corte + camadas 2D (rótulos, card de resultado, badges, legendas) e áudio.

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = track("fade", frame);
  if (fade <= 0.001) return null;
  return <AbsoluteFill style={{ background: "#050505", opacity: fade }} />;
};

/** Flash branco do clique (só depois do primeiro "congela": antes disso a trilha valeria 1). */
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < FREEZE_AT) return null;
  const k = track("flash", frame);
  if (k <= 0.001) return null;
  return <AbsoluteFill style={{ background: "#ffffff", opacity: k * 0.85 }} />;
};

export const MainSequence: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <Background />
      <ThreeCanvas width={width} height={height} gl={{ antialias: true }} shadows="percentage" flat camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [8, 6, 30] }}>
        <CameraController />
        <Lighting shadowExtent={14} />
        <World />
      </ThreeCanvas>
      {scenes.map((sc) => {
        const Overlay = MODULES[sc.id]?.Overlay;
        return Overlay ? (
          <Sequence key={sc.id} name={sc.id} from={sc.startFrame} durationInFrames={sc.durationInFrames}>
            <Overlay scene={sc} />
          </Sequence>
        ) : null;
      })}
      <PhotoCard />
      {scenes.map((sc) => (
        <Sequence key={`b-${sc.id}`} name={`badges · ${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationInFrames}>
          <BadgeLayer badges={sc.badges} />
        </Sequence>
      ))}
      <AnimatedCaptions />
      <Flash />
      <FadeOut />
      <Soundtrack />
    </AbsoluteFill>
  );
};
