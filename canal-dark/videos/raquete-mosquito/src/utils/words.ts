import { SCENE_FRAMES, VO_KEYS, wordLocal, type VoKey } from "./timing";

/** Frame GLOBAL em que a palavra `index` da fala `key` começa. */
export const W_GLOBAL = (key: VoKey, index: number) => SCENE_FRAMES[VO_KEYS.indexOf(key)].from + wordLocal(key, index);
