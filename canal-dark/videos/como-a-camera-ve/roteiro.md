# Roteiro · Como a câmera transforma luz em foto? (v1)

> Origem: agente, a partir da skill `remotion-problem-resolve-video` (o zip em
> `reels/joao-gabriel/out/remotion-problem-resolve-video.zip`). Tema escolhido pelo agente.
> Status: APROVADO pelo Pedro em 2026-11-03 e renderizado. Os ajustes técnicos de tempo estão em
> `production-status.md`.
> Convenção: timestamps MM:SS:FF a 30 fps (FF de 00 a 29); frames em intervalo semiaberto [início, fim).
> Os tempos são estimativas (~155 palavras/min). Depois da voz real, os cortes passam a ser derivados dela.

## 1. Briefing de produção

- **Tema e recorte:** o que acontece dentro de uma câmera digital quando você fotografa, contado como uma
  cadeia de problemas e soluções. Sensor → lente → diafragma (abertura) → obturador → ISO → triângulo
  da exposição. O recorte é a câmera de lente intercambiável com obturador mecânico de cortina. No
  celular o obturador costuma ser eletrônico, e por isso a cortina é apresentada como esquemática.
- **Público e objetivo:** leigo que fotografa com o celular ou começa numa câmera. Ao fim ele precisa
  entender por que a foto sai branca, escura, tremida ou granulada, e o que cada peça resolve.
- **Por que no perfil do Uga:** é audiovisual da porta pra dentro. Posiciona o Pedro como quem domina
  a técnica sem virar aula chata, e serve de série ("Como funciona: flash", "...: lente 50 mm").
- **Formato:** 64 s, 1080 × 1920, 9:16, 30 fps (1920 frames), pt-BR.
- **Tom:** didático, informal e ágil, segunda pessoa ("você"), frases curtas. Sem "mano", sem saudação
  e sem "segue pra mais".
- **Voz:** VoiceStudio local (127.0.0.1:3900), perfil "joao gabriel", que é a voz do próprio Pedro.
  Não tem custo nem serviço pago. Os tempos por palavra saem da transcrição do VoiceStudio.
- **Direção de arte:**
  - 3D low-poly fosco (`flatShading`) num estúdio escuro, com fundo em degradê de `#050505` a `#1b1b1b`
    e luz de recorte.
  - A câmera é de corpo grafite com um anel vermelho de destaque. O vermelho pontual vem da marca.
  - O motivo fotografado é um skatista numa rampa de concreto ao pôr do sol (cultura urbana, a cara do
    Uga).
  - Os raios de luz são linhas em três cores, uma por ponto do motivo: topo vermelho, meio off-white,
    base azul cobalto. Assim se vê pra onde cada ponto vai.
  - Fontes da marca: Barlow Condensed (badges e legendas) e Manrope (subtítulos dos badges).
  - Cores da skill nos badges: problema em vermelho com ✖, solução em verde com ✔, termo em azul com i,
    pergunta em amarelo.
