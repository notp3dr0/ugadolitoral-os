# Agente 2 · Gráficos (três cenas próprias, em JS)

Você escreve três cenas do zero, em JS (canvas 2D, WebGL ou three.js: o three do site está em
`portfolio/site-lab/vendor/three.module.min.js`), e grava cada uma quadro a quadro com Playwright.
Sua pasta: `cenas/`. Suas saídas: `quadros/G1_nome/`, `quadros/G2_acervo/`, `quadros/G3_agenda/`.

## Como gravar

Cada cena é uma página com uma função pura `window.desenhar(quadro)` (0, 1, 2...): o mesmo número dá
sempre a mesma imagem. Nada de `Date.now`, `requestAnimationFrame` livre ou `Math.random` sem semente.
Um script Node (`cenas/gravar.mjs`) abre a página (viewport 540×960, `deviceScaleFactor: 2` = 1080×1920;
Chrome com GPU como em `portfolio/ferramentas/bastidor.mjs`), espera fontes e imagens, chama
`desenhar(n)` e salva. Sirva os arquivos com `portfolio/ferramentas/servidor.mjs` (porta 0), apontando
pra uma raiz que enxergue tanto a sua pasta quanto `portfolio/site-lab/` (as fotos e as fontes vêm de lá,
sem copiar nem alterar nada de lá).

Dados: `portfolio/site-lab/js/data.js` exporta `photos` (109 fotos: `src` grande, `md`, `small`,
`artist`, `width`, `height`, `tone`) e `galleries`. Fontes: `portfolio/site-lab/fonts.css` (Manrope,
Arimo, Inconsolata). Veja em `site-lab/js/intro.js` e `style.css` como o site escreve PEDRO / AUGUSTO na
abertura: o nome aqui tem que ser reconhecível como o mesmo do site (mesma família, mesmo peso, mesmo
aperto), sem copiar a animação.

## As cenas

Batidas e quadros em `tempo.json`. Uma batida = 13,43 quadros.

### `G1_nome` · 29 quadros, PNG com transparência

Entra no drop da música, por cima da foto herói (que o agente 3 põe por baixo, com um flash).
**PEDRO AUGUSTO** enorme, em duas linhas, ocupando a largura inteira do quadro vertical, branco. Embaixo,
pequeno, em Inconsolata: `FOTO · VÍDEO · DIREÇÃO CRIATIVA`. No quadro 0 o nome já está inteiro na tela
(é uma pancada, não um fade): a vida vem de um assentamento curto (escala de 1,06 pra 1,00 em uns 6
quadros com saída suave, ou as letras chegando de um aperto maior pro aperto final) e depois de um
movimento lento e contínuo até o fim. Na batida seguinte (quadro local 14) entra a linha de serviços, com
um acento vermelho mínimo (um traço, um ponto). Sem sombra, sem contorno, sem brilho: tipografia limpa,
editorial. Deixe a área central respirável, a foto por baixo precisa aparecer.

### `G2_acervo` · 55 quadros, JPG opaco · batidas 44 a 48

O acervo apresentado como objeto físico, não como grade de site. Fundo preto. Em 4 batidas:

- **Batidas 44 e 45 (locais 0 a 26):** as fotos caem numa mesa como cópias de papel, **uma a cada
  semicolcheia** (a cada ~3,4 quadros; use os quadros de `tempo.json` → `semicolcheias`, subtraindo 598),
  cada uma com rotação, sombra curta e um pequeno quique. Câmera de cima, levemente inclinada, andando.
  Em 3D de verdade (three.js), com as fotos reais (`small` ou `md`), borda branca fina de cópia.
- **Batida 46 (locais 26 a 40):** as cópias deslizam e se alinham sozinhas numa **folha de contato**:
  tiras de filme com perfuração, os quadros em ordem, a câmera fica de frente.
- **Batida 47 (locais 40 a 53):** um lápis vermelho (traço de lápis dermatográfico, irregular, desenhado
  progressivamente) circula um dos quadros. Segura até o fim.

Mostre muitas fotos (40 ou mais passam pela mesa), variadas em artista e cor. Não recolorir as fotos.
O site tem uma folha de contato com lápis vermelho (`site-lab/js/contact.js`, `bastidor/sheet.js`): use
como referência de identidade (cor do vermelho, jeito do traço), não copie o código.

### `G3_agenda` · 96 quadros, JPG opaco · batida 64 até o fim

O fechamento. Fundo: o fluido do site (`site-lab/js/liquid.js`, WebGL) rodando determinístico por baixo,
escuro, lento. Se não der pra deixá-lo determinístico em tempo razoável, escreva um fundo de fluido
próprio no mesmo espírito (preto com veios lentos, discreto) e diga isso no relato.

- **Local 0 (batida 64):** `AGENDA ABERTA` enorme, branco, duas linhas, largura inteira. Pancada: no
  quadro 0 já está lá, com o mesmo assentamento do `G1_nome` (as duas cartelas são irmãs).
- **Local 14 (batida 65):** `ugadolitoral.vercel.app`, em Inconsolata, legível no celular (altura de
  letra maiúscula de pelo menos 34 px no quadro de 1080).
- **Local 27 (batida 66):** `@uga_do_litoral`, mesmo corpo.
- **Local 41 (batida 67):** um traço de lápis vermelho sublinha AGENDA ABERTA (o mesmo lápis do
  `G2_acervo`), e `UGA DO LITORAL` pequeno no topo.
- **Local 54 em diante:** a música já cortou. O cartão segura, com o fluido andando e um movimento de
  câmera quase imperceptível. Nos últimos 6 quadros, nada de fade: termina aceso.

Margens seguras do Instagram: nada de texto nos 250 px de cima nem nos 420 px de baixo do quadro de 1920.

## Critérios de pronto

- `desenhar(n)` é determinístico (grave um quadro duas vezes e compare).
- Folha de revisão de cada cena em `cenas/revisao/<ID>.jpg` (8 quadros lado a lado), **aberta e olhada
  por você**: texto sem erro, sem travessão, nada cortado na borda, legível em tamanho de celular.
- `quadros/<ID>/pronto.json` em cada uma.
- Entregue na ordem `G3_agenda`, `G1_nome`, `G2_acervo`.
