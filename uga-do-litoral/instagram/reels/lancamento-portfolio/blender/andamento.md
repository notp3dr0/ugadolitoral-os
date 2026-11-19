# Andamento · showreel no Blender

<!-- uma linha por etapa: data · o que entregou · tempos medidos · desvios · o Pedro aprovou? -->
- 2026-11-15 · Preparação (Fable 5.2) · Blender 5.3 instalado pelo winget e testado sem tela na GTX 1660 Super
  (`teste_placa.py`: EEVEE 11,6 s, Cycles CUDA 13,6 s, Cycles OptiX 18,4 s por quadro 1080×1920, com o arranque
  incluído). Plano escrito em `LEIA-PRIMEIRO.md` e `plano/` (4 etapas). Nada do filme foi refeito ainda.
  **Próxima: etapa 1** (`plano/etapa-1-corredor.md`), com o Opus.
- 2026-11-15 · **Etapa 1** (Opus) · Corredor gerado por script: `exportar.mjs` (planta, 109 cópias, trilho 162,943 m = `rail.total`, porta,
  telas e 185 objetos do clima/projeções → `dados/corredor.json` + `dados/texturas/`), `exportar_camera.mjs` (poses → `dados/camera/`),
  `montar_cena.py` (→ `cena/corredor.blend`), `render.py`, `revisao_etapa1.py` (→ `revisao/etapa-1.jpg`, `etapa-1-fio.jpg`, `etapa-1-vista.jpg`).
  Tempos por quadro na resolução final, sem arranque: EEVEE 2,1 s (v) / 2,5 s (h); Cycles 64 amostras + OIDN 20,0 s (v e h).
  Molduras coincidem com o passe fio. Desvios: luz falsa do motor (planos aditivos) trocada por luz de verdade; webp lido direto (sem
  conversão); sem neblina (orçamento); fov horizontal = 62° (ou fov do plano × 62/80 no C2); vista Standard (AgX puxa o vermelho pro laranja).
  Aguardando o Pedro escolher motor e clima.
- 2026-11-15 · **Etapa 1 aprovada pela direção** (motor: Cycles). **Etapa 2** (Opus) · C7_porta no Blender, nos dois formatos.
  Notas de luz aplicadas em `montar_cena.py` (concreto cinza frio, preenchimento baixo nas paredes, vermelho mais forte, serviço e piso na
  porta, sala do palco aberta com fundo emissivo, contraluz animada pelo `render.py`, neblina só na região da porta, facho das cópias mais aberto).
  32 x 64 amostras no C7 q60: diferença média 1,3/255, invisível → 32. Câmera com um ponto-chave por quadro, desfoque de movimento
  (meio quadro), profundidade de campo f/2.8 na porta, passe prof radial. Flash: opção (b), luz presa à câmera nos quadros locais 13 e 40
  (`revisao/etapa-2-flash.jpg`); `montar.py` ganhou `--montagem` e `"sem_flash"` por entrada (padrão intacto).
  Sequência (`sequencia.py`, retomável): média 19,6 s/quadro (v) e 21,3 s (h). Saídas: `../quadros/C7_porta_bl/`, `_blh/`,
  `../saida/teste-porta-vertical.mp4`, `teste-porta-comparacao.mp4`, `teste-porta-horizontal.mp4`, `revisao/etapa-2.jpg`.
  Desvios: teste de flash no q13 (q0 fica sob o FILME:1); horizontal sem fio. Aguardando o Pedro (portão).
- 2026-11-15 · Etapa 2 aprovada pelo Pedro, com a crítica "perdemos a escuridão". **Etapa 3** (Opus; a montagem final foi feita pela
  direção depois que o Opus bateu no limite semanal de uso, com o render já completo). Luz corrigida em `montar_cena.py`: preto fora dos
  fachos, zebrado da porta por facho estreito de cima, vermelho concentrado perto da fonte, flash físico de alcance curto, contraluz do
  palco como facho com fonte visível. Renderizados no Cycles (32 amostras): C7_porta de novo (v 17,6 s/q e h), C2a-d/f/g (~15 s/q),
  C2e_mergulho (15,4 s/q), B1_travessia cor + seg, A1_planta seg [168, 223) (o corredor sob luz vermelha por baixo da linha).
  Passe seg do B1 e do A1 renderizado duas vezes (o segundo com níveis ajustados). Cenas novas: corredor sob luz vermelha no fim da
  seção A e o palco depois da porta [855, 866). `montagem-v3.json` → `../saida/showreel-v3-vertical.mp4` (+ leve), folhas em
  `../saida/revisao-v3/`: 960 quadros, nenhum cartão cinza, 21 de 23 cortes na batida (os 2 de meia batida são os de antes),
  áudio com deslocamento 0. Fraco: a revelação estoura em cinza claro no quadro de cada degrau (média 93 a 105 de 255) e assenta em
  ~6 quadros, como no conceito aprovado, mas agora mais forte; o palco é névoa cinza com a fonte de luz, não preto. Etapa 4 não começou.
  Aguardando o Pedro revisar a v3 vertical.
- 2026-11-17 · **Etapa 4** (feita pela direção, Opus 5.5) · Horizontal 1920×1080. Formato por argumento no arreio (`--h`), nas
  cenas (`?fmt=h`) e no laboratório (`--tempo tempo-h.json`). Refilmados em 16:9: planta (sem giro), fio da travessia, showreel do
  site (layout de computador), acervo e cartela. Cartela nova nos dois formatos (v3.1): só AGENDA ABERTA, pequeno, centrado,
  embaralhando como no site, sem nome, site, @ nem risco vermelho. Fotos em tela cheia viram fila de três lado a lado andando a cada
  batida (`fontes.foto_fila`), sem corte; filme vertical (KayG) entra inteiro no centro sobre preto. Blender h: C2a-g, C2e_mergulho,
  B1 cor + seg, A1 seg 168-222 (`etapa4_render.sh`, ~17-21 s/q, terminou 01:32). Saídas: `../saida/showreel-v3.1-vertical.mp4`,
  `../saida/showreel-v3.1-horizontal.mp4` (+ leves), folhas em `../saida/revisao-v3.1h/` (feitas pro vertical, espremem o quadro;
  conferido por quadros tirados do MP4). 960 quadros, nenhum cartão cinza, 21 de 23 cortes na batida, áudio com deslocamento 0.
  Desvio: cópias C2 seguem com uma cópia por plano (não duas ou três). Aguardando o Pedro.
- 2026-11-17 · (site, rodada 13) `bake_site.py` + `bake_site_pos.py` pintam a luz desta cena em mapas pro site (`luz_site/`, copiado pra `site-lab/bastidor/luz/`). Abrem `cena/corredor.blend` só pra ler; nada do filme muda. 512 amostras: 279 s + 101 s.
