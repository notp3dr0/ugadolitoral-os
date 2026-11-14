"""Grade de tempo do showreel. Fonte unica de tempo: todo mundo le tempo.json, ninguem recalcula.
Medido na faixa (adso* - WHOLE BODY (VANDAME)): 134 BPM, primeira batida em 0,218 s.
Conferido nas duas viradas: drop em 14,55 s (batida 32) e virada em 28,87 s (batida 64)."""
import json
FPS = 30; BPM = 134.0; T0 = 0.218; DUR = 32.0
BEAT = 60.0 / BPM
t = lambda b: T0 + b * BEAT
f = lambda b: round(t(b) * FPS)
beats = [{"b": b, "compasso": b // 4 + 1, "tempo_no_compasso": b % 4 + 1, "t": round(t(b), 4), "f": f(b)} for b in range(0, 69)]
oitavas = [{"b": b / 2, "t": round(t(b / 2), 4), "f": f(b / 2)} for b in range(0, 137)]
semis = [{"b": b / 4, "t": round(t(b / 4), 4), "f": f(b / 4)} for b in range(0, 273)]
secoes = [
  {"id": "A", "nome": "estrutura",  "b0": 0,  "b1": 16, "f0": 0,     "f1": f(16), "musica": "so o grave, 4 compassos"},
  {"id": "B", "nome": "revelacao",  "b0": 16, "b1": 32, "f0": f(16), "f1": f(32), "musica": "caixa crescendo; na batida 31 a musica some (respiro)"},
  {"id": "C", "nome": "flash",      "b0": 32, "b1": 64, "f0": f(32), "f1": f(64), "musica": "drop, 8 compassos; na batida 63 a musica some de novo"},
  {"id": "D", "nome": "agenda",     "b0": 64, "b1": 68, "f0": f(64), "f1": round(DUR * FPS), "musica": "virada mais forte por 4 batidas; corta seco na batida 68 e o cartao segura ate o fim"},
]
json.dump({"fps": FPS, "bpm": BPM, "t0": T0, "batida_s": BEAT, "duracao_s": DUR, "quadros": round(DUR * FPS),
           "largura": 1080, "altura": 1920,
           "respiros": [{"b": 31, "f0": round(14.16 * FPS), "f1": f(32)}, {"b": 63, "f0": round(28.49 * FPS), "f1": f(64)}],
           "corte_musica_f": f(68), "secoes": secoes, "batidas": beats, "oitavas": oitavas, "semicolcheias": semis},
          open("tempo.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("batida", BEAT, "s =", BEAT * FPS, "quadros")
print(" ".join(f"b{x['b']}:{x['f']}" for x in beats))
