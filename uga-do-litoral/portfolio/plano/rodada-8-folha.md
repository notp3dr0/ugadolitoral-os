# Rodada 8 · consertos, fôlego e a folha de contato

Escrito em 2026-11-12 pelo Fable 5.2, depois de ler o bastidor inteiro e medir ele rodando. O Pedro
aprovou **tudo** que está aqui. Quem executa é o Opus. Leia antes `LEIA-PRIMEIRO.md`; não precisa
reler as rodadas 2 a 7.

**O que entrega:** dois consertos (a mira e a volta do fim), três otimizações (travadas no celular,
memória da rádio, memória de vídeo) e quatro coisas novas (link direto, chamado no foco, folha de
contato, giroscópio).

**Pronto quando:** os oito passos estão no `lab`, um commit cada, e passam `bastidor-planta.mjs`,
`fumaca.mjs`, `toque.mjs`, `bastidor.mjs`, `encontros.mjs` e `rodada8.mjs` (com os blocos novos).

## ATENÇÃO: o `lab` agora publica

Desde 2026-11-12 o site no ar vem de `github.com/notp3dr0/ugadolitoral-site`, e
**`git push origin lab:main` publica em produção na hora**. Nesta rodada: **commit sim, push não.**
Quem manda publicar é o Pedro, depois de olhar no `preview.cmd` (lab em `http://localhost:4174`).

## Linha de base (medida hoje com `node medir-bastidor.mjs`)

| | desktop | celular simulado (390 px, processador 4× mais lento) |
|---|---|---|
| quadro mediano | 16,7 ms | 16,7 ms |
| pior quadro | 100 ms | 117 ms |
| travadas longas no corredor inteiro | 2 (pior 101 ms) | **27 (pior 133 ms)** |
| chamadas de desenho (pico) | 90 | 77 |
| texturas vivas (pico) | **100** | **100** |
| peso até o botão / corredor inteiro | 2,6 MB / 13,8 MB | 2,7 MB / 13,8 MB |

`node rodada8.mjs` hoje: 4 falhas de propósito (3 da mira, 1 da volta). São os passos 8.1 e 8.2.

## Regras desta rodada

- Valem as de sempre: sem numeração "01 / 03", sem travessão em texto, foto nunca recortada nem
  recolorida, `prefers-reduced-motion` respeitado, tudo com a semente da visita.
- O teto de chamadas de desenho continua **96**. Nada desta rodada deve acrescentar chamada no corredor
  (a folha de contato é HTML e `<canvas>` 2D, fora da cena).
- Não renomear o que os testes usam: `.entrar-mudo`, `.entrar-som`, `.legenda*`, `.fim*`, `.barra*`,
  `.setlist*`, `window.__bastidor.world` e os campos dele.
- Arquivos em `site-lab/bastidor/`. Módulo novo só onde o passo pede.

---

## 8.1 A mira (conserto)

**O defeito.** Na rodada 7 o olhar passou a congelar quando o cursor está sobre algo clicável
(`st.mirando`, em `controls.js`, marcado no `pointermove` de `main.js`). Três problemas, os três com
teste escrito em `rodada8.mjs mira`:

1. `mirando` só muda quando o mouse mexe. Quem para o cursor numa foto e anda com W fica com o olhar
   travado sem alvo nenhum embaixo.
2. A tela de filme no fundo do lance é clicável a 22 m. Olhar reto pro corredor já trava o giro.
3. Ao travar, o código faz `yawBase = yawTarget = yaw`. Só que `yaw` já inclui o desvio da mira
   (`-clamp(m / CENTER) * AIM`), então ao soltar o desvio é aplicado de novo: tranco (medido: 10,6°).

**O conserto.**

- `main.js`: o `pointermove` só guarda a posição (`mouseAt = { x, y, dentro: true }`; `pointerleave`
  põe `dentro: false`). A checagem sai dele e vai pro `world.update`, **a cada 4 quadros**
  (`tick % 4 === 0`), só com `pointer: fine`, `mode === 'andando'` e `st.enabled`. Fora disso,
  `st.mirando = false` e cursor normal.
