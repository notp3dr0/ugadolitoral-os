import { AbsoluteFill } from "remotion";
import { LOOK_GHOUL, LOOK_VOCE, POSE, Puppet, walkPose } from "../engine/Puppet";
import { PAL } from "../theme";

// Folha de teste do boneco: várias poses lado a lado, pra revisar o desenho antes de animar.
export const BonecoTeste: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(#1c2140, #0d0f1f)" }}>
    <svg width={1080} height={1920}>
      <rect y={900} width={1080} height={6} fill="#0a0a14" />
      <rect y={1800} width={1080} height={6} fill="#0a0a14" />
      <Puppet x={170} y={900} scale={1.15} pose={POSE.stand} look={LOOK_VOCE} />
      <Puppet x={530} y={900} scale={1.15} pose={walkPose(0.25, 1)} look={LOOK_VOCE} />
      <Puppet x={850} y={900} scale={1.15} pose={{ ...POSE.stand, armF: [62, 34], neck: 6 }} look={LOOK_VOCE} hand={<rect x={-30} y={0} width={70} height={80} fill="#d8a89c" stroke={PAL.ink} strokeWidth={3} />} />
      <Puppet x={170} y={1800} scale={1.15} pose={POSE.stand} look={{ ...LOOK_VOCE, back: true }} />
      <Puppet x={470} y={1800} scale={1.15} pose={POSE.aim} look={LOOK_VOCE} hand={<rect x={-7} y={-30} width={14} height={170} rx={4} fill="#2a2a38" stroke={PAL.ink} strokeWidth={3} />} />
      <Puppet x={700} y={1800} scale={1.15} pose={POSE.crawl} look={LOOK_GHOUL} />
    </svg>
  </AbsoluteFill>
);
