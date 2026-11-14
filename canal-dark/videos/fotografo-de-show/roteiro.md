# Roteiro · Como funciona a carreira de fotógrafo de show? (v1)

> Origem: escrito pelo agente a partir do briefing do Pedro (2026-11-04), skill `remotion-problem-resolve-video`.
> Status: **aguardando aprovação**. Convenção: timestamps MM:SS:FF a 30 fps; frames em intervalo
> semiaberto [início, fim). Os tempos são estimativas até existir a narração real.

## 1. Briefing de produção

- **Tema/recorte:** sátira no formato "como funciona" educativo. O "mecanismo" explicado é a carreira de
  um fotógrafo de show iniciante no Brasil: dois empregos pra comprar a câmera, falta de cliente, trabalho
  de graça "pela experiência", credencial como pagamento, zero real vindo da foto.
- **Por que funciona:** a voz é séria e didática, igual a um vídeo de "como funciona um poço artesiano".
  A graça vem do contraste entre o tom de aula e o absurdo do que está sendo explicado. Triste é o
  assunto; engraçado é o jeito de contar.
- **Público:** quem vive ou acompanha cena de show, rap, música e cultura urbana; fotógrafos, artistas,
  produtores. Objetivo: identificação ("é exatamente isso") e compartilhamento, com a moral no fim.
- **Formato:** 90 s, 1080 × 1920, 9:16, 30 fps (2700 frames), pt-BR. Instagram Reels e TikTok.
- **Gancho:** abre no fim da história. Close do fotógrafo no palco, flash estourando, seis credenciais no
  pescoço e uma etiqueta fixa em cima da cabeça: FOTOGRAFIA: R$ 0,00. A voz pergunta "como isso é
  possível?" e o vídeo **rebobina**: o céu gira ao contrário, as credenciais saltam do pescoço uma a uma e o
  boneco volta pro quartinho. É a pergunta de vídeo educativo com a resposta mais triste do mundo, e o
  rebobinar é a promessa visual de que a gente vai mostrar o caminho.
- **Sistema construído:** uma maquete low-poly de um quarteirão no litoral (padaria, prédio do
  telemarketing, quartinho, casa de show, mercado, ponto de ônibus, faixa de areia e mar na borda). O
  mesmo boneco "Você" atravessa a maquete e vai acumulando coisas que ficam visíveis até o fim: olheira,
  câmera no pescoço, credenciais (de 0 a 6), fotos coladas na parede. A etiqueta FOTOGRAFIA: R$ 0,00
  acompanha o boneco o vídeo inteiro e **nunca muda**: é a piada que atravessa todos os ciclos.
- **Cadeia de ciclos:** câmera cara → dois empregos → câmera chega → sem cliente → "pagamento em
  experiência" → melhor trabalho da vida → sem crédito → DM pra todas as casas → visualizado → credencial
  "como favor" → credencial não paga nada, nem água → seis meses, R$ 3,47 → amanhã tem padaria às cinco.
- **Direção de arte:** 3D low-poly fosco (`flatShading`). Base da maquete em concreto cinza quente,
  off-white `#f2f0eb`, preto. Acento único: **vermelho Uga** (luz de palco, etiqueta R$ 0,00, corações).
  Céu em degradê que conta a hora: laranja de amanhecer (padaria), azul cobalto de noite (telemarketing e
  edição), preto com luz vermelha (show), cinza de dia (mercado e ônibus). Badges nas cores da skill
  (vermelho problema, verde solução, azul termo, amarelo pergunta). Fonte: Barlow Condensed (a do
  portfólio do Uga) em badges, legendas e cartela, peso 800 a 900.
- **Personagens:** Você (boneco de cápsula com cabeça, troca de roupa: casual, avental e touca de padeiro,
  headset). O Produtor (mesmo boneco, óculos escuros, corrente dourada, celular na mão). O Produtor 2
  (o mesmo modelo com boné, de propósito: todo produtor é o mesmo). Nenhuma casa de show real é citada
  ou desenhada.
