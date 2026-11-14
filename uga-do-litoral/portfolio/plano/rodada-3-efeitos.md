# Rodada 3 · cinco efeitos

**Objetivo:** somar ao que já existe cinco efeitos que só fazem sentido num site de fotógrafo de
show, sem tirar nada do coração. Pré-requisito: rodada 2 pronta (módulos em `js/`).

**Pronto quando:** cada efeito está num commit próprio, desliga sozinho por `?sem=`, respeita
"menos movimento", `node fumaca.mjs` passa, e o Pedro olhou cada um.

O `comparar.mjs` roda com "menos movimento", e todo efeito desta rodada se cala nesse modo. Então a
regra é: **`comparar` continua dando IGUAL** em tudo, menos na GRADE depois do 3.5 (que muda de
propósito). Se ele acusar diferença em outro lugar, um efeito vazou pro modo de menos movimento.

O gosto do Pedro em movimento: fluido, com easing, transição que carrega o movimento. Nada duro,
nada em degraus. A curva da casa é `--motion-ease: cubic-bezier(.2, 0, 0, 1)`; no GSAP, `power3.out`
e `power4.out` são as equivalentes.

---

## 3.0 Fundação: interruptor e "foto em foco"

Um commit, sem efeito visível.

**`js/effects.js`** — o interruptor:
```js
const off = new Set((new URLSearchParams(location.search).get('sem') || '').split(',').filter(Boolean));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const enabled = name => !off.has(name) && !off.has('tudo') && !reduce.matches;
```
Nomes: `tom`, `voo`, `revelacao`, `toque`, `contato`. `?sem=tudo` desliga todos. Cada efeito pergunta
`enabled('nome')` no momento de agir (não só na carga), pra obedecer se a pessoa ligar "menos
movimento" com a página aberta. O 3.5 é CSS: ele se liga por uma classe no `<html>` que o
`effects.js` põe ou tira.

**`js/focus.js`** — qual card está "em foco". Três efeitos dependem disso.
- Desktop (`(min-width:701px) and (pointer:fine)`): o card sob o cursor. Entra com 120 ms de espera
  (pra não piscar ao cruzar a pilha), sai na hora. Foco de teclado (`focusin`) também conta.
- Celular: o card cujo centro está mais perto do centro da tela. Calcular em `requestAnimationFrame`
  só quando houve rolagem, e só entre os cards que um `IntersectionObserver` marcou como visíveis.
  Trocar de card só quando o novo estiver pelo menos 40 px mais perto que o atual (histerese).
- Sem foco enquanto a intro não terminou, com diálogo aberto, ou na vista INFO.
- Efeito colateral único: a classe `em-foco` no card atual, e o evento
  `document.dispatchEvent(new CustomEvent('acervo:foco', { detail: { card, photo } }))`
  (`card` e `photo` são `null` quando ninguém está em foco; `photo` é `null` em card de filme).

---

## 3.1 `tom` · o fundo pega a luz da foto

**A ideia:** o fluido vermelho é a luz de palco da casa. Quando uma foto colorida entra em foco, o
fluido vira a luz daquela foto: azul na Nanda Tsunami, roxo no Vulgo FK. Foto P&B devolve o vermelho.

- **Dados:** rodar `python ../ferramentas/tons.py ../site-lab` e gravar o resultado como campo `tone`
  em cada foto de `js/data.js` (`"#0d56ff"` ou `null`). 23 fotos têm tom; 57 são P&B e ficam `null`.
  Confira com `--tabela` se nada soa absurdo (foto 0 azul, foto 1 vermelha, foto 9 roxa).
- **Fluido:** em `js/liquid.js`, dentro de `mount()`, criar `setTone(hex | null)` e expor
  (o `initLiquid()` devolve um objeto com ela; se o fluido não montou, devolve uma função vazia).
  Ela anima da cor atual até a alvo em 900 ms, `power2.out`, interpolando em RGB; a cada quadro da
  transição escreve `s.colors = [c, c, '#ffffff']` e `s.paletteKey = s.colors.join(',')` e chama
  `wakeRef.current?.()`. `null` significa `#ff0000`. A textura de paleta tem 256×1 pixels, refazer por
  quadro é barato.
- **Ligação:** em `main.js`, ouvir `acervo:foco`. Foto com `tone`: `setTone(tone)`. Sem foto ou sem
  tom: voltar ao vermelho depois de 700 ms sem novo foco colorido (pra não ficar piscando vermelho
  entre duas fotos coloridas vizinhas).
