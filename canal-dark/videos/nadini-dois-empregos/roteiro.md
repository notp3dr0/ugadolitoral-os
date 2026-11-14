# Nadini e os dois empregos · roteiro v1 (2026-11-03) + final v2 em loop

> Origem: agente, a pedido do Pedro, com a skill `remotion-problem-resolve-video`. Tom pedido: comédia, absurdo, viral, nada de final maduro.
> Status: APROVADO em 2026-11-03. O Pedro aceitou o v1 ("aceito demais esse roteiro"), pediu outro final, escolheu a
> opção "loop infinito" e mandou começar ("pode começar a fazer o vídeo"). A v1 abaixo fica como referência.

## v2 · o que mudou (cenas 8 e 9)

O final "Padaria Celular" (fusão) saiu. No lugar, o vídeo vira um loop: a Nadini é demitida dos dois empregos, tudo
rebobina e o último quadro emenda no primeiro ("…ela fez o que qualquer pessoa faria:" → "A Nadini arrumou dois empregos.").

| Cena | Narração (v2) | O que acontece |
| --- | --- | --- |
| 8 | Aline chegou furiosa. De baguete. Os dois chefes se olharam. A Nadini foi demitida duas vezes. | A Aline, soltando vapor, se lança na mesma baguete-catapulta e pousa na padaria. O padeiro sai do fundo, os dois se encaram, e dois carimbos DEMITIDA batem na tela (loja e padaria). |
| 9 | Desempregada, ela fez o que qualquer pessoa faria: | Badge PLANO 4 "fazer tudo de novo". Em "pessoa", a fita rebobina: tinta roxa, ◀◀, o relógio gira pra trás, a pizza se desfaz, a Aline volta voando, a catapulta desmonta e a Nadini volta ao meio da rua com dois contratos em branco. A câmera termina no plano aberto do quadro 0. |

Narração, voz e cortes finais: `scripts/narration.json`, `src/data/vo.json` e `src/data/scenes.ts` (a fonte de verdade
da Fase 2). Ajustes técnicos em `production-status.md`.

## 1. Briefing de produção

- **Tema:** a Nadini aceitou dois empregos (loja de celular de manhã, padaria à tarde) e os horários batem.
  A loja vai até 15h e a padaria começa às 14h: sobra **1 hora** em que ela precisa estar em dois lugares.
- **Recorte:** ficção absurda, não é tutorial. Nada do que acontece é conselho de trabalho. O "problema → solução"
  do canal vira uma escalada de planos cada vez mais malucos, e cada plano acrescenta uma peça à mesma maquete.
- **Personagens:** Nadini (protagonista), Aline (chefe da loja de celular). Figurantes inventados: um cliente
  na loja e um cliente na padaria, sem nome. O dono da padaria não aparece.
- **Público:** quem já teve dois bicos, dois horários ou uma chefe com radar. Feed de Reels, TikTok e Shorts.
- **Objetivo:** gerar identificação ("já passei por isso"), uma virada que ninguém espera (a loja vira padaria) e
  uma frase final citável.
- **Formato:** 60 s (padrão do canal), 1080×1920 (9:16), 30 fps, 1800 frames (de 0 a 1799), pt-BR.
- **Tom:** documentário sério sobre algo ridículo, como o reel do João Gabriel e a raquete. A voz fica seca e
  quem faz a piada é a imagem (manequim de crachá, chefe com radar, baguete catapulta, pão com capinha).
- **Sistema construído:** a maquete do quarteirão, com a loja à esquerda, a padaria à direita e uma torre de
  relógio no meio. O relógio é um gráfico de pizza: azul = turno da loja (8h às 15h), laranja = turno da padaria
  (14h às 20h), e a fatia vermelha onde os dois se sobrepõem (14h às 15h). Cada plano mexe na maquete, e no final
  as duas lojas deslizam e viram uma só.
- **Cadeia causal:** dois turnos → uma hora em conflito → fugir escondida (a chefe tem radar) → deixar um clone
  (o manequim cai) → voar de catapulta (leva celular pra padaria) → a fila quer pão com capinha → a Aline funde as
  duas lojas → o conflito deixa de existir.
