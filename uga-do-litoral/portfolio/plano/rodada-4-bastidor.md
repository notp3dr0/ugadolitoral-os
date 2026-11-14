# Rodada 4 · BASTIDOR, o corredor 3D

**O pedido do Pedro:** uma aba em 3D onde a pessoa anda, como num jogo, e vê as fotos dele na parede.
Ele aprovou a proposta de que o lugar **não é um museu: é o bastidor de uma casa de show**, o lugar
de onde ele fotografa. Pré-requisitos: rodadas 2 e 3 prontas (usa `js/data.js`, `js/film.js` e o
campo `tone` das fotos).

**Pronto quando:** `bastidor.html` abre no lab, dá pra ir da entrada até o palco no desktop (teclado e
mouse) e no celular (um dedo), as 80 fotos e os 5 filmes estão lá, a home não ficou nem um byte mais
pesada, e `node fumaca.mjs` continua passando.

## O que faz isso dar certo ou errado

O jeito fácil de errar é entregar "demo de three.js": um túnel cinza, iluminado por igual, com
quadros retangulares. O que tem que sair daqui é **um lugar**:

- **Escuro.** A maior parte do quadro é quase preto. Só existe luz onde há uma foto, vermelho nas
  esquinas, e o brilho de um filme no fim de cada lance. Se o print parecer um escritório, está errado.
- **A foto é a coisa mais clara e mais fiel da cena.** Material sem iluminação, sem tone mapping, cor
  exata. Nada tinge, escurece ou distorce a foto de perto. É portfólio de fotógrafo.
- **Parente do site.** Mesmo preto, mesmo vermelho (`#ff0000` e `#fa1717`), mesmo off-white
  (`#f2f0eb`), mesma letra (Arial em negrito apertada, rótulos em `monospace`). A inclinação das fotos
  na parede vem da colagem da home. O texto da intro vira tinta no concreto.
- **Fluido.** Câmera com inércia, transições com easing. Corte seco só no clarão do final.

## Decisões de engenharia (já tomadas)

- **three.js** `0.170.0`, arquivo único `build/three.module.min.js` copiado pra `vendor/` com a
  licença (`LICENSE.three.txt`). Carregado **só** em `bastidor.html`, por import map:
  `<script type="importmap">{"imports":{"three":"./vendor/three.module.min.js"}}</script>`.
  Baixar de `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js` (692 KB, conferido:
  nessa versão é um arquivo só) e a licença de `https://cdn.jsdelivr.net/npm/three@0.170.0/LICENSE`.
  Sem bundler, sem outros pacotes, sem modelos 3D baixados: toda a geometria e toda textura de
  cenário são geradas por código (caixas, planos, cilindros, texturas em `<canvas>`).
- **Sem luz dinâmica e sem sombra.** Tudo `MeshBasicMaterial`. A sensação de luz vem de planos
  aditivos com degradê radial ("poças de luz") e de neblina. É o que deixa bonito e leve no celular.
- **Andar é sobre um trilho.** A posição é um número `s` (metros ao longo do corredor), mais um
  deslocamento lateral pequeno no desktop. Não existe colisão pra programar e ninguém fica preso.
- **Textura por demanda.** Só as fotos perto da câmera têm textura carregada; as distantes são papel
  em branco que "revela" quando a pessoa chega.
- **A interface é HTML por cima do canvas** (nomes, botões, setlist, tela final): mesma tipografia do
  site, acessível por teclado e leitor de tela.

## A planta

Unidade `u = 1,7 m`. Corredor com `2u` de largura (3,4 m) e 3,3 m de altura. Olho da câmera a 1,62 m.
Seis **lances** longos (11u = 18,7 m) em serpentina, ligados por cinco **passagens** curtas (4u = 6,8 m).
O eixo do corredor, em unidades `u` no plano (x, z), com a câmera olhando pra `−z` no início:

```
P0 (0,0) → P1 (0,−11)      lance 1
P1 → P2 (4,−11)            passagem (vira à direita duas vezes)
P2 → P3 (4,0)              lance 2
P3 → P4 (8,0)              passagem (vira à esquerda duas vezes)
P4 → P5 (8,−11)            lance 3
P5 → P6 (12,−11)           passagem
P6 → P7 (12,0)             lance 4
P7 → P8 (16,0)             passagem
P8 → P9 (16,−11)           lance 5
P9 → P10 (20,−11)          passagem
P10 → P11 (20,0)           lance 6, termina na porta do palco
```

