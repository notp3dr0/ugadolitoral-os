# Piso de concreto polido refletivo e fotos como pôster colado com fita (three.js r170, mobile, sem build)

Context: a dark backstage corridor about 45 m long, a camera that walks it, a budget of about 100 draw calls, a static site loading ES modules from a CDN, and photos whose colors must not change.

## 1. Floor reflections on mobile: which technique for a long corridor walk-through

### Takeaway
A true planar reflection (three.js `Reflector`, or a port of drei's `MeshReflectorMaterial`) renders the whole scene a second time every frame. That doubles the draw calls (about 100 becomes about 200), so on phones it only works with a small render target and a reduced reflection scene. For this corridor the best value is a hybrid. On mobile, use cheap fakes for the bright things (spots, red exit signs, the photos): mirrored low-cost copies under a semi-transparent floor, or additive streak quads, with the roughness and noise breakup done in the floor shader. On desktop, optionally enable a low-res blurred `MeshReflectorMaterial`-style reflector.

### Cited Findings
- **Reflector cost:** `Reflector` draws the full scene again from a mirrored virtual camera inside `onBeforeRender` (`renderer.render( scene, virtualCamera )`) into a render target each time the mirror is drawn.
  - The render target defaults to 512×512 (`textureWidth`/`textureHeight`), uses `HalfFloatType` and `multisample` 4.
  - It skips the update when the camera is behind the plane (`if ( view.dot( normal ) > 0 ) return;`).
  - It has no built-in option to exclude objects; it only hides itself during its own pass.
  - Source: [three.js r170 Reflector.js](https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/jsm/objects/Reflector.js)
- **Official example sizing:** the `webgl_mirror` example sizes the ground mirror at full screen × devicePixelRatio (`textureWidth: window.innerWidth * window.devicePixelRatio`) with `clipBias: 0.003`. That is far too heavy for phones; it is a demo, not a budget. — [three.js r170 webgl_mirror.html](https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/webgl_mirror.html)
- **Half resolution:** in a three.js PR review, a maintainer reported a Reflector example running at about 30 FPS on a MacBook and back to 60 FPS with a half-resolution reflection. The newer WebGPU/TSL reflector exposes `resolution: 0.5`. — [three.js forum/PR search summary, PR #31294 mirror](https://github.1485827954.workers.dev/mrdoob/three.js/pull/31294) (mirror domain; the original PR is on github.com/mrdoob/three.js; I did not verify the PR number directly)
- **Half-float risk on mobile:** a PR addresses mobile GPUs without `EXT_color_buffer_half_float`. Reflector's HalfFloat target can fail on some phones, so it is safer to pass a custom `UnsignedByteType` target, or to check. — [three.js PR (mirror)](https://gh.r-mj.com/mrdoob/three.js/pull/33114) (mirror domain; I did not verify the details)
- **How drei MeshReflectorMaterial works:**
  - Render targets: it renders to `fbo1` (HalfFloat, with a `DepthTexture`), then runs a `BlurPass` into `fbo2`. Default `resolution` is 256.
  - The blend is roughness-driven: `blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor); merge = mix(merge, blur, blurFactor);`. The roughness factor is `roughness * roughnessMap.g`.
  - Depth fade: `depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r*depth.a))`.
  - Final output: `diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);`. It extends `MeshStandardMaterial` and injects after `#include <emissivemap_fragment>`. The reflection is multiplied into the albedo, not added as emissive.
  - Sources: [drei core/MeshReflectorMaterial.tsx](https://raw.githubusercontent.com/pmndrs/drei/master/src/core/MeshReflectorMaterial.tsx), [drei materials/MeshReflectorMaterial.tsx](https://raw.githubusercontent.com/pmndrs/drei/master/src/materials/MeshReflectorMaterial.tsx)
- **Vanilla ports:**
  - `@pmndrs/vanilla` (drei-vanilla) ships `MeshReflectorMaterial`, "extends THREE.MeshStandardMaterial". It has no usage snippet and no stated CDN or three-version compatibility. — [pmndrs/drei-vanilla](https://github.com/pmndrs/drei-vanilla)
  - An older port by 0beqz: `vanilla-threejs-meshreflectormaterial-example`, plus a gist with blur and depth-based fade. — [forum thread](https://discourse.threejs.org/t/trying-to-adjust-parameters-of-meshreflectormaterial/44963), [repo listing](https://relatedrepos.com/gh/0beqz/vanilla-threejs-meshreflectormaterial-example)
  - drcmda (pmndrs): "everything inside useFrame must run in your render-loop" when porting. — [Blurred reflections thread](https://discourse.threejs.org/t/blurred-reflections/33296)
- **Known reflector artifacts:**
  - The reflection lags a frame behind during fast camera movement.
  - The `webgl_mirror_nodes` blur shows banding and no fade-off.
  - Using an overlay plane at reduced opacity above the mirror to soften it "works".
  - Source: [Blurred reflections thread](https://discourse.threejs.org/t/blurred-reflections/33296)
- **SSR:**
  - It needs no scene re-render, but it "only reflects things currently on screen". When walking a corridor with the camera looking forward, the floor ahead reflects walls and lights that are on screen, but anything behind or above the frame vanishes at the edges.
  - A tutorial frames planar vs SSR as "planar wins up to ~2 reflectors; SSR wins at N". This is an exercise prompt, not a benchmark.
  - three.js has `ReflectorForSSRPass`.
  - Sources: [Three.js From Zero, SSR article](https://masterallarts.pages.dev/learn/threejs-from-zero/s4-04-screen-space-reflections/), [ReflectorForSSRPass docs](https://threejs.org/docs/pages/ReflectorForSSRPass.html), [0beqz screen-space-reflections](https://github.com/0beqz/screen-space-reflections)
- **SSR on mobile:** threepipe's SSR plugin documents "Adaptive Quality: lower quality during camera motion" and a step-count tradeoff. — [threepipe SSReflectionPlugin](https://threepipe.org/plugin/SSReflectionPlugin.html)
- **Mirrored geometry under a semi-transparent floor:**
  - A three.js forum post: a client "mirrored all the geometry through the floor and made the floor itself partially transparent".
  - The IMVU guide describes "a mirror version of the room geometry applied directly under the floor", with floor-texture transparency adjusted between them. It advises not making the floor fully transparent.
  - Sources: [three.js forum search result](https://discourse.threejs.org/t/whats-the-best-way-to-make-a-reflective-floor/37438), [IMVU Reflective Floors Effect](https://create.imvu.com/?p=236)
- **Older precedents:** Half-Life: Blue Shift used "the same room placed under a glass surface" as a cheap reflection. The classic wet-floor look relies on a fading gradient. A reflected light sprite must sit at the same distance below the floor as the real light is above it, or it reads as glowing inside the floor. — [Wet floor effect wiki mirror](https://wiki.riteme.site/wiki/Wet_floor_effect), [TWHL "Poor Man's Shiny Floors"](https://twhl.info/wiki/page/VERC%3A_Poor_Man%27s_Shiny_Floors/285)
- **Codrops mirrors tutorial:** it uses a CubeCamera plus the three.js **layers** system so the fake copies are only seen by the reflection pass. A useful pattern: put reflection-only proxies on a separate layer. — [Codrops, Creating Mirrors in R3F and three.js](https://tympanus.net/codrops/2020/09/30/creating-mirrors-in-react-three-fiber-and-three-js/)
- **Shaders.com reflective-plane component:** it exposes a distance below the floor where the reflection fades to transparent, plus a falloff width. — [shaders.com reflectiveplane](https://static.shaders.com/docs/components/reflectiveplane)

### Inferences
- **Budget math:** with about 100 draw calls, a live `Reflector` adds about 100 more, plus a fill-rate cost.
  - Mitigations: use a small target (256–512 px on the long side, about 1/4 to 1/2 screen), drop `multisample` to 0, and render the reflection pass with a **reduced scene**. Use `camera.layers` on the virtual camera, or set heavy or small objects to `visible=false` during the pass via a custom `onBeforeRender` wrapper. In the reflection, only lights, emissive signs, photos and wall bases matter.
  - Optionally update the reflection every second frame. The camera walks slowly, though this worsens the one-frame lag noted on the forum.
- **Why the floor does not need a sharp mirror:** for a "Cycles polished concrete" look, the reflection is blurry and broken up anyway. That means a **low-res target plus blur is visually correct**, not a compromise. A 256 px target, blurred and modulated by a noise or roughness map, will look closer to Cycles than a full-res mirror.
- **Recommended tiering:**
  1. **Mobile default (cheapest, robust): fake reflections.**
     - Add an additive, vertically stretched, soft-gradient quad (or a single instanced mesh of them) on the floor under each spot and each exit sign. Color: the light color; fade by distance from the wall base.
     - Add a flipped, very dim, low-res copy of each photo below the floor: the same texture with `scale.y = -1`, on a layer, or simply as geometry under a floor with `opacity` about 0.85–0.9.
     - Instancing keeps this to 2–4 extra draw calls.
     - Static lights mean the streaks never need recomputing; they are effectively a baked reflection.
  2. **Bake option:** render a top-down reflection-and-glow texture once (in Blender or offline) and put it in the floor's emissive or lightmap. This only works for static lights, and the parallax is wrong (a reflection depends on the eye position), so streak quads that stay vertically elongated toward the camera read better.
  3. **Desktop / high tier:** a vanilla `MeshReflectorMaterial` port (drei-vanilla or 0beqz), with resolution 256–512, blur [300,100], mixBlur about 1, a roughnessMap from concrete noise, and mixStrength tuned. Gate it on a GPU or device check.
- **Rule out SSR** for this case: it is a fullscreen post pass (fill-rate heavy on high-DPR phones) and loses off-screen lights. Rule out a cubemap/env map: a single cube probe gives wrong parallax over a 45 m corridor and does not slide correctly with the walk.

### Gaps
- I found no published benchmark of Reflector or MeshReflectorMaterial frame cost on specific phones (iPhone or Android); this needs profiling on device.
- I did not verify which three.js versions `@pmndrs/vanilla` MeshReflectorMaterial supports, or whether it loads cleanly from a CDN without a build (it depends on `three-stdlib`-style imports; check the package exports before using an importmap).
- The Codrops "Crosswire reflective grid" article (which recreates a reflective floor) returned 403, so its implementation details were not checked.

## 2. Fresnel and roughness breakup so it reads as polished concrete, not a mirror

### Takeaway
Drive the reflection strength with three terms: a Fresnel term (weak looking down, strong at grazing angles far down the corridor), a tiling roughness/noise texture (smudges, trowel marks, scuffs), and a distance/depth fade. In MeshReflectorMaterial this is exactly `roughnessMap.g × mixBlur` choosing between the sharp and blurred reflection.

### Cited Findings
- **drei's breakup:** it multiplies `roughness` by the roughness map's green channel and uses that to mix the sharp and blurred reflection (`blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor)`). Depth thresholds (`minDepthThreshold`, `maxDepthThreshold`, `depthScale`, `depthToBlurRatioBias`) fade or blur the reflection with distance from the plane. An optional `distortionMap` perturbs the lookup UVs. — [drei MeshReflectorMaterial material](https://raw.githubusercontent.com/pmndrs/drei/master/src/materials/MeshReflectorMaterial.tsx), [drei wrapper](https://raw.githubusercontent.com/pmndrs/drei/master/src/core/MeshReflectorMaterial.tsx)
- **Wet-floor convention:** the reflection fades with a gradient. — [Wet floor effect](https://wiki.riteme.site/wiki/Wet_floor_effect)

### Inferences
- **Floor shader, cheap version** (works with both fake and real reflections), via `onBeforeCompile` on `MeshStandardMaterial` or a small ShaderMaterial:
  - `F = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0)` (Schlick), then scale it, so the far floor down the corridor gets brighter, longer reflections. This sells the "long polished corridor" look.
  - `rough = texture(noiseTex, vUv * tiling).g`. Use it to (a) scale reflection intensity (`refl *= mix(0.35, 1.0, 1.0 - rough)`), (b) pick between the sharp and blurred reflection (if using a reflector), and (c) jitter the reflection UVs slightly (`uv += (noise.rg - 0.5) * 0.01`) for the wavy concrete look.
  - Use a second, larger-scale noise (or the same texture at low tiling) to make patches of different polish. Real polished concrete has blotchy gloss.
  - For the fake streak quads, multiply their alpha by the same noise texture in floor UV space (sample by world XZ). The streaks then break up exactly where the floor is rough, which ties the fakes to the material.
- **Base color:** keep the concrete albedo dark (about 0.04–0.08 linear) so the reflections carry the image. Concrete albedo plus a mild normal map gives micro-detail; on mobile, skip the normal map and use the noise only for reflection modulation.
- **Textures:** 1 noise texture (512² or 1024², R/G channels for different scales) is enough. That is 1 texture fetch or 2.

### Gaps
- I did not find a sourced recipe specifically for "polished concrete" reflection parameters in three.js; the values above are engineering inference, to tune by eye against the Cycles reference.

## 3. Photos as printed paper posters taped with black gaffer tape

### Takeaway
Use a flat, very thin poster: a plane (or a 1–2 mm box) a few mm off the wall. The photo is unlit (`MeshBasicMaterial`, `map.colorSpace = SRGBColorSpace`, `toneMapped = false`) so the photographer's colors stay exact. The paper border, the tape and the wall shadow are separate cheap elements that react to the scene lighting. Batch everything into a few instanced or merged meshes to protect the draw-call budget.

### Cited Findings
- **Exact photo colors:**
  - Set `texture.colorSpace = THREE.SRGBColorSpace` for photos. A washed-out look usually means sRGB data was loaded as linear. `MeshBasicMaterial` with `toneMapped = false` is a recommended choice when colors must match the source (Don McCurdy: "MeshBasicMaterial+.toneMapped=false would be a good choice for UI overlays").
  - Some forum users saw no change from `toneMapped=false` when tone mapping was not in use. It matters only if the renderer has `toneMapping` set (e.g. ACES for the dark scene).
  - Sources: [three.js forum, colors right for MeshBasicMaterial](https://discourse.threejs.org/t/how-to-get-the-colors-right-for-a-simple-texture-with-meshbasicmaterial/55187), [forum, is it possible to match colors perfectly](https://discourse.threejs.org/t/is-it-possible-to-match-the-colors-perfectly/49894), [forum, MeshBasicMaterial wrong color](https://discourse.threejs.org/t/meshbasicmaterial-wrong-color-rendered/61551)
- **Contact shadows:** the three.js `webgl_shadow_contact` approach is a "fake shadow", and on a wall "it gets tricky... needs more than one plane". It suits a single flat surface such as a wall behind a poster. — [three.js forum, Shadow contact](https://discourse.threejs.org/t/shadow-contact-threejs/29505)
- **Photo count on mobile:** Shutterform, a three.js photo-gallery component, recommends about 20–40 photo cards for smooth performance. A loose data point for mobile. — [Framer Shutterform](https://www.framer.com/marketplace/components/shutterform/)

### Inferences (recommended construction)
- **Geometry:** one `PlaneGeometry` per poster, placed about 2–5 mm off the wall. No bend, no thick box, so it reads flat and taped.
  - Optional: very slight paper "lift" at the untaped edge midpoints. Use 2–4 subdivisions with a tiny vertex displacement (1–2 mm) toward the edge centers, which is how real paper puckers between tape points. Do not use the old curved card.
- **Two-layer material approach (cheapest correct):**
  1. **Paper mesh**, slightly larger than the photo by the border (e.g. 1.5–3% of the width), white or off-white (#EDEBE6-ish), `MeshLambertMaterial` or `MeshStandardMaterial` with `roughness` about 0.6–0.8. It receives the corridor light, so it dims or tints with the spots and exit red, which grounds it in the scene.
  2. **Photo mesh** on top (or the same mesh with a shader), `MeshBasicMaterial`, `toneMapped:false`, sRGB map. The colors are untouched.
  - **Single-mesh alternative:** a custom ShaderMaterial. Inside the photo rect output `texture(map, uv)` as-is; in the border output paper color × a simple lighting term. Add the sheen (below) only as an additive term **outside** the photo rect, or as a very small additive term over it that viewers can turn off. Note: any additive sheen over the photo technically alters its pixels. Safest is sheen on the border and tape only, or a sheen that appears only at grazing angles.
- **Edge darkening and paper feel:** in the border shader, `edge = smoothstep(0.0, 0.01, min(min(uv.x,1-uv.x), min(uv.y,1-uv.y)))`, then darken the last 1–2 px slightly. Add very subtle paper-grain noise in the border only.
- **Sheen moving with the camera (glossy photo paper):** a cheap view-dependent term in the paper/tape shader, `spec = pow(max(dot(reflect(-V,N), Ldir),0.), 40.) * 0.15`, with `Ldir` fixed toward the nearest spot. Or a matcap texture on the tape (`MeshMatcapMaterial`, one draw).
  - If you want a glossy-print highlight over the photo itself, make it a **separate additive transparent quad** above the photo with an animated gradient driven by the camera position. It is visibly "light on the print" rather than a change to the photo, and it is easy to turn off. Keep the intensity low (≤ 0.08).
- **Gaffer tape:** 4 small quads per poster at the corners, rotated ±30–50°, about 5 × 2.5 cm.
  - Each overlaps paper and wall, so the tape sits 1 mm above the paper.
  - Texture: a small 256² tileable fabric/cloth weave plus torn ends via alpha (cut-out ragged short edges). Color near black (#111–#1a1a1a), `MeshStandardMaterial` with `roughness` about 0.55 (gaffer is semi-matte with slight sheen), or `MeshMatcapMaterial` with a dark satin matcap for mobile.
  - Randomize rotation, length and a slight UV offset per instance so it does not look templated.
  - **Draw calls:** all tape across all posters goes in **one `InstancedMesh`** (1 draw call).
- **Shadow and AO around the poster:** do not use real shadow maps for this.
  - Use a **soft shadow quad** behind each poster, slightly larger (about 4–8 cm margin), with a pre-blurred radial or rounded-rect gradient texture (a black alpha falloff), `depthWrite:false`, multiply or normal blending, opacity about 0.35. Offset it downward a little (1–2 cm) to match the spots above.
  - The tape gets a tiny shadow sliver too, or skip it.
  - Make these quads an `InstancedMesh` as well (1 draw call), or bake the darkening directly into the wall texture/lightmap if the poster positions are fixed.
- **Draw-call total for posters:**
  - Merged path: photos (N meshes, or one atlas-merged mesh), paper borders (1 instanced), tape (1 instanced), shadows (1 instanced). That gives about N + 3. With 20–30 photos, that is about 25–33 calls.
  - Cheaper: a texture atlas with a custom shader, so all photos are one draw. Keep each photo at its own resolution if the art direction needs full sharpness (atlas size limits on mobile: 4096² is generally safe).
- **Lighting answer:** yes, keep the photo unlit and exact (Basic, toneMapped false, sRGB). The border, tape and shadow are lit or shaded, so the poster still "sits" in the dark space.
  - To make the photo feel lit by the spot without altering colors, darken **around** it (the wall falloff and shadow quad), not the photo itself.
  - The only acceptable change to the photo is a global brightness the photographer approves. By default, there is none.

### Gaps
- I found no specific three.js tutorial or demo for "taped paper poster with gaffer tape"; the construction above comes from general three.js practice, not a cited source.
- I found no source quantifying the visual difference of `toneMapped=false` under ACES vs `NoToneMapping` on photos; verify by rendering a test photo next to the original image.

## 4. Good examples and demos (gallery corridors, posters, reflective floors, mobile)

### Takeaway
I found no single canonical "mobile reflective-floor photo corridor" demo. The closest references are the Codrops mirror tutorial (layers trick), the drei MeshReflectorMaterial gallery prototypes (CodeSandbox), the official `webgl_mirror` examples, and a few community galleries. None document mobile frame rates.

### Cited Findings
- **drei reflector gallery prototypes:** CodeSandbox gallery prototypes with the drei reflector: [reflector variant](https://codesandbox.io/s/reflector-variant-e6bjz?file=/src/App.js), [forked gallery prototype](https://codesandbox.io/s/reflector-variant-forked-lx2h8?file=/src/App.js). Linked in [Blurred reflections thread](https://discourse.threejs.org/t/blurred-reflections/33296).
- **Official mirror examples:** `webgl_mirror` and `webgl_mirror_nodes` (blur supported in the nodes version). — [three.js examples](https://threejs.org/examples/?q=mirror#webgl_mirror_nodes)
- **Codrops mirrors in R3F/three.js:** cubeCamera plus layers to hide fake copies from the main view. — [Codrops 2020](https://tympanus.net/codrops/2020/09/30/creating-mirrors-in-react-three-fiber-and-three-js/)
- **Codrops scroll-reactive 3D gallery (March 2026):** vanilla three.js with Vite. Gallery structure only, no reflective floor. — [Codrops 2026](https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/)
- **Framer community walkthrough aisle:** vanilla three.js plus GLSL, a "3D media walkthrough aisle" with real-time planar floor reflections. A demo post with no code. — [Framer community post](https://www.framer.com/community/posts/7ot7bo1eVjVCeeBoBzfb4K/)
- **mesh3d.gallery:** a curated directory of WebGL/three.js sites tagged by tech, useful for finding Awwwards-level corridor galleries. — [mesh3d on Peerlist](https://peerlist.io/broncekandrej/project/mesh3d--curated-3d--interactive-websites)
- **Open-source three.js art galleries** (structure references): [theringsofsaturn/3D-art-gallery-threejs](https://www.github.com/theringsofsaturn/3D-art-gallery-threejs), [vogdb/3D-art-gallery](https://github.com/vogdb/3D-art-gallery)

### Inferences
- Most polished web galleries that look reflective on phones appear to use either a low-res blurred planar reflector or baked/fake glows. For a fixed corridor with static lights, the fake-streak plus mirrored-proxy route fits a 100-draw-call budget best. Keep a real reflector as a desktop-only enhancement.

### Gaps
- I found no Awwwards-listed corridor gallery with documented mobile performance numbers. The Codrops Crosswire reflective-grid article was blocked (403).