- Dois limites diferentes. O **cursor de mãozinha** continua com os de hoje (`perto()`: cópia 9 m,
  tela 22 m, resto 6 m). A **trava do olhar** usa limites curtos, numa função nova `trava(hit)`:
  cópia até 5 m, tela de filme até 8 m, encontro até 9 m, setlist até 6 m. E só trava devagar:
  `Math.abs(st.v) < 1.2`. Andando rápido, o olhar não trava nunca.
- `controls.js`, no instante em que trava (`st.mirando && !st.mirandoAntes`), guardar a base **sem**
  o desvio, pra a saída ser contínua:
  ```js
  const desvio = clamp((mouse.inside ? mouse.mx : 0) / CENTER, -1, 1) * AIM;
  st.yawBase = st.yaw + desvio; st.yawTarget = st.yaw;
  ```
- `world.tap` continua zerando `st.mirando` (a checagem do quadro religa se for o caso).

**Teste:** `node rodada8.mjs mira` → 5 OK. E `node bastidor.mjs` inteiro (a meia-volta com R e o
clique na projeção dependem disso). Depois olhar na mão: andar com o cursor passeando pelas paredes
tem que continuar fluido, sem "agarrar".

## 8.2 A volta do fim (conserto)

`main.js`, `handlers.restart`: `plan.prints.find(q => q.lance === 5)` é do tempo em que o corredor
tinha 6 lances. Trocar por o último lance que tem cópia:

```js
const ultimo = Math.max(...plan.prints.map(q => q.lance));
const primeira = plan.prints.find(q => q.lance === ultimo);
st.s = Math.max(0, primeira.s - 2);
```

**Teste:** `node rodada8.mjs volta` → 2 OK.

## 8.3 Travadas no celular e memória de vídeo (otimização)

As 27 travadas vêm de `prints.js`: `THREE.TextureLoader` decodifica o WebP na thread principal e sobe
pra placa no mesmo quadro. Trocar por decodificação fora da thread e **uma subida por quadro**.

- Carregador: `new THREE.ImageBitmapLoader()` com `setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' })`.
  A textura é `new THREE.Texture(bitmap)` com `flipY = false`, `colorSpace = SRGBColorSpace`,
  `anisotropy = maxAniso`, `needsUpdate = true`. No descarte: `texture.dispose()` **e**
  `bitmap.close()`. Se `createImageBitmap` não existir, cair no `TextureLoader` de hoje (manter o
  caminho antigo numa função, sem duplicar o resto).
- Fila de subida: o `onLoad` não mexe no material; empilha `{ item, bitmap }` em `prontos`. O
  `update()` tira **um** por chamada e aplica (o que hoje está dentro do `loader.load`). Item
  marcado `dropped` nesse meio-tempo: fecha o bitmap e segue.
- `loadBig` (versão grande do foco) usa o mesmo carregador, sem fila (é uma só).
- Alocação por quadro: `new THREE.Color(1, 1, 1)` dentro do `update` e do `dropBig` vira uma
  constante `WHITE` no topo do arquivo.
- Geometria: hoje cada cópia cria um `PlaneGeometry(w, h)` (109 geometrias). Usar **uma**
  `PlaneGeometry(1, 1)` compartilhada e `mesh.scale.set(w, h, 1)`. Conferir que `focus.js` usa
  `item.w` e `item.h` (usa) e não a geometria, e que `dressing.highlight` não lê a geometria.
- Memória de vídeo: `DROP` de 30 → **18** m. No `degrade(step >= 2)`, além do alcance menor,
  `DROP` vira 14.

**Teste:** `node medir-bastidor.mjs`. Alvo no celular simulado: travadas longas **≤ 13** (metade) e
pior **≤ 80 ms**; texturas vivas no pico **≤ 80** nos dois. Se o alvo de travadas não vier, não
insistir: anotar o número no `andamento.md` e seguir. `node bastidor.mjs` e `node encontros.mjs`
têm que continuar passando (o foco carrega a versão grande; a credencial usa foto).