- **Sistema construído:** a mesma câmera em corte vai ganhando peças diante do espectador. Começa como
  uma caixa com sensor e recebe lente, diafragma, obturador e ganho de ISO. A foto que ela produz fica
  sempre visível num card de "resultado", e cada problema aparece nele primeiro.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você quer guardar uma imagem. Parece fácil: é só deixar a luz bater num sensor. | Abre num plano aberto, por trás e de cima: a câmera em primeiro plano e o skatista na rampa ao fundo, ao pôr do sol (orbit alvo [−3, 0,5, 0], d=24, az 65°, el 26°).<br>Dolly-in até a vista lateral do corte (d=13, az 8°, el 10°). A casca da câmera some e mostra que dentro dela só existe o sensor. | Câmera sem lente (`body`), sensor de 12×8 fotossítios (`sensor`), skatista e rampa (`subject`), sol (`sun`), card de resultado ainda escondido (`photoCard`). | `body.scale`: spring de 0 a 1, local 0–30, damping 11.<br>`body.cut`: de 0 a 1, de W(s1,11) "luz" ≈136 até 160, easing out (a meia-casca some).<br>`rays.amount`: de 0 a 0,35, de 136 a 153, easing out.<br>Câmera: interpolate soft 0→210. | ❓ LUZ VIRA FOTO? (warning, de W(s1,5) "Parece" ≈66 até 200).<br>Legenda: IMAGEM, LUZ, SENSOR. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que a luz chega de todos os lados. O sensor vê só uma mancha clara. | Vista lateral do corte (d=13, az 8°) com órbita lenta até az 22°, el 12°.<br>Cada ponto do skatista solta um cone de raios que cobre o sensor inteiro, e as três cores se misturam em todos os fotossítios.<br>O card de resultado sobe e mostra uma mancha clara sem forma. | Cones de raios nas três cores (`rays`), sensor com os fotossítios acendendo, `photoCard` (2D, à direita, y 1080–1320 px). | `rays.spread`: de 0 a 1, de W(s2,2) ≈31 até W(s2,8) ≈101, linear.<br>`sensor.mix`: de 0 a 1, de 101 até W(s2,11) ≈136, soft.<br>`photoCard.show`: spring de 0 a 1 em W(s2,12) ≈147, damping 12.<br>`photo.focus` fica em 0 (lavado). | ✖ SEM IMAGEM, com subtítulo "Luz de todo lado" (negative, de W(s2,13) "sensor" ≈159 até o fim −4).<br>Legenda: LUZ, LADOS, MANCHA. |