- **Voz:** narrador em segunda pessoa, calmo, didático e seco, sem rir da própria piada. Planejado: voz
  do Pedro pelo VoiceStudio local (perfil "joao gabriel"). Se o VoiceStudio não abrir (não abriu em
  2026-11-03), alternativa gratuita: edge-tts `pt-BR-AntonioNeural`. TTS pago só com autorização.
- **Som:** trilha boom bap sintetizada em código, baixa sob a voz, com **cortes de silêncio** nas
  punchlines ("Ninguém paga.", "Sem crédito.", "três reais"). Efeitos sintetizados, sem áudio de terceiros.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:06:00 | 0 - 180 | Esse fotógrafo trabalha toda semana e nunca recebeu um real. Como isso é possível? | Abre sem respiro em close do Você no palco da casa de show (orbit alvo [0; 1,0; −1,6], d=4,5, az 14°, el 6°), deriva até az 20° e d=4,0. Em "Como" (palavra 10), dolly-out rápido até a maquete inteira (P.wide: alvo [0; 0,6; 0], d=26, az 28°, el 24°), inOut. | Maquete completa; casa de show com palco aceso; plateia (24 cápsulas); Você com câmera e 6 credenciais; etiqueta 2D ancorada sobre a cabeça "FOTOGRAFIA: R$ 0,00" (vermelha); overlay 2D de rebobinar (linhas de varredura + "◀◀"). | `photoLabel.opacity` spring 0→1 (local 12→42). `flash.burst` interpolate 0→1→0 em 12→18 e em W(s1,9)→+6. `crowd.jump` 0→1 linear 0→W(s1,10) (pulo senoidal por cápsula, fase com `random(seed)`). Em W(s1,10): `rewind.amount` 0→1 (in) até 172; `sky.time` 0,95→0,15 linear (céu gira ao contrário); `hero.lanyards` 6→0 linear (contagem inteira, cada credencial salta com pop); `hero.z` −1,6→2,5 e `hero.hasCamera` 1→0 em 160→172 (o boneco volta pro quartinho, sem câmera). | ❓ TRABALHA E NÃO RECEBE? (warning, icon "?", W(s1,6)→176). Legenda: NUNCA, REAL, POSSÍVEL. Etiqueta R$ 0,00 fixa a partir daqui até o fim. |
