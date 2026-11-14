# Cria as vozes-guia com o Voice Design do ElevenLabs (o plano grátis não usa vozes da biblioteca pela API).
# Gera 3 prévias por personagem, salva em audio/vozes/design/ pra ouvir, e cria na conta a primeira de cada
# (troque o índice em ESCOLHA e rode de novo se preferir outra). IDs vão pra audio/vozes/ids.json.
# Uso: python vozes_design.py [pesquisadora advogado bolsista]
import base64, json, os, sys
from dotenv import load_dotenv
from elevenlabs import ElevenLabs

AQUI = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(AQUI, '.env.local'))
client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
PASTA = os.path.join(AQUI, 'audio', 'vozes', 'design'); os.makedirs(PASTA, exist_ok=True)
IDS = os.path.join(AQUI, 'audio', 'vozes', 'ids.json')
ids = json.load(open(IDS)) if os.path.exists(IDS) else {}

PERFIS = {
    'pesquisadora': ("A warm, confident Brazilian woman in her mid-thirties, a biomedical scientist, native Brazilian Portuguese speaker "
                     "with a natural São Paulo accent. Speaks close to the microphone in a quiet room, conversational and sincere, "
                     "a gentle smile in the voice, unhurried, no announcer tone.",
                     "Eu sou filha de doméstica e fiz uma vacina que salva milhões de vidas. Eu sabia que tinha potencial. "
                     "Faltava oportunidade. Hoje eu trabalho no laboratório e penso em quem vem depois de mim."),
    'advogado': ("A young Brazilian man around twenty-eight, a lawyer, native Brazilian Portuguese speaker with a natural "
                 "São Paulo accent. Calm, close and sincere testimonial, speaking at conversational volume in a quiet office, "
                 "warm mid-range voice, clear diction, not salesy.",
                 "Meus pais queriam que eu não estudasse e trabalhasse na roça. Hoje eu sou advogado, e ajudo eles todos os dias. "
                 "O Semear deu o empurrãozinho que eu precisava."),
    'bolsista': ("A young Black Brazilian woman around twenty-four, cheerful and bright, founder of a transport startup, "
                 "native Brazilian Portuguese speaker with a natural Rio de Janeiro accent. Energetic but intimate, smiling while "
                 "she talks, close to the microphone, conversational.",
                 "Eu enfrentava horas de ônibus. Hoje ajudo pessoas com transporte. O Semear me ajudou a não abrir mão do meu sonho, "
                 "e agora eu quero ver mais gente chegando lá."),
}
ESCOLHA = {'pesquisadora': 0, 'advogado': 0, 'bolsista': 0}

for quem in (sys.argv[1:] or PERFIS):
    desc, texto = PERFIS[quem]
    r = client.text_to_voice.design(voice_description=desc, text=texto, model_id='eleven_ttv_v3')
    for i, p in enumerate(r.previews):
        open(os.path.join(PASTA, f'{quem}-{i}.mp3'), 'wb').write(base64.b64decode(p.audio_base_64))
    p = r.previews[ESCOLHA[quem]]
    v = client.text_to_voice.create(voice_name=f'Semear guia · {quem}', voice_description=desc, generated_voice_id=p.generated_voice_id)
    ids[quem] = v.voice_id
    json.dump(ids, open(IDS, 'w'), indent=1)
    print('ok', quem, v.voice_id, f'({len(r.previews)} prévias em audio/vozes/design/)')
