# Rodada 5 · o bastidor vira protagonista, e o site nunca abre igual

Escrito em 2026-11-11 pelo Fable 5.2, a partir das críticas do Pedro depois de testar a prévia das
rodadas 2 a 4. Quem executa é o Opus. Leia antes `LEIA-PRIMEIRO.md`; não precisa reler as rodadas 2 a 4.

**Pronto quando:** os sete passos abaixo estão no `lab`, um commit cada, e passam `fumaca.mjs`,
`toque.mjs`, `bastidor.mjs` e `bastidor-planta.mjs` (ajuste os testes onde o passo mandar).
O `comparar.mjs` deixou de ser referência: o lab já diverge do site no ar de propósito.

## O que o Pedro pediu, e o veredito

| crítica | veredito |
|---|---|
| Bastidor como protagonista, no lugar do ACERVO na navegação | Válida. Hoje ele é o 3º item de um seletor pequeno. Passo 5.1 |
| Tela de carregamento rápida antes do portfólio | Válida. A home pinta sem fonte e sem foto por um instante. Passo 5.2 |
| Tirar das fotos os "zero barra" (`01`, `01 / 03`, `04 ▸ 04A`, `ALA 03 / 29`) | Válida, e a culpa é do plano: numeração com zero à esquerda e barra é tique de template. Passo 5.3 |
| Ordem e distribuição das fotos diferentes a cada visita | Válida e viável: as vagas da colagem ficam, as fotos trocam de vaga. Passo 5.4 |
| No bastidor só dá pra olhar 180°, tem que andar de ré | Válida, erro do plano (limitei o giro a ±70°). Passo 5.5 |
| Clicar na setlist colada na parede da entrada, como um mapa | Válida. Hoje a folha é enfeite. Vira objeto clicável e a setlist ganha um mapa. Passo 5.6 |
| O som de batida repetida é ruim; ele vai mandar 3 beats | Válida, erro do plano (bumbo sintetizado em laço de 1,7 s). Passo 5.7, **depende dos arquivos dele** |
| Setlist em ordem diferente a cada visita | Viável: sorteia a ordem das alas no corredor. Entra no passo 5.4 |

Sobre o trabalho do Opus nas rodadas 2 a 4: seguiu o plano, com testes e commits por passo. Três
limpezas pequenas ficam pra esta rodada (passo 5.8).

**Regra desta rodada:** nada de numeração com zero à esquerda nem contador com barra em lugar nenhum
visível. Onde um número informa de verdade, escrever por extenso curto (`2 de 5`).

---

## 5.1 Navegação: BASTIDOR no lugar do ACERVO

Hoje: `ACERVO | UGA DO LITORAL | INFO`. Passa a ser `BASTIDOR | UGA DO LITORAL | ACERVO  INFO`.

- `index.html`, dentro de `.site-header nav`: o primeiro link vira
  `<a href="./bastidor.html" class="nav-bastidor">BASTIDOR</a>` (link comum, sem `data-view`).
  À direita, um `<span class="nav-dir">` com `ACERVO` (`href="#fotos" data-view="fotos"`) e `INFO`.
- `style.css`: a grade do nav passa de `80px auto 80px` pra `1fr auto 1fr` (e a versão de celular
  idem), com o item da esquerda alinhado à direita da sua coluna e `.nav-dir` (`display:flex; gap:18px`)
  alinhado à esquerda da sua, pra a marca seguir no centro exato. `.nav-bastidor` em `#fa1717`, com um
  ponto vermelho pulsando antes do texto (`::before`, 5 px, animação de opacidade de 1,7 s; parado com
  menos movimento). Em 390 px tem que caber sem quebrar: `BASTIDOR`, a marca, `ACERVO INFO`. Se
  apertar, reduzir `gap` e `letter-spacing` antes de reduzir a letra.
- Tirar o item `BASTIDOR` do `.view-switch` (volta a ser só COLAGEM e GRADE). A faixa-porta no fim do
  acervo fica.
- `bastidor.html`/`hud.js`: o `← ACERVO` continua, e a tela de entrada ganha a marca `UGA DO LITORAL`
  no topo, centrada, como link pra `./#inicio`.
- `fumaca.mjs` não depende do nav; conferir com um print em celular e desktop.

## 5.2 Cortina de carregamento na home

Uma cortina preta que cobre a página até o essencial chegar, e abre.

