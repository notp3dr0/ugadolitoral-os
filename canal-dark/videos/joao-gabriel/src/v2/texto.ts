// Texto legível dentro da cena 3D: desenha num canvas e vira textura.
import * as THREE from "three";

export const texTexto = (w: number, h: number, desenha: (c: CanvasRenderingContext2D) => void) => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  desenha(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const arred = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};

// balão de conversa (tipo zap): devolve textura e proporção
export const balao = (txt: string, meu: boolean, hora: string, nome?: string) => {
  const W = 760, H = nome ? 200 : 150;
  const tex = texTexto(W, H, (c) => {
    c.fillStyle = meu ? "#d9fdd3" : "#ffffff";
    arred(c, 8, 8, W - 16, H - 16, 34); c.fill();
    let y = 30;
    if (nome) { c.fillStyle = "#e5484d"; c.font = "bold 38px 'Segoe UI', Arial"; c.fillText(nome, 36, y + 34); y += 46; }
    c.fillStyle = "#111b21"; c.font = "bold 60px 'Segoe UI', Arial"; c.fillText(txt, 36, y + 62);
    c.fillStyle = "#667781"; c.font = "32px 'Segoe UI', Arial"; c.fillText(hora + (meu ? "  ✓✓" : ""), W - (meu ? 190 : 130), H - 30);
  });
  return { tex, aspecto: W / H };
};

export const cabecalhoZap = (grupo: string, hora: string) =>
  texTexto(760, 220, (c) => {
    c.fillStyle = "#075e54"; c.fillRect(0, 0, 760, 220);
    c.fillStyle = "#fff"; c.font = "bold 44px 'Segoe UI', Arial"; c.fillText(hora, 32, 60);
    c.font = "bold 62px 'Segoe UI', Arial"; c.fillText(grupo, 32, 160);
    c.font = "36px 'Segoe UI', Arial"; c.fillStyle = "#cfe9e5"; c.fillText("5 participantes", 32, 205);
  });

export const telaSelecao = () =>
  texTexto(1200, 760, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, "#0b1a2e"); g.addColorStop(1, "#03070f");
    c.fillStyle = g; c.fillRect(0, 0, 1200, 760);
    c.strokeStyle = "#c8aa6e"; c.lineWidth = 8; c.strokeRect(20, 20, 1160, 720);
    c.fillStyle = "#c8aa6e"; c.font = "bold 46px 'Segoe UI', Arial"; c.textAlign = "center";
    c.fillText("ESCOLHA SEU CAMPEÃO", 600, 110);
    c.fillStyle = "#f0e6d2"; c.font = "900 210px 'Arial Black', Arial"; c.fillText("SENNA", 600, 380);
    c.fillStyle = "#e5484d"; c.font = "900 150px 'Arial Black', Arial"; c.fillText("MID", 600, 560);
    c.fillStyle = "#8a9bb3"; c.font = "bold 40px 'Segoe UI', Arial"; c.fillText("função recomendada: SUPORTE", 600, 680);
  });
