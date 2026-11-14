# Revelação · projeto Remotion

Feito a partir de `../../../templates/remotion-2d-pecas/` (motor e regras de montagem: ver o README de lá).
Um episódio por pasta em `src/episodios/epNN/`: `falas.json` (texto da narração), `vo.json` (gerado: tempo real
de cada palavra), `timeline.ts` (planos derivados da voz) e `EpNN.tsx` (planos, cartões e som).
Cenários da série em `src/revelacao/sets.tsx`.

## Fazer o EP01 do zero

```bash
npm install
python scripts/sfx.py                 # sons sintetizados -> public/audio/
python scripts/voz.py ep01            # voz do Pedro (VoiceStudio) -> public/audio/vo/ep01 + vo.json
COMP=Ep01 SCALE=0.4 node scripts/stills.mjs 80 538 1174 1630   # conferir quadros
npx remotion render Ep01 out/ep01-raw.mp4 --crf=17
python scripts/loudnorm.py out/ep01-raw.mp4 ../episodios/ep01/entregas/revelacao-ep01.mp4   # -14 LUFS
```

Refazer só uma fala: `python scripts/voz.py ep01 f12`. Os planos se reajustam sozinhos à duração nova.

## VoiceStudio

O app (`D:\VoiceStudio\app\VoiceStudio.exe`) abre e fecha sozinho nesta máquina (visto em 2026-11-03 e
2026-11-04). O servidor funciona subindo direto, apontando pros modelos já baixados (sem download):

```bash
cd /d/Pedro/Downloads/VoiceStudio/project
OMNIVOICE_DATA_DIR='D:\VoiceStudio\data' HF_HUB_CACHE='D:\Pedro\Downloads\VoiceStudio\models' \
  HF_HOME='D:\Pedro\Downloads\VoiceStudio' ./.venv/Scripts/python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 3900
```

Espere "Preload complete — model ready" no log. Perfil de voz: `d2669c06` ("joao gabriel", clone do Pedro).
A transcrição (tempo das palavras) roda na CPU quando a GPU não tem 3 GB livres: ~1,5 min por fala.