- Marcação logo depois do `<body>`: `<div id="cortina" aria-hidden="true"><span class="cortina-marca">UGA DO LITORAL</span><span class="cortina-linha"><i></i></span></div>`.
- O CSS da cortina vai **inline no `<head>`** (um `<style>` curto), pra pintar antes do `style.css`:
  `position:fixed; inset:0; z-index:2000; background:#000; display:grid; place-content:center; gap:18px`;
  marca em Arial negrito 22 px, `letter-spacing:-.06em`, cor `#f2f0eb`; linha de 120×2 px `#ffffff22`
  com o `<i>` vermelho `#fa1717` crescendo por `transform: scaleX()` (origem à esquerda).
  `body.cortina-fora #cortina { opacity:0; visibility:hidden; transition: opacity 450ms, visibility 0s 450ms }`.
  No `<noscript><style>` existente: `#cortina{display:none}`.
- `js/curtain.js` (importado primeiro no `main.js`): a linha anda até 90% em 900 ms por conta própria;
  a cortina sai quando **tudo** isto aconteceu: `document.fonts.ready`, as imagens `loading="eager"`
  decodificadas (`Promise.allSettled(img.decode())`), e pelo menos 500 ms na tela. Teto de 2.500 ms:
  passou disso, sai de qualquer jeito. Ao sair: linha a 100%, classe `cortina-fora` no `body`, e remove
  o elemento depois da transição. Com menos movimento: sem transição.
- A cortina não bloqueia nada do resto (`portfolioReady` continua sendo marcado como hoje).
- Chegando com `#fotos` ou `#info`, vale igual.
- Conferir: `fumaca.mjs` passa (ela usa cliques por código e esperas; se algum clique real cair na
  cortina, esperar `body.cortina-fora` no começo de cada bloco do teste).

## 5.3 Fora os "zero barra"

| onde | hoje | fica |
|---|---|---|
| rótulo do card (`tools/build-acervo.mjs`) | `Nanda Tsunami` + `01` | só o nome. Tirar o `<span>` do número das fotos. Nos filmes o `FILME` fica |
| contador da galeria (`js/gallery.js`) | `01 / 03` | `1 de 3`; galeria de uma foto só: vazio |
| borda de cima da folha de contato (`style.css`, `::before` com `counter(quadro…)`) | `04 ▸ 04A` | remover o `::before` e o contador. A tira fica só com a perfuração e o nome embaixo |
| barra do acervo | `80 FOTOGRAFIAS / 5 FILMES` | `80 FOTOGRAFIAS · 5 FILMES` (no gerador) |
| legenda do bastidor (`hud.js`) | `02 / 05` | `2 de 5`; ala de uma foto: vazio |
| ala no passeio (`hud.js`) | `ALA 03 / 29` + nome | só o nome, com o rótulo `ALA` pequeno em cima, sem número |
| setlist (`main.js`, `hud.js`) | `01`, `02`… antes de cada nome | sem número. Filmes mantêm `▶`, palco mantém `→` |
| folha de setlist pintada (`textures.js`) | `01`… | sem número |
| estêncil da ala na parede (`dressing.js`) | `MATUÊ · 20` | só `MATUÊ` |

Depois: rodar `node tools/build-acervo.mjs`, regravar `ferramentas/referencia/dom-acervo.txt`
(`node dom.mjs ../site-lab --sem-js > referencia/dom-acervo.txt`) e ajustar em `fumaca.mjs` as esperas
que procuram `01 /` e `02 /` (passam a procurar `1 de` e `2 de`) e em `bastidor.mjs` o botão da
setlist buscado por `/^25/` (buscar por um nome de ala do fim da lista, lido de
`window.__bastidor.plan.alas`).

## 5.4 Nunca igual: colagem e corredor sorteados a cada visita

**Colagem (home).** As 85 vagas de arte (`layout`: posição, largura, giro) não mudam: é a composição.
O que muda é **qual foto ocupa qual vaga**.

- `js/shuffle.js`: sorteio com semente (`mulberry32`) e Fisher-Yates. A semente nasce de
  `crypto.getRandomValues` a cada carregamento; `?semente=123` na URL fixa a semente (pra teste e print).
- As fotos só trocam entre vagas de **mesma proporção**, senão a composição quebra. Medido: 53 vagas
  de foto em pé 2:3 (0,67 e 0,68), 25 em 3:4 (0,75), e 2 avulsas (0,84 e 1,5) que não se mexem.
  Classe = `Math.round(width / height * 20)`, juntando 0,67 e 0,68 na mesma.
- Os 5 filmes ficam onde estão.
- Como: `initShuffle(ctx)` roda no `main.js` **antes** dos outros módulos lerem os cards. Para cada
  classe, sorteia uma permutação e troca, entre os cards, as variáveis de vaga (`--x --y --w --r --z`)
  e a posição no DOM (a ordem do DOM é a ordem da grade e da coluna do celular). Cada card continua
  sendo a mesma foto com seus próprios `data-*`; quem muda de lugar é o card inteiro.
