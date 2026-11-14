"""Gera locução no VoiceStudio local (127.0.0.1:3900, motor OmniVoice, roda na GPU desta máquina, sem custo por uso).
Uso: python gerar-voz.py <saida.wav> "<texto>" [instruct] [seed] [speed]
Ex.:  python gerar-voz.py voz/hook.wav "Todo grupo de amigos tem um João Gabriel." "male, low pitch" 7 1.0
"""
import os, sys, json, urllib.request, urllib.error, wave, io

saida, texto = sys.argv[1], sys.argv[2]
instruct = sys.argv[3] if len(sys.argv) > 3 else "male, low pitch"
seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0

voz = os.environ.get("JG_VOZ")  # id de perfil do VoiceStudio (ex.: d2669c06 = joao gabriel, clone)
corpo = {"model": "omnivoice", "input": texto, "language": "pt", "instruct": instruct,
         "seed": seed, "speed": speed, "response_format": "wav"}
if voz:
    corpo["voice"] = voz
    corpo.pop("instruct")
req = urllib.request.Request("http://127.0.0.1:3900/v1/audio/speech", data=json.dumps(corpo).encode(),
                             headers={"Content-Type": "application/json"})
try:
    dados = urllib.request.urlopen(req, timeout=600).read()
except urllib.error.HTTPError as e:
    sys.exit(f"VoiceStudio respondeu {e.code}: {e.read().decode()[:300]}")
except urllib.error.URLError:
    sys.exit("VoiceStudio não está respondendo em 127.0.0.1:3900. Abra o app e tente de novo.")
open(saida, "wb").write(dados)
with wave.open(io.BytesIO(dados)) as w:
    print(saida, round(w.getnframes() / w.getframerate(), 2), "s")