- **Paredes sem erro de esquina:** monte uma grade de células de `1u`. É "piso" toda célula a até
  `1u` do eixo, com cada trecho prolongado `1u` além das duas pontas. Depois, pra cada célula de piso,
  cada vizinha que não é piso gera um retângulo de parede virado pra dentro. Uma geometria só pra
  paredes, uma pro piso, uma pro teto. As esquinas saem certas sozinhas.
- **Trilho:** a polilinha acima com as esquinas arredondadas em arco de raio `1u`. Uma função
  `ponto(s)` devolve posição e direção; o comprimento total fica perto de 139 m.
- **Fim de lance:** quem anda por um lance olha de frente pra uma parede no fundo (a parede externa
  da passagem). Em cada um dos cinco primeiros fundos há **um filme projetado**. No fundo do sexto,
  a **porta do palco**. É isso que puxa a pessoa pra frente: sempre tem algo aceso lá no fim.

### Onde vai cada foto

- **Ordem:** por artista ("ala"), na ordem em que cada artista aparece pela primeira vez na colagem
  (`photoOrder`); dentro da ala, a ordem da galeria (`galleries[id].photos`). São 29 alas (Matuê tem
  20 fotos e atravessa mais de um lance, tudo bem).
- **Vagas:** 14 por lance, 7 em cada parede, alternando esquerda e direita. Distância `a` desde o
  início do lance, em metros: parede esquerda `2,9 + 2,0·k`, parede direita `3,9 + 2,0·k`, `k = 0…6`
  (assim toda cópia fica a mais de 1 m das aberturas das passagens, nas duas pontas).
  Preencha lance por lance; o sexto fica com as 10 últimas e sobra parede antes do palco.
- **Tamanho:** foto em pé com 1,15 m de altura (largura pela proporção); foto deitada com 1,45 m de
  largura. Centro a 1,55 m do chão, 1,2 cm afastada da parede.
- **Montagem:** a foto é uma cópia em papel, não um quadro. Atrás dela um retângulo off-white
  2,5 cm maior em cada lado (a margem do papel fotográfico) e quatro tiras de fita preta fosca nos
  cantos (9×3 cm, cada uma meio torta). A cópia inteira gira no próprio plano `r × 0,35` graus, onde
  `r` é a rotação daquela foto na colagem (`layout`), limitada a ±3,5°. É a colagem da home, na parede.
- **Luz:** acima de cada foto, no teto, um refletor (cilindro preto pequeno) preso a um cano que
  corre o lance inteiro. Na parede, atrás da cópia, uma poça de luz: plano aditivo de 2,2×2,6 m com
  degradê radial branco (alfa máximo 0,16), centro um pouco acima da foto. No chão, uma poça menor.
- **Nome da ala:** acima da primeira foto de cada artista, pintado em estêncil na parede (centro a
  2,55 m): nome em maiúsculas, Arial negrito apertada, off-white a 70%, e a contagem em mono
  (`MATUÊ · 20`). Alas sem artista identificado usam o título que já está nos dados (`SHOW`, `RETRATO`).

## Cenário

- **Paredes:** concreto pintado de grafite quase preto. Textura em canvas (512 px, repete a cada
  3,4 m): base `#0e0e0e`, ruído fino, juntas verticais de fôrma a cada 1,7 m, marcas de arranhão e
  esbarrão na metade de baixo. Rodapé mais claro e gasto até 1,0 m.
- **Piso:** concreto polido mais escuro que a parede, com uma faixa de fita branca gasta correndo
  pelo eixo, setas em estêncil `PALCO` no começo de cada lance, e fita zebrada amarela e preta nos
  últimos 3 m antes da porta do palco (o único amarelo do projeto).
- **Teto:** preto. O cano dos refletores e, em duas ou três alturas, eletrocalha (caixas compridas).
- **Neblina:** `FogExp2`, cor `#060000` (preto com um fio de vermelho), densidade `0,07`. Fundo da
  cena na mesma cor. As projeções e a porta do palco ignoram a neblina (`fog: false`) pra brilharem
  de longe.
- **Vermelho:** em cada passagem, uma lâmpada de serviço vermelha (barra vertical `#ff1a1a` num canto)
  e degradês aditivos vermelhos grandes nas paredes e no piso em volta. A passagem inteira fica
  banhada de vermelho: é o fluido da home virando luz. A intensidade pulsa com o som (ver abaixo).