| 00:06:00 - 00:13:00 | 180 - 390 | Você quer ser fotógrafo. Só que câmera é cara. Então, de manhã, padaria. De noite, telemarketing. | P.wide → dolly-in no quartinho (alvo [0; 1,0; 2,5], d=7, az 8°, el 14°) até W(s2,8); tracking até a padaria (alvo [−3,5; 0,8; 1,5], d=8, az −24°, el 14°) em W(s2,9)→W(s2,12); tracking até o prédio do telemarketing (alvo [−3,5; 1,6; −2,5], d=9, az −36°, el 10°) em W(s2,13)→W(s2,15). | Quartinho; Você de roupa casual; balão de pensamento 3D com uma câmera dentro; etiqueta de preço gigante "$$$$" pendurada na câmera; padaria (toldo listrado, forno, vitrine de pães); prédio do telemarketing (janelas acesas, letreiro "ALÔ"); sol e lua no arco do céu. | `dream.camera` spring 0→1 em W(s2,3) (damping 11) e interpolate 1→0 em W(s2,9)→+8. `price.tag` spring 0→1 em W(s2,6), com balanço `price.swing` ±12° (deg) até W(s2,9). `hero.x` 0→−3,2 e `hero.z` 2,5→1,9 (u3d) inOut em W(s2,9)−6→W(s2,11). `hero.outfit` 0→1 (padeiro) em W(s2,11), pop de escala 0,85→1. `sky.time` 0,15→0,25 em W(s2,10)→W(s2,12) e 0,25→0,85 em W(s2,13)→W(s2,15). `hero.z` 1,9→−1,8 inOut em W(s2,13)−4→W(s2,14). `hero.outfit` 1→2 (headset) em W(s2,14). | ✖ CÂMERA CARA (negative, W(s2,6)→W(s2,12)). ✔ DOIS EMPREGOS, subtítulo "padaria + telemarketing" (positive, W(s2,12)→204). Legenda: FOTÓGRAFO, CARA, PADARIA, TELEMARKETING. |
| 00:13:00 - 00:21:15 | 390 - 645 | Cada pão vendido e cada cliente gritando no seu ouvido vira moeda no cofrinho. Até que, em vinte e quatro vezes... | Plano médio que pega padaria, prédio e quartinho (alvo [−1,5; 1,2; 0], d=14, az −10°, el 22°) em órbita lenta até az 10°. Em "Até que" (palavra 14), dolly-in no cofrinho sobre o quartinho (alvo [0; 2,6; 2,5], d=5, az 10°, el 8°), soft. | Cofrinho low-poly flutuando sobre o quartinho, com janela de corte que mostra o nível de moedas; moedas douradas; balões vermelhos "#$%&!" saindo do prédio; cartão de crédito 3D; Você em vaivém entre os dois empregos. | Time-lapse: `sky.time` 0,85→3,85 linear em 0→W(s3,13) (3 ciclos dia/noite, valor mod 1). `hero.shuttle` 0→6 linear na mesma janela (posição interpolada padaria↔prédio; roupa troca a cada meia viagem). `coins.emit` 0→1 em W(s3,1)→W(s3,13) (moedas saem do balcão e do prédio em arco até o cofrinho; seed fixa). `angry.bubbles` 0→1→0 em W(s3,5)→W(s3,10). `piggy.fill` 0→1 soft em W(s3,1)→W(s3,14). `piggy.scale` spring 1→1,25→1 em W(s3,13). `hero.fatigue` 0→0,6 linear 0→255 (olheira escurece, ombros caem). `card.installments` spring 0→1 em W(s3,17) (cartão gira 360° e mostra "24x"). `piggy.crack` 0→1 em 243→255. | ℹ COFRINHO, subtítulo "seu único investimento" (info, W(s3,13)→W(s3,17)). ℹ 24X SEM JUROS (info, W(s3,17)→252). Legenda: PÃO, GRITANDO, MOEDA, COFRINHO, VINTE, QUATRO. |
| 00:21:15 - 00:25:15 | 645 - 765 | Ela chega. A sua primeira câmera. | Close baixo e heroico no quartinho (alvo [0; 1,1; 2,5], d=4,2, az 12°, el 2°) com dolly-in lento até d=3,4. | Cofrinho explodindo em peças; caixa da câmera que cai do alto; feixes de luz volumétricos (cones aditivos) saindo da caixa; faíscas; Você erguendo a câmera com os dois braços. | `piggy.break` spring 0→1 em W(s4,0) (damping 9; peças voam com velocidade semeada, `piggy` invisível depois). `cameraBox.drop` spring 0→1 em W(s4,0)+4 (cai de y=4 a y=0,9 u3d). `cameraBox.open` 0→1 out em W(s4,2)→W(s4,4). `godrays.intensity` 0→1 em W(s4,2)→+10. `camera.lift` 0→1 soft em W(s4,4)→W(s4,5)+20 (braços sobem, câmera acima da cabeça). `sparkles` 0→1 na mesma janela. `hero.hasCamera` 0→1 em 110 (a câmera vai pro pescoço e não sai mais). | ✔ PRIMEIRA CÂMERA (positive, W(s4,4)→118). Legenda: PRIMEIRA, CÂMERA. |
| 00:25:15 - 00:32:15 | 765 - 975 | Mas ninguém te contrata. Então você fotografa o pão da padaria. Ficou lindo. Ninguém paga. | Quartinho (alvo [0; 1,0; 2,5], d=6, az −8°, el 14°); tracking até a padaria (alvo [−3,5; 0,9; 1,5], d=5,5, az −30°, el 10°) em W(s5,4)→W(s5,7). Em "Ninguém paga" a câmera quase para (deriva de 1°) por 1 s: é a pausa da piada. | Celular gigante flutuando ao lado do Você com a tela "0 mensagens"; um grilo low-poly pulando em cima do celular; pão num pedestal giratório com spot de estúdio; foto polaroide do pão; etiqueta "R$ 0,00" na polaroide. | `phone.show` spring 0→1 em W(s5,1). `cricket.jump` 0→1 linear em W(s5,3)→W(s5,4)+20 (3 pulos, arco parabólico). `hero.x` 0→−3,2 e `hero.z` 2,5→2,0 inOut em W(s5,4)→W(s5,6). `bread.glam` 0→1 em W(s5,8)→+12 (pedestal sobe e gira 180°, spot acende). `flash.burst` 0→1→0 em W(s5,11)→+6. `photo.print` spring 0→1 em W(s5,12) (a polaroide sai da câmera). `photo.priceTag` spring 0→1 em W(s5,13). `music.duck` 1→0 em W(s5,13)→+3 (silêncio seco). | ✖ SEM CLIENTE (negative, W(s5,1)→W(s5,11)). ✔ FOTO LINDA (positive, W(s5,11)→W(s5,13)). ✖ NINGUÉM PAGA (negative, W(s5,13)→206). Legenda: NINGUÉM, CONTRATA, PÃO, LINDO, PAGA. |
| 00:32:15 - 00:41:00 | 975 - 1230 | Aí uma casa de show te chama. Não tem verba, mas é uma vitrine absurda. Isso tem nome: pagamento em experiência. | Chicote da padaria pra casa de show (alvo [0; 1,4; −2,5], d=10, az 10°, el 12°) em 0→10; dolly-in até a porta, no Produtor e no Você (alvo [0,8; 1,2; −1,4], d=5, az 20°, el 8°) em W(s6,3)→W(s6,7); órbita leve de 20° até 28° até o fim. | Casa de show com letreiro neon vermelho; Produtor (óculos escuros, corrente dourada, celular); balão de chamada 3D; bolsos do Produtor virados pra fora; moldura dourada gigante escrita VITRINE; moeda 3D escrita "XP". | `call.ring` 0→1 em W(s6,0) (balão vibra ±4°). `casaShow.neon` 0→1 com piscada em W(s6,2)→+12. `hero.x` −3,2→0,3 e `hero.z` 2,0→−1,2 inOut em W(s6,3)→W(s6,7). `produtor.pop` spring 0→1 em W(s6,5). `produtor.pockets` spring 0→1 em W(s6,8). `vitrine.frame` spring 0→1 em W(s6,13) (desce de y=4 e emoldura o Você). `xpCoin.drop` 0→1 em W(s6,18)→+24 (a moeda gira, cai na mão do Você, atravessa a mão e quica no chão duas vezes). | ✖ SEM VERBA (negative, W(s6,7)→W(s6,15)). ℹ PAGAMENTO EM EXPERIÊNCIA, subtítulo "aceito em: lugar nenhum" (info, W(s6,18)→251). Legenda: CASA, SHOW, VERBA, VITRINE, EXPERIÊNCIA. |
| 00:41:00 - 00:48:15 | 1230 - 1455 | Você faz o melhor trabalho da sua vida. Edita até as quatro da manhã. Eles postam. Sem crédito. | Dentro do show (alvo [0; 1,0; −1,8], d=7, az −15°, el 8°) com órbita rápida até az 25° em 0→W(s7,8). Em "Edita": corte seco pro quartinho de noite (alvo [0; 1,2; 2,5], d=5, az 5°, el 12°). Em "Eles postam": dolly-out pro telão da fachada (alvo [0; 2,6; −3,2], d=8, az 0°, el 6°). | Luzes de palco (feixes vermelho e cobalto); plateia; caixa de som; pilha de fotos (cards brancos); mesa com notebook e relógio digital 3D; telão na fachada com um post (foto + "@casadeshow"); tarja "@você" sob a foto; tesoura low-poly. | `stage.lights` 0→1 em 0→W(s7,8) (varredura ±35° nos feixes). `crowd.jump` 0→1. `hero.y` 0→0,9 (u3d) spring em W(s7,3) (sobe na caixa de som). `flash.burst` em W(s7,3), W(s7,5) e W(s7,7) (+6 cada). `photos.fly` 0→1 em W(s7,3)→W(s7,8) (cards saem da câmera e empilham). `clock.time` 23→28 (23:00 a 04:00) em W(s7,8)→W(s7,13). `hero.fatigue` 0,6→0,85. `photos.toScreen` 0→1 em W(s7,14)→W(s7,15) (os cards voam pro telão). `screen.post` 0→1 em W(s7,15). `credit.cut` 0→1 em W(s7,16)→+14 (tesoura corta a tarja "@você", que cai girando). `music.duck` 1→0 em W(s7,16). | ✔ MELHOR TRABALHO DA VIDA (positive, W(s7,3)→W(s7,14)). ✖ SEM CRÉDITO (negative, W(s7,16)→221). Legenda: MELHOR, VIDA, QUATRO, POSTAM, CRÉDITO. |
| 00:48:15 - 00:55:15 | 1455 - 1665 | Agora vai. Você manda mensagem pra todas as casas da cidade. Visualizado. Visualizado. Visualizado. | Do telão, dolly-out alto pra cidade inteira (P.city: alvo [0; 0,5; 0], d=30, az 20°, el 48°), em órbita lenta de az 20° até 40°. | Quatro casas de show pequenas que brotam nas bordas da maquete; cinco aviõezinhos de papel; ícone de "visto" (olho cinza) sobre cada casa; Você no centro, olhando pra cima. | `casasExtra.rise` spring 0→1 em W(s8,0) (escalonado +4 frames por casa). `dms.fly` 0→1 em W(s8,3)→W(s8,10) (5 aviões em arco do Você até cada casa, seed fixa). `seen.marks` 0→3 em degraus em W(s8,11), W(s8,12), W(s8,13) (o olho aparece com pop e o avião correspondente cai no chão). `hero.hope` 1→0 em W(s8,11)→W(s8,13)+10 (cabeça abaixa 25°). | ❓ AGORA VAI? (warning, icon "?", W(s8,0)→W(s8,10)). ✖ VISUALIZADO, subtítulo "e não respondeu" (negative, W(s8,11)→206). Legenda: AGORA, TODAS, VISUALIZADO. |
| 00:55:15 - 01:01:15 | 1665 - 1845 | Uma responde: a gente te dá a credencial. Tá te fazendo um favor, viu? | P.city → dolly-in até uma das casas novas, onde está o Produtor 2 (alvo [5,2; 1,1; −4], d=6, az 30°, el 10°) em 0→W(s9,2); em "credencial", close no peito do Você (alvo no Você, d=3, az 10°, el 4°). | Avião de papel dourado que volta; Produtor 2 (mesmo modelo do Produtor, com boné); credencial com cordão; brilho de auréola em volta dela (sacro e irônico). | `reply.plane` 0→1 em W(s9,0)→+18 (volta em arco até o Você). `produtor2.pop` spring 0→1 em W(s9,1). `credential.drop` spring 0→1 em W(s9,7) (damping 8; desce do alto e encaixa no pescoço com overshoot). `hero.lanyards` 0→1 em W(s9,7)+10. `halo.credential` 0→1→0,4 em W(s9,7)→+20. `produtor2.thumb` spring 0→1 em W(s9,10) (joinha). | ℹ CREDENCIAL, subtítulo "moeda oficial do produtor" (info, W(s9,7)→176). ❓ UM FAVOR? (warning, icon "?", W(s9,12)→176). Legenda: CREDENCIAL, FAVOR. |
| 01:01:15 - 01:10:00 | 1845 - 2100 | Só que o mercado não aceita credencial. O ônibus não aceita credencial. E no show, nem água: é só pro camarim. | Tracking em três paradas: mercado (alvo [3,5; 0,9; 1,5], d=5,5, az 35°, el 10°) até W(s10,7); ponto de ônibus (alvo [3,5; 0,9; −1,5], d=5,5, az 50°, el 10°) até W(s10,12); porta do camarim na casa de show (alvo [−0,8; 1,0; −3], d=5, az −20°, el 10°) até o fim. | Mercado com caixa registradora e leitor; catraca de ônibus com luz; garrafa d'água; porta de camarim com estrela; braço do segurança; ✖ vermelho 3D que surge sobre cada leitor. | `hero.x`/`hero.z` até o mercado em 0→W(s10,2). `register.deny` 0→1 em W(s10,5)+2 (leitor fica vermelho, ✖ sobe com pop). `hero.x`/`hero.z` até o ônibus em W(s10,7)→W(s10,9). `turnstile.deny` 0→1 em W(s10,10) e `hero.bump` spring 0→1 (o Você bate na catraca e recua 0,3 u3d). `hero.x`/`hero.z` até o camarim em W(s10,12)→W(s10,14). `water.bottle` spring 0→1 em W(s10,15). `water.withdraw` 0→1 em W(s10,17)→+10 (o braço puxa a garrafa pra dentro). `camarim.door` 0→1 em W(s10,19)→+4 (bate). | ✖ MERCADO: NÃO ACEITA (negative, W(s10,5)→W(s10,9)). ✖ ÔNIBUS: NÃO ACEITA (negative, W(s10,10)→W(s10,14)). ✖ SEM ÁGUA, subtítulo "só pro camarim" (negative, W(s10,16)→251). Legenda: MERCADO, ÔNIBUS, CREDENCIAL, ÁGUA, CAMARIM. |
| 01:10:00 - 01:19:15 | 2100 - 2385 | Seis meses depois, seu amigo pergunta se você já tá rico. Você tem seis credenciais, mil curtidas e três reais na conta. | Quartinho (alvo [0; 1,2; 2,5], d=6, az 0°, el 12°) com dolly-in lento até d=4,5, az 12°, el 10° no fim (enquadra Você, celular e cofrinho novo). | Calendário 3D na parede; fotos coladas na parede (crescem em número); celular com balão de chat; corações vermelhos; cofrinho novo, vazio; display "R$ 3,47". | `calendar.flip` 0→6 em 0→W(s11,2)+10 (6 folhas viram). `sky.time` +6 ciclos na mesma janela. `hero.lanyards` 1→6 em degraus junto de cada folha (cada credencial com pop). `wall.photos` 0→1 (de 3 a 18 fotos). `chat.friend` spring 0→1 em W(s11,3) (balão "já tá rico? kkkk"). `likes.burst` 0→1 em W(s11,15)→W(s11,17) (corações saem das fotos e voam pro cofrinho). `likes.bounce` 0→1 em W(s11,17)→+12 (batem no cofrinho e quicam pra fora). `balance.show` spring 0→1 em W(s11,18). `music.duck` 1→0,2 em W(s11,18). | ℹ 6 MESES (info, 0→W(s11,3)). ✖ R$ 3,47, subtítulo "nenhum centavo veio da foto" (negative, W(s11,18)→281). Legenda: SEIS, RICO, CREDENCIAIS, CURTIDAS, TRÊS. |
| 01:19:15 - 01:30:00 | 2385 - 2700 | Pronto: agora você entende como funciona a carreira de fotógrafo de show. Visibilidade não paga a parcela da câmera. | Dolly-out até a maquete completa (P.wide, d=28, az 30°, el 26°) com órbita de az 30° até 42° em 0→W(s12,11). Em "Visibilidade" (palavra 12), dolly rápido até a padaria ao amanhecer (alvo [−3,5; 0,9; 1,5], d=7, az −20°, el 12°): o loop. Nos últimos 75 frames a cena escurece pra cartela. | Maquete completa com rótulos 3D (PADARIA, TELEMARKETING, CASA DE SHOW, MERCADO, VOCÊ); relógio "05:00" vibrando na padaria; Você de padeiro, com câmera e 6 credenciais no pescoço; cartão "7/24"; cartela final 2D. | `final.labels` 0→1 escalonado em W(s12,0)→W(s12,8). `sky.time` →0,2 (amanhecer) em W(s12,11)→W(s12,13). `hero.x` →−3,2, `hero.z` →1,9 e `hero.outfit` →1 em W(s12,12). `alarm.ring` 0→1 em W(s12,12) (vibra ±6°). `card.installments` com texto "7/24", spring em W(s12,16). `fade` 0→0,75 em 240→255 (escurece, a cartela fica legível). | ℹ FOTÓGRAFO DE SHOW, subtítulo "como funciona" (info, large, W(s12,3)→W(s12,12)). ✖ VISIBILIDADE NÃO PAGA A PARCELA (negative, large, W(s12,12)→240). ℹ UGA DO LITORAL, subtítulo "agenda aberta · aceito pix, não credencial" (info, large, 245→315). Legenda: PRONTO, CARREIRA, VISIBILIDADE, PARCELA, CÂMERA. |

