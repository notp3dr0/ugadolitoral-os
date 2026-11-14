import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { AUDIO_READY, CUES } from "../data/episode";
import { sec } from "../utils/anim";

// Toca os cues do contrato do episódio. A mixagem é decidida em dados (episode.ts), não aqui.
// Regra de som da série: silêncio total antes do susto; grave só no impacto; cama baixa o resto do tempo.

export const Soundtrack: React.FC = () => {
  if (!AUDIO_READY) return null;
  return (
    <>
      {CUES.map((c, i) => (
        <Sequence key={`${c.src}-${i}`} name={`Som · ${c.note}`} from={sec(c.at)} durationInFrames={sec(c.dur ?? 4)} layout="none">
          <Audio src={staticFile(c.src)} volume={c.vol} />
        </Sequence>
      ))}
    </>
  );
};
