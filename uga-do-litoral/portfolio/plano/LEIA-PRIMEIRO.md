# Plano do laboratório · leia primeiro

Escrito em 2026-11-11 pelo Fable 5.2, depois de ler o código inteiro e medir. Quem executa é outro
modelo (Opus). Este arquivo vale pra todas as rodadas; cada rodada tem o arquivo dela. O Pedro aprovou
o rumo: otimizar sem mudar a cara, cinco efeitos, e um corredor 3D que é **bastidor de casa de show**.

## Como executar gastando pouco

1. Leia este arquivo e **só o arquivo da rodada atual**. Não leia as outras rodadas antes da hora.
2. Não refaça a auditoria. O que foi medido está em `../andamento.md` e nos arquivos de rodada.
3. Não leia `site/`: é idêntico ao ponto de partida do `site-lab/` e só serve pro comparador.
4. Não leia arquivo grande inteiro. `gallery-data.js` (32 KB) e `liquid-ether.js` (27 KB) estão
   descritos abaixo com os pontos onde se mexe. `index.html` tem um card por linha: use busca.
5. Um passo = um commit no branch `lab` (mensagem em português, o que mudou e por quê). Depois de
   cada passo rode a verificação que o passo pede. As ferramentas imprimem pouco, de propósito.
6. Só abra print (PNG) quando o passo disser "olhar" ou quando o comparador acusar diferença.
7. Dentro de uma rodada não pare pra perguntar, a não ser que esteja travado de verdade. No fim da
   rodada: uma linha no `../andamento.md`, relatório ao Pedro em até 10 linhas (o que mudou, números
   antes e depois, o que ele precisa olhar), e espere o OK dele antes da próxima.
8. Se o plano bater de frente com a realidade do código, vale a realidade. Faça o menor desvio
   possível e anote no `andamento.md`.
9. Passo marcado **[decisão do Pedro]** não se executa sem ele dizer sim.

Regras da pasta (só mexer no `site-lab/`, nunca publicar, etc.): `../AGENTS.md`. O que é o coração do
site e não pode sair: `../contexto.md`.

## Rodadas

| # | arquivo | o que entrega | estado |
|---|---|---|---|
| 1 | (feita) | auditoria e este plano | feita em 2026-11-11 |
| 2 | `rodada-2-leve.md` | mesmo site, mais leve e organizado em módulos | feita e aprovada em 2026-11-11 |
| 3 | `rodada-3-efeitos.md` | cinco efeitos, cada um desligável | feita e aprovada em 2026-11-11 |
| 4 | `rodada-4-bastidor.md` | `bastidor.html`, o corredor 3D | feita em 2026-11-11 |
| 5 | `rodada-5-ajustes.md` | críticas do Pedro: bastidor protagonista, cortina, sem numeração, sorteio a cada visita, giro 360°, setlist-mapa, som com os beats dele | feita e aprovada em 2026-11-11 |
| 6 | `rodada-6-vida.md` | credencial viva (crachá com física, frente e verso), encontros sorteados por visita (segurança, água e mais 4), achados e enfeite fixo | feita em 2026-11-11, falta o OK do Pedro |
| 7 | (sem arquivo: pedidos diretos do Pedro, ver `../andamento.md`) | 29 fotos novas, corredor elástico, credencial no layout dele, segurança com uniforme e braço, voz de desenho, 3 vídeos rotativos; **publicada em produção em 2026-11-12** | feita |
| 8 | `rodada-8-folha.md` | conserto da mira e da volta do fim, travadas e memória, link direto, chamado no foco, folha de contato, giroscópio | feita e **publicada em 2026-11-13** |
| 9 | (sem arquivo: análise do contratante, ver `../andamento.md`) | INFO pra quem contrata, AGENDA ABERTA, WhatsApp com mensagem pronta | **publicada em 2026-11-14** |
| 10 | (sem arquivo, ver `../andamento.md`) | intro mais curta, letra mínima 11 px, vista FILMES | **publicada em 2026-11-14** |
| 11 | (sem arquivo, ver `../andamento.md`) | intro toca sozinha (sem rolagem), INFO se revela embaralhando | **publicada em 2026-11-14** |

A ordem importa: a 3 usa os módulos da 2, e a 4 reaproveita o player de filme e os dados da 2 e o
"tom" de cada foto da 3.

## Ferramentas prontas (`../ferramentas/`, já testadas)

Rodar de dentro de `ferramentas/`. Todas sobem o próprio servidor e fecham sozinhas. Usam o Chrome da
máquina. Se faltar `node_modules`, rode `npm i` ali uma vez.

