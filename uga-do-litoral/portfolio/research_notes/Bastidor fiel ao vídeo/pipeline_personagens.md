# Pipeline for stylized low-poly faceless 3D characters (three.js 0.170, static site, mobile, <1 MB for 5–6 characters)

## Base meshes: which permissive rigged humanoids allow web redistribution, and which have clothing variants?

### Takeaway
The cleanest option is the Quaternius "universal" ecosystem: Universal Base Characters, Modular Character Outfits and Universal Animation Library 1+2. All of it is CC0, everything shares one skeleton, and it ships as glTF, so a commercial portfolio can serve the GLBs with no restriction. The catches: the base bodies are about 13k tris each (heavy for the budget) and the only outfit pack is Fantasy, so there are no hoodies, caps or vests. Clothing for backstage staff has to be modeled (scripted) in Blender on top of the base. KayKit and Kenney are CC0 alternatives with a chunkier look. Mixamo and Synty are usable in a shipped product but both forbid redistributing raw files, which is a grey zone for a static site that serves GLBs openly.

### Cited Findings
- Quaternius Universal Base Characters: 6 base models (Superhero/Regular/Teen proportions, male and female), CC0, FBX + glTF (Standard tier also OBJ, Source tier adds .blend), about 13k triangles on average, humanoid rig, compatible with the Universal Animation Library, 20 hairstyles, customizable eye/skin colors. No clothing variants listed. — [Quaternius • Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html)
- Quaternius Modular Character Outfits – Fantasy (Nov 2025): 12 outfits, 62 modular parts, 3 texture variations per outfit, compatible with Universal Base Character heads, CC0, FBX/OBJ/Blend/glTF. Standard download free (263 MB), source download $15+. — [quaternius.itch.io](https://quaternius.itch.io/modular-character-outfits-fantasy); [quaternius.com](https://quaternius.com/packs/modularcharacteroutfitsfantasy.html)
- No Quaternius modular outfit pack with contemporary or casual clothing (hoodie/cap/vest) was found. The only outfit pack found is Fantasy; the sci-fi kits are environments and props, not outfits. — [OpenGameArt: Modular Sci-Fi MegaKit](https://opengameart.org/content/modular-sci-fi-megakit); [OpenGameArt: Sci-Fi Essentials Kit](https://opengameart.org/content/sci-fi-essentials-kit)
- A 2026 browser open-world dev log used Universal Base Characters + Modular Character Outfits + Universal Animation Library 1 and 2 (262 clips). Every mesh in the four packs uses the same 65-joint UE5-style skeleton, so no retargeting is needed. The raw set is about 147 MB (2K PNGs, uncompressed GLBs), estimated at about 30 MB after KTX2 + gltf-transform. — [Cinevva dev blog part 25](https://app.cinevva.com/blog/2026-05-10-open-world-browser-part-25-universal-characters)
- Pitfalls from the same log: outfit meshes must be rebound to the canonical skeleton by bone name (new `Skeleton` from canonical bones, reuse bind-inverse matrices, `SkinnedMesh.bind`), not just reparented. Hair is a SkinnedMesh weighted to all 65 joints. The base body must be hidden under outfits to avoid clipping. Clone before binding so the loader cache is not mutated. — [Cinevva dev blog part 25](https://app.cinevva.com/blog/2026-05-10-open-world-browser-part-25-universal-characters)
- Kenney Animated Characters (Protagonists, Retro, Survivors) are CC0, with tags such as skater, cyborg and criminal. Credit is appreciated but not mandatory. — [Kenney: Protagonists](https://kenney.nl/assets/animated-characters-protagonists); [Kenney: Survivors](https://kenney.nl/assets/animated-characters-survivors); [OpenGameArt: Animated Characters 1](https://opengameart.org/content/animated-characters-1)
- Kenney packs are said to come as "FBX, glTF, more" (an aggregator claim, not confirmed on Kenney's page). — [Cinevva rigged character guide](https://app.cinevva.com/guides/free-rigged-3d-character-models)
- KayKit (Kay Lousberg): the Adventurers free tier has 5 rigged, textured characters plus 25+ weapons and accessories, in FBX/glTF. KayKit Character Animations is CC0 and compatible with all KayKit characters. — [itch.io KayKit Adventurers](https://kaylousberg.itch.io/kaykit-adventurers); [itch.io KayKit Character Animations](https://kaylousberg.itch.io/kaykit-character-animations); [Godot Asset Library (CC0)](https://godotengine.org/asset-library/asset/2129)
- MPFB2 (MakeHuman Plugin for Blender): code is GPLv3, bundled assets (including the base mesh) are CC0. It needs Blender ≥ 4.2 and can add a Rigify meta-rig with weights. — [CG Channel, Mar 2025](https://www.cgchannel.com/2025/03/check-out-open-source-blender-character-generation-plugin-mpfb-2); [MakeHuman license page](https://static.makehumancommunity.org/about/license.html); [MPFB 2.0-alpha1 notes](https://static.makehumancommunity.org/mpfb/releases/release_20a1.html)
- Mixamo: characters and animations are royalty-free for personal, commercial and non-profit use. "Really the only thing you can't do is distribute the raw character and animation files." Banned: asset packs, templates and blueprints that redistribute raw files, and ML training. Attribution is not required. The source is a 2022 community-posted FAQ, and the official helpx page returned 403 to the fetcher. — [Adobe Community Mixamo FAQ](https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775); [Adobe helpx Mixamo FAQ](https://helpx.adobe.com/en/creative-cloud/faq/mixamo-faq.html)
- The community reading (not Adobe wording) is that games are fine when Mixamo files are embedded and not easily extractable as separate files. — [Adobe Community: Mixamo characters for commercial games](https://community.adobe.com/t5/mixamo-discussions/mixamo-characters-for-commercial-games/m-p/11815258)
- Synty EULA: "you must not distribute our Assets as stock images or stock art (2D or 3D) or otherwise share them for re-use by third parties". Commercial games are allowed, but reselling edited assets is not. No Synty statement on WebGL/three.js was found. — [Synty One Time Purchase Licence](https://syntystore.com/pages/one-time-purchase-licence); [Synty FAQ](https://syntystore.com/community/faq); [Synty licences overview](https://syntystore.com/pages/licences-overview)
- On web builds, assets can be extracted with browser devtools. A thread about a three.js game raises this concern but has no vendor answer. — [itch.io post](https://itch.io/post/15343441)

### Inferences
- For a static site where `/models/*.glb` is directly downloadable, CC0 sources (Quaternius, Kenney, KayKit, MPFB2 assets) remove all license risk. Mixamo and Synty carry a "raw file redistribution" ambiguity, because an unobfuscated GLB on a public URL is arguably a raw file. Prefer CC0 for the bodies and the rig.
- Recommended base: Quaternius Universal Base Characters ("Regular" proportions), with the head mesh deleted or replaced by a smooth faceless ovoid/helmet-like head (faceless requirement), and hair kept or replaced with caps or hoods. Clothing (hoodie, cap, security vest, headset, clipboard, camera) is modeled by script in Blender and weighted by data transfer from the body (see the scripting section). This avoids the "wooden mannequin" look because the base anatomy is professional, not primitives.
- 13k tris × 6 = about 78k tris before decimation. A Decimate (collapse) modifier to about 3–5k tris per character keeps the look low-poly and the budget small. Alternatively, use KayKit/Kenney bodies, which are already very low-poly but have a recognizable "toy" aesthetic.
- MPFB2 is the most flexible option for realistic proportions and also CC0, but it produces dense meshes and needs heavier decimation and its own rig (Rigify/game rig). That costs more work for less stylization.

### Gaps
- Could not confirm exact Kenney GLB availability or skin system per pack (the pages fetched show license only).
- No confirmed CC0 casual-clothing outfit pack (hoodie/cap/vest) compatible with the Quaternius skeleton was found.
- Poly Pizza and Sketchfab CC0 were not researched individually. Poly Pizza hosts mixed CC0 and CC-BY models, so per-model checking is required (from memory, not verified this session).
- The current official Mixamo terms could not be fetched (403).

## Animations: licenses, retargeting in Blender by script, and sharing one skeleton/clip set in three.js

### Takeaway
Use the Quaternius Universal Animation Library 1+2 (CC0, 120+ and 130+ clips, same rig as the base characters) for idle, walk and general gestures, so no retargeting is needed. If a specific gesture is missing (talking on radio, arms crossed), either hand-key it in Blender by script on the same rig or retarget a Mixamo clip with an add-on. Mixamo clips baked into your own GLB are generally considered fine but carry the redistribution caveat. In three.js, load clips once, `SkeletonUtils.clone` each character, and use one `AnimationMixer` per character.

### Cited Findings
- Universal Animation Library (1): 120+ animations on a universal humanoid rig compatible with UE/Godot/Unity, ready for retargeting. Includes 8-direction locomotion, jog, sprint, push, crawl, swim, sit and death animations. CC0. The free Standard version is a subset, and the Source version with .blend is pay-what-you-want. — [itch.io Universal Animation Library](https://quaternius.itch.io/universal-animation-library); [quaternius.com](https://quaternius.com/packs/universalanimationlibrary.html); [80.lv](https://80.lv/articles/get-your-hands-on-over-120-ready-to-use-game-animations)
- Universal Animation Library 2: 130+ clips, CC0. Standard (free, about 60–70% of the clips) in OBJ/FBX/glTF; Source adds .blend with rig and animations. Categories: melee combos, parkour, farming/fishing, zombie locomotion. — [quaternius.com UAL2](https://quaternius.com/packs/universalanimationlibrary2.html); [itch.io UAL2](https://quaternius.itch.io/universal-animation-library-2)
- A Digital Production article (Feb 2026) covered "130 animations, one rig, zero drama". — [Digital Production](https://digitalproduction.com/2026/02/10/130-animations-one-rig-zero-drama/)
- Mixamo license: royalty-free for commercial use; no redistribution of raw character or animation files. — [Adobe Community Mixamo FAQ](https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775)
- Retargeting add-ons:
  - Rokoko plugin (free), cited as the current option for Mixamo → Blender. — [Cinevva Mixamo-to-Blender 2026](https://app.cinevva.com/guides/mixamo-to-blender-2026); [Rokoko retargeting guide](https://www.rokoko.com/insights/ace-retargeting-in-blender-with-this-simple-workflow-i-the-ultimate-retargeting-guide)
  - Expy Kit (free/OSS), Mixamo ↔ Rigify ↔ engines, batch retarget; sources date from 2022. — [BlenderNation](https://www.blendernation.com/2022/06/04/blender-expy-kit-addon-easy-mixamo-to-rigify-retargeting/)
  - "Retarget" by KBS-DEV on extensions.blender.org has a 5.0.0 release. — [extensions.blender.org Retarget](https://extensions.blender.org/add-ons/retarget/)
  - Bone Animation Copy Tool (bone mapping table, Blender 4.2+). — [extensions.blender.org](https://extensions.blender.org/add-ons/bone-animation-copy-tool/)
  - Auto-Rig Pro Remap (paid) works with Rokoko workflows. — [Cinevva guide](https://app.cinevva.com/guides/mixamo-to-blender-2026)
- Blender 5.0 has no built-in retargeting. It integrated "Copy Global Transform" (formerly an add-on) and moved bone visibility to pose bones. — [Blender 5.0 Animation & Rigging notes](https://developer.blender.org/docs/release_notes/5.0/animation_rigging/)
- Blender 5.0 removed the legacy `action.fcurves`/groups API, so pre-4.4 retarget/export scripts break (layered actions/slots API instead). — [Cinevva Blender 5 for game artists](https://app.cinevva.com/guides/blender-5-for-game-artists); [Blender 5.0 Animation & Rigging notes](https://developer.blender.org/docs/release_notes/5.0/animation_rigging/)
- three.js: `SkeletonUtils.clone` (import from `three/addons/utils/SkeletonUtils.js`) copies the hierarchy and rebinds SkinnedMesh to the cloned bones. Geometry and materials are shared by reference. Clips are not cloned: reuse the same `AnimationClip`s and create one `AnimationMixer` per character, as in the official `webgl_animation_multiple` example. — [three.js docs SkeletonUtils](https://threejs.org/docs/pages/module-SkeletonUtils.html); [three.js forum: clone mesh with animations](https://discourse.threejs.org/t/good-way-to-clone-a-mesh-with-animations/19396)
- In the Quaternius stack, animation tracks bind by bone name (`bone.quaternion`, etc.), so clips from a separate animation GLB drive any character with the same skeleton. — [Cinevva dev blog part 25](https://app.cinevva.com/blog/2026-05-10-open-world-browser-part-25-universal-characters)

### Inferences
- Budget-wise, store all clips in one shared `anims.glb` (skeleton plus actions, no mesh) and each character as a mesh-only GLB on the same skeleton. Or put everything in one GLB: 5–6 meshes plus about 6–8 clips (idle, idle-variant, walk, talk-gesture, arms-crossed, look-around, clipboard-check, radio-to-ear).
- "Talking on radio" and "arms crossed" are short, mostly upper-body poses. With a shared rig they are cheap to author by script in Blender: keyframe a few bones (shoulder, upper arm, forearm, hand) between 2–3 poses, then layer a breathing idle (spine/chest rotation sine) on top. That stays CC0/own-authored with no Mixamo grey zone.
- Mixamo is still the fastest source of a natural "talking" gesture. Uploading the Quaternius character to Mixamo, downloading "Without Skin", and retargeting by name avoids the retarget add-on, but this is unverified against current Mixamo upload behaviour.
- Use `gltf-transform resample` (lossless keyframe dedupe) and trim clips to the loop length; animation data often dominates GLB size for skinned characters.

### Gaps
- No direct confirmation of which exact UAL clip names exist (for example "Idle_Talking", "Phone" or "ArmsCrossed"). Inspect the free Standard download.
- Did not verify whether the Rokoko or Expy Kit add-ons work on Blender 5.x (the workstation has 5.3).

## Script-modeling in Blender (sculpt-less, headless bpy)

### Takeaway
Do not build the body from primitives again. Start from a CC0 base mesh (Quaternius), strip or replace the face, decimate, and model clothing by script: duplicate body faces → Solidify → Shrinkwrap/offset → transfer weights from the body. The Skin modifier is viable for props and stylized limbs but tends to produce the same mannequin look if used for the whole body.

### Cited Findings
- The Skin modifier generates a surface from vertices and edges with a per-vertex radius. The typical stack is Mirror above Skin, Subdivision after Skin (skip it for low-poly), and Armature below. — [Blender Manual: Skin Modifier](https://docs.blender.org/manual/en/3.5/modeling/modifiers/generate/skin.html); [GameDev.net: Skin modifier creatures](https://click.gamedev.net/tutorials/visual-arts/using-the-skin-modifier-in-blender-to-quickly-model-creatures-r5004)
- Per-vertex skin radius in Python: `MeshSkinVertex.radius` is a float[2] (accessed via `mesh.skin_vertices[0].data[i].radius`). — [bpy API 5.0 MeshSkinVertex](https://docs.blender.org/api/5.0/bpy.types.MeshSkinVertex.html)
- The Skin modifier can also generate an armature from its edges ("Create Armature"). — [Pluralsight: power of the Skin modifier](https://www.pluralsight.com/blog/tutorials/understanding-power-skin-modifier-blender)
- Bruno Simon's folio-2025 README notes a Blender pipeline where a palette texture node is muted and the material is assigned in three.js, with compression left off at export (repo mirror, MIT). — [Gitee mirror of folio-2025](https://gitee.com/hoppin/folio-2025)

### Inferences
These are standard Blender practice and were not individually sourced this session.
- Clothing by script: select body faces by vertex group or bounding region (torso + upper arms for a hoodie or vest), `bmesh` duplicate → separate object → Solidify (thickness about 0.01–0.02) → optional Displace/Shrinkwrap offset → Data Transfer modifier (vertex groups from body, nearest face interpolated) → Armature modifier on the same rig. A hood is a deformed sphere segment weighted to the head and neck. A cap is a cylinder plus a flattened visor weighted 100% to the head bone.
- Props (headset, clipboard, radio, camera, lanyard) are rigid meshes parented to a bone (hand.R, head) or weighted 100% to that bone, so they become part of the same skinned mesh. Rigid weighting is preferable to `bone parent`, because the glTF exporter keeps it in one draw call if merged.
- Faceless head: delete the eye/brow meshes, then smooth the head (Corrective Smooth / Laplacian smooth on face verts) or replace it with an egg shape. A single flat color plus rim light reads as an "anonymous figure", which is a stylized, not uncanny, look.
- Text on the back ("SECURITY", "STAFF", "CREW"): a tiny 256×64 alpha texture on a separate quad decal weighted to the spine bones, or bake it into a small atlas. Alternatively, convert a text object to mesh (Text → Mesh, Solidify 0) and shrinkwrap it to the back. Mesh text is about 1–3k tris, so a texture decal is cheaper.
- Color: a vertex-color-only workflow (no textures) or a 64×64 palette atlas (one material for all characters, UVs pointing into flat color swatches, the Kenney/Quaternius/Bruno-Simon approach) keeps textures at a few KB and allows a single material (fewer shader switches).
- Join everything per character into one mesh + one material → 1 draw call per character (2 with outline).
- Use the Decimate modifier (Collapse ratio about 0.3) on the Quaternius body before joining; check deformation at the shoulders and elbows.

### Gaps
- No sourced example of a full headless bpy clothing script was found; the approach above is inference from standard Blender features.
- Metaballs were not researched; they are not recommended because they convert to dense, irregular meshes that need remeshing.

## Export and optimization: glTF/GLB, gltf-transform, decoders in no-build three r170, instancing, draw calls

### Takeaway
Export one GLB per character, or one combined GLB, from Blender (glTF 2.0, skinning on, "Group by NLA track"/actions, no Draco). Then run gltf-transform: `resample` → `prune`/`dedup` → `weld` → `quantize` → `meshopt` → textures to WebP/KTX2. Meshopt beats Draco for animated characters because it also compresses animation and works with quantization. Load with `GLTFLoader.setMeshoptDecoder(MeshoptDecoder)` from `three/addons/libs/meshopt_decoder.module.js` via an import map, no build needed. Expect roughly 80–85% reduction. A 3–5k-tri character with a palette texture and shared clips should land around 50–150 KB, which keeps 6 characters plus clips under 1 MB.

### Cited Findings
- `gltf-transform optimize` is "Optimize model by all available methods", for example `gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp`. Defaults "may not be ideal for all scenes". Run `optimize -h` for flags. Separate commands: `resample` ("lossless keyframe dedupe"), `quantize`, `meshopt`, `draco`, `etc1s`/`uastc` (KTX2), `simplify`, `join`, `instance`. — [glTF-Transform CLI docs](https://gltf-transform.dev/cli)
- Example of a sample character with 10 baked clips: 3.8 MB → 3.6 MB after prune, weld and keyframe trim → 676 KB after Meshopt (about 84% smaller). This is a vendor page, so treat it as indicative. — [Cinevva GLB optimizer](https://app.cinevva.com/ko/tools/glb-optimizer)
- Use Meshopt instead of Draco for animated characters, because Draco leaves animation tracks and morph targets untouched. Quantization stores positions as 16-bit and folds scale/offset into inverseBindMatrices for skinned meshes. — [Cinevva optimize-GLB guide](https://app.cinevva.com/guides/optimize-glb-for-web)
- Quantize is the default pre-step to Meshopt in glTF-Transform. — [@gltf-transform/extensions meshopt source](https://cdn.jsdelivr.net/npm/@gltf-transform/extensions@4.3.0/src/ext-meshopt-compression/meshopt-compression.ts)
- Known issue: quantization produced invalid skinning weights on CesiumMan, fixed in glTF-Transform v4.0.2. Verify skinned output. — [three.js forum: glTF meshopt compression](https://discourse.threejs.org/t/gltf-meshopt-compression/66244)
- `GLTFLoader.setMeshoptDecoder(decoder)` is required for `EXT_meshopt_compression` and must be called before loading. The current path is `three/addons/libs/meshopt_decoder.module.js`. — [three.js GLTFLoader docs](https://threejs.org/docs/pages/GLTFLoader.html); [three.js forum thread](https://discourse.threejs.org/t/unable-to-load-meshopt-compressed-glb-file-in-react-native/70180)
- `SkeletonUtils.clone` does not reduce draw calls. Each character keeps its own draw calls (one report: about 19 draw calls per robot model; another: +5 draw calls per character). three.js `InstancedMesh` does not support SkinnedMesh. `AnimationMixer.update()` for many skinned meshes is a top CPU cost. A rule of thumb is <100 draw calls and <100k vertices. — [three.js forum: optimizing 100–1000 skinned meshes](https://discourse.threejs.org/t/optimization-of-large-amounts-100-1000-of-skinned-meshes-cpu-bottlenecks/58196); [three.js forum: how to batch skinned mesh](https://discourse.threejs.org/t/how-to-batch-skinned-mesh/30348); [three.js forum: optimizing imported gltf](https://discourse.threejs.org/t/optimizing-performance-with-imported-gltf-models/12425)

### Inferences
- The draw-call count is driven by meshes × materials per character, not by cloning. Merge each character to 1 mesh + 1 shared palette material, which gives 6 draw calls total (12 with inverted-hull outline). That is trivial on mobile.
- Concrete command sequence (gltf-transform v4):
  `gltf-transform resample in.glb a.glb && gltf-transform prune a.glb b.glb && gltf-transform weld b.glb c.glb && gltf-transform meshopt c.glb out.glb --level medium` (meshopt applies quantize). Alternatively, `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 256`. Confirm flags with `-h`.
- For textures, a single 64–256 px palette PNG/WebP (a few KB) makes KTX2 unnecessary. KTX2 also needs `KTX2Loader` plus the Basis transcoder WASM (about 200+ KB on its own), which would eat into a 1 MB budget.
- Draco is not worth it here: the decoder WASM/JS is about 300 KB and it does not compress animation. The Meshopt decoder is small (tens of KB, inline WASM).
- No-build import map (three 0.170 from a CDN): map `"three"` → `.../three@0.170.0/build/three.module.js` and `"three/addons/"` → `.../three@0.170.0/examples/jsm/`. Then `import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'`, plus `GLTFLoader` and `SkeletonUtils` from `three/addons/...`.
- If several characters share the same body mesh with different outfits/colors, keep separate meshes per character (6 is cheap). Only if dozens of extras are needed should you consider baked vertex-animation textures (VAT) with `InstancedMesh`.

### Gaps
- No authoritative measured size for a Quaternius base character after meshopt was found; the 676 KB figure is for a different (unspecified) 10-clip character.
- The exact `gltf-transform optimize` default steps and flags were not listed on the CLI page; the `-h` output is needed.
- The Meshopt decoder byte size was not verified this session.

## Stylized shading in three.js (toon, matcap, rim/fresnel, outlines) and mobile cost

### Takeaway
`MeshToonMaterial` with a 3–4-step `gradientMap` (NearestFilter) supports skinning out of the box and is cheap on mobile. Add a rim/fresnel term via `onBeforeCompile`, which keeps the built-in skinning chunks intact, instead of writing a raw ShaderMaterial. `MeshMatcapMaterial` is the cheapest option (no lights) and suits a "clay/premium" look. Inverted-hull outlines cost one extra draw and one extra skinning pass per character. That is fine for 6 characters, but the OutlinePass postprocess path is buggy with skinned meshes and heavier on mobile.

### Cited Findings
- MeshToonMaterial `gradientMap`: minFilter and magFilter must be `NearestFilter` for this kind of texture. — [three.js MeshToonMaterial types](https://cdn.jsdelivr.net/npm/@types/three@0.184.1/src/materials/MeshToonMaterial.d.ts); [three.js docs MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html)
- `onBeforeCompile` pattern: replace an `#include <chunk>` in `shader.fragmentShader` with custom code and add uniforms to `shader.uniforms`. — [three.js forum: fresnel shader or similar](https://discourse.threejs.org/t/fresnel-shader-or-similar-effect/9997?page=2); [three.js forum: light color in shader](https://discourse.threejs.org/t/how-to-access-the-light-color-intensity-by-which-the-material-is-affected-in-a-shader/78534)
- Rim term: `pow(1.0 - max(dot(viewDir, normal), 0.0), power)` added to the base color. — [threejs-shaders skill guide](https://playbooks.com/skills/cloudai-x/threejs-skills/threejs-shaders)
- Inverted hull: draw the mesh a second time, slightly expanded, with front-face culling (BackSide) and black; described as "cheap and robust". The same source says toon shading is "dead cheap and forgiving on low-end devices". — [Three.js From Zero: Stylized NPR](https://masterallarts.pages.dev/learn/threejs-from-zero/s4-09-stylized-npr/)
- three.js `OutlinePass`'s depth material omits skinning, so it mis-renders skinned meshes; pmndrs postprocessing calls this a known issue. — [Lightrun: pmndrs OutlineEffect SkinnedMesh](https://lightrun.com/answers/pmndrs-postprocessing-outlineeffect-support-for-skinnedmesh); [StackOverflow archive: outline on animated skinned mesh](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/59786826/best-method-to-get-outline-effect-with-animated-skinned-mesh)
- A single-draw-per-object outline technique exists in a 2025/26 three.js forum showcase. — [three.js forum: Mesh Outline effect](https://discourse.threejs.org/t/mesh-outline-effect/92215)
- Inverted hull thickness can be inconsistent (quality concern). — [Godot forum: stencil outline on mobile](https://forum.godotengine.org/t/how-does-stencil-outline-work-and-is-it-efficient-on-mobile-gpus/133096)

### Inferences
- The inverted hull for a SkinnedMesh in three.js: create a second `SkinnedMesh(sameGeometry, outlineMat)` bound to the same `skeleton` (`hull.bind(mesh.skeleton, mesh.bindMatrix)`), with an outline material whose vertex shader pushes along the normal after skinning. This is done via `MeshBasicMaterial` + `onBeforeCompile`, injecting `transformed += objectNormal * thickness;` after `#include <skinning_vertex>`, and `side: BackSide`. This shares the skeleton, so it adds no extra mixer cost; the GPU skins the vertices twice. For 6 × 3–5k tris, that is negligible.
- A rim on MeshToonMaterial: in the fragment, after `#include <dithering_fragment>` or before `#include <opaque_fragment>`, add `float rim = pow(1.0 - saturate(dot(normalize(vViewPosition) * -1.0, normal)), 3.0); gl_FragColor.rgb += rimColor * rim * rimStrength;`. `vViewPosition` and `normal` are already available in the toon fragment, and skinning is untouched because only the fragment is patched.
- For a backstage concert mood (dark scene, colored stage light), the rim/fresnel is what sells silhouettes. A strong colored rim (magenta/cyan stage light) plus a 3-tone toon gradient plus faceless heads reads as a stylized "anonymous crew" instead of a mannequin.
- The matcap option bakes the lighting into one small texture (128–256 px) and costs one texture fetch per pixel. It gives the cheapest premium look, but it does not react to scene lights; a rim can be added on top in the same way.

### Gaps
- No mobile frame-time benchmark for inverted hull on skinned meshes in three.js was found.
- No complete published example of MeshToonMaterial + onBeforeCompile rim on a SkinnedMesh was found; the snippet above is inference from three.js shader chunk structure (r170) and was not verified against the source.

## Reference web experiences with stylized faceless characters and their weights

### Takeaway
Little hard data was found. Bruno Simon's folio-2025 is the main public reference for a Blender → three.js stylized pipeline (palette textures, materials set in code, CC0 assets, MIT code), but no character weights were found. Comparable sites typically keep characters as one-material palette meshes.

### Cited Findings
- Bruno Simon folio-2025: the Awwwards case study notes water painted in Blender, 3 tree variations, and assets released under CC0. — [Awwwards case study](https://www.awwwards.com/brunos-portfolio-case-study.html)
- folio-2025 README: mute the palette texture node in Blender (material assigned in three.js), use specific export presets, leave compression off; MIT license (Gitee mirror, last updated 2025-12-10). — [Gitee mirror](https://gitee.com/hoppin/folio-2025)
- three.js WebGPURenderer (r171+) falls back to WebGL and is production-ready via `three/webgpu`; irrelevant if staying on r170 WebGLRenderer. — [Utsubo: What's new in three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed)
- Codrops covered the first three.js conference in Paris (Sep 2026). — [Codrops](https://tympanus.net/codrops/2026/09/10/inside-the-first-three-js-conference-in-paris/)

### Inferences
- The "palette texture + materials in code" approach in folio-2025 is the same as the one recommended above: a tiny palette atlas and one material per character set in JS (toon + rim), which keeps GLBs geometry-only and small.

### Gaps
- No specific Codrops/Awwwards case study with faceless stylized human characters and published GLB weights was found within the tool budget.
- Bruno Simon's character or vehicle model sizes were not found; checking `brunosimon/folio-2025` on GitHub directly would answer this.