| 00:14:00 – 00:21:00 | 420 – 630 | Por isso existe a lente: ela leva cada ponto da cena pra um ponto do sensor. | Close na boca da câmera (d=9, az −20°, el 8°).<br>A lente entra encaixando e a câmera recua pra vista lateral (d=13, az 8°). Os cones se fecham em linhas finas: cada cor cai num ponto só.<br>No sensor a imagem aparece de cabeça pra baixo, como acontece de verdade. No card ela sai nítida e em pé. | Lente de três elementos (`lens`), raios convergindo, imagem invertida no sensor, rótulos 3D LENTE e SENSOR. | `lens.install`: spring de 0 a 1 (desliza de z −3 até o encaixe) em W(s3,4) "lente" ≈54, damping 12.<br>`rays.converge`: de 0 a 1, de W(s3,6) ≈78 até W(s3,13) ≈159, soft.<br>`sensor.mix`: de 1 a 0 e `sensor.image` de 0 a 1, de 124 a 170.<br>`photo.focus`: de 0 a 1, de W(s3,10) ≈124 até 190, easing out.<br>`labels.lens`: de 0 a 1, de 60 a 72. | ✔ LENTE, com subtítulo "Foca a luz" (positive, de W(s3,4) ≈54 até o fim −4).<br>Legenda: LENTE, PONTO, SENSOR. |
| 00:21:00 – 00:30:00 | 630 – 900 | Mas no sol entra luz demais e a foto estoura. Então umas lâminas fecham a passagem: o diafragma. | O sol cresce e satura. Os raios engrossam, os fotossítios ficam brancos e o card estoura.<br>A câmera vai pra frente da lente (d=8, az −75°, el 6°), olhando pra dentro dela. As sete lâminas giram e fecham a passagem. O card volta ao normal.<br>No fim volta à vista lateral (d=13, az 8°). | `sun` brilhando, sete lâminas do diafragma (`iris`), raios mais finos depois do fechamento. | `sun.intensity`: de 1 a 2,4, de W(s4,1) ≈20 até W(s4,3) ≈43, easing out.<br>`rays.width`: de 1 a 2,2, no mesmo intervalo.<br>`photo.exposure`: de 0 a +2 (EV), de 43 até W(s4,9) ≈112.<br>Câmera de frente em W(s4,10) ≈124.<br>`iris.close`: de 0 a 0,65, de W(s4,12) "lâminas" ≈147 até 182, easing out. Um tique a cada lâmina, de 2 em 2 frames.<br>`photo.exposure`: de +2 a 0 e `rays.width` de 2,2 a 1, de 159 a 205. | ✖ FOTO ESTOURADA (negative, de 112 até 144).<br>✔ DIAFRAGMA, com subtítulo "Controla a abertura" (positive, de W(s4,17) "diafragma" ≈205 até o fim −4).<br>Legenda: SOL, ESTOURA, LÂMINAS, DIAFRAGMA. |
| 00:30:00 – 00:38:00 | 900 – 1140 | Só que o sensor registra tudo enquanto está exposto. Se o skatista se mexe, a foto vira borrão. | Plano médio com o skatista e a câmera no mesmo quadro (d=26, az 55°, el 18°), em deriva lenta pra az 62°.<br>O skatista começa a dar ollie em loop. Sem nada na frente do sensor, ele vai acumulando cópias do movimento e o card mostra um rastro borrado. | `subject` em movimento, rastro (fantasmas) no sensor e no card. | `subject.jump`: loop de 36 frames que começa em W(s5,11) "skatista" ≈136.<br>`photo.blur`: de 0 a 1, de W(s5,12) ≈147 até W(s5,17) ≈205, linear.<br>`sensor.trail`: de 0 a 1, no mesmo intervalo. | ✖ BORRÃO, com subtítulo "Exposto tempo demais" (negative, de W(s5,16) "vira" ≈194 até o fim −4).<br>Legenda: SENSOR, EXPOSTO, BORRÃO. |
| 00:38:00 – 00:46:00 | 1140 – 1380 | Por isso existe o obturador: ele abre e fecha em uma fração de segundo e congela o movimento. | Close no plano do sensor (d=8, az 15°, el 6°).<br>Duas cortinas surgem na frente do sensor. Elas abrem na palavra "abre" e fecham em "fecha", com clique.<br>Na palavra "congela" vem um flash de 4 frames, o rastro some e o card mostra o skatista parado no ar. A câmera abre (d=24, az 60°, el 16°). | Obturador de cortina dupla (`shutter`), rótulo 3D "1/1000 s (exemplo)", flash. | `shutter.install`: spring de 0 a 1 em W(s6,4) "obturador" ≈54.<br>`shutter.open`: de 0 a 1, de W(s6,6) ≈78 até 84; de 1 a 0, de W(s6,8) ≈101 até 107.<br>`labels.speed`: de 0 a 1 em W(s6,11) "fração" ≈136.<br>`photo.blur`: de 1 a 0, de W(s6,15) "congela" ≈182 até 192, out.<br>`flash`: de 1 a 0, de 182 a 186.<br>`subject.freeze`: 1 a partir de 182. | ✔ OBTURADOR, com subtítulo "Controla o tempo" (positive, de W(s6,4) ≈54 até o fim −4).<br>Legenda: OBTURADOR, FRAÇÃO, CONGELA. |
| 00:46:00 – 00:54:00 | 1380 – 1620 | Com menos luz e menos tempo, a foto escurece. Então a câmera amplifica o sinal: o ISO. Preço? Ruído. | Vista diagonal do sensor (d=9, az 35°, el 8°). O card escurece.<br>No sensor, barrinhas de ganho sobem em cada fotossítio e o card volta a clarear.<br>Em "Preço?", os fotossítios piscam fora do tom e o card ganha grão colorido. | Fotossítios com barra de ganho (`sensor.gain`), grão no card (`photo.noise`). | `photo.exposure`: de 0 a −2, de W(s7,1) ≈20 até W(s7,8) ≈101, easing in.<br>`sensor.gain`: de 0 a 1, de W(s7,12) "amplifica" ≈147 até 182, out.<br>`photo.exposure`: de −2 a 0, de 147 até W(s7,16) ≈194.<br>`photo.noise`: de 0 a 0,8, de W(s7,17) "Preço" ≈205 até 223. O piscar usa `random(seed)` do Remotion por frame. | ✖ FOTO ESCURA (negative, de 101 até 190).<br>ℹ ISO, com subtítulo "Amplifica o sinal" (info, de W(s7,16) ≈194 até o fim −4).<br>✖ RUÍDO (negative, de W(s7,18) "Ruído" ≈217 até o fim −4, empilhado abaixo do ISO).<br>Legenda: ESCURECE, AMPLIFICA, ISO, RUÍDO. |
| 00:54:00 – 01:04:00 | 1620 – 1920 | Abertura, obturador e ISO: o triângulo da exposição. Mexeu num, mexe nos outros. Agora você sabe o que acontece quando aperta o botão. | Dolly-out até o diorama completo, com câmera, raios e skatista (d=30, az 40°, el 28°), e órbita até az 70°.<br>Acima da câmera monta-se um triângulo 3D com um vértice por palavra. Em "Mexeu num" o diafragma abre um pouco e o obturador acelera: o card continua equilibrado.<br>Em "aperta" vem o clique com flash, e o card vem pra frente com a foto final. Fade no fim. | Triângulo 3D (`triangle`) com rótulos ABERTURA, OBTURADOR e ISO; todas as peças instaladas; card final grande. | `triangle.vertexA`, `.vertexB` e `.vertexC`: spring em W(s8,0) ≈8, W(s8,1) ≈20 e W(s8,3) ≈43.<br>`triangle.edges`: de 0 a 1, de 43 a 66.<br>`iris.close`: de 0,65 a 0,4 e `shutter.speed` de 0 a 1, de W(s8,8) ≈101 até 136.<br>`photo.noise`: de 0,8 a 0,15, de 101 a 136.<br>`flash`: de 1 a 0 em W(s8,20) "aperta" ≈240.<br>`photoCard.hero`: spring de 0 a 1, de 240 a 270.<br>`fade`: de 0 a 1, de 280 a 300. | ℹ TRIÂNGULO DA EXPOSIÇÃO (info, large, de W(s8,5) "triângulo" ≈66 até o fim).<br>Legenda: ABERTURA, OBTURADOR, ISO, BOTÃO. |