## 8.4 A rádio em streaming (otimização)

Hoje `sound.js` baixa a faixa inteira e descompacta com `decodeAudioData`: uns 50 MB de memória por
faixa, e o `Map buffers` guarda todas as já ouvidas. Trocar a fonte por elementos `<audio>`; **a
cadeia de efeitos não muda** (passa-baixa, eco, analisador, plateia, voz, obturador).

- Em `build()`: criar **dois** canais fixos, A e B. Cada um: `new Audio()` (`preload = 'auto'`,
  sem `crossOrigin`: é mesma origem), `ctx.createMediaElementSource(el)`, um `GainNode` em 0, ligado
  em `lowpass` e em `analyser` como o `gain` de hoje.
- `play(at)`: pega o canal que não está tocando, `el.src = tracks[i].file`, `await el.play()`,
  sobe o ganho dele e desce o do outro com o mesmo `FADE`; depois do fade, `pause()` no outro e
  `removeAttribute('src')` + `load()` pra soltar o buffer. `loadToken` continua valendo pra troca
  rápida de faixa.
- `el.addEventListener('ended', ...)` no lugar do `src.onended`: toca a próxima.
- `current` passa a ser `{ el, gain, i }`. `duck()` e o getter `track` continuam funcionando.
  `stop()`: depois do fade do `master`, `current.el.pause()`. `start()` com faixa já escolhida:
  `current.el.play()`.
- Apagar `buffers` e `decode()`. Não pré-baixar a próxima faixa (streaming começa rápido).
- `ferramentas/servidor.mjs` já responde `Range` (o Chrome exige pra `<audio>`).

**Teste:** `node bastidor.mjs` (os passos da rádio: liga, troca de faixa, pulso das luzes). Na mão:
ligar o som, trocar de faixa três vezes seguidas rápido (não pode sobrar duas tocando), desligar e
religar, chegar no palco (o som abre). Conferir no painel de rede que o MP3 vem em pedaços (206).

## 8.5 Link direto pra uma foto ou ala (novo)

Hoje `?foco=<índice>` é depuração e pula a entrada. Vira recurso de verdade, com endereço estável.

- **Endereço da foto:** `?foto=<slug>`, onde slug é o nome do arquivo sem `-lg.webp`
  (`photo-23`, `kayg-03`). São 109 slugs únicos (conferido). Função `slugOf(photo)` em `main.js`.
  **Endereço da ala:** `?ala=<galleryId>` (`matue`, `kayg`).
- **Chegada por link:** a credencial aparece normal (o som precisa do clique). Depois do giro de
  abertura, em vez de `startWalking()` puro: com `?foto`, `st.s = item.p.s` e `focus.enter(item)`;
  com `?ala`, `st.s` = primeira cópia da ala menos 1,2 m (a mesma conta das `entries` da setlist).
  Slug ou ala que não existe: ignora e segue normal. `?foco=` continua como está.
- **Botão na legenda:** em `hud.js`, dentro de `.legenda-botoes`, um botão `.legenda-link` com o
  texto `COPIAR LINK`, visível só na legenda de foto (esconder em `noteCaption` e `filmCaption`).
  Clique: copia `${location.origin}${location.pathname}?foto=<slug>` com
  `navigator.clipboard.writeText`; se falhar, `prompt('Copia o link:', url)`. O texto vira
  `COPIADO` por 1,6 s. O `hud` recebe o slug por um handler novo `h.linkAtual()`.
- **Barra de endereço acompanha:** ao entrar em foco, `history.replaceState` põe `?foto=<slug>`
  (preservando `semente` e `encontros` se existirem); ao sair do foco, tira. Nunca `pushState`.

