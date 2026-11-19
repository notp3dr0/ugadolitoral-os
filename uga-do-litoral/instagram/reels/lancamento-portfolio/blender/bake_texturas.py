# Site, rodada 15: assa a COR do concreto do filme (parede e piso) em ladrilhos que o site repete.
# Não toca nos arquivos do filme: abre cena/corredor.blend só pra ler os materiais e escreve em luz_site/.
#
# Uso:  blender.exe -b cena/corredor.blend --python bake_texturas.py
# Depois: python bake_texturas_pos.py   (mistura as passadas, grava WebP pro site)
#
# Por que ladrilho: o mapa de luz tem ~54 px/m; a emenda da fôrma (6 mm) e o furo de tirante (5 cm) somem nele.
# A cor vai num quadro nítido (paredes: 4,8 m x 3,3 m em 2048 x 1408 = 427 px/m) que repete pelo corredor, e a luz
# continua no mapa de luz por cima. O tijolo (painel 2,4 x 1,2 m, furo a cada 0,6 m) já repete a cada 4,8 m;
# o ruído das manchas não repete: assa-se o quadro em (u) e em (u - P), e o pós mistura as duas com peso linear,
# o que dá um ladrilho que emenda sem costura (no piso, nas duas direções: 4 passadas).
import bpy, os, sys, json, time

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, 'luz_site', 'tex'); os.makedirs(SAIDA, exist_ok=True)
D = json.load(open(os.path.join(AQUI, 'dados', 'corredor.json'), encoding='utf-8'))
H = D['HALL_HEIGHT']; U = D['U']
PAREDE = {'P': 4.8, 'w': 2048, 'h': 1408}
PISO = {'P': 2 * U, 'w': 1024, 'h': 1024}

cena = bpy.context.scene
for o in list(cena.objects): o.hide_render = True

def plano(nome, w, h, u0, v0, mat):
    """plano w x h no chão do Blender; UV 'UV' = coordenada de mundo do material (u0..u0+w, v0..v0+h), 'alvo' = 0..1"""
    me = bpy.data.meshes.new(nome)
    me.from_pydata([(0, 0, 0), (w, 0, 0), (w, h, 0), (0, h, 0)], [], [(0, 1, 2, 3)]); me.update()
    uvm = me.uv_layers.new(name='UV'); alvo = me.uv_layers.new(name='alvo')
    cantos = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for li, lp in enumerate(me.loops):
        cx, cy = cantos[lp.vertex_index]
        uvm.data[li].uv = (u0 + cx * w, v0 + cy * h)
        alvo.data[li].uv = (cx, cy)
    me.uv_layers.active = alvo           # o bake escreve no UV ativo
    uvm.active_render = True
    o = bpy.data.objects.new(nome, me); cena.collection.objects.link(o)
    m = mat.copy(); m.name = 'bake_' + mat.name
    for n in m.node_tree.nodes:
        if n.bl_idname == 'ShaderNodeUVMap': n.uv_map = 'UV'   # o material lê a coordenada de mundo
    me.materials.append(m)
    return o, m

def alvo_img(m, nome, w, h):
    img = bpy.data.images.new(nome, w, h, float_buffer=True, alpha=False)
    img.colorspace_settings.name = 'Non-Color'
    nt = m.node_tree
    for n in nt.nodes: n.select = False
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; t.select = True; nt.nodes.active = t
    return img

cena.render.engine = 'CYCLES'
cy = cena.cycles; cy.device = 'CPU'; cy.samples = 16; cy.use_adaptive_sampling = False; cy.use_denoising = False
bk = cena.render.bake; bk.margin = 0; bk.target = 'IMAGE_TEXTURES'

def assar(o, img, tipo, arq):
    for x in cena.objects: x.select_set(False)
    o.hide_render = False; o.select_set(True); bpy.context.view_layer.objects.active = o
    t = time.time()
    if tipo == 'COR': bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=0, use_clear=True)
    else: bpy.ops.object.bake(type='ROUGHNESS', margin=0, use_clear=True)
    img.filepath_raw = os.path.join(SAIDA, arq); img.file_format = 'OPEN_EXR'; img.save()
    o.hide_render = True
    print(f'  {arq}: {time.time() - t:.1f} s', flush=True)

mpar = bpy.data.materials['concreto_parede']; mpiso = bpy.data.materials['concreto_piso']

# parede: passada A em u 0..P, passada B em u -P..0 (a mesma coluna "um ladrilho antes")
P = PAREDE['P']
for k, u0 in (('a', 0.0), ('b', -P)):
    o, m = plano(f'tile_parede_{k}', P, H, u0, 0.0, mpar)
    assar(o, alvo_img(m, f'parede_{k}', PAREDE['w'], PAREDE['h']), 'COR', f'parede_{k}.exr')

# piso: quatro passadas (u e v deslocados de -P); a cor e a rugosidade (pro reflexo falso)
P = PISO['P']
for k, (u0, v0) in (('aa', (0, 0)), ('ba', (-P, 0)), ('ab', (0, -P)), ('bb', (-P, -P))):
    o, m = plano(f'tile_piso_{k}', P, P, u0, v0, mpiso)
    assar(o, alvo_img(m, f'piso_{k}', PISO['w'], PISO['h']), 'COR', f'piso_{k}.exr')
    o2, m2 = plano(f'tile_piso_r_{k}', P, P, u0, v0, mpiso)
    assar(o2, alvo_img(m2, f'piso_r_{k}', 512, 512), 'RUGOSIDADE', f'piso_r_{k}.exr')

json.dump({'parede': PAREDE, 'piso': PISO, 'altura': H}, open(os.path.join(SAIDA, 'tex.json'), 'w'), indent=1)
print('FIM', flush=True)
