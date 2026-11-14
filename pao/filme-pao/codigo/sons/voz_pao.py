"""Sons vocais do PAÓ gerados no VoiceStudio (API local, http://localhost:3900).
Sem locução: só reações não verbais (tags nativas do motor) com uma voz desenhada.
Uso: python -I sons/voz_pao.py   → sons/voz/<nome>-<seed>.wav
"""
import json, os, urllib.request

URL = "http://localhost:3900/v1/audio/speech"
VOZ = "male, child, very high pitch"
AQUI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voz")
os.makedirs(AQUI, exist_ok=True)

TOMADAS = {
    "pao-hm": "[dissatisfaction-hnn]",
    "pao-hnn": "[dissatisfaction-hnn] [dissatisfaction-hnn]",
    "pao-suspiro": "[sigh]",
    "pao-susto": "[surprise-oh]",
    "pao-surpresa": "[surprise-ah]",
    "pao-oh": "[surprise-oh]",
    "pao-uau": "[surprise-wa]",
    "pao-riso": "[laughter]",
    "pao-choro": "[sigh] [pause 150ms] [sigh]",
    "pao-ofego": "[sigh] [pause 120ms] [sigh] [pause 120ms] [sigh]",
}

for nome, txt in TOMADAS.items():
    for seed in (7, 21):
        alvo = os.path.join(AQUI, f"{nome}-{seed}.wav")
        if os.path.exists(alvo):
            continue
        corpo = json.dumps({"model": "tts-1", "voice": "alloy", "input": txt, "instruct": VOZ,
                            "response_format": "wav", "seed": seed}).encode()
        req = urllib.request.Request(URL, corpo, {"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=240) as r:
            dados = r.read()
        if dados[:4] != b"RIFF":
            print("falhou:", nome, seed, dados[:200]); continue
        open(alvo, "wb").write(dados)
        print("ok:", nome, seed, len(dados))