`W(sN, i)` = frame local em que a palavra `i` (contando do zero) da fala `sN` começa. Antes do TTS é uma
estimativa a ~155 palavras/min; depois do áudio real, vem do alinhamento palavra a palavra.

## 3. Estrutura de State / Props

Os dados de todas as 12 cenas estão em `scene-plan.ts` (mesmo formato do `src/data/scenes.ts` do
template; vira esse arquivo na Fase 2 sem tradução). A linha do tempo é determinística, calculada a
partir do frame atual: sem timers, sem `Date.now`, sem estado que se incrementa e sem `Math.random`
(partículas de moeda, corações, aviões e pulos da plateia usam `random(seed)` do Remotion). Dentro de cada
`Sequence`, os componentes leem frames locais.

Duas camadas: a **3D** (`@remotion/three` + R3F) tem a maquete, o boneco, os objetos e as partículas; a
**2D** tem badges, legendas, a etiqueta "FOTOGRAFIA: R$ 0,00" (rótulo 2D ancorado num ponto 3D acima da
cabeça do Você, projetado com a pose da câmera do frame), os balões de chat, o overlay de rebobinar e a
cartela final. Não é 2.5D: a maquete é 3D de verdade.

## 4. Áudio e montagem

**Narração integral (201 palavras):**

