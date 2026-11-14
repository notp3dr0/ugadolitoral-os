# Como a raquete de mosquito funciona? · roteiro v1 (2026-11-03)

> Origem: agente, a pedido do Pedro, com a skill `remotion-problem-resolve-video`. Tom pedido: engraçado.
> Status: APROVADO em 2026-11-03 ("faça"), com uma mudança: o personagem passa a ser o João Gabriel (v1.1).
> A v1 abaixo fica como referência. A narração final da v1.1 está em `scripts/narration.json`, e os ajustes
> técnicos (voz edge-tts, 91 s, cortes pela voz) estão em `production-status.md`.

## 1. Briefing de produção

- **Tema:** como funciona a raquete elétrica de matar mosquito.
- **Recorte técnico:** um modelo comum de duas pilhas AA (3 V), com botão, LED, placa (oscilador,
  transformador elevador, multiplicador de diodos e capacitores), um capacitor de armazenamento e uma
  cabeça de três redes: as duas de fora ligadas num polo e a do meio no outro. Modelos com bateria
  recarregável ou com outro tipo de circuito (conversor *boost*) existem. O vídeo mostra um só, e de
  forma esquemática.
- **Público:** leigo, no feed do Instagram do Uga do Litoral. Muita gente tem a raquete em casa e
  nunca pensou em como ela funciona.
- **Objetivo educativo:** sair sabendo que a raquete pega 3 V, faz virar milhares de volts, guarda
  a carga num capacitor e só descarrega quando o próprio mosquito fecha o circuito entre as redes.
- **Formato:** 90 s, 1080×1920 (9:16), 30 fps, 2700 frames (de 0 a 2699), em pt-BR.
- **Tom:** documentário sério sobre uma briga ridícula das 3 da manhã. A voz fica seca e quem faz a
  piada é a imagem: o mosquito de óculos escuros surfando no vento, a formiga bocejando, o ponteiro do
  voltímetro estourando a escala, o espetinho e o fantasminha com auréola. É humor, não é tutorial.
- **Sistema construído:** uma raquete na mão, que é aberta por dentro. Cada problema acrescenta uma
  peça: a rede (porque a mão empurra o ar), o choque (porque bater não basta), o oscilador e o
  transformador (porque 3 V é pouco), o multiplicador e o capacitor (porque falta mais tensão e um lugar
  pra guardar a carga), e as três redes (porque a eletricidade precisa de caminho). No fim, o mosquito
  fecha o circuito.
- **Direção de arte:** 3D low-poly fosco (`flatShading`). O cenário principal é um quarto à noite
  (cama, criado-mudo, abajur, janela com lua), em degradê azul-noite. Quando a câmera entra na raquete,
  o fundo vira carvão (`#090909`, o preto da marca), e o vermelho de destaque da marca aparece como a
  rede carregada e o flash do estalo. Fontes da marca: Barlow Condensed nos badges e Manrope nas
  legendas.
- **Personagens:** o mosquito (low-poly, olhos grandes, tromba comprida; tem óculos escuros,
  sobrancelha de ofendido, espetinho e auréola), o dorminhoco (a cabeça no travesseiro, com um olho que
  abre), a mão e a formiga figurante.
- **Voz:** VoiceStudio local (OmniVoice), com o perfil "joao gabriel" (`JG_VOZ=d2669c06`). É gratuito e
  roda na GPU. Fica a pergunta: esse perfil é a voz que você quer aqui? Se o VoiceStudio não responder,
  a alternativa gratuita é edge-tts `pt-BR-AntonioNeural`. Nenhum serviço pago.
- **Premissas:** você não informou a duração, então ficou o padrão da skill (90 s). Também não pediu
  logo nem assinatura na peça. Se quiser fechar com @ugadolitoral, entra no último plano.

## 2. Tabela cronológica

