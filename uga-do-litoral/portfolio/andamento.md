# Andamento

## 2026-11-11 · preparação do laboratório (Opus 5.5)

- Criado o worktree `site-lab/` no branch `lab`, a partir do `master` (`c6f6abe`). O `site/` não foi tocado.
- `site-lab/` ignorado no git da raiz, como o `site/`.
- Criados `AGENTS.md`, `contexto.md`, este arquivo e o `preview.cmd`.

## Briefing do Pedro pro laboratório (2026-11-11)

Palavras dele, resumidas: refatorar o código do portfólio inteiro, otimizar, melhorar os efeitos e
adicionar efeitos novos que façam sentido pro nicho de fotografia, **sem mudar o coração do site**.
Liberdade total pra uma interface experimental. Ideia que ele deu: uma aba 3D, um corredor onde a
pessoa anda como num jogo e vê as fotos em quadros na parede. Não implementar tudo de uma vez: tudo
numa versão separada, pra ele poder descartar sem mexer no site no ar.

Ordem sugerida das rodadas (o agente pode propor outra, mas mostra antes):

1. **Auditoria.** Ler o código, medir (peso, LCP, FPS do fundo no celular) e devolver um plano curto:
   o que refatorar, o que otimizar, que efeitos novos e onde. Sem código ainda. O Pedro aprova.
2. **Refatoração e otimização** sem mudança visível: mesma cara, mais leve e organizado.
3. **Efeitos** sobre o que já existe, um de cada vez, cada um num commit.
4. **Corredor 3D** como página/aba própria (ex.: `#galeria` ou `galeria.html`), com as fotos do
   `gallery-data.js`, entrada pelo site e volta fácil. No celular precisa de um jeito de andar
   que funcione no toque.

## Rodadas

<!-- uma linha por rodada: data · o que mudou · commit no lab · o Pedro aprovou? -->
- 2026-11-11 · Rodada 1, auditoria (Fable 5.2) · nenhum código mudou, sem commit · plano entregue no chat, aguardando o Pedro escolher.
  Medido no lab (Chrome, GTX 1660, servidor local): carga inicial 1,75 MB no celular, sendo 759 KB de JS (620 KB é o hls.js);
  rolar o acervo inteiro baixa 10,6 MB; abrir uma galeria baixa 1,36 MB em 2 fotos (sempre a versão grande, sem srcset);
  página com 15.960 px de altura no celular; fundo líquido a 60 qps nesta máquina (celular de verdade não foi medido).
  Achados: no celular não há arrastar nem nome do artista; layout da pilha escrito duas vezes (HTML e gallery-data.js);
  ScrollTrigger e Flip estão em vendor/ sem uso; Barlow Condensed declarada e não usada; sem Open Graph; cache de assets de 1 h;
  título da aba usa travessão.
- 2026-11-11 · Plano das rodadas 2, 3 e 4 escrito (Fable 5.2) em `plano/`, com ferramentas de teste prontas em `ferramentas/`
  (fumaca, comparar, medir, foto, dom, tons; todas rodadas contra o lab atual: 18/18 comportamentos OK, 0% de diferença de pixel).
  O Pedro aprovou o rumo e o corredor como bastidor de casa de show. Nenhum código do site mudou.
  **Próxima: rodada 2** (`plano/rodada-2-leve.md`), a executar com o Opus.
- 2026-11-11 · **Rodada 2 feita** (Opus 5.5) · commits `d7fb1e2` a `a21fbf5` no `lab` (um por passo, 2.1 a 2.10) · aguardando o Pedro.
  Carga inicial no celular 1.747 → 753 KB (JS 759 → 153, fontes 185 → 25, pôsteres 232 → 0). Rolar tudo 10,6 → 9,9 MB.
  Galeria continua baixando 1,36 MB (foto grande + a próxima), mas a foto aparece na hora.
  fumaca 18/18; comparar igual, exceto "celular galeria" às vezes (a foto grande sai mais nítida no lab, não é regressão).
  Mudanças visíveis: título da aba com "·" no lugar do travessão; prévia do link (og.jpg). Fora do plano: 17 textos alternativos
  sem travessão; tons.py lê js/data.js; comparar.mjs espera a foto da galeria.
  Pendente com o Pedro: teste das fotos médias (`site-lab/teste-qualidade/`), rótulos em mono no iPhone, teste no celular dele.
  **Próxima: rodada 3** (`plano/rodada-3-efeitos.md`), depois do OK.
- 2026-11-11 · Rodada 2 aprovada pelo Pedro, com os três pendentes: fotos de 1080 px na galeria do celular (`274e6af`, galeria
  inteira 44 → 23 MB), rótulos Consolas/Inconsolata (`c8cd053`) e deploy de prévia.