| comando | pra quê | saída |
|---|---|---|
| `node fumaca.mjs` | os comportamentos continuam funcionando? (intro, vistas, galeria, filme, arrastar, celular, menos movimento) | 18 linhas OK/FALHA, sai 1 se falhar |
| `node comparar.mjs` | a cara mudou? compara `site/` com `site-lab/` pixel a pixel, em celular e desktop, 4 telas cada | 8 linhas IGUAL/DIFERE; se diferir, salva original, lab e mapa rosa em `saida/comparar/` |
| `node medir.mjs [pasta] [saida] [pagina]` | peso, LCP, quadros por segundo, prints | ~10 linhas por tela, prints em `saida/medir/` |
| `python tons.py ../site-lab` | a cor de luz de cada foto (JSON `{indice: "#rrggbb" ou null}`); `--tabela` pra conferir | 23 fotos têm tom, 57 são P&B |
| `node foto.mjs <rota> <saida.png> [opções]` | um print pra olhar (com `--tela=celular`, `--hover=`, `--clique=`, `--js=`, `--inteira`, `--menos-movimento`) | uma linha, e se houve erro no console |
| `node dom.mjs > saida/dom-agora.txt` | retrato do acervo depois do JS, pra comparar com `referencia/dom-acervo.txt` (rodada 2) | 87 linhas num arquivo |
| `node encontros.mjs [cena]` | os encontros da rodada 6, um a um, sorteio e orçamento | ~16 linhas OK/FALHA |
| `node bastidor.mjs` | o corredor 3D inteiro (rodada 4) | 16 linhas OK/FALHA |
| `node bastidor-planta.mjs` | a planta do corredor, sem navegador | 9 linhas OK/FALHA |
| `node toque.mjs` | o efeito toque no celular, com toque emulado (rodada 3.4) | 9 linhas OK/FALHA |
| `node rodada8.mjs [bloco]` | os testes da rodada 8 | OK/FALHA por linha |
| `node rodada9.mjs` / `node rodada10.mjs` | INFO, agenda, intro, letras e FILMES (desktop e celular) | ok/XX por linha |
| `node avaliar.mjs` | peso da carga, LCP, rolagem até a 1ª foto e letras pequenas no celular | JSON |
| `node medir-bastidor.mjs` | peso, quadros, travadas e texturas andando o corredor inteiro, desktop e celular simulado | 4 linhas, nunca falha |
| `node servidor.mjs ../site-lab 4174` | servidor pra olhar na mão | fica rodando |

**Armadilha do Git Bash:** um argumento que começa com `/` é trocado por um caminho do Windows. Passe
rotas **sem a barra inicial**: `"#fotos"`, `"bastidor.html?s=30"`, `""` pra home.

Limites que eu conheço dessas ferramentas: o comparador roda com "menos movimento" ligado (fundo
líquido e vídeos parados), então ele prova layout e imagem, não animação. O `medir` roda numa máquina
com placa de vídeo (GTX 1660): os quadros por segundo dele **não** representam um celular. Celular de
verdade só com deploy de prévia, que o Pedro pede quando quiser.

Linha de base medida antes de qualquer mudança (celular 390 px, servidor local):
carga inicial 1.747 KB (JS 759, das quais hls.js 605; fotos 515; pôsteres 232; fontes 185), rolar o
acervo inteiro 10,6 MB, abrir a 1ª galeria 1.360 KB em 2 fotos, página com 15.960 px de altura.

## Mapa do código no ponto de partida

Site estático, sem build. Scripts clássicos com `defer`, nesta ordem: `vendor/gsap.min.js`,
`gallery-data.js`, `video-data.js`, `intro.js`, `vendor/hls.min.js`, `app.js`, `liquid-ether.js`.

- **`index.html`** (106 linhas). Ordem do corpo: `#liquid-background > canvas`, link `.skip`,
  `section#portfolio-intro`, `header.site-header`, `main` com `.acervo-bar` (contador + `.view-switch`),
  `section#portfolio` (85 cards, um por linha), `section#info`, `footer`, `dialog#gallery-dialog`,
  `dialog#video-dialog`. O `<head>` tem um `<noscript><style>` que transforma a pilha em grade.
- **`gallery-data.js`**: `window.PORTFOLIO = {photos:[80], films:[5]}` em JSON numa linha, seguido de
  uma função que calcula `artistKey`, `artist`, `galleryId` em cada foto, monta `galleries`
  (28 grupos: 25 artistas e 3 sem identificação, "Show" duas vezes e "Retrato"), e guarda
  `publishedLayout`: a posição de arte de cada card `{key:"photo:12"|"film:0", x, y, w, r, z, aspectRatio?}`.
  Exporta em `catalog`: `normalizeArtist`, `galleries`, `photoOrder`, `mediaOrder`, `buildLayout()`
  (devolve `{entries, height: 838}`).
  Foto: `{i, driveIndex, driveId, title, alt, src (grande), small (640 px), width, height (da pequena)}`.