Soma: 7 + 7 + 7 + 9 + 8 + 8 + 8 + 10 = 64 s, ou seja 1920 frames (de 0 a 1919). As cenas são contíguas e
começam em 0. W(sN, i) é o frame local em que a palavra i da fala N começa. Antes da voz real, os valores
da tabela são estimativas (8 + 11,6 × i).

## 3. Estrutura de dados

O contrato fica em `scene-plan.ts`, com os tipos `VideoConfig` e `ScenePlan` da skill e as oito cenas
completas. Na Fase 2 ele vira `src/data/scenes.ts` sem tradução, e o `utils/timing.ts` recebe
`SECONDS = 64`, `VO_KEYS = s1…s8`, `PLANNED_SECONDS = [7, 7, 7, 9, 8, 8, 8, 10]` e
`GAPS = [0.55 × 7]`.

A linha do tempo é determinística: tudo deriva do frame atual. Não há timers, `Date.now` nem
`Math.random`. O ruído e o piscar usam `random(seed)` do Remotion, e cada `Sequence` trabalha em frames
locais.

São duas camadas:
- **3D:** `@remotion/three` com R3F, para câmera, raios, sensor e skatista.
- **2D:** badges, legendas, rótulos projetados e o card de resultado (`photoCard`).

O card é desenhado em canvas a partir de quatro valores: `photo.focus`, `photo.exposure`, `photo.blur`
e `photo.noise`. Ele aplica nitidez, exposição, rastro e grão a uma imagem low-poly do skatista. Isso é
uma representação esquemática da foto, não uma simulação óptica.

## 4. Áudio e montagem

**Narração integral** (142 palavras; ~55 s de fala estimados a 155 palavras/min; 64 s com as pausas):

Você quer guardar uma imagem. Parece fácil: é só deixar a luz bater num sensor. Só que a luz chega de
todos os lados. O sensor vê só uma mancha clara. Por isso existe a lente: ela leva cada ponto da cena
pra um ponto do sensor. Mas no sol entra luz demais e a foto estoura. Então umas lâminas fecham a
passagem: o diafragma. Só que o sensor registra tudo enquanto está exposto. Se o skatista se mexe, a foto
vira borrão. Por isso existe o obturador: ele abre e fecha em uma fração de segundo e congela o
movimento. Com menos luz e menos tempo, a foto escurece. Então a câmera amplifica o sinal: o ISO. Preço?
Ruído. Abertura, obturador e ISO: o triângulo da exposição. Mexeu num, mexe nos outros. Agora você sabe o
que acontece quando aperta o botão.

