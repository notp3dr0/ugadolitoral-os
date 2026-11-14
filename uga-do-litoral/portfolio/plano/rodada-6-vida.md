# Rodada 6 · vida no bastidor: a credencial viva e os encontros

Escrito em 2026-11-11 pelo Fable 5.2. O Pedro aprovou **todas** as ideias e todas as falas abaixo.
Quem executa é o Opus. Leia antes `LEIA-PRIMEIRO.md`; não precisa reler as rodadas 2 a 5.

**O espírito:** o bastidor deixa de ser só um lugar e passa a ter gente e acontecimento. O Pedro é
fotógrafo de show: o produtor nega água pra fotógrafo, o segurança pergunta "você é o quê do evento?"
pra quem está com uma câmera enorme e pulseira no braço. Humor seco, de quem viveu. E, como na rodada
5, **nunca igual**: a cada visita o site sorteia o que acontece.

**Pronto quando:** os passos abaixo estão no `lab`, um commit cada, e passam `fumaca.mjs`,
`toque.mjs`, `bastidor-planta.mjs` e `bastidor.mjs` (com os blocos novos que cada passo pede).

## Regras desta rodada

- **Gente é silhueta.** Ninguém tem rosto, ninguém é boneco 3D, nada de imagem gerada por IA. Cada
  pessoa é um plano com a silhueta desenhada em `<canvas>` (preto chapado, borda com um fio de luz),
  com um clarão por trás, como contraluz de palco. É a linguagem das fotos dele.
- **Fala é legenda.** Aparece em HTML na parte de baixo da tela (quem fala em mono pequeno, a fala em
  Arial negrito), com `aria-live="polite"`. Sem voz sintetizada.
- **Nada trava a pessoa de verdade.** Todo encontro se resolve sozinho em até 8 s se ela não fizer
  nada, e nenhum impede de usar SETLIST, ← ACERVO ou a rádio.
- **Sem numeração "01 / 03"** (regra da rodada 5) e sem travessão em texto.
- **Menos movimento:** encontros acontecem (são conteúdo), mas sem deslizes nem piscadas: as coisas
  aparecem e somem secas, o clarão vira nada.
- **Orçamento:** continua em 90 chamadas de desenho no pior caso. Silhuetas e objetos de um encontro
  só existem na cena se o encontro foi sorteado.
- Tudo usa a semente da visita (`visitSeed()` de `js/shuffle.js`); `?semente=` reproduz.

---

## 6.1 A credencial viva (tela de entrada)

Hoje a credencial é um cartão parado em `hud.js` (`.credencial`). Vira um crachá pendurado num
cordão, com peso, frente e verso. Referência de comportamento que o Pedro mandou:
wendyenyi.vercel.app (crachá em CSS 3D pendurado, que balança e gira). **Copiar o comportamento, não
o desenho:** a estética é a nossa (off-white, preto, faixa vermelha, Arial negrito, mono).

**Estrutura (HTML e CSS 3D, sem three.js)**, num módulo novo `bastidor/badge.js`:

```
.cracha                      contêiner com perspective: 900px
  .cracha-cordao             duas fitas pretas descendo do topo da tela até o prendedor (SVG, redesenhado a cada quadro)
  .cracha-pendulo            gira em Z (balanço) em torno do ponto de cima
    .cracha-prendedor        o clipe de metal
    .cracha-pulseira         pulseira de evento amarrada no cordão (ver abaixo)
    .cracha-giro             gira em Y (frente e verso), transform-style: preserve-3d
      .cracha-face.frente
      .cracha-face.verso     rotateY(180deg); as duas com backface-visibility: hidden (e -webkit-)
```

- **Frente:** o desenho de hoje (furo, `UGA DO LITORAL`, `BASTIDOR`, faixa vermelha, `ACESSO LIVRE`,
  `SÃO PAULO · 2026`, código de barras), mais uma **foto 3x4**: uma foto do acervo sorteada a cada
  visita (`photos[...]​.small`, `object-fit: cover`, 30% da largura do cartão, canto superior
  direito, com cantoneiras). Embaixo dela, em mono minúsculo, o nome do artista da foto.
