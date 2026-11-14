// Grade de beats (mesma conta do beat.ts da skill apple-motion). Tudo em frames.
export type BeatGrid = {bpm: number; fps: number; beat: number};

export const beatGrid = (bpm: number, fps: number): BeatGrid => ({bpm, fps, beat: (60 / bpm) * fps});

/** Frame do beat n (0-based), arredondado. Frações valem: onBeat(g, 2.5). */
export const onBeat = (g: BeatGrid, n: number): number => Math.round(n * g.beat);
