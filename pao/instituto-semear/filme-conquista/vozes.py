# Vozes do filme via ElevenLabs (vozes-guia em PT-BR, provisórias até os depoimentos autorizados).
# Lê as falas de cues.json, gera audio/vozes/<arquivo>.wav (48 kHz) e audio/vozes/boca.json
# (abertura da boca por quadro, 24 fps, pra animação acompanhar a fala).
# A chave vem de .env.local (ELEVENLABS_API_KEY), nunca do código.
# Uso: python vozes.py                -> gera as que faltam
#      python vozes.py advogado-1     -> regera só essa fala
import json, os, subprocess, sys
import numpy as np, soundfile as sf
from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings

AQUI = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(AQUI, '.env.local'))
CUES = json.load(open(os.path.join(AQUI, 'cues.json'), encoding='utf8'))
PASTA = os.path.join(AQUI, 'audio', 'vozes'); os.makedirs(PASTA, exist_ok=True)

ELENCO = {  # plano grátis: só vozes padrão pela API (biblioteca e Voice Design exigem plano pago)
    'pesquisadora': ('hpp4J3VqNfWAUOO0d1Us', 0.42),  # Bella (padrão)
    'advogado': ('iP95p4xoKVk53GoZ742B', 0.42),      # Chris (padrão)
    'bolsista': ('cgSgspJ2msm6clMCkdW9', 0.38),      # Jessica (padrão)
    'locucao': ('cjVigY5qzO86Huf0OWal', 0.62),       # Eric (padrão)
}
# com plano pago, as vozes brasileiras escolhidas na biblioteca:
# pesquisadora BQzELs93jJsUOf5rCb9p (Vanessa) · advogado mQTtm28IjDcoO2sbXmov (Filipe)
# bolsista n2a9VtkZLl8j1FSXHsL7 (Sofia) · locução sJfod1k0iiI5CA9IP0R2 (Johnes Bittar)

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])  # o SDK lê o ambiente na importação, antes do .env.local
so = sys.argv[1:]
for v in CUES['vozes']:
    nome, quem = v['arquivo'], v['quem']
    wav = os.path.join(PASTA, nome + '.wav')
    if so and nome not in so: continue
    voz, estab = ELENCO[quem]
    mp3 = os.path.join(PASTA, nome + '.mp3')
    if os.path.exists(mp3) and not so: audio = None  # já gerado: só refaz o wav (sem gastar crédito)
    else: audio = client.text_to_speech.convert(
        text=v.get('texto_tts', v['texto']), voice_id=voz, model_id='eleven_v4', language_code='pt',
        voice_settings=VoiceSettings(stability=estab, similarity_boost=0.75),
        output_format='mp3_44100_128')
    if audio is not None:
        with open(mp3, 'wb') as f:
            for chunk in audio: f.write(chunk)
    ritmo = 1.0 if quem == 'locucao' else 1.12  # "dicção rápida" do roteiro, sem mudar o tom
    # 48 kHz mono, sem silêncio nas pontas
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '1',
                    '-af', f'atempo={ritmo},silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', wav], check=True)
    print('ok', nome, f'{sf.info(wav).duration:.2f} s')

# boca: RMS por quadro de cada fala, posicionado no tempo do filme
FPS, N = CUES['fps'], int(CUES['fps'] * CUES['duracao'])
boca = {}
for v in CUES['vozes']:
    wav = os.path.join(PASTA, v['arquivo'] + '.wav')
    if not os.path.exists(wav) or v['quem'] == 'locucao': continue
    x, sr = sf.read(wav); hop = sr // FPS
    r = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    r = np.clip(r / (np.percentile(r, 95) + 1e-9), 0, 1)
    arr = boca.setdefault(v['quem'], [0.0] * N)
    i0 = int(round(v['t'] * FPS))
    for k, a in enumerate(r):
        if 0 <= i0 + k < N: arr[i0 + k] = round(float(a), 3)
json.dump(boca, open(os.path.join(PASTA, 'boca.json'), 'w'))
print('ok boca.json', {k: sum(1 for a in v if a > 0.1) for k, v in boca.items()})