- 2026-11-11 · **Rodada 3 feita** (Opus 5.5) · commits `8eaf84e` a `07f1a7f` · aguardando o Pedro.
  tom (fundo e halo da galeria pegam a cor da foto), voo (foto sai da colagem e vira a galeria, e volta), revelação (foto entra
  borrada e estourada e assenta), toque (nome em foco e segurar pra arrastar no celular), contato (GRADE vira folha de contato
  com lápis vermelho). Cada um desliga com `?sem=nome`; `?sem=tudo` devolve a grade idêntica à do site no ar (0%).
  fumaca 19/19, toque.mjs 9/9; rolagem 58 qps celular / 57 desktop. Celular de verdade: não testado.
  Prévia temporária (anônima, expira ~53 min depois de 2026-11-11 de madrugada): rapid-marimba-7j287b0.tmp.now.
  Pra prévia que dura: `vercel login` do Pedro e deploy num projeto separado (nunca no `ugadolitoral`).
  **Próxima: rodada 4, o bastidor** (`plano/rodada-4-bastidor.md`), depois do OK.
- 2026-11-11 · Rodada 3 aprovada pelo Pedro ("pra mim tá perfeito").
- 2026-11-11 · **Rodada 4 feita, o bastidor** (Opus 5.5) · commits `2bfb39f` a `25a8be2` no `lab` · aguardando o Pedro.
  `bastidor.html`: corredor de 138,9 m em 6 lances, 80 cópias em 29 alas, 5 filmes projetados, vermelho nas passagens, som
  sintetizado, setlist, porta do PALCO que abre e termina em AGENDA ABERTA. Entradas na home: item BASTIDOR no seletor e a
  faixa-porta no fim do acervo. bastidor.mjs 16/16, bastidor-planta.mjs 9/9, fumaca 19/19, toque 9/9.
  Medido: 60 qps e no máximo 55 chamadas de desenho nesta máquina; página 3,0 MB na entrada; home sem mudança de peso.
  Celular de verdade: não testado (precisa de prévia). Textos novos da tabela da rodada 4 usados como propostos.
- 2026-11-11 · O Pedro testou a prévia das rodadas 2 a 4 e trouxe críticas. Fable 5.2 revisou o trabalho do Opus (seguiu o
  plano) e as críticas (todas válidas; giro de 180° e som repetitivo eram erros do plano, não da execução) e escreveu
  `plano/rodada-5-ajustes.md`. **Próxima: rodada 5**, com o Opus. O passo 5.7 (som) espera os 3 beats que o Pedro vai mandar.
- 2026-11-11 · **Rodada 5 feita** (Opus 5.5) · commits `978796f` a `5282ae5` no `lab` · aguardando o Pedro.
  BASTIDOR na navegação principal; cortina de carregamento (680 ms aqui, teto 2,5 s); fora a numeração "01 / 03"; colagem e
  ordem das alas sorteadas a cada visita (?semente=fixa desliga, pros testes); olhar 360° e andar pra onde se olha (R, Q/E,
  bordas da tela, ↻ no celular); setlist da parede clicável e mapa da planta na setlist; rádio com as 4 faixas do adso*
  (◀ ▶, eco de ginásio, luzes no grave). Testes: planta 11/11, fumaca 20/20, toque 9/9, bastidor 24/24.
  **Atenção, rádio:** as faixas são mashups com trechos de músicas de terceiros e foram baixadas por ferramenta de terceiros
  (lucida.to). Decidir antes de publicar. Trocar é só substituir os arquivos e o `assets/audio/radio.json`.
- 2026-11-11 · Rodada 5 aprovada pelo Pedro ("perfeito"). Ele pediu mais vida no bastidor; Fable 5.2 propôs e ele aprovou
  tudo, falas inclusive: credencial viva (referência de comportamento: wendyenyi.vercel.app), encontros sorteados por visita,
  achados e enfeite fixo. Plano em `plano/rodada-6-vida.md`. **Próxima: rodada 6**, com o Opus.
  Pendente dele: decidir sobre as faixas da rádio (mashups) antes de publicar.
- 2026-11-11 · **Rodada 6 feita, vida no bastidor** (Opus 5.5) · commits `38e6d2a` a `b650983` no `lab` · aguardando o Pedro.
  Credencial viva (crachá com física, frente e verso, foto 3x4 sorteada, fica pequena no topo depois de entrar); encontros
  sorteados por visita, sempre com a água ou o segurança: água, segurança, "tira uma minha?", cartão cheio, passagem de som,
  artista passando; achados: lista da imprensa, proibido flash; enfeite fixo: camarim, rider, mochila, marcas de palco.
  Gente é silhueta em contraluz desenhada em canvas. Forçar uma cena: `bastidor.html?encontros=seguranca`.
  Testes: encontros 18/18, bastidor 30/30, planta 11/11, fumaca 20/20, toque 9/9. Pior caso com tudo forçado: 88 chamadas.
