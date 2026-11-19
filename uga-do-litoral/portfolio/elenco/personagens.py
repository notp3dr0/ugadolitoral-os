# Elenco do bastidor (rodada 15) · monta as pessoas do site no Blender, por script, e exporta um .glb por pessoa.
# Base: Quaternius Universal Base Characters (CC0, corpo de anatomia de verdade, esqueleto de 65 ossos) e Universal
# Animation Library (CC0). Nada gerado por IA; ninguém imita pessoa real: o rosto vira liso (manequim), a função
# se lê pela silhueta, pela roupa e pelo objeto (pesquisa: reports/Bastidor fiel ao vídeo.md).
#
# Uso:  python atlas.py
#       blender.exe -b --python personagens.py -- [--so seguranca] [--previa]
# Saída: ../site-lab/bastidor/elenco/<tipo>.glb (corpo + poses) e movimento.glb (parado, andando, falando)
#        previa/<tipo>-{frente,costas,lado}.png com --previa
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Matrix, Quaternion

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTE = os.path.join(AQUI, 'fonte')
SAIDA = os.path.normpath(os.path.join(AQUI, '..', 'site-lab', 'bastidor', 'elenco'))
PREVIA = os.path.join(AQUI, 'previa')
os.makedirs(SAIDA, exist_ok=True); os.makedirs(PREVIA, exist_ok=True)
ATLAS = json.load(open(os.path.join(AQUI, 'atlas.json'), encoding='utf-8'))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SO = argv[argv.index('--so') + 1] if '--so' in argv else None
VER = '--previa' in argv

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c) + (1.0,)

PELE = '#7a5440'       # pele (cada tipo tem a sua)
CABELO = '#16110e'
CAMISETA = ATLAS['camiseta']

# ------------------------------------------------------------------ quem é quem
# regiões: cabeca, pescoco, tronco, braco (braço de cima), antebraco, mao, perna, pe
# 'infla' em metros (a roupa por cima do corpo), 'lisa' = passadas de alisamento (tira o músculo: vira pano)
TIPOS = {
    'seguranca': dict(base='Male', cores=dict(tronco=CAMISETA, braco=CAMISETA, perna='#1c1c1f', pe='#0b0b0b'),
                      infla=dict(tronco=.022, braco=.016, perna=.03, pe=.022), lisa=dict(tronco=6, braco=3, perna=10, pe=40),
                      largura=1.06, poses=['bracos', 'radio'], pele='#5b3a29', cabelo=['Hair_Buzzed', 'Hair_Beard']),
    'produtor': dict(base='Female', cores=dict(tronco=CAMISETA, braco=CAMISETA, perna='#1e1e24', pe='#26262a'),
                     infla=dict(tronco=.03, braco=.016, perna=.03, pe=.03), lisa=dict(tronco=24, braco=5, perna=16, pe=40),
                     largura=.96, poses=['prancheta'], pele='#9a6a4c', cabelo=['Hair_Buns']),
    'pose': dict(base='Female', cores=dict(tronco=CAMISETA, braco=CAMISETA, perna='#23232a', pe='#e4dfd4'),
                 infla=dict(tronco=.03, braco=.014, perna=.026, pe=.034), lisa=dict(tronco=24, braco=5, perna=14, pe=40),
                 largura=.96, poses=['foto'], pele='#6e4532', cabelo=['Hair_Long']),
    'artista': dict(base='Male', cores=dict(tronco='#0f0f10', braco='#0f0f10', antebraco='#0f0f10', perna='#161618', pe='#e6e1d6'),
                    infla=dict(tronco=.04, braco=.032, antebraco=.026, perna=.034, pe=.034), lisa=dict(tronco=12, braco=8, antebraco=6, perna=10, pe=40),
                    largura=1.0, poses=[], pele='#3f281d', cabelo=['Hair_Beard']),
    'equipe': dict(base='Male', cores=dict(tronco=CAMISETA, braco=CAMISETA, perna='#1d1d20', pe='#0d0d0d', mao='#0e0e0e'),
                   infla=dict(tronco=.02, braco=.014, perna=.03, pe=.022, mao=.004), lisa=dict(tronco=6, braco=3, perna=10, pe=40),
                   largura=1.0, poses=[], pele='#a9765a', cabelo=['Hair_Buzzed', 'Hair_Beard']),
}

