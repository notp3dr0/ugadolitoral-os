# Agente 1 · Câmera (filmar o bastidor por dentro do motor)

Você filma o corredor 3D de verdade (`portfolio/site-lab/bastidor.html`), quadro a quadro, com câmera de
cinema. Não é gravação de tela: você toma o controle da câmera e do relógio do motor. Sua pasta:
`captura/`. Suas saídas: `quadros/<ID>/<passe>/`.

## O que já se sabe do motor (conferido em 2026-11-14)

- A página expõe `window.__bastidor = { plan, seed, world }`. Em `world`: `scene`, `camera`
  (perspectiva, `rotation.order = 'YXZ'`, fov 80 quando a tela é vertical), `renderer`, `controls.state`
  (`s` = metros no trilho, `yaw`, `pitch`, `lateral`, `enabled`), `prints.items` (as cópias; cada uma tem
  `mesh` e `p`), `dressing` (enfeites, `dressing.door = { leaves, stage }`, `dressing.sheet`),
  `projections`, `focus`, `hud`, `pause()`, `resume()`, `railPose(now)`, `update(dt, now, pose)`.
- **`world.override = { x, y, z, yaw, pitch }`** substitui a pose do trilho. É a porta de entrada pra
  câmera livre. O laço (`bastidor/main.js`, função `frame`) faz: `controls.update` → pose →
  `camera.position/rotation` → `world.update(dt, now, pose)` → `renderer.render`.
- `plan.rail.at(s)` dá `{x, z, dx, dz}`; `plan.rail.total` é o comprimento; `plan.door` é a porta do
  PALCO; `plan.alas`, `plan.bounds`, `plan.walls`. Altura do olho: `EYE = 1.62`. Pé-direito 3,3 m.
- Parâmetros de URL: `?semente=fixa` (trava o sorteio: **usar sempre**, senão os passes não batem),
  `?s=`, `?olhar=`, `?planta`, `?parado`, `?encontros=seguranca` (força um encontro; ver
  `bastidor/encounters.js` e `scenes.js` pros nomes), `?debug`.
- As cópias carregam a textura sob demanda e entram em 0,5 s pelo relógio real (`prints.js`). **Aqueça
  cada trecho antes de filmar** e confirme que não ficou cópia em papel branco por carga atrasada.
- Os filmes projetados são `<video>`: em captura quadro a quadro eles não andam sozinhos no tempo certo.
  Pause e posicione `currentTime` a cada quadro (esperando o `seeked`).
- Como abrir o Chrome com GPU: copie de `portfolio/ferramentas/bastidor.mjs` (`channel: 'chrome'`,
  `--use-angle=d3d11` etc.). Viewport 540×960 com `deviceScaleFactor: 2` dá 1080×1920.

## O arreio (faça primeiro)

Um script Node (`captura/filmar.mjs`) que recebe o ID do plano e grava a sequência. Requisitos:

1. **Relógio virtual.** Nada de tempo real: cada quadro avança exatamente 1/30 s (ou 1/120 s nos planos
   com desfoque). Caminho sugerido: script de inicialização que substitui `performance.now`,
   `Date.now`, `requestAnimationFrame` e os timers por um relógio que você avança à mão; animações CSS
   pela Web Animations API (`document.getAnimations()`, pausar e empurrar `currentTime`). Se achar
   caminho mais sólido, use, desde que duas rodadas do mesmo plano deem os mesmos quadros.
2. **Planos declarativos.** Cada plano é um objeto: duração em quadros, função de pose da câmera pelo
   tempo, preparo (encontro forçado, HUD escondido ou não, porta abrindo), subquadros. Assim ajustar um
   plano é mexer em números, não reescrever o arreio.
3. **Três passes com a mesma câmera, idênticos quadro a quadro:**
   - `cor`: a imagem do corredor como ela é (neblina, luz vermelha, tudo). HUD escondido, salvo indicação.
   - `fio`: **desenho técnico limpo, branco sobre preto**, com antisserrilhado. Arestas de verdade
     (`EdgesGeometry` ou equivalente), **sem as diagonais dos triângulos**; cada cópia vira o retângulo
     dela; gente vira contorno; linha escondida atrás de parede fica escondida (desenhe os sólidos em
     preto antes, com `polygonOffset`). Sem neblina, mas a linha pode perder força com a distância.
     O Python tinge de vermelho depois: entregue em tons de cinza.
   - `prof`: distância da câmera, linear, de 0 a 30 m, em 16 bits num PNG (R = byte alto, G = byte
     baixo, B = 0; onde não há nada, 65535). Material de substituição com shader próprio. Partícula e
     halo translúcido ficam fora deste passe.
4. **Desfoque de movimento** nos planos marcados: 4 subquadros por quadro, entregue já a média (só no
   passe `cor`; `fio` e `prof` vão do subquadro central).
5. Formato: `cor` e `fio` em JPG qualidade 95; `prof` em PNG. Nomes `000000.jpg`, `000001.jpg`...

## Os planos

Os quadros de saída estão em `PLANO.md` e `montagem.json`; as batidas, em `tempo.json`. O que importa em
cada um é a intenção. A composição é sua: ande pelo corredor, veja o que tem, escolha os melhores
lugares. **Vertical 9:16**: componha pra isso (o corredor é alto e estreito, use a fuga).