- 2026-11-12 · **Rodada 7** (Opus 5) · commits `7220d77` e `730aa35` no `lab` · aguardando o Pedro.
  (1) 29 fotos novas do Drive: Desiiik 2→9, KayG 1→8, Fab Godamn 3→6, e as alas novas Yunk Vino 6 e LAI$ 6.
  Acervo 80→109 fotos; colagem 85→114 vagas; **o bastidor virou elástico** (lances e vagas por parede saem da
  quantidade de fotos: agora 7 lances, 163 m). Pra acrescentar mais no futuro: `ferramentas/fotos-novas.json` +
  `fotos-descricoes.json` → `converter-fotos.py` → `tools/add-fotos.mjs` → `tools/build-acervo.mjs`.
  (2) Credencial refeita no layout que o Pedro desenhou (`credencial-backstage.html`): foto cobrindo o cartão,
  BACKSTAGE grande, ACESSO em vermelho, identidade sob um filete. Continua viva e com foto sorteada por visita.
  (3) Segurança: uniforme com colete refletivo e SEGURANÇA no peito; MOSTRAR A PULSEIRA virou um braço que sobe
  com a pulseira no pulso; a cena repete a cada passagem, com falas que mudam; toda fala tem voz de desenho
  (uma nota por sílaba, timbre por personagem).
  Testes: planta 12/12, fumaca 20/20, toque 9/9, bastidor 30/30, encontros 19/19.
  **Pendente:** o vídeo do RYU (link que ele mandou) é um .mov vertical de 18,7 s; não entrou, falta ele dizer o que é.
  **Pendente de antes:** decidir sobre as faixas da rádio (mashups) antes de publicar de verdade.
- 2026-11-12 · **Rodada 7, correções** (Opus 5) · no `lab` · aguardando o Pedro olhar no `preview.cmd`.
  Os quatro bugs que ele trouxe, com a causa de cada um:
  (1) **Fotos e nomes de artista se sobrepondo no corredor.** `bastidor/plan.js` punha duas vagas da parede
  direita no mesmo ponto quando o passo estourava o lance (`k + .5 > POR_PAREDE - 1 ? k - .5 : k + .5`).
  O espalhamento virou passo fixo entre 2,9 m e 16,0 m, com a direita meio passo depois da esquerda.
  Agora: 0 vagas repetidas, 1,64 m de folga mínima entre cópias da mesma parede, 0 estênceis sobrepostos.
  (2) **A água não acontecia.** O clique não falhava: o olhar segue o cursor, então mirar a garrafa (3 cm,
  ~15 px na tela) girava a câmera e o alvo fugia de baixo do mouse. Duas correções: o olhar **congela
  enquanto o cursor está em cima de algo clicável** (`controls.js`, `st.mirando`, travado uma vez só pra não
  atrapalhar o R da meia-volta), e a mesa da água ganhou uma caixa de alcance invisível (1,6 × 1,1 × 0,85 m)
  mais o próprio produtor como alvo. Isso vale pro bastidor inteiro, não só pra água.
  (3) **Não dava pra clicar e arrastar na aba principal.** `.media.latente` (foto que ainda não revelou) fica
  com `opacity: 0` mas continuava capturando o ponteiro: a foto invisível roubava o clique da foto visível
  embaixo. `.media.latente { pointer-events: none }` (reativado em `prefers-reduced-motion`, onde ela é
  visível). Medido depois: 0 cards tapados por foto invisível, 8/8 arrastos em 8 alturas de rolagem.
  (4) **Os vídeos.** Entraram três, hospedados aqui mesmo em HLS (`stream/film-N/`, 53 MB no total, teto de
  2,6 Mbps), com preview de 5 s e poster como os filmes antigos: RYU (18,7 s), KayG (2 min 05) e Desiiik (10,8 s).
  A pasta VIDEOS do KayG tinha dois arquivos, mas são **o mesmo corte** — master 4K (3,6 GB) e export de
  Instagram 1080×1920; entrou o de Instagram. O sorteio que ele pediu virou regra: o acervo tem 8 filmes e a
  colagem tem 7 vagas, então **duas vagas são rotativas** (`js/rotativos.js`) e cada visita sorteia 2 dos 3
  vídeos novos; no corredor, as 6 telas também saem de um sorteio dos 8 filmes.
  Testes: planta 12/12, fumaca 20/20, toque 9/9, bastidor 30/30, encontros 19/19. Teto de desenho 90 → 96
  (o corredor passou a ter 6 telas de filme em vez de 5; pior caso medido 92).
