"""Rodada 2 de ajustes (depois da revisão quadro a quadro das 12 cenas)."""
import sys

def sub(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        if a not in s:
            sys.exit(f'nao achei em {path}: {a[:90]}')
        s = s.replace(a, b)
    open(path, 'w', encoding='utf-8').write(s)

# --- gancho: rosto primeiro, câmera sobe em "fotógrafo", flash em "trabalha" e em "real"
sub('src/data/scenes.ts', [
  ('      ease("hero.shoot", 0, 6, 1, 1, "linear", "0-1"),\n', '      ease("hero.shoot", W("s1", 1), W("s1", 1) + 8, 0, 1, "inOut", "0-1"),\n'),
  ('      ...flash(8),\n', '      ...flash(W("s1", 2) + 4),\n'),
  ('sfx("flash", 8, 0.34),', 'sfx("flash", W("s1", 2) + 4, 0.34),'),
  # cena 2: câmera acompanha o boneco (sai do quarto junto com ele)
  ('keys: [key(0, P.wide), key(W("s2", 6), P.quarto, "soft"), key(W("s2", 9) - 2, P.quarto), key(W("s2", 12), P.padaria, "inOut"), key(W("s2", 13) - 2, P.padaria), key(W("s2", 15), P.callcenter, "inOut"), key(end(1), P.callcenter)],',
   'keys: [key(0, P.wide), key(W("s2", 6), P.quarto, "soft"), key(W("s2", 9) - 6, P.quarto), key(W("s2", 11), P.padaria, "inOut"), key(W("s2", 13) - 4, P.padaria), key(W("s2", 14) + 2, P.callcenter, "inOut"), key(end(1), P.callcenter)],'),
])

sub('src/layout.ts', [
  ('stageClose: { ...orbit([0.6, 0.7, -3.4], 1.7, 196, 9), zoom: 0.6 },', 'stageClose: { ...orbit([0.6, 0.8, -3.4], 1.7, 196, 9), zoom: 0.6 },'),
  ('stageClose2: { ...orbit([0.6, 0.72, -3.4], 1.6, 186, 8), zoom: 0.68 },', 'stageClose2: { ...orbit([0.6, 0.8, -3.4], 1.6, 186, 8), zoom: 0.68 },'),
  ('showInside: orbit([0.6, 0.85, -3.5], 6.8, -12, 20),', 'showInside: orbit([0.6, 0.8, -3.5], 6.8, -6, 26),'),
  ('showInside2: orbit([0.6, 0.85, -3.5], 6.8, 16, 20),', 'showInside2: orbit([0.6, 0.8, -3.5], 6.8, 8, 26),'),
  ('city: orbit([0, 0.5, -0.3], 34, 18, 50),', 'city: orbit([0, 0.5, -0.4], 52, 4, 56),'),
  ('city2: orbit([0, 0.5, -0.3], 34, 36, 50),', 'city2: orbit([0, 0.5, -0.4], 52, 14, 56),'),
  ('{ p: [-6.8, -2.6], name: "SHOW" },\n  { p: [6.8, -2.6], name: "LIVE" },\n  { p: [-6.8, 2.2], name: "BAILE" },\n  { p: [6.8, 2.2], name: "BAR" },',
   '{ p: [-5.7, -2.7], name: "SHOW" },\n  { p: [5.9, -2.7], name: "LIVE" },\n  { p: [-5.7, 2.6], name: "BAILE" },\n  { p: [5.7, 2.6], name: "BAR" },'),
  ('casa2: orbit([6.3, 0.9, -1.9], 6, 30, 10),', 'casa2: orbit([5.5, 0.9, -1.9], 6, 30, 12),'),
])

# pilotis: tira a coluna do meio (escondia o boneco)
sub('src/world/Buildings.tsx', [
  ('{[-1.05, 0, 1.05].map((dx) =>', '{[-1.05, 1.05].map((dx) =>'),
  # ônibus mais pra direita: a catraca e o boneco ficam à vista
  ('<group position={[3.8, 0, -0.45]}>', '<group position={[6.3, 0, -0.45]}>'),
  # luz quente do camarim mais forte (a cena estava escura)
  ('{door < 0.5 ? <pointLight position={[0, 0.8, -0.3]} color="#ffd59a" intensity={0.8} distance={2} /> : null}',
   '{door < 0.5 ? <pointLight position={[0, 0.9, 0.6]} color="#ffd59a" intensity={2.2} distance={3.2} decay={1.6} /> : null}'),
])

sub('src/world/Props.tsx', [
  # cartão 24x acima do cofrinho (estava saindo pela esquerda)
  ('const at: Vec3 = late ? [-2.75, 1.25, 2.85] : [PIGGY[0] - 0.4, PIGGY[1] + 0.32, PIGGY[2] + 0.35];',
   'const at: Vec3 = late ? [-3.05, 1.32, 2.8] : [PIGGY[0] - 0.05, PIGGY[1] + 0.3, PIGGY[2] + 0.3];'),
  # feixes da câmera: bem mais sutis (lavavam o quadro)
  ('opacity={0.09 * rays}', 'opacity={0.03 * rays}'),
  ('<coneGeometry args={[0.32 + i * 0.05, 2.8, 4, 1, true]} />', '<coneGeometry args={[0.2 + i * 0.04, 2.8, 4, 1, true]} />'),
  # celular do lado esquerdo do boneco (saía pela direita)
  ('const at: Vec3 = [h.x + 0.42, 0.95, h.z + 0.15];', 'const at: Vec3 = [h.x - 0.45, 0.95, h.z + 0.15];'),
  # polaroide à esquerda da cabeça (batia na etiqueta)
  ('<group position={[-3.2, lerp(0.85, 1.2, Math.min(print, 1)), 3.25]} rotation={[0, -0.45, 0.08]} scale={print}>',
   '<group position={[-3.6, lerp(0.85, 1.12, Math.min(print, 1)), 3.3]} rotation={[0, -0.2, 0.08]} scale={print}>'),
  # balão do sonho à esquerda (cortava na direita)
  ('const at: Vec3 = [h.x + 0.35, 1.55, h.z + 0.1];', 'const at: Vec3 = [h.x - 0.38, 1.5, h.z + 0.1];'),
  ('<mesh key={i} position={[h.x + 0.1 + i * 0.12, 1.08 + i * 0.16, h.z + 0.1]} scale={k}>', '<mesh key={i} position={[h.x - 0.1 - i * 0.12, 1.08 + i * 0.16, h.z + 0.1]} scale={k}>'),
  # moldura VITRINE menor e mais baixa
  ('const y = lerp(3.2, 0.62, Math.min(k, 1.15));', 'const y = lerp(3.0, 0.55, Math.min(k, 1.15));'),
  ('        [0, 0.62, 0, 0.9, 0.08],\n        [0, -0.62, 0, 0.9, 0.08],\n        [-0.42, 0, 0, 0.08, 1.32],\n        [0.42, 0, 0, 0.08, 1.32],',
   '        [0, 0.5, 0, 0.76, 0.07],\n        [0, -0.5, 0, 0.76, 0.07],\n        [-0.35, 0, 0, 0.07, 1.07],\n        [0.35, 0, 0, 0.07, 1.07],'),
  ('<Card p={[0, 0.82, 0]} s={[0.8, 0.22]} map={signTexture("VITRINE"', '<Card p={[0, 0.66, 0]} s={[0.66, 0.18]} map={signTexture("VITRINE"'),
  # aviõezinhos e resposta maiores (a vista é bem aberta)
  ('rotation={[-Math.PI / 2 + 0.3, 0, Math.atan2(tg[0] - h.x, tg[2] - h.z) + Math.PI]} scale={2.2}>', 'rotation={[-Math.PI / 2 + 0.3, 0, Math.atan2(tg[0] - h.x, tg[2] - h.z) + Math.PI]} scale={4.5}>'),
  ('const p = arc([6.8, 1.6, -2.6], [h.x, 1.1, h.z], smoothstep(reply), 1.8);', 'const p = arc([5.9, 1.6, -2.7], [h.x, 1.1, h.z], smoothstep(reply), 1.8);'),
  ('rotation={[-Math.PI / 2 + 0.3, 0, Math.atan2(h.x - 6.8, h.z + 2.6) + Math.PI]} scale={2.6}>', 'rotation={[-Math.PI / 2 + 0.3, 0, Math.atan2(h.x - 5.9, h.z + 2.7) + Math.PI]} scale={4}>'),
  ('<group position={[6.3, 0, -1.75]} scale={k}>', '<group position={[5.4, 0, -1.8]} scale={k}>'),
  # despertador dentro do quadro
  ('<group position={[-2.75, 0.98, 2.62]} rotation={[0, -0.3, shake]}>', '<group position={[-3.75, 0.98, 2.62]} rotation={[0, 0.2, shake]}>'),
  # câmera erguida um pouco mais baixa (sumia no topo)
])

sub('src/world/Figure.tsx', [
  ('? [0, lerp(0.62, 1.32, clamp(h.lift, 0, 1)), lerp(0.15, 0.08, clamp(h.lift, 0, 1))]', '? [0, lerp(0.62, 1.16, clamp(h.lift, 0, 1)), lerp(0.15, 0.16, clamp(h.lift, 0, 1))]'),
])

# selo de "visto" maior
sub('src/world/Buildings.tsx', [
  ('<Plane p={[0, 0, 0]} s={[0.9, 0.5]} map={cardTexture("visto"', '<Plane p={[0, 0, 0]} s={[1.7, 0.95]} map={cardTexture("visto"'),
  ('{i < seen ? <SeenMark at={[0, 2.2, 0.3]} /> : null}', '{i < seen ? <SeenMark at={[0, 2.4, 0.4]} /> : null}'),
])

# etiqueta R$ 0,00: nos closes vai pro lado da cabeça em vez de cobrir o rosto
sub('src/components/Overlays.tsx', [
  ('''  const size = clamp(16 / dist, 0.5, 1.1);
  const y = clamp(p.y - 30 * size, 600, 1300);
  return (
    <div style={{ position: "absolute", left: clamp(p.x, 90 + 190 * size, 990 - 190 * size), top: y,''',
   '''  const size = clamp(16 / dist, 0.5, 1.1);
  let x = p.x;
  let y = p.y - 30 * size;
  if (y < 560) {
    // close: o topo da cabeça está alto demais; a etiqueta vai pro lado do rosto
    const face = projectPoint(pose, [h.x, h.y + 0.95, h.z]);
    const side = face.x > 540 ? -1 : 1;
    x = face.x + side * 330 * size;
    y = clamp(face.y, 600, 1200);
  }
  y = clamp(y, 560, 1300);
  return (
    <div style={{ position: "absolute", left: clamp(x, 90 + 190 * size, 990 - 190 * size), top: y,'''),
  ('top: clamp(p.y - 40, 640, 1200), translate: "-50% -100%", scale: String(Math.min(k, 1.15))', 'top: clamp(p.y - 40, 800, 1220), translate: "-50% -100%", scale: String(Math.min(k, 1.15))'),
  ('const p = projectPoint(cameraPoseAt(frame), [h.x + 0.42, 1.25, h.z + 0.15]);', 'const p = projectPoint(cameraPoseAt(frame), [h.x - 0.45, 1.25, h.z + 0.15]);'),
])
print("ok")
