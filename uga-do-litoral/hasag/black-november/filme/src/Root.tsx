import React from "react";
import {Composition} from "remotion";
import {Filme} from "./Filme";

// HASAG · Black November · vertical 1080x1920, 24 fps, 19 s (456 frames), 144 BPM.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="BlackNovember" component={Filme} durationInFrames={456} fps={24} width={1080} height={1920} />
    </>
  );
};