- 2026-11-12 · **A rodada 7 virou o site no ar.** `ugadolitoral.vercel.app` agora serve o lab
  (deploy `dpl_6Zvv…`, produção, commit `74e2c78`). O caminho: as duas portas do CLI da Vercel
  (`vercel login` e criar token) caem num "Verify Your Identity" por e-mail, e a caixa do
  `imagens.ludique@gmail.com` está cheia — nenhum código chega. O Pedro ligou o GitHub na Vercel e
  o deploy passou a sair pelo repositório, sem e-mail nenhum.
  **Mudou a infraestrutura:** o site deixou de ser enviado por upload e passou a vir de
  `github.com/notp3dr0/ugadolitoral-site` (privado), branch `main` = branch `lab` do worktree.
  Daqui pra frente **`git push origin lab:main` já publica em produção**. Rollback pela Vercel:
  o deploy anterior é `dpl_824WVAhUUw3SCLb4nVnCSh5L4qsz`.
  Conferido no ar: 116 cards, 109 cópias no corredor, 31 alas, 6 telas (com os filmes novos),
  arrasto na colagem funcionando, HLS servido com o tipo certo, zero erro de console.
  **Atenção:** `site/` (branch `master`) **não é mais igual à produção** — virou o histórico do site antigo.
  **Continua pendente:** a rádio do bastidor subiu com as mashups. Está público.
- 2026-11-12 · **Rodada 8 planejada** (Fable 5.2) · `plano/rodada-8-folha.md`, aprovada inteira pelo Pedro, falta executar (Opus).
  Análise do bastidor medindo: 60 qps nos dois, mas 27 travadas longas no celular simulado (decodificação de foto na thread
  principal), 100 texturas vivas, rádio descompactando ~50 MB por faixa. Dois defeitos: a trava do olhar da rodada 7 (não solta
  com o mouse parado, trava olhando pro fundo, tranco de 10,6° ao sair) e a volta do fim presa no lance 5.
  Novo: link direto (`?foto=`, `?ala=`), chamado no foco, folha de contato (imagem 1080×1920 das fotos vistas), giroscópio.
  Ferramentas novas: `rodada8.mjs` (4 falhas de propósito hoje) e `medir-bastidor.mjs`. **Nada publicado.**
- 2026-11-12 · **Rodada 8 executada** (Opus 5.5) · 9 commits no `lab` (`f9105fe` a `e4ff032`) · **não publicada**.
  Celular simulado: travadas longas 27 → 1; pior quadro 117 → 133 ms (a meta ≤ 80 não veio: a travada que sobra é
  uma só, não insisti). Texturas vivas 100 → 95 (meta ≤ 80 não veio: 54 delas são os estênceis de nome de ala, um por
  artista, sempre vivos; as cópias com textura no pico são 23). Rádio sem descompactar faixa (MP3 em pedaços, 206).
  Desvios do plano: (1) a trava da mira não pega durante giro de tecla (R, Q/E), senão abortava a meia-volta quando o
  centro da tela passava pela setlist pintada; (2) o cursor é ouvido na janela, não no canvas (em cima do HUD a posição
  ficava velha); (3) quadros da folha com 216 px (não 232) pra caber o nome do artista e a perfuração; (4) a folha
  desenha sempre o rolo inteiro de 5 tiras, o que não foi visto aparece como filme não exposto (com 3 fotos a folha
  ficava com um vazio enorme); (5) no celular FOLHA e GIRO descem pra segunda linha: a credencial pendurada cobria.
  Achado no caminho: o canvas da folha transbordava e cobria o SALVAR IMAGEM (corrigido).
  Testes: planta, fumaça, toque, bastidor, encontros e rodada8 (24 checagens) passando. Giroscópio e compartilhar não
  foram testados em celular de verdade.

## 2026-11-14 · rodadas 9 e 10 publicadas (visão do contratante)

- **Rodada 9 (b83b260):** INFO abre com o que o Pedro faz, "JÁ REGISTREI" (22 artistas do acervo + O Melhor Dia, FKTOUR, Odisseya, Adulto Ideal), "O QUE DÁ PRA CONTRATAR" (6 serviços) e a bio por último, sem a idade. Botão AGENDA ABERTA fixo no acervo; todo WhatsApp abre com mensagem pronta. Teste: `ferramentas/rodada9.mjs`.
- **Rodada 10 (3700e55):** intro mais curta (primeira foto a 1,8 tela no celular, era 2,7); nenhuma letra abaixo de 11 px (10,5 em 360 px); vista FILMES ao lado de COLAGEM/GRADE com os 8 filmes, inclusive o que o sorteio deixa fora da colagem. Teste: `ferramentas/rodada10.mjs`.
- Publicadas juntas em produção (deploy `dpl_8XgeX75PNbRLhBxotksW5zA88YDc`). Push em `main` não dispara a Vercel sozinho: o deploy é pedido pelo conector da Vercel (gitSource, ref main, target production).
- **Em aberto:** contexto por foto (show, tour, cidade, ano) depende do Pedro; domínio próprio; rádio do bastidor com música de terceiros; "Abrir no Google Drive" no player.

