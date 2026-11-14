"""Rodada 1 de ajustes de enquadramento e leitura (depois dos primeiros stills)."""
import sys

def sub(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        if a not in s:
            sys.exit(f'nao achei em {path}: {a[:80]}')
        s = s.replace(a, b)
    open(path, 'w', encoding='utf-8').write(s)

# casa de show mais funda (z0 -5.2), palco e camarim recuados
sub('src/world/Buildings.tsx', [
  ('  const z0 = -4.4;\n  const z1 = -1.6;', '  const z0 = -5.2;\n  const z1 = -1.6;'),
  ('<Box p={[0.6, 0.18, -3.95]} s={[2.4, 0.36, 0.9]} c="#2a2a2e" />', '<Box p={[0.6, 0.18, -4.75]} s={[2.4, 0.36, 0.9]} c="#2a2a2e" />'),
  ('<Box p={[0.6, 0.37, -3.52]}', '<Box p={[0.6, 0.37, -4.32]}'),
  ('<Box p={[x, 0.62, -4.0]} s={[0.4, 0.55, 0.36]} c="#0f0f10" />\n          <Box p={[x, 1.08, -4.0]}', '<Box p={[x, 0.62, -4.8]} s={[0.4, 0.55, 0.36]} c="#0f0f10" />\n          <Box p={[x, 1.08, -4.8]}'),
  ('<mesh position={[x, 0.62, -3.81]}', '<mesh position={[x, 0.62, -4.61]}'),
  ('<Figure position={[0.6, 0.36, -4.0]} yaw={0} variant="rapper"', '<Figure position={[0.6, 0.36, -4.8]} yaw={0} variant="rapper"'),
  ('<Box p={[0.6, 2.3, -3.6]}', '<Box p={[0.6, 2.3, -4.4]}'),
  ('<group key={x} position={[x, 2.25, -3.6]}', '<group key={x} position={[x, 2.25, -4.4]}'),
  ('<pointLight position={[0.6, 1.6, -3.2]}', '<pointLight position={[0.6, 1.6, -4.0]}'),
  ('<pointLight position={[-0.2, 1.8, -2.2]}', '<pointLight position={[-0.2, 1.8, -2.8]}'),
  ('<group position={[-1.0, 0, -4.33]}>', '<group position={[-1.0, 0, -5.13]}>'),
  ('<Plane p={[x1 + 0.005, 1.7, -3.0]}', '<Plane p={[x1 + 0.005, 1.7, -3.4]}'),
  ('const CROWD = Array.from({ length: 22 }, (_, i) => {', 'const CROWD = Array.from({ length: 24 }, (_, i) => {'),
  ('const x = left ? -1.2 + rand(s + "x") * 1.25 : 1.15 + rand(s + "x") * 1.3;\n  const z = -2.75 + rand(s + "z") * 0.95;',
   'const x = left ? -1.2 + rand(s + "x") * 1.2 : 1.2 + rand(s + "x") * 1.25;\n  const z = -3.3 + rand(s + "z") * 1.5;'),
  # luminária do quarto sai (virava bola branca)
  ('''      {/* luminária */}
      <mesh position={[0.05, 1.35, 3.0]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#fff" emissive="#ffe2a8" emissiveIntensity={0.4 + night * 1.6} />
      </mesh>
''', ''),
])

sub('src/layout.ts', [
  ('stage: { p: [0.6, -2.85] as [number, number], yaw: 180 },', 'stage: { p: [0.6, -3.4] as [number, number], yaw: 180 },'),
  ('camarim: { p: [-1.0, -3.6] as [number, number], yaw: 180 },', 'camarim: { p: [-1.0, -4.45] as [number, number], yaw: 180 },'),
  ('stageClose: orbit([0.6, 0.72, -2.85], 4.2, 200, 7),', 'stageClose: orbit([0.6, 0.74, -3.4], 1.75, 196, 8),'),
  ('stageClose2: orbit([0.6, 0.72, -2.85], 3.7, 192, 6),', 'stageClose2: orbit([0.6, 0.74, -3.4], 1.55, 186, 7),\n  rewindMid: orbit([0.4, 1.4, -1.5], 14, 110, 48),'),
  ('callcenter: orbit([-3.2, 1.5, -2.4], 8.5, -18, 10),', 'callcenter: orbit([-3.2, 1.2, -2.4], 8, -4, 17),'),
  ('padariaClose: orbit([-3.3, 0.78, 2.45], 4.6, -20, 10),', 'padariaClose: orbit([-3.5, 0.78, 2.85], 5.0, 8, 14),'),
  ('padariaClose2: orbit([-3.3, 0.78, 2.45], 4.5, -19, 10),', 'padariaClose2: orbit([-3.5, 0.78, 2.85], 4.9, 9, 14),'),
  ('showFacade: orbit([0.6, 1.4, -2.3], 10, 8, 10),', 'showFacade: orbit([0.6, 1.4, -2.3], 10, 8, 15),'),
  ('door: orbit([0.85, 0.8, -1.25], 4.6, 18, 7),', 'door: orbit([0.85, 0.75, -1.25], 5.2, 14, 22),'),
  ('door2: orbit([0.85, 0.8, -1.25], 4.6, 26, 7),', 'door2: orbit([0.85, 0.75, -1.25], 5.2, 20, 22),'),
  ('showInside: orbit([0.6, 0.85, -3.0], 6.5, -15, 18),', 'showInside: orbit([0.6, 0.85, -3.5], 6.8, -12, 20),'),
  ('showInside2: orbit([0.6, 0.85, -3.0], 6.5, 25, 18),', 'showInside2: orbit([0.6, 0.85, -3.5], 6.8, 16, 20),'),
  ('heroChest: orbit([0, 0.72, -0.1], 2.8, 10, 4),', 'heroChest: orbit([0, 0.72, -0.1], 2.8, 80, 6),'),
  ('camarim: orbit([-0.95, 0.85, -3.75], 4.6, -20, 12),', 'camarim: orbit([-0.9, 0.8, -4.5], 4.4, 8, 16),'),
])

sub('src/data/scenes.ts', [
  ('keys: [key(0, P.stageClose), key(W("s1", 10), P.stageClose2, "soft"), key(end(0) - 4, P.wide, "inOut"), key(end(0), P.wide)],',
   'keys: [key(0, P.stageClose), key(W("s1", 10), P.stageClose2, "soft"), key(Math.round((W("s1", 10) + end(0)) / 2), P.rewindMid, "in"), key(end(0) - 4, P.wide, "out"), key(end(0), P.wide)],'),
  ('ease("fade", end(11) - 74, end(11) - 59, 0, 0.78, "in", "0-1"),', 'ease("fade", end(11) - 74, end(11) - 59, 0, 0.86, "in", "0-1"),'),
  ('appearAt: end(11) - 69, disappearAt: end(11) + 10 },', 'appearAt: end(11) - 69, disappearAt: end(11) + 10, top: 860 },'),
  ('subtitle?: string; slot?: "center" | "left" | "right"; icon?: "?"; size?: "normal" | "large";\n};',
   'subtitle?: string; slot?: "center" | "left" | "right"; icon?: "?"; size?: "normal" | "large";\n  /** posição vertical fixa (px), fora da pilha do topo; usada na cartela final */\n  top?: number;\n};'),
])

# água e cartões de foto acompanham a casa mais funda
sub('src/world/Props.tsx', [
  ('const z = lerp(-3.9, -4.5, w);', 'const z = lerp(-4.75, -5.35, w);'),
  ('<mesh position={[-1.0, 0.85, lerp(-4.35, -4.0, Math.sin(w * Math.PI))]}', '<mesh position={[-1.0, 0.85, lerp(-5.15, -4.8, Math.sin(w * Math.PI))]}'),
  ('p = arc([0.6, 0.95, -2.75], [1.55 + (i % 3) * 0.05, 0.4 + i * 0.012, -2.5], t, 0.6);', 'p = arc([0.6, 0.95, -3.3], [1.45 + (i % 3) * 0.05, 0.42 + i * 0.012, -3.75], t, 0.6);'),
])

# legendas maiores (Barlow Condensed é estreita)
sub('src/components/AnimatedCaptions.tsx', [
  ('const MAX_CHARS = 17;', 'const MAX_CHARS = 20;'),
  ('fontSize: 66,', 'fontSize: 80,'),
])

# badges maiores + cartela com posição fixa
sub('src/components/TechnicalBadge.tsx', [
  ('const h = large ? 128 : subtitle ? 112 : 88;\n  const iconSize = large ? 92 : 64;', 'const h = large ? 150 : subtitle ? 132 : 104;\n  const iconSize = large ? 104 : 76;'),
  ('fontSize: large ? 62 : 44,', 'fontSize: large ? 76 : 54,'),
  ('fontSize: large ? 38 : 29,', 'fontSize: large ? 40 : 33,'),
  ('const badgeHeight = (b: SceneBadge) => (b.size === "large" ? 128 : b.subtitle ? 112 : 88);', 'const badgeHeight = (b: SceneBadge) => (b.size === "large" ? 150 : b.subtitle ? 132 : 104);'),
  ('    if (slot === "center") {\n      stackY += (badgeHeight(b) + GAP) * weight;', '    if (b.top !== undefined) {\n      top = b.top;\n    } else if (slot === "center") {\n      stackY += (badgeHeight(b) + GAP) * weight;'),
])

# etiqueta R$ 0,00 nunca sai pela lateral
sub('src/components/Overlays.tsx', [
  ('left: p.x, top: y, translate: "-50% -100%", scale: String(size * Math.min(1, k))',
   'left: clamp(p.x, 90 + 190 * size, 990 - 190 * size), top: y, translate: "-50% -100%", scale: String(size * Math.min(1, k))'),
])
print("ok")