- **`video-data.js`**: `window.VIDEO_MEDIA`, 5 itens `{id, title, stream (HLS no Vercel Blob), preview (mp4 local), poster, width, height}`.
- **`app.js`** (349 linhas, uma IIFE):
  - 25–72 prepara os cards: rótulos, `data-*`, reordena por `mediaOrder`, **reaplica** o layout e `--pile-height`.
  - 74–90 prévias de filme (no máximo 2 tocando, só visíveis, `IntersectionObserver`).
  - 92–116 entrada dos cards (`animateIn`, GSAP) e `resetPositions`.
  - 117–144 vistas por hash (`setView`: `inicio` = pilha, `fotos` = grade, `info`).
  - 146–183 galeria (`renderPhoto`, `step`, `openPhoto`). 184–238 filme (`openFilm`, `destroyFilm`).
  - 240–287 interação dos cards (arrastar só em `(min-width:701px) and (pointer:fine)`, clique abre).
  - 288–318 eventos da galeria e dos diálogos. 319–348 ciclo de vida (resize, pagehide, pageshow).
- **`intro.js`** (127 linhas): a intro é guiada pela rolagem. A seção tem 280svh (250 no celular) com
  palco `sticky`; uma timeline GSAP pausada recebe `progress()` conforme a rolagem; `scramble()` troca
  letras por `%#&+/*=`. Marca `window.portfolioIntroComplete` e dispara `portfolio:intro-complete`.
- **`liquid-ether.js`** (724 linhas): simulação de fluido em WebGL2, adaptada do React Bits (licença em
  `vendor/LICENSE.react-bits.md`, manter o crédito). Pontos que importam:
  - linha 269, dentro de `mount()`: `settingsRef.current` com `colors:['#ff0000','#ff0000','#ffffff']`,
    `paletteKey` (as cores unidas por vírgula), `resolution:.5`, `autoDemo:true`, `maxRatio:1.5`.
  - linhas 333–337 `updatePalette(s)`: refaz a textura de paleta quando `s.paletteKey` muda; é chamada
    a cada quadro (linha 522). **Trocar a cor do fluido é mudar `s.colors` e `s.paletteKey`.**
  - linhas 575–580 `wake()` e `wakeRef.current`: acordam o laço. Ele dorme quando a aba some ou
    quando `body` tem a classe `modal-open` (há um `MutationObserver` pra isso).
  - linha 723: arranque; não monta com `prefers-reduced-motion` nem com `saveData`.
  - constantes no topo: `PIXEL_BUDGET 1.6e6`, `MAX_CELLS` 45.000 no celular e 100.000 fora, `PRESSURE_STEPS 32`.
- **`style.css`** (163 linhas). Fontes de fato usadas: `Arial, Helvetica` em negrito no nome e na marca,
  `monospace` nos rótulos, Manrope 400 e 500 no texto. Vermelhos: `#fa1717` (ano e cidade), `#ff0000`
  (funções e fluido). Curva de movimento da casa: `--motion-ease: cubic-bezier(.2, 0, 0, 1)`.

## Contrato de DOM (não renomear)

Os testes e o `noscript` dependem destes nomes. Refatorar por dentro, sem trocar o que aparece aqui:
`#portfolio-intro`, `.intro-stage`, `.intro-line`, `.intro-text`, `.intro-roles-visual`, `.intro-skip`,
`#liquid-background canvas` (com `data-renderer="webgl2"` quando ligado), `.site-header`, `.acervo-bar`,
`.view-switch`, `[data-view]`, `#portfolio` com classe `pile` ou `grid`, `.media.photo[data-photo]`,
`.media.film`, `.preview`, `.media-label`, `.play-mark`, `#info`, `#gallery-dialog`, `#gallery-image`,
`#gallery-count`, `#gallery-title`, `#gallery-thumbs`, `.gallery-prev`, `.gallery-next`, `#video-dialog`,
`#video-player`, `#video-title`, `#video-external`, `.close-dialog`, classe `modal-open` no `body`.
Globais e eventos: `window.portfolioReady`, `window.portfolioIntroComplete`, eventos
`portfolio:ready`, `portfolio:intro-complete`, `portfolio:intro-skip`. Hashes: `#inicio`, `#fotos`, `#info`.

## Decisões já tomadas (não reabrir)

- O que a "Rodada 1" antiga tirou e o Pedro reverteu fica: fundo líquido, texto embaralhado, "2026",
  header de vidro, setas nos links, nome em Arial. Não trocar tipografia, não "limpar".
- Barlow Condensed está declarada e nenhum CSS usa. Sai do site (rodada 2). O guia de marca cita ela,
  mas o site que o Pedro quis manter usa Arial.
- Fotos nunca são recortadas, recoloridas ou trocadas. Recompressão de foto só com o OK dele vendo o
  resultado (rodada 2, passo opcional).
- Sem dados de câmera inventados (lente, ISO): não existe essa informação.
- Tudo que é novo e grande entra desligável. Efeitos: parâmetro `?sem=` (rodada 3). Corredor: página própria.

## Textos novos

Todo texto que aparece pro visitante e que não existe hoje está numa tabela no fim de cada arquivo de
rodada, já escrito no tom da marca (`_contexto/marca/tom-de-voz.md`: primeira pessoa, informal, frase
curta, sem "mano", sem travessão, sem promessa exagerada). São **propostas**: use como estão e liste
no relatório da rodada pro Pedro aprovar ou trocar.