REGIAO = {'Head': 'cabeca', 'neck_01': 'pescoco', 'spine_01': 'tronco', 'spine_02': 'tronco', 'spine_03': 'tronco',
          'clavicle_l': 'tronco', 'clavicle_r': 'tronco', 'upperarm_l': 'braco', 'upperarm_r': 'braco',
          'lowerarm_l': 'antebraco', 'lowerarm_r': 'antebraco', 'thigh_l': 'perna', 'thigh_r': 'perna',
          'calf_l': 'perna', 'calf_r': 'perna', 'foot_l': 'pe', 'foot_r': 'pe', 'ball_l': 'pe', 'ball_r': 'pe', 'root': 'perna'}
def regiao_do_osso(nome, z, cintura):
    if nome == 'pelvis': return 'tronco' if z > cintura else 'perna'
    if nome in REGIAO: return REGIAO[nome]
    return 'mao'   # dedos e mãos

# ------------------------------------------------------------------ utilidades
def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def importar(base):
    bpy.ops.import_scene.gltf(filepath=os.path.join(FONTE, f'Superhero_{base}_FullBody.gltf'))
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    corpo = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('Super'))
    extras = []
    for o in list(bpy.data.objects):
        if o.type != 'MESH' or o is corpo: continue
        if o.name.startswith(('Eyes', 'Eyebrows')): extras.append(o)
        else: bpy.data.objects.remove(o)   # a esfera solta
    return arm, corpo, extras

def importar_cabelo(nome, arm):
    """cabelo/barba da Quaternius, já pesado no mesmo esqueleto: passa a obedecer o nosso"""
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(FONTE, 'cabelo', nome + '.gltf'))
    novos = [o for o in bpy.data.objects if o not in antes]
    malha = next(o for o in novos if o.type == 'MESH' and o.name.startswith(nome.split('_')[0]))
    mw = malha.matrix_world.copy(); malha.parent = arm; malha.matrix_world = mw
    for m in malha.modifiers:
        if m.type == 'ARMATURE': m.object = arm
    for o in novos:
        if o is not malha: bpy.data.objects.remove(o)
    return malha