- Depois da troca, as 7 primeiras fotos na ordem do DOM recebem `loading="eager"` e as outras `lazy`.
- A cortina (5.2) cobre a troca, então ninguém vê as fotos pulando.
- Sem JavaScript, a ordem é a do HTML (a de hoje). Tudo bem.
- Cuidado: artistas com muitas fotos (Matuê tem 20) podem cair lado a lado. Depois do sorteio, uma
  passada simples: se dois cards vizinhos na ordem do DOM são do mesmo `data-artist`, trocar o segundo
  com o próximo card da mesma classe que seja de outro artista. Uma passada só; não precisa ser perfeito.

**Corredor (bastidor).** A ordem das alas é sorteada a cada visita, e com ela a setlist.

- `bastidor/plan.js`, `wings()`: recebe um gerador aleatório opcional e embaralha a lista de alas
  antes de numerar. `layout()` repassa. `main.js` cria o gerador com a mesma regra de semente.
  Dentro de cada ala a ordem das fotos continua a da galeria.
- A setlist (overlay e folha pintada) já é montada a partir de `plan.alas`, então acompanha sozinha.
- Os filmes ficam nos mesmos fundos de lance.
- `bastidor-planta.mjs` continua valendo (não passa gerador: ordem fixa) e ganha uma checagem: com
  duas sementes diferentes, a ordem das alas difere e as 80 fotos continuam todas presentes.

## 5.5 Olhar em 360° e andar pra onde se olha

Hoje o giro vai só a ±70° (mouse) e ±80° (toque), e pra voltar é de ré. Passa a ser livre.

**Regra nova de movimento:** "frente" é pra onde a câmera aponta. `olhar = st.yaw` (ângulo em relação
ao rumo do trilho). `sentido = Math.cos(st.yaw) >= 0 ? 1 : -1`. `W` soma `sentido` à velocidade no
trilho, `S` subtrai. O passo lateral (`A`/`D`) também multiplica por `sentido`. Quem olha pra trás e
aperta `W` anda pra trás no corredor, de frente.

**Desktop** (`controls.js`):
- O giro vira acumulado e sem limite. Trocar o "ângulo = posição do cursor" por **giro pelas bordas +
  posição no miolo**: no miolo da tela (60% central) vale o comportamento atual, só que em torno de
  um `yawBase`; quando o cursor entra nos 20% de cada lado, `yawBase` gira continuamente pro lado
  dele, até 150°/s, proporcional a quanto entrou na faixa. `yawTarget = yawBase + (posição no miolo)·45°`.
- Arrastar com o botão esquerdo também gira (`yawBase += dx · 0,25°`), pra quem prefere. Um arrasto
  com mais de 6 px não conta como clique.
- Teclas `Q` e `E` giram 90° suaves; `R` (ou `Espaço`) faz meia-volta de 180° em 0,5 s.
- A inclinação (olhar pra cima e pra baixo) continua em ±20°.

**Celular:**
- Arrastar pro lado acumula giro sem limite (tirar o `clamp` de ±80°). O retorno automático depois
  de 1,8 s passa a levar ao **eixo mais próximo** (0° ou 180°), não sempre a 0°.
- Arrastar pra cima anda no `sentido` do olhar.
- Um botão redondo `↻` na barra do passeio (`aria-label="Virar pra trás"`) faz a meia-volta.
- O olhar assistido soma ao eixo atual e inverte o lado quando a pessoa está virada (a parede
  esquerda do trilho fica à direita de quem anda de costas pro palco).

**O resto que depende do sentido** (`main.js`):
- Corte de desenho: hoje desenha de 12 m atrás a 28 m à frente no trilho. Passa a usar
  `ds · sentido` no lugar de `ds`, com a mesma janela, pra o que está na frente do olhar aparecer.
  Enquanto o giro passa de lado (|cos| < 0,35), usar janela simétrica de ±20 m.
- Texturas (`prints.update`): mesma ideia, 12 m no sentido do olhar e 6 m no contrário.
- Filme do lance: continua o do lance atual.
- Ao sair de um foco ou de um filme, a câmera volta com `yaw = 0` se estava de frente e `π` se estava
  de costas (guardar o `sentido` na entrada do foco).
- O fim só dispara andando pra frente (`sentido === 1`) nos últimos 2,5 m.
- `?olhar=` continua valendo como giro inicial.

**Teste** (`bastidor.mjs`, um passo novo): meia-volta com `R`, segurar `W` por 1 s e exigir que `s`
**diminuiu**; outra meia-volta e exigir que volta a crescer. E o passo de orçamento de chamadas mede
também com giro de 180°.

## 5.6 A setlist da parede vira mapa clicável

- **Clicar na folha:** a folha colada na entrada (`dressing.js`, a malha `sheet`) ganha
  `userData.setlist = true` e entra nos alvos do `world.pick`. Clique ou toque nela (a até 6 m) abre
  a setlist. Pra convidar o clique: dobrar o tamanho (0,84 × 1,2 m, centro a 1,5 m), uma poça de luz
  própria como a das fotos, e no desktop o cursor vira `pointer` quando passa sobre fotos, telas e a
  folha (um `pick` a cada 100 ms no `pointermove`, só com os controles ligados).
