# Showreel de lançamento do portfólio · Uga do Litoral

Direção: Fable 5.2 (2026-11-14). Execução: três agentes Opus, cada um com o seu arquivo em `plano/`.
Todo mundo lê este arquivo inteiro e depois só o seu.

## O pedido do Pedro (palavras dele, resumidas)

Um showreel do portfólio (ugadolitoral.vercel.app) pra anunciar o lançamento e avisar que a agenda está
aberta. **Não pode ser print do site se mexendo.** Tem que parecer a apresentação de uma empresa, com
foco forte no bastidor (o corredor 3D) e em como a experiência foi construída. Bem dinâmico, com cortes
sincronizados na batida. Música: WHOLE BODY (VANDAME), do adso*. Animação feita com **Python e JS**,
sem HyperFrames e sem Remotion. Sem repertório anterior. Criatividade total, ideia arriscada.

Respostas dele: bastidor = corredor 3D como estrela + flashes do making-of · vertical 1080×1920 ·
uns 30 s · quase sem texto (só o nome e o chamado final) · fechamento com site + Instagram.

## A ideia: LUZ DE SEGURANÇA

O filme é um processo fotográfico, regido pela música.

1. **Estrutura (laboratório).** Escuro. Sob luz vermelha de laboratório fotográfico, o portfólio aparece
   como desenho técnico: a planta do corredor se desenha, as paredes sobem, a câmera desce pra dentro.
   Só linha vermelha no preto. É o making-of: a experiência vista como construção.
2. **Revelação.** A caixa da música entra e cada batida dela "revela" um pedaço: a linha vira concreto,
   os retângulos vazios viram as fotos. A câmera não para e acelera junto com a virada.
3. **Flash.** No drop, cada batida é um flash de show: a luz estoura perto e cai com a distância, como
   flash de câmera de verdade. Aqui entram o nome, as fotos, a vida do bastidor, os filmes.
4. **Agenda.** A porta do PALCO abre no silêncio da música. Na virada: AGENDA ABERTA.

Por que isso responde o pedido: nada é captura de tela. O corredor é filmado **por dentro do motor do
site**, quadro a quadro, com câmera que um visitante não consegue fazer, em três passes (imagem, linha e
profundidade) que o Python mistura no ritmo da música.

## Regras que valem pra todos

- **Tempo:** a única fonte é `tempo.json` (30 qps, 134 BPM, primeira batida em 0,218 s, 960 quadros).
  Ninguém recalcula batida. Corte cai **no quadro exato** da tabela. `montagem.json` diz o que entra onde.
- **Formato:** 1080×1920, 30 qps. Sequências em `quadros/<ID>/<passe>/000000.jpg` (ou `.png` quando
  precisa de transparência ou de precisão), quadro local começando em 0. Entregar sempre pelo menos
  2 quadros a mais do que o plano pede. Ao terminar um plano, gravar `quadros/<ID>/pronto.json`
  (`{"quadros": N, "passes": [...], "obs": "..."}`).
- **Cada agente escreve só na sua pasta** (`captura/`, `cenas/`, `pos/`) e em `quadros/<seus IDs>/`.
- **Não tocar em `uga-do-litoral/portfolio/site-lab/` nem em `site/`.** São só leitura. O site é servido
  de lá por um servidor local (`portfolio/ferramentas/servidor.mjs`, porta 0 = porta livre). Nada de
  commit, push ou deploy.
- **Fotos e filmes são do Pedro:** não recolorir, não gerar imagem por IA, não cortar rosto. Efeito de
  luz transitório (flash, revelação) pode; tratamento permanente de cor não.
- **Sem repertório anterior:** não abrir outros projetos de vídeo deste repositório (`comercial-uga`,
  `hasag`, `pao`, `canal-dark`, `projetos/estudio-motion`) nem skills de vídeo. Sem Remotion, sem
  HyperFrames. O que existe é Playwright (`portfolio/ferramentas/node_modules/playwright-core`, Chrome
  da máquina com GPU: ver como `portfolio/ferramentas/bastidor.mjs` abre), three.js do site, Python 3.12
  (numpy, scipy, opencv, Pillow, librosa) e ffmpeg. Pode instalar o que faltar.
- **Movimento:** fluido. Easing, câmera sempre andando, e o corte carrega o movimento (a velocidade e a
  direção de um plano continuam no seguinte). Nada com cara de template.
- **Texto na tela, e só este:** `PEDRO AUGUSTO` · `FOTO · VÍDEO · DIREÇÃO CRIATIVA` · `AGENDA ABERTA` ·
  `ugadolitoral.vercel.app` · `@uga_do_litoral` · `UGA DO LITORAL`. Mais os rótulos técnicos minúsculos
  do desenho da planta (`163 m`, `7 lances`, `31 alas`, `109 cópias`, conferir os números no motor) e o
  que já está escrito dentro do corredor (PALCO, SEGURANÇA, credencial). Sem travessão. Fontes: as do
  site (`site-lab/fonts.css`: Manrope, Arimo, Inconsolata).