- **Verso:** título `COMO ANDAR AQUI DENTRO`, os controles do aparelho em três linhas curtas (os
  mesmos textos da dica), e uma frase manuscrita em vermelho, torta: `não perde isso`
  (`font-family: 'Segoe Script', 'Bradley Hand', 'Snell Roundhand', cursive`).
- **Fita do cordão:** preta, com `UGA DO LITORAL · BASTIDOR ·` repetido em off-white ao longo dela
  (texto num `<textPath>` do SVG).
- **Pulseira:** uma tira de tecido de 14 px de largura amarrada num dos lados do cordão, listrada em
  vermelho `#fa1717`, amarelo `#d8b21a` e preto, com `FOTO` bordado em mono. É a "pulseira
  coloridaça" da cena do segurança; a classe `.pulseira` é reaproveitada lá.
- **Brilho:** uma faixa de reflexo (`::after` com degradê diagonal) que desliza conforme o giro.

**Física** (um laço `requestAnimationFrame` próprio, que para quando a tela de entrada some):

- Estado: `balanço` (ângulo em Z) e `giro` (ângulo em Y), cada um com velocidade. Mola e
  amortecimento: balanço com rigidez 38 e amortecimento 3,2 (pêndulo solto, demora a parar); giro com
  rigidez 14 e amortecimento 2,4, puxando pro múltiplo de 180° mais próximo (assenta de frente ou de
  verso).
- **Vivo sozinho:** um empurrão fraco e irregular a cada 2 a 4 s (como corrente de ar), nunca parado.
- **Arrastar:** segurou o cartão, ele segue o dedo (o ponto de cima fica preso; a posição do dedo
  vira ângulo de balanço, até ±50°) e o deslocamento horizontal dentro do cartão vira giro. Soltou,
  ele herda a velocidade do gesto: um peteleco lateral faz dar voltas.
- **Clicar sem arrastar** (menos de 6 px): vira pro outro lado.
- **Mouse por perto**, sem clicar: o cartão inclina de leve na direção do cursor (até 8°).
- Teclado: o cartão é um `<button aria-label="Credencial: virar">`; Enter ou Espaço viram.
- Com menos movimento: sem balanço nem empurrões; clicar troca de face num corte seco.
- `touch-action: none` no cartão; os botões `ENTRAR…` ficam fora dele e continuam clicáveis.

**Depois de entrar:** a credencial não some. Encolhe e vai pro topo da tela, ao centro, pendurada da
borda (`.cracha.mini`, 46 px de largura; 34 px no celular), e balança de verdade: recebe um empurrão
proporcional à velocidade de giro da câmera e à aceleração do andar (`main.js` chama
`badge.nudge(dYaw, dV)` a cada quadro). Clicar nela vira a face. Some no foco de foto e no fim.

**Onde mexer:** `hud.js` (tira o bloco `.credencial`, chama `createBadge`), `bastidor.css` (sai
`.credencial*`, entra `.cracha*`), `main.js` (o `nudge`).

**Teste** (`bastidor.mjs`, bloco novo "credencial"): o cartão existe na entrada; clicar muda
`data-face` de `frente` pra `verso`; arrastar 120 px muda o `transform` do pêndulo; a foto 3x4 difere
entre `?semente=1` e `?semente=2`; depois de entrar existe `.cracha.mini`.
**Olhar:** dois prints da entrada (frente e verso), desktop e celular.

---

## 6.2 A fundação dos encontros

**`bastidor/people.js`** — silhuetas.
- `silhouette(pose)` devolve uma textura de canvas (256×512, fundo transparente) com a figura em
  preto `#050505` e um fio de luz off-white de 2 px num dos lados. Desenhar com formas simples
  (cabeça oval, tronco, braços, pernas), sem detalhe de rosto. Poses: `seguranca` (largo, braços
  cruzados, fone com fio espiral), `produtor` (prancheta numa mão, rádio na cintura), `pose` (uma mão
  fazendo sinal, quadril de lado), `artista` (boné ou capuz, andando de perfil), `equipe` (de perfil,
  andando, mais baixo), `radio` (segurança com a mão no ouvido).
