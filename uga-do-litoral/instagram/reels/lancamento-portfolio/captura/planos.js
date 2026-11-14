// Os planos do showreel, declarativos: duração, passes, pose da câmera pelo tempo local t (s) e o estado
// da cena. Tempo: tempo.json (30 qps, 134 BPM, batida 0 em 0,218 s). A1 e B1 dividem a mesma câmera
// (travessia), no relógio do filme.
import { lance, U as UU, PRINT_Y, EYE, HALL_HEIGHT } from '/bastidor/plan.js';

const DEG = Math.PI / 180, FPS = 30, BAT = 60 / 134, B0 = .218;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const suave = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = u => (u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
const senoInOut = u => -(Math.cos(Math.PI * clamp(u, 0, 1)) - 1) / 2;
const batida = b => B0 + b * BAT;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

/** interpolação cúbica monótona (Fritsch–Carlson) por chaves [[t, v], ...] */
function pchip(keys) {
  const n = keys.length, t = keys.map(k => k[0]), y = keys.map(k => k[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (t[i + 1] - t[i]));
  m[0] = keys[0][2] ?? d[0]; m[n - 1] = keys[n - 1][2] ?? d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = keys[i][2] ?? (d[i - 1] * d[i] <= 0 ? 0 : (3 * (d[i - 1] + d[i])) / ((2 * d[i] + d[i - 1]) / d[i - 1] + (d[i] + 2 * d[i - 1]) / d[i]));
  return x => {
    if (x <= t[0]) return y[0] + m[0] * (x - t[0]);
    if (x >= t[n - 1]) return y[n - 1] + m[n - 1] * (x - t[n - 1]);
    let i = 0; while (x > t[i + 1]) i++;
    const h = t[i + 1] - t[i], s = (x - t[i]) / h;
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
    return h00 * y[i] + h10 * h * m[i] + h01 * y[i + 1] + h11 * h * m[i + 1];
  };
}
/** spline de Hermite por chaves {t, v, m?}: tangentes internas por diferença central */
function hermite(keys) {
  const n = keys.length;
  const m = keys.map((k, i) => k.m ?? (i === 0 ? (keys[1].v - k.v) / (keys[1].t - k.t) : i === n - 1 ? (k.v - keys[i - 1].v) / (k.t - keys[i - 1].t) : (keys[i + 1].v - keys[i - 1].v) / (keys[i + 1].t - keys[i - 1].t)));
  return x => {
    if (x <= keys[0].t) return keys[0].v; if (x >= keys[n - 1].t) return keys[n - 1].v;
    let i = 0; while (x > keys[i + 1].t) i++;
    const h = keys[i + 1].t - keys[i].t, s = (x - keys[i].t) / h;
    return (2 * s ** 3 - 3 * s ** 2 + 1) * keys[i].v + (s ** 3 - 2 * s ** 2 + s) * h * m[i] + (-2 * s ** 3 + 3 * s ** 2) * keys[i + 1].v + (s ** 3 - s ** 2) * h * m[i + 1];
  };
}
/** integral numérica de f entre a e x (tabela a cada 1/600 s) */
function integral(f, a, b) {
  const h = 1 / 600, n = Math.ceil((b - a) / h) + 1, tab = new Float64Array(n + 1);
  for (let k = 1; k <= n; k++) { const t0 = a + (k - 1) * h; tab[k] = tab[k - 1] + (f(t0) + 4 * f(t0 + h / 2) + f(t0 + h)) * h / 6; }
  return x => { const u = clamp((x - a) / h, 0, n - 1e-9), k = Math.floor(u); return tab[k] + (tab[k + 1] - tab[k]) * (u - k); };
}

export function criarPlanos(c) {
  const { THREE, W, plan } = c;
  const rail = plan.rail, total = rail.total;
  const items = W.prints.items;

  /** trilho com as pontas prolongadas em reta */
  function railX(s) {
    if (s < 0) { const p = rail.at(0); return { x: p.x + p.dx * s, z: p.z + p.dz * s, dx: p.dx, dz: p.dz }; }
    if (s > total) { const p = rail.at(total); return { x: p.x + p.dx * (s - total), z: p.z + p.dz * (s - total), dx: p.dx, dz: p.dz }; }
    return rail.at(s);
  }
  /** o trilho suavizado: média gaussiana de ±R metros (as esquinas ficam mais abertas, a câmera não quebra) */
  function trilhoSuave(s, R = 1.3) {
    let x = 0, z = 0, w = 0;
    for (let k = -8; k <= 8; k++) { const u = k / 8, g = Math.exp(-u * u * 2.5), p = railX(s + u * R); x += p.x * g; z += p.z * g; w += g; }
    return { x: x / w, z: z / w };
  }
  // rumo acumulado ao longo do trilho (sem pulo de ±180°)
  const passoH = .05, rumos = [];
  { let prev = null; for (let s = -40; s <= total + 40; s += passoH) { const p = railX(s); let h = Math.atan2(-p.dx, -p.dz); if (prev !== null) h = prev + wrap(h - prev); rumos.push(h); prev = h; } }
  const rumo = s => { const u = clamp((s + 40) / passoH, 0, rumos.length - 1.001), k = Math.floor(u); return rumos[k] + (rumos[k + 1] - rumos[k]) * (u - k); };
  /** olhar pra um ponto, com o yaw desenrolado perto de uma referência */
  const yawPara = (x, z, tx, tz, ref) => { const y = Math.atan2(-(tx - x), -(tz - z)); return ref + wrap(y - ref); };
  const olhar = (p, alvo, ref = 0) => {
    const dx = alvo.x - p.x, dy = alvo.y - p.y, dz = alvo.z - p.z;
    return { yaw: yawPara(p.x, p.z, alvo.x, alvo.z, ref), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  };
  /** câmera correndo pelo trilho: posição suavizada, olhar adiante, balanço e inclinação na curva */
  function corrida(s, v, { sway = 0, y = EYE, pitch = -.035, La = null } = {}) {
    const p = trilhoSuave(s);
    const q = trilhoSuave(s + (La ?? 2.2 + .42 * v));
    const base = rumo(s);
    const yaw = yawPara(p.x, p.z, q.x, q.z, base) + sway;
    return { x: p.x, y, z: p.z, yaw, pitch, s: clamp(s, 0, total) };
  }
  const comInclinacao = (poseDe, t) => {
    const h = 1 / 120, a = poseDe(t - h), b = poseDe(t + h), p = poseDe(t);
    const taxa = (b.yaw - a.yaw) / (2 * h);
    p.roll = clamp(taxa * .03, -.09, .09);
    return p;
  };

  // ------------------------------------------------ a travessia (A1 do q. 168 ao fim de B1), no relógio do filme
  const TA = 168 / FPS;                    // a câmera pousa na entrada
  const Vtrav = pchip([[TA, .35, 0], [221 / FPS, 3.0], [9.6, 6.6], [11.9, 12.2], [382 / FPS, 14, 0], [16, 14, 0]]);
  const Strav = integral(Vtrav, TA, 16);
  function travessiaSem(T) {
    const s = Strav(T), v = Vtrav(T);
    const amp = (15 - 11 * suave(2, 10, v)) * DEG;
    const sway = amp * Math.sin(2 * Math.PI * (T - TA) / (4 * BAT)) * suave(TA, TA + 1.2, T);
    const p = corrida(s, v, { sway });
    p.y = EYE + .022 * Math.sin(2 * Math.PI * s / 1.6) * suave(.4, 1.6, v) * (1 - suave(4, 8, v));
    p.pitch = -.03 - .015 * Math.sin(2 * Math.PI * (T - TA) / (8 * BAT)) * suave(TA, TA + 1.2, T);
    return p;
  }
  const travessia = T => comInclinacao(travessiaSem, T);

  // ------------------------------------------------ cópias de frente (C2)
  const PORDEM = o => items.find(i => i.p.order === o);
  const FOV_C2 = 62;
  function deFrente(item, D) {
    const p = item.p, f = p.facing;
    return { x: p.x + f[0] * D, y: PRINT_Y, z: p.z + f[1] * D, yaw: Math.atan2(f[0], f[1]), pitch: 0, roll: item.mesh.rotation.z, fov: FOV_C2 };
  }
  function planoC2(ordem) {
    let item;
    return {
      quadros: 18, passes: ['cor', 'fio', 'prof'],
      async preparar(c) { item = PORDEM(ordem); await c.copiaGrande(item); },
      pose: t => deFrente(item ?? PORDEM(ordem), 1.53 - .08 * (t / (18 / FPS))),
      info: () => ({ ordem, foto: PORDEM(ordem).p.photo.src, artista: PORDEM(ordem).p.photo.artist })
    };
  }

  // ------------------------------------------------ o segurança (C5a, B3)
  const pessoa = nome => W.encounters.group.children.find(o => o.name === `pessoa-${nome}`);
  const guardaInfo = () => {
    const g = pessoa('seguranca'); const sG = rail.nearest(g.position.x, g.position.z);
    return { g, sG };
  };

  // ------------------------------------------------ porta do PALCO (C7)
  const door = plan.door, doorYaw = Math.atan2(door.facing[0], door.facing[1]);
  const sPorta = total + (UU - .02);
  const Vc = pchip([[0, 12.5, 0], [1.0, 10], [2.1, 5.0], [80 / FPS, 3.8], [94 / FPS, 8.5], [3.8, 7, 0]]);
  const Sc = integral(Vc, 0, 3.8);
  const T_CRUZA = 96 / FPS;
  const sC7 = sPorta - Sc(T_CRUZA);
  let vazamentos = null;

  const planos = {
    // ============================================================ A1: a planta se desenha, inclina, desce
    A1_planta: (() => {
      const b = plan.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      const T_TOPO = 114 / FPS;
      const topo = t => ({ x: cx, y: 36 - 4 * (t / T_TOPO), z: cz, yaw: -90 * DEG - 6 * DEG * (1 - t / T_TOPO), pitch: -90 * DEG, roll: 0 });
      const fim = travessiaSem(TA), h = 1 / 240;
      const fimV = (k) => (travessiaSem(TA + h)[k] - travessiaSem(TA - h)[k]) / (2 * h);
      const K1 = { x: 10.5, y: 12.5, z: 2.2 }, K2 = { x: .55, y: 4.6, z: 2.7 };
      const o1 = olhar(K1, { x: 13, y: 0, z: -8 }, -60 * DEG), o2 = olhar(K2, { x: 0, y: 1.1, z: -9 }, 0);
      const t1 = 4.55, t2 = 5.15;
      const canal = (k, vTopo, mTopo, v1, v2) => hermite([{ t: T_TOPO, v: vTopo, m: mTopo }, { t: t1, v: v1 }, { t: t2, v: v2 }, { t: TA, v: fim[k], m: fimV(k) }]);
      const top0 = topo(T_TOPO);
      const sw = {
        x: canal('x', top0.x, 0, K1.x, K2.x), y: canal('y', top0.y, -4 / T_TOPO, K1.y, K2.y), z: canal('z', top0.z, 0, K1.z, K2.z),
        yaw: canal('yaw', top0.yaw, 6 * DEG / T_TOPO, o1.yaw, o2.yaw), pitch: canal('pitch', top0.pitch, 0, o1.pitch, o2.pitch)
      };
      // o traço: do começo do trilho (batida 0) até a porta (batida 8)
      const tIni = 7 / FPS, tFim = 112 / FPS;
      const revela = t => (t < tIni ? -1 : lerp(-.5, total + 2.5, lerp(senoInOut((t - tIni) / (tFim - tIni)), (t - tIni) / (tFim - tIni), .55)));
      const quandoRevela = s => { let a = tIni, z = tFim; for (let k = 0; k < 40; k++) { const m = (a + z) / 2; if (revela(m) < s) a = m; else z = m; } return z; };
      // rótulos de cota (lidos do plano)
      const nLances = Math.round((Math.max(...plan.prints.map(p => p.lance)) + 1));
      const ancoraCopia = (lanceN, minAbsZ) => plan.prints.filter(p => p.lance === lanceN).sort((a, b2) => a.z - b2.z)[0];
      const pAla = plan.prints.find(p => p.first && p.lance === 1 && p.z < -12) || ancoraCopia(1);
      const pCop = ancoraCopia(3);
      const rot = [
        { txt: `${plan.alas.length} alas`, a: { x: pAla.x, y: 0, z: pAla.z }, t: quandoRevela(pAla.s) },
        { txt: `${plan.prints.length} cópias`, a: { x: pCop.x, y: 0, z: pCop.z }, t: quandoRevela(pCop.s) },
        { txt: `${Math.round(total)} m`, a: { x: door.x, y: 0, z: door.z }, t: quandoRevela(total - .5) }
      ];
      const xsLances = Array.from({ length: nLances }, (_, i) => lance(i).a[0]);
      const sLances = Array.from({ length: nLances }, (_, i) => rail.nearest(lance(i).a[0], lance(i).a[1]));
      const zCota = b.maxZ + 1.6;
      const fonte = '400 21px Inconsolata, monospace';
      const alfaRot = t => 1 - suave(T_TOPO + .05, T_TOPO + .45, t);
      return {
        quadros: 223, passes: ['fio', 'prof'], preRolagem: .1,
        info: () => ({ rotulos: rot.map(r => r.txt).concat(`${nLances} lances`), total, alas: plan.alas.length, copias: plan.prints.length }),
        pose(t) {
          if (t <= T_TOPO) return topo(t);
          if (t < TA) return { x: sw.x(t), y: sw.y(t), z: sw.z(t), yaw: sw.yaw(t), pitch: sw.pitch(t), roll: 0 };
          return travessia(t);
        },
        antes(t, c, pose) {
          c.paredes(suave(T_TOPO + .1, 5.25, t));
          const teto = c.teto();
          teto.visible = pose.y < HALL_HEIGHT - .04;
          c.UT.uGanho.value = suave(0, 1, (HALL_HEIGHT - .04 - pose.y) / 1.3);
          c.U.uRevela.value = revela(t);
          c.U.uPonta.value = 1.4 * (1 - suave(tFim - .1, tFim + .25, t)) * (t >= tIni ? 1 : 0);
          // de cima, tudo está longe: a linha só perde força depois que a câmera desce
          const k = suave(T_TOPO, TA, t);
          c.U.uPerto.value = lerp(60, 6, k); c.U.uLonge.value = lerp(120, 32, k);
          c.U.uLetreiro.value = suave(T_TOPO + .3, T_TOPO + 1.2, t);
          c.camera.far = 200;
        },
        sobreposicao(ctx, t, c) {
          const A = alfaRot(t);
          if (A <= 0 || t < tIni) return;
          ctx.save();
          ctx.font = fonte; ctx.textBaseline = 'alphabetic';
          const cor = a => `rgba(255,255,255,${(a * A).toFixed(3)})`;
          const digitado = (txt, t0) => txt.slice(0, clamp(Math.floor((t - t0) * FPS / 1.4), 0, txt.length));
          // cota dos lances: linha ao lado da planta, um tique por lance, cresce com o traço
          const rv = revela(t);
          let ultimo = -1; sLances.forEach((s, i) => { if (rv >= s) ultimo = i; });
          if (ultimo >= 0) {
            const p0 = c.projetar(xsLances[0], 0, zCota), p1 = c.projetar(xsLances[ultimo], 0, zCota);
            ctx.strokeStyle = cor(.9); ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
            for (let i = 0; i <= ultimo; i++) {
              const a = c.projetar(xsLances[i], 0, zCota - .45), q = c.projetar(xsLances[i], 0, zCota + .45);
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            }
            if (ultimo >= 3) {
              const tTxt = quandoRevela(sLances[3]);
              const m = c.projetar((xsLances[0] + xsLances[nLances - 1]) / 2, 0, zCota + .75);
              ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
              ctx.fillStyle = cor(1); ctx.fillText(digitado(`${nLances} lances`, tTxt), 0, 0); ctx.restore();
            }
          }
          // chamadas: ponto na planta, linha até a margem, texto em cima da linha
          for (const r of rot) {
            if (t < r.t) continue;
            const a = c.projetar(r.a.x, r.a.y, r.a.z);
            const u = clamp((t - r.t) * FPS / 6, 0, 1);
            const xm = 34, xEnd = lerp(a.x, xm, easeInOut(u));
            ctx.strokeStyle = cor(.9); ctx.fillStyle = cor(1); ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.arc(a.x, a.y, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(xEnd, a.y); ctx.stroke();
            if (u >= 1) { ctx.textAlign = 'left'; ctx.fillText(digitado(r.txt, r.t + 6 / FPS), xm, a.y - 9); }
          }
          ctx.restore();
        },
        ganhoFio: t => (t < tIni - 1e-6 ? 0 : 1)
      };
    })(),

    // ============================================================ B1: a mesma câmera segue, acelerando
    B1_travessia: {
      quadros: 217, passes: ['cor', 'fio', 'prof'],
      pose: t => travessia(221 / FPS + t),
      borrao: n => n >= 108,
      info: () => ({ s_inicio: Strav(221 / FPS), s_fim: Strav(437 / FPS), v_inicio: Vtrav(221 / FPS), v_fim: Vtrav(437 / FPS) })
    },

    // ============================================================ C7: corrida até a porta, ela abre, escuro
    C7_porta: {
      quadros: 111, passes: ['cor', 'fio', 'prof'],
      borrao: () => true,
      pose(t) {
        const f = T => {
          const s = sC7 + Sc(T), v = Vc(T);
          const p = corrida(s, v, { La: 2.5 + .45 * v });
          p.y = lerp(EYE, 1.42, suave(.6, 2.4, T)) + .012 * Math.sin(2 * Math.PI * s / 1.7) * (1 - suave(.5, 1.5, T));
          p.pitch = lerp(-.03, .05, suave(1.0, 2.6, T));
          return p;
        };
        return comInclinacao(f, t);
      },
      preparar(c) {
        // atrás das folhas: o escuro do palco (no motor seria o clarão branco, que aqui é do laboratório)
        c.porta.stage.material = new THREE.MeshBasicMaterial({ color: 0x1c1712, fog: false }); // penumbra quente: as folhas leem em silhueta
        vazamentos = [];
        const side = [door.facing[1], -door.facing[0]];
        c.W.dressing.group.traverse(o => {
          if (!o.isMesh || o.material.blending !== THREE.AdditiveBlending || o.material.fog !== false) return;
          const dx = o.position.x - door.x, dz = o.position.z - door.z;
          if (Math.abs(dx * side[0] + dz * side[1]) < .6 && Math.hypot(dx, dz) < 1.0) vazamentos.push(o.material);
        });
      },
      depois(t, c) {
        const u = clamp((t - 80 / FPS) / (14 / FPS), 0, 1), e = easeInOut(u);
        for (const l of c.porta.leaves) l.pivot.rotation.y = doorYaw + l.s * 1.75 * e; // abre pra quem chega (no motor ela abre pro palco, escondida pelo clarao)
        for (const m of vazamentos) m.opacity *= 1 - suave(.2, .9, u);
        c.porta.stage.visible = u > 0;
      },
      ganho: t => 1 - suave(98 / FPS, 106 / FPS, t),
      info: () => ({ s_inicio: sC7, metros_ate_porta: sPorta - sC7, folhas_abrem_q: 80, abertas_q: 94, cruza_q: 96, preto_q: 106 })
    },

    C2a: planoC2(3), C2b: planoC2(19), C2c: planoC2(0), C2d: planoC2(39), C2f: planoC2(42), C2g: planoC2(106),

    // ============================================================ C2e: mergulho numa cópia até cobrir o quadro
    C2e_mergulho: (() => {
      const ordem = 55; let item, Dc, glowK = -1, pools = null;
      return {
        quadros: 31, passes: ['cor', 'fio', 'prof'],
        async preparar(c) {
          item = PORDEM(ordem); await c.copiaGrande(item);
          const tanH = Math.tan(FOV_C2 / 2 * DEG), asp = 1080 / 1920;
          Dc = Math.min(item.h / (2 * tanH), item.w / (2 * tanH * asp)) * .975;
          glowK = items.indexOf(item);
          c.W.dressing.group.traverse(o => { if (o.isInstancedMesh && o.count === items.length && o.material.blending === THREE.AdditiveBlending && o.geometry.parameters?.height === 2.6) pools = o; });
        },
        pose(t) {
          const u = clamp(t / (26 / FPS), 0, 1);
          return deFrente(item, lerp(1.53, Dc, u ** 3));
        },
        depois(t) {
          if (!pools) return;
          const k = 1 - suave(.45, .85, t);
          pools.setColorAt(glowK, new THREE.Color(k, k, k)); pools.instanceColor.needsUpdate = true;
        },
        info: () => ({ ordem, foto: item.p.photo.src.replace('./', 'uga-do-litoral/portfolio/site-lab/'), artista: item.p.photo.artist, cobre_no_quadro: 26,
          enquadramento: 'cover central: a altura inteira da foto ocupa os 1920 px, corte nas laterais; a luz de parede da copia some entre os quadros 14 e 25 pra a cor bater com o arquivo' })
      };
    })(),

    // ============================================================ C5: vida do bastidor
    C5a_seguranca: (() => {
      let G, sG;
      return {
        quadros: 31, passes: ['cor', 'fio', 'prof'],
        preparar() { ({ g: G, sG } = guardaInfo()); },
        pose(t) {
          const u = t / (31 / FPS);
          const s = lerp(sG - 4.9, sG - 2.8, 1 - (1 - u) ** 1.6);
          const p = trilhoSuave(s);
          const r = railX(s), side = [r.dz, -r.dx], lat = lerp(-.45, .25, u);
          const pos = { x: p.x + side[0] * lat, y: 1.36, z: p.z + side[1] * lat };
          const o = olhar(pos, { x: G.position.x, y: 1.3, z: G.position.z }, rumo(s));
          return { ...pos, ...o, s };
        },
        info: () => ({ s_seguranca: sG })
      };
    })(),

    B3_vulto: (() => {
      let G, sG;
      return {
        quadros: 18, passes: ['cor', 'prof'], borrao: () => true,
        preparar() { ({ g: G, sG } = guardaInfo()); },
        // travelling lateral rápido na frente dele: o vulto atravessa o quadro em contraluz, com rastro
        pose(t) {
          const u = t / (18 / FPS);
          const s = sG - 3.3;
          const p0 = trilhoSuave(s);
          let fx = G.position.x - p0.x, fz = G.position.z - p0.z; const n = Math.hypot(fx, fz); fx /= n; fz /= n;
          const side = [fz, -fx], lat = lerp(1.15, -1.15, u), D = 3.2;
          const c0 = { x: G.position.x - fx * D, y: 1.45, z: G.position.z - fz * D };
          const pos = { x: c0.x + side[0] * lat, y: 1.45, z: c0.z + side[1] * lat };
          const o = olhar(c0, { x: G.position.x, y: 1.3, z: G.position.z }, rumo(s));
          return { ...pos, yaw: o.yaw + lerp(4, -4, u) * DEG, pitch: o.pitch, roll: lerp(-.03, .03, u), s };
        }
      };
    })(),

    C5b_projecao: (() => {
      const sc = plan.screens.find(x => x.lance === 5) || plan.screens[0]; // RYU: vertical e sem legenda queimada (o FKTOUR tem)
      const f = sc.facing, side = [f[1], -f[0]];
      const item = W.projections.screens.find(x => x.sc === sc);
      return {
        quadros: 31, passes: ['cor', 'fio', 'prof'], filmeInicio: { [sc.lance]: 1.2 },
        pose(t) {
          const u = t / (31 / FPS);
          const D = lerp(3.9, 3.4, u), lat = lerp(-.8, .7, easeInOut(u) * .4 + u * .6);
          const pos = { x: sc.x + f[0] * D + side[0] * lat, y: 1.25, z: sc.z + f[1] * D + side[1] * lat };
          const o = olhar(pos, { x: sc.x + side[0] * lat * .35, y: item.cy + .45, z: sc.z + side[1] * lat * .35 }, Math.atan2(f[0], f[1]));
          return { ...pos, ...o, roll: lerp(-.025, .02, u), s: sc.s - 4 };
        },
        info: () => ({ filme: sc.film.title, lance: sc.lance })
      };
    })(),

    C5c_camarim: (() => {
      const k = 1, L = lance(k), P = [lance(k).b, lance(k + 1).a];
      const mid = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2], dp = [(P[1][0] - P[0][0]) / (4 * UU), (P[1][1] - P[0][1]) / (4 * UU)];
      const at = [mid[0] + dp[0] * -1.1 - L.d[0] * (UU - .012), mid[1] + dp[1] * -1.1 - L.d[1] * (UU - .012)];
      return {
        quadros: 18, passes: ['cor', 'fio', 'prof'],
        pose(t) {
          const u = t / (18 / FPS);
          const along = lerp(-.55, -.1, u), D = 2.35 - .15 * u;
          const pos = { x: at[0] + L.d[0] * D + dp[0] * along, y: 1.45, z: at[1] + L.d[1] * D + dp[1] * along };
          const o = olhar(pos, { x: at[0] + dp[0] * .25, y: 1.2, z: at[1] + dp[1] * .25 }, Math.atan2(-L.d[0], -L.d[1]));
          return { ...pos, ...o, roll: .015, s: rail.nearest(pos.x, pos.z) };
        }
      };
    })(),

    C5d_artista: (() => {
      let info = null;
      const T_GATILHO = -.72;
      function achar() {
        const a = pessoa('artista'); if (!a) return null;
        // o lance cujo fim está mais perto de onde o grupo anda
        let best = 0, bd = Infinity;
        for (let i = 0; i < 6; i++) { const L = lance(i), d = Math.hypot(L.b[0] - a.position.x, L.b[1] - a.position.z); if (d < bd) { bd = d; best = i; } }
        return { L: lance(best), i: best };
      }
      return {
        quadros: 18, passes: ['cor', 'fio', 'prof'], encontros: true, preRolagem: .8,
        pose(t) {
          if (!info) info = achar();
          if (!info) return { x: 0, y: EYE, z: 0, yaw: 0, pitch: 0, s: total - 3 }; // dispara os encontros
          const { L } = info, u = (t - T_GATILHO) / .9;
          const D = lerp(4.3, 3.9, clamp(t / (18 / FPS), 0, 1));
          const pos = { x: L.b[0] - L.d[0] * D + L.left[0] * .35, y: 1.3, z: L.b[1] - L.d[1] * D + L.left[1] * .35 };
          const o = olhar(pos, { x: L.b[0] + L.d[0] * .5, y: 1.35, z: L.b[1] + L.d[1] * .5 }, Math.atan2(-L.d[0], -L.d[1]));
          return { ...pos, ...o, roll: 0, s: rail.nearest(L.b[0] - L.d[0] * 4.3, L.b[1] - L.d[1] * 4.3) };
        },
        info: () => ({ lance: info?.i })
      };
    })(),

    C5e_setlist: (() => {
      const sheet = W.dressing.sheet;
      const f = [Math.sin(sheet.rotation.y), Math.cos(sheet.rotation.y)];
      return {
        quadros: 31, passes: ['cor', 'fio', 'prof'], borrao: n => n >= 20,
        pose(t) {
          const n = t * FPS;
          const D = lerp(1.2, 1.1, clamp(n / 21, 0, 1));
          const ue = clamp((n - 21) / 9, 0, 1), e = ue ** 2.4;
          const pos = { x: sheet.position.x + f[0] * lerp(D, 1.75, e), y: lerp(1.5, EYE, e), z: sheet.position.z + f[1] * D - lerp(0, .9, e) };
          const yaw0 = Math.atan2(f[0], f[1]);
          return { ...pos, yaw: lerp(yaw0, yaw0 - 90 * DEG, e) + .01 * Math.sin(t * 3), pitch: lerp(0, -.03, e), roll: lerp(sheet.rotation.z, 0, e), s: 1 };
        }
      };
    })()
  };
  return planos;
}
