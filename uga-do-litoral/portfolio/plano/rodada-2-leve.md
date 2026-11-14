# Rodada 2 · mais leve, mesma cara

**Objetivo:** o site abre mais rápido e o código fica organizado em módulos, **sem o visitante notar
diferença visual**. É a base das rodadas 3 e 4. Trabalho só em `site-lab/` (branch `lab`).

**Pronto quando:** `node fumaca.mjs` passa inteiro, `node comparar.mjs` diz IGUAL nas 8 telas (as
exceções estão marcadas nos passos), e `node medir.mjs` mostra, no celular, carga inicial **abaixo de
900 KB** (hoje 1.747) e `hls.min.js` fora da carga inicial.

**Ritual de cada passo:** fazer, rodar `fumaca` e `comparar`, commitar. Se o `comparar` acusar
diferença num passo que devia ser invisível, o passo está errado: corrigir antes de seguir.

Antes de começar, confirme o ponto de partida: `node fumaca.mjs && node comparar.mjs` (os dois passam
hoje).

---

## 2.1 Tirar o que não é usado

- Apagar `vendor/ScrollTrigger.min.js` e `vendor/Flip.min.js`. Nada referencia (conferido por busca).
- Em `fonts.css`, apagar os três `@font-face` de Barlow Condensed e os arquivos `assets/font-0.ttf`,
  `font-1.ttf`, `font-2.ttf`. Nenhuma regra de `style.css` usa essa família.

Invisível. `comparar` tem que dar IGUAL.

## 2.2 Uma fonte só pros dados, e o HTML do acervo gerado

**O problema:** a posição e o rótulo de cada card existem duas vezes. O `index.html` traz 85 cards
escritos à mão com valores **velhos** (ex.: `--pile-height:684.50`), e o `app.js` (linhas 25–72)
reescreve tudo na carga a partir do `gallery-data.js` (altura real: 838). Quem está sem JavaScript vê
uma colagem diferente da real. Mudar a colagem hoje é mexer em dois lugares.

**O alvo:** os dados moram num módulo, um script gera o trecho do HTML, e o JS da página para de
reescrever o que já veio pronto.

1. Criar `site-lab/js/data.js` (módulo ES, importável também pelo Node). **Não copie os 32 KB na mão:**
   escreva um script descartável que carrega `gallery-data.js` e `video-data.js` com `node:vm`
   (`window = {}`) e grava o arquivo. Conteúdo:
   - `export const photos` — as 80 fotos com os campos atuais **mais** os derivados já resolvidos
     (`artistKey`, `artist`, `galleryId`, e o `title` final, que hoje é corrigido em tempo de execução).
     Uma foto por linha, pra o diff ficar legível.
   - `export const films` — os 5 filmes, juntando `PORTFOLIO.films` (id do Drive, `ratio`) com
     `VIDEO_MEDIA` (`stream`, `preview`, `poster`, `width`, `height`, `title`). Um objeto por filme.
   - `export const layout` — o `publishedLayout` como está, e `export const PILE_HEIGHT = 838`.
   - `export const galleries`, `photoOrder`, `mediaOrder` — calculados no próprio módulo a partir do
     que está acima (são poucas linhas; a lógica está no fim do `gallery-data.js`).
   `normalizeArtist` e a tabela `names` deixam de ser necessárias depois que os derivados estão gravados.
2. Criar `site-lab/tools/build-acervo.mjs`: importa `../js/data.js` e reescreve, no `index.html`, o
   trecho entre dois marcadores que você insere (`<!-- acervo:start -->` e `<!-- acervo:end -->`,
   em volta dos 85 cards), o `--pile-height` da seção e o texto do contador (`80 FOTOGRAFIAS / 5 FILMES`,
   calculado). Um card por linha, na ordem de `mediaOrder`. Rodar duas vezes seguidas não muda nada.
   Acrescentar `tools/**` ao `.vercelignore`.
3. **O gabarito** do que cada card deve conter é `ferramentas/referencia/dom-acervo.txt`: o DOM que o
   site atual produz depois que o JS roda (já capturado). O HTML gerado tem que chegar nele.
