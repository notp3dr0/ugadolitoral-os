# Objetos do bastidor (rodada 19) · o crachá de verdade: cordão de cetim em V com prendedor de metal, e a capa de
# PVC transparente por cima do cartão. O cartão continua HTML no site (a foto é sorteada a cada visita); daqui saem
# duas imagens com fundo transparente que o site põe em cima e em volta dele.
# Uso: python estampas.py ; blender.exe -b --python credencial.py
# Saída: ../site-lab/bastidor/objetos/cordao.png (100 x 70 mm) e capa.png (108 x 166 mm)
# Medidas (mm; o cartão do site é 100 x 150): cordão no quadro x -50..50, z -8..62 (o cartão começa em z = -12);
# capa no quadro x -54..54, z -166..0 (o cartão fica em x -50..50, z -12..-162).
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.normpath(os.path.join(AQUI, '..', 'site-lab', 'bastidor', 'objetos')); os.makedirs(SAIDA, exist_ok=True)
MM = .01   # 1 mm = 0,01 unidade do Blender

def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    c = bpy.context.scene
    c.render.engine = 'CYCLES'; cy = c.cycles
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'CUDA'; pr.get_devices()
        for d in pr.devices: d.use = d.type == 'CUDA'
        cy.device = 'GPU'
    except Exception: pass
    cy.samples = 256; cy.use_denoising = True
    c.render.film_transparent = True; cy.film_transparent_glass = True; cy.film_transparent_roughness = .2
    c.view_settings.view_transform = 'Standard'; c.view_settings.look = 'None'
    c.render.image_settings.file_format = 'PNG'; c.render.image_settings.color_mode = 'RGBA'
    w = bpy.data.worlds.new('mundo'); c.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (.02, .02, .022, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1
    return c

def mat(nome, cor=(.8, .8, .8), metal=0., rough=.5, transm=0., ior=1.45, img=None, bump=0.):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*cor, 1); p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough; p.inputs['IOR'].default_value = ior
    p.inputs['Transmission Weight'].default_value = transm
    if img:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(AQUI, img)); nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    if bump:
        n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 900; n.inputs['Detail'].default_value = 2
        b = nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = bump; b.inputs['Distance'].default_value = .0004
        nt.links.new(n.outputs['Fac'], b.inputs['Height']); nt.links.new(b.outputs['Normal'], p.inputs['Normal'])
    return m

def objeto(nome, bm, m, liso=True):
    for f in bm.faces: f.smooth = liso
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nome, me); bpy.context.scene.collection.objects.link(o); me.materials.append(m)
    return o

def luzes(c):
    # softbox grande em cima à esquerda (o risco de luz na capa), um recorte quente à direita e um vermelho baixo (o corredor)
    def area(nome, loc, rot, tam, energia, cor):
        l = bpy.data.lights.new(nome, 'AREA'); l.size = tam; l.energy = energia; l.color = cor
        o = bpy.data.objects.new(nome, l); o.location = loc; o.rotation_euler = rot; c.collection.objects.link(o)
    area('soft', (-1.2, -1.6, 1.6), (math.radians(-55), 0, math.radians(-35)), 1.6, 180, (1, .97, .92))
    area('recorte', (1.4, -.6, .4), (math.radians(-90), 0, math.radians(60)), .8, 70, (1, .9, .8))
    area('vermelho', (.2, -1.2, -1.6), (math.radians(-140), 0, 0), 1.2, 60, (1, .1, .08))
    # cartões de estúdio fora do quadro: o metal e o plástico refletem alguma coisa
    for k, (x, z) in enumerate([(-1.5, .6), (1.5, -.3)]):
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=.6)
        o = objeto(f'cartao{k}', bm, mat(f'emite{k}'), False); o.location = (x, -.8, z); o.rotation_euler = (math.radians(90), 0, math.radians(-30 if x < 0 else 30))
        em = o.active_material.node_tree; p = em.nodes['Principled BSDF']; p.inputs['Emission Color'].default_value = (1, 1, 1, 1); p.inputs['Emission Strength'].default_value = 3
        o.visible_camera = False

def camera(c, x0, x1, z0, z1, px_mm=8):
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); c.collection.objects.link(cam); c.camera = cam
    cam.data.type = 'ORTHO'; w, h = (x1 - x0) * MM, (z1 - z0) * MM
    cam.data.ortho_scale = max(w, h); cam.location = ((x0 + x1) / 2 * MM, -3, (z0 + z1) / 2 * MM); cam.rotation_euler = (math.radians(90), 0, 0)
    c.render.resolution_x = round((x1 - x0) * px_mm); c.render.resolution_y = round((z1 - z0) * px_mm)
    cam.data.sensor_fit = 'HORIZONTAL' if w >= h else 'VERTICAL'