- **Galeria:** o diálogo é opaco e o fluido dorme atrás dele. Lá a luz é CSS: registrar
  `@property --tone { syntax: '<color>'; inherits: true; initial-value: #050505; }` e pôr no
  `#gallery-dialog` um fundo
  `radial-gradient(ellipse 70% 55% at 50% 46%, color-mix(in srgb, var(--tone) 24%, transparent), transparent 70%), #050505`
  com `transition: --tone 600ms`. `renderPhoto` define `--tone` na foto atual (`#050505` se `null`).
  Foto P&B fica sem brilho: neutro de propósito.
- **Menos movimento:** nada disso roda (o fluido nem monta). O `--tone` da galeria fica no valor inicial.

**Olhar** (2 prints, desktop): cursor em cima do card `[data-photo="0"]` por 1,5 s → fundo azul nas
frestas; galeria aberta na foto 0 → halo azul discreto atrás da foto, sem lavar o preto.

## 3.2 `voo` · a foto sai da colagem e vira a galeria

**A ideia:** hoje a galeria aparece de uma vez. Passa a ser a própria foto que sai do lugar, desentorta
e cresce até a tela. Ao fechar, ela volta pro lugar.

Sem plugin (o Flip foi apagado): GSAP comum e uma imagem-fantasma.

**Abrir:**
1. Medir o card: centro pelo `getBoundingClientRect()`, tamanho real por `offsetWidth/offsetHeight`
   da imagem (o retângulo do `getBoundingClientRect` de um elemento girado é a caixa envolvente, não
   serve pro tamanho), rotação por `getComputedStyle(card).rotate`.
2. `gallery.showModal()` com a classe `voando` no diálogo. Com ela: fundo do diálogo e `::backdrop`
   transparentes, `#gallery-image` com `visibility:hidden`, barra de cima, setas e miniaturas com
   `opacity:0`.
3. Criar o fantasma: `<img>` com `photo.small`, `position:fixed`, **dentro do diálogo** (o diálogo
   fica na camada de topo do navegador; um elemento fora dele ficaria escondido atrás). Posicionar
   exatamente em cima do card, com a mesma rotação. Esconder a imagem do card original
   (`visibility:hidden`) enquanto durar o voo.
4. Calcular o destino: a caixa onde a foto cai dentro de `#gallery-image` com `object-fit: contain`
   (usar a proporção `photo.width / photo.height` e o retângulo do elemento).
5. Animar o fantasma até o destino: posição e escala por `transform` (definir o fantasma já no tamanho
   final e escalar pra baixo no começo, pra a imagem não borrar no fim), rotação até 0. Duração 0,55 s,
   `power4.out`. Em paralelo: fundo do diálogo de transparente a `#050505` em 0,35 s; barra, setas e
   miniaturas sobem de opacidade a partir de 0,22 s.
6. No fim: tirar a classe `voando`, mostrar `#gallery-image` (que já está com a foto pequena por causa
   do 2.6, então não há salto), remover o fantasma, devolver a visibilidade da imagem do card.

**Fechar** (botão, clique fora, Esc): se o card da foto **atual** da galeria está na tela (pelo menos
30% visível) e a vista é pilha ou grade, fazer o voo inverso até ele, 0,42 s, `power3.inOut`, com o
fundo sumindo junto. Se não está na tela, só apagar o diálogo em 0,18 s. O Esc dispara o evento
`cancel` no diálogo: dar `preventDefault()`, animar e só então chamar `close()`, pra a limpeza que já
existe no evento `close` continuar valendo (foco de volta no card, `modal-open` fora do `body`).

**Cuidados:**
- Um sinalizador "em voo" ignora cliques e teclas até a animação terminar.
- Filmes não voam nesta rodada (o player abre como hoje).
- `enabled('voo')` falso: comportamento atual, sem fantasma.
- Na grade a rotação é 0; no celular a rotação da pilha é `calc(var(--r) * .6)`, o
  `getComputedStyle` já devolve o valor final.

**Verificação:** `fumaca` passa (ela espera a contagem e o foco de volta com folga de tempo).
**Olhar** 3 quadros do voo de abertura (a 0,1 s, 0,3 s e no fim): no meio a foto está entre os dois
lugares, girando; no fim está idêntica à galeria de sempre.

## 3.3 `revelacao` · a foto entra como foco sendo puxado

**A ideia:** ao rolar, cada foto chega fora de foco e superexposta e assenta nítida, como o instante em
que a lente acha o assunto. Substitui a entrada atual dos cards (o `animateIn` com `y:20`).

- CSS:
  ```css
  .media.latente > img, .media.latente > .preview { opacity: 0; filter: blur(12px) brightness(1.8) contrast(.8); transform: scale(1.05); }
  .media.revelando > img, .media.revelando > .preview { transition: opacity 320ms linear, filter 800ms var(--motion-ease), transform 900ms var(--motion-ease); }
  ```
  Enquanto latente, aparece o fundo `#090909` do card: papel ainda sem imagem.