Convenção: timestamps em MM:SS:FF (FF de 00 a 29). Os quadros são globais e semiabertos, [início, fim):
o último quadro de uma cena é o primeiro da próxima. As animações usam quadros **locais**, e o "≈" marca
estimativas a ~155 palavras/min. Depois da voz real, `W("sN", i)` passa a ser o quadro exato da palavra
i, e os cortes são realinhados à fala.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:07:00 | 0 - 210 | Três da manhã. Um zumbido no ouvido. Você quer matar esse mosquito. Parece fácil: um tapa. | Abre no quarto escuro, plano geral (`P.room`, dist 14, az 20°, el 16°). A câmera faz dolly-in até a orelha do dorminhoco (`P.ear`, dist 5,5) em "zumbido" e recua pro plano do tapa (`P.slap`) no fim.<br>Gancho: o mosquito já está voando no quadro 0. | Quarto low-poly (cama, criado-mudo, abajur apagado, janela com lua), dorminhoco, relógio digital "03:00" no criado-mudo, mosquito, mão. | `mosquito.path` 0→1 (quadros 0→≈54, inOut, voo em zigue-zague com `random(seed)`).<br>`sleeper.eyes` 0→1 (≈54→62, out): abre um olho.<br>`hand.raise` spring 0→1 (≈158→188, damping 12): a mão sai do lençol. | `03:00` warning com "?" (≈8→89).<br>`TAPA` info, sub "o plano infalível" (≈181→fim).<br>Highlights: ZUMBIDO, MOSQUITO, TAPA. |
| 00:07:00 - 00:15:00 | 210 - 450 | Plaft. Na sua própria cara. Ele desviou: a mão empurra o ar, e o ar leva o mosquito. | Corta no impacto: a câmera treme e depois orbita 15°→70° pro lado. Em "desviou" a imagem rebobina em câmera lenta e mostra a onda de ar saindo na frente da mão. | Mão, bochecha vermelha, partículas de ar (pontinhos azul-claros), mosquito surfando a onda, óculos escuros. | `hand.slap` 0→1 (0→8, in).<br>`sleeper.redCheek` 0→1 (8→15).<br>`camera.shake` 1→0 (8→21, out).<br>`slowmo.rewind` 0→1 (≈89→112).<br>`airWave.progress` 0→1 (≈112→181, out).<br>`mosquito.surf` 0→1 (≈147→215).<br>`mosquito.shades` spring 0→1 (≈181→211, damping 11). | `ERROU` negative (≈19→100).<br>`ONDA DE AR` negative, sub "a mão empurra o ar" (≈112→fim).<br>Highlights: PLAFT, CARA, DESVIOU, AR. |
| 00:15:00 - 00:23:00 | 450 - 690 | Então você precisa de algo que deixa o ar passar: uma rede. O vento atravessa, o mosquito fica. | A câmera acompanha o mosquito e chega na raquete (`P.racketRoom`, dist 9) em "rede". O golpe aparece de perfil (az 34°): o ar atravessa a malha e o mosquito fica preso nela. | Raquete (moldura oval, cabo, redes ainda cinza), mão segurando, partículas de ar atravessando a malha. | `racket.enter` spring 0→1 (≈117→149, damping 10): entra com overshoot.<br>`racket.swing` 0→1 (≈147→174, inOut).<br>`airWave.throughMesh` 0→1 (≈147→181, linear).<br>`mosquito.caught` 0→1 (≈181→205).<br>`mosquito.shades` spring 1→0 (≈181→211): os óculos caem. | `MALHA ABERTA` positive, sub "o ar passa" (≈123→fim−4).<br>Highlights: AR, PASSAR, REDE, VENTO, FICA. |
| 00:23:00 - 00:32:00 | 690 - 960 | Só que ele não pesa nada. Quica na rede e volta pro seu ouvido, ofendido. Bater não basta: precisa de choque. | Close na rede (`P.bounce`, az 40°). Uma balança cômica aparece e marca ~0, e o mosquito quica como borracha. A câmera segue ele de volta à orelha (`P.ear`), mostra a sobrancelha franzida e volta pra raquete com uma faisquinha de "e se…". | Balança cômica, mosquito (sobrancelha franzida), raquete desligada. | `scale.enter` spring 0→1 (≈31→61); `scale.needle` 0→0,02 (≈54→77); a balança sai (≈77→85).<br>`mosquito.bounce` spring 0→1 (≈77→109, damping 6, bem elástico).<br>`mosquito.path` 1→0,95 (≈112→158): volta pro ouvido.<br>`mosquito.anger` 0→1 (≈170→178).<br>`racket.sparkHint` 0→1 (≈240→250). | `LEVE DEMAIS` negative (≈54→181).<br>`PRECISA DE CHOQUE` warning (≈216→fim).<br>Highlights: NADA, QUICA, OFENDIDO, CHOQUE. |
| 00:32:00 - 00:39:00 | 960 - 1170 | No cabo moram duas pilhas. Três volts. Isso não assusta nem formiga. A tensão precisa subir. Muito. | Transição: o quarto apaga e o fundo vira carvão. A raquete flutua e fica de pé na "bancada" (`P.bench`). O cabo fica transparente e a câmera desce até as pilhas (`P.handle`, dist 5). Uma formiga entra, olha o voltímetro e boceja. | Raquete de pé, carcaça do cabo translúcida, 2 pilhas AA, botão, formiga, voltímetro 2D (canto direito, entre y 300 e 700 px, longe da legenda). | `bedroom.dim`, `bg.mode` e `racket.toBench` 0→1 (0→30, inOut).<br>`racket.shell` 1→0,15 (≈19→42).<br>`batteries.pop` spring 0→1 (≈42→72).<br>`voltmeter.enter` spring (≈65→95); `voltmeter.value` 0→3 (≈65→77).<br>`ant.enter` spring (≈112→142); `ant.yawn` 0→1 (≈123→147); a formiga sai (≈147→157). | `3 VOLTS` info, sub "2 pilhas de 1,5 V" (≈65→147).<br>`TENSÃO BAIXA` negative (≈147→fim).<br>Highlights: PILHAS, TRÊS, VOLTS, FORMIGA, TENSÃO, MUITO. |
| 00:39:00 - 00:48:00 | 1170 - 1440 | Mas transformador não funciona com a corrente contínua da pilha. Então um oscilador liga e desliga ela milhares de vezes por segundo. | Dolly-in na placa (`P.board`, dist 3,6). A corrente sai da pilha num fluxo reto e contínuo, bate no transformador e não passa (ele "dá de ombros", com um balanço lateral). Em "oscilador" o transistor acende e a corrente vira pulsos piscando. | Placa de circuito, transformador (bobina com núcleo), transistor/oscilador, partículas de corrente (azul-claro). | `current.flow` 0→1 (≈42→112, linear).<br>`transformer.reject` 0→1 (≈77→112, out), volta a 0 em ≈158→166.<br>`board.oscillatorGlow` spring 0→1 (≈147→177).<br>`current.pulse` 0→1 (≈158→270): as partículas piscam em ciclos de 2 quadros (esquemático, não é a frequência real). | `CORRENTE CONTÍNUA` negative, sub "o transformador ignora" (≈77→147).<br>`OSCILADOR` positive, sub "liga e desliga, rapidinho" (≈147→fim).<br>Highlights: TRANSFORMADOR, CONTÍNUA, OSCILADOR, LIGA, DESLIGA, MILHARES. |
| 00:48:00 - 00:57:00 | 1440 - 1710 | Agora o transformador eleva a tensão, e diodos com capacitores empilham mais ainda. Um capacitor guarda a carga. Luzinha acesa: armada. | A câmera sobe pela placa: do transformador para a escada de diodos e capacitores (az −14°), depois pro capacitor grande e pro LED (`dist 4,6`, az 24°). O voltímetro sobe e o ponteiro estoura a escala e entorta, com mola. | Transformador, multiplicador (escadinha de 4 degraus que acendem um a um), capacitor-cilindro com barra de carga, LED, voltímetro. | `transformer.boost` 0→1 (≈31→71).<br>`voltmeter.value` 3→300 (≈42→77) e 300→2000 (≈123→164, in).<br>`multiplier.stage` 0→1 (≈89→153, linear, degrau a degrau).<br>`voltmeter.needleBreak` spring 0→1 (≈147→177, damping 8).<br>`capacitor.charge` 0→1 (≈170→211).<br>`led.on` spring 0→1 (≈216→246).<br>`voltmeter.exit` (fim−10→fim). | `TRANSFORMADOR` positive (≈31→89).<br>`MULTIPLICADOR DE TENSÃO` positive, sub "milhares de volts" (≈89→158).<br>`CAPACITOR` info, sub "a carga fica guardada" (≈170→fim).<br>Highlights: TRANSFORMADOR, TENSÃO, DIODOS, CAPACITORES, CAPACITOR, CARGA, ARMADA. |
| 00:57:00 - 01:07:00 | 1710 - 2010 | Mas eletricidade precisa de caminho. Por isso são três redes: as de fora num polo, a do meio no outro. O ar entre elas isola. | A câmera sobe pra cabeça da raquete (`P.head`). A corrente chega na rede e fica parada, num beco sem saída. Em "três redes" a cabeça se desmonta (vista explodida) e a câmera gira pro perfil (`P.edge`, az 78°): três camadas afastadas. As de fora ficam azuis, a do meio vermelha, e aparece uma faixa translúcida no vão. | Rede externa A, rede central, rede externa B, brilho do vão de ar, capacitor e LED ainda visíveis lá embaixo. | `current.deadEnd` 0→1 (≈19→58).<br>`racket.explode` spring 0→1 (≈89→125, damping 14): as redes se afastam em z.<br>`gridOuter.tint` 0→1 (≈123→170).<br>`gridMiddle.tint` 0→1 (≈181→228).<br>`airGap.glow` 0→1 (≈240→286). | `SEM CAMINHO` negative (≈19→89).<br>`3 REDES` positive, sub "fora: um polo · meio: o outro" (≈89→240).<br>`AR ISOLANTE` info (≈240→fim).<br>Rótulos 3D: "POLO A", "POLO B", "AR".<br>Highlights: ELETRICIDADE, CAMINHO, TRÊS, REDES, POLO, MEIO, ISOLA. |
| 01:07:00 - 01:15:00 | 2010 - 2250 | Aí o mosquito entra no meio, encosta nas duas e vira o fio que faltava. O capacitor descarrega nele. Estalo. Churrasquinho. | Ainda de perfil, o mosquito entra confiante no vão entre a rede azul e a vermelha, e a câmera faz dolly-in (`P.zap`, dist 3,2). Ele encosta nas duas, a corrente atravessa o corpo dele e, no "Estalo", vem o flash branco-vermelho e o tranco de câmera. Ele fica tostado e aparece num espetinho. As redes voltam a se juntar no fim. | Mosquito, as três redes, partículas de corrente, faísca, fumacinha, espetinho, capacitor. | `mosquito.path` 0→1 (0→≈77).<br>`mosquito.bridge` 0→1 (≈77→112).<br>`circuit.closed` 0→1 (≈123→170).<br>`capacitor.charge` 1→0 (≈216→220, in).<br>`bg.flash` 1→0 (≈228→236).<br>`spark.burst` 0→1 (≈228→242).<br>`mosquito.charred` 0→1 (≈228→234).<br>`mosquito.skewer` spring 0→1 (≈240→270).<br>`racket.explode` 1→0 e `capacitor.charge` 0→1 (fim−24→fim). | `CIRCUITO FECHADO` positive, sub "o mosquito vira o fio" (≈123→228).<br>`ZAP` warning (≈228→fim).<br>Highlights: MOSQUITO, MEIO, FIO, CAPACITOR, DESCARREGA, ESTALO, CHURRASQUINHO. |
| 01:15:00 - 01:22:00 | 2250 - 2460 | E se for o seu dedo? A carga guardada é pequena, então o choque é curtinho. Mas dói. Não teste. | A câmera orbita pra mão (`P.finger`). Um dedo curioso se aproxima devagar da rede. Em "pequena", o capacitor encolhe na tela (é pouca energia). No "dói" vem uma faisquinha, a mão se recolhe tremendo com mola, e a câmera dá um leve recuo. | Mão (indicador esticado), raquete armada, capacitor, mosquito no espetinho ao fundo. | `hand.finger` 0→0,8 (≈31→77, inOut) e 0,8→1 (≈193→205).<br>`capacitor.size` 1→0,55 (≈77→123) e volta a 1 (≈205→215).<br>`spark.small` 1→0 (≈205→211).<br>`hand.recoil` spring 0→1 (≈205→235, damping 7). | `POUCA ENERGIA` info, sub "choque rápido" (≈77→205).<br>`DÓI · NÃO TESTE` negative (≈205→fim).<br>Highlights: DEDO, PEQUENA, CURTINHO, DÓI, TESTE. |
| 01:22:00 - 01:30:00 | 2460 - 2700 | Pronto: agora você entende como a raquete elétrica funciona. Já o mosquito não vai contar pra ninguém. | Dolly-out até o plano geral do começo (`P.final`, dist 16, el 18°). O quarto acende de novo pela lua e a raquete vai pro criado-mudo com o LED aceso. Uma trilha de luz percorre o sistema inteiro: pilhas, oscilador, transformador, multiplicador, capacitor e redes. O dorminhoco fecha o olho e sorri. O fantasminha do mosquito, de auréola, sobe e sai pela janela. Fade no fim. | Quarto, dorminhoco, raquete no criado-mudo, trilha de energia, fantasminha com auréola, lua. | `systemPath.progress` 0→1 (≈8→100, linear).<br>`bg.mode` e `bedroom.dim` 1→0 (18→54, inOut).<br>`racket.toBench` 1→2 (18→54): vai pro criado-mudo.<br>`sleeper.eyes` 1→0 (≈100→112).<br>`mosquito.ghost` spring 0→1 (≈112→142).<br>`mosquito.ghostRise` 0→1 (≈112→fim−10, soft).<br>`fade` 0→1 (fim−14→fim). | `RAQUETE ELÉTRICA` positive, large, sub "pilha · oscilador · transformador · capacitor · 3 redes" (≈77→fim−6).<br>Highlights: RAQUETE, ELÉTRICA, FUNCIONA, MOSQUITO, NINGUÉM. |

