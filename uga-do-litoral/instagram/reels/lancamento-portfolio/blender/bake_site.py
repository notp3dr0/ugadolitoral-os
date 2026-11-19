# Rodada 13 do site: pinta a luz do corredor do Blender (bake) em mapas que o site usa como lightMap.
# Não toca nos arquivos do filme: abre cena/corredor.blend só pra ler (não salva) e escreve em luz_site/.
#
# Uso:  blender.exe -b cena/corredor.blend --python bake_site.py -- [--amostras 256] [--so paredes|piso]
#
# Como funciona: o site monta paredes (um quadrilátero por aresta de célula, na ordem de plan.walls) e piso
# (um quadrado por célula). Aqui se monta a MESMA geometria, com um UV de atlas próprio (UV2), e o Cycles pinta
# nela a luz difusa (direta + indireta, sem a cor do material). O site multiplica essa luz pela textura dele.
# As cópias (fotos) ficam de fora do bake: são sorteadas a cada visita. Os refletores sobre cada vaga ficam.
import bpy, bmesh, json, math, os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(AQUI, 'dados', 'corredor.json'), encoding='utf-8'))
U, H = D['U'], D['HALL_HEIGHT']
SAIDA = os.path.join(AQUI, 'luz_site'); os.makedirs(SAIDA, exist_ok=True)
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opt(k, padrao=None): return argv[argv.index(k) + 1] if k in argv else padrao
AMOSTRAS = int(opt('--amostras', 256)); SO = opt('--so')

def b(x, y, z): return (x, -z, y)  # three -> Blender

# ------------------------------------------------------------------ o atlas das paredes (o site repete esta conta lendo o mapa.json)
ATLAS, PAD = 2048, 4
N = len(D['paredes'])
for s in range(120, 10, -1):
    tw, th = round(U * s), round(H * s)
    cols, rows = ATLAS // (tw + 2 * PAD), ATLAS // (th + 2 * PAD)
    if cols * rows >= N: break
CW, CH = tw + 2 * PAD, th + 2 * PAD
def tile(i):
    """retângulo do quadro i no atlas, em UV (0..1, v de baixo pra cima)"""
    c, r = i % cols, i // cols
    x0 = (c * CW + PAD) / ATLAS; y0 = (r * CH + PAD) / ATLAS
    return x0, y0, x0 + tw / ATLAS, y0 + th / ATLAS
bd = D['bounds']
PX0, PX1, PZ0, PZ1 = bd['minX'], bd['maxX'], bd['minZ'], bd['maxZ']
PW = 2048; PH = max(256, round(PW * (PZ1 - PZ0) / (PX1 - PX0) / 64) * 64)
def uv_piso(x, z): return ((x - PX0) / (PX1 - PX0), (z - PZ0) / (PZ1 - PZ0))
# assinatura da planta: se o corredor do site mudar (fotos novas), o site percebe e não usa o mapa velho
ASSINATURA = round(sum(w['a'][0] * 3 + w['a'][1] * 7 + w['b'][0] * 11 + w['b'][1] * 13 for w in D['paredes']), 3)

# ------------------------------------------------------------------ a cena: esconde a casca do filme e o que é sorteado
cena = bpy.context.scene
esconder = []
for o in cena.objects:
    nome = o.name
    if nome in ('paredes', 'piso') or nome.startswith(('copia_', 'papel_')) or nome in ('palco_neblina', 'palco_facho'):
        esconder.append(o)
# as telas (e a moldura e a luz delas) também saem: cada visita sorteia que filme vai em cada tela, vertical ou
# horizontal, e a sombra pintada de uma tela não pode ficar na parede quando a outra aparece (rodada 17)
from mathutils import Vector as _V
for t in D['telas']:
    c = _V((t['x'], -t['z'], t['cy'])); raio = max(t['w'], t['h']) / 2 + .35
    for o in cena.objects:
        if o in esconder or o.name in ('paredes', 'piso', 'teto'): continue
        if o.name.startswith('tela_luz_') or (o.type == 'MESH' and (o.matrix_world.translation - c).length < raio):
            esconder.append(o)
for o in esconder: o.hide_render = True
print(f'escondidos {len(esconder)} (casca do filme, cópias, neblina e contraluz do palco)')

def mat_alvo(nome, cinza, img):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (cinza, cinza, cinza, 1); p.inputs['Roughness'].default_value = .9
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.nodes.active = t; t.select = True
    return m

