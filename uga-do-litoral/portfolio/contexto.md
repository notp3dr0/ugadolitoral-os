# Contexto do site

## O que é

Portfólio de fotografia e vídeo do Pedro Augusto (Uga do Litoral): shows, artistas de rap e trap,
eventos. No ar em ugadolitoral.vercel.app (Vercel; desde 2026-11-12 o código mora em `site-lab/`, repo privado `notp3dr0/ugadolitoral-site`; `main` = produção). Público principal
chega pelo link da bio do Instagram, então **celular primeiro**. Serve pra quem curte o trabalho e
pra artista ou marca que quer contratar.

## Como o código está montado (estado de 2026-11-03)

- `index.html` (~42 KB): intro, header, acervo em "pilha" (colagem de cards com posição x/y/w/z em
  CSS custom properties), página Info, dois `<dialog>` (galeria de fotos e player de filme).
- `app.js`: monta a pilha a partir de `gallery-data.js`, alterna COLAGEM / GRADE / INFO por hash,
  arrastar cards com pointer events, prévias de vídeo tocando só quando visíveis (IntersectionObserver),
  galeria por artista com miniaturas, teclado e swipe, player com hls.js.
- `intro.js`: entrada com PEDRO / AUGUSTO, "2026", funções embaralhadas, botão PULAR.
- `liquid-ether.js`: fundo de fluido em WebGL (port do react-bits, licença em `vendor/`).
- `gallery-data.js`: `window.PORTFOLIO` com 80 fotos (título, alt, artista, galeria, tamanhos).
- `video-data.js`: `window.VIDEO_MEDIA` com 5 filmes; o stream HLS mora no Vercel Blob, a prévia
  mp4 em `assets/`.
- `style.css`, `fonts.css`: Barlow Condensed e Manrope em TTF local.

## O coração (não sai, não troca)

Em 2026-11-03 uma "Rodada 1" tirou o fundo líquido, o texto embaralhado, o "2026", o header de vidro
e mudou a intro pra um obturador. **O Pedro reverteu tudo** (commit `c6f6abe`). Então isto fica:

- o fundo líquido (LiquidEther) atrás de tudo;
- a intro com PEDRO / AUGUSTO, o ano e o texto que embaralha;
- a colagem/pilha de fotos arrastáveis como home, com a alternância pra grade;
- a navegação ACERVO / UGA DO LITORAL / INFO e a estética preta, editorial, tipografia grande;
- a galeria por artista e o player de filmes.

Pode: deixar cada uma dessas coisas mais leve, mais fluida, mais bonita por dentro. Não pode: remover,
substituir por outra ideia ou "limpar" o visual.

## Pontos já medidos (2026-11-11), pra quem for otimizar

- `assets/` tem 56 MB: fotos grandes (`-lg.webp`, até 1600 px) somam 45 MB, pequenas (`-sm`, 640 px)
  5,1 MB, prévias de filme 4,6 MB, fontes TTF 648 KB.
- 7 imagens com `loading="eager"`, 73 com `lazy`.
- `hls.min.js` (620 KB) carrega em toda visita, mesmo sem ninguém abrir um filme.
- Fontes em TTF, sem WOFF2 nem subset.
- `liquid-ether.js` roda WebGL o tempo todo; vale conferir custo no celular e pausa fora da tela/aba.

São pistas, não ordem. Medir de novo antes de mexer.

## Marca

Identidade em `_contexto/marca/` na raiz (começar por `design-guide.md`). Paleta oficial ainda não
definida: preto, branco, off-white quente `#f2f0eb`, cinza `#a5a5a5`, vermelho de palco como acento.