4. No JS, apagar o bloco que reescreve cards (rótulos, `data-*`, reordenação, layout, altura). O JS
   passa a só ler o DOM. O que continua em tempo de execução: nada disso.
5. Apagar `gallery-data.js` e `video-data.js` quando ninguém mais os carregar (pode ser neste passo,
   importando `js/data.js` com um `<script type="module">` provisório que preenche `window.PORTFOLIO`
   e `window.VIDEO_MEDIA`, ou junto do 2.3; escolha o caminho de menor risco).

**Verificação:**
`node dom.mjs ../site-lab > saida/dom-agora.txt && diff referencia/dom-acervo.txt saida/dom-agora.txt`
sem nenhuma linha de saída. E `node dom.mjs ../site-lab --sem-js` agora deve dar **o mesmo** resultado
(antes dava 172 linhas de diferença). `comparar` IGUAL.

Cuidado: nos cards de filme, `poster` e `data-src` hoje ficam sem o `./` depois do JS
(`assets/film-0-poster.jpg`); siga o gabarito. O `&` de "Ryu & KayG" é `&amp;` no HTML.

## 2.3 Quebrar o `app.js` em módulos

Mover, não reescrever. O comportamento de cada linha fica igual; muda o endereço dela.

```
site-lab/js/
  main.js       entrada: importa tudo, liga os módulos, dispara portfolio:ready
  data.js       (do 2.2)
  intro.js      o intro.js atual
  liquid.js     o liquid-ether.js atual, sem reformatar (o diff deve ser só o invólucro e o export)
  views.js      setView, animateIn, hash, título da aba
  pile.js       arrastar, z-index no hover, offsets, resetPositions
  previews.js   as prévias de filme (IntersectionObserver, no máximo 2 tocando)
  gallery.js    openPhoto, renderPhoto, step, miniaturas, teclado, swipe
  film.js       openFilm, destroyFilm, hls
```

- `index.html` passa a carregar `vendor/gsap.min.js` (clássico, `defer`, como hoje) e
  `<script type="module" src="./js/main.js">`. Script de módulo e script com `defer` executam na ordem
  em que aparecem no documento, então `window.gsap` existe quando o módulo roda, desde que a tag do
  GSAP venha antes. O `hls.min.js` continua como tag clássica até o 2.4.
- Acrescentar `<link rel="modulepreload" href="./js/...">` pra cada módulo, pra não virar cascata de
  downloads.
- Estado compartilhado mora no módulo dono: `offsets`, `drags` e o contador `z` em `pile.js`; `opener`
  e `activeGallery` em `gallery.js`; `hlsPlayer` em `film.js`. O que um módulo precisa do outro entra
  por parâmetro na criação (ex.: `previews` precisa saber se há diálogo aberto; `pile` recebe o
  `onOpen(card)`).
- `film.js` deve expor uma função que abre um filme a partir do **objeto de dados** (não só de um
  card), porque a rodada 4 vai reaproveitar o player em outra página.
- Manter o contrato de DOM, os globais e os eventos listados em `LEIA-PRIMEIRO.md`.
- Manter os tratadores de `pagehide`/`pageshow` (volta pelo cache do navegador): estão no fim do
  `app.js` e no fim do `intro.js`.
- Apagar `app.js`, `intro.js` e `liquid-ether.js` da raiz ao final. Atualizar o cabeçalho de licença:
  o crédito do React Bits segue no topo de `js/liquid.js`.

Invisível. `fumaca` e `comparar` têm que passar. Este é o passo de maior risco da rodada: se a
`fumaca` falhar em algo que não está claro, compare com o comportamento do `site/` antes de inventar.

## 2.4 Player de filme só quando alguém abre um filme

Hoje `vendor/hls.min.js` (605 KB) é baixado por todo visitante.

- Tirar a tag do `index.html`. Em `film.js`, uma função memorizada que injeta o script e devolve uma
  promessa (`carregarHls`).
