# Renderiza quadros de um plano a partir da cena e da pose exportada do motor (etapas 1 e 2).
# Uso:
#   blender.exe -b cena/corredor.blend --python render.py -- --plano C7_porta --quadros 0-110 --formato v --motor cycles --saida DIR
#   --quadros "110", "0-110" ou "60,90"     --formato v (1080x1920) | h (1920x1080)     --motor eevee | cycles
#   --vista Standard|AgX   --pct 100   --amostras N   --sem-aquecer
#   --seq        saída de sequência: DIR/cor/000000.jpg e DIR/prof/000000.png (formato do laboratório)
#   --flash "13,40"   flash de verdade preso à câmera, acendendo nesses quadros locais (some em ~5 quadros)
#   --sem-borrao  desliga o desfoque de movimento   --sem-foco  desliga a profundidade de campo
# A câmera ganha um ponto-chave por quadro (a curva vem pronta do motor; entre quadros, linear, só pro
# desfoque de movimento). Pula quadro que já existe; registra tempo de cada quadro em DIR/tempos.jsonl e o
# progresso em DIR/progresso.txt.
import bpy, json, math, os, sys, time
import numpy as np
from mathutils import Matrix, Vector, Quaternion

AQUI = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opt(k, d=None):
    return argv[argv.index(k) + 1] if k in argv else d
PLANO = opt('--plano'); FORMATO = opt('--formato', 'v'); MOTOR = opt('--motor', 'cycles')
SAIDA = os.path.abspath(opt('--saida', os.path.join(AQUI, 'revisao', 'quadros')))
VISTA = opt('--vista', 'Standard'); PCT = int(opt('--pct', 100)); AMOSTRAS = opt('--amostras')
SEQ = '--seq' in argv; AQUECER = '--sem-aquecer' not in argv
BORRAO = '--sem-borrao' not in argv; FOCO = '--sem-foco' not in argv
FLASH = [int(x) for x in opt('--flash', '').split(',') if x.strip()]
SEG = '--seg' in argv            # passe seg: só a luz vermelha de segurança (sem luminárias, telas, fotos acesas, palco)
BORRAO_DESDE = int(opt('--borrao-desde', 0))
EXPOSICAO = float(opt('--exposicao', 3.5 if SEG else 0.0))   # o seg sai com +3,5 EV (o laboratório baixa de volta): sem banda nos escuros
# amostras por faixa de quadros, ex.: "86-110:128" (a neblina do palco pede mais)
AMOSTRAS_FAIXA = []
for parte in (opt('--amostras-faixa', '') or '').split(';'):
    if ':' in parte:
        fx, am = parte.split(':'); a0, a1 = map(int, fx.split('-')); AMOSTRAS_FAIXA.append((a0, a1, int(am)))
def faixa(s):
    out = []
    for p in s.split(','):
        if '-' in p: a, z = map(int, p.split('-')); out += list(range(a, z + 1))
        else: out.append(int(p))
    return out
QUADROS = faixa(opt('--quadros', '0'))

R = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # three -> Blender (o mesmo de montar_cena.py)
def mundo_pq(pos, quat):
    x, y, z, w = quat
    return R @ Matrix.LocRotScale(Vector(pos), Quaternion((w, x, y, z)), None)

cena = bpy.context.scene
cam = cena.camera
POSE = json.load(open(os.path.join(AQUI, 'dados', 'camera', PLANO + '.json')))['pose']
D = json.load(open(os.path.join(AQUI, 'dados', 'corredor.json'), encoding='utf-8'))

# ---------------------------------------------------------------- formato e cor
W, H = (1080, 1920) if FORMATO == 'v' else (1920, 1080)
cena.render.resolution_x, cena.render.resolution_y, cena.render.resolution_percentage = W, H, PCT
cena.render.image_settings.file_format = 'JPEG'; cena.render.image_settings.quality = 95
cena.view_settings.view_transform = VISTA; cena.view_settings.look = 'None'
cena.view_settings.gamma = 1
cena.display_settings.display_device = 'sRGB'
cam.data.sensor_fit = 'VERTICAL'
def fov_de(p):
    """campo de visão vertical: o do motor no vertical; no horizontal, 62 graus (o motor deitado) ou o fov do plano na mesma proporção"""
    f = p.get('fov') or 80
    return f if FORMATO == 'v' else f * 62 / 80