- **Direção de arte:** 3D low-poly fosco (`flatShading`). Fundo de estúdio escuro da marca (`#050505` → `#1b1b1b`),
  maquete iluminada como um palco. Loja em cinza-azulado com letreiro azul-claro; padaria em creme e laranja;
  fatia de conflito em vermelho `#e5372b`, que vira verde `#3ecf6e` no fim. Fontes: Barlow Condensed (badges e legenda)
  e Manrope (subtítulos). Tom visual: sem logo do canal (ainda não existe).
- **Voz:** VoiceStudio local (perfil "joao gabriel"), conforme o combinado do canal. Se não abrir, a alternativa
  gratuita é edge-tts `pt-BR-AntonioNeural`, como no vídeo anterior. Nenhum serviço pago.
- **Premissas:** 60 s por ser a duração do canal (você não pediu outra). A Nadini é uma figura low-poly estilizada,
  sem foto. Os nomes "Nadini" e "Aline" ficam como você escreveu. Termos como "HORA FANTASMA" são humor nosso,
  não termo oficial. O horário de 14h às 15h e as cores do relógio vêm do que você disse; o resto é invenção.

## 2. Tabela cronológica

Convenção: timestamps em MM:SS:FF (FF de 00 a 29). Os quadros são globais e semiabertos, [início, fim). As animações
usam quadros **locais**; o "≈" marca estimativas a ~155 palavras/min. Depois da voz real, `W("sN", i)` passa a ser
o quadro exato da palavra i (a contagem começa em 0) e os cortes são realinhados à fala.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:06:00 | 0 - 180 | A Nadini arrumou dois empregos. Loja de celular de manhã. Padaria de tarde. | Abre num plano aberto da maquete (`P.wide`, dist 30, az 10°, el 14°) e faz dolly-in até a Nadini parada no pé da torre do relógio, entre as duas lojas (`P.street`).<br>Gancho: a Nadini já está em quadro e carimba dois contratos. | Maquete (rua, loja à esquerda, padaria à direita), torre de relógio ainda neutra, Nadini com crachá, dois contratos, moedas. | `town.rise` 0→1 (0→36, out).<br>`nadini.enter` spring 0→1 (≈20→47, damping 10).<br>`contractLoja.stamp` spring 0→1 (≈66→81, damping 9).<br>`contractPadaria.stamp` spring 0→1 (≈124→139, damping 9).<br>`coins.rain` 0→1 (≈124→180, linear). | `2 EMPREGOS` positive, sub "dois salários" (≈43→174).<br>Highlights: NADINI, DOIS, EMPREGOS, LOJA, PADARIA. |
| 00:06:00 - 00:13:00 | 180 - 390 | A loja vai até as três. A padaria começa às duas. Sobra uma hora de problema. | A câmera sobe da Nadini até o relógio (`P.clock`, dist 12) em 0,8 s. O relógio vira um gráfico de pizza: o arco azul da loja cresce de 8h até 15h, o arco laranja da padaria cresce de 14h até 20h, e onde se tocam acende uma fatia vermelha pulsando. | Torre de relógio com arcos (azul, laranja, fatia vermelha), Nadini pequena embaixo suando. | `clock.focus` 0→1 (0→24, soft).<br>`clock.arcLoja` 0→1 (≈0→72, linear).<br>`clock.arcPadaria` 0→1 (≈78→130, linear).<br>`clock.overlap` spring 0→1 (≈136→166, damping 8).<br>`nadini.sweat` 0→1 (≈159→210). | `LOJA ATÉ 15H` info (≈43→78).<br>`PADARIA ÀS 14H` info (≈89→136).<br>`HORA FANTASMA` negative, sub "14h às 15h" (≈147→fim).<br>Highlights: TRÊS, DUAS, HORA, PROBLEMA. |
| 00:13:00 - 00:20:00 | 390 - 600 | Plano um: sair de fininho. Mas a chefe, Aline, tem radar de funcionário. Bipou. | Do relógio (14:00) a câmera desce até a porta da loja (`P.lojaDoor`) e para na Aline (`P.aline`). A Nadini anda na ponta dos pés, de costas pra chefe. Da cabeça da Aline sai um anel de radar que varre a loja e trava na Nadini. | Porta da loja, Nadini de ponta de pé, Aline de braços cruzados com antena na cabeça, anel de radar. | `clock.hand` 45°→60° (0→31, linear, ponteiro vai de 13h30 às 14h).<br>`nadini.sneak` 0→1 (≈31→112, linear).<br>`aline.radar` 0→1 (≈112→159, linear).<br>`nadini.freeze` spring 0→1 (≈159→191, damping 7).<br>`camera.shake` 1→0 (≈159→174, out). | `PLANO 1` info, sub "sair de fininho" (0→66).<br>`RADAR` negative, sub "chefe Aline" (≈112→fim).<br>`BIPOU` negative (≈159→fim).<br>Highlights: FININHO, CHEFE, ALINE, RADAR, BIPOU. |
| 00:20:00 - 00:26:00 | 600 - 780 | Plano dois: um manequim de crachá no balcão. Ele atende. Ele sorri. | Close no balcão da loja (`P.counter`). A Nadini tira o crachá, coloca num manequim de vitrine e sai correndo pela porta dos fundos. O manequim mexe a cabeça e sorri com uma fala em loop. | Balcão, manequim de vitrine, crachá voando, porta dos fundos, balão de fala "um momentinho". | `mannequin.enter` spring 0→1 (≈43→68, damping 12).<br>`cracha.swap` 0→1 (≈66→89, linear).<br>`nadini.exitBack` 0→1 (≈89→112, in).<br>`mannequin.nod` spring (≈112→136).<br>`mannequin.smile` spring (≈136→166, damping 9). | `PLANO 2` info (0→43).<br>`CLONE DE VITRINE` positive, sub "ele atende" (≈43→fim−4).<br>Highlights: MANEQUIM, CRACHÁ, ATENDE, SORRI. |
| 00:26:00 - 00:33:00 | 780 - 990 | Funcionou até um cliente pedir desconto. O manequim não negociou. Caiu duro. | A câmera fica no balcão (`P.counter`). Entra um cliente, o balão pede "10% de desconto?", a câmera empurra pro manequim (dist 5,5), que tomba de cara com tranco de câmera. No fim a Aline espia pela porta. A câmera recua pro plano da rua (`P.catapult`). | Cliente, balão de desconto, manequim, Aline espiando. | `customer.enter` spring 0→1 (0→24).<br>`customer.ask` 0→1 (≈54→74, out).<br>`mannequin.fall` 0°→90° (≈112→134, in).<br>`camera.shake` 1→0 (≈124→145, out).<br>`aline.peek` spring 0→1 (≈136→154, damping 10). | `PEDIU DESCONTO` negative (≈43→112).<br>`CLONE CAIU` negative, sub "plano 2: falhou" (≈124→fim).<br>Highlights: CLIENTE, DESCONTO, MANEQUIM, NEGOCIOU, CAIU. |
| 00:33:00 - 00:40:00 | 990 - 1200 | Plano três: física. Uma baguete vira catapulta. Da loja pra padaria em dois segundos. | Plano aberto da rua (`P.catapult`). Uma baguete gigante se monta como alavanca, a Nadini senta na ponta, a baguete dobra e dispara. A câmera acompanha o arco (tracking) de uma loja à outra, com um cronômetro 2D de 00:00 a 00:02. Pouso numa cesta de pães da padaria. | Baguete-catapulta, Nadini, cesta de pães, cronômetro 2D, rastro de vento. | `catapult.build` spring 0→1 (≈43→71, damping 11).<br>`catapult.pull` 0→1 (≈66→89, in).<br>`nadini.flight` 0→1 (≈89→149, linear, arco loja→padaria).<br>`timer.progress` 0→1 (≈89→149).<br>`nadini.land` spring 0→1 (≈149→176, damping 8). | `PLANO 3` info, sub "física" (0→43).<br>`CATAPULTA DE BAGUETE` positive (≈43→89).<br>`2 SEGUNDOS` info (≈136→fim−4).<br>Highlights: FÍSICA, BAGUETE, CATAPULTA, PADARIA, SEGUNDOS. |
| 00:40:00 - 00:47:00 | 1200 - 1410 | Chegou na hora, com celular no bolso. O cliente pediu um pão. Levou um celular. | Balcão da padaria (`P.padCounter`). A Nadini, de avental, tem celulares espiando do bolso. Um cliente pede "1 pão francês"; ela entrega um celular, e o cliente fica olhando pra tela sem entender. | Balcão da padaria, forno, avental, celulares no bolso, cliente, balão "1 pão francês". | `nadini.apron` 0→1 (0→15).<br>`phones.pocket` spring 0→1 (≈43→61).<br>`customer2.enter` spring (≈89→110).<br>`customer2.order` 0→1 (≈112→130, out).<br>`handoff.phone` 0→1 (≈147→160, linear).<br>`customer2.confused` spring (≈170→190). | `CELULAR NO BOLSO` negative (≈43→89).<br>`PEDIDO ERRADO` negative, sub "pediu pão, levou celular" (≈147→fim).<br>Highlights: CHEGOU, CELULAR, BOLSO, PÃO, LEVOU. |
| 00:47:00 - 00:54:00 | 1410 - 1620 | Aline chegou furiosa. Viu a fila: todo mundo querendo pão com capinha. Aline teve uma ideia. | A câmera abre na porta da padaria (`P.padDoor`) com a Aline entrando em fúria, vapor saindo das orelhas. Corta pra fila (`P.lineup`): todo mundo segura um pão com capinha de celular (ideia saída do erro da Nadini). Os olhos da Aline viram cifrões; acende uma lâmpada sobre a cabeça. | Aline com vapor, fila de clientes, pães com capinha, olhos de cifrão, lâmpada. | `aline.arrive` 0→1 (0→31, linear).<br>`aline.steam` 0→1 (≈20→43).<br>`fila.grow` 0→1 (≈43→78).<br>`pao.capinha` spring 0→1 (≈112→136).<br>`aline.eyes` spring 0→1 (≈147→170).<br>`aline.idea` spring 0→1 (≈182→206, damping 9). | `FILA` warning (≈43→112).<br>`PÃO COM CAPINHA` info (≈112→147).<br>`IDEIA DA ALINE` positive (≈170→fim).<br>Highlights: ALINE, FURIOSA, FILA, CAPINHA, IDEIA. |
| 00:54:00 - 01:00:00 | 1620 - 1800 | Hoje é a Padaria Celular. Um lugar só. Dois horários. Zero conflito. | A câmera sobe até o letreiro (`P.sign`), depois recua pro plano final (`P.final`). As duas lojas deslizam e se encaixam numa só, o letreiro vira "PADARIA CELULAR", e a fatia vermelha do relógio vira verde. A Nadini acena com os dois braços no meio. Confete no fim, com meio segundo de respiro. | As duas lojas fundidas, letreiro 3D, relógio com fatia verde, Nadini de avental e crachá, confete. | `town.merge` 0→1 (0→54, inOut).<br>`sign.enter` spring 0→1 (≈43→70, damping 9).<br>`clock.overlapGreen` 0→1 (≈101→124, linear).<br>`nadini.wave` (rad, seno por quadro) (≈124→180).<br>`confetti.burst` 0→1 (≈136→170). | `FUSÃO` positive (≈43→124).<br>`ZERO CONFLITO` positive, tamanho grande (≈124→fim).<br>Highlights: PADARIA, CELULAR, LUGAR, HORÁRIOS, CONFLITO. |