- `person(pose, { height = 1.78 })` devolve um grupo: o plano da silhueta, um clarão aditivo atrás
  (o degradê radial que já existe em `textures.js`, cor configurável) e uma sombra elíptica no piso.
  O grupo "respira": escala em Y variando 1% a cada 3 s (parado com menos movimento).
- A silhueta fica sempre virada pro trilho (rotação fixa na criação; é um recorte de palco, não
  precisa girar com a câmera).

**`bastidor/encounters.js`** — o sorteio e o ciclo de vida.
- Cada encontro é um objeto `{ id, tipo: 'cena' | 'achado', lugar(plan, random), montar(ctx), aoChegar(api), limpar() }`.
- **Sorteio por visita:** 3 cenas entre as 6 (`agua`, `seguranca`, `foto`, `cartao`, `som`,
  `artista`) e 1 achado entre os 2 (`lista`, `semflash`). Regra: pelo menos uma das duas cenas do
  Pedro (`agua` ou `seguranca`) sempre entra. Duas cenas nunca no mesmo lance ou passagem.
- **Depuração e testes:** `?encontros=agua,seguranca` força exatamente esses; `?encontros=nenhum`
  desliga todos. **Os blocos atuais de `bastidor.mjs` passam a abrir a página com
  `encontros=nenhum`**, senão o segurança barra os testes de andar.
- `api` que cada encontro recebe: `fala(quem, texto, { opcoes, tempo })` (devolve promessa com a
  opção escolhida, ou `null` no tempo esgotado), `barrar(sMax)` e `liberar()` (limite de avanço nos
  controles), `clarao(ms)`, `somClique()`, `abafar(segundos)` (baixa a rádio), `aoClicar(malha, fn)`.
- Um encontro dispara **uma vez por visita**, quando a pessoa chega à distância dele andando no
  sentido do palco. Não dispara durante foco de foto, setlist aberta ou filme.

**Legenda de fala** (`hud.js`): `.fala` na base da tela, ao centro, largura máxima de 560 px:
`<p class="fala-quem">` (mono 10 px, vermelho) e `<p class="fala-texto">` (Arial negrito, 20 a 26 px,
off-white), e `.fala-opcoes` com botões no estilo dos demais. Entra em 180 ms, sai em 300 ms. Uma
fala por vez; a seguinte espera a anterior. Tempo padrão na tela: 2,6 s + 45 ms por caractere.

**Barreira** (`controls.js`): `st.limite = { max }` opcional; o `update` e o arrasto no celular
prendem `st.s` a `max`. A velocidade zera ao bater.

**Som de clique** (`sound.js`): `shutter()` gera um estalo de obturador (ruído branco de 35 ms com
passa-alta em 2 kHz, seguido de outro de 20 ms depois de 60 ms). Só toca com a rádio ligada.

Commit sem cena nenhuma ainda; conferir com `?encontros=nenhum` que nada mudou.

---

## 6.3 As seis cenas (um commit cada)

Posições: "passagem" é o trecho curto entre dois lances (há 5); "meio de lance" é o trecho entre as
vagas de foto (não há parede livre ali, então gente e objeto ficam **no piso, encostados a 0,45 m da
parede**, entre duas cópias, sem cobrir nenhuma).

### `agua` · a água (ideia do Pedro)
- **Lugar:** uma passagem sorteada, encostada na parede de dentro.
- **Monta:** uma mesa (caixa de 1,4 × 0,75 × 0,6 m com toalha preta), um cooler (caixa azul-escura
  com tampa branca), seis garrafas (cilindros finos, material claro azulado, com um halo aditivo
  frio: é a única luz fria do bastidor, tem que chamar o olho), copos empilhados, e o **produtor**
  ao lado (pose `produtor`).
- **Ao chegar a 3 m:** PRODUTOR: `Água? É só pra artista.`
- **Clicar numa garrafa:** PRODUTOR: `Fotógrafo bebe luz, não bebe?`
- **Clicar de novo:** PRODUTOR: `Tem bebedouro lá fora. Depois da grade. Do outro lado da rua.`
- **Uma visita em seis** (sorteio): no segundo clique ele cede: `Toma. Não conta pra ninguém.` A
  garrafa clicada some da mesa e um ícone pequeno de garrafa aparece ao lado da credencial mini.