# ---------------------------------------------------------------- motor
def ajustar(obj, **kw):
    for k, v in kw.items():
        try: setattr(obj, k, v)
        except Exception as e: print(f'  (ajuste ignorado {k}: {e})')
if MOTOR == 'eevee':
    cena.render.engine = 'BLENDER_EEVEE'
    ee = cena.eevee
    ajustar(ee, taa_render_samples=int(AMOSTRAS or 48), use_raytracing=True, ray_tracing_method='SCREEN', use_shadows=True,
            shadow_ray_count=1, shadow_step_count=6, use_fast_gi=True, fast_gi_method='GLOBAL_ILLUMINATION', fast_gi_resolution='2',
            fast_gi_distance=4.0, clamp_surface_indirect=10.0, light_threshold=.01)
    ajustar(ee.ray_tracing_options, resolution_scale='1', use_denoise=True, screen_trace_quality=.5, screen_trace_thickness=.3)
else:
    cena.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'CUDA'; prefs.get_devices()
    for d in prefs.devices: d.use = (d.type == 'CUDA')
    cy = cena.cycles
    ajustar(cy, device='GPU', samples=int(AMOSTRAS or 32), use_adaptive_sampling=True, adaptive_threshold=.03,
            use_denoising=True, denoiser='OPENIMAGEDENOISE', denoising_use_gpu=True, denoising_input_passes='RGB_ALBEDO_NORMAL',
            max_bounces=4, diffuse_bounces=2, glossy_bounces=2, transmission_bounces=2, transparent_max_bounces=6, volume_bounces=0,
            caustics_reflective=False, caustics_refractive=False, blur_glossy=1.0, sample_clamp_indirect=6.0, use_light_tree=True,
            volume_step_rate=4.0, volume_max_steps=256)
    cena.render.use_persistent_data = True
cena.render.use_motion_blur = BORRAO
cena.render.motion_blur_shutter = .5

# ---------------------------------------------------------------- câmera animada: um ponto-chave por quadro
pivos = [o for o in bpy.data.objects if o.name.startswith('porta_pivo_')]
frestas = [o for o in bpy.data.objects if o.get('fresta')] + [o for o in bpy.data.objects if o.name == 'fresta_porta']
porta = D['porta']
alvo_foco = Vector((porta['x'], -porta['z'], 1.4))
cam.rotation_mode = 'QUATERNION'
q_ant = None
for n, p in enumerate(POSE):
    mw = mundo_pq(p['pos'], p['quat'])
    loc, rot, _ = mw.decompose()
    if q_ant is not None and q_ant.dot(rot) < 0: rot.negate()   # quaternion contínuo (sem volta de 360)
    q_ant = rot
    cam.location = loc; cam.rotation_quaternion = rot; cam.data.angle = math.radians(fov_de(p))
    cam.keyframe_insert('location', frame=n); cam.keyframe_insert('rotation_quaternion', frame=n)
    cam.data.keyframe_insert('lens', frame=n)
    abre = p.get('porta', 0.0)
    for e in pivos:
        e.rotation_euler = (0, 0, e['yaw'] + e['s'] * abre); e.keyframe_insert('rotation_euler', frame=n)
for ad in [cam.animation_data, cam.data.animation_data] + [e.animation_data for e in pivos]:
    if ad and ad.action:
        for layer in getattr(ad.action, 'layers', []):
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for k in fc.keyframe_points: k.interpolation = 'LINEAR'
        for fc in getattr(ad.action, 'fcurves', []):
            for k in fc.keyframe_points: k.interpolation = 'LINEAR'
cam.data.dof.use_dof = FOCO and PLANO == 'C7_porta'   # foco na porta só no C7; os outros planos ficam nítidos
cam.data.dof.aperture_fstop = 2.8

# ---------------------------------------------------------------- flash de verdade (preso à câmera)
luz_flash = None
if FLASH:
    ld = bpy.data.lights.new('flash', 'SPOT'); ld.color = (1, .97, .93); ld.shadow_soft_size = .05; ld.energy = 0
    ld.spot_size = math.radians(85); ld.spot_blend = .6
    luz_flash = bpy.data.objects.new('flash', ld); cena.collection.objects.link(luz_flash)
    luz_flash.parent = cam; luz_flash.location = (.10, .06, 0)   # aponta pra onde a câmera olha (-Z local)