- **Cores:** preto, branco, off-white `#f2f0eb`, cinza `#a5a5a5`, vermelho de palco como acento (usar o
  vermelho que o corredor já usa).
- **Antes de dizer que está pronto:** montar uma folha de revisão (6 a 8 quadros do plano lado a lado),
  **abrir a imagem e olhar**. Sem olhar, dizer "não conferi".
- **Relato final curto e honesto:** o que entregou (IDs e quantos quadros), o que desviou do plano e por
  quê, o que não deu. Sem enfeite.

## Estrutura da música e do filme

| seção | batidas | quadros | música | imagem |
|---|---|---|---|---|
| A · estrutura | 0 a 15 | 0 a 220 | só o grave | planta em linha vermelha, paredes sobem, câmera desce |
| B · revelação | 16 a 31 | 221 a 435 | caixa crescendo; some na batida 31 | a linha vira imagem aos pedaços; aceleração; preto no respiro |
| C · flash | 32 a 63 | 436 a 865 | drop, 8 compassos; some na 63 | nome, fotos, acervo, vida do bastidor, filmes, corrida pra porta |
| D · agenda | 64 a 67 e cauda | 866 a 959 | virada forte, corta na 68 (q. 920) | AGENDA ABERTA, site, Instagram |

## Planos (quem faz, onde entra)

Quadros de saída entre colchetes, fim exclusivo. `cor` = imagem normal, `fio` = desenho de linha,
`prof` = profundidade.

**Agente 1, câmera (bastidor 3D, JS):**

| ID | saída | passes | o que é |
|---|---|---|---|
| `A1_planta` | [0, 221) | fio, prof | planta se desenha de cima, inclina, paredes sobem, câmera desce na entrada e começa a andar |
| `B1_travessia` | [221, 436) | cor, fio, prof | a mesma câmera segue pelo corredor, acelerando até a virada; desfoque de movimento do meio em diante |
| `B2_credencial` | 30 quadros | cor | a credencial BACKSTAGE balançando, em detalhe (entra em dois cortes de uma batida) |
| `B3_vulto` | 16 quadros | cor, prof | o segurança em contraluz, de relance |
| `C2a` a `C2d` | 16 quadros cada | cor, fio, prof | quatro cópias na parede, de frente, uma por batida, mesmo enquadramento, parede contínua |
| `C2e_mergulho` | [517, 544) 29 q. | cor, fio, prof | a câmera mergulha numa cópia até ela cobrir o quadro inteiro |
| `C5a_seguranca` | [651, 678) 29 q. | cor, fio, prof | encontro com o segurança |
| `C5b_projecao` | [678, 705) 29 q. | cor, fio, prof | filme projetado na parede, poeira no facho |
| `C5c_camarim` | [705, 718) 16 q. | cor, fio, prof | camarim, rider, mesa da água |
| `C5d_artista` | [718, 732) 16 q. | cor, fio, prof | o artista passando |
| `C5e_setlist` | [732, 759) 29 q. | cor, fio, prof | setlist na parede, e uma panorâmica rápida que joga o movimento pro plano seguinte |
| `C7_porta` | [759, 866) 109 q. | cor, fio, prof | corrida até a porta do PALCO; ela abre na batida 62; a câmera atravessa e fica escuro |

**Agente 2, gráficos (cenas próprias, JS):**

| ID | saída | formato | o que é |
|---|---|---|---|
| `G1_nome` | [436, 463) 29 q. | PNG com transparência | PEDRO AUGUSTO enorme + a linha de serviços, por cima da foto herói |
| `G2_acervo` | [598, 651) 55 q. | JPG opaco | as fotos do acervo caindo como cópias numa mesa, virando folha de contato, lápis vermelho marca uma |
| `G3_agenda` | [866, 960) 96 q. | JPG opaco | AGENDA ABERTA, site e Instagram, sobre o fundo líquido do site |

**Agente 3, laboratório (Python):** tempo, montagem, fotos em tela cheia, trechos dos filmes, toda a luz
(vermelho de laboratório, revelação, flash com queda por distância, pós-imagem nos respiros), som e MP4.

## Como roda

- Os três trabalham ao mesmo tempo. O agente 3 monta primeiro um **animático** com cartões cinza no
  lugar do que ainda não chegou, já com os cortes no quadro certo, e remonta quando as sequências chegam.
- Saída: `saida/showreel-v1.mp4` e `saida/revisao/` (folhas de quadros pra direção olhar).
- A direção (Fable) revisa as folhas e devolve ajustes.