def vestir_extra(o, cor, menos=None):
    """olho, sobrancelha, cabelo: mesma cor/UV do corpo pra juntar numa malha só"""
    me = o.data
    for a in [a.name for a in me.attributes if a.name.startswith('Color') or a.name == 'custom_normal']: me.attributes.remove(me.attributes[a])
    for uv in list(me.uv_layers)[1:]: me.uv_layers.remove(uv)
    if menos:
        ativo(o); m = o.modifiers.new('menos', 'DECIMATE'); m.ratio = menos
        bpy.ops.object.modifier_move_to_index(modifier='menos', index=0); bpy.ops.object.modifier_apply(modifier='menos')
    c = me.color_attributes.new('cor', 'FLOAT_COLOR', 'CORNER'); col = lin(cor)
    for d in c.data: d.color = col
    me.color_attributes.active_color = c
    uv = me.uv_layers[0] if me.uv_layers else me.uv_layers.new(); uv.name = 'atlas'
    r = ATLAS['r']['branco']
    for d in uv.data: d.uv = ((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)
    for p in me.polygons: p.use_smooth = True

def ativo(o):
    bpy.context.view_layer.update()
    for x in list(bpy.context.scene.objects):
        if x: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o

def pesos(o):
    """vértice -> (osso dominante, peso)"""
    nomes = {g.index: g.name for g in o.vertex_groups}
    out = []
    for v in o.data.vertices:
        g = max(v.groups, key=lambda g: g.weight, default=None)
        out.append(nomes[g.group] if g else 'root')
    return out

# ------------------------------------------------------------------ o corpo: rosto liso, roupa, menos triângulos
def preparar_corpo(arm, corpo, T):
    me = corpo.data
    for a in [a.name for a in me.attributes if a.name.startswith('Color') or a.name == 'custom_normal']:
        me.attributes.remove(me.attributes[a])
    for uv in list(me.uv_layers)[1:]: me.uv_layers.remove(uv)
    # o modelo vem em pedaços (tronco, pernas, braços): solda as costuras antes de vestir
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.0008); bm.to_mesh(me); bm.free(); me.update()
    cintura = arm.data.bones['pelvis'].head_local.z + .06
    dono = pesos(corpo)
    reg = [regiao_do_osso(dono[i], v.co.z, cintura) for i, v in enumerate(me.vertices)]
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    # a roupa: alisa a região (o músculo vira pano) e infla pra fora
    bm.normal_update()
    for r, n in T.get('lisa', {}).items():
        vs = [bm.verts[i] for i, x in enumerate(reg) if x == r]
        for _ in range(n): bmesh.ops.smooth_vert(bm, verts=vs, factor=.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    desl = {}
    for i, r in enumerate(reg):
        t = T['infla'].get(r, 0)
        if t: desl[i] = bm.verts[i].normal * t
    for i, d in desl.items(): bm.verts[i].co += d
    # porte: ombros e tronco mais largos (segurança) ou mais estreitos
    if T.get('largura', 1) != 1:
        for i, r in enumerate(reg):
            if r in ('tronco', 'braco') and bm.verts[i].co.z > cintura: bm.verts[i].co.x *= T['largura']
    bm.to_mesh(me); bm.free(); me.update()
    # menos triângulos (o celular agradece): ~45%
    ativo(corpo)
    m = corpo.modifiers.new('menos', 'DECIMATE'); m.ratio = .42
    # o modificador de armadura tem que ficar por último
    bpy.ops.object.modifier_move_to_index(modifier='menos', index=0)
    bpy.ops.object.modifier_apply(modifier='menos')
    # cor por face (bordas nítidas entre peças) e UV no branco do atlas
    dono = pesos(corpo)
    reg = [regiao_do_osso(dono[i], v.co.z, cintura) for i, v in enumerate(me.vertices)]
    cor = me.color_attributes.new('cor', 'FLOAT_COLOR', 'CORNER')
    me.color_attributes.active_color = cor
    for p in me.polygons:
        conta = {}
        for vi in p.vertices: conta[reg[vi]] = conta.get(reg[vi], 0) + 1
        r = max(conta, key=conta.get)
        c = lin(T['cores'].get(r, T.get('pele', PELE)))
        for li in p.loop_indices: cor.data[li].color = c
    uv = me.uv_layers[0]; uv.name = 'atlas'
    u0, v0, u1, v1 = ATLAS['r']['branco']; bu = ((u0 + u1) / 2, (v0 + v1) / 2)
    for d in uv.data: d.uv = bu
    return cintura

# ------------------------------------------------------------------ peças (acessórios) presas a um osso
PECAS = []   # objetos a juntar no corpo

def nova_peca(nome, bm, osso, cor, uvret=None, pesos_fn=None):
    """bm em coordenadas de POSE (do jeito que aparece no site); vira descanso pela matriz do osso na pose atual"""
    for f in bm.faces: f.smooth = len(bm.faces) != 6
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nome, me); bpy.context.scene.collection.objects.link(o)
    c = me.color_attributes.new('cor', 'FLOAT_COLOR', 'CORNER'); col = lin(cor)
    for d in c.data: d.color = col
    uv = me.uv_layers.new(name='atlas')
    r = ATLAS['r'][uvret] if uvret else ATLAS['r']['branco']
    if uvret is None:
        for d in uv.data: d.uv = ((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)
    o['uvret'] = uvret or ''
    o['osso'] = osso
    PECAS.append((o, osso, pesos_fn))
    return o

def caixa(cx, cy, cz, sx, sy, sz, rot=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        p = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
        if rot: p = rot @ p
        v.co = p + Vector((cx, cy, cz))
    return bm

def cilindro(a, b, r1, r2=None, seg=10):
    bm = bmesh.new(); d = Vector(b) - Vector(a)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r1 if r2 is None else r2, depth=d.length)
    rot = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((Vector(a) + Vector(b)) / 2) @ rot, verts=bm.verts)
    return bm

def esfera(c, s, seg=16, anel=10):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=anel, radius=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*s, 1)), verts=bm.verts)
    return bm

def tubo(pontos, r, lados=5):
    """um tubo fino ao longo de uma lista de pontos (o fio espiral, o cordão do crachá)"""
    bm = bmesh.new(); aneis = []
    for k, p in enumerate(pontos):
        t = (pontos[min(k + 1, len(pontos) - 1)] - pontos[max(k - 1, 0)]).normalized()
        a = t.orthogonal().normalized(); b = t.cross(a)
        aneis.append([bm.verts.new(p + (a * math.cos(2 * math.pi * j / lados) + b * math.sin(2 * math.pi * j / lados)) * r) for j in range(lados)])
    for k in range(len(aneis) - 1):
        for j in range(lados):
            bm.faces.new((aneis[k][j], aneis[k][(j + 1) % lados], aneis[k + 1][(j + 1) % lados], aneis[k + 1][j]))
    return bm

