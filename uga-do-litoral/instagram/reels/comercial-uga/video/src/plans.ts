import type {Move} from './components/DepthPhoto';

// Os planos do roteiro v2.2 (roteiro.md), em beats. `at` = beat de entrada, `len` = beats na tela.
export type Shot =
  | {kind: 'photo'; at: number; len: number; name: string; move: Move; label?: string; labelDark?: boolean; leak?: boolean}
  | {kind: 'text'; at: number; len: number; text: string; bg: 'black' | 'off'}
  | {kind: 'swap'; at: number; len: number; words: string[]; photo?: {name: string; move: Move; dim: number}}
  | {kind: 'wall'; at: number; len: number}
  | {kind: 'agenda'; at: number; lock: number; handle: number};

export type Plan = {id: string; bpm: number; frames: number; music: string; sfx: string; shots: Shot[]};

const WORDS = ['FOTOGRAFIA.', 'VÍDEO.', 'EDIÇÃO.'];

// 120 BPM, 13 compassos: golpe no beat 52 (frame 780). 900 frames = 30 s.
export const PLAN_30: Plan = {
  id: 'Comercial30',
  bpm: 120,
  frames: 900,
  music: 'audio30/music.wav',
  sfx: 'audio30/sfx',
  shots: [
    {kind: 'photo', at: 0, len: 8, name: 'img3761', move: 'push', label: 'PÚBLICO'},
    {kind: 'text', at: 8, len: 2, text: 'O show acaba.', bg: 'black'},
    {kind: 'photo', at: 10, len: 3, name: 'brandao', move: 'push', label: 'BRANDÃO', labelDark: true},
    {kind: 'text', at: 13, len: 3, text: 'A foto fica.', bg: 'off'},
    {kind: 'photo', at: 16, len: 3, name: 'alee', move: 'push', label: 'ALEE', leak: true},
    {kind: 'photo', at: 19, len: 2, name: 'derek', move: 'tiltUp'},
    {kind: 'photo', at: 21, len: 2, name: 'inflavel-escuro', move: 'push'},
    {kind: 'photo', at: 23, len: 2, name: 'kayblack', move: 'pull', leak: true},
    {kind: 'swap', at: 25, len: 6, words: WORDS},
    {kind: 'photo', at: 31, len: 5, name: 'img0909', move: 'panRight'},
    {kind: 'photo', at: 36, len: 4, name: 'phl', move: 'drift'},
    {kind: 'photo', at: 40, len: 4, name: 'inflavel-claro', move: 'push', leak: true},
    {kind: 'photo', at: 44, len: 2, name: 'rosa', move: 'push'},
    {kind: 'wall', at: 46, len: 4},
    {kind: 'agenda', at: 50, lock: 52, handle: 54},
  ],
};

// 144 BPM, 8 compassos: golpe no beat 32 (frame 400). 450 frames = 15 s.
export const PLAN_15: Plan = {
  id: 'Comercial15',
  bpm: 144,
  frames: 450,
  music: 'audio15/music.wav',
  sfx: 'audio15/sfx',
  shots: [
    {kind: 'photo', at: 0, len: 6, name: 'img3761', move: 'push'},
    {kind: 'text', at: 6, len: 2, text: 'O show acaba.', bg: 'black'},
    {kind: 'photo', at: 8, len: 2, name: 'brandao', move: 'push'},
    {kind: 'text', at: 10, len: 2, text: 'A foto fica.', bg: 'off'},
    {kind: 'photo', at: 12, len: 2, name: 'alee', move: 'push', leak: true},
    {kind: 'photo', at: 14, len: 2, name: 'img0909', move: 'panRight'},
    {kind: 'swap', at: 16, len: 8, words: WORDS, photo: {name: 'phl', move: 'drift', dim: 0.55}},
    {kind: 'photo', at: 24, len: 2, name: 'kayblack', move: 'pull', leak: true},
    {kind: 'photo', at: 26, len: 2, name: 'inflavel-escuro', move: 'push'},
    {kind: 'wall', at: 28, len: 2},
    {kind: 'agenda', at: 30, lock: 32, handle: 33},
  ],
};