Soma: 210 + 240 + 240 + 270 + 210 + 270 + 270 + 300 + 240 + 210 + 240 = **2700 quadros** (90 s). Os
quadros são contíguos de 0 a 2700, sem lacunas.

## 3. State / Props para Remotion

O arquivo é o `scene-plan.ts`, nesta pasta: as 11 cenas completas, com os mesmos tipos de
`assets/template/src/data/scenes.ts` (`VideoConfig`, `ScenePlan`, `CameraPlan`, `SceneObject`,
`TrackAnimation`, `SceneBadge`, `CaptionBlock`, `AudioCue`). Na Fase 2 ele vira `src/data/scenes.ts` sem
tradução, e o cabeçalho traz a configuração de `utils/timing.ts` (`SECONDS = 90`, 11 `VO_KEYS`,
`PLANNED_SECONDS = [7, 8, 8, 9, 7, 9, 9, 10, 8, 7, 8]`, `GAPS` entre 0,5 e 0,65 s).

- **Determinismo:** tudo sai de `useCurrentFrame()`. Não há timers, `Date.now` nem estado incremental.
  O zigue-zague do mosquito usa `random("mosquito-" + i)` do Remotion e ruído por quadro.
- **Frames locais:** cada cena roda dentro de uma `<Sequence>`. As trilhas `alvo.prop` de várias
  cenas formam uma linha contínua (`track("racket.explode", frameGlobal)`).