**Teste** (bloco `link` em `rodada8.mjs`): abrir com `?foto=kayg-03`, entrar, esperar: em foco,
legenda com KayG. Abrir com `?ala=matue`: `st.s` a menos de 2 m da primeira cópia do Matuê. Focar
uma foto e conferir que `location.search` tem `foto=`; sair e conferir que não tem. Clicar
`COPIAR LINK` (dar permissão `clipboard-read`/`clipboard-write` no contexto) e ler o clipboard.

## 8.6 Chamado no foco (novo)

O contato hoje só aparece na porta do palco, depois de 163 m. Uma linha discreta na legenda da foto.

- Em `.legenda`, abaixo de `.legenda-conta`: `<a class="legenda-chamado" target="_blank" rel="noopener noreferrer">`
  com o texto `QUER UM REGISTRO ASSIM? ↗`. Vai pro WhatsApp do fim (`https://wa.me/5512982612374`)
  com `?text=` já escrito: com artista, `Oi Pedro, vi a foto de <artista> no teu bastidor e quero um registro assim.`;
  sem artista, `Oi Pedro, vi uma foto no teu bastidor e quero um registro assim.` (`encodeURIComponent`).
- Só na legenda de foto. **Aparece 2,5 s depois** de entrar em foco (não antes: primeiro a foto),
  com fade de 400 ms; trocar de foto com ← → reinicia a espera. Com menos movimento: aparece sem fade.
- Estilo: mono, 11 px, caixa alta, off-white a 70%, sublinhado fino vermelho no hover. Não pode
  competir com o nome do artista.

**Teste** (bloco `chamado`): focar uma foto com artista; em 0,5 s o link está invisível; em 3,2 s
está visível e o `href` contém `wa.me/5512982612374` e o nome do artista codificado. Legenda de
filme: link escondido.

## 8.7 A folha de contato (novo, o coração da rodada)

Cada foto que a pessoa abriu em foco entra numa folha de contato de filme. Na porta do palco ela vê
a folha, salva como imagem e posta. É lembrança com o nome do Pedro, feita pelo passeio dela.

**Guardar o que foi visto.** Módulo novo `bastidor/sheet.js`, `createSheet({ photos, hud, random })`.

- `focus.js`: no fim de `enter(item)` chamar `world.onFocus?.(item)`; em `release(item)` chamar
  `world.onBlur?.(item)`. `main.js` liga os dois na folha: `sheet.viu(photo)` e `sheet.saiu(photo)`.
- A folha guarda, por foto, a ordem em que foi vista pela primeira vez e o **tempo somado em foco**.
  Persistir em `sessionStorage` (chave `bastidor-folha`, JSON de `[slug, ms]`), com `try/catch` em
  toda leitura e escrita. Recarregar a página na mesma aba mantém a folha.

**Onde aparece.**

- Na barra do passeio (`.barra`), um botão `.barra-folha` que nasce escondido e aparece na primeira
  foto vista: `FOLHA · 3` (o número de fotos, sem zero à esquerda). Abre a folha a qualquer hora.
- Na tela do fim (`.fim-botoes`), antes de `VOLTAR PRO BASTIDOR`: botão `.fim-folha`,
  `SUA FOLHA DE CONTATO`. Com zero fotos vistas o botão não aparece e entra a frase
  `Você passou sem parar em nenhuma. Volta lá.` em `.fim-frase-folha`.

**A tela da folha.** `<section class="folha" role="dialog" aria-modal="true" aria-labelledby="folha-titulo">`
por cima de tudo: a imagem (o `<canvas>` reduzido pra caber na tela), e os botões `SALVAR IMAGEM`,
`COMPARTILHAR` (só se `navigator.canShare?.({ files: [arquivo] })`) e `FECHAR`. Esc fecha. Aberta no
meio do passeio: `st.enabled = false`, e volta ao fechar (se não estiver em foco nem no fim). Foco
do teclado vai pro `SALVAR IMAGEM` ao abrir e volta pra quem abriu ao fechar.

**O desenho (canvas 2D, 1080 × 1920, formato de story).** Tudo desenhado por código, nada de imagem pronta.