Esse fotógrafo trabalha toda semana e nunca recebeu um real. Como isso é possível? Você quer ser
fotógrafo. Só que câmera é cara. Então, de manhã, padaria. De noite, telemarketing. Cada pão vendido e
cada cliente gritando no seu ouvido vira moeda no cofrinho. Até que, em vinte e quatro vezes... Ela chega.
A sua primeira câmera. Mas ninguém te contrata. Então você fotografa o pão da padaria. Ficou lindo.
Ninguém paga. Aí uma casa de show te chama. Não tem verba, mas é uma vitrine absurda. Isso tem nome:
pagamento em experiência. Você faz o melhor trabalho da sua vida. Edita até as quatro da manhã. Eles
postam. Sem crédito. Agora vai. Você manda mensagem pra todas as casas da cidade. Visualizado.
Visualizado. Visualizado. Uma responde: a gente te dá a credencial. Tá te fazendo um favor, viu? Só que o
mercado não aceita credencial. O ônibus não aceita credencial. E no show, nem água: é só pro camarim. Seis
meses depois, seu amigo pergunta se você já tá rico. Você tem seis credenciais, mil curtidas e três reais
na conta. Pronto: agora você entende como funciona a carreira de fotógrafo de show. Visibilidade não paga
a parcela da câmera.

