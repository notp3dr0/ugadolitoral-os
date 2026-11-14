import { Composition } from "remotion";
import { Folha } from "./Folha";
import { Piloto, PILOTO_TOTAL } from "./Piloto";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Piloto169" component={Piloto} durationInFrames={PILOTO_TOTAL} fps={30} width={1920} height={1080} />
    <Composition id="Piloto916" component={Piloto} durationInFrames={PILOTO_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Folha" component={Folha} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
