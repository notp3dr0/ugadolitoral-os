# Rodada 18 · a home deixa de parecer a do Cello, o bastidor vira protagonista, a rolagem fica leve

Feito pelo Opus em 2026-11-18, a pedido do Pedro: "o bastidor não chama atenção", "o do Cello é muito mais
otimizado", "a entrada não pode ser tão igual à dele".

## O estudo (ferramentas/estudar-site.mjs, medir-4g.mjs, perfil-rolagem.mjs, traco-rolagem.mjs)

- cellopaes.com: HTML com o JS dentro (33 KB), sem biblioteca, fontes do sistema, 148 elementos. Pesa MAIS que
  o nosso (83 MB no desktop, 47 MB no celular, tudo vídeo). A sensação de leve é a rolagem: no celular médio
  simulado (4G, CPU 4x) 95% dos quadros em 17 ms; o nosso em 33 ms, com engasgo de 83 ms. Estrutura igual à nossa:
  STAGE VIEW (palco 3D) · PROJECTS · nome · INFO; entrada = nome gigante em duas linhas + funções no meio.
- Por que a nossa rolagem pesava (achado no traço do navegador): cem cards vigiados por IntersectionObserver
  (revelação, foco do celular, prévias) obrigavam a página inteira (17 mil px de colagem) a passar por estilo,
  pintura e camadas em todo quadro; o fluido de fundo pedia quadro sem parar; a revelação animava filtro.

## O que mudou

- **Rolagem** (invisível): `js/vigia.js` (vigia próprio: mede a posição uma vez, na rolagem só faz conta) no lugar
  do IntersectionObserver nos cards; o fluido pausa enquanto rola; revelação sem filtro (um véu branco que some na
  opacidade); seletores `:has()` do `<main>` viraram `html[data-vista]`; `content-visibility` nos cards.
  Resultado (celular simulado, rolando a home): trabalho do navegador 3,0 s → 1,2–1,6 s; 95% dos quadros
  50 → 17–33 ms (oscila entre rodadas).
- **Colagem curta** (`js/colagem-curta.js`): 42 vagas sorteadas a cada visita (continua nunca igual) e um convite
  grande "VER O ACERVO INTEIRO →"; a grade e os filmes continuam com tudo. `?colagem=tudo` volta.
- **Entrada nova** (`js/entradas.js`), sai a do nome gigante:
  - `credencial` (padrão): a credencial de FOTO da turnê cai no cordão e balança, com uma foto sorteada do acervo,
    brilho holográfico que segue o mouse, "Acesso liberado." e dois botões: ENTRAR NO BASTIDOR e VER O ACERVO.
  - `?entrada=visor`: o visor da câmera; o foco procura, trava, o obturador bate e a foto vira a capa com o nome
    como legenda (no computador usa o pôster de um filme 16:9; no celular, uma foto vertical).
  - `?entrada=nome`: a de antes.
  As duas esperam a cortina abrir pra animar; uma vez por sessão; "menos movimento" aparece pronta.
- **Monitor do bastidor** (`js/monitor.js`): circuito interno fixo no canto da home com o corredor ao vivo (a
  travessia renderizada no Blender pro showreel, 480 KB), REC, câmera e relógio; cresce no hover; leva pro bastidor.
  Aparece depois que a pessoa sai da entrada; só toca na tela e sem diálogo aberto.

## Testes

`rodada18.mjs` (as três entradas, desktop e celular, monitor, colagem curta), `rodada9`, `rodada10` (letra ≥ 11 px),
`rodada11` (agora com `?entrada=nome`), `rodada8`, `bastidor`: tudo certo.
