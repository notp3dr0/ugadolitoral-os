# Master e mux: audio/mix.wav -> -14 LUFS integrados, pico verdadeiro <= -1 dBTP (loudnorm em duas passadas),
# AAC estéreo 48 kHz, junto com entregas/video-mudo.mp4 -> entregas/video.mp4. Depois mede o arquivo final.
import json, os, re, subprocess, sys
EST = sys.argv[1] if len(sys.argv) > 1 else 'cel'  # cel | flat | morph
AQUI = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(AQUI, *a)
ff = lambda *a: subprocess.run(['ffmpeg', '-hide_banner', '-y', *a], capture_output=True, text=True, encoding='utf8', errors='replace')

r = ff('-i', P('audio', 'mix.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-')
m = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr)[-1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
ff('-i', P('entregas', f'video-mudo-{EST}.mp4'), '-i', P('audio', 'mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
   '-af', af, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', '30', '-movflags', '+faststart', P('entregas', f'semear-conquista-{EST}.mp4'))
# medições do arquivo entregue
e = ff('-i', P('entregas', f'semear-conquista-{EST}.mp4'), '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]; TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1]
q = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate',
                    '-show_entries', 'format=duration', '-of', 'json', P('entregas', f'semear-conquista-{EST}.mp4')], capture_output=True, text=True).stdout
q = json.loads(q); s = q['streams'][0]
print(f"semear-conquista-{EST}.mp4: {s['width']}x{s['height']} {s['r_frame_rate']} fps, {s['nb_read_frames']} quadros, {float(q['format']['duration']):.3f} s, {I} LUFS, pico {TP} dBTP")