def placa(corpo, centro, w, h, normal, uvret, nome, osso, nx=10, ny=4, afasta=.006):
    """uma peça de texto colada no corpo: grade projetada na superfície mais próxima, UV no retângulo do atlas"""
    bm = bmesh.new(); n = Vector(normal).normalized()
    eu = Vector((1, 0, 0)) if abs(n.x) < .9 else Vector((0, 1, 0)); ev = n.cross(eu).normalized() if False else Vector((0, 0, 1))
    eu = ev.cross(n).normalized()   # u anda pra direita de quem OLHA a placa
    grade = [[bm.verts.new(Vector(centro) + eu * (i / nx - .5) * w + ev * (j / ny - .5) * h + n * .12) for i in range(nx + 1)] for j in range(ny + 1)]
    for j in range(ny):
        for i in range(nx): bm.faces.new((grade[j][i], grade[j][i + 1], grade[j + 1][i + 1], grade[j + 1][i]))
    # gruda na pele (o corpo avaliado na pose de descanso)
    dg = bpy.context.evaluated_depsgraph_get(); ev_ob = corpo.evaluated_get(dg)
    for j in range(ny + 1):
        for i in range(nx + 1):
            v = grade[j][i]
            ok, loc, nor, _ = ev_ob.ray_cast(v.co, -n, distance=.5)
            if ok: v.co = loc + n * afasta
    o = nova_peca(nome, bm, osso, '#ffffff', uvret)
    r = ATLAS['r'][uvret]; uv = o.data.uv_layers['atlas']
    for p in o.data.polygons:
        for li in p.loop_indices:
            vi = o.data.loops[li].vertex_index; j, i = divmod(vi, nx + 1)
            uv.data[li].uv = (r[0] + (r[2] - r[0]) * i / nx, r[1] + (r[3] - r[1]) * j / ny)
    o['copia_pesos'] = True
    return o

# ------------------------------------------------------------------ poses (cinemática inversa nos braços)
def pose_ik(arm, alvos, extra=None):
    """alvos: {'l'|'r': (mão, cotovelo)} em metros, no espaço do personagem (olha pra -Y). Devolve {osso: quat}"""
    ativo(arm); bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0)
    vazios = []
    for lado, (mao, cot) in alvos.items():
        e1 = bpy.data.objects.new('alvo_' + lado, None); e1.location = mao
        e2 = bpy.data.objects.new('polo_' + lado, None); e2.location = cot
        for e in (e1, e2): bpy.context.scene.collection.objects.link(e); vazios.append(e)
        c = arm.pose.bones['lowerarm_' + lado].constraints.new('IK')
        c.target = e1; c.pole_target = e2; c.pole_angle = math.radians(-90); c.chain_count = 2
    bpy.context.view_layer.update()
    mats = {n: arm.pose.bones[n].matrix.copy() for lado in alvos for n in ('upperarm_' + lado, 'lowerarm_' + lado)}
    for lado in alvos:
        pb = arm.pose.bones['lowerarm_' + lado]
        for c in list(pb.constraints): pb.constraints.remove(c)
    for e in vazios: bpy.data.objects.remove(e)
    for lado in alvos:
        for n in ('upperarm_' + lado, 'lowerarm_' + lado):
            arm.pose.bones[n].matrix = mats[n]; bpy.context.view_layer.update()
    # mão fechada (dedos curvados) e ajustes finos
    for pb in arm.pose.bones:
        if any(pb.name.startswith(f) for f in ('index', 'middle', 'ring', 'pinky')) and pb.name[-1] in alvos and 'leaf' not in pb.name:
            pb.rotation_quaternion = Quaternion((1, 0, 0), .0) @ Quaternion((0, 0, 1), -.9 if pb.name.endswith('_l') else .9) if False else Quaternion((1, 0, 0), .85)
    if extra: extra(arm)
    bpy.context.view_layer.update()
    return {pb.name: tuple(pb.rotation_quaternion) for pb in arm.pose.bones if pb.rotation_quaternion != Quaternion((1, 0, 0, 0))}

def matrizes_de_pose(arm):
    """osso -> matriz que leva o descanso pra pose atual (pra peças modeladas na pose)"""
    return {pb.name: pb.matrix @ arm.data.bones[pb.name].matrix_local.inverted() for pb in arm.pose.bones}

