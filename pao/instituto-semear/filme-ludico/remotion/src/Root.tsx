import { Composition } from "remotion";
import { SoTutorial } from "./SoTutorial";
import { DURACAO } from "./roteiro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SoTutorial"
      component={SoTutorial}
      durationInFrames={Math.round(DURACAO * 30)}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