## 2026-11-14 · rodada 11 (publicada em 2026-11-14, deploy dpl_3k9rhBGJmi8ivvPtL4KhNvZdEbW7)

- Intro toca sozinha (~2,4 s depois da cortina), sem rolagem; qualquer gesto pula; só na 1ª visita da sessão; chegando por link com # vai direto. Intro ocupa 84svh (78 no celular): acervo a ~1 tela.
- No quadro final, PEDRO e AUGUSTO não encavalam mais no celular (o movimento das linhas segue o tamanho da letra).
- INFO se revela: títulos, rótulos e serviços embaralham e resolvem (`js/embaralha.js`, `js/info-revela.js`); texto longo sobe com fade. Menos movimento: nada anima.
- Commit 10793b9, prévia na branch `rodada-11`. Teste: `ferramentas/rodada11.mjs` (rodada10 perdeu o passo da intro por rolagem).

## 2026-11-17 · rodada 12 (câmera) feita; 13 e 14 planejadas

- Causa do "só gira 180": no celular o olhar voltava sozinho pro eixo 1,8 s depois de parar, e a ajuda puxava pra foto mais perto mesmo de lado; no desktop, passar o cursor por um botão do HUD na borda ou por uma foto perto (trava da mira) parava o giro.
- Conserto em `bastidor/controls.js` e `main.js`; setas ←/→ giram. Teste `ferramentas/rodada12.mjs` (5 de 9 passos falhavam antes). Commit 48eeb3d, prévia na branch `rodada-12`.
- Planos: `plano/rodada-13-luz.md` (bake do Blender num lance, atrás de `?luz=blender`) e `plano/rodada-14-gente.md` (pessoas 3D; falta o Pedro escolher o estilo).

## 2026-11-17 · rodada 12 no ar; rodadas 13 e 14 em prévia

- Rodada 12 (câmera) publicada com o OK do Pedro ("deu super certo"): push `lab:main` + deploy de produção dpl_DEeKFZLbxeSGe6q1XGHwiEdg8Xm6.
- Rodada 13 (luz): bake no corredor inteiro, na própria casca do site (desvio do plano, ver `plano/rodada-13-luz.md`). Scripts `bake_site.py` e `bake_site_pos.py` na pasta `blender/` do showreel; mapas em `site-lab/bastidor/luz/` (120 KB). `?luz=blender`, ganho 4.
- Rodada 14 (gente): o Pedro escolheu manequim estilizado. Montado em código (`bastidor/manequim.js`), uma malha com esqueleto por pessoa. `?gente=manequim`. Detalhes em `plano/rodada-14-gente.md`.
- Testes: rodada12, rodada8, bastidor e encontros passam; encontros com `EXTRA="&gente=manequim&luz=blender"` passam (pior caso 86 chamadas de desenho, teto 96). Prints em `ferramentas/saida/luz/` e `saida/gente/`.
- Commit d023236, prévia na branch `rodada-13`. Falta o OK do Pedro pra virar padrão (tirar as chaves) e publicar.

## 2026-11-18 · rodada 15 (prévia rodada-15)
O Pedro disse que só a luz tinha mudado e que o manequim era genérico. Pesquisa aprofundada (`reports/Bastidor fiel ao vídeo.md`) e depois: concreto de fôrma e piso polido assados do material do filme, papel e fita das cópias com a luz pintada, sombra, reflexo falso no piso (`?luz=blender`); elenco com base CC0 da Quaternius vestida por script, SEGURANÇA amarelo nas costas, poses por IK, animação parado/andando (`?gente=elenco`). Testes todos OK, pior caso 88 chamadas. Ver `plano/rodada-15-fiel.md`. Esperando o OK do Pedro pra virar padrão e ir pro ar.

## 2026-11-18 · rodada 16 (prévia rodada-16)
O Pedro achou que o cenário não progrediu e mandou esquecer a mudança de cenário: fica o corredor de antes, muda só a gente. O elenco virou o padrão (`?gente=recorte` volta pras silhuetas); a luz e a matéria do Blender (rodadas 13 e 15) ficam desligadas no código, só com `?luz=blender`, e não vão pro ar. Testes OK no padrão (artista e orçamento falharam numa bateria longa por tempo e passaram 2x rodando sozinhos, pior caso 86).