### `seguranca` · o segurança (ideia do Pedro)
- **Lugar:** o começo de uma passagem sorteada, no meio do caminho.
- **Monta:** o **segurança** (pose `seguranca`, 1,92 m) em cima do eixo do corredor, com clarão
  vermelho por trás.
- **Ao chegar a 2,6 m:** `barrar()` ali, a câmera assenta de frente pra ele.
  SEGURANÇA: `Você é o quê do evento?` com três opções:
  - `FOTÓGRAFO`
  - `TÔ COM UMA CÂMERA DESSE TAMANHO, IRMÃO`
  - `MOSTRAR A PULSEIRA` (a pulseira da credencial sobe na tela, grande, por 1,2 s)
- **Depois de qualquer resposta:** ele não responde por 2 s (a graça é o silêncio). Aí:
  - na opção 1: `Fotógrafo de quem?` … 1,5 s … `Pode ir.`
  - na opção 2: `Câmera qualquer um tem.` … `Deixa eu ver essa pulseira.` … `Pode ir.`
  - na opção 3: `…` … `É a de hoje mesmo?` … `Pode ir.`
- **Uma visita em quatro:** antes do "Pode ir", troca pra pose `radio` e:
  `Tem um rapaz aqui dizendo que é fotógrafo.` … (2 s) … `Copiado.` … `Pode ir.`
- **Resolve:** ele dá um passo pro lado (0,95 m em 0,8 s), `liberar()`. Sem resposta em 8 s, ele
  suspira (`Vai, vai.`) e libera.

### `foto` · "tira uma minha?"
- **Lugar:** meio de um lance.
- **Monta:** uma pessoa da equipe (pose `pose`) encostada.
- **A 3,5 m:** STAFF: `Ei, fotógrafo! Tira uma minha?` com a opção `FOTOGRAFAR` (clicar na silhueta
  também vale).
- **Fotografou:** `clarao(180)`, `somClique()`, a silhueta fica branca por um quadro (foi "exposta").
  STAFF: `Manda no meu insta, tá?` e ela sai andando (desliza 2 m e some em 1,2 s).
- **Ignorou e passou:** STAFF, pelas costas: `Nem pra isso serve.`

### `cartao` · cartão cheio
- **Lugar:** a entrada da ala com mais fotos (hoje a do Matuê, mas calcule).
- **Só interface:** por 4 s a tela ganha moldura de visor de câmera (quatro cantoneiras finas) e, no
  canto de cima à direita, piscando em vermelho mono: `CARTÃO CHEIO`. Embaixo, legenda sem
  interlocutor: `Logo agora.`
- A moldura some sozinha. Nada bloqueia.

### `som` · passagem de som
- **Lugar:** meio de um lance.
- **Acontece:** as luzes caem (blecaute a 92% em 250 ms; os refletores das fotos apagam: opacidade
  das poças a 0), `abafar(3)`. Legenda em caixa alta, uma palavra por vez, 600 ms cada:
  `TESTANDO.` `UM.` `DOIS.` `SOM.` A luz volta em 400 ms. Depois, voz de alguém longe:
  `Tá bom aí, fotógrafo?`
- A pessoa pode continuar andando no escuro.

### `artista` · o artista passando
- **Lugar:** o fundo de um lance (a passagem que cruza lá no fim), disparado quando a pessoa entra
  nesse lance e ainda está a mais de 11 m do fundo.
- **Acontece:** um grupo cruza o fundo de um lado ao outro em 3,2 s: uma silhueta `artista` no meio e
  três `equipe` em volta, um deles com a mão erguida abrindo caminho. Um clarão branco quente
  acompanha o grupo (plano aditivo andando junto), e a rádio sobe 20% durante a travessia.
- Somem atrás da parede. Chegando lá, não há ninguém; no chão fica uma **toalha branca** caída
  (plano pequeno). Sem fala.
- O nome que aparece é o da ala seguinte? **Não**: ninguém diz quem é. Fica a dúvida.

