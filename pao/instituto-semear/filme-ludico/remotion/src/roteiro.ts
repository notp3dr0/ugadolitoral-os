// Locução (Gemini, voz Sulafat, a mesma do filme institucional), na velocidade natural.
// Tempos das palavras: Whisper do Remotion, corrigido pro texto do roteiro. Em ms a partir do começo de cada fala.
// `|` quebra o bloco da legenda. O vídeo se ajusta à voz: cada fala começa depois da anterior + um respiro.
export type Fala = { id: string; ini: number; dur: number; legenda: boolean; palavras: [string, number][] };

const RESPIRO = 0.65; // silêncio entre uma fala e a próxima
const BASE: Omit<Fala, "ini">[] = [
  { id: "n1", dur: 3.41, legenda: true, palavras: [["Passar", 380], ["no", 600], ["vestibular…", 800], ["|", 0], ["é", 1600], ["só", 2040], ["o", 2160], ["tutorial.", 2500]] },
  { id: "n2", dur: 3.0, legenda: true, palavras: [["A", 380], ["fase", 660], ["difícil", 1180], ["|", 0], ["é", 1540], ["chegar", 1740], ["até", 2060], ["o", 2160], ["fim.", 2340]] },
  { id: "n3", dur: 6.2, legenda: true, palavras: [["Passagem,", 580], ["xerox,", 1560], ["aluguel…", 2460], ["|", 0], ["e", 3480], ["o", 3600], ["chefão:", 3860], ["|", 0], ["o", 4680], ["fim", 5000], ["do", 5300], ["mês.", 5500]] },
  { id: "n4", dur: 3.52, legenda: true, palavras: [["Por", 380], ["isso", 680], ["o", 1100], ["Semear", 1200], ["|", 0], ["libera", 1780], ["três", 2340], ["power-ups.", 2600]] },
  { id: "n5", dur: 2.08, legenda: true, palavras: [["Bolsa:", 580], ["segura", 1080], ["o", 1400], ["mês.", 1620]] },
  { id: "n6", dur: 2.44, legenda: true, palavras: [["Mentoria:", 460], ["mostra", 1480], ["o", 1740], ["mapa.", 1900]] },
  { id: "n7", dur: 2.73, legenda: true, palavras: [["Rede:", 560], ["ninguém", 1120], ["joga", 1640], ["sozinho.", 1920]] },
  { id: "n8", dur: 3.2, legenda: true, palavras: [["Fase", 440], ["final:", 1100], ["diploma", 1820], ["na", 2440], ["mão.", 2680]] },
  { id: "n9", dur: 4.04, legenda: false, palavras: [["Instituto", 480], ["Semear.", 1060], ["Ninguém", 2060], ["zera", 2680], ["essa", 3100], ["sozinho.", 3340]] },
];
// respiro extra antes da fala 9: a árvore precisa de tempo pra se montar
const EXTRA: Record<string, number> = { n9: 0.7, n4: 0.3 };

let t = 0.5;
export const FALAS: Fala[] = BASE.map((f) => {
  t += EXTRA[f.id] ?? 0;
  const fala = { ...f, ini: +t.toFixed(2) };
  t += f.dur + RESPIRO;
  return fala;
});
const ini = (id: string) => FALAS.find((f) => f.id === id)!.ini;
const fim = (id: string) => { const f = FALAS.find((x) => x.id === id)!; return f.ini + f.dur; };

// cenas (segundos): cada cena começa um pouco antes da sua fala
const ANTES = 0.35;
export const CENAS = {
  gancho: [0, ini("n2") - ANTES],
  mapa: [ini("n2") - ANTES, ini("n3") - ANTES],
  obstaculos: [ini("n3") - ANTES, ini("n4") - ANTES],
  caixas: [ini("n4") - ANTES, ini("n5") - ANTES],
  bolsa: [ini("n5") - ANTES, ini("n6") - ANTES],
  mentoria: [ini("n6") - ANTES, ini("n7") - ANTES],
  rede: [ini("n7") - ANTES, ini("n8") - ANTES],
  final: [ini("n8") - ANTES, ini("n9") - ANTES],
  marca: [ini("n9") - ANTES, fim("n9") + 2.2],
} as const;
export const DURACAO = CENAS.marca[1];

// segundo absoluto de uma palavra
export const quando = (id: string, palavra: string) => {
  const f = FALAS.find((x) => x.id === id)!;
  const p = f.palavras.find(([w]) => w.toLowerCase().startsWith(palavra.toLowerCase()))!;
  return f.ini + p[1] / 1000;
};
// frame, dentro de uma cena, em que uma palavra é dita
export const naCena = (cena: keyof typeof CENAS, id: string, palavra: string, fps = 30) => Math.round((quando(id, palavra) - CENAS[cena][0]) * fps);