## 2026-11-18 · rodada 17 (prévia rodada-17)
O Pedro quis de volta o cenário do Blender (rodada 15) sem o reflexo do chão ("absurdamente feio") e sem as luzes dos refletores batendo no chão, e personagens que não pareçam manequim. Feito: cenário do filme é o padrão (`?luz=hoje` volta pro antigo); reflexo removido do código; o piso usa o mapa de luz reduzido a ~2 m por ponto (sem poças, mantém o escuro de cada trecho); parede e papel calibrados contra o render (parede 25 x 24, piso 19-25 x 21). Elenco: cabeça modelada de volta (sai a oval), pele em tons diferentes, cabelo e barba da Quaternius (CC0), olhos escuros sem traço; boné e capuz corrigidos. Testes todos OK (pior caso 84). Falta o OK do Pedro.
- 2026-11-18 (cont.): o Pedro viu silhuetas chapadas na prévia: na internet de verdade o elenco (~1,2 MB) chegava depois do primeiro encontro e o recorte ficava. Agora o recorte vira o personagem 3D no mesmo grupo quando o elenco chega (`ferramentas/elenco-lento.mjs` simula 8 s de atraso: recorte → 3d, sem erro).
- 2026-11-18 (cont.): cabeça do elenco girava (osso sem trilha na animação acumulava o olhar): agora desfaz o olhar antes da animação (`ferramentas/cabeca.mjs`). Folha de contato retirada (botões e fim; `sheet.js` guardado sem uso; teste 8.7 virou "sem folha"). Tirado o "VOCÊ CHEGOU NO PALCO" da tela final. Luz refeita sem as telas (a sombra de tela vertical/horizontal ficava pintada na parede quando o sorteio trocava o filme). RYU regravado na horizontal 1802x1012 (o original do Drive é gravado deitado com giro de 90 graus; a conversão antiga espremeu): prévia, pôster e HLS, e data.js/index.html corrigidos.

## 2026-11-18 · rodada 18 (prévia rodada-18)
Home: estudo do site do Cello (mesma estrutura e entrada parecida; pesa mais que o nosso, mas rola lisa). Entrada nova (credencial padrão, visor, nome antigo por chave), monitor do bastidor fixo com o corredor do Blender, colagem com 42 vagas + convite pro acervo, rolagem leve (vigia próprio no lugar de IntersectionObserver, fluido pausa na rolagem, revelação sem filtro, sem :has, content-visibility). Ver `plano/rodada-18-home.md`. Falta o Pedro escolher a entrada e dar o OK.

## 2026-11-18 · rodada 19 (prévia rodada-19)
O Pedro achou péssima a entrada da credencial ("Acesso liberado"): voltou a entrada das letras (o visor fica escondido em `?entrada=visor`). Gostou do monitor do bastidor (fica). O fim do acervo, que eram duas folhas de porta (ENTRADA DE ARTISTAS / BASTIDOR, pareciam dois cards pro mesmo lugar), virou uma janela só: o corredor do Blender tocando, BASTIDOR e ENTRAR; o monitor do canto sai quando ela está na tela. Saíram as contagens "109 fotografias · 8 filmes". No bastidor: os botões de entrar aparecem na hora (o "PASSANDO O SOM" esperava as primeiras fotos); o crachá ficou maior e com cordão de cetim em V, mosquetão e capa de PVC renderizados no Blender (`portfolio/objetos/credencial.py`); a pulseira virou um render só dela, sem mão (`objetos/pulseira.py`). Tentei um braço realista, o Pedro não quis ("não é pra fazer algo realista"): descartado. Bug achado e corrigido: content-visibility no celular fazia a colagem pular e o vigia perder posição (agora só no computador; vigia remede quando a página muda de altura). Testes todos OK.

## 2026-11-18 · rodada 20 (prévia rodada-20)
Pedro: o cordão era um PNG duro; pediu física de colar como no site de referência (wendyenyi.vercel.app, da rodada 6). Estudei o código dela (three.js 0.170, corda que só puxa + meio da fita atrasado + cartão como segundo pêndulo) e fiz a nossa: duas fitas em V em SVG com a estampa correndo na curva, metal (presilha, giratório, mosquetão) render do Blender (`objetos/credencial.py` → `prendedor.webp`), arrastar leva o crachá, levantar afrouxa a fita. Cartão de volta ao original (sem capa de PVC, furo de volta), só ACESSO BACKSTAGE (saiu nome e funções), tamanho maior mantido. WALLPAPER ↓ no acervo (galeria) e no bastidor (legenda da foto): corte na proporção da tela, maior resolução da foto, assinatura discreta, compartilhar no celular / baixar no computador (`js/wallpaper.js`). Tirado o 2026 da entrada. A entrada das letras só existe na home (ACERVO/FILMES/INFO só cabeçalho); título da INFO virou título normal, sem embaralhar. Ideias minhas: mira de câmera no hover da colagem (`js/mira.js`), a porta do bastidor abre com a rolagem (CSS scroll-driven), e `?letras=foto` (a foto aparece dentro de PEDRO AUGUSTO no fim da entrada; só por link). Testes OK (falhas pontuais de tempo passaram ao repetir).
- 2026-11-18 (cont.): rodada 20 no ar com o OK do Pedro (commit 592a6d5, deploy de produção dpl_3iPjVEWYqznR3GXpi2VedMWcTdQx). Vão juntas as rodadas 15 a 19 (cenário do filme, elenco, home nova).