## 3. Estrutura de State / Props para Remotion

Veja [scene-plan.ts](scene-plan.ts): tipos e as 9 cenas completas, no mesmo formato do template. A linha do tempo é
determinística, derivada do frame atual: sem timers, `Date.now`, estado incrementado em efeitos nem `Math.random`
sem semente (o confete, o vapor e o radar usam `random(seed)` do Remotion). Dentro de cada `Sequence`, tudo usa
frames locais. Camada 3D real com `@remotion/three` e R3F (maquete, relógio, personagens). Camada 2D: badges,
legendas, balões de fala e o cronômetro da catapulta. Não é 2.5D.

## 4. Áudio e montagem

**Narração integral** (idêntica à tabela):

> A Nadini arrumou dois empregos. Loja de celular de manhã. Padaria de tarde. A loja vai até as três. A padaria
> começa às duas. Sobra uma hora de problema. Plano um: sair de fininho. Mas a chefe, Aline, tem radar de funcionário.
> Bipou. Plano dois: um manequim de crachá no balcão. Ele atende. Ele sorri. Funcionou até um cliente pedir desconto.
> O manequim não negociou. Caiu duro. Plano três: física. Uma baguete vira catapulta. Da loja pra padaria em dois
> segundos. Chegou na hora, com celular no bolso. O cliente pediu um pão. Levou um celular. Aline chegou furiosa.
> Viu a fila: todo mundo querendo pão com capinha. Aline teve uma ideia. Hoje é a Padaria Celular. Um lugar só.
> Dois horários. Zero conflito.