def cinto(corpo, z, cor, fivela=True):
    """faixa em volta da cintura, tirada do contorno do próprio corpo naquela altura"""
    vs = [v.co for v in corpo.data.vertices if abs(v.co.z - z) < .03]
    c = sum(vs, Vector()) / len(vs); N = 28; raio = [0.0] * N
    for v in vs:
        a = math.atan2(v.co.y - c.y if hasattr(v, 'co') else v.y - c.y, v.x - c.x) if False else math.atan2(v.y - c.y, v.x - c.x)
        k = int((a + math.pi) / (2 * math.pi) * N) % N; raio[k] = max(raio[k], math.hypot(v.x - c.x, v.y - c.y))
    for k in range(N):
        if raio[k] == 0: raio[k] = max(raio[(k - 1) % N], raio[(k + 1) % N])
    bm = bmesh.new(); aneis = []
    for dz in (-.024, .024):
        aneis.append([bm.verts.new(Vector((c.x + math.cos(-math.pi + 2 * math.pi * (k + .5) / N) * (raio[k] + .007), c.y + math.sin(-math.pi + 2 * math.pi * (k + .5) / N) * (raio[k] + .007), z + dz))) for k in range(N)])
    for k in range(N): bm.faces.new((aneis[0][k], aneis[0][(k + 1) % N], aneis[1][(k + 1) % N], aneis[1][k]))
    nova_peca('cinto', bm, 'pelvis', cor)
    if fivela:
        frente = min(range(N), key=lambda k: abs((-math.pi + 2 * math.pi * (k + .5) / N) + math.pi / 2))
        a = -math.pi + 2 * math.pi * (frente + .5) / N
        nova_peca('fivela', caixa(c.x, c.y + math.sin(a) * (raio[frente] + .012), z, .06, .01, .04), 'pelvis', '#8c8c88')

def ponto_osso(arm, nome, t=0.0):
    pb = arm.pose.bones[nome]; return arm.matrix_world @ (pb.head.lerp(pb.tail, t))