- Regra de quem precisa da biblioteca: se o `<video>` responde a
  `canPlayType('application/vnd.apple.mpegurl')` **e** não existe `window.MediaSource` (caso do
  iPhone), usar o HLS nativo e não baixar nada. Nos outros casos, baixar o hls.js e seguir como hoje.
  Isso preserva o comportamento atual no desktop e poupa 605 KB no iPhone.
- Aquecer: no primeiro `pointerenter`, `touchstart` ou `focus` de um card de filme, já começar o
  download, pra o clique não esperar.
- Se o download falhar, cair no mesmo aviso de hoje (`unavailable()`). Se o diálogo foi fechado antes
  de a biblioteca chegar, não montar nada.

**Verificação:** `node fumaca.mjs ../site-lab --rede` (precisa de internet). A linha do filme deve
dizer `hls.js pedido antes do clique: nao` e `stream carregou`.

## 2.5 Pôster de filme só perto da tela

Os 5 pôsteres (232 KB) carregam na entrada porque estão no atributo `poster`.

- No HTML gerado, trocar `poster` por `data-poster` nos cards de filme. Em `previews.js`, um
  `IntersectionObserver` com `rootMargin: '100% 0px'` copia pra `poster` quando o card chega a uma
  tela de distância.
- Pra quem está sem JavaScript: dentro de cada card de filme, um
  `<noscript><img src="(pôster)" alt="" width height></noscript>`, e no `<noscript><style>` do
  `<head>` uma regra escondendo o `<video>` vazio. Assim o pôster continua aparecendo sem JS.
- Atualizar o gerador (2.2) pra emitir isso.

`comparar` deve dar IGUAL (ele rola a página inteira antes do print). Se o gabarito de DOM mudar por
causa de `data-poster`, regrave `referencia/dom-acervo.txt` neste commit e diga isso na mensagem.

## 2.6 Galeria: a foto aparece na hora

Abrir uma galeria hoje espera a foto grande (média de 570 KB cada).

- Em `renderPhoto`: mostrar primeiro `photo.small` (já está em cache, é a mesma do card) e carregar a
  grande por fora (`new Image()`, com `fetchPriority = 'high'`); quando ela decodificar
  (`img.decode()`), trocar o `src`. Um contador de "pedido atual" evita que uma foto antiga substitua
  a nova quando a pessoa avança rápido.
- Manter o pré-carregamento da próxima foto que já existe.
- Não trocar a animação de entrada da foto (o `fromTo` de 0,22 s).

Sem mudança no resultado final. `fumaca` exige que a imagem termine na versão grande; `comparar` IGUAL.

## 2.7 Fontes em WOFF2

- `pip install fonttools brotli`. Converter os quatro Manrope (`font-3` a `font-6`, pesos 400, 500,
  600, 700) com `pyftsubset`, `--flavor=woff2`, `--layout-features='*'`, e este recorte de caracteres:
  `U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026`.
- `fonts.css`: `src: url(...woff2) format('woff2')`. Apagar os `.ttf`. Manter `font-display: swap`.
- Esperado: de ~95 KB pra ~20 KB por peso.

`comparar` IGUAL. Se algum caractere cair pra fonte reserva, o comparador acusa: alargue o recorte.

## 2.8 Cabeça da página e cache

- **Prévia do link** (hoje o site vai sem imagem no WhatsApp): `og:title`, `og:description`,
  `og:type=website`, `og:url=https://ugadolitoral.vercel.app/`, `og:image=https://ugadolitoral.vercel.app/og.jpg`,
  `og:image:width=1200`, `og:image:height=630`, `twitter:card=summary_large_image` e
  `<link rel="canonical">`. Descrição: a `meta description` que já existe.
- **`og.jpg`:** é a própria intro do site, fotografada. Com o Playwright das ferramentas: viewport
  1200×630, abrir o lab, esperar 3 s, `page.screenshot({ type:'jpeg', quality:88 })`, salvar em
  `site-lab/og.jpg`. **Olhar** o resultado uma vez: se a mancha do fluido estiver feia em cima do nome,
  tirar outra. Não usar o `og.jpg` do commit `df4f059`: aquele é da rodada que o Pedro reverteu.