# ------------------------------------------------------------------ o cordão
def fita(p0, p1, largura, m, torce=0., segs=40):
    """tira de cetim de p0 a p1 (mm, no plano xz), com uma leve torção e espessura; UV corre no comprimento"""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UV')
    a, b = Vector((p0[0], 0, p0[1])), Vector((p1[0], 0, p1[1])); d = (b - a); L = d.length; d.normalize(); lado = Vector((-d.z, 0, d.x))  # perpendicular no plano
    linhas = []
    for i in range(segs + 1):
        t = i / segs; c = a + (b - a) * t
        ang = torce * math.sin(math.pi * t)
        off = lado * math.cos(ang) * largura / 2 + Vector((0, -1, 0)) * math.sin(ang) * largura / 2
        linhas.append((bm.verts.new((c - off) * MM), bm.verts.new((c + off) * MM), t * L / 400))
    for i in range(segs):
        f = bm.faces.new((linhas[i][0], linhas[i][1], linhas[i + 1][1], linhas[i + 1][0]))
        for lp, (u, v) in zip(f.loops, [(linhas[i][2], 0), (linhas[i][2], 1), (linhas[i + 1][2], 1), (linhas[i + 1][2], 0)]): lp[uv].uv = (u, v)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.6 * MM)
    return objeto('fita', bm, m)

def toro(c, R, r, eixo='Y', escala=(1, 1, 1), segs=32, m=None):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, segments=1, radius=1)  # (só pra inicializar camadas)
    bm.free(); bm = bmesh.new()
    vs = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        anel = []
        for j in range(12):
            b = 2 * math.pi * j / 12
            p = Vector(((R + r * math.cos(b)) * math.cos(a), r * math.sin(b), (R + r * math.cos(b)) * math.sin(a)))
            anel.append(bm.verts.new(p))
        vs.append(anel)
    for i in range(segs):
        for j in range(12):
            bm.faces.new((vs[i][j], vs[(i + 1) % segs][j], vs[(i + 1) % segs][(j + 1) % 12], vs[i][(j + 1) % 12]))
    rot = {'Y': Matrix.Identity(4), 'Z': Matrix.Rotation(math.pi / 2, 4, 'X')}[eixo]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c) * MM) @ Matrix.Diagonal((*escala, 1)) @ rot @ Matrix.Scale(MM, 4), verts=bm.verts)
    return objeto('toro', bm, m)

def caixa(c, s, m, raio=0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c) * MM) @ Matrix.Diagonal((s[0] * MM, s[1] * MM, s[2] * MM, 1)), verts=bm.verts)
    if raio: bmesh.ops.bevel(bm, geom=bm.edges[:], offset=raio * MM, segments=3, affect='EDGES')
    return objeto('caixa', bm, m)

def cilindro(c, r, h, m, eixo='Z'):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=r * MM, radius2=r * MM, depth=h * MM)
    rot = Matrix.Identity(4) if eixo == 'Z' else Matrix.Rotation(math.pi / 2, 4, 'X')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c) * MM) @ rot, verts=bm.verts)
    return objeto('cil', bm, m)

c = limpar(); luzes(c)
cetim = mat('cetim', rough=.32, img='cordao.png', bump=.08)
cromo = mat('cromo', cor=(.9, .9, .92), metal=1, rough=.16)
# as duas tiras sobem em V até sair do quadro; descem até o prendedor
fita((-36, 76), (-3.5, 21), 20, cetim, torce=.25)  # (a estampa corre no comprimento)
fita((36, 76), (3.5, 21), 20, cetim, torce=-.25)
caixa((0, -1.2, 19.5), (15, 4.5, 10), cromo, raio=1.2)          # a presilha que prende as duas pontas
cilindro((0, -1.2, 12.5), 2.4, 5, cromo)                         # o giratório
toro((0, -1.2, 4.5), 4.6, 1.35, 'Y', (1, 1, 1.45), m=cromo)     # o mosquetão (de frente)
cilindro((2.6, -1.2, 4.2), .9, 7, cromo)                         # a trava do mosquetão
toro((0, -1.2, -2.5), 4.2, .7, 'Z', (1, 1, 1), m=cromo)          # a argola que passa pela fenda da capa
camera(c, -50, 50, -8, 62, px_mm=9)
c.render.filepath = os.path.join(SAIDA, 'cordao.png'); bpy.ops.render.render(write_still=True)
print('cordao.png', c.render.resolution_x, c.render.resolution_y, flush=True)
# rodada 20: só o metal (presilha, giratório, mosquetão, argola): as fitas agora são desenhadas no site, com física
for ob in list(c.objects):
    if ob.name.startswith('fita'): ob.hide_render = True
