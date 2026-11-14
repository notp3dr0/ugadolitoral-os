import { Composition } from "remotion";
import { Video } from "./Video";
import { TOTAL, FPS } from "./timeline";
import { Prova } from "./v2/Prova";
import { FIM } from "./v2/beats";

export const Root = () => (
  <>
    <Composition id="JG" component={Video} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="PROVA" component={Prova} durationInFrames={Math.ceil(FIM * 30)} fps={30} width={1080} height={1920} />
  </>
);