def alvo(nome, verts, faces, uvs, normais, img, cinza):
    me = bpy.data.meshes.new(nome); me.from_pydata(verts, [], faces); me.update()
    lay = me.uv_layers.new(name='luz')
    for poly in me.polygons:
        for li in poly.loop_indices: lay.data[li].uv = uvs[me.loops[li].vertex_index]
    # a face tem que olhar pra dentro do corredor (o bake só enxerga a luz do lado da normal)
    for k, poly in enumerate(me.polygons):
        if poly.normal.dot(normais[k]) < 0: poly.flip()
    me.update()
    o = bpy.data.objects.new(nome, me); cena.collection.objects.link(o)
    o.data.materials.append(mat_alvo('m_' + nome, cinza, img))
    return o

def nova_img(nome, w, h):
    img = bpy.data.images.new(nome, w, h, float_buffer=True, alpha=False)
    img.colorspace_settings.name = 'Non-Color'
    return img

from mathutils import Vector
# paredes: um quadrilátero por parede, na ordem do site
pv, pf, puv, pn = [], [], [], []
for i, w in enumerate(D['paredes']):
    (ax, az), (bx, bz), n = w['a'], w['b'], w['normal']
    u0, v0, u1, v1 = tile(i); k = len(pv)
    pv += [b(ax, 0, az), b(bx, 0, bz), b(bx, H, bz), b(ax, H, az)]
    puv += [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
    pf.append((k, k + 1, k + 2, k + 3)); pn.append(Vector(b(n[0], 0, n[1])))
img_par = nova_img('luz_paredes', ATLAS, ATLAS)
o_par = alvo('alvo_paredes', pv, pf, puv, pn, img_par, .30)

# piso: um quadrado por célula (as células coincidentes se fundem depois, sem fresta)
fv, ff, fuv, fn = [], [], [], []
for i, j in D['piso']:
    x0, x1, z0, z1 = i * U, (i + 1) * U, j * U, (j + 1) * U; k = len(fv)
    for (x, z) in [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]: fv.append(b(x, 0, z)); fuv.append(uv_piso(x, z))
    ff.append((k, k + 1, k + 2, k + 3)); fn.append(Vector((0, 0, 1)))
img_piso = nova_img('luz_piso', PW, PH)
o_piso = alvo('alvo_piso', fv, ff, fuv, fn, img_piso, .22)

# ------------------------------------------------------------------ Cycles na placa
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'CUDA'; prefs.get_devices()
for d in prefs.devices: d.use = (d.type == 'CUDA')
cena.render.engine = 'CYCLES'
cy = cena.cycles; cy.device = 'GPU'; cy.samples = AMOSTRAS; cy.use_adaptive_sampling = False
cy.sample_clamp_direct = 0; cy.sample_clamp_indirect = 2.0
cy.max_bounces = 4; cy.diffuse_bounces = 3; cy.glossy_bounces = 1; cy.transmission_bounces = 2; cy.volume_bounces = 0
bk = cena.render.bake
bk.use_pass_direct = True; bk.use_pass_indirect = True; bk.use_pass_color = False
bk.margin = PAD + 2; bk.margin_type = 'EXTEND'; bk.use_clear = True; bk.target = 'IMAGE_TEXTURES'

def assar(o, img, arq):
    for x in cena.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=PAD + 2, use_clear=True)
    img.filepath_raw = os.path.join(SAIDA, arq); img.file_format = 'OPEN_EXR'
    img.save()
    print(f'  {arq}: {time.time() - t:.0f} s')

print(f'atlas paredes {ATLAS}px, {s} px/m, quadro {tw}x{th}, {cols}x{rows} | piso {PW}x{PH} | amostras {AMOSTRAS}')
if SO in (None, 'paredes'): assar(o_par, img_par, 'paredes.exr')
if SO in (None, 'piso'): assar(o_piso, img_piso, 'piso.exr')

json.dump({
    'versao': 1, 'assinatura': ASSINATURA, 'n_paredes': N,
    'paredes': {'arquivo': 'paredes', 'atlas': ATLAS, 'pad': PAD, 'tw': tw, 'th': th, 'cols': cols, 'px_m': s},
    'piso': {'arquivo': 'piso', 'w': PW, 'h': PH, 'x0': PX0, 'x1': PX1, 'z0': PZ0, 'z1': PZ1},
    'amostras': AMOSTRAS
}, open(os.path.join(SAIDA, 'mapa.json'), 'w', encoding='utf-8'), indent=1)
print('FIM')