- JS (`js/reveal.js`): quando a intro termina, marcar como `latente` todo card ainda não revelado. Um
  `IntersectionObserver` (`threshold: .15`, `rootMargin: '0px 0px -8% 0px'`) revela: troca `latente`
  por `revelando`, e tira `revelando` no `transitionend` do `transform`. Só revela quando a imagem já
  carregou (`img.complete`), senão espera o `load` dela. Cards que entram juntos saem em fila: 60 ms
  de atraso por posição, no máximo 240 ms.
- A classe `revelando` existe só durante a transição de propósito: o arrasto e o brilho no hover da
  grade usam `transform` e `filter` no mesmo elemento, e uma transição permanente atrapalharia os dois.
- Trocar entre COLAGEM e GRADE re-arma os cards que estão na tela (viram `latente` e revelam de
  novo): passa a ser a transição entre as duas vistas.
- A entrada da vista INFO continua como está (o `animateIn` fica só pra ela).
- Versão leve, sem `blur` (só opacidade e brilho), quando `navigator.connection?.saveData` ou
  `navigator.deviceMemory <= 2`.
- `enabled('revelacao')` falso: nenhum card recebe `latente`.

**Verificação:** `fumaca` passa. `medir.mjs`: os quadros por segundo rolando não podem cair mais que
uns 5 em relação ao fim da rodada 2. **Olhar** 1 print no meio de uma rolagem (cards de baixo ainda
borrados e claros, os de cima nítidos).

## 3.4 `toque` · a colagem viva no celular

**O problema medido:** no celular, por onde o público chega, não dá pra arrastar foto e o nome do
artista não aparece. O celular recebe a colagem morta.

**Nome do artista:** no CSS de celular, `.pile .media-label` hoje é `display:none`. Passa a aparecer
só no card `em-foco`: mesma faixa com degradê do desktop, subindo com opacidade em 180 ms. Um por vez.
Isso também vale com "menos movimento" (sem a transição): é informação, não enfeite.

**Segurar pra mover:**
1. `pointerdown` de toque num card da pilha arma um temporizador de 350 ms. Se o dedo andar mais de
   8 px antes disso, era rolagem: desarma.
2. Venceu o tempo: o card "levanta" (classe `levantado`: `scale: 1.04`, sombra maior, `z-index` no
   topo, 160 ms) e, onde existir, `navigator.vibrate?.(8)`.
3. Com o card levantado, o dedo arrasta. Reaproveitar a matemática de arrasto e os limites que já
   existem em `pile.js` (o `translate` e o mapa `offsets` funcionam igual na grade do celular).
4. Soltar: o card pousa onde ficou (160 ms), e o clique que viria em seguida é engolido, como já
   acontece no desktop.

**As armadilhas (é aqui que isso costuma quebrar):**
- O card é um `<a>` com imagem. Segurar o dedo abre o menu do sistema (Android) ou a prévia do link
  (iPhone). Em `.pile .media`: `-webkit-touch-callout: none; user-select: none;`, e
  `contextmenu` com `preventDefault()` quando veio de toque.
- O card tem `touch-action: pan-y`, então o navegador assume a rolagem assim que o dedo anda e manda
  um `pointercancel`. Pra segurar o gesto depois de levantar: registrar em cada card, na inicialização,
  um `touchmove` com `{ passive: false }` que chama `preventDefault()` **só** enquanto aquele card está
  levantado. Como o dedo não andou durante os 350 ms, a rolagem ainda não começou e o navegador obedece.
- `pointercancel` e `lostpointercapture` têm que pousar o card (já há tratamento parecido).
- Girar o aparelho ou trocar de vista zera as posições (já acontece: `resetPositions`).

**Dica, uma vez só:** abaixo da barra do acervo, no celular, a linha `segura uma foto pra tirar do
lugar` (mesma tipografia dos rótulos, cor `--muted`). Some na primeira vez que alguém levantar um
card, e não volta (guardar em `localStorage`, dentro de `try/catch`).

`enabled('toque')` falso: sem segurar-pra-mover e sem a dica; o nome em foco continua.

**Verificação:** escrever um teste curto com toque emulado (CDP `Input.dispatchTouchEvent`: tocar,
esperar 450 ms, mover 80 px, soltar) que confere `style.translate` do card e que a galeria não abriu;
e outro que confere que um toque rápido continua abrindo a galeria e que deslizar continua rolando a
página. **Dizer no relatório que em aparelho de verdade não foi testado**: este é o efeito que mais
precisa do celular do Pedro (deploy de prévia).

## 3.5 `contato` · a GRADE vira folha de contato

