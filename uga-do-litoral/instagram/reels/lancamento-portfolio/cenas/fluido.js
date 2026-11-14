// O fluido do fundo do site (site-lab/js/liquid.js, LiquidEther adaptado de React Bits, David Haz;
// licença em site-lab/vendor/LICENSE.react-bits.md), reescrito pra rodar quadro a quadro:
// passo fixo de 1/30 s, sem relógio, sem mouse, sem acaso. Os shaders são os do site; o que muda é
// quem empurra (o mesmo "passeio" automático do site, com fase fixa) e o tempo (contado em quadros).
// Mesmo número de passos = mesma imagem.

const PRESSURE_STEPS = 32;
const PALETTE_SIZE = 256;

const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
out vec2 vUv;
void main() {
  vUv = corners[gl_VertexID] * 0.5 + 0.5;
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;
const HEADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uTexel;
`;
const SPLAT = `${HEADER}
uniform sampler2D uVelocity; uniform vec2 uSize; uniform vec4 uSegment; uniform vec2 uForce; uniform float uRadius;
float segment(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0); return length(p - a - ab * t); }
void main() {
  float d = segment(vUv * uSize, uSegment.xy, uSegment.zw) / uRadius;
  fragColor = vec4(texture(uVelocity, vUv).xy + uForce * exp(-d * d * 6.0), 0.0, 1.0);
}`;
const SMOOTH = `${HEADER}
uniform sampler2D uVelocity; uniform float uAmount;
void main() {
  vec2 center = texture(uVelocity, vUv).xy;
  vec2 around = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).xy + texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).xy +
    texture(uVelocity, vUv - vec2(0.0, uTexel.y)).xy + texture(uVelocity, vUv + vec2(0.0, uTexel.y)).xy;
  fragColor = vec4(mix(center, around * 0.25, uAmount), 0.0, 1.0);
}`;
const DIVERGENCE = `${HEADER}
uniform sampler2D uVelocity;
void main() {
  vec2 center = texture(uVelocity, vUv).xy;
  float left = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x; float right = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float down = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y; float up = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  if (vUv.x - uTexel.x < 0.0) left = 0.0; if (vUv.x + uTexel.x > 1.0) right = 0.0;
  if (vUv.y - uTexel.y < 0.0) down = 0.0; if (vUv.y + uTexel.y > 1.0) up = 0.0;
  fragColor = vec4(0.5 * (right - left + up - down), 0.0, 0.0, 1.0);
}`;
const EDGE = `
float pressureAt(sampler2D field, vec2 uv) { vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0)); return texture(field, uv).x * inside.x * inside.y; }
`;
const PRESSURE = `${HEADER}
uniform sampler2D uPressure; uniform sampler2D uDivergence;
${EDGE}
void main() {
  vec2 reach = uTexel * 2.0;
  float sum = pressureAt(uPressure, vUv - vec2(reach.x, 0.0)) + pressureAt(uPressure, vUv + vec2(reach.x, 0.0)) +
    pressureAt(uPressure, vUv - vec2(0.0, reach.y)) + pressureAt(uPressure, vUv + vec2(0.0, reach.y));
  fragColor = vec4(sum * 0.25 - texture(uDivergence, vUv).x, 0.0, 0.0, 1.0);
}`;
const PROJECT = `${HEADER}
uniform sampler2D uPressure; uniform sampler2D uVelocity;
${EDGE}
void main() {
  float left = pressureAt(uPressure, vUv - vec2(uTexel.x, 0.0)); float right = pressureAt(uPressure, vUv + vec2(uTexel.x, 0.0));
  float down = pressureAt(uPressure, vUv - vec2(0.0, uTexel.y)); float up = pressureAt(uPressure, vUv + vec2(0.0, uTexel.y));
  fragColor = vec4(texture(uVelocity, vUv).xy - 0.5 * vec2(right - left, up - down), 0.0, 1.0);
}`;
const ADVECT = `${HEADER}
uniform sampler2D uVelocity; uniform vec2 uStep; uniform float uKeep;
vec2 at(vec2 uv) { vec2 outside = max(-uv, uv - 1.0) / uTexel; float open = clamp(1.0 - max(outside.x, outside.y) / 1.5, 0.0, 1.0); return texture(uVelocity, uv).xy * open; }
void main() {
  vec2 start = vUv - at(vUv) * uStep; vec2 back = start + at(start) * uStep;
  vec2 corrected = vUv - (back - vUv) * 0.5; vec2 origin = corrected - at(corrected) * uStep;
  vec2 a = at(origin + vec2(-0.5, -0.5) * uTexel); vec2 b = at(origin + vec2(0.5, -0.5) * uTexel);
  vec2 c = at(origin + vec2(-0.5, 0.5) * uTexel); vec2 d = at(origin + vec2(0.5, 0.5) * uTexel);
  fragColor = vec4(clamp(at(origin), min(min(a, b), min(c, d)), max(max(a, b), max(c, d))) * uKeep, 0.0, 1.0);
}`;
const DISPLAY = `${HEADER}
uniform sampler2D uVelocity; uniform sampler2D uPalette; uniform vec2 uSimSize; uniform float uSpeedScale; uniform float uGain;
vec2 velocityAt(vec2 uv) {
  vec2 st = uv * uSimSize - 0.5; vec2 i = floor(st); vec2 f = st - i; vec2 f2 = f * f; vec2 f3 = f2 * f;
  vec2 w0 = (-f3 + 3.0 * f2 - 3.0 * f + 1.0) / 6.0; vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
  vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0; vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1; vec2 g1 = w2 + w3; vec2 h0 = (i - 0.5 + w1 / g0) / uSimSize; vec2 h1 = (i + 1.5 + w3 / g1) / uSimSize;
  vec2 a = texture(uVelocity, vec2(h0.x, h0.y)).xy; vec2 b = texture(uVelocity, vec2(h1.x, h0.y)).xy;
  vec2 c = texture(uVelocity, vec2(h0.x, h1.y)).xy; vec2 d = texture(uVelocity, vec2(h1.x, h1.y)).xy;
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}
void main() {
  float speed = length(velocityAt(vUv)) * uSpeedScale;
  float level = speed < 0.75 ? speed : 0.75 + 0.25 * tanh((speed - 0.75) * 4.0);
  vec3 ink = texture(uPalette, vec2(level, 0.5)).rgb;
  float alpha = level;
  float hot = 1.0 - exp(-max(speed - 0.75, 0.0) * 1.2);
  ink = mix(ink, min(ink * 1.8 + 0.06, vec3(1.0)), hot);
  vec3 color = ink * alpha * uGain;
  float coverage = alpha * uGain;
  float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  color += (grain - 0.5) / 255.0 * step(0.002, coverage);
  fragColor = vec4(clamp(color, vec3(0.0), vec3(coverage)), coverage);
}`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const keepFor = (persistence, dt) => Math.pow(0.5, dt / (0.35 + persistence * persistence * 12));
const toLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function buildPalette(hexes) {
  const values = hexes.map(h => [0, 2, 4].map(i => toLinear(parseInt(h.slice(1 + i, 3 + i), 16) / 255)));
  const data = new Uint8Array(PALETTE_SIZE * 4);
  for (let index = 0; index < PALETTE_SIZE; index++) {
    const t = clamp((index / (PALETTE_SIZE - 1)) * values.length - 0.5, 0, values.length - 1);
    const from = Math.min(Math.floor(t), Math.max(values.length - 2, 0));
    const to = Math.min(from + 1, values.length - 1);
    const k = t - from, e = k * k * (3 - 2 * k);
    for (let ch = 0; ch < 3; ch++) data[index * 4 + ch] = Math.round(clamp(values[from][ch] + (values[to][ch] - values[from][ch]) * e, 0, 1) * 255);
    data[index * 4 + 3] = 255;
  }
  return data;
}

/**
 * cssW/cssH: o tamanho "de tela" que a simulação enxerga (o site mede em px CSS; aqui 540 × 960, o celular).
 * O canvas em si pode ter outro tamanho (1080 × 1920).
 */
export function criarFluido(canvas, opcoes = {}) {
  const s = Object.assign({
    colors: ['#ff0000', '#ff0000', '#ffffff'], intensity: .75, force: 12, radius: 100, persistence: .75,
    viscosity: .25, resolution: .5, autoSpeed: .5, autoIntensity: 2.2, fase: 37.0, ganho: 1, cssW: 540, cssH: 960
  }, opcoes);
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('sem webgl2');
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) throw new Error('sem float buffer');

  const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const link = frag => {
    const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { program: p, uniforms: u };
  };
  const P = { splat: link(SPLAT), smooth: link(SMOOTH), divergence: link(DIVERGENCE), pressure: link(PRESSURE), project: link(PROJECT), advect: link(ADVECT), display: link(DISPLAY) };
  const vao = gl.createVertexArray();

  const pal = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pal);
  [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PALETTE_SIZE, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildPalette(s.colors));

  const size = { width: s.cssW, height: s.cssH };
  const base = s.resolution * 0.5;
  const scale = base * Math.min(1, Math.sqrt(100000 / (size.width * size.height * base * base)));
  const grid = { width: clamp(Math.round(size.width * scale), 16, 1024), height: clamp(Math.round(size.height * scale), 16, 1024) };
  const makeTarget = ch => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, ch === 2 ? gl.RG16F : gl.R16F, grid.width, grid.height, 0, ch === 2 ? gl.RG : gl.RED, gl.HALF_FLOAT, null);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { texture: tex, framebuffer: fb };
  };
  const T = { velocity: makeTarget(2), velocityNext: makeTarget(2), divergence: makeTarget(1), pressure: makeTarget(1), pressureNext: makeTarget(1) };
  const swap = (a, b) => { const h = T[a]; T[a] = T[b]; T[b] = h; };
  const bind = (unit, tex, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };
  const run = (e, out, fn) => { gl.useProgram(e.program); gl.uniform2f(e.uniforms.uTexel, 1 / grid.width, 1 / grid.height); fn(e.uniforms); gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.framebuffer : null); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  const DT = 1 / 30;
  let passos = 0, auto;
  function zerar() {
    for (const k of Object.keys(T)) { gl.bindFramebuffer(gl.FRAMEBUFFER, T[k].framebuffer); gl.viewport(0, 0, grid.width, grid.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    passos = 0;
    auto = { phase: s.fase, x: 0, y: 0, ready: false, ramp: 0 };
  }
  const wander = t => {
    const x = 0.62 * Math.sin(t * 0.83 + 1.3) + 0.38 * Math.sin(t * 1.71 + 0.4);
    const y = 0.6 * Math.sin(t * 1.07 + 2.1) + 0.4 * Math.cos(t * 0.61 + 0.7);
    return [(0.5 + 0.41 * x) * size.width, (0.5 + 0.41 * y) * size.height];
  };
  function passo() {
    const dt = DT;
    gl.bindVertexArray(vao); gl.disable(gl.BLEND);
    gl.viewport(0, 0, grid.width, grid.height);
    auto.ramp = Math.min(1, auto.ramp + dt / 0.8);
    auto.phase += dt * s.autoSpeed * 1.6;
    const spot = wander(auto.phase);
    if (auto.ready) {
      const gust = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(auto.phase * 2.6), 2);
      const sc = (s.force / 20) * 0.45 * s.autoIntensity * auto.ramp * auto.ramp * gust * Math.min(1, dt * 60);
      const a = [auto.x, auto.y], b = spot;
      run(P.splat, T.velocityNext, u => {
        bind(0, T.velocity.texture, u.uVelocity);
        gl.uniform2f(u.uSize, size.width, size.height);
        gl.uniform4f(u.uSegment, a[0], a[1], b[0], b[1]);
        gl.uniform2f(u.uForce, clamp(((b[0] - a[0]) / dt) * sc, -6000, 6000), clamp(((b[1] - a[1]) / dt) * sc, -6000, 6000));
        gl.uniform1f(u.uRadius, s.radius);
      });
      swap('velocity', 'velocityNext');
    }
    auto.x = spot[0]; auto.y = spot[1]; auto.ready = true;
    const passes = Math.ceil(s.viscosity * 4);
    for (let k = 0; k < passes; k++) {
      run(P.smooth, T.velocityNext, u => { bind(0, T.velocity.texture, u.uVelocity); gl.uniform1f(u.uAmount, Math.min(1, s.viscosity * 4 - k) * 0.9); });
      swap('velocity', 'velocityNext');
    }
    run(P.divergence, T.divergence, u => bind(0, T.velocity.texture, u.uVelocity));
    for (let k = 0; k < PRESSURE_STEPS; k++) {
      run(P.pressure, T.pressureNext, u => { bind(0, T.pressure.texture, u.uPressure); bind(1, T.divergence.texture, u.uDivergence); });
      swap('pressure', 'pressureNext');
    }
    run(P.project, T.velocityNext, u => { bind(0, T.pressure.texture, u.uPressure); bind(1, T.velocity.texture, u.uVelocity); });
    swap('velocity', 'velocityNext');
    run(P.advect, T.velocityNext, u => {
      bind(0, T.velocity.texture, u.uVelocity);
      gl.uniform2f(u.uStep, dt / size.width, dt / size.height);
      gl.uniform1f(u.uKeep, keepFor(s.persistence, dt));
    });
    swap('velocity', 'velocityNext');
    passos++;
  }
  function mostrar() {
    gl.bindVertexArray(vao); gl.disable(gl.BLEND);
    gl.viewport(0, 0, canvas.width, canvas.height);
    run(P.display, null, u => {
      bind(0, T.velocity.texture, u.uVelocity); bind(1, pal, u.uPalette);
      gl.uniform2f(u.uSimSize, grid.width, grid.height);
      gl.uniform1f(u.uSpeedScale, (1.25 * s.intensity) / (0.84 * Math.max(size.width, size.height)));
      gl.uniform1f(u.uGain, s.ganho);
    });
    gl.finish();
  }
  zerar();
  /** deixa a simulação exatamente em `alvo` passos (volta do zero se precisar) e desenha */
  function irPara(alvo) {
    if (alvo < passos) zerar();
    while (passos < alvo) passo();
    mostrar();
  }
  return { irPara, grid };
}