- **Ids estáveis:** `bedroom`, `sleeper`, `mosquito`, `hand`, `racket`, `batteries`, `board`,
  `transformer`, `multiplier`, `capacitor`, `led`, `gridOuterA`, `gridMiddle`, `gridOuterB`, `airGap`,
  `current`, `spark`, `voltmeter`, `ant`, `scale`, `clock`, `airWave`, `systemPath`. O mosquito e a
  raquete atravessam o vídeo inteiro.
- **Camadas:** a 3D usa `@remotion/three` + R3F (o quarto, a raquete, as peças internas e o mosquito).
  A 2D tem os badges, as legendas palavra a palavra, os rótulos ancorados em pontos 3D (POLO A,
  POLO B, AR, PILHAS, OSCILADOR) e o voltímetro, que é um overlay de propósito: é piada de interface.
  Não é 2.5D.

## 4. Áudio e montagem

**Narração integral** (216 palavras):

> Três da manhã. Um zumbido no ouvido. Você quer matar esse mosquito. Parece fácil: um tapa. Plaft. Na
> sua própria cara. Ele desviou: a mão empurra o ar, e o ar leva o mosquito. Então você precisa de
> algo que deixa o ar passar: uma rede. O vento atravessa, o mosquito fica. Só que ele não pesa nada.
> Quica na rede e volta pro seu ouvido, ofendido. Bater não basta: precisa de choque. No cabo moram
> duas pilhas. Três volts. Isso não assusta nem formiga. A tensão precisa subir. Muito. Mas
> transformador não funciona com a corrente contínua da pilha. Então um oscilador liga e desliga ela
> milhares de vezes por segundo. Agora o transformador eleva a tensão, e diodos com capacitores
> empilham mais ainda. Um capacitor guarda a carga. Luzinha acesa: armada. Mas eletricidade precisa de
> caminho. Por isso são três redes: as de fora num polo, a do meio no outro. O ar entre elas isola. Aí
> o mosquito entra no meio, encosta nas duas e vira o fio que faltava. O capacitor descarrega nele.
> Estalo. Churrasquinho. E se for o seu dedo? A carga guardada é pequena, então o choque é curtinho.
> Mas dói. Não teste. Pronto: agora você entende como a raquete elétrica funciona. Já o mosquito não
> vai contar pra ninguém.