**A ideia:** a vista GRADE passa a ser uma folha de contato, o jeito como fotógrafo escolhe foto:
tiras de negativo lado a lado, numeração de quadro na borda, e a marca de lápis vermelho na escolhida.
A COLAGEM não muda.

Tudo sob `html.fx-contato .grid` (a classe vem do `effects.js`).

- **Tira:** as colunas colam (`column-gap: 0`), cada card vira um quadro da tira: fundo `#0b0b0b`,
  `padding: 30px 12px 0`, a foto centralizada sem cortar (`align-self: stretch`, imagem centrada na
  vertical). Linha a linha fica uma tira contínua; entre as tiras, `row-gap: 34px` de preto puro.
  Tirar o deslocamento `margin-top: 42px` do `:nth-child(4n+2)`.
- **Perfuração:** uma faixa de 12 px no topo e outra na base de cada quadro com furos: retângulos de
  cantos arredondados `#000` (8×5 px, a cada 16 px) sobre o `#0b0b0b`. Um SVG em `data:` repetido em
  `background-image` resolve sem elemento extra.
- **Borda de cima** (`::before`): numeração por contador CSS, no estilo de borda de filme:
  `counter-increment: quadro; content: counter(quadro, decimal-leading-zero) "   ▸   " counter(quadro, decimal-leading-zero) "A";`
  Mono 8 px, `letter-spacing: .12em`, cor `rgb(242 240 235 / .5)`.
- **Borda de baixo:** é o `.media-label` que já existe (artista à esquerda, número à direita), agora
  dentro da tira, mesma cor da borda de cima. No fim da tira, à direita do último quadro de cada
  linha, nada: não inventar marca de fabricante.
- **Filmes:** continuam ocupando duas colunas, mesma tira, rótulo `FILME`.
- **Lápis vermelho:** no card em foco (cursor no desktop, `em-foco` no celular, foco de teclado), um
  traço de lápis dermatográfico contorna a foto, desenhando-se em 420 ms com `--motion-ease`. Um único
  `<svg class="lapis">` é movido pra dentro do card em foco (`position:absolute; inset` na área da
  foto, `pointer-events:none`), `viewBox="0 0 100 100"`, `preserveAspectRatio="none"`. O traço:
  `fill:none; stroke:#fa1717; stroke-width:3; vector-effect:non-scaling-stroke; stroke-linecap:round; opacity:.9`,
  com `pathLength="1"`, `stroke-dasharray:1` e `stroke-dashoffset` de 1 a 0. Três desenhos, escolhidos
  por `índice % 3`, pra não parecer carimbo:
  ```
  M6,9 C28,4 71,5 95,7 C97,30 96,70 94,93 C70,97 30,96 5,94 C3,70 4,32 7,6 C9,5 14,4 19,5
  M4,7 C30,5 68,3 96,6 C94,34 97,66 95,95 C66,93 33,97 6,95 C5,64 3,36 5,5 C8,4 12,6 17,4
  M7,5 C36,7 64,4 94,8 C96,38 93,62 96,92 C62,96 38,93 4,96 C6,66 4,34 6,8 C10,6 15,7 21,5
  ```
  Com "menos movimento" o traço aparece pronto, sem se desenhar.
- **Celular:** duas colunas, tiras de dois quadros; faixas de perfuração de 9 px.
- O bloco `<noscript>` do `<head>` não muda (sem JS não há classe `fx-contato`, a grade fica como hoje).

Este é o único efeito que muda a GRADE em repouso. `comparar` vai dar DIFERE nas duas telas `grade`
e **só nelas**. **Olhar** os dois prints da grade (celular e desktop): tem que parecer folha de
contato de verdade, com as fotos inteiras e com as cores intactas.

---

## Fechamento

1. `node fumaca.mjs ../site-lab --rede`, `node comparar.mjs` (DIFERE só em `grade`), `node medir.mjs`.
2. Conferir cada interruptor: `?sem=tom`, `?sem=voo`, `?sem=revelacao`, `?sem=toque`, `?sem=contato`,
   `?sem=tudo`. O `comparar` não passa parâmetro, então confira com um print
   (`node foto.mjs "?sem=tudo#fotos" saida/sem-tudo.png`) que a grade volta ao que era.
3. Linha no `../andamento.md`.
4. Relatório ao Pedro, com a lista dos cinco e o link de cada um desligado, pra ele comparar:
   `http://localhost:4174/?sem=voo` etc. Pedir o teste no celular dele pro 3.4.

## Textos novos desta rodada

| onde | texto |
|---|---|
| dica no celular, abaixo da barra do acervo | `segura uma foto pra tirar do lugar` |
| borda da folha de contato | só números de quadro (`01 ▸ 01A`), sem palavra nenhuma |