- **`A1_planta`** (221 q., `fio` + `prof`). Os quadros 0 a 6 são pretos. Na batida 0 (q. 7) nasce a
  primeira linha. Batidas 0 a 8 (q. 7 a 114): a planta inteira vista de cima, girada pra ocupar o quadro
  vertical com margem, **se desenhando** do começo do trilho até a porta do PALCO (o traço avança, não é
  fade). Rótulos técnicos minúsculos em Inconsolata, no máximo 4 ao mesmo tempo, como cota de planta
  (`163 m`, `7 lances`, `31 alas`, `109 cópias`: **leia os números do `plan`**, não copie daqui).
  Batidas 8 a 12 (q. 114 a 168): a câmera inclina de cima pra perspectiva enquanto as paredes **sobem**
  do chão, e desce até a altura do olho na entrada. Batidas 12 a 16 (q. 168 a 221): já dentro, andando
  pra frente, devagar e acelerando. Um movimento só, contínuo, sem corte.
- **`B1_travessia`** (215 q., três passes). Continua **exatamente** da pose e velocidade em que o A1
  termina. Segue o trilho acelerando: perto de 3 m/s no começo, perto de 14 m/s nas batidas 28 a 31.
  O olhar balança suave pras paredes com cópias; nas curvas do corredor, antecipe o giro (nada de
  solavanco). Desfoque de movimento a partir da batida 24 (q. local 108). Escolha o trecho do corredor
  mais rico em cópias.
- **`B2_credencial`** (30 q., `cor`). A credencial BACKSTAGE em detalhe, balançando (ela tem física
  própria em `badge.js`). É elemento de página: aqui a captura inclui o HTML. Fundo escuro, enquadrada
  grande, legível.
- **`B3_vulto`** (16 q., `cor` + `prof`). O segurança em contraluz, de relance, câmera passando.
- **`C2a`, `C2b`, `C2c`, `C2d`** (16 q. cada, três passes). Quatro cópias diferentes (artistas e cores
  diferentes, fotos fortes, de preferência verticais), cada uma de frente, **no mesmo enquadramento**, a
  uns 1,5 m, com um empurrão lento pra frente (5 a 10 cm no plano). A textura grande da foto carregada.
  Em sequência, parecem a mesma câmera pulando de cópia em cópia.
- **`C2e_mergulho`** (29 q., três passes). Parte do mesmo enquadramento dos C2 numa quinta cópia
  (vertical, forte) e mergulha até a foto **cobrir o quadro inteiro** (corte central, tipo `cover`),
  chegando nisso no quadro local 26 e segurando. Acelera no fim (ease-in). Grave em `pronto.json` qual é
  a foto (`"foto": "<caminho do arquivo -lg.webp>"`), o agente 3 corta pra ela.
- **`C5a_seguranca`** (29 q.). O encontro com o segurança (colete refletivo, SEGURANÇA no peito). Câmera
  em travelling lateral ou empurrão. Se o braço da pulseira (HTML) entrar bem no quadro vertical, pode
  incluir no passe `cor`; se não, só o 3D.
- **`C5b_projecao`** (29 q.). Um filme projetado na parede, o facho e a poeira; a câmera passa. O vídeo
  tem que estar andando.
- **`C5c_camarim`** (16 q.) e **`C5d_artista`** (16 q.). Um detalhe de enfeite (camarim, rider, mesa da
  água) e o artista passando.
- **`C5e_setlist`** (29 q.). A setlist na parede; nos últimos 8 quadros, uma panorâmica rápida que vira
  pro fundo do corredor (com desfoque), pra jogar o movimento no `C7`.
- **`C7_porta`** (109 q., três passes). Corrida até a porta do PALCO. Começa a uns 25 a 30 m dela, rápido
  (com desfoque), e vai chegando. No quadro local 80 (batida 62) as folhas começam a abrir (o motor tem
  a animação do fim em `main.js`, perto de `doorPose` e `startEnding`: reaproveite a geometria, mas o
  tempo é o seu). No local 94 (batida 63) a porta está aberta e a câmera atravessa. Do local 98 ao 106
  o quadro escurece até **preto total** (lá dentro é o escuro do palco). Sem o clarão branco do motor:
  o clarão é do agente 3, na batida seguinte.

## Critérios de pronto

- Duas rodadas do mesmo plano dão os mesmos quadros (confira um par).
- Nos três passes a câmera coincide (sobreponha `fio` em `cor` num quadro e olhe).
- Nenhuma cópia em branco, nenhum HUD sobrando, nenhum quadro repetido ou pulado.
- Folha de revisão por plano em `captura/revisao/<ID>.jpg`, aberta e olhada por você.
- `pronto.json` em cada plano. Entregue na ordem: `A1`, `B1`, `C7`, `C2*`, `C5*`, `B2`, `B3`
  (o agente 3 vai montando com o que chega).
- Se algo não der (um encontro que não enquadra, a credencial que não captura), entregue a melhor
  alternativa dentro do corredor e diga o que trocou. Não deixe buraco.