- **Objetos de bastidor** (todos caixas e cilindros, instanciados): cases de equipamento empilhados
  nas passagens, três tamanhos, cantoneiras claras, estêncil `UGA DO LITORAL` e `FRÁGIL`; dois ou três
  cabos correndo rente a uma parede, presos ao chão por tiras de fita a cada 2 m; uma folha de
  setlist colada na parede perto da entrada, com os nomes das alas de verdade (textura gerada dos dados).
- **Entrada:** atrás de quem nasce, uma porta de enrolar fechada. Na parede direita, nos primeiros
  3 m do lance 1 (antes da primeira foto), a intro do site virada tinta: `PEDRO` e `AUGUSTO` em
  estêncil off-white enorme (2,4 m de largura), e embaixo, em vermelho, `FOTOGRAFIA · VÍDEO · EDIÇÃO`.
  Mais abaixo, pequeno, `SÃO PAULO, BRASIL · 2026`. **Plano de abertura:** a câmera nasce virada 55°
  pra essa parede, com o nome enchendo o quadro, e gira pro corredor em 1,6 s (`power3.inOut`) antes
  de liberar os controles.
- **Projeções (filmes):** no fundo dos lances 1 a 5, na ordem do array `films`. Tela = plano com
  `VideoTexture` do `preview` (mudo, em loop), centro a 1,75 m. Tamanhos: 16:9 → 3,0 m de largura;
  3:2 → 2,85 m; vertical (9:16) → 1,46 m de largura por 2,6 m. Um projetor (caixa) no teto a 5 m da
  tela, com um facho (pirâmide de 4 lados, aditiva, alfa 0,05). No chão, o reflexo: cópia espelhada
  da tela com alfa 0,12 e degradê sumindo. Só o vídeo do lance em que a pessoa está toca; os outros
  ficam no pôster. Acima da tela, estêncil pequeno com o título do filme.
- **Porta do palco:** porta dupla preta fosca com barra antipânico, `PALCO` em estêncil off-white em
  cima, e ao lado uma placa acesa em vermelho `SILÊNCIO`. Luz branca vaza pela fresta do meio e por
  baixo (planos aditivos finos), pulsando com o som.
- **Poeira no facho** (enfeite, primeiro a sair se pesar): ~60 pontos derivando devagar dentro de
  cada facho de projetor.

## Andar

Estado: `s` (posição no trilho), `v` (velocidade), `lado` (desvio lateral, só desktop), `giro` e
`inclina` (olhar). Tudo amortecido: nada muda de valor num quadro só.

| | desktop | celular |
|---|---|---|
| andar | `W` / `↑` pra frente, `S` / `↓` pra trás, roda do mouse também anda | arrastar o dedo pra cima anda pra frente (1 px = 1,2 cm), pra baixo volta; soltar mantém a inércia |
| passo lateral | `A` `D` / `←` `→`, até 1,0 m pra cada lado | não tem |
| olhar | a câmera segue o cursor: até ±70° de giro e ±20° de inclinação conforme a posição do mouse na tela | arrastar pro lado gira até ±80°; volta sozinha pro eixo depois de 1,8 s parado |
| correr | `Shift` (×1,8) | um arrasto forte já anda uns 8 m |
| escolher | clique numa foto ou num filme | toque rápido (menos de 220 ms e de 10 px) |
| sair do foco | `Esc`, clique fora, ou andar | botão `VOLTAR`, ou arrastar |
| som | `M` | botão na tela |

- Velocidade máxima 3,4 m/s, aceleração 14 m/s², atrito exponencial (constante 6). No celular a
  inércia decai com constante 2,2.
- **Olhar assistido (só celular):** quando a pessoa está devagar ou parada, a câmera vira sozinha pra
  foto mais próxima: até 38° pro lado dela, com peso `smoothstep` pela distância ao longo do trilho
  (cheio a 0,4 m, zero a 2,2 m) vezes `1 − min(1, |v| / 3)`. Andando rápido, olha pra frente. É o que
  faz o passeio com um dedo só funcionar em tela em pé.
- **Balanço do passo:** altura `+ sin(s · 2π / 1,5) · 0,022 · min(1, |v| / 2)`.
- **Campo de visão:** 62° vertical em tela deitada, 80° em tela em pé.
- Com `prefers-reduced-motion`: sem balanço, sem pulso, sem poeira, e as viagens de câmera viram um
  escurecer e clarear rápido (0,2 s) em vez de travelling.