- **Contagem:** 124 palavras. A ~155 palavras/min dão ~48 s de fala; com 8 pausas de 0,5 s a 0,7 s e a entrada de ~0,25 s
  por cena, ficam ~55 s, e os ~5 s que sobram são pros gags sem voz (queda do manequim, voo, confete). Se a voz real
  estourar, encurto o texto antes de acelerar a voz.
- **Voz:** seca, de narrador de documentário, sem rir da própria piada. Perfil "joao gabriel" no VoiceStudio.
- **Efeitos** (sintetizados em código, `scripts/sfx.py`): carimbo, moedas, tique do relógio, bip de radar, pop do
  manequim, "um momentinho" em bips de voz (não é voz real), queda, esticada e disparo da baguete, whoosh do voo, baque
  na cesta de pães, sino de ideia, baque de fusão e fanfarra curta no letreiro.
- **Trilha** (`scripts/music.py`): groove leve de elevador de loja, sincopado, que sobe de tensão nos planos 1 a 3 e
  resolve em maior na fusão. Abaixa sob a voz.
- **Legendas:** blocos curtos, palavra a palavra com tempos finais só depois do alinhamento com o áudio.

## 5. Critérios de aceite e notas de verificação

- [x] Gancho imediato (a Nadini já está em quadro, carimbando dois contratos, no frame 0).
- [x] Cadeia causal: dois turnos → hora em conflito → fininho (radar) → clone (cai) → catapulta (celular na padaria) →
  fila de pão com capinha → fusão. Cada plano nasce do fracasso do anterior.
