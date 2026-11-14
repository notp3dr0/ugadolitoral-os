"""Efeitos sonoros pelo ElevenLabs (sound-generation). Gera public/audio/sfx/<nome>.wav (48 kHz mono).
A chave vem de .env (ELEVENLABS_API_KEY), nunca é impressa.
Uso: python scripts/sfx_eleven.py            -> gera os que faltam
     python scripts/sfx_eleven.py flash crack -> regera só esses
"""
import json, subprocess, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "public" / "audio" / "sfx"; OUT.mkdir(parents=True, exist_ok=True)
KEY = next(l.split("=", 1)[1].strip().strip('"') for l in (ROOT / ".env").read_text(encoding="utf-8").splitlines() if l.startswith("ELEVENLABS_API_KEY="))

# nome: (descrição em inglês, duração em s)
SFX = {
    "crowd-bed": ("small crowded concert venue ambience, people cheering, muffled rap beat far away, no clear music", 6.0),
    "flash": ("camera flash firing, quick high pitched charge whine and bright pop", 0.8),
    "shutter": ("DSLR camera shutter click, single crisp mechanical shot", 0.5),
    "badge": ("soft clean UI pop, short bubbly interface notification", 0.5),
    "badge-big": ("bold cinematic UI hit with a soft whoosh, title card appearing", 1.2),
    "pop": ("cartoon pop, soft and playful", 0.5),
    "rewind": ("VHS tape rewinding fast, high pitched squeal sweeping, cartoon rewind", 2.0),
    "price": ("old cash register cha-ching, comedic", 1.0),
    "oven-ding": ("bakery oven timer ding, single bright bell", 1.0),
    "phone-ring": ("office desk phone ringing twice, call center", 1.6),
    "coin": ("single coin dropping into a ceramic piggy bank, clink", 0.6),
    "coin-pile": ("handful of coins pouring into a piggy bank", 1.2),
    "shout-muffled": ("angry customer yelling through a telephone headset, muffled and distorted, unintelligible", 1.5),
    "card": ("credit card tap on payment terminal, approved beep", 0.8),
    "crack": ("ceramic piggy bank smashing and shattering on the floor, coins scattering", 1.2),
    "choir": ("angelic choir singing a single heavenly aah chord with sparkle, divine revelation, comedic", 2.6),
    "crickets": ("crickets chirping in awkward silence, comedic", 2.2),
    "neon-buzz": ("neon sign flickering on, electric buzz and clicks", 1.0),
    "frame-drop": ("heavy golden picture frame dropping and landing with a wooden thud and shimmer", 1.0),
    "coin-bounce": ("single coin falling on a concrete floor, bouncing and spinning to a stop", 1.4),
    "clock-tick": ("fast clock ticking, time passing quickly, time-lapse", 1.6),
    "whoosh-soft": ("soft quick whoosh, camera movement transition", 0.7),
    "scissors": ("scissors cutting paper, two quick snips", 0.6),
    "paper-whoosh": ("several paper airplanes whooshing past quickly", 1.0),
    "seen-blip": ("soft dull message read notification blip, slightly sad", 0.5),
    "lanyard-drop": ("plastic badge on lanyard dropping onto chest, plastic clack", 0.6),
    "sparkle": ("magical sparkle shimmer, short", 0.8),
    "error-buzz": ("payment terminal error, card declined double buzz beep", 0.8),
    "turnstile": ("bus turnstile locked, metal clunk and error beep", 0.9),
    "door-slam": ("door slammed shut hard, backstage door", 0.8),
    "page-flip": ("calendar page flipping quickly", 0.5),
    "msg-pop": ("phone message notification pop, instant messenger", 0.5),
    "heart-pops": ("series of soft bubbly pops, like notifications, playful", 1.2),
    "coin-sad": ("one lonely coin dropping on a table, small and sad", 0.8),
    "hit-final": ("deep cinematic boom hit, impact with short reverb tail", 1.6),
    "alarm": ("old alarm clock ringing loudly at 5am", 1.8),
}

def gen(name, text, dur):
    body = {"text": text, "duration_seconds": dur, "prompt_influence": 0.5, "model_id": "eleven_text_to_sound_v2"}
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers={"xi-api-key": KEY, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code} em {name}: {e.read().decode()[:300]}")
    mp3 = OUT / f"{name}.mp3"; mp3.write_bytes(data)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "1", str(OUT / f"{name}.wav")], check=True)
    print("ok", name)

only = sys.argv[1:]
for name, (text, dur) in SFX.items():
    if only and name not in only: continue
    if not only and (OUT / f"{name}.wav").exists(): continue
    gen(name, text, dur)
