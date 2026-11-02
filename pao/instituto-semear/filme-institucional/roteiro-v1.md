# Roteiro v1 · "Semente" · Instituto Semear

> Proposta, não aprovada. 2026-11-02. Base: `briefing.md` e `../marca/design-guide.md`.
> Duração: **26,5 s**. Formato-base 16:9 (1920×1080, 30 fps), com tudo que importa no centro
> pra caber num corte 9:16 depois. Sem locução: só três frases na tela e a trilha.

## A ideia em uma linha

A própria logo do Semear já conta a história: **mãos que sustentam, pessoas que formam a copa**.
O filme monta essa árvore do zero. Uma semente (o apoio) desperta pessoas que **já estavam ali**
(o Semear não cria ninguém, ele acende). Elas se ligam umas às outras e, juntas, viram a árvore.
A árvore pousa e vira a logo.

## Regras visuais do filme

- Fundo papel `#EDEDED` com textura leve, o filme inteiro. Nada de fundo escuro.
- As pessoinhas têm **exatamente a forma das da logo** (corpo oliva, cabeça amarela), cada uma
  numa rotação e num tempo diferente. Ninguém se move em uníssono: individualidade.
- As conexões são linhas finas no traço da estampa em contorno (P56-05) e engrossam aos poucos.
- Câmera quase parada, só deriva lenta. Movimento com ease orgânico, sem bounce de app.
- Texto: fonte pesada da marca, marrom `#975F30`, frase curta, centralizada um pouco abaixo do
  meio. Entra por opacidade e 8 px de subida, fica uns 2,5 s, sai antes da próxima.

## Quadro a quadro

| # | tempo | o que se vê | texto | som |
|---|---|---|---|---|
| 1 | 0,0–3,0 | Papel vazio. Uma linha de chão marrom se desenha no terço de baixo, da esquerda pro centro. Um ponto amarelo (a **semente**) desce devagar e pousa na linha, no centro. | — | Room tone de papel. Uma nota grave e macia quando a semente toca o chão. |
| 2 | 3,0–7,0 | A semente pulsa uma vez. Dela sai uma linha fina oliva que sobe e chega a uma **pessoinha em contorno cinza-claro**, quase invisível, que já estava ali. Quando a linha encosta, ela ganha cor (corpo oliva, cabeça amarela) e abre os braços. | "A bolsa me trouxe tranquilidade." | Primeira nota da melodia (marimba ou piano abafado) no instante em que ela ganha cor. |
| 3 | 7,0–11,5 | A linha se ramifica. Acende uma segunda e uma terceira pessoinha, em alturas e rotações diferentes. Agora as pessoinhas **também se ligam entre si**, não só à semente. Nos cantos, a estampa em contorno começa a se desenhar, bem clara. | "A mentoria me mostrou caminhos." | Uma nota nova por pessoinha acesa, formando uma frase musical. Entra um pad quente baixinho. |
| 4 | 11,5–16,5 | A **rede**: a câmera recua devagar e mostra dezenas de pessoinhas se acendendo em ondas, linhas cruzando a tela. Algumas peças da estampa passam de contorno a preenchidas (azuis, amarelo, oliva). É o momento mais cheio do filme. | "E a rede me fez sentir pertencente." · crédito pequeno embaixo: *Alan Cruz Silva, Jovem-Semente* | A trilha cresce: as notas viram acordes, entra uma percussão leve e orgânica (shaker, palmas abafadas). |
| 5 | 16,5–21,0 | **A árvore.** As linhas recolhem e as pessoinhas sobem e se agrupam numa copa redonda. Da linha de chão, onde caiu a semente, sobem **duas mãos marrons** que se abrem até virar o tronco que segura a copa. A estampa recua pras bordas e some. | — (respiro) | Pico da trilha e um acorde aberto, depois uma pausa curta, quase silêncio, antes da logo. |
| 6 | 21,0–23,5 | A árvore desenhada encolhe e **encaixa sobre a logo oficial**, que aparece por baixo num dissolve curto. Nenhuma deformação: a animação foi desenhada pra coincidir com o arquivo, e o último quadro é o arquivo. O lettering "INSTITUTO semear" entra por opacidade. | — | Uma nota final, a mesma do quadro 1, uma oitava acima. |
| 7 | 23,5–26,5 | **Só a logo oficial, parada, centralizada.** Papel claro. Nada mais. | — | O som decai até o silêncio. |

**Total: 26,5 s** (3,0 + 4,0 + 4,5 + 5,0 + 4,5 + 2,5 + 3,0).

## Por que assim

- **Semente → rede → logo** sem slogan: as três frases do Alan fazem o mesmo caminho do desenho
  (bolsa = semente, mentoria = caminhos, rede = rede). O texto é dele e não da instituição falando de si.
- A pessoinha que **já existe em contorno** antes de ganhar cor é o jeito de dizer "o apoio acende,
  não fabrica", sem dizer.
- O pedido de apoio fica implícito nas **mãos** que viram tronco. Quem assiste é convidado a ser mão,
  e ninguém precisa falar isso.
- Sem números, sem pena, sem chamada no fim.

## Plano B (se o Alan não autorizar a frase)

Os mesmos quadros com três palavras soltas no lugar das frases: **"tranquilidade." · "caminhos." ·
"pertencer."** Sem aspas e sem crédito. Ou nenhum texto: o filme se sustenta só no visual.

## Como produzir (depois da aprovação)

- Motor: **HyperFrames** (HTML → vídeo; as skills já estão neste computador) ou **Remotion**
  (`projetos/estudio-motion/`). As pessoinhas, as mãos e a estampa viram SVG redesenhado a partir do
  arquivo oficial, com o último quadro sendo o próprio arquivo.
- Trilha: composta ou com licença. Se for música pronta, o librosa marca as batidas e cada pessoinha
  acende numa nota.
- Entrega: MP4 16:9 e corte 9:16, H.264, com FFmpeg.
