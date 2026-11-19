# Passo 2 da etapa 1: gera blender/cena/corredor.blend do zero a partir de blender/dados/corredor.json.
# Uso: blender.exe -b --factory-startup --python montar_cena.py
# Rodar de novo recria a mesma cena (nada aleatório sem semente; nada feito à mão).
import bpy, bmesh, json, math, os, sys
from collections import Counter
from mathutils import Matrix, Vector, Quaternion

AQUI = os.path.dirname(os.path.abspath(__file__))
DADOS = os.path.join(AQUI, 'dados')
SITE = os.path.normpath(os.path.join(AQUI, '..', '..', '..', '..', 'portfolio', 'site-lab'))
SAIDA = os.path.join(AQUI, 'cena', 'corredor.blend')
D = json.load(open(os.path.join(DADOS, 'corredor.json'), encoding='utf-8'))
U, H = D['U'], D['HALL_HEIGHT']

# ------------------------------------------------------------------ eixos: three (x, y, z) -> Blender (x, -z, y)
R = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
def b(x, y, z):
    """ponto do three.js em coordenadas do Blender (a única conversão de eixos do projeto)"""
    return Vector((x, -z, y))
def m3(e):
    """matriz do three (.elements, em coluna) -> Matrix do Blender, ainda nos eixos do three"""
    return Matrix([[e[c * 4 + r] for c in range(4)] for r in range(4)])
def mundo(e):
    return R @ m3(e)
def mundo_pq(pos, quat):
    x, y, z, w = quat
    return R @ Matrix.LocRotScale(Vector(pos), Quaternion((w, x, y, z)), None)

# ------------------------------------------------------------------ cena vazia
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene
cena.name = 'corredor'
cols = {}
for nome in ('corredor', 'copias', 'luzes', 'porta', 'enfeites'):
    c = bpy.data.collections.new(nome); cena.collection.children.link(c); cols[nome] = c

def objeto(nome, dados, col, mw=None):
    o = bpy.data.objects.new(nome, dados)
    cols[col].objects.link(o)
    if mw is not None: o.matrix_world = mw
    return o

def srgb(h):
    """'#rrggbb' (sRGB) -> RGBA linear"""
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c]
    return (*lin, 1.0)

# ------------------------------------------------------------------ malhas (no espaço local do three)
def malha(nome, verts, faces, uvs=None):
    me = bpy.data.meshes.new(nome)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    if uvs is not None:
        lay = me.uv_layers.new(name='UV')
        k = 0
        for poly in me.polygons:
            for li in poly.loop_indices:
                lay.data[li].uv = uvs[me.loops[li].vertex_index]
    me.update()
    return me

_cache = {}
def geo_plano(w, h):
    k = ('p', round(w, 5), round(h, 5))
    if k not in _cache:
        _cache[k] = malha(f'plano_{w:.3f}x{h:.3f}', [(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [(0, 1, 2, 3)], [(0, 0), (1, 0), (1, 1), (0, 1)])
    return _cache[k]

def geo_caixa(w, h, d):
    k = ('c', round(w, 5), round(h, 5), round(d, 5))
    if k not in _cache:
        me = bpy.data.meshes.new(f'caixa_{w:.3f}x{h:.3f}x{d:.3f}')
        bm = bmesh.new(); bm.loops.layers.uv.new('UV'); bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True)
        bmesh.ops.scale(bm, vec=(w, h, d), verts=bm.verts)
        bm.to_mesh(me); bm.free(); _cache[k] = me
    return _cache[k]

def geo_cilindro(rt, rb, h, n):
    k = ('y', round(rt, 5), round(rb, 5), round(h, 5), n)
    if k not in _cache:
        me = bpy.data.meshes.new(f'cilindro_{rb:.3f}x{h:.3f}')
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=max(6, n), radius1=rb, radius2=rt, depth=h)
        bmesh.ops.transform(bm, matrix=Matrix.Rotation(-math.pi / 2, 4, 'X'), verts=bm.verts)  # eixo Z -> Y (cilindro do three)
        bm.to_mesh(me); bm.free(); _cache[k] = me
    return _cache[k]

def geo_disco(r, n):
    k = ('d', round(r, 5), n)
    if k not in _cache:
        n = max(8, n)
        vs = [(0, 0, 0)] + [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), 0) for i in range(n)]
        _cache[k] = malha(f'disco_{r:.3f}', vs, [(0, i + 1, (i + 1) % n + 1) for i in range(n)])
    return _cache[k]

