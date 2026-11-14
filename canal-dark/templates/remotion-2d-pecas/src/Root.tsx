import { Composition } from "remotion";
import { EpisodioDemo } from "./scenes/EpisodioDemo";
import { DURATION } from "./data/episode";
import { FPS, H, W } from "./theme";

// Em série real: uma <Composition> por episódio, id "EpNN", duração vinda do contrato do episódio.
export const RemotionRoot: React.FC = () => (
  <Composition id="EpisodioDemo" component={EpisodioDemo} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
