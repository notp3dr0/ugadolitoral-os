"""Rodada 3: vídeo passa a ser do Canal Dark (assinatura sem marca do Uga, paleta do canal) + 2 ajustes de quadro."""
import sys

def sub(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        if a not in s:
            sys.exit(f'nao achei em {path}: {a[:90]}')
        s = s.replace(a, b)
    open(path, 'w', encoding='utf-8').write(s)

# assinatura final do Canal Dark (sem nome ainda): a piada fica, a marca do Uga sai
sub('src/data/scenes.ts', [
  ('{ text: "UGA DO LITORAL", subtitle: "agenda aberta · aceito pix, não credencial", variant: "info", size: "large",',
   '{ text: "PIX, NÃO CREDENCIAL", subtitle: "fotógrafo de show · como funciona", variant: "info", size: "large",'),
  ('// "Como funciona a carreira de fotógrafo de show?" · roteiro v1 aprovado em 2026-11-04, ambientado em São Paulo.',
   '// "Como funciona a carreira de fotógrafo de show?" · Canal Dark · roteiro v1 aprovado em 2026-11-04, ambientado em São Paulo.'),
])

# paleta do Canal Dark (marca/design-guide.md)
sub('src/theme.ts', [
  ('// Configuração visual central do "Fotógrafo de show" (Uga do Litoral, São Paulo):\n// cinza de garoa, concreto, azul cobalto de noite e um único acento, o vermelho Uga.',
   '// Configuração visual central do "Fotógrafo de show" (Canal Dark, São Paulo):\n// cinza de garoa, concreto, azul cobalto de noite e um único acento, o vermelho do canal.'),
  ('  positive: "#1fb257",\n  negative: "#e3262f",\n  info: "#2b6fe8",\n  warning: "#f6c518",',
   '  positive: "#3ecf6e",\n  negative: "#e5372b",\n  info: "#3b6cff",\n  warning: "#ffc53d",'),
  ('  accent: "#e3262f",', '  accent: "#e5372b",'),
])

# cena 2: a câmera passa por cima da placa da padaria (estava tampando o boneco no caminho)
sub('src/layout.ts', [
  ('padaria: orbit([-3.3, 0.85, 2.3], 6.2, -14, 14),', 'padaria: orbit([-3.3, 0.85, 2.3], 6.2, -12, 23),'),
])

# cena 7: o neon "AO VIVO" da fachada some quando a câmera está olhando pra dentro da casa de perto
sub('src/world/Buildings.tsx', [
  ('import { EXTRA_CASAS } from "../layout";', 'import { cameraPoseAt } from "../components/CameraController";\nimport { EXTRA_CASAS } from "../layout";'),
  ('      <Plane p={[cx, 2.38, z1 + 0.09]} s={[2.4, 0.45]} map={neonTexture("AO VIVO", "#ff2e3a")} transparent basic />',
   '      {neonVisible(frame) ? <Plane p={[cx, 2.38, z1 + 0.09]} s={[2.4, 0.45]} map={neonTexture("AO VIVO", "#ff2e3a")} transparent basic /> : null}'),
  ('const CasaShow: React.FC<{ frame: number; night: number }> = ({ frame, night }) => {',
   '''/** O neon da fachada atrapalha os planos de dentro do show: some quando a câmera está perto e mirando lá dentro. */
const neonVisible = (frame: number) => {
  const pose = cameraPoseAt(frame);
  const d = Math.hypot(pose.position[0] - 0.6, pose.position[1] - 2.4, pose.position[2] + 1.5);
  return !(pose.target[2] < -2.6 && d < 9 && pose.position[2] > -1.5);
};

const CasaShow: React.FC<{ frame: number; night: number }> = ({ frame, night }) => {'''),
])
print("ok")