## Foco numa foto

Clicar numa cópia leva a câmera até ela: de frente, à distância em que a foto ocupa 78% da altura da
tela (ou 86% da largura, o que apertar primeiro), em 0,9 s com `power3.inOut` (o GSAP já está em
`vendor/`; carregue nesta página também). Enquanto isso:

- carrega a versão grande (`src`) e troca quando chegar; ao sair, volta pra pequena e descarta a grande;
- a foto em foco ignora a neblina; a poça de luz dela sobe 60%; a cor da neblina desliza pro `tone`
  da foto a 12% de intensidade (P&B: não muda). É o efeito `tom` da rodada 3, aqui dentro;
- aparece a legenda em HTML embaixo: nome do artista (Arial negrito, grande, apertado), `02 / 05`
  (posição dentro da ala), setas `←` `→` pra foto anterior e seguinte do corredor, e `VOLTAR`. As
  setas levam a câmera da pose de uma foto à outra numa única interpolação (posição e rotação);
- `←` `→` do teclado fazem o mesmo; `Esc` sai.

Num filme: a câmera para a 3,2 m da tela; legenda com o título e o botão `ASSISTIR`, que abre o mesmo
player da home (`js/film.js`, com o diálogo `#video-dialog` copiado pra esta página). O laço 3D dorme
enquanto o player está aberto.

## Interface (HTML)

- **Tela de entrada.** Fundo preto, uma credencial no centro: cartão off-white levemente torto (−3°),
  furo de cordão no topo, `UGA DO LITORAL` em Arial negrito, `BASTIDOR` enorme, uma faixa vermelha,
  linhas em mono (`ACESSO LIVRE`, `SÃO PAULO · 2026`) e um código de barras feito em CSS. Abaixo,
  `PASSANDO O SOM` com a porcentagem do carregamento, que vira dois botões: `ENTRAR COM SOM` e
  `ENTRAR SEM SOM` (o clique também é o gesto que o navegador exige pra liberar áudio). Uma linha
  com os controles do aparelho da pessoa.
- **Durante o passeio.** Em cima à esquerda `← ACERVO` (link pra `./#inicio`); em cima à direita
  `SETLIST` e `SOM`; embaixo à esquerda a ala atual, `ALA 04 / 29` e o nome (com `aria-live="polite"`);
  embaixo, uma linha fina de progresso com um tique por ala. A dica de controles some no primeiro movimento.
- **Setlist.** Tela cheia, a lista das 29 alas como um setlist impresso: número em mono, nome em
  Arial negrito apertada. Os filmes entram na posição deles (`PROJEÇÃO · RYU & KAYG`) e a última linha
  é `PALCO`. Cada item é um botão. Viagem: no mesmo lance, a câmera desliza até lá (até 1,2 s);
  em outro lance, a tela escurece (0,25 s), a câmera troca de lugar, e clareia (0,35 s), como um
  blecaute de palco. É também o caminho de quem navega só por teclado ou leitor de tela.
  `Esc` fecha, foco preso dentro enquanto aberta.
- **Aviso de queda.** Sem WebGL2, com `saveData`, ou se o contexto 3D for perdido: mensagem em HTML e
  link pra GRADE (texto na tabela do fim).

## Som (sintetizado, sem arquivo)

O show está rolando do outro lado da parede. Tudo gerado com Web Audio, nada de música de ninguém.

- **Bumbo:** senoide que desce de 120 pra 42 Hz em 0,12 s, volume caindo em 0,32 s. 140 bpm, compasso
  de 16 passos, bumbo nos passos 0, 6 e 10 (meio-tempo de trap).
- **Plateia:** ruído marrom em loop, filtro passa-banda em 500 Hz, volume 0,05 oscilando devagar (0,07 Hz).
- **Parede:** tudo passa por um filtro passa-baixa cujo corte abre conforme a pessoa avança: de 130 Hz
  na entrada a 1.100 Hz na porta do palco (curva quadrática sobre `s / total`); o volume geral sobe
  de 0,22 a 0,8 no mesmo caminho. Chegar perto do palco tem que dar pra sentir.
- **Pulso de luz:** as luzes vermelhas e a fresta do palco usam o mesmo relógio do bumbo (decaimento
  exponencial desde a última batida): vermelho `0,7 + 0,3 · pulso`, fresta `0,6 + 0,4 · pulso`. O
  relógio existe mesmo com o som desligado (`performance.now()`), então a luz pulsa de qualquer jeito.
