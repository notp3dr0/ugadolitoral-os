import { Composition } from "remotion";
import { EpisodioDemo } from "./scenes/EpisodioDemo";
import { DURATION } from "./data/episode";
import { Ep01, EP01_DURATION } from "./episodios/ep01/Ep01";
import { FPS, H, W } from "./theme";
import { BonecoTeste } from "./scenes/BonecoTeste";

// Uma <Composition> por episódio. "EpisodioDemo" é a demo técnica herdada do template.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ep01" component={Ep01} durationInFrames={EP01_DURATION} fps={FPS} width={W} height={H} defaultProps={{ comSom: true }} />
    <Composition id="Boneco" component={BonecoTeste} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="EpisodioDemo" component={EpisodioDemo} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
  </>
);
