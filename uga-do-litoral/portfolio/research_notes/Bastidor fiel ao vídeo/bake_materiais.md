# Bake de materiais procedurais do Blender (Cycles) para three.js r170: fidelidade alta, peso baixo

Contexto: corredor de backstage em three.js 0.170 sem build, celular médio. Paredes de concreto com fôrma (~70 quads de 0,9 x 3,3 m, corredor ~45 m), piso escuro, teto com spots. Já existe um lightmap só de iluminação (diffuse direct+indirect, sem cor) num atlas de 2048 px (~54 px/m), mais um mapa do piso visto de cima. Hoje o site usa MeshBasicMaterial com uma textura genérica de concreto.

## Q1. COMBINED vs DIFFUSE com cor vs albedo separado + lightmap; densidade de texel; orçamento de memória

### Takeaway
Para paredes que se repetem, o caminho de melhor custo e fidelidade é separar o albedo (um tile pequeno que se repete, com as costuras e furos de tensor) da iluminação (o atlas de lightmap que já existe, em UV1). Um bake COMBINED ou DIFFUSE+COLOR num atlas único "congela" o detalhe na densidade do lightmap, que hoje é ~54 px/m. Isso é baixo demais para o detalhe fino do concreto: a referência de jogos em primeira pessoa é ~1024 px/m. O orçamento de GPU, e não o tamanho do arquivo, é a restrição no celular. PNG/JPEG/WebP ocupam largura x altura x 4 x 1,33 na GPU, então um 4096 dá ~90 MB.