- Começa desligado. Só toca se a pessoa escolher `ENTRAR COM SOM`. Suspende quando a aba some.

## O fim

Quando `s` chega a 2,5 m do fim: os controles travam, as duas folhas da porta abrem em 1,2 s, a luz
branca atrás cresce, a câmera segue sozinha os últimos metros, e a tela inteira estoura em branco
(0,5 s). **É o flash da câmera.** Do branco nasce a tela final, em HTML sobre preto:

- pequeno, vermelho, mono: `VOCÊ CHEGOU NO PALCO`
- enorme, Arial negrito: `AGENDA ABERTA`
- uma frase (tabela do fim), e os três contatos que já estão na página Info: WhatsApp
  (`https://wa.me/5512982612374`), `ugadolitoral@gmail.com`, Instagram (`@uga_do_litoral`)
- dois botões: `VOLTAR PRO BASTIDOR` (devolve a pessoa ao começo do lance 6) e `VER O ACERVO`.

Com "menos movimento": sem estouro branco, só a troca suave.

## Desempenho (orçamento)

- Texturas de foto: carregar a pequena de quem está até 12 m à frente e 6 m atrás no trilho, no
  máximo 3 downloads ao mesmo tempo; descartar (`dispose`) quem ficou a mais de 30 m. Enquanto não
  chega, a cópia é papel off-white; quando chega, a imagem surge em 0,5 s. `colorSpace = SRGBColorSpace`,
  anisotropia até 8.
- Chamadas de desenho por quadro: **até 90**. Margens de papel, fitas, poças de luz, refletores e
  cases são `InstancedMesh` (uma chamada cada). Só as fotos são malhas individuais.
- Resolução: `devicePixelRatio` limitado a 2 no desktop e 1,5 no celular.
- **Freio automático**, em degraus, quando a média do quadro passa de 26 ms por 2 s (nunca sobe de
  volta): (1) resolução pra 1,25 e depois 1, anisotropia 2; (2) desliga poeira, reflexos no piso e
  fachos, raio de textura cai pra 8 m.
- O laço para com a aba escondida e com diálogo aberto.
- `near 0,05`, `far 60`. Planos aditivos com `depthWrite: false`.

## Arquivos

```
site-lab/
  bastidor.html        página própria; import map; canvas; a interface em HTML; cópia do #video-dialog
  bastidor.css
  vendor/three.module.min.js + LICENSE.three.txt
  bastidor/
    main.js        arranque, laço, freio automático, quedas, parâmetros de depuração
    plan.js        grade, trilho, vagas, ordem das alas. Só matemática: tem que rodar no Node
    scene.js       paredes, piso, teto, neblina, luzes falsas, objetos
    textures.js    texturas em canvas: concreto, piso, degradê radial, estêncil(texto), fita, case
    prints.js      as cópias: malhas, texturas por demanda, alvos de clique
    projections.js os cinco filmes
    controls.js    teclado, mouse, toque, olhar assistido
    focus.js       foco em foto e em filme
    hud.js         entrada, legenda, setlist, tela final
    sound.js       som e relógio do pulso
```

Nada disso é importado pela home. Confira no fim com `node medir.mjs`: a carga inicial de `/` tem que
ser igual à do fim da rodada 3 (mais os poucos bytes dos dois links novos).

**Parâmetros de depuração** (construir no 4a, usar em todos os prints):
`?s=57.5` nasce nessa posição · `?olhar=-40` giro em graus · `?foco=12` abre em foco na foto 12 ·
`?planta` câmera ortográfica de cima mostrando a planta inteira · `?parado` congela o tempo (pulso
fixo, sem balanço, sem poeira) e só marca `window.bastidorPronto = true` quando as texturas ao
alcance chegaram · `?debug` mostra quadros por segundo, chamadas de desenho, texturas vivas e degrau
do freio. Print: `node foto.mjs "bastidor.html?s=30&parado" saida/b.png` (rota sem a barra inicial).

## Fases (um commit cada, com o que olhar)

**4a · Esqueleto que anda.** `bastidor.html`, three.js em `vendor/`, `plan.js`, paredes, piso e teto
em cinza liso com neblina, trilho, controles de desktop e de celular, parâmetros de depuração, aviso
de queda, freio automático. Ainda feio, mas já dá pra percorrer tudo.
*Verificar:* um teste em Node pro `plan.js` (comprimento do trilho entre 135 e 145 m; 80 vagas, todas
a 1,7 m do eixo, cada uma com parede de verdade atrás e a pelo menos 1 m de qualquer abertura; 29 alas).
*Olhar:* `?planta` (a serpentina de 6 lances, sem buraco nem parede sobrando) e um print de dentro.