- **Tempo:** 216 palavras a ~165 palavras/min dão ~78,5 s de fala. Com 10 pausas de ~0,58 s, a entrada
  de 0,45 s e o respiro final, fecha em ~85 s dentro dos 90. Se a voz real passar disso, o texto é
  encurtado antes de acelerar a fala.
- **Ajuste depois do TTS:** `voiceover.py` gera um WAV por fala e `prepare_vo.py` mede os tempos de cada
  palavra em `vo.json`. A partir daí, `timing.ts` deriva os cortes da voz real e tudo o que está amarrado
  com `W()` acompanha.
- **Intenção de voz:** narrador de documentário, sério e sem rir das próprias piadas. Pausa seca antes
  de "Plaft", "Muito.", "Estalo." e "Churrasquinho." (a pausa é a piada). "Ofendido" e "armada" saem
  num tom levemente dramático.
- **Efeitos** (sintetizados em `sfx.py`, sem direitos de terceiros): zumbido de mosquito (`buzz`),
  `slap`, `rewind`, `whoosh`, `pop-in`, `swoosh`, `boing` (quica), `click` (pilha), bocejo sintético
  (`yawn-synth`), zumbido grave (`hum-flat`), `error-blip`, o chiado agudo subindo do oscilador
  (`whine-rise`, baixinho, porque a raquete de verdade faz esse som), `tick-ladder` (degraus do
  multiplicador), `boing-metal` (o ponteiro estourando), `charge-up`, `ding` (LED), `zap` (estalo),
  `sizzle`, `suspense-tick`, `zap-tiny`, `harp-up` (fantasminha) e grilos. Cada um tem o seu momento no
  `audioCues` de cada cena.