**Teste** (`bastidor.mjs`): um bloco por cena, abrindo com `?encontros=<id>&semente=5`, levando `s`
até o gatilho e conferindo a legenda. Pro segurança: `s` não passa da barreira antes da resposta,
passa depois de clicar numa opção, e também passa sozinho depois de 8 s. Pro `foto`: o clarão e a
segunda fala. E um teste do sorteio: com duas sementes, os conjuntos sorteados diferem; em 30
sementes, toda visita tem `agua` ou `seguranca`.
**Olhar:** um print de cada cena no ar. Pergunta de controle: a silhueta parece gente em contraluz,
ou parece um boneco de papelão? Se for papelão, falta o fio de luz na borda e o clarão atrás.

---

## 6.4 Os dois achados e o enfeite fixo

**Achados** (um por visita, sorteado):

- **`lista`:** uma prancheta presa na parede de uma passagem (textura em canvas: papel off-white,
  cabeçalho `IMPRENSA / FOTO`, seis linhas datilografadas riscadas a caneta: `TV`, `RÁDIO`,
  `REVISTA`, `SITE`, `BLOG DO PRIMO DO DONO`, `FOTO OFICIAL`). Embaixo, manuscrito em vermelho e
  torto: `Uga do Litoral (entrou assim mesmo)`. Clicável: a câmera chega perto (`focus.visit`),
  `VOLTAR` sai. É a única barra permitida nesta rodada, porque é o cabeçalho de um documento.
- **`semflash`:** no lance 6, na parede livre perto da porta do palco, uma placa grande em estêncil:
  `PROIBIDO FLASH`, com o pictograma de um raio riscado. O fim do corredor é um clarão de flash: a
  piada se completa sozinha. Sem interação.

**Enfeite fixo** (sempre lá, em `dressing.js`):

- **Camarim:** na parede de dentro da passagem 2, uma porta entreaberta (dois planos: a folha escura
  em ângulo de 25° e a fresta com luz **quente** `#ffb46b` vazando no piso), e na folha uma estrela
  dourada fosca com o nome de um artista sorteado da setlist em mono. De dentro, nada visível.
- **Rider:** na parede de dentro da passagem 4, uma folha A4 presa com fita (canvas):
  `RIDER TÉCNICO E DE CAMARIM` e a lista
  `Toalhas brancas: 12` · `Água sem gás: 24` · `Água com gás: 24` · `Frutas da estação: 1 cesta` ·
  `Fotógrafo: 0`. O último item circulado a caneta vermelha.
- **A mochila:** encostada nos cases da passagem 1, uma mochila de câmera (caixa arredondada preta
  com alças) e, pendurada nela, uma miniatura da credencial off-white com a faixa vermelha.
- **Marcas de palco:** nos últimos 6 m do lance 6, cruzes e cantos de fita no piso (branca e
  vermelha) com nomes a caneta ao lado, tirados das alas: três nomes sorteados.

**Olhar:** um print de cada. **Teste:** `bastidor-planta.mjs` ganha uma checagem de que nenhum
objeto fixo ou de encontro fica a menos de 0,2 m de uma cópia (comparar caixas no plano da parede).

---

## Fechamento

1. Os quatro testes. 2. Conferir o orçamento de desenho com as cenas forçadas uma a uma. 3. Linha
no `../andamento.md`. 4. Relatório ao Pedro com: o que entrou, como forçar cada cena pra ele ver
(`bastidor.html?encontros=seguranca`), e o aviso de sempre sobre celular de verdade.

## Textos novos desta rodada (aprovados pelo Pedro em 2026-11-11)

Todas as falas das cenas acima, mais:

| onde | texto |
|---|---|
| verso da credencial | `COMO ANDAR AQUI DENTRO` · os controles · manuscrito `não perde isso` |
| fita do cordão | `UGA DO LITORAL · BASTIDOR ·` |
| pulseira | `FOTO` |
| quem fala | `PRODUTOR` · `SEGURANÇA` · `STAFF` |
| placa | `PROIBIDO FLASH` |
| prancheta | `IMPRENSA / FOTO` · `Uga do Litoral (entrou assim mesmo)` |
| rider | `RIDER TÉCNICO E DE CAMARIM` · `Fotógrafo: 0` |