### Cited Findings
- No Cycles, o tipo de bake **Combined** inclui tudo menos especular. **Diffuse/Glossy/Transmission** têm as influências Direct, Indirect e Color. Só Color dá a cor base. Sem Color, a contribuição sai em tons de cinza. Color junto com Direct/Indirect dá a contribuição colorida. — [Blender Manual, Render Baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html)
- O alvo do bake é o nó Image Texture ativo/selecionado de cada material. Material sem esse nó não recebe bake. Também dá para assar em Color Attribute. Há a opção Clear Image. — [Blender Manual, Render Baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html)
- Imagens PNG/JPEG/WebP/AVIF são descomprimidas e sobem para a GPU sem compressão. Memória = largura x altura x 4 x 1,333 (mipmaps). "One 4096x4096px image with mipmaps consumes 90 MB of memory." Pela mesma fórmula, 2048² dá ~22 MB (cálculo derivado). Formatos de GPU (ETC/ASTC/BC) reduzem a memória "4–8x". — [Don McCurdy, Choosing texture formats for WebGL and WebGPU (2024)](https://www.donmccurdy.com/2024/02/11/web-texture-formats/)
- Densidade de texel de referência: 1024 px/m (10,24 px/cm) em jogos de primeira pessoa (CoD, Halo). Algumas fontes dão 1024–2048. Para mobile/VR, 256–512 px/m. A consistência entre superfícies importa mais que o número exato. — [Unreal forum](https://forums.unrealengine.com/t/texel-density-standards-for-aaa-first-person-shooter-games/1646118); [Maxon C4D help](https://help.maxon.net/c4d/en-us/Content/html/Texel_Density.html); [Vertex School guide](https://www.vertexschool.com/texel-density-guide). As fontes são blogs e docs de ferramenta, não padrão oficial de estúdio.
- Um lightmap em MeshBasicMaterial às vezes parece "sobrescrever" a cor/textura do material, sobretudo onde o lightmap é preto puro. — [three.js forum, Problem with lightmap when using MeshBasicMaterial](https://discourse.threejs.org/t/problem-with-lightmap-when-using-meshbasicmaterial/8872)
- Workflow comum na comunidade: manter os UVs da textura (UV0) intocados e criar um segundo UV map ("LightMap") só para o bake. O three.js lê lightMap/aoMap no segundo conjunto de UV. — [three.js forum, How to bake light with textures?](https://discourse.threejs.org/t/how-to-bake-light-with-textures/52076); [three.js forum, Apply UV coordinates and lightmaps baked from Blender](https://discourse.threejs.org/t/apply-uv-coordinates-and-lightmaps-baked-from-blender-to-mesh/63910)

### Inferences
- **Números do caso.** Parede de 0,9 x 3,3 m a 54 px/m dá ~49 x 178 px por quad. Uma costura de fôrma de ~1 cm ou um furo de tensor de ~2–3 cm vira menos de 1–1,5 px, ou seja, some ou serrilha. Para ler costura e furo de perto, o albedo precisa de ≥512 px/m, idealmente ~1024 px/m. Isso é ~20x a densidade atual. Num atlas único, 70 quads x 0,9 x 3,3 m ≈ 208 m² a 1024 px/m daria ~218 Mpx, inviável. Logo, **não se assa o albedo no atlas**: o albedo vem de um tile repetido e o atlas fica só com a luz, que é de baixa frequência e aguenta 30–60 px/m bem.
- **COMBINED** (tudo junto num atlas) só vale com densidade alta e superfícies únicas. Aqui ele custaria memória e ainda ficaria borrado. Também perde a liberdade de ajustar a intensidade da luz no site sem re-assar.
- **DIFFUSE só com COLOR** (sem Direct/Indirect) é a forma de "assar o albedo procedural" num tile. **DIFFUSE com DIRECT+INDIRECT, sem COLOR**, é o lightmap que já existe. Essa separação é a que encaixa no shader do three.js: saída = map x lightMap.
- **Orçamento sugerido para celular médio**, com 2048² ≈ 22 MB e 1024² ≈ 5,6 MB descomprimidos com mips:
  - tile de albedo da fôrma 1024² (+ normal 1024²)
  - atlas de lightmap 2048² (o atual)
  - piso 1024²–2048²
  - fotos

  Isso fica em ~40–60 MB sem compressão. Com KTX2 cai para ~1/4. Um 4096 só para lightmap não se justifica, porque a luz é suave.
- O problema do "preto puro sobrescreve" se evita assim: o lightmap nunca chega a 0 (dá para elevar um piso mínimo no bake ou via `lightMapIntensity`), e o fundo do corredor fica no escuro por intenção, não por clamp.

### Gaps
- Não achei um número oficial de "texel density para web mobile". Os valores vêm de jogos.
- Não medi o tamanho real das costuras e furos no `.blend`. A conversão para pixels acima supõe costura de ~1 cm e furo de 2–3 cm.

## Q2. Tile procedural assado (UV0) + normal + lightmap (UV1): é prática padrão? Como reproduzir Brick/Noise no three.js?

### Takeaway
Sim. "Textura de detalhe repetida em UV0 + lightmap único em UV1" é o padrão clássico de lightmapping, e é como os materiais do three.js consomem as duas UVs: map/normalMap em UV0, lightMap/aoMap em UV1. Para o visual do Blender há três rotas:
- (a) assar o procedural num tile: o mais barato e fiel, recomendado.
- (b) portar Brick/Noise para GLSL via onBeforeCompile: funciona, mas é frágil e pesa no fragment shader do celular.
- (c) TSL: só faz sentido com WebGPURenderer/NodeMaterial. Para WebGL "clássico" sem build, é complexidade extra.

### Cited Findings
- No three.js, lightMap e aoMap usam o segundo conjunto de UV, e as outras texturas usam o primeiro. Exemplos recentes declaram o atributo `uv1` e `LIGHTMAP_UV` = `uv1`, porque a nomenclatura mudou de `uv2` para `uv1` com o tempo. Também existe a propriedade `texture.channel` para escolher a UV. — [three.js forum, lightmap second set of uv coordinates](https://discourse.threejs.org/t/lightmap-second-set-of-uv-coordinates/5189); [three.js forum, Lightmap not using UV1/UV2 in MeshStandardMaterial](https://discourse.threejs.org/t/lightmap-not-using-uv1-uv2-in-meshstandardmaterial-but-works-perfectly-in-shadermaterial/88564)
- Shader do MeshBasicMaterial em r170 (`meshbasic.glsl.js`):
  - `reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;`
  - sem lightmap, entra `vec3(1.0)`
  - depois roda `aomap_fragment`
  - e por fim `reflectedLight.indirectDiffuse *= diffuseColor.rgb;`, em que diffuseColor inclui o `map`

  — [three@0.170.0 meshbasic.glsl.js (unpkg)](https://unpkg.com/three@0.170.0/src/renderers/shaders/ShaderLib/meshbasic.glsl.js)
- Nos materiais iluminados (Lambert/Standard), o chunk `lights_fragment_maps` faz `irradiance += lightMapTexel.rgb * lightMapIntensity;`, sem o fator 1/π. Depois disso vem a BRDF difusa. — [three@0.170.0 lights_fragment_maps.glsl.js](https://unpkg.com/three@0.170.0/src/renderers/shaders/ShaderChunk/lights_fragment_maps.glsl.js)
- A doc do three.js mostra o padrão de `onBeforeCompile` para injetar uma textura de detalhe em `map_fragment`. Ela avisa que isso fica difícil de manter e recomenda TSL. — [three.js TSL docs](https://threejs.org/docs/TSL.html)
- Ao usar `onBeforeCompile`, é preciso sobrescrever `customProgramCacheKey()`, senão o three.js pode reutilizar um programa não patchado do cache. — [skill/guide de shaders three.js](https://skillselion.com/skills/openaec-foundation/three.js-claude-skill-package/threejs-syntax-shaders) (fonte secundária)
- Há um PR do three.js com material procedural de madeira portado do Blender. Ele nota que dá para converter GLSL do Blender para TSL com o GLSLEncoder/transpiler, e que materiais que compartilham um grafo com parâmetros diferentes podem acabar usando o primeiro shader compilado. — [three.js PR #31640](https://gh.nn.ci/mrdoob/three.js/pull/31640)
- O nó Brick Texture tem entradas Color1/2, Mortar, Scale, Mortar Size, Mortar Smooth, Bias, Brick Width, Row Height e Offset/Frequency/Squash. As saídas são Color e Fac (máscara da argamassa). O manual avisa que detalhe acima do que a geometria mostra gera moiré. — [Blender Manual, Brick Texture Node](https://docs.blender.org/manual/en/4.2/modeling/geometry_nodes/texture/brick.html)
- Contra aliasing de textura procedural/repetida: `minFilter` com mipmap e `anisotropy` 16. — [three.js forum, Procedural Prototype Grid Shader](https://discourse.threejs.org/t/procedural-prototype-grid-shader/60979)
- O MeshBakedMaterial (lib de terceiros) existe para quando o visual assado precisa de especular, coisa que o MeshBasicMaterial não faz. — [mesh-baked-material README](https://unpkg.com/mesh-baked-material@1.0.4/README.md)

### Inferences
- **Recomendação concreta para o corredor:**
  1. **Tile da fôrma**: 1 painel ou 2x2 painéis de fôrma, com costuras, 4 furos de tensor por painel e manchas suaves. Sai num tile de 1024² (ou 1024x2048 se o painel for vertical), assado em Blender com DIFFUSE + só COLOR num plano com UV 0–1 que cobre exatamente um período do Brick.
  2. **Normal do tile**: tipo NORMAL em tangent space, com o Bump ligado no material, no mesmo plano. Fica em 1024² ou 512².
  3. Nas paredes do site, **UV0 = coordenadas em metros / tamanho do painel**, com `RepeatWrapping`. O alinhamento das costuras é feito pela UV0 de cada quad: começar no canto do quad, para que as costuras batam nas quinas.
  4. **UV1 = o atlas de lightmap atual.**
- **Manchas grandes** (mottling) quebram a repetição do tile. Duas formas de reproduzir:
  - assá-las numa máscara de baixa resolução junto com a luz, ou seja, no próprio atlas: um bake DIFFUSE com COLOR+DIRECT+INDIRECT de baixa frequência, ou um canal extra
  - variar o tile por quad via `offset`/flip da UV0

  A segunda é barata e evita a cara de "papel de parede repetido".
- Portar Brick + Noise + Bump para GLSL no celular custa vários octaves de noise por pixel em tela cheia. Dá para fazer, mas não compensa versus um tile assado. A exceção é se quiserem evitar repetição perceptível. O meio-termo é tile assado + 1 noise barato em world space para modular o tom.
- **Calibração de intensidade.** No MeshBasicMaterial a saída é `map * lightMap * lightMapIntensity / π`. Para reproduzir 1:1 o valor assado do Blender, comece com `lightMapIntensity = Math.PI` e ajuste no olho contra o render. No Lambert/Standard o fator é diferente (sem o /π no acúmulo, mas com a BRDF difusa depois), então os números não se transferem entre materiais.

### Gaps
- Não confirmei o texto oficial da doc de r170 sobre `Texture.channel`. A nomenclatura `uv1` em r151+ vem de forum e exemplos.
- Não achei artigo que documente exatamente "Blender Brick → tile assado → three.js RepeatWrapping + lightmap UV1" passo a passo. É prática conhecida de engines (detail texture + lightmap), mas a fonte aqui é inferência a partir dos shaders.

## Q3. Bake headless por script (bpy): tipos, margin, atlas multi-objeto, denoise, armadilhas

### Takeaway
`bpy.ops.object.bake(type=..., pass_filter={...}, margin=N, margin_type='EXTEND'|'ADJACENT_FACES', use_clear=...)` roda em `blender -b arquivo.blend --python script.py` com Cycles. O alvo é sempre o Image Texture ativo de cada material, e para atlas multi-objeto todos os materiais apontam para a mesma imagem. O checkbox de denoise do render cria costuras pretas em bakes. O jeito confiável é denoisar a imagem assada no compositor, com o nó Denoise/OIDN. Em Blender 5.x o compositor mudou de API.

### Cited Findings
- Os valores de `pass_filter` são 'NONE', 'EMIT', 'DIRECT', 'INDIRECT', 'COLOR', 'DIFFUSE', 'GLOSSY', 'TRANSMISSION'. `margin` vai de 0 a 32767, default 16. — [Blender API 5.3, BakeSettings](https://docs.blender.org/api/5.3/bpy.types.BakeSettings.html); [Blender API 3.0, BakeSettings](https://docs.blender.org/api/3.0/bpy.types.BakeSettings.html)
- Padrão de script para lightmap: `bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT','INDIRECT'}, margin=...)`. Para versão com cor, acrescente 'COLOR'. — [r/blender, batch bake script](https://redlib.cypherpunktools.com/r/blender/comments/jawtb7/my_python_batch_bake_script_for_blender_290) (fonte de comunidade)
- **Margin**: a margem preenche em volta das ilhas de UV para evitar costura com filtragem e mipmap. O tipo é Extend (estica os pixels da borda) ou Adjacent Faces (preenche a partir das faces vizinhas). O tamanho é em px. — [Blender Manual, Render Baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html)
- **Selected to Active** assa de objetos high-poly selecionados para o ativo, com Cage e Max Ray Distance. Cada objeto fonte custa memória fixa de CPU. Juntar os high-poly evita crash. — [Blender Manual, Render Baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html)
- Bug: com "Denoise" ligado em Sampling, o bake COMBINED fica com costuras pretas, provavelmente porque a margem é aplicada antes do denoise. Denoisar manualmente no compositor evita o problema. — [Blender issue #94573](https://projects.blender.org/blender/blender/issues/94573); [BlenderArtists, Is it possible to de-noise baked textures?](https://blenderartists.org/t/is-it-possible-to-de-noise-baked-textures/1249722)
- Denoise no compositor permite baixar muito as amostras ("de dias para poucas horas"), mas com pouquíssimas amostras (ex. 32) ainda fica granulado. — [BlenderArtists, Denoising baked textures](https://blenderartists.org/t/denoising-baked-textures/1113375)
- **Blender 5.0**: `scene.node_tree` saiu, use `scene.compositing_node_group`. O nó Composite saiu, use Group Output. A árvore do compositor virou um data-block próprio. O nó de denoise é `CompositorNodeDenoise` (OIDN). — [Blender 5.0 API, CompositorNodeDenoise](https://docs.blender.org/api/5.0/bpy.types.CompositorNodeDenoise.html); [NodeToPython issue #171 citando as release notes 5.0](https://github.com/BrendanParmer/NodeToPython/issues/171)
- **Armadilhas de preparo**:
  - faces invertidas assam preto, e o three.js esconde back faces
  - duplicatas linkadas compartilham UV e assam uma por cima da outra (Make Single User)
  - escala não aplicada distorce o unwrap
  - em Blender 4.0+, "View From" pode ser Active Camera
  - use margin type Extend

  — [Three.js Journey, Baking and exporting the scene (prévia gratuita)](https://threejs-journey.com/lessons/baking-and-exporting-the-scene)

### Inferences
Esqueleto de script recomendado (Blender 5.3, `blender -b corredor.blend --python bake.py`):
1. `scene.render.engine='CYCLES'`, `cycles.device='GPU'` se houver, amostras de 256–1024. Denoise **desligado** no Sampling.
2. **Lightmap das paredes**:
   - crie ou reuse uma imagem 2048² float (`bpy.data.images.new(..., float_buffer=True)`)
   - em cada material de parede, crie um nó Image Texture com essa imagem e torne-o ativo (`nodes.active = node`)
   - faça UV1 ativa para o bake (`mesh.uv_layers.active = uv_lightmap`), mas deixe a UV0 como `active_render` para o shader procedural continuar usando a UV certa
   - selecione todas as paredes e rode `bake(type='DIFFUSE', pass_filter={'DIRECT','INDIRECT'}, margin=8–16, margin_type='EXTEND', use_clear=True)`
3. **Tile de albedo**:
   - plano isolado com o mesmo material procedural, UV 0–1 = um período
   - `bake(type='DIFFUSE', pass_filter={'COLOR'})` e depois `bake(type='NORMAL')`
   - se o Brick/Noise usar coordenadas Object ou Generated em vez de UV, o tile **não** fecha. Ligue os Textures à coordenada UV, ou ajuste Scale para que um período caiba exatamente em 0–1, para o tile ficar seamless.
4. **Denoise**:
   - salve o EXR float do lightmap
   - no compositor (`scene.compositing_node_group`), Image → Denoise (prefilter conforme o caso) → Group Output/Viewer
   - grave em PNG 16-bit ou EXR, e só depois converta para 8-bit para o site
   - margin depois do denoise: re-dilate se necessário

   O albedo procedural não tem ruído (não depende de amostras de luz), então não precisa de denoise.
5. **Color management**: o bake de lightmap é linear. Grave em EXR ou em PNG com o view transform "Standard" e trate a cor no three.js (ver Q5). Usar AgX/Filmic no PNG embute uma curva de tom que depois se multiplica pelo albedo e escurece ou dessatura.

### Gaps
- Não achei um script oficial e completo de "bake + denoise no compositor" para Blender 5.x. Os nomes de socket do CompositorNodeDenoise em 5.3 precisam ser conferidos no próprio Blender.
- O parâmetro exato do bake em 5.3 para `margin_type` e `use_clear` vem da API BakeSettings e das versões anteriores do operador. Confira com `help(bpy.ops.object.bake)`.
- Não verifiquei a orientação da opção "Save as Render" (aplicar view transform ao salvar) para bakes em 5.x.

## Q4. Compressão para web: KTX2/Basis (UASTC vs ETC1S), KTX2Loader sem build, toktx/gltf-transform, fallback WebP

### Takeaway
Use **ETC1S** para cor (albedo da fôrma, fotos, piso). Os arquivos ficam do tamanho de um JPEG e a memória de GPU cai ~4–8x. Use **UASTC + Zstd** para normal map e, se a qualidade importar, para o lightmap, já que gradientes suaves sofrem com blocos de ETC1S. O KTX2Loader funciona sem build: importe `three/addons/loaders/KTX2Loader.js` pelo importmap e aponte `setTranscoderPath` para a pasta `basis/`, vendorizada ou em CDN, com a mesma versão do three.

### Cited Findings
- **ETC1S**: qualidade baixa a média, arquivo pequeno comparável a JPEG, bom para cor e ruim para normal map. **UASTC**: qualidade comparável a BC7, serve para cor e dados (normal). Com Zstd fica ~1–2x o tamanho de JPEG/ETC1S. Mesmo assim os pixels de UASTC são ~4x menores que JPEG/PNG em memória. — [Don McCurdy, web texture formats](https://www.donmccurdy.com/2024/02/11/web-texture-formats/)
- **Taxas**: ETC1S ~0,3–1,25 bpp. UASTC sem compressão própria fica em 8 bpp, e com RDO + LZ cai para ~4–6 bpp por textura. ETC1S não lida bem com normal maps tangent-space em RGB. — [Basis Universal spec/README (mirror Skia)](https://skia.googlesource.com/external/github.com/BinomialLLC/basis_universal/+/6c51561349bc56dad17701aa6be7a3dd986c48a9)
- **Comandos do Khronos KTX Artist Guide**:
  - cor: `toktx --genmipmap --t2 --encode etc1s --clevel 4 --qlevel 255 out.ktx2 in.png`
  - normal: `toktx --genmipmap --t2 --encode uastc --uastc_quality 4 --uastc_rdo_l .25 --uastc_rdo_d 65536 --zcmp 22 --assign_oetf linear --assign_primaries none out.ktx2 in.png`
  - packed (ORM): o mesmo, com `--uastc_rdo_l .5`

  — [Khronos KTX Artist Guide](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md)
- **Medições do Artist Guide**:
  - lâmpada com JPG+PNG: 13 MB em disco e 96 MB na GPU
  - a mesma com UASTC+ETC1S: 10 MB em disco e 21 MB na GPU
  - pato 512² em ETC1S: 116 KB em disco (vs PNG 118 KB) e 277 KB na GPU (vs 1,5 MB)
  - a versão só ETC1S mostra blocos óbvios

  — [Khronos KTX Artist Guide](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md)
- O CLI do glTF Transform tem os comandos `etc1s`, `uastc`, `ktxfix`, `webp`, `avif` e `resize`, e também `optimize ... --texture-compress webp`. O CLI usa Sharp. Os comandos KTX dependem do KTX-Software instalado. A dependência do KTX-Software não aparece explícita na página, então veja `gltf-transform help uastc`. — [glTF Transform CLI](https://gltf-transform.dev/cli)
- **Quando usar o quê**: WebP/AVIF minimizam a transferência e são melhores quando o primeiro paint é a prioridade. KTX2 é melhor quando o usuário passa tempo na cena (memória e upload). Para evitar travadas de upload: `renderer.initTexture()` e `ImageBitmapLoader`. — [Don McCurdy](https://www.donmccurdy.com/2024/02/11/web-texture-formats/)
- **Uso do KTX2Loader**: `new KTX2Loader().setTranscoderPath('<pasta com basis_transcoder.js/.wasm>/').detectSupport(renderer)`. Os arquivos ficam em `three/examples/jsm/libs/basis/`. `dispose()` encerra os workers. — resumo da doc three.js (a página de doc renderizada não trouxe o corpo, então o resumo veio do conhecimento da API): [three.js docs KTX2Loader](https://threejs.org/docs/#examples/en/loaders/KTX2Loader). **Verificar** no código de r170.

### Inferences
- **Sem build**, adicione ao importmap `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"` e use `setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/')`. Ou, mais robusto, vendorize os 2 arquivos (`basis_transcoder.js` e `.wasm`, ~500 KB) no repo do site. A versão do transcoder tem que bater com a do loader.
- **Por mapa**:
  - albedo da fôrma 1024²: ETC1S q≈255 (~100–250 KB, ~0,7 MB GPU)
  - normal 1024²: UASTC+Zstd com `--assign_oetf linear`
  - lightmap 2048²: UASTC+Zstd com RDO, `--assign_oetf linear` se o PNG for linear ou srgb se o PNG estiver em sRGB. ETC1S tende a mostrar banding e blocos em degradê escuro, que é justamente o corredor escuro.
  - fotos: ETC1S
- **toktx vs `ktx create`**: o KTX-Software mais novo substitui o `toktx` pelo `ktx create`. As flags mudam de nome (`--encode uastc --uastc-quality ... --zstd 18`). Confira com `ktx create --help` na versão instalada (gap).
- **Fallback**: se o KTX2 não carregar, o fallback é WebP (Safari 14+ suporta), carregado com `TextureLoader`. Vale ainda considerar WebP como formato único se o total de memória sem compressão (Q1) couber no orçamento. KTX2 é otimização de memória, não obrigação.

### Gaps
- Não obtive o corpo da página de doc do KTX2Loader r170 nem confirmei os nomes de flag do `ktx create` (KTX-Software 4.x).
- Não achei números de qualidade (PSNR) específicos para lightmaps escuros em ETC1S vs UASTC. A recomendação de UASTC para o lightmap é inferência a partir de "ETC1S = blocos".

## Q5. MeshBasicMaterial + map + lightMap vs MeshLambert/MeshStandard no celular

### Takeaway
Para um ambiente 100% assado (sem luz dinâmica), **MeshBasicMaterial** com `map` (tile, UV0), `lightMap` (atlas, UV1) e, se quiser, `aoMap` é o mais barato: não avalia luzes. Só que ele **ignora `normalMap`/`bumpMap`**, porque não tem luz para o normal perturbar. Se o relevo fino (bump do concreto, furo de tensor) precisar reagir à luz, há duas saídas: (a) assar o relevo no próprio albedo/AO, como cavity/AO assados no tile; ou (b) usar MeshLambert (que em r170 aceita normalMap/bumpMap) ou Standard com poucas luzes, o que custa mais.

### Cited Findings
- No MeshBasic r170, o lightmap entra como luz difusa indireta (`* lightMapIntensity * RECIPROCAL_PI`) e é multiplicado por `diffuseColor` (= color x map). Depois vem o `aomap_fragment`. Não existe cálculo de luz direta. — [three@0.170.0 meshbasic.glsl.js](https://unpkg.com/three@0.170.0/src/renderers/shaders/ShaderLib/meshbasic.glsl.js)
- Para um material apagado com light map, a recomendação no forum é o MeshBasicMaterial. Ele não interage com luzes. — [three.js forum, How to bake light with textures?](https://discourse.threejs.org/t/how-to-bake-light-with-textures/52076); [mesh-baked-material README](https://unpkg.com/mesh-baked-material@1.0.4/README.md)
- Um relato com MeshBasic + lightMap: em áreas de lightmap preto puro, a cor some. Com MeshLambert + luz ambiente o resultado ficou melhor. — [three.js forum #8872](https://discourse.threejs.org/t/problem-with-lightmap-when-using-meshbasicmaterial/8872)
- **Cor (r152+)**: o three.js não infere mais o colorSpace das texturas. O default é NoColorSpace, correto para dados (normal) e errado para `map`. O `lightMap` está na lista de mapas que pedem atenção: sRGB ou Linear, conforme a exportação. — [three.js forum, Which material textures must be SRGBColorSpace?](https://discourse.threejs.org/t/docs-which-material-textures-must-be-srgbcolorspace/81423); [three.js forum, Updates to Color Management in r152](https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791?page=3); [three.js forum, Transitioning to an sRGB workflow](https://discourse.threejs.org/t/transitioning-to-an-srgb-workflow/62623)

### Inferences
- **Setup recomendado para paredes e piso**:
  - `new MeshBasicMaterial({ map: tileAlbedo, lightMap: atlas, lightMapIntensity: Math.PI })`
  - `tileAlbedo.colorSpace = SRGBColorSpace`, `wrapS = wrapT = RepeatWrapping`, `anisotropy = renderer.capabilities.getMaxAnisotropy()` (ajuda muito nas paredes vistas em ângulo rasante do corredor)
  - `atlas.channel = 1` (UV1), com `atlas.colorSpace` = `SRGBColorSpace` se o PNG do Blender foi salvo em sRGB (padrão do Blender ao gravar PNG) ou `NoColorSpace`/linear se foi EXR ou convertido como linear
  - `atlas.flipY` coerente com o loader: `TextureLoader` usa flipY=true, que bate com as UVs do Blender exportadas por glTF; KTX2 **não** faz flip, então lembre de inverter a UV ou usar `--lower_left_maps_to_s0t0` ou equivalente na conversão
- **Relevo sem luz dinâmica**: assar no tile uma variação de **AO/cavity** (bake AO ou o Fac do Brick como escurecimento da costura) multiplicada no albedo. É o que dá leitura de costura e furo com MeshBasic. Os spots fixos do teto já estão no lightmap.
- **Se quiser brilho de spot "andando" na parede** com a câmera, ou relevo que reaja à luz, use MeshLambertMaterial com `normalMap` + `lightMap` e 0–2 luzes. É mais caro por pixel, mas ainda bem mais barato que Standard. MeshStandard (PBR) não se justifica no celular para concreto fosco.
- **Fotos nas paredes**: MeshBasic com map, multiplicadas pelo mesmo lightmap (UV1 projetada da parede) ou por uma cor constante, para não ficarem "acesas" demais em relação ao concreto.
- **Calibração final**: renderize no Blender uma câmera igual à do site com view transform Standard e compare lado a lado. Ajuste `lightMapIntensity` e `renderer.toneMapping`. Se o render do Blender usa AgX, use `AgXToneMapping` no three r170 (disponível desde r160), para a curva bater.

### Gaps
- Não confirmei na doc de r170 se o MeshLambertMaterial aceita normalMap e bumpMap. Pelo histórico ele passou a aceitar em ~r150, mas sem fonte coletada nesta pesquisa.
- Não achei benchmark de custo de fragment shader MeshBasic vs Lambert vs Standard em celular médio. A ordem de custo é inferida da complexidade dos shaders.
- O comportamento de flipY do KTX2Loader e a flag do toktx para orientação não foram verificados em fonte primária nesta rodada.