- **Título da aba:** trocar o travessão por ponto médio, `Uga do Litoral · Pedro Augusto`, no HTML e
  em `views.js` (os três títulos). O Pedro não usa travessão em texto nenhum. É a única mudança
  visível desta rodada; cite no relatório.
- **`vercel.json`:** em `/assets/(.*)` trocar por
  `public, max-age=604800, stale-while-revalidate=2592000`, e criar a mesma regra pra `/vendor/(.*)`.
  Os nomes de arquivo não têm versão, por isso 7 dias e não "pra sempre".

## 2.9 Fluido que se protege em aparelho fraco

Não dá pra medir celular daqui, então o fundo ganha um freio automático que só age onde precisa.

- No laço de `js/liquid.js`: média móvel do tempo de quadro. Se passar de 24 ms por 90 quadros
  seguidos e `s.resolution` for maior que 0,25, fazer `s.resolution = Math.max(.25, s.resolution * .75)`,
  chamar o `resize()` interno e zerar a contagem. Nunca sobe de volta.
- Gravar o valor em `canvas.dataset.quality`, pra dar pra ver de fora.
- Em aparelho bom nada muda. `comparar` IGUAL (ele roda com o fluido desligado), `fumaca` passa.
- Teste honesto: baixe o limite pra 1 ms por um instante, confirme que `data-quality` desce em degraus
  e que o fundo continua bonito num print, e volte o limite. Diga no relatório que em celular real
  isso **não foi testado**.

## 2.10 Opcionais **[decisão do Pedro]**

Não executar sem ele pedir. Apresentar no relatório da rodada como perguntas.

- **(a) Fotos médias pra celular.** As grandes têm de 1.365 a 1.800 px de largura; um celular precisa
  de ~1.100. Dá pra gerar uma versão `-md` (1.080 px de largura, WebP qualidade 90, a partir da
  grande) e servir no celular: cada foto da galeria cairia de ~570 KB pra perto de 200. O risco é
  amolecer o grão, que é parte da linguagem dele. Por isso: gerar só 4 fotos de teste (`photo-40`
  vermelha com grão, `photo-48` azul lisa, uma P&B de alto contraste, uma `matue-sanca`), montar uma
  página `teste-qualidade.html` no lab com as duas versões lado a lado no tamanho de celular, sem
  dizer qual é qual, e deixar ele escolher. Só com o OK dele gerar as 80 e ligar no `gallery.js`.
  Alternativa melhor, se ele topar: reexportar dos originais (os `driveId` estão nos dados).
- **(b) Nome igual no Android.** O nome e a marca usam `Arial`. Android não tem Arial e cai no
  Roboto, então lá o site aparece com outra letra. Dá pra travar com Arimo (clone métrico da Arial,
  licença livre) como reserva: `font-family: Arial, 'Arimo', Helvetica, sans-serif`, só os caracteres
  usados, baixada apenas onde a Arial não existe. Onde há Arial nada muda.
- **(c) Rótulos no iPhone.** Os rótulos usam `monospace` genérico: no Windows sai Consolas, no iPhone
  sai Courier (cara de máquina de escrever). Se ele quiser uma só, escolher uma mono e embutir.

## Fechamento

1. `node fumaca.mjs ../site-lab --rede`, `node comparar.mjs`, `node medir.mjs`.
2. Linha no `../andamento.md` com os números novos ao lado dos de antes.
3. Relatório ao Pedro: o que ficou mais leve (números), a troca do título da aba, a imagem de prévia
   do link pra ele ver, as três perguntas do 2.10, e a sugestão de um deploy de prévia pra ele testar
   no celular dele.

## Textos novos desta rodada

| onde | texto |
|---|---|
| título da aba | no HTML `Uga do Litoral · Pedro Augusto`; pelo JS `Portfólio · Pedro Augusto`, `Acervo · Pedro Augusto`, `Info · Pedro Augusto` (os mesmos de hoje, só sem o travessão) |
| `og:title` | `Uga do Litoral · Pedro Augusto` |
| `og:description` | a `meta description` atual, sem mudar |