- [x] Explicação antes do nome (o relógio mostra a sobreposição, depois vem "HORA FANTASMA").
- [x] Sistema visual persistente: a mesma maquete, o mesmo relógio, as mesmas duas lojas do começo ao fim.
- [x] Conclusão com o sistema completo (lojas fundidas, relógio verde, conflito zerado).
- [x] Leitura em celular: badges no topo (a partir de ~262 px), legenda centrada em ~1418 px, nada importante acima
  de 250 px nem abaixo de 1540 px.
- [x] Tabela completa, 9 linhas, 7 colunas; quadros contíguos de 0 a 1800 (soma = 180+210+210+180+210+210+210+210+180 = 1800).
- [x] Narração compatível com o tempo (124 palavras em 60 s, sobra de tempo pros gags).
- [x] Array de `scene-plan.ts` consistente com a tabela.
- [x] Nenhum asset alegado como existente: tudo é planejado; a voz e os efeitos só existem depois da Fase 2.
- **Fontes consultadas:** nenhuma. É ficção, e nenhuma afirmação técnica ou legal é feita. O roteiro **não** dá a
  entender que sair do trabalho no meio do turno, deixar um boneco no lugar ou se arremessar seja um jeito real de
  resolver conflito de horário. Se quiser citar regra trabalhista (como a jornada com dois vínculos), peço fontes
  oficiais antes.
- **Limites:** o agente não ouve áudio. Nada foi renderizado, buildado nem verificado visualmente; isto é só o plano.
- **Pendência de segurança:** se Nadini e Aline são pessoas reais, ambas precisam topar aparecer (a Aline faz papel
  de chefe com radar, de forma carinhosa; ninguém é demitido nem humilhado).