- **Tempo:** 201 palavras a ~160 palavras/min dão ~75 s de fala. Sobram ~15 s pras pausas das piadas,
  pro coro da câmera e pra cartela final. Depois da voz real, os cortes passam a sair das falas
  (`utils/timing.ts`), mantendo os 2700 frames.
- **Intenção de voz:** tom de aula, calmo, sem ironia na voz. "Visualizado" três vezes, cada vez mais
  seco. "Tá te fazendo um favor, viu?" é a única fala com personagem: um pouco mais malandra, imitando o
  produtor.
- **Planos de voz:** VoiceStudio local (voz do Pedro, perfil "joao gabriel"). Alternativa gratuita:
  edge-tts `pt-BR-AntonioNeural`. Pago só com autorização.
- **Trilha (sintetizada):** boom bap a ~88 BPM, bem baixa sob a voz (−20 dB em relação à fala). Cortes de
  silêncio em "Ninguém paga." (s5), "Sem crédito." (s7) e "três reais" (s11, a trilha cai pra 20%). Na
  cena do show (s7) o beat sobe um pouco, abaixando de novo sob a voz. Acorde final em "Visibilidade".
- **Efeitos (sintetizados):** flash e obturador (s1, s5, s7), rebobinar de fita (s1), pop de balão (s2),
  sino do forno e telefone tocando (s2), moedas (s3, semeadas), gritaria abafada (s3), cartão (s3),
  cofrinho quebrando e coro (s4), grilo (s5), telefone e zumbido de neon (s6), moeda caindo e quicando
  (s6), tique de relógio e tesoura (s7), papel voando e bip de "visto" (s8), credencial caindo (s9), bip de
  erro, catraca e porta batendo (s10), página virando, pop de mensagem e moeda solitária (s11),
  despertador e badge grande (s12).
