import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Foto 2.5D: a foto e o seu mapa de profundidade (scripts/prep.py, Depth Anything V2) num shader.
// A câmera não move a foto inteira: cada pixel anda conforme a distância (perto anda mais), então o
// artista descola do fundo. Tudo é função do frame: o mesmo resultado no preview e no render.

export type Move = 'push' | 'pull' | 'panRight' | 'panLeft' | 'tiltUp' | 'tiltDown' | 'drift';

type Cam = {zoom: [number, number]; pan: [[number, number], [number, number]]; par: [[number, number], [number, number]]; dolly: [number, number]};

// Valores por segundo, pra a velocidade não depender da duração do plano. Base da Apple (empurra ~4,5%/s,
// panorâmica ~2,6%/s) com a parallax por cima, que é o que dá o volume.
const perSec = (m: Move): {zoom: number; pan: [number, number]; par: [number, number]; dolly: number; base: number} => {
  switch (m) {
    case 'push': return {zoom: 0.06, pan: [0, 0], par: [0, 0.004], dolly: 0.05, base: 1.06};
    case 'pull': return {zoom: -0.06, pan: [0, 0], par: [0, -0.004], dolly: -0.05, base: 1.2};
    case 'panRight': return {zoom: 0.015, pan: [0.018, 0], par: [0.016, 0], dolly: 0.01, base: 1.12};
    case 'panLeft': return {zoom: 0.015, pan: [-0.018, 0], par: [-0.016, 0], dolly: 0.01, base: 1.12};
    case 'tiltUp': return {zoom: 0.02, pan: [0, -0.016], par: [0, -0.014], dolly: 0.01, base: 1.12};
    case 'tiltDown': return {zoom: 0.02, pan: [0, 0.016], par: [0, 0.014], dolly: 0.01, base: 1.12};
    case 'drift': return {zoom: 0.02, pan: [0.004, 0], par: [0.006, 0.002], dolly: 0.015, base: 1.08};
  }
};

const camFor = (m: Move, seconds: number): Cam => {
  const p = perSec(m);
  const half = seconds / 2;
  const z0 = p.base;
  const z1 = Math.max(1.04, p.base + p.zoom * seconds);
  return {
    zoom: [z0, z1],
    pan: [[-p.pan[0] * half, -p.pan[1] * half], [p.pan[0] * half, p.pan[1] * half]],
    par: [[-p.par[0] * half, -p.par[1] * half], [p.par[0] * half, p.par[1] * half]],
    dolly: m === 'pull' ? [-p.dolly * seconds, 0] : [0, p.dolly * seconds],
  };
};

const VERT = `attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;v.y=1.-v.y;gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision highp float;varying vec2 v;
uniform sampler2D uImg,uDep;uniform vec2 uCover,uPan,uPar;uniform float uZoom,uDolly,uFocus,uDim;
void main(){
  vec2 uv=(v-.5)*uCover/uZoom+.5+uPan;
  vec2 p=uv;
  for(int i=0;i<8;i++){float d=texture2D(uDep,p).r-uFocus;p=uv-uPar*d-(uv-.5)*uDolly*d;}
  vec3 c=texture2D(uImg,clamp(p,.001,.999)).rgb;
  gl_FragColor=vec4(c*(1.-uDim),1.);
}`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`não carregou ${src}`));
    im.src = src;
  });

type Props = {
  name: string;
  move: Move;
  /** duração do plano em frames (define o caminho da câmera) */
  duration: number;
  /** escurece a foto (0..1), pra texto por cima */
  dim?: number;
  /** profundidade que fica parada (0 = fundo, 1 = perto). Padrão: meio */
  focus?: number;
};

export const DepthPhoto: React.FC<Props> = ({name, move, duration, dim = 0, focus = 0.5}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<{ctx: WebGLRenderingContext; prog: WebGLProgram; aspect: number} | null>(null);
  const [handle] = useState(() => delayRender(`foto 2.5D ${name}`));
  const [ready, setReady] = useState(false);
  const released = useRef(false);

  useEffect(() => {
    let alive = true;
    Promise.all([loadImage(staticFile(`img/${name}.jpg`)), loadImage(staticFile(`depth/${name}.png`))])
      .then(([img, dep]) => {
        if (!alive || !canvas.current) return;
        const ctx = canvas.current.getContext('webgl', {preserveDrawingBuffer: true, antialias: false});
        if (!ctx) throw new Error('sem WebGL');
        const sh = (type: number, src: string) => {
          const s = ctx.createShader(type)!;
          ctx.shaderSource(s, src);
          ctx.compileShader(s);
          if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(s) ?? 'shader');
          return s;
        };
        const prog = ctx.createProgram()!;
        ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, VERT));
        ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, FRAG));
        ctx.linkProgram(prog);
        ctx.useProgram(prog);
        const buf = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
        const a = ctx.getAttribLocation(prog, 'a');
        ctx.enableVertexAttribArray(a);
        ctx.vertexAttribPointer(a, 2, ctx.FLOAT, false, 0, 0);
        [img, dep].forEach((src, unit) => {
          const tex = ctx.createTexture();
          ctx.activeTexture(ctx.TEXTURE0 + unit);
          ctx.bindTexture(ctx.TEXTURE_2D, tex);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
          ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, ctx.RGB, ctx.UNSIGNED_BYTE, src);
        });
        ctx.uniform1i(ctx.getUniformLocation(prog, 'uImg'), 0);
        ctx.uniform1i(ctx.getUniformLocation(prog, 'uDep'), 1);
        gl.current = {ctx, prog, aspect: img.width / img.height};
        setReady(true);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [name]);

  useLayoutEffect(() => {
    const g = gl.current;
    if (!ready || !g) return;
    const {ctx, prog, aspect} = g;
    const cam = camFor(move, duration / fps);
    const t = interpolate(frame, [0, duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const lerp = (r: [number, number]) => r[0] + (r[1] - r[0]) * t;
    const lerp2 = (r: [[number, number], [number, number]]) => [lerp([r[0][0], r[1][0]]), lerp([r[0][1], r[1][1]])];
    const frameAspect = width / height;
    const cover = aspect > frameAspect ? [frameAspect / aspect, 1] : [1, aspect / frameAspect];
    const u = (n: string) => ctx.getUniformLocation(prog, n);
    ctx.viewport(0, 0, width, height);
    ctx.uniform2f(u('uCover'), cover[0], cover[1]);
    ctx.uniform1f(u('uZoom'), lerp(cam.zoom));
    const pan = lerp2(cam.pan);
    const par = lerp2(cam.par);
    ctx.uniform2f(u('uPan'), pan[0], pan[1]);
    ctx.uniform2f(u('uPar'), par[0], par[1]);
    ctx.uniform1f(u('uDolly'), lerp(cam.dolly));
    ctx.uniform1f(u('uFocus'), focus);
    ctx.uniform1f(u('uDim'), dim);
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [frame, ready, move, duration, fps, width, height, dim, focus, handle]);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