- Fundo `#0b0b0b`, com grão leve (ruído de 1 px a 4% de opacidade, gerado com a semente).
- Cabeçalho (0 a 250 px): `UGA DO LITORAL` em mono 26 px off-white com espaçamento largo;
  embaixo `FOLHA DE CONTATO` em Arial 900, 92 px, off-white; à direita, em mono 22 px vermelho
  `#fa1717`, a data de hoje por extenso curto (`12 NOV 2026`) e `BASTIDOR · 7 FOTOS`.
- Tiras de filme: até **5 tiras de 4 quadros** (20 fotos). Cada tira é uma faixa preta `#000` de
  1000 × 290 px, com furos de perfuração em cima e embaixo (retângulos de cantos redondos, 18 × 12 px,
  a cada 36 px, off-white a 85%). Cada quadro tem 232 × 232 px de área útil e a foto entra
  **inteira** (`contain`, nunca recorte), centrada. Embaixo de cada quadro, em mono 15 px
  off-white a 75%, o nome do artista (ou nada, se não identificado). **Sem número de quadro.**
- Menos de 4 fotos na última tira: os quadros que sobram ficam vazios (filme não exposto, `#0d0d0d`).
- Mais de 20 fotos vistas: entram as 20 com mais tempo em foco, **na ordem em que foram vistas**, e
  o rodapé ganha `+ 5 QUE NÃO COUBERAM`.
- **A escolhida:** a foto com mais tempo em foco leva um círculo de lápis dermatográfico vermelho
  (`#fa1717`, 5 px, `lineCap: 'round'`): uma elipse desenhada em duas voltas tortas, com jitter
  vindo da semente (duas `bezierCurveTo` por volta, as pontas não fecham). É o gesto de fotógrafo
  marcando a foto boa na folha.
- Rodapé (1790 a 1920 px): `ugadolitoral.vercel.app` em mono 24 px off-white e `@uga_do_litoral`
  à direita, com um filete vermelho de 2 px em cima.
- As fotos vêm de `photo.small` (mesma origem, o canvas não fica "sujo"). Carregar todas com
  `Image` + `decode()` antes de desenhar; a que falhar vira quadro vazio.

**Salvar e compartilhar.** `canvas.toBlob(..., 'image/jpeg', 0.92)`. Salvar: `<a download="folha-de-contato-uga-do-litoral.jpg">`
com `URL.createObjectURL` (revogar depois). Compartilhar: `navigator.share({ files: [new File([blob], nome, { type: 'image/jpeg' })] })`,
com `catch` silencioso pra quem cancela.

**Estilo da tela:** fundo `#000` a 92%, a folha com sombra e 2° de inclinação (0° com menos
movimento), entra subindo 24 px em 420 ms com `var(--motion-ease)`. Botões no padrão dos do fim.

**Teste** (bloco `folha`): focar 3 fotos pelo `world.focus.enter` (esperando 400 ms em cada, e
1.200 ms numa delas); `.barra-folha` visível com `FOLHA · 3`; abrir; o canvas tem 1080 × 1920; ler
pixels: o centro do primeiro quadro não é preto chapado e existe pixel vermelho `#fa1717` na área
das tiras (a escolhida); `toBlob` devolve mais de 60 KB; Esc fecha e os controles voltam. Recarregar
a página: `FOLHA · 3` continua. Tirar um print da folha com `foto.mjs` e **olhar**.

## 8.8 Giroscópio no celular (novo, o mais arriscado: por último)

Olhar em volta movendo o aparelho. **Desligado por padrão**, só em toque, só em pé.

- Botão `.barra-giro` na barra, texto `GIRO`, só se `matchMedia('(pointer: coarse)')` e
  `'DeviceOrientationEvent' in window`. Com menos movimento, não aparece. Ligado, o botão ganha a
  classe `aceso`.
- Ligar: se existir `DeviceOrientationEvent.requestPermission` (iPhone), chamar dentro do clique;
  negado → o botão some e nada mais acontece.