- **Legendas:** blocos provisórios no `scene-plan.ts`; os tempos finais, palavra a palavra, só depois do
  alinhamento com a voz real.

## 5. Critérios de aceite e notas

- **Gancho imediato:** frame 0 já é o close no palco com a etiqueta R$ 0,00; a pergunta fecha em ~4 s e
  o rebobinar começa logo depois.
- **Cadeia causal:** cada "solução" gera o próximo problema (câmera → sem cliente → experiência → sem
  crédito → DM → credencial → não paga nada). Os termos (DOIS EMPREGOS, PAGAMENTO EM EXPERIÊNCIA,
  CREDENCIAL) só aparecem depois de mostrados.
- **Sistema persistente:** mesma maquete, mesmo boneco; câmera, credenciais, olheira e a etiqueta
  R$ 0,00 acumulam e ficam visíveis até o fim.
- **Conclusão:** maquete completa com rótulos e a volta pra padaria (o loop).
- **Leitura no celular:** badges a partir de ~262 px, legenda centrada em ~1418 px, margens de ~90 px;
  badges e legendas nunca se sobrepõem.
- **Frames:** 12 cenas contíguas, de 0 a 2700, soma exata (180 + 210 + 255 + 120 + 210 + 255 + 225 +
  210 + 180 + 255 + 285 + 315 = 2700).
- **Cuidados de conteúdo:** nenhuma casa de show, produtor ou marca real aparece. Os números (24x, 6
  meses, 6 credenciais, mil curtidas, R$ 3,47, 7/24) são da história do personagem, não estatística.
  "Nunca recebeu um real" é da fotografia: os R$ 3,47 são o que sobrou da padaria (o subtítulo do badge
  deixa isso claro).
- **Nada foi gerado ainda:** nenhum áudio, asset ou render existe. Todos os `audioCues` estão como
  `planned`.
- **Fontes:** briefing do Pedro na conversa de 2026-11-04; marca do Uga (`_contexto/marca/`).