## 2026-11-18 · rodada 21 (no ar)
O Pedro aceitou todas as ideias da rodada 20 (menos o domínio, por enquanto) e pediu mais, com referência gringa (`referencias/pesquisas/pesquisa-portfolio-interativo-funcionalidades-2026-11-18.md`). Feito:
- a foto dentro de PEDRO AUGUSTO virou o padrão (`?letras=branco` volta pro branco);
- na INFO, os nomes de JÁ REGISTREI abrem a galeria do artista (`js/info-artistas.js`, 22 nomes);
- OUVIR O SHOW na barra do acervo: batida de trap feita na hora pelo navegador, abafada como atrás da parede, que abre perto da janela do bastidor; clique de obturador ao abrir foto; desligado por padrão (`js/som-show.js`);
- fotômetro: segurar no vazio entre as fotos mede a luz, soltar estoura o flash e rearruma a colagem (`js/fotometro.js`);
- o monitor do bastidor troca pra CAM da ala do artista em foco (`js/monitor.js`);
- 404 é o monitor mostrando um corredor que não existe (`404.html`);
- FOTOGRAFAR no bastidor: o corredor desenhado de novo em 1080 x 1920, com visor, ala, data e hora, ACESSO BACKSTAGE e o endereço; compartilhar no celular, baixar no computador (`bastidor/foto.js`; a entrega ficou em `js/wallpaper.js` → `entregar`). No celular o botão fica embaixo do ACERVO e o GIRO embaixo do SETLIST, pra não bater no crachá.
- Teste novo `ferramentas/rodada21.mjs` (computador e celular, tudo certo); prints em `ferramentas/saida/r21/`.
- No ar com o OK que o Pedro já tinha dado ("se quiser, pode até subir"): commit 52bd36d, push `lab:main`, deploy de produção dpl_7aJLpXgbNEWcf5z6jMaNTVvgb6gU. Conferido no ar (computador e celular, sem erro); endereço que não existe cai na 404 nova com código 404.

## 2026-11-18 · rodada 22 (NA ESTRADA e medição)
O Pedro pediu os dois pendentes (diário de turnê e Analytics) e liberou usar o Google dele (plano Ultra).
- NA ESTRADA na INFO (`js/estrada.js`): datas como costas de camiseta de turnê, PRÓXIMAS (cidade em vermelho, "VOU ESTAR LÁ") e JÁ PASSOU; a data decide sozinha em que grupo o show fica. Nome de artista com galeria abre a galeria. Só entra show confirmado, cada linha com a fonte:
  - 29/11/2026 · São Paulo · Dia do Trap · Vale do Anhangabaú (o Pedro falou, 18/11);
  - 04/12/2026 · São Caetano do Sul · TRAP in Sanca × Veigh · Espaço Liv (trapinsanca.com.br/agenda + Pedro);
  - 13–14/11/2026 · São Caetano do Sul · TRAP in Sanca Festival · Espaço Liv · TETO, RYU THE RUNNER, ALEE, DESIIIK, PHL (e-mails de credenciamento + site do evento);
  - 16/10/2026 · São Caetano do Sul · TRAP in Sanca × Matuê (site do evento + pasta MATUE TRAP IN SANCA no Drive).