# ------------------------------------------------------------------ cada tipo
def montar(tipo):
    T = TIPOS[tipo]; PECAS.clear()
    limpar(); arm, corpo, extras = importar(T['base'])
    s = arm.data.bones['Head'].head_local.z / 1.6        # 1 no masculino, ~0,97 no feminino
    cintura = preparar_corpo(arm, corpo, T)
    # olhos escuros (sem brilho, sem íris: o rosto fica na penumbra), sobrancelha e cabelo
    for o in extras: vestir_extra(o, '#140f0c' if o.name.startswith('Eyes') else CABELO)
    for n in T.get('cabelo', []):
        h = importar_cabelo(n, arm); vestir_extra(h, CABELO, .5 if len(h.data.vertices) > 1500 else None); extras.append(h)
    for o in extras:
        o.vertex_groups  # mantém os grupos (já pesados no esqueleto)
        PECAS.append((o, None, 'extra'))
    head = lambda: ponto_osso(arm, 'Head')
    poses = {}

    # ---- poses (a primeira é a de descanso de quem fica parado; peças de mão são modeladas nela)
    if tipo == 'seguranca':
        cruza = {'l': ((-.07 * s, -.2, 1.26 * s), (.55, -.15, 1.12 * s)), 'r': ((.09 * s, -.22, 1.29 * s), (-.55, -.15, 1.12 * s))}
        poses['radio'] = pose_ik(arm, {'l': cruza['l'], 'r': ((-.13, -.04, 1.64), (-.6, .05, 1.42))},
                                 extra=lambda a: setattr(a.pose.bones['Head'], 'rotation_quaternion', Quaternion((0, 1, 0), -.15)))
        poses['bracos'] = pose_ik(arm, cruza)
    elif tipo == 'produtor':
        poses['prancheta'] = pose_ik(arm, {'l': ((.06 * s, -.27, 1.08 * s), (.45, .05, .92 * s)), 'r': ((-.02 * s, -.3, 1.12 * s), (-.45, .05, .92 * s))})
    elif tipo == 'pose':
        poses['foto'] = pose_ik(arm, {'r': ((-.3 * s, -.08, 1.9 * s), (-.7, .1, 1.5 * s)), 'l': ((.2 * s, -.0, .99 * s), (.6, .35, 1.15 * s))},
                                extra=lambda a: setattr(a.pose.bones['Head'], 'rotation_quaternion', Quaternion((0, 1, 0), .14)))
    if not poses:   # quem anda: braços soltos (a animação de andar manda neles)
        ativo(arm); bpy.ops.object.mode_set(mode='POSE')
        for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0)
    bpy.context.view_layer.update()
    PM = matrizes_de_pose(arm)

    # ---- acessórios (modelados na pose atual = a última resolvida)
    H = head()
    if tipo in ('seguranca', 'equipe', 'produtor'): cinto(corpo, cintura - .035, '#0a0a0a', tipo != 'produtor')
    if tipo == 'seguranca':
        # fone: botão na orelha direita e o fio espiral transparente descendo até a gola, por trás
        orelha = H + Vector((-.082 * s, .012, .045 * s))
        nova_peca('fone', esfera(orelha, (.011, .011, .013), 10, 6), 'Head', '#c9d2d6')
        gola = ponto_osso(arm, 'neck_01') + Vector((-.06 * s, .075, -.04))
        pts = []
        for k in range(161):
            t = k / 160; p = orelha.lerp(gola, t) + Vector((0, .01 * math.sin(math.pi * t), 0))
            a = t * 2 * math.pi * 16
            pts.append(p + Vector((math.cos(a) * .006, math.sin(a) * .006, 0)))
        nova_peca('fio', tubo(pts, .0022, 4), 'neck_01', '#aeb9be', pesos_fn=('Head', 'neck_01', orelha.z, gola.z))
        # cinto, rádio no quadril direito com antena
        nova_peca('radio', caixa(-.2 * s, .03, cintura - .03, .062, .036, .12), 'pelvis', '#1d1d1d')
        nova_peca('antena', cilindro((-.21 * s, .03, cintura + .03), (-.21 * s, .03, cintura + .12), .006), 'pelvis', '#111111')
    if tipo == 'produtor':
        # headset de um ouvido com microfone de haste
        nova_peca('arco', tubo([H + Vector((math.cos(a) * .1 * s, .01, .07 * s + math.sin(a) * .1 * s)) for a in [math.pi * k / 16 for k in range(17)]], .008, 6), 'Head', '#141414')
        cx = H + Vector((.095 * s, .01, .06 * s))
        nova_peca('concha', cilindro(cx - Vector((.012, 0, 0)), cx + Vector((.014, 0, 0)), .034, seg=12), 'Head', '#101010')
        nova_peca('haste', tubo([cx + Vector((.01, 0, -.01)), H + Vector((.07 * s, -.07, .005 * s)), H + Vector((.03 * s, -.11, -.005 * s))], .004, 5), 'Head', '#101010')
        nova_peca('mic', esfera(H + Vector((.025 * s, -.112, -.006 * s)), (.012, .012, .012), 8, 6), 'Head', '#2a2a2a')
        # prancheta na mão esquerda, de frente pra ela (a lista de credenciamento)
        mao = ponto_osso(arm, 'hand_l', .5)
        rot = Matrix.Rotation(math.radians(-62), 3, 'X')
        nova_peca('prancheta', caixa(mao.x - .06, mao.y - .03, mao.z + .06, .23, .012, .31, rot), 'hand_l', '#5a4a3a')
        o = nova_peca('papel', caixa(mao.x - .06, mao.y - .03 - .007, mao.z + .06, .2, .002, .27, rot), 'hand_l', '#ffffff', 'papel')
        uv_caixa_frente(o, 'papel')
        nova_peca('radio', caixa(.19 * s, .02, cintura - .03, .055, .034, .11), 'pelvis', '#1d1d1d')
    if tipo in ('produtor', 'pose'):
        # cordão e crachá no peito
        peito = ponto_osso(arm, 'spine_03', .45)
        topo = peito + Vector((0, -.13 * s, -.1 * s))
        for sx in (1, -1):
            nova_peca(f'cordao{sx}', tubo([ponto_osso(arm, 'neck_01') + Vector((sx * .055 * s, .0, -.02)), peito + Vector((sx * .06 * s, -.11 * s, .0)), topo + Vector((sx * .01, 0, .045))], .0045, 4), 'spine_03', '#c81e1e' if tipo == 'produtor' else '#111111')
        o = nova_peca('cracha', caixa(topo.x, topo.y - .004, topo.z, .07, .003, .1), 'spine_03', '#ffffff')
        uv_caixa_frente(o, 'cracha_aaa' if tipo == 'produtor' else 'cracha_staff')
    if tipo == 'artista':
        # capuz: casca em volta da cabeça, aberta na frente (o rosto fica em sombra)
        bm = esfera(H + Vector((0, .04, .09 * s)), (.135 * s, .17 * s, .16 * s), 18, 12)
        for v in bm.verts:   # a ponta do capuz cai pra trás
            if v.co.y > H.y + .05: v.co.z -= (v.co.y - H.y - .05) * .5
        for f in [f for f in bm.faces if f.calc_center_median().y < H.y - .08 and abs(f.calc_center_median().x) < .085 and f.calc_center_median().z > H.z - .03]: bm.faces.remove(f)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        nova_peca('capuz', bm, 'Head', '#121213')
        nova_peca('gola', esfera(ponto_osso(arm, 'neck_01', .3) + Vector((0, .015, -.01)), (.11 * s, .1 * s, .05 * s), 14, 8), 'neck_01', '#121213')
        # corrente prateada
        c = ponto_osso(arm, 'spine_03', .75)
        pts = [c + Vector((math.cos(a) * .11 * s, -.02 + math.sin(a) * .1 * s - (.05 if math.sin(a) < 0 else 0) * (-math.sin(a)), -.05 * (-math.sin(a) if math.sin(a) < 0 else 0))) for a in [2 * math.pi * k / 40 for k in range(41)]]
        nova_peca('corrente', tubo(pts, .007, 5), 'spine_03', '#c9c9c9')
    if tipo == 'equipe':
        # boné preto
        nova_peca('copa', esfera(H + Vector((0, .012, .158 * s)), (.108 * s, .118 * s, .08 * s), 16, 8), 'Head', '#0e0e0e')
        nova_peca('aba', caixa(H.x, H.y - .15 * s, H.z + .152 * s, .17, .11, .012, Matrix.Rotation(math.radians(10), 3, 'X')), 'Head', '#0e0e0e')
        # fita gaffer e mosquetão no cinto
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=.05, radius2=.05, depth=.05)
        bmesh.ops.transform(bm, matrix=Matrix.Translation((.2 * s, .04, cintura - .04)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'), verts=bm.verts)
        nova_peca('fita', bm, 'pelvis', '#5c5c5c')
        nova_peca('mosquetao', tubo([Vector((-.17 * s + .02 * math.cos(a), -.08, cintura - .05 + .035 * math.sin(a))) for a in [2 * math.pi * k / 16 for k in range(17)]], .004, 4), 'pelvis', '#c8c8c8')
    if tipo == 'seguranca':
        placa(corpo, (0, .2, 1.38 * s), .36 * s, .074 * s, (0, 1, 0), 'seguranca', 'costas', 'spine_03', 14, 4)
        placa(corpo, (.1 * s, -.2, 1.36 * s), .1 * s, .021 * s, (0, -1, 0), 'seguranca', 'peito', 'spine_03', 6, 2)
    if tipo in ('equipe', 'pose'):
        placa(corpo, (0, .2, 1.37 * s), .26 * s, .09 * s, (0, 1, 0), 'staff', 'costas', 'spine_03', 10, 4)
    if tipo == 'produtor':
        placa(corpo, (0, .2, 1.33 * s), .24 * s, .085 * s, (0, 1, 0), 'producao', 'costas', 'spine_03', 10, 4)

    # ---- junta tudo no corpo: cada peça pesa 100% no seu osso (ou divide, o fio), volta pro descanso
    for o, osso, pf in PECAS:
        if pf == 'extra': continue
        me = o.data; M = PM.get(osso, Matrix.Identity(4)).inverted()
        if o.get('copia_pesos'):
            M = Matrix.Identity(4)   # placas já foram feitas no corpo em descanso
        for v in me.vertices: v.co = M @ v.co
        if o.get('copia_pesos'):
            dt = o.modifiers.new('pesos', 'DATA_TRANSFER'); dt.object = corpo; dt.use_vert_data = True
            dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
            dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
            ativo(o); bpy.ops.object.datalayout_transfer(modifier='pesos'); bpy.ops.object.modifier_apply(modifier='pesos')
        elif pf:
            a, b, za, zb = pf; ga = o.vertex_groups.new(name=a); gb = o.vertex_groups.new(name=b)
            for v in me.vertices:
                t = min(1, max(0, (v.co.z - zb) / max(1e-4, za - zb)))   # de volta ao descanso, cabeça e pescoço = osso parado
                ga.add([v.index], t, 'REPLACE'); gb.add([v.index], 1 - t, 'REPLACE')
        else:
            o.vertex_groups.new(name=osso).add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)
    bpy.ops.object.mode_set(mode='OBJECT')
    if PECAS:
        ativo(corpo)
        for o, _, _ in PECAS: o.select_set(True)
        corpo.select_set(True); bpy.context.view_layer.objects.active = corpo
        bpy.ops.object.join()
    me = corpo.data
    me.color_attributes.active_color = me.color_attributes['cor']
    print(f'{tipo}: {sum(len(p.vertices) - 2 for p in me.polygons)} triângulos, {len(me.vertices)} vértices', flush=True)

    # ---- poses viram animações (uma faixa NLA por pose: o exportador escreve cada uma com o nome dela)
    arm.animation_data_create()
    for nome, q in poses.items():
        act = bpy.data.actions.new(nome); arm.animation_data.action = act
        for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)
        for bn, qq in q.items():
            pb = arm.pose.bones[bn]; pb.rotation_quaternion = qq
            for f in (1, 2): pb.keyframe_insert('rotation_quaternion', frame=f)
        tr = arm.animation_data.nla_tracks.new(); tr.name = nome; tr.strips.new(nome, 1, act)
        arm.animation_data.action = None
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)
    corpo.name = tipo; arm.name = 'esqueleto_' + tipo
    if VER: previas(tipo, arm, corpo, poses)
    exportar(os.path.join(SAIDA, tipo + '.glb'), anim='NLA_TRACKS' if poses else None)