PICO_FLASH = float(opt('--pico-flash', 160))
def envelope_flash(n):
    e = 0.0
    for f0 in FLASH:
        a = n - f0
        if 0 <= a <= 4: e += math.exp(-a / .75)
    return e

# ---------------------------------------------------------------- passe de profundidade (Z do Blender -> distância radial, 0 a 30 m)
cena.view_layers[0].use_pass_z = True
TMP = os.path.join(SAIDA, '_tmp'); os.makedirs(TMP, exist_ok=True)
ng = bpy.data.node_groups.new('comp_prof', 'CompositorNodeTree'); cena.compositing_node_group = ng
rl = ng.nodes.new('CompositorNodeRLayers'); fo = ng.nodes.new('CompositorNodeOutputFile')
fo.directory = TMP; fo.file_name = 'z'
fo.format.media_type = 'IMAGE'; fo.format.file_format = 'OPEN_EXR'; fo.format.color_depth = '32'; fo.format.color_mode = 'RGB'
fo.file_output_items.new('FLOAT', 'prof')
ng.links.new(rl.outputs['Depth'], fo.inputs[0])
grp_out = ng.nodes.new('NodeGroupOutput') if False else None

def prof_png(n, destino):
    arq = [f for f in os.listdir(TMP) if f.endswith('.exr')]
    if not arq: print('  AVISO: sem EXR de profundidade'); return
    caminho = os.path.join(TMP, sorted(arq)[-1])
    im = bpy.data.images.load(caminho); im.colorspace_settings.name = 'Non-Color'
    w, h = im.size
    px = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(px)
    z = px.reshape(h, w, 4)[::-1, :, 0]           # Blender guarda de baixo pra cima
    bpy.data.images.remove(im)
    for f in arq: os.remove(os.path.join(TMP, f))
    fy = (h / 2) / math.tan(cam.data.angle_y / 2)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    raio = z * np.sqrt(1 + ((xs + .5 - w / 2) / fy) ** 2 + ((ys + .5 - h / 2) / fy) ** 2)
    v = np.where(raio >= 30, 65535, np.floor(np.clip(raio / 30, 0, 1) * 65535 + .5)).astype(np.uint32)
    rgba = np.zeros((h, w, 4), np.float32)
    rgba[..., 0] = (v >> 8) / 255.0; rgba[..., 1] = (v & 255) / 255.0; rgba[..., 3] = 1
    out = bpy.data.images.new('prof_out', w, h, alpha=True, float_buffer=False)
    out.colorspace_settings.name = 'Non-Color'
    out.pixels.foreach_set(rgba[::-1].ravel())
    out.filepath_raw = destino; out.file_format = 'PNG'; out.save()
    bpy.data.images.remove(out)

# ---------------------------------------------------------------- render
palco_luzes = [(o, o.data.energy) for o in bpy.data.objects if o.type == 'LIGHT' and o.name in ('palco_contraluz', 'palco_facho')]
_pm = bpy.data.materials.get('palco_fundo')
palco_emit = next((nd for nd in _pm.node_tree.nodes if nd.type == 'EMISSION'), None) if _pm else None
palco_e0 = palco_emit.inputs['Strength'].default_value if palco_emit else 0
def palco(n):
    if PLANO != 'C7_porta' or SEG: return 0.0
    sob = min(1, max(0, (n - 80) / 12)); return sob * sob * (3 - 2 * sob)