def geo_bruta(nome, g):
    p = g['pos']; vs = [(p[i], p[i + 1], p[i + 2]) for i in range(0, len(p), 3)]
    idx = g['idx'] or list(range(len(vs)))
    fs = [(idx[i], idx[i + 1], idx[i + 2]) for i in range(0, len(idx), 3)]
    uvs = [(g['uv'][i], g['uv'][i + 1]) for i in range(0, len(g['uv']), 2)] if g.get('uv') else None
    return malha(nome, vs, fs, uvs)

def geo_de(o, nome):
    g = o['geo']; t = g['tipo']
    if t == 'plano': return geo_plano(g['w'], g['h'])
    if t == 'caixa': return geo_caixa(g['w'], g['h'], g['d'])
    if t == 'cilindro': return geo_cilindro(g['rt'], g['rb'], g['h'], g['n'])
    if t == 'disco': return geo_disco(g['r'], g['n'])
    return geo_bruta(nome, g)

# ------------------------------------------------------------------ materiais
def novo_mat(nome):
    m = bpy.data.materials.new(nome); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (600, 0)
    return m, nt, out

def principled(nt, out):
    p = nt.nodes.new('ShaderNodeBsdfPrincipled'); p.location = (300, 0)
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    return p

def mat_solido(hexcor, rough=.6, metal=0.0, nome=None):
    nome = nome or f'solido_{hexcor.lstrip("#")}_{rough}'
    if nome in bpy.data.materials: return bpy.data.materials[nome]
    m, nt, out = novo_mat(nome); p = principled(nt, out)
    p.inputs['Base Color'].default_value = srgb(hexcor); p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    return m

def mat_emissivo(nome, cor, forca, mapa=None, alfa=False):
    if nome in bpy.data.materials: return bpy.data.materials[nome]
    m, nt, out = novo_mat(nome)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = forca
    em.inputs['Color'].default_value = cor
    sh = em.outputs['Emission']
    if mapa:
        tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = mapa; tx.location = (-400, 0)
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
        nt.links.new(tx.outputs['Color'], mix.inputs['A']); mix.inputs['B'].default_value = cor
        nt.links.new(mix.outputs['Result'], em.inputs['Color'])
        if alfa:
            tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
            nt.links.new(tx.outputs['Alpha'], mx.inputs['Fac']); nt.links.new(tr.outputs['BSDF'], mx.inputs[1]); nt.links.new(sh, mx.inputs[2])
            sh = mx.outputs['Shader']
    nt.links.new(sh, out.inputs['Surface'])
    return m

