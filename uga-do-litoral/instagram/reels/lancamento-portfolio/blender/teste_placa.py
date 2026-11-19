import bpy, time, sys
out = sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
prefs = bpy.context.preferences.addons['cycles'].preferences
res = {}
for t in ('OPTIX','CUDA'):
    try:
        prefs.compute_device_type = t; prefs.get_devices()
        res[t] = [d.name for d in prefs.devices if d.type == t]
    except Exception as e: res[t] = 'ERRO ' + str(e)
print('DISPOSITIVOS', res)
# cena: corredor simples
bpy.ops.mesh.primitive_plane_add(size=40); 
for x in (-1.7,1.7):
    bpy.ops.mesh.primitive_cube_add(location=(x,0,1.6)); o=bpy.context.object; o.scale=(0.05,20,1.6)
bpy.ops.object.light_add(type='AREA', location=(0,6,3)); bpy.context.object.data.energy=400; bpy.context.object.data.color=(1,0.05,0.03)
bpy.ops.object.light_add(type='SPOT', location=(0,-8,1.6), rotation=(1.5708,0,0)); bpy.context.object.data.energy=3000
bpy.ops.object.camera_add(location=(0,-8,1.6), rotation=(1.5708,0,0)); sc.camera=bpy.context.object
w = bpy.data.worlds.new('w'); sc.world = w
def render(engine, tag, **kw):
    sc.render.engine = engine
    sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
    sc.render.filepath = f'{out}/{tag}.png'
    for k,v in kw.items(): setattr(sc.cycles, k, v)
    t=time.time(); bpy.ops.render.render(write_still=True); print('TEMPO', tag, round(time.time()-t,1), 's')
try:
    render('BLENDER_EEVEE', 'eevee')
except Exception as e: print('EEVEE ERRO', e)
for t in ('OPTIX','CUDA'):
    if isinstance(res[t], list) and res[t]:
        prefs.compute_device_type = t
        for d in prefs.devices: d.use = (d.type == t)
        sc.cycles.device = 'GPU'
        try: render('CYCLES', 'cycles_'+t, samples=64, use_denoising=True)
        except Exception as e: print('CYCLES ERRO', t, e)