- `controls.js` ganha `setGyro(on)` e ouve `deviceorientation`. Na primeira leitura guarda
  `alpha0`, `beta0` e `yaw0 = st.yawTarget`. A cada leitura: `d = menor diferença angular(alpha - alpha0)`;
  `st.yawTarget = st.yawBase = yaw0 + d * DEG`; `st.pitchTarget = clamp((beta - beta0) * DEG * .6, -20°, 20°)`;
  `st.lastLook = agora` (pra o "assentar no eixo" não brigar). Leitura com `alpha === null`: ignora.
- Arrastar de lado continua funcionando: ao terminar o toque, recalibrar (`alpha0 = alpha atual`,
  `yaw0 = st.yawTarget`).
- Com o giro ligado, `world.assist` devolve 0 (a câmera não vira sozinha pra cópia).
- Aparelho deitado (`screen.orientation?.type` começando com `landscape`): desliga o giro e apaga o botão `aceso`.
- Em foco, em filme ou com `world.override`: as leituras são ignoradas; ao voltar, recalibra.

**Teste** (bloco `giro`, contexto de celular com toque): entrar, clicar `.barra-giro`, disparar
`new DeviceOrientationEvent('deviceorientation', { alpha: 10, beta: 60, gamma: 0 })` e depois outro
com `alpha: 40`: o `yawTarget` muda 30° (± 2). Desligar: novo evento não muda nada. `node toque.mjs`
continua passando. **Celular de verdade não dá pra testar daqui**: dizer isso no relatório.

---

## Ordem e commits

8.1 → 8.2 → 8.3 → 8.4 → 8.5 → 8.6 → 8.7 → 8.8. Um commit por passo, mensagem em português.
Depois do 8.4 rodar `medir-bastidor.mjs` e guardar os números pro relatório. No fim, as seis suítes.
Atualizar em `LEIA-PRIMEIRO.md` a tabela de rodadas (linhas 7 e 8) e a de ferramentas
(`rodada8.mjs`, `medir-bastidor.mjs`). Uma entrada no `../andamento.md`.

## Relatório ao Pedro (até 10 linhas)

Antes e depois de: travadas no celular, texturas vivas, e o que mudou na rádio. O que ele precisa
olhar na mão: a mira (andar passando o cursor pelas paredes), a folha de contato (abrir três fotos e
ir até o palco), o link copiado colado numa aba nova. O que não foi testado: giroscópio e
compartilhamento em celular de verdade. E lembrar: **nada foi publicado; publicar é `git push origin lab:main`, com o OK dele.**

## Textos novos (propostos, no tom da marca)

| onde | texto |
|---|---|
| legenda da foto, botão | `COPIAR LINK` → `COPIADO` |
| legenda da foto, chamado | `QUER UM REGISTRO ASSIM? ↗` |
| WhatsApp, com artista | `Oi Pedro, vi a foto de <artista> no teu bastidor e quero um registro assim.` |
| WhatsApp, sem artista | `Oi Pedro, vi uma foto no teu bastidor e quero um registro assim.` |
| barra do passeio | `FOLHA · 3` |
| tela do fim, botão | `SUA FOLHA DE CONTATO` |
| tela do fim, sem fotos | `Você passou sem parar em nenhuma. Volta lá.` |
| folha, título | `FOLHA DE CONTATO` |
| folha, cabeçalho | `BASTIDOR · 7 FOTOS` |
| folha, rodapé de sobra | `+ 5 QUE NÃO COUBERAM` |
| folha, botões | `SALVAR IMAGEM` · `COMPARTILHAR` · `FECHAR` |
| barra, celular | `GIRO` |

## Decisões que eu tomei e o Pedro pode trocar

- A folha **não tem número de quadro** (a regra dele é sem numeração); embaixo de cada quadro vai o artista.
- A "escolhida" é a foto em que a pessoa ficou mais tempo. Não é ela quem marca.
- O chamado demora 2,5 s pra aparecer, de propósito.
- A rádio continua no ar com as mashups. Esta rodada não mexe nisso; é decisão dele.