camera(c, -10, 10, -9, 26, px_mm=16)
c.render.filepath = os.path.join(SAIDA, 'prendedor.png'); bpy.ops.render.render(write_still=True)
print('prendedor.png', c.render.resolution_x, c.render.resolution_y, flush=True)

# ------------------------------------------------------------------ a capa de PVC
c = limpar(); luzes(c)
curva = bpy.data.curves.new('capa', 'CURVE'); curva.dimensions = '2D'; curva.fill_mode = 'BOTH'; curva.resolution_u = 6
def retangulo_redondo(x0, x1, z0, z1, r, inverso=False):
    s = curva.splines.new('BEZIER'); pts = []
    cantos = [(x1 - r, z1, x1, z1 - r), (x1, z0 + r, x1 - r, z0), (x0 + r, z0, x0, z0 + r), (x0, z1 - r, x0 + r, z1)]
    for (ax, az, bx, bz) in cantos: pts += [(ax, az), (bx, bz)]
    if inverso: pts = pts[::-1]
    s.bezier_points.add(len(pts) - 1)
    for bp, (x, z) in zip(s.bezier_points, pts):
        bp.co = (x * MM, z * MM, 0); bp.handle_left_type = bp.handle_right_type = 'AUTO'
    s.use_cyclic_u = True
retangulo_redondo(-54, 54, -166, 0, 4)
retangulo_redondo(-11, 11, -8.5, -4.5, 1.9, inverso=True)        # a fenda por onde passa a argola
o = bpy.data.objects.new('capa', curva); c.collection.objects.link(o); o.rotation_euler = (math.radians(90), 0, 0)
bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target='MESH')
o = bpy.context.view_layer.objects.active
sol = o.modifiers.new('esp', 'SOLIDIFY'); sol.thickness = .7 * MM; sol.offset = 0
bev = o.modifiers.new('bev', 'BEVEL'); bev.width = .3 * MM; bev.segments = 2; bev.limit_method = 'ANGLE'
pvc = mat('pvc', cor=(.96, .97, 1), rough=.06, transm=1, ior=1.42)
o.data.materials.append(pvc)
for p in o.data.polygons: p.use_smooth = False
# uma dobra leve no meio (a capa de verdade nunca é plana): desloca o meio 1,2 mm pra frente
dfm = o.modifiers.new('dobra', 'SIMPLE_DEFORM'); dfm.deform_method = 'BEND'; dfm.deform_axis = 'Z'; dfm.angle = math.radians(4)
# o reflexo: uma placa de luz atrás da câmera com faixas diagonais (o que a capa lisa espelha de frente)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=2.5)
ref = objeto('reflexo', bm, bpy.data.materials.new('faixas'), False); ref.location = (0, -6, -.8); ref.rotation_euler = (math.radians(-90), 0, 0)
fm = ref.active_material; fm.use_nodes = True; nt = fm.node_tree; nt.nodes.clear()
outn = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 14
tc = nt.nodes.new('ShaderNodeTexCoord'); onda = nt.nodes.new('ShaderNodeTexWave'); onda.wave_type = 'BANDS'; onda.bands_direction = 'DIAGONAL'
onda.inputs['Scale'].default_value = .55; onda.inputs['Distortion'].default_value = 1.2
rampa = nt.nodes.new('ShaderNodeValToRGB'); rampa.color_ramp.elements[0].position = .62; rampa.color_ramp.elements[0].color = (0, 0, 0, 1); rampa.color_ramp.elements[1].position = .9
nt.links.new(tc.outputs['Generated'], onda.inputs['Vector']); nt.links.new(onda.outputs['Fac'], rampa.inputs['Fac'])
nt.links.new(rampa.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], outn.inputs['Surface'])
ref.visible_camera = False
camera(c, -54, 54, -166, 0, px_mm=7)
c.render.filepath = os.path.join(SAIDA, 'capa.png'); bpy.ops.render.render(write_still=True)
print('capa.png', c.render.resolution_x, c.render.resolution_y, flush=True)
print('FIM', flush=True)