def mat_textura(nome, img, cor='#ffffff', alfa=True, rough=.75, emissao=0.0, repeat=(1, 1)):
    """estêncil/impresso: a textura como cor difusa, alfa recortando; emissão opcional (placa acesa)"""
    if nome in bpy.data.materials: return bpy.data.materials[nome]
    m, nt, out = novo_mat(nome); p = principled(nt, out)
    tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img; tx.location = (-300, 0)
    if repeat != (1, 1):
        uvn = nt.nodes.new('ShaderNodeUVMap'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (repeat[0], repeat[1], 1)
        nt.links.new(uvn.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], tx.inputs['Vector'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
    nt.links.new(tx.outputs['Color'], mix.inputs['A']); mix.inputs['B'].default_value = srgb(cor)
    nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    if alfa: nt.links.new(tx.outputs['Alpha'], p.inputs['Alpha'])
    if emissao > 0:
        nt.links.new(mix.outputs['Result'], p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value = emissao
    return m

_imgs = {}
def imagem(caminho, cor=True):
    caminho = os.path.normpath(caminho)
    if caminho not in _imgs:
        im = bpy.data.images.load(caminho, check_existing=True)
        im.colorspace_settings.name = 'sRGB' if cor else 'Non-Color'
        _imgs[caminho] = im
    return _imgs[caminho]
def do_site(rel):
    return os.path.join(SITE, rel.replace('./', '', 1).replace('/', os.sep))

# ---- concreto aparente (paredes): cinza escuro, variação manchada, painéis de fôrma e furos de tirante
def mat_concreto():
    m, nt, out = novo_mat('concreto_parede'); p = principled(nt, out); N = nt.nodes; L = nt.links
    uv = N.new('ShaderNodeUVMap'); uv.location = (-1400, 0)
    # painéis de fôrma 2,4 x 1,2 m: juntas finas e um tom levemente diferente por painel
    br = N.new('ShaderNodeTexBrick'); br.location = (-1000, 200)
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = .006; br.inputs['Mortar Smooth'].default_value = .4
    br.inputs['Brick Width'].default_value = 2.4; br.inputs['Row Height'].default_value = 1.2; br.offset = 0.0; br.squash = 1.0
    br.inputs['Color1'].default_value = (.92, .92, .92, 1); br.inputs['Color2'].default_value = (1.06, 1.06, 1.06, 1); br.inputs['Mortar'].default_value = (.45, .45, .45, 1)
    L.new(uv.outputs['UV'], br.inputs['Vector'])
    # furos de tirante: pontos escuros numa grade de 0,6 x 0,6 m
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(uv.outputs['UV'], sep.inputs['Vector'])
    def fr(sock, k):
        mm = N.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; mm.inputs[1].default_value = k; L.new(sock, mm.inputs[0])
        f = N.new('ShaderNodeMath'); f.operation = 'FRACT'; L.new(mm.outputs[0], f.inputs[0])
        s = N.new('ShaderNodeMath'); s.operation = 'SUBTRACT'; s.inputs[1].default_value = .5; L.new(f.outputs[0], s.inputs[0])
        return s.outputs[0]
    fx, fy = fr(sep.outputs['X'], 1 / .6), fr(sep.outputs['Y'], 1 / .6)
    cmb = N.new('ShaderNodeCombineXYZ'); L.new(fx, cmb.inputs['X']); L.new(fy, cmb.inputs['Y'])
    ln = N.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'; L.new(cmb.outputs['Vector'], ln.inputs[0])
    furo = N.new('ShaderNodeMapRange'); furo.inputs['From Min'].default_value = .025; furo.inputs['From Max'].default_value = .045
    furo.inputs['To Min'].default_value = .35; furo.inputs['To Max'].default_value = 1.0; L.new(ln.outputs['Value'], furo.inputs['Value'])
    # manchas: ruído grande + fino
    n1 = N.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = .9; n1.inputs['Detail'].default_value = 6; n1.inputs['Roughness'].default_value = .6
    L.new(uv.outputs['UV'], n1.inputs['Vector'])
    n2 = N.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 28; n2.inputs['Detail'].default_value = 8
    L.new(uv.outputs['UV'], n2.inputs['Vector'])
    ramp = N.new('ShaderNodeValToRGB'); L.new(n1.outputs['Fac'], ramp.inputs['Fac'])
    ramp.color_ramp.elements[0].position = .3; ramp.color_ramp.elements[0].color = (.075, .079, .085, 1)
    ramp.color_ramp.elements[1].position = .75; ramp.color_ramp.elements[1].color = (.15, .155, .165, 1)
    c1 = N.new('ShaderNodeMix'); c1.data_type = 'RGBA'; c1.blend_type = 'MULTIPLY'; c1.inputs['Factor'].default_value = 1
    L.new(ramp.outputs['Color'], c1.inputs['A']); L.new(br.outputs['Color'], c1.inputs['B'])
    c2 = N.new('ShaderNodeMix'); c2.data_type = 'RGBA'; c2.blend_type = 'MULTIPLY'; c2.inputs['Factor'].default_value = 1
    L.new(c1.outputs['Result'], c2.inputs['A']); L.new(furo.outputs['Result'], c2.inputs['B'])
    fino = N.new('ShaderNodeMapRange'); fino.inputs['To Min'].default_value = .85; fino.inputs['To Max'].default_value = 1.1; L.new(n2.outputs['Fac'], fino.inputs['Value'])
    c3 = N.new('ShaderNodeMix'); c3.data_type = 'RGBA'; c3.blend_type = 'MULTIPLY'; c3.inputs['Factor'].default_value = 1
    L.new(c2.outputs['Result'], c3.inputs['A']); L.new(fino.outputs['Result'], c3.inputs['B'])
    L.new(c3.outputs['Result'], p.inputs['Base Color'])
    rr = N.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .78; rr.inputs['To Max'].default_value = .95; L.new(n2.outputs['Fac'], rr.inputs['Value'])
    L.new(rr.outputs['Result'], p.inputs['Roughness'])
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .25; bump.inputs['Distance'].default_value = .004
    hb = N.new('ShaderNodeMath'); hb.operation = 'MULTIPLY'; L.new(n2.outputs['Fac'], hb.inputs[0]); L.new(br.outputs['Fac'], hb.inputs[1])
    L.new(n2.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m

# ---- piso de concreto polido: escuro, reflexo leve e irregular (o que mais vende a luz)
def mat_piso():
    m, nt, out = novo_mat('concreto_piso'); p = principled(nt, out); N = nt.nodes; L = nt.links
    uv = N.new('ShaderNodeUVMap')
    n1 = N.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = .55; n1.inputs['Detail'].default_value = 5
    n2 = N.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 7; n2.inputs['Detail'].default_value = 10; n2.inputs['Roughness'].default_value = .65
    for n in (n1, n2): L.new(uv.outputs['UV'], n.inputs['Vector'])
    ramp = N.new('ShaderNodeValToRGB'); L.new(n1.outputs['Fac'], ramp.inputs['Fac'])
    ramp.color_ramp.elements[0].position = .35; ramp.color_ramp.elements[0].color = (.030, .031, .034, 1)
    ramp.color_ramp.elements[1].position = .7; ramp.color_ramp.elements[1].color = (.062, .064, .068, 1)
    L.new(ramp.outputs['Color'], p.inputs['Base Color'])
    # juntas de dilatação a cada 1,7 m (a grade da planta)
    br = N.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = .004
    br.inputs['Brick Width'].default_value = U; br.inputs['Row Height'].default_value = U; br.offset = 0.0
    br.inputs['Color1'].default_value = (1, 1, 1, 1); br.inputs['Color2'].default_value = (1, 1, 1, 1); br.inputs['Mortar'].default_value = (.3, .3, .3, 1)
    L.new(uv.outputs['UV'], br.inputs['Vector'])
    mixc = N.new('ShaderNodeMix'); mixc.data_type = 'RGBA'; mixc.blend_type = 'MULTIPLY'; mixc.inputs['Factor'].default_value = 1
    L.new(ramp.outputs['Color'], mixc.inputs['A']); L.new(br.outputs['Color'], mixc.inputs['B']); L.new(mixc.outputs['Result'], p.inputs['Base Color'])
    # rugosidade: polido com manchas foscas (o reflexo se quebra)
    rr = N.new('ShaderNodeMapRange'); rr.inputs['From Min'].default_value = .35; rr.inputs['From Max'].default_value = .65
    rr.inputs['To Min'].default_value = .10; rr.inputs['To Max'].default_value = .42
    ad = N.new('ShaderNodeMath'); ad.operation = 'MULTIPLY_ADD'; ad.inputs[1].default_value = .55
    L.new(n2.outputs['Fac'], ad.inputs[0]); L.new(n1.outputs['Fac'], ad.inputs[2])
    sc = N.new('ShaderNodeMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = .65; L.new(ad.outputs[0], sc.inputs[0])
    L.new(sc.outputs[0], rr.inputs['Value']); L.new(rr.outputs['Result'], p.inputs['Roughness'])
    p.inputs['Specular IOR Level'].default_value = .5
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .06; bump.inputs['Distance'].default_value = .002
    L.new(n2.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m

def mat_foto(nome, img):
    """a cópia: papel fotográfico (difuso + brilho de papel) com uma emissão fraca da própria foto"""
    m, nt, out = novo_mat(nome); p = principled(nt, out); N = nt.nodes; L = nt.links
    tx = N.new('ShaderNodeTexImage'); tx.image = img; tx.interpolation = 'Cubic'; tx.location = (-300, 0)
    L.new(tx.outputs['Color'], p.inputs['Base Color'])
    L.new(tx.outputs['Color'], p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value = EMISSAO_FOTO
    p.inputs['Roughness'].default_value = .32; p.inputs['Specular IOR Level'].default_value = .45
    return m
EMISSAO_FOTO = .32

# ------------------------------------------------------------------ casca: paredes (20 cm), piso e teto
mconc, mpiso = mat_concreto(), mat_piso()
mteto = mat_solido('#070707', .9, nome='teto')
E = .2
NEBLINA = .012
porta = D['porta']; pf = porta['facing']; pside = (pf[1], -pf[0])
VAO_W, VAO_H = porta['vao']['w'], porta['vao']['h']

def caixa_parede(verts, faces, uvs, a, fim, n, h0, h1, l0, l1, along_u0):
    """um bloco da parede entre as distâncias l0..l1 ao longo de a->b e alturas h0..h1, 20 cm pra trás"""
    ax, az = a; bx, bz = fim; L = math.hypot(bx - ax, bz - az); dx, dz = (bx - ax) / L, (bz - az) / L
    base = len(verts)
    for (l, hh, back) in [(l0, h0, 0), (l1, h0, 0), (l1, h1, 0), (l0, h1, 0), (l0, h0, 1), (l1, h0, 1), (l1, h1, 1), (l0, h1, 1)]:
        x = ax + dx * l - n[0] * E * back; z = az + dz * l - n[1] * E * back
        verts.append(b(x, hh, z)); uvs.append(((ax + dx * l) if abs(dx) > .5 else (az + dz * l), hh))
    for f in [(0, 1, 2, 3), (5, 4, 7, 6), (4, 0, 3, 7), (1, 5, 6, 2), (3, 2, 6, 7), (4, 5, 1, 0)]:
        faces.append(tuple(base + i for i in f))

pv, pfc, puv = [], [], []
for w in D['paredes']:
    a, bb, n = w['a'], w['b'], w['normal']
    L = math.hypot(bb[0] - a[0], bb[1] - a[1]); dx, dz = (bb[0] - a[0]) / L, (bb[1] - a[1]) / L
    u0 = a[0] * abs(dx) * (1 if dx >= 0 else -1) + a[1] * abs(dz) * (1 if dz >= 0 else -1)  # u contínuo ao longo do mundo
    # a parede da porta do PALCO ganha o vão
    no_plano = abs((a[0] - porta['x']) * pf[0] + (a[1] - porta['z']) * pf[1]) < .1 and abs(n[0] - pf[0]) + abs(n[1] - pf[1]) < 1e-3
    cortes = []
    if no_plano:
        la = (porta['x'] - pside[0] * VAO_W / 2 - a[0]) * dx + (porta['z'] - pside[1] * VAO_W / 2 - a[1]) * dz
        lb = (porta['x'] + pside[0] * VAO_W / 2 - a[0]) * dx + (porta['z'] + pside[1] * VAO_W / 2 - a[1]) * dz
        lo, hi = max(0, min(la, lb)), min(L, max(la, lb))
        if hi > lo: cortes = [(lo, hi)]
    if not cortes:
        caixa_parede(pv, pfc, puv, a, bb, n, 0, H, 0, L, u0)
    else:
        lo, hi = cortes[0]
        if lo > 1e-4: caixa_parede(pv, pfc, puv, a, bb, n, 0, H, 0, lo, u0)
        if hi < L - 1e-4: caixa_parede(pv, pfc, puv, a, bb, n, 0, H, hi, L, u0)
        caixa_parede(pv, pfc, puv, a, bb, n, VAO_H, H, lo, hi, u0)
paredes = objeto('paredes', malha('paredes', pv, pfc, puv), 'corredor'); paredes.data.materials.append(mconc)

def laje(nome, y0, y1, mat):
    vs, fs, uvs = [], [], []
    for i, j in D['piso']:
        x0, x1, z0, z1 = i * U, (i + 1) * U, j * U, (j + 1) * U
        base = len(vs)
        for (x, z) in [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]: vs.append(b(x, y1, z)); uvs.append((x, -z))
        for (x, z) in [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]: vs.append(b(x, y0, z)); uvs.append((x, -z))
        fs += [tuple(base + k for k in f) for f in [(0, 1, 2, 3), (7, 6, 5, 4)]]
    me = malha(nome, vs, fs, uvs)
    # funde vértices coincidentes (a laje vira uma peça só, sem frestas entre células)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = objeto(nome, me, 'corredor'); o.data.materials.append(mat)
    return o
piso = laje('piso', -.2, 0.0, mpiso)
teto = laje('teto', H, H + .2, mteto)
for f in teto.data.polygons: f.flip()  # normais pra baixo, pra dentro do corredor

# ------------------------------------------------------------------ as cópias
mpapel = mat_solido('#ece9e2', .55, nome='papel')
FOTOS = []
for c in D['copias']:
    arq = do_site(c['foto'])
    img = imagem(arq)
    w, h = c['w'], c['h']
    mw = mundo_pq(c['pos'], c['quat'])
    nome = f"copia_{c['ordem']:03d}"
    o = objeto(nome, geo_plano(w, h).copy(), 'copias', mw); o.data.name = nome
    o.data.materials.append(mat_foto('foto_' + nome, img))
    o['ordem'] = c['ordem']; o['artista'] = c['artista']; o['ala'] = c['alaNome']; o['foto'] = c['foto']
    # papel: 2,5 cm de borda, 2 mm atrás da foto, 1 mm de espessura (sombra de verdade na borda)
    pp = objeto(f'papel_{c["ordem"]:03d}', geo_caixa(w + .05, h + .05, .001), 'copias', mw @ Matrix.Translation((0, 0, -.0025)))
    if not pp.data.materials: pp.data.materials.append(mpapel)
    FOTOS.append((c, mw))

# ------------------------------------------------------------------ o resto da cena do motor (clima, projeções, fitas)
objs = D['objetos']
glow = Counter(o['mapa'] for o in objs if o['aditivo'] and o['mapa']).most_common(1)[0][0]  # a textura radial da "luz falsa"
TEX = {t['id']: t for t in D['texturas']}
def img_tex(tid):
    t = TEX[tid]
    if t.get('arquivo'): return imagem(os.path.join(DADOS, t['arquivo']))
    src = t['src']; rel = src.split('/', 3)[-1] if '://' in src else src
    return imagem(do_site(rel))

def perto_da_porta(mw):
    p = mw.translation  # Blender
    x, z = p.x, -p.y
    fr = (x - porta['x']) * pf[0] + (z - porta['z']) * pf[1]
    la = (x - porta['x']) * pside[0] + (z - porta['z']) * pside[1]
    return -.05 < fr < .15 and abs(la) < 1.6 and p.z > .1

VERMELHO = (1.0, .045, .03, 1)
lamp_vermelho = []
vaza_vermelho = []
folhas_objs = {0: [], 1: []}
cont = Counter()
for k, o in enumerate(objs):
    g = o['geo']
    if o['palco'] or o['alphaMapa']: continue                      # o clarão do palco e os reflexos falsos de tela
    if o['aditivo'] and o['mapa'] == glow and o['cor'] == '#ff1010' and g['tipo'] == 'plano':
        mw = mundo(o['m']); vaza_vermelho.append((mw.translation.copy(), (mw.to_3x3() @ Vector((0, 0, 1))).normalized()))
    if o['aditivo'] and (o['mapa'] == glow or g['tipo'] == 'malha'): continue  # luz falsa e facho: viram luz de verdade
    insts = o.get('instancias') or [{'m': o['m']}]
    nome = (o['nome'] or g['tipo']) + f'_{k:03d}'
    me = geo_de(o, nome)
    # material
    if o['aditivo']:  # o que brilha de verdade: fresta da porta, SILÊNCIO
        cor = srgb(o['cor'])
        mat = mat_emissivo(f'emite_{k:03d}', cor, 2.0, img_tex(o['mapa']) if o['mapa'] else None, alfa=bool(o['mapa']))
    elif o['tela'] is not None:
        tela = next(t for t in D['telas'] if t['lance'] == o['tela'])
        mat = mat_emissivo(f'tela_{o["tela"]}', (1, 1, 1, 1), 1.2, imagem(do_site(tela['poster'])))
    elif g['tipo'] == 'disco' and o['cor'] == '#fff6e0':
        mat = mat_emissivo('lente', (1.0, .80, .58, 1), 6.0)
    elif g['tipo'] == 'caixa' and o['cor'] == '#ff2020':
        mat = mat_emissivo('lampada_vermelha', VERMELHO, 40.0)
    elif o['mapa']:
        t = TEX[o['mapa']]
        acesa = o['semNevoa']  # a placa PALCO
        mat = mat_textura(f'tex_{o["mapa"]}_{"acesa" if acesa else "tinta"}', img_tex(o['mapa']), o['cor'], alfa=o['transparente'] or True,
                          emissao=2.5 if acesa else 0.0, repeat=tuple(t['repeat']))
    else:
        cor = o['cor']
        rough = .35 if cor in ('#0b0b0b', '#1d1d1d', '#0d0d0d') else .6
        mat = mat_solido(cor, rough, metal=.6 if cor == '#0d0d0d' else 0.0)
    for i, inst in enumerate(insts):
        mw = mundo(inst['m'])
        if o['folha'] is not None: col = 'porta'
        elif o['grupo'] == 'copias': col = 'copias'
        elif perto_da_porta(mw): col = 'porta'
        else: col = 'enfeites'
        ob = objeto(f'{nome}_{i:03d}' if len(insts) > 1 else nome, me, col, mw)
        if not ob.data.materials: ob.data.materials.append(mat)
        elif ob.data.materials[0] != mat: ob.material_slots[0].link = 'OBJECT'; ob.material_slots[0].material = mat
        if o['folha'] is not None: folhas_objs[o['folha']].append(ob)
        if o['aditivo'] and not o['mapa'] and col == 'porta': ob['fresta'] = True  # a luz que vaza some quando a porta abre
        if g['tipo'] == 'caixa' and o['cor'] == '#ff2020': lamp_vermelho.append(mw.translation.copy())
        # o refletor (corpo e lente) não faz sombra: a luz de verdade sai de dentro dele
        if (g['tipo'] == 'cilindro' and o['cor'] == '#0d0d0d') or (g['tipo'] == 'disco' and o['cor'] == '#fff6e0'):
            ob.visible_shadow = False
        cont[col] += 1

# ---- porta: folhas com pivô (empties girando no Z do Blender = Y do three)
pivos = []
for idx, f in enumerate(porta['folhas']):
    e = bpy.data.objects.new(f'porta_pivo_{"E" if f["s"] < 0 else "D"}', None); cols['porta'].objects.link(e)
    e.empty_display_size = .3; e.location = b(*f['pivo']); e.rotation_euler = (0, 0, f['yaw'])
    e['s'] = f['s']; e['yaw'] = f['yaw']
    bpy.context.view_layer.update()
    for ob in folhas_objs[idx]:
        mw = ob.matrix_world.copy(); ob.parent = e; ob.matrix_world = mw
    pivos.append(e)
# ------------------------------------------------------------------ o palco, do outro lado da porta (cena nova da etapa 3)
# Um espaço preto grande (14 x 12 x 8 m), chão de palco escuro e acetinado, neblina, e um contraluz só, alto no fundo,
# apontado pro vão: pela porta aberta ele vira um facho que atravessa e pousa no piso do corredor. Sem gente, sem instrumento.
PW, PD, PH = 14.0, 12.0, 8.0
def em_palco(lado, frente, y):
    """ponto no palco: `frente` metros pra dentro (além da parede da porta), `lado` metros pro lado; devolve Blender"""
    return b(porta['x'] - pf[0] * (E + frente) + pside[0] * lado, y, porta['z'] - pf[1] * (E + frente) + pside[1] * lado)
centro = em_palco(0, PD / 2, PH / 2)
mw_sala = Matrix.Translation(centro) @ Matrix.Rotation(-math.atan2(pf[0], pf[1]), 4, 'Z')
sala_me = geo_caixa(PW, PD, PH).copy(); sala_me.name = 'palco_sala'   # (aqui já em eixos do Blender: x lado, y fundo, z alto)
sala = objeto('palco_sala', sala_me, 'porta', mw_sala)
for f in sala.data.polygons: f.flip()
bm = bmesh.new(); bm.from_mesh(sala.data)
# sai a face virada pro corredor (o vão abre pro palco) e o chão (o chão é o deck)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.y > .9 or f.normal.z > .9], context='FACES')
bm.to_mesh(sala.data); bm.free()
sala.data.materials.append(mat_solido('#020202', .95, nome='palco_parede'))
# o deck: tábuas escuras, acetinado (o contraluz desenha um rasgo de brilho nele)
def mat_deck():
    m, nt, out = novo_mat('palco_deck'); p = principled(nt, out); N = nt.nodes; L = nt.links
    tc = N.new('ShaderNodeTexCoord'); wv = N.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
    wv.inputs['Scale'].default_value = 2.6; wv.inputs['Distortion'].default_value = 1.5; wv.inputs['Detail'].default_value = 4
    L.new(tc.outputs['Object'], wv.inputs['Vector'])
    ramp = N.new('ShaderNodeValToRGB'); L.new(wv.outputs['Fac'], ramp.inputs['Fac'])
    ramp.color_ramp.elements[0].color = (.010, .009, .008, 1); ramp.color_ramp.elements[1].color = (.028, .024, .020, 1)
    L.new(ramp.outputs['Color'], p.inputs['Base Color'])
    rr = N.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .22; rr.inputs['To Max'].default_value = .4
    L.new(wv.outputs['Fac'], rr.inputs['Value']); L.new(rr.outputs['Result'], p.inputs['Roughness'])
    return m
deck_me = geo_plano(PW, PD).copy(); deck_me.name = 'palco_deck'
deck = objeto('palco_deck', deck_me, 'porta', Matrix.Translation(em_palco(0, PD / 2, 0)) @ Matrix.Rotation(-math.atan2(pf[0], pf[1]), 4, 'Z'))
deck.data.materials.append(mat_deck())
# neblina só no palco (não entra no corredor)
neb_me = geo_caixa(PW - .1, PD - .1, PH - .1).copy(); neb_me.name = 'palco_neblina'
neb = objeto('palco_neblina', neb_me, 'porta', mw_sala)
mv, nt, out = novo_mat('neblina')
vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Density'].default_value = NEBLINA
vol.inputs['Anisotropy'].default_value = .7
nt.links.new(vol.outputs['Volume'], out.inputs['Volume']); neb.data.materials.append(mv)
neb.visible_shadow = False
# a fonte visível do contraluz: a lente de um refletor alto no fundo
fonte_me = geo_disco(.22, 24).copy(); fonte_me.name = 'palco_fonte'
pos_fonte = em_palco(.8, PD - 1.2, 5.2)
pfun = objeto('palco_fundo', fonte_me, 'porta')
pfun.location = pos_fonte
alvo_facho = b(porta['x'] + pf[0] * 3.0, 0, porta['z'] + pf[1] * 3.0)
pfun.rotation_euler = (alvo_facho - pos_fonte).normalized().to_track_quat('Z', 'Y').to_euler()
pfun.data.materials.append(mat_emissivo('palco_fundo', (1, .95, .88, 1), 60.0))
pfun.visible_shadow = False

# ------------------------------------------------------------------ luz
def luz(nome, tipo, pos_b, energia, cor, col='luzes', **kw):
    ld = bpy.data.lights.new(nome, tipo); ld.energy = energia; ld.color = cor
    for k2, v in kw.items(): setattr(ld, k2, v)
    o = objeto(nome, ld, col); o.location = pos_b
    return o

def mirar(o, alvo_b):
    d = (alvo_b - o.location).normalized()
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

QUENTE = (1.0, .86, .70)
POT_SPOT = 45.0
for c, mw in FOTOS:
    f = c['facing']; x, y, z = c['pos']
    fx, fz = x + f[0] * .55, z + f[1] * .55
    o = luz(f'spot_{c["ordem"]:03d}', 'SPOT', b(fx, H - .30, fz), POT_SPOT, QUENTE, spot_size=math.radians(62), spot_blend=.32, shadow_soft_size=.03)
    mirar(o, b(x, y + .12, z))
# vermelho de saída de emergência: a barra acesa e o vazamento perto dela (queda rápida, não pinta a parede)
for i, p in enumerate(lamp_vermelho):
    luz(f'vermelho_{i}', 'POINT', p, 35.0, VERMELHO[:3], shadow_soft_size=.05)
    luz(f'vermelho_piso_{i}', 'POINT', Vector((p.x, p.y, .35)), 6.0, VERMELHO[:3], shadow_soft_size=.1)
for i, (pos, nrm) in enumerate(vaza_vermelho):
    luz(f'vermelho_parede_{i:02d}', 'POINT', pos + nrm * .25 + Vector((0, 0, .6)), 5.0, VERMELHO[:3], shadow_soft_size=.08)
# porta: a placa PALCO acesa e o SILÊNCIO; a fresta de luz por baixo e no meio
pd = Vector(b(porta['x'] + pf[0] * .45, 2.9, porta['z'] + pf[1] * .45))
o = luz('palco_placa', 'SPOT', pd, 25.0, (1, .93, .85), spot_size=math.radians(40), spot_blend=.5, shadow_soft_size=.05)
mirar(o, b(porta['x'], 2.6, porta['z']))
luz('silencio', 'POINT', b(porta['x'] + pside[0] * 1.3 + pf[0] * .15, 2.05, porta['z'] + pside[1] * 1.3 + pf[1] * .15), 8.0, VERMELHO[:3], shadow_soft_size=.1)
fr = luz('fresta_porta', 'AREA', b(porta['x'] + pf[0] * .03, .02, porta['z'] + pf[1] * .03), 4.0, (1, .9, .75), shape='RECTANGLE', size=1.8, size_y=.03)
mirar(fr, b(porta['x'] + pf[0] * 1.5, 0, porta['z'] + pf[1] * 1.5))
# o contraluz do palco: um refletor só, alto no fundo, atirando pelo vão (render.py anima: acende com as folhas)
cs = luz('palco_facho', 'SPOT', pos_fonte - (alvo_facho - pos_fonte).normalized() * .05, 9000.0, (1, .95, .88), col='porta', spot_size=math.radians(16), spot_blend=.35, shadow_soft_size=.2)
mirar(cs, alvo_facho)
# zebrado e marcas de palco: um facho estreito de cima (não é luz ambiente)
o = luz('porta_servico', 'SPOT', b(porta['x'] + pf[0] * 2.2, H - .2, porta['z'] + pf[1] * 2.2), 140.0, (1, .86, .66), spot_size=math.radians(48), spot_blend=.45, shadow_soft_size=.04)
mirar(o, b(porta['x'] + pf[0] * 2.0, 0, porta['z'] + pf[1] * 2.0))
# telas: a luz do filme na parede/piso (área fraca, da cor neutra do pôster)
for t in D['telas']:
    tf = t['facing']
    o = luz(f'tela_luz_{t["lance"]}', 'AREA', b(t['x'] + tf[0] * .1, t['cy'], t['z'] + tf[1] * .1), 25.0, (.85, .88, 1.0), shape='RECTANGLE', size=t['w'], size_y=t['h'])
    mirar(o, b(t['x'] + tf[0] * 3, t['cy'], t['z'] + tf[1] * 3))
# a setlist da entrada
s = D['setlist']['pos']
o = luz('spot_setlist', 'SPOT', b(s[0] + .55, H - .3, s[2]), 35.0, QUENTE, spot_size=math.radians(44), spot_blend=.55, shadow_soft_size=.03)
mirar(o, b(s[0], s[1] + .1, s[2]))

# ------------------------------------------------------------------ mundo e render (padrões; render.py escolhe o motor)
w = bpy.data.worlds.new('preto'); cena.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
cena.view_settings.view_transform = 'Standard'; cena.view_settings.look = 'None'
cena.render.fps = 30
cam = bpy.data.objects.new('camera', bpy.data.cameras.new('camera')); cena.collection.objects.link(cam); cena.camera = cam
cam.data.sensor_fit = 'VERTICAL'; cam.data.clip_start = .05; cam.data.clip_end = 200

bpy.context.view_layer.update()
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=SAIDA, compress=True)
n_luz = len(cols['luzes'].objects)
print(f'CENA {SAIDA}')
print(f'  copias {len([o for o in cols["copias"].objects if o.name.startswith("copia_")])}  luzes {n_luz}  porta {len(cols["porta"].objects)}  enfeites {len(cols["enfeites"].objects)}  imagens {len(bpy.data.images)}')