# C2e: no fim do mergulho a foto é o arquivo (emissão 1, nenhuma luz de cena por cima)
mergulho = None
if PLANO == 'C2e_mergulho':
    _m = bpy.data.materials.get('foto_copia_055')
    _pr = next(nd for nd in _m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED')
    mergulho = (_pr, bpy.data.objects.get('spot_055'), bpy.data.objects['spot_055'].data.energy)

# passe seg: apaga tudo que não é vermelho de segurança
if SEG:
    for o in bpy.data.objects:
        if o.type == 'LIGHT' and not (o.name.startswith('vermelho') or o.name == 'silencio'): o.data.energy = 0
    for m in bpy.data.materials:
        if not m.node_tree or m.name == 'lampada_vermelha': continue
        for nd in m.node_tree.nodes:
            if nd.type == 'EMISSION':
                c = nd.inputs['Color'].default_value
                if not (c[0] > .5 and c[1] < .2): nd.inputs['Strength'].default_value = 0
            elif nd.type == 'BSDF_PRINCIPLED':
                nd.inputs['Emission Strength'].default_value = 0

def pousar(n):
    cena.frame_set(n)
    p = POSE[n]
    cam.data.dof.focus_distance = max(.5, (alvo_foco - cam.matrix_world.translation).length)
    g = p.get('ganho', 1.0)
    cena.view_settings.exposure = (math.log2(g) if g > 1e-4 else -40.0) + EXPOSICAO
    cena.render.dither_intensity = 1.0 if g > 1e-4 else 0.0   # preto total é zero de verdade (sem o ruído de dither)
    for o in frestas: o.hide_render = p.get('porta', 0.0) > .3
    if luz_flash: luz_flash.data.energy = PICO_FLASH * envelope_flash(n)
    # o palco acende enquanto as folhas abrem e esmorece depois que a câmera atravessa (o escuro chega no 106)
    k = palco(n)
    for o, e0 in palco_luzes: o.data.energy = e0 * k
    if palco_emit: palco_emit.inputs['Strength'].default_value = palco_e0 * k
    if mergulho:
        kk = min(1, max(0, (n - 14) / 11)); kk = kk * kk * (3 - 2 * kk)
        pr, sp, e0 = mergulho
        pr.inputs['Emission Strength'].default_value = .32 + .68 * kk; sp.data.energy = e0 * (1 - kk)
    cena.render.use_motion_blur = BORRAO and n >= BORRAO_DESDE
    if MOTOR == 'cycles':
        cena.cycles.samples = next((am for a0, a1, am in AMOSTRAS_FAIXA if a0 <= n <= a1), int(AMOSTRAS or 32))

def nome(n):
    if SEQ: return os.path.join(SAIDA, 'seg' if SEG else 'cor', f'{n:06d}.jpg')
    return os.path.join(SAIDA, f'{PLANO}_{FORMATO}_{MOTOR}_{n:03d}.jpg')
if SEQ: os.makedirs(os.path.join(SAIDA, 'seg' if SEG else 'cor'), exist_ok=True); os.makedirs(os.path.join(SAIDA, 'prof'), exist_ok=True)
pendentes = [n for n in QUADROS if not os.path.exists(nome(n))]
fo.mute = not SEQ or SEG
if pendentes and AQUECER:  # compila shaders / sobe a cena pra placa; não conta no tempo
    pousar(pendentes[0]); cena.render.resolution_percentage = 10; fo.mute = True
    t = time.time(); bpy.ops.render.render(write_still=False); print(f'AQUECIMENTO {time.time() - t:.1f} s')
    cena.render.resolution_percentage = PCT; fo.mute = not SEQ or SEG
    for f in os.listdir(TMP): os.remove(os.path.join(TMP, f))
feitos = 0
for n in pendentes:
    pousar(n)
    cena.render.filepath = nome(n)
    t = time.time(); bpy.ops.render.render(write_still=True); dt = time.time() - t
    if SEQ and not SEG: prof_png(n, os.path.join(SAIDA, 'prof', f'{n:06d}.png'))
    feitos += 1
    print(f'QUADRO {PLANO} {FORMATO} {MOTOR} {n} {dt:.2f} s', flush=True)
    with open(os.path.join(SAIDA, 'tempos.jsonl'), 'a', encoding='utf-8') as f:
        f.write(json.dumps({'plano': PLANO, 'formato': FORMATO, 'motor': MOTOR, 'quadro': n, 'segundos': round(dt, 2), 'vista': VISTA, 'pct': PCT,
                            'amostras': int(AMOSTRAS or (32 if MOTOR == 'cycles' else 48)), 'flash': bool(FLASH), 'seg': SEG, 'amostras_quadro': cena.cycles.samples if MOTOR == 'cycles' else None}) + '\n')
    with open(os.path.join(SAIDA, 'progresso.txt'), 'w', encoding='utf-8') as f:
        f.write(f'{PLANO} {FORMATO}: {feitos}/{len(pendentes)} desta rodada; último quadro {n}; {time.strftime("%H:%M:%S")}\n')