**Voz:**
- Oito falas, `s1` a `s8`, geradas no VoiceStudio com o perfil "joao gabriel" (a voz do Pedro).
- O silêncio ruidoso do começo de cada fala é cortado pelo tempo da primeira palavra, como no reel do
  João Gabriel.
- A transcrição com tempo por palavra vai pro `vo.json`, e os cortes passam a ser derivados da voz: cada
  fala entra 0,25 s depois do corte, com 0,55 s entre as falas.
- Se a fala real passar de 64 s, eu encurto o texto em vez de acelerar a voz.

**Pronúncia a conferir:** "ISO" (pode sair "ísso" ou "i-esse-ó"; no Brasil se fala "ízo"), "obturador"
e "diafragma".

**Efeitos**, todos sintetizados em código, sem banco de terceiros:

| efeito | momento |
| --- | --- |
| whoosh suave | abertura e cortes de câmera |
| pop | entrada de badge |
| thud | encaixe da lente |
| tique | cada lâmina do diafragma |
| clique mecânico | obturador e "aperta o botão" |
| chiado baixo | entrada do ruído |
| rolamento de skate | durante o borrão |

**Trilha:** uma batida lo-fi discreta, sintetizada com `music.py` (sem direitos de terceiros), que abaixa
sob a voz.

**Master:** −14 LUFS e −1,5 dBTP. A legenda sai palavra por palavra, com os tempos finais vindos da
transcrição.

## 5. Critérios de aceite

- **Gancho:** nos primeiros 3 s já aparece a tentativa ("é só deixar a luz bater") e a pergunta "LUZ
  VIRA FOTO?".
- **Cadeia causal:** sensor → sem imagem → lente → foto estoura → diafragma → borrão → obturador →
  escuro → ISO → ruído → equilíbrio. Cada solução cria o problema seguinte.
- **Explicação antes do nome:** "lâminas fecham a passagem" vem antes de "diafragma", "abre e fecha"
  vem antes de "congela" e "amplifica" vem antes de "ISO".
- **Sistema persistente:** é a mesma câmera do começo ao fim, e as peças instaladas continuam visíveis.
- **Conclusão:** o diorama completo aparece funcionando, com o triângulo e a frase de recompensa.
- **Leitura no celular:**
  - Margem de ~90 px nas laterais.
  - Badges a partir de 262 px.
  - Legenda centrada em ~1418 px.
  - Card de resultado entre 1080 e 1320 px, sem cobrir a legenda nem os badges.
- **Integridade da linha do tempo:** frames contíguos, soma de 1920 frames, e o array do
  `scene-plan.ts` igual à tabela.
- **Fatos verificados:**
  - A imagem chega invertida no sensor (óptica básica).
  - Fechar o diafragma reduz a luz.
  - Um obturador mais rápido congela o movimento e deixa entrar menos luz.
  - ISO alto amplifica o sinal e torna o ruído mais visível.
  - "1/1000 s" é marcado como exemplo.
  - Não há números universais afirmados.
- **Simplificações declaradas:**
  - O ruído também vem da pouca luz, e não só do ganho. "O preço é o ruído" é uma simplificação aceita.
  - O efeito do diafragma na profundidade de campo fica de fora.
  - No celular a abertura geralmente é fixa e o obturador é eletrônico. O vídeo mostra a câmera de
    lente intercambiável.
- **Nada alegado como existente:**
  - Os áudios estão como `planned`.
  - Não houve render, build nem audição.

**Fontes:** óptica e exposição de conhecimento técnico consolidado (formação de imagem por lente,
triângulo de exposição). Não houve consulta web nesta fase porque nenhum número específico é afirmado.

## 6. Ganchos alternativos

1. "Por que a foto do show sempre sai granulada?" Abre pelo ruído, mais urbano e próximo do Uga.
2. "Sua câmera faz cinco coisas em um milésimo de segundo." Abre pelo número; precisa de uma versão
   mais curta.