- **A folha na tela de entrada:** depois de `ENTRAR`, a dica de controles ganha a linha
  `clica na setlist da parede pra escolher onde ir`.
- **O mapa:** a setlist (overlay) ganha, acima da lista, a planta do corredor em SVG: a serpentina dos
  6 lances desenhada a partir de `AXIS` (traço off-white de 2 px, cantos arredondados), um ponto por
  ala na posição real dela (`firstOf.get(ala).s` convertido em ponto do trilho com `rail.at`), um
  quadradinho por projeção, a porta do palco no fim, e um ponto vermelho pulsando em "você está aqui".
  Passar o cursor (ou focar) num nome da lista acende o ponto dele no mapa, e clicar num ponto do
  mapa faz o mesmo que clicar no nome. Em celular o mapa fica em cima, com 34vh de altura.
- A folha pintada (`textures.js`) passa a ter o mesmo desenho da serpentina em miniatura no rodapé,
  pra ser de fato o "mapazinho" que ele descreveu.

## 5.7 Som: os beats do Pedro como show do outro lado da parede

**Bloqueado até o Pedro mandar os 3 arquivos.** Ele disse que são livres pra uso; anotar no
`vendor/CREDITOS-AUDIO.md` o nome de cada faixa, de quem é e de onde veio, com o que ele informar.

- Enquanto os arquivos não chegam, fazer só isto: **tirar o bumbo sintetizado** de `sound.js`. Fica a
  plateia (ruído filtrado) e o pulso das luzes num relógio lento e irregular (a cada 2 a 5 s, um
  respiro de 1,2 s), que é melhor do que a batida repetida.
- Quando chegarem: converter pra `assets/audio/beat-1.mp3`, `beat-2.mp3`, `beat-3.mp3` (mp3 128 kbps,
  mono, com `ffmpeg`, que está instalado; normalizar com `loudnorm`). Nada de carregar na entrada:
  `fetch` + `decodeAudioData` só depois de `ENTRAR COM SOM`, a primeira faixa antes, as outras em
  segundo plano.
- **A cadeia de som** (`sound.js`): faixa → passa-baixa (o mesmo que abre de 130 a 1.100 Hz conforme
  a pessoa avança) → **eco de sala**: um `ConvolverNode` com resposta ao impulso gerada por código
  (ruído com decaimento exponencial de 2,4 s, sem arquivo) misturado 55% eco, 45% direto, mais um
  `DelayNode` de 0,31 s com realimentação de 0,28 pra o rebatimento de ginásio → volume geral.
- **Qual faixa toca:** uma por vez, em sequência sorteada (com a semente da visita), com passagem de
  3 s entre elas quando uma termina; nunca a mesma duas vezes seguidas.
- **Pulso das luzes de verdade:** um `AnalyserNode` na saída da faixa (antes do filtro); a cada
  quadro, a energia das bandas abaixo de 150 Hz, com ataque rápido e queda de 180 ms, vira o `pulso`
  que o vermelho e a fresta do palco já usam. Sem som ligado, vale o relógio lento do item acima.
- No fim (porta abrindo), o filtro abre até 6 kHz e o eco cai pra 20% em 1,2 s: a porta abriu, o som
  fica claro.

## 5.8 Limpezas

- `dressing.js`, bloco do zebrado: há atribuições repetidas e uma geometria criada e descartada.
  Deixar uma criação só, com o tamanho e a rotação finais.
- `effects.js`: o comentário do topo ainda diz que "contato" some com menos movimento em um trecho;
  alinhar o texto com o que o código faz.
- `plano/rodada-4-bastidor.md` diz 28 alas; são 29. Corrigir o número.

---

## Fechamento

1. Rodar os quatro testes. 2. Linha no `../andamento.md`. 3. Relatório ao Pedro com o que mudou em
cada item da tabela do topo, dizendo com clareza que o 5.7 completo espera os arquivos dele, e
oferecendo a prévia pra ele testar no celular (giro, setlist clicável e cortina são coisas de sentir
na mão).

## Textos novos desta rodada (propostas)

| onde | texto |
|---|---|
| navegação | `BASTIDOR` · `ACERVO` · `INFO` |
| contadores | `1 de 3` |
| barra do acervo | `80 FOTOGRAFIAS · 5 FILMES` |
| dica do bastidor, linha extra | `clica na setlist da parede pra escolher onde ir` |
| botão no celular | `↻` (rótulo acessível: `Virar pra trás`) |
| mapa | `VOCÊ ESTÁ AQUI` |