**4b · As fotos.** Cópias com margem, fita e inclinação; textura por demanda; foco com legenda e
setas; `tone` na neblina.
*Olhar:* `?s=8&parado` (fotos dos dois lados, cor fiel), `?foco=0` no desktop e no celular (a foto
enche a tela sem cortar), e `?s=8&olhar=60&parado` (uma cópia de lado: dá pra ver a margem e a fita).

**4c · O clima.** Texturas de concreto e piso, poças de luz, refletores, vermelho nas passagens com
pulso, objetos, estênceis (entrada, alas, setas), projeções com facho e reflexo, som.
*Olhar:* entrada (`?s=1&parado`), um meio de lance, uma passagem vermelha, um fundo de lance com filme.
Pergunta de controle em cada print: isto parece bastidor de casa de show à noite, ou parece demo?

**4d · Navegação e fim.** Tela de entrada com a credencial, interface do passeio, setlist com viagem,
porta do palco, clarão, tela final. E as duas entradas pela home: (1) um terceiro item `BASTIDOR` no
`.view-switch`, depois de `GRADE`, link comum pra `./bastidor.html`; (2) no fim do acervo, antes do
rodapé, uma faixa-porta: bloco preto de uns 46svh com uma fresta vertical transparente de 6 px no
meio, por onde aparece o fundo líquido vermelho (a porta entreaberta com luz vazando); no hover a
fresta abre pra 22 px em 500 ms. O bloco inteiro é o link. Escondido na vista INFO.
*Verificar:* `fumaca` passa; `comparar` vai dar DIFERE em `inicio` e `grade` por causa dos dois
elementos novos, e só por eles.
*Olhar:* tela de entrada, setlist, tela final, e a faixa-porta na home (celular e desktop).

**4e · Acabamento.** "Menos movimento", teclado do começo ao fim (Tab chega em tudo, foco visível),
`node medir.mjs ../site-lab saida/bastidor "bastidor.html?s=30"`, conferir o orçamento com `?debug`,
revisar os textos, limpar o que sobrou.

## Fechamento

Linha no `../andamento.md`. Relatório ao Pedro com: como entrar (`http://localhost:4174/bastidor.html`),
os controles, os números (quadros por segundo no desktop, chamadas de desenho, peso da página), a
tabela de textos pra ele aprovar, e o aviso de que **em celular de verdade não foi testado**: é aqui
que o deploy de prévia mais importa.

## Textos novos desta rodada (propostas, o Pedro aprova)

| onde | texto |
|---|---|
| item novo no seletor de vista da home | `BASTIDOR` |
| faixa-porta no fim do acervo | rótulo `ENTRADA DE ARTISTAS` · título `BASTIDOR` · linha `anda pelo corredor e vê as fotos na parede` |
| credencial | `UGA DO LITORAL` · `BASTIDOR` · `ACESSO LIVRE` · `SÃO PAULO · 2026` |
| carregando | `PASSANDO O SOM` |
| botões de entrada | `ENTRAR COM SOM` · `ENTRAR SEM SOM` |
| dica, desktop | `W A S D ou setas pra andar · mouse pra olhar · clica numa foto` |
| dica, celular | `arrasta pra cima pra andar · pro lado pra olhar · toca numa foto` |
| interface | `← ACERVO` · `SETLIST` · `SOM` · `ALA 04 / 29` · `VOLTAR` · `ASSISTIR` |
| setlist | título `SETLIST` · filmes como `PROJEÇÃO · (título)` · última linha `PALCO` |
| estênceis na parede | `PEDRO AUGUSTO` · `FOTOGRAFIA · VÍDEO · EDIÇÃO` · `SÃO PAULO, BRASIL · 2026` · `PALCO` · `SILÊNCIO` · `FRÁGIL` |
| tela final | `VOCÊ CHEGOU NO PALCO` · `AGENDA ABERTA` · `Show, ensaio, turnê, acompanhamento. Me chama.` · `VOLTAR PRO BASTIDOR` · `VER O ACERVO` |
| aviso de queda | `O bastidor em 3D não abriu nesse aparelho. As fotos estão todas no acervo.` + link `VER O ACERVO` |
