# Objetos do bastidor (rodada 19) · a pulseira de festival sozinha (sem mão: o Pedro não quis braço realista).
# Cetim vermelho com FOTO · ALL ACCESS, o fecho de plástico e a ponta solta, fechada em volta de um pulso invisível,
# vista um pouco de cima. Uso: python estampas.py ; blender.exe -b --python pulseira.py [-- --previa]
# Saída: ../site-lab/bastidor/objetos/pulseira.webp (fundo transparente)
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.normpath(os.path.join(AQUI, '..', 'site-lab', 'bastidor', 'objetos')); os.makedirs(SAIDA, exist_ok=True)
PREVIA = '--previa' in sys.argv
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
UV = [float(x) for x in argv[argv.index('--uv') + 1].split(',')] if '--uv' in argv else [0, 0]

bpy.ops.wm.read_factory_settings(use_empty=True)
c = bpy.context.scene
eixo = Vector((0, 0, 1)); u = Vector((1, 0, 0)); w = eixo.cross(u)     # pulso em pé
centro = Vector((0, 0, 0)); raio = .034; LARG = .02; N = 200

tex = bpy.data.images.load(os.path.join(AQUI, 'pulseira.png'))
cetim = bpy.data.materials.new('cetim'); cetim.use_nodes = True; nt = cetim.node_tree; p = nt.nodes['Principled BSDF']
t = nt.nodes.new('ShaderNodeTexImage'); t.image = tex; nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
p.inputs['Roughness'].default_value = .58; p.inputs['Sheen Weight'].default_value = .1
plastico = bpy.data.materials.new('fecho'); plastico.use_nodes = True
pp = plastico.node_tree.nodes['Principled BSDF']; pp.inputs['Base Color'].default_value = (.03, .03, .035, 1); pp.inputs['Roughness'].default_value = .25

bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UV'); aneis = []
for i in range(N + 1):
    a = 2 * math.pi * i / N
    rad = u * math.cos(a) + w * math.sin(a)
    folga = 1 + .07 * max(0, math.cos(a - 2.4)) ** 3        # cai um pouco do lado do fecho
    q = centro + rad * raio * folga + eixo * .003 * math.sin(a * 2)   # e ondula de leve (não é anel de metal)
    s = i / N * .92
    aneis.append((bm.verts.new(q - eixo * LARG / 2), bm.verts.new(q + eixo * LARG / 2), (1 - s) if UV[0] else s))
V0, V1 = (1, 0) if UV[1] else (0, 1)
for i in range(N):
    f = bm.faces.new((aneis[i][0], aneis[i + 1][0], aneis[i + 1][1], aneis[i][1]))
    for lp, uvv in zip(f.loops, [(aneis[i][2], V0), (aneis[i + 1][2], V0), (aneis[i + 1][2], V1), (aneis[i][2], V1)]): lp[uvl].uv = uvv
a0 = 2.4; rad = u * math.cos(a0) + w * math.sin(a0); pf = centro + rad * (raio * 1.07 + .004)
fecho = bmesh.ops.create_cube(bm, size=1)['verts']
rot = Matrix((eixo, rad, eixo.cross(rad))).transposed().to_4x4()
bmesh.ops.transform(bm, matrix=Matrix.Translation(pf) @ rot @ Matrix.Diagonal((.024, .008, .013, 1)), verts=fecho)
bmesh.ops.bevel(bm, geom=list({e for v in fecho for e in v.link_edges}), offset=.0015, segments=3, affect='EDGES')
o = bpy.data.objects.new('pulseira', bpy.data.meshes.new('pulseira')); bm.to_mesh(o.data); bm.free(); c.collection.objects.link(o)
o.data.materials.append(cetim); o.data.materials.append(plastico)
for poly in o.data.polygons:
    poly.use_smooth = False
    if (poly.center - pf).length < .016: poly.material_index = 1
# a ponta solta, caindo do fecho
pt = bmesh.new(); uvp = pt.loops.layers.uv.new('UV'); prev = None; lado = -eixo.cross(rad)
for k in range(13):
    s = k / 12; q = pf + rad * .007 + lado * (.01 + .045 * s) + Vector((0, 0, -.06 * s * s))
    a_, b_ = pt.verts.new(q - eixo * LARG / 2 * .96), pt.verts.new(q + eixo * LARG / 2 * .96)
    if prev:
        f = pt.faces.new((prev[0], a_, b_, prev[1]))
        for lp, uvv in zip(f.loops, [(.92 + (k - 1) * .006, V0), (.92 + k * .006, V0), (.92 + k * .006, V1), (.92 + (k - 1) * .006, V1)]): lp[uvp].uv = uvv
    prev = (a_, b_)
po = bpy.data.objects.new('ponta', bpy.data.meshes.new('ponta')); pt.to_mesh(po.data); pt.free(); c.collection.objects.link(po)
po.data.materials.append(cetim)
for poly in po.data.polygons: poly.use_smooth = False
o.rotation_euler = (math.radians(-18), math.radians(8), math.radians(-30)); po.rotation_euler = o.rotation_euler

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); c.collection.objects.link(cam); c.camera = cam
cam.location = (0, -.26, .08); cam.rotation_euler = (Vector((0, 0, -.005)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 92
def area(nome, loc, tam, energia, cor):
    l = bpy.data.lights.new(nome, 'AREA'); l.size = tam; l.energy = energia; l.color = cor
    ob = bpy.data.objects.new(nome, l); ob.location = loc; c.collection.objects.link(ob)
    ob.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('cima', (-.05, -.12, .35), .3, 9, (1, .94, .86))
area('vermelho', (-.3, -.05, .02), .2, 6, (1, .1, .07))
area('recorte', (.25, .15, .2), .15, 5, (.85, .9, 1))
wd = bpy.data.worlds.new('w'); c.world = wd; wd.use_nodes = True; wd.node_tree.nodes['Background'].inputs['Color'].default_value = (.01, .008, .008, 1)
c.render.engine = 'CYCLES'; cy = c.cycles
try:
    pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'CUDA'; pr.get_devices()
    for d in pr.devices: d.use = d.type == 'CUDA'
    cy.device = 'GPU'
except Exception: pass
cy.samples = 48 if PREVIA else 256; cy.use_denoising = True
c.render.film_transparent = True; c.view_settings.view_transform = 'Standard'
c.render.resolution_x, c.render.resolution_y = (600, 600) if PREVIA else (1200, 1200)
c.render.image_settings.file_format = 'PNG'; c.render.image_settings.color_mode = 'RGBA'
c.render.filepath = os.path.join(AQUI, 'previa-pulseira.png') if PREVIA else os.path.join(SAIDA, 'pulseira.png')
bpy.ops.render.render(write_still=True)
print('FIM', c.render.filepath, flush=True)