- As fotos do acervo não têm data (o EXIF sai na exportação), então o resto ficou numa planilha no Drive do Pedro pra ele preencher: "Uga · Na Estrada (diário de shows do site)" (https://docs.google.com/spreadsheets/d/1RKSqAhRYIHGFiWeH7jNWzOFP3ceFgQojb_iMBbTnKZU). Quando ele preencher, as linhas viram entradas em `SHOWS`.
- Medição: `js/marcar.js` carrega o Vercel Web Analytics (sem cookie) e marca entrar no bastidor, FOTOGRAFAR, wallpaper, OUVIR O SHOW, fotômetro, nome de artista, WhatsApp, e-mail, Instagram e ida pro bastidor. Está com `LIGADO = false`: o Analytics não está ativo no projeto e a CLI da Vercel aqui está deslogada; o Pedro liga no painel (Projeto → Analytics → Enable), aí troca pra `true` e publica. Visitas por página funcionam em qualquer plano; os eventos (FOTOGRAFAR etc.) só aparecem no plano Pro.
- Teste `ferramentas/rodada22.mjs` (com o relógio em 18/11 e em 10/12: depois do último show tudo vai pra JÁ PASSOU).
- Medição ligada: o Pedro ativou o Analytics no painel; `LIGADO = true` (commit eb007f1), deploy dpl_EovNeYi32PaNPqfnaYPVtJ7WFqpZ; o script da Vercel carrega no ar (200), sem erro.
- No ar: commit f8cba1d, push `lab:main` (e prévia `rodada-22`), deploy de produção dpl_63MJhqzHeYRdjVM5TSJxnokyvKBu. Conferido no ar: os 4 shows aparecem, sem erro, computador e celular.

## 2026-11-18 · rodada 23 (INFO com foto; prévia rodada-23)
- OUVIR O SHOW saiu da home a pedido do Pedro (direto pro ar, commit ac5339f, deploy dpl_5RVvzsMEt6rc5SJsDjjfsMCF4xpq). `js/som-show.js` guardado sem uso.
- O Pedro achou a INFO "muito texto jogado". Diagnóstico: nenhuma foto numa página de fotógrafo, metade da tela vazia no computador, tudo com o mesmo peso, os 22 artistas num parágrafo corrido, fim sem chamado.
- Nova sequência, pensada pra quem vai contratar: abertura (frase grande + maço de cópias do acervo que se folheia sozinho e abre a galeria) → 01 JÁ REGISTREI como line-up de cartaz (nomes grandes, um a cada três vazado, foto do artista acompanha o mouse no computador) → 02 NA ESTRADA → 03 O QUE DÁ PRA CONTRATAR com uma foto por serviço (palco, bastidor, retrato, filme, tratamento, por dentro da estrutura) → 04 DE ONDE EU VENHO em linha do tempo (as mesmas frases da bio, em quatro paradas) → fecho ME CHAMA sobre a foto do TZ diante do público, com WhatsApp, e-mail e Instagram.
- Texto novo só nos títulos e no fecho ("Tem show, turnê ou lançamento vindo aí?" / "ME CHAMA."). Fotos sem mexer na cor; só escuro por cima onde tem texto.
- Arquivos: `index.html` (seção #info), `js/info-visual.js` (novo), `js/info-artistas.js`, `js/estrada.js`, `js/info-revela.js`, `style.css` (bloco rodada 23). Teste `ferramentas/rodada23.mjs`; prints em `ferramentas/saida/r23/` e `saida/info/` (antes e depois).


## 2026-11-18 · rodada 24 (INFO vira SOBRE, ajustes do Pedro; prévia rodada-24)
O Pedro gostou de grande parte da rodada 23 e pediu pra tirar o que tem cara de site feito por IA:
- Topo sem "PEDRO AUGUSTO" e sem "FOTOGRAFIA · VÍDEO · EDIÇÃO · SÃO PAULO"; fica só a frase (agora o título da página): "Fotografo e filmo rap e trap: o show, a turnê, o ensaio e o que acontece atrás do palco." Depois, AGENDA ABERTA · ME CHAMA um pouco maior (14 px no computador, 13 no celular) e os três links.
- Sem rótulo numerado vermelho em lugar nenhum (01 · JÁ REGISTREI, 02 · NA ESTRADA, 03…, 04…). O line-up de cartaz fica sem título; o diário de shows começa direto no PRÓXIMAS (o Pedro gosta dele); JÁ PASSOU continua embaixo.
- Saíram as tours pequenas (O Melhor Dia · FKTOUR · Odisseya Tour · Adulto Ideal Tour) e os números 01–06 nas fotos dos serviços.
- Títulos como frase em branco, na letra da abertura: "O que dá pra contratar?" e "Sobre mim".
- A linha do tempo voltou a ser a bio em texto corrido (os três parágrafos de antes), com "Sobre mim" do lado no computador.
- No cabeçalho, INFO virou SOBRE (endereço `#sobre`); link antigo com `#info` continua abrindo e o endereço vira `#sobre`.
- Teste novo `ferramentas/rodada24.mjs` (computador e celular, tudo certo); `rodada11` e `rodada23` ajustados. Prints em `ferramentas/saida/r24/`.
- O Pedro aprovou ("achei perfeito, sim") e pediu uma foto dele embaixo do "Sobre mim", ao lado do texto. Foto que ele mandou na conversa, exportada sem mexer na cor (`site-lab/assets/pedro-sobre-lg.webp`, 1508 × 851, 239 KB, só baixa quando o SOBRE abre); o recorte 4:5 centrado nele é só no CSS. No computador: título em cima à esquerda, foto embaixo dele, texto ao lado da foto; no celular: título, foto, texto.
- No ar: commit b3eb17d, push `lab:main` (e prévia `rodada-24`), deploy de produção dpl_3zbsi7zRpsSEAJzVjDATSBE2UZ58.