- **Trilha** (`music.py`): pizzicato cômico em tom menor nas cenas 1 a 4. Vira um pulso eletrônico
  discreto dentro da raquete (cenas 5 a 8). Corta seco num silêncio de ~0,3 s antes do "Estalo" e volta
  como uma valsinha de caixinha de música no final. Fica sempre uns 18 dB abaixo da voz, com ducking.
- **Legendas:** palavra a palavra, com no máximo ~17 caracteres por linha, 66 px, peso 900 e contorno
  escuro, centradas em ~1418 px. As palavras-chave ganham cor. Os tempos finais só existem depois do
  alinhamento com a voz.
- **Entrega:** MP4 H.264 1080×1920 30 fps AAC, normalizado em −14 LUFS / −1,5 dBTP, em `entregas/`.

## 5. Critérios de aceite e notas de verificação

- [x] O gancho é imediato: o mosquito está no quadro 0 e o tapa vem antes de 7 s.
- [x] A cadeia causal: tapa erra (ar) → rede → leve demais → choque → 3 V é pouco → oscilador →
  transformador e multiplicador → capacitor guarda → sem caminho → três redes → o mosquito fecha o
  circuito → por que o dedo não morre → sistema completo.
- [x] A explicação vem antes do nome técnico em todos os ciclos (oscilador, transformador,
  multiplicador, capacitor, isolante).
