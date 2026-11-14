import { Color } from "three";
import { useCurrentFrame } from "remotion";
import { lerp } from "../utils/animation";
import { cameraPoseAt } from "./CameraController";
import { goldenness, nightness, skyColors } from "../world/time";

// Luz da cidade pela hora: dia de garoa (difusa, cinza-clara), ouro no amanhecer, noite azul com pouca chave.
export const Lighting: React.FC<{ shadowExtent?: number }> = ({ shadowExtent = 9 }) => {
  const frame = useCurrentFrame();
  const n = nightness(frame);
  const g = goldenness(frame);
  const key = new Color("#fff6ea").lerp(new Color("#ffb070"), g).lerp(new Color("#8ea6ff"), n);
  const fog = skyColors(frame)[2];
  // neblina acompanha a distância da câmera: perto lê tudo, longe a cidade some na garoa
  const pose = cameraPoseAt(frame);
  const camDist = Math.hypot(pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]);
  return (
    <>
      <fog attach="fog" args={[fog, camDist + 6, camDist * 2.4 + 26]} />
      <ambientLight intensity={lerp(0.75, 0.26, n)} />
      <hemisphereLight args={[n > 0.5 ? "#5a6fb0" : "#dfe6ea", "#4a4640", lerp(1.0, 0.42, n)]} />
      <directionalLight
        position={[7, 14, 10]}
        intensity={lerp(2.1, 0.55, n)}
        color={key}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-10, 6, 8]} intensity={lerp(0.55, 0.35, n)} color={n > 0.5 ? "#7f95ff" : "#d6e4ff"} />
      <directionalLight position={[-3, 8, -12]} intensity={0.45} color="#ffffff" />
    </>
  );
};