def uv_caixa_frente(o, ret):
    """a face da caixa que olha pra frente (-Y) recebe o retângulo do atlas; o resto fica branco"""
    r = ATLAS['r'][ret]; me = o.data; uv = me.uv_layers['atlas']
    for p in me.polygons:
        if p.normal.y < -.5:
            vs = [me.vertices[me.loops[li].vertex_index].co for li in p.loop_indices]
            xs = [v.x for v in vs]; zs = [v.z for v in vs]
            for li in p.loop_indices:
                v = me.vertices[me.loops[li].vertex_index].co
                uv.data[li].uv = (r[0] + (r[2] - r[0]) * (v.x - min(xs)) / max(1e-6, max(xs) - min(xs)),
                                  r[1] + (r[3] - r[1]) * (v.z - min(zs)) / max(1e-6, max(zs) - min(zs)))

def exportar(arq, anim=None):
    kw = dict(filepath=arq, export_format='GLB', use_selection=False, export_yup=True, export_texcoords=True, export_normals=True,
              export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_image_format='NONE', export_materials='NONE',
              export_skins=True, export_animations=bool(anim), export_def_bones=True, export_apply=False)
    if anim: kw.update(export_animation_mode=anim, export_force_sampling=True, export_optimize_animation_size=True)
    try: bpy.ops.export_scene.gltf(**kw)
    except TypeError as e:
        print('exportador recusou opção:', e); kw.pop('export_all_vertex_colors', None); bpy.ops.export_scene.gltf(**kw)
    print('  ->', arq, os.path.getsize(arq) // 1024, 'KB', flush=True)

def previas(tipo, arm, corpo, poses):
    cena = bpy.context.scene
    cena.render.engine = 'BLENDER_WORKBENCH'; sh = cena.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'VERTEX'; sh.show_cavity = False; sh.background_type = 'VIEWPORT'; sh.background_color = (.32, .32, .34)
    cena.render.resolution_x, cena.render.resolution_y = 900, 1200; cena.render.film_transparent = False
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cena.collection.objects.link(cam); cena.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.2
    pose = next(iter(poses.values()), {})
    for bn, q in pose.items(): arm.pose.bones[bn].rotation_quaternion = q
    bpy.context.view_layer.update()
    for nome, ang in (('frente', 0), ('costas', math.pi), ('lado', -math.pi / 2), ('tres-quartos', -.6)):
        cam.location = (math.sin(ang) * 5, -math.cos(ang) * 5, 1.0); cam.rotation_euler = (math.pi / 2, 0, ang)
        cena.render.filepath = os.path.join(PREVIA, f'{tipo}-{nome}.png'); bpy.ops.render.render(write_still=True)
    # e as outras poses de frente
    for pn, q in list(poses.items())[1:]:
        for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)
        for bn, qq in q.items(): arm.pose.bones[bn].rotation_quaternion = qq
        bpy.context.view_layer.update(); cam.location = (0, -5, 1.0); cam.rotation_euler = (math.pi / 2, 0, 0)
        cena.render.filepath = os.path.join(PREVIA, f'{tipo}-{pn}.png'); bpy.ops.render.render(write_still=True)
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)
    bpy.data.objects.remove(cam)

def movimento():
    """as animações da biblioteca que o site usa, num arquivo só (o esqueleto é o mesmo de todos)"""
    limpar(); bpy.ops.import_scene.gltf(filepath=os.path.join(FONTE, 'UAL1_Standard.glb'))
    QUERO = {'Idle_Loop': 'parado', 'Walk_Loop': 'andando', 'Idle_Talking_Loop': 'falando', 'Idle_Torch_Loop': 'lanterna'}
    for a in list(bpy.data.actions):
        if a.name in QUERO: a.name = QUERO[a.name]
        else: bpy.data.actions.remove(a)
    for o in list(bpy.data.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)
    exportar(os.path.join(SAIDA, 'movimento.glb'), anim='ACTIONS')

for tipo in TIPOS:
    if SO and SO != tipo: continue
    montar(tipo)
if not SO or SO == 'movimento': movimento()
print('FIM', flush=True)