- [x] O sistema visual persiste: é a mesma raquete do começo ao fim, as peças instaladas continuam à
  vista e o quarto volta no final.
- [x] A conclusão mostra o funcionamento completo (trilha de energia) e tem a recompensa da frase final.
- [x] Leitura no celular: os badges ficam a partir de ~262 px, a legenda em ~1418 px e o voltímetro
  entre 300 e 700 px, sem sobreposição. Isso ainda vai ser conferido nos stills da Fase 2.
- [x] A tabela está completa (11 linhas), os quadros são contíguos e a soma é 2700.
- [x] A narração cabe no tempo (~85 s estimados em 90 s).
- [x] O `scene-plan.ts` está consistente com a tabela: mesma ordem, falas, badges e âncoras.
- [x] Nenhum asset foi dado como existente: todos os `audioCues` estão `planned`, e nada foi gerado,
  instalado nem renderizado.

**Rigor e segurança:**
- A faixa de tensão citada em fontes técnicas para raquetes comuns é de ~1.500 a 4.000 V. O vídeo fala
  só em "milhares de volts" e não crava número, e o voltímetro é piada (escala estourada), não medição.
- "Milhares de vezes por segundo" do oscilador também é esquemático: a frequência varia por
  modelo e os pulsos na tela não estão em escala.
- O circuito varia: há modelos com oscilador de bloqueio + transformador + multiplicador e outros com
  conversor *boost*. O vídeo mostra o primeiro tipo, sem dizer que é universal.
- O choque **não** é apresentado como inofensivo. A fala diz que a carga é pequena e o choque é curto,
  mas que dói, e fecha com "Não teste". Não há nenhuma instrução de abrir, modificar ou testar a raquete.
- "A mão empurra o ar e o ar leva o mosquito" é a explicação simplificada e popular do desvio. O
  mosquito também percebe o movimento, e o roteiro não afirma que o ar é o único motivo.

**Fontes consultadas** (busca de 2026-11-03):
- [Engineer Fix: Do Electric Fly Swatters Work?](https://engineerfix.com/do-electric-fly-swatters-work/): três redes (as de fora aterradas, a do meio carregada), oscilador + transformador + multiplicador, ~1.500–4.000 V com baixa corrente.
- [RimStar: Electric fly swatters (zapper rackets)](https://rimstar.org/science_electronics_projects/electric_fly_swatter_zapper_racket.htm): desmontagem amadora, circuito de oscilador de bloqueio.
- [New Screwdriver: electronic mosquito trap](https://newscrewdriver.com/2022/07/19/electronic-mosquito-trap/): desmontagem de outro aparelho, com circuito tipo *boost*.
- [Patente US 5.533.298 (Justia)](https://patents.justia.com/patent/5533298): dispositivo portátil de matar insetos com redes eletrificadas.
