# HASAG · Black November · "O FIO" (v2, só JavaScript)

Pedido do Pedro em 2026-11-10: comercial novo, mais história do que vitrine, linguagem de
Samurai Jack, animação só em JavaScript (sem Remotion, sem HyperFrames), trilha e efeitos
sintetizados. Não substitui a v1 (Contas de Baily, em `../filme/`): é outro filme.

Vertical 1080x1920, 30 qps, 36 s (1080 quadros). Canvas 2D desenhado à mão em código,
quadro a quadro, determinístico. Trilha e efeitos gerados em JS (Node escrevendo WAV).

## A história em quatro frases

Um andarilho atravessa uma cidade de concreto sob um sol que é o eclipse do símbolo HSG. Três
sombras fecham a rua e, num único clarão, ele vence o duelo, mas a corrente barata que levava no
pescoço arrebenta e cai na poeira. Ele segue até um portão com a forma do símbolo HASAG: lá dentro,
mãos enfiam pérola por pérola e fecham nele um 1K2Q e, sem ele pedir, uma Pulseira G1 no punho.
Ele sai pelo portão no instante da totalidade, e o que se quebrou virou o que dura.

Ideia por trás (leitura minha, não da marca): o site diz "joias que resistem ao tempo" e "transmitir
sua identidade sem precisar de palavras". O filme não fala: mostra a corrente que não resistiu e a
peça feita à mão que resiste. A pulseira chega como no ateliê de verdade, junto com o colar.

## Linguagem (Samurai Jack como gramática, nada da série)

- Forma chapada, sem contorno; profundidade só por camadas de tom (3 a 4 planos de cor).
- Silhuetas fortes, horizonte baixo, figura minúscula no plano geral.
- Quadro dividido em painéis (no vertical: tiras horizontais empilhadas) que deslizam pra dentro.
- Silêncio antes do golpe, clarão, e o resultado só depois (ação fora de quadro).
- Vento que carrega coisa no quadro: aqui é uma sacola plástica, não folha.
- Movimento fluido com easing a 30 qps; corte seco só no golpe e no clique do fecho.
- Paleta: off-white `#F2F1ED`, vermelho do símbolo `#AF0C05`, preto, mais tons de poeira
  (bege/ocre queimado) no deserto e um vermelho quase preto na totalidade. Pérola com nácar
  (gradiente radial + brilho), metal com faixa de luz, strass como estrela de 4 pontas.
- Grão leve e vinheta por cima de tudo.

## Personagem

O andarilho dos reposts: dreads com ponta vermelha, óculos ovais vermelhos, jaqueta larga verde-oliva
aberta, camiseta vermelha. Começa com uma corrente fina cinza (sem marca). Termina com o 1K2Q
(pérolas brancas, bolas de strass, três cruzes, a do meio maior) e a G1 no punho direito.
As sombras rivais: três silhuetas pretas altas, de capuz, sem rosto, só com o brilho de um olho.

## Plano a plano

| # | tempo | o que acontece | som |
|---|---|---|---|
| 1 | 0:00–0:04 | Plano geral. Céu off-white, sol enorme que é o eclipse HSG (disco branco com filete vermelho). Cidade chapada: blocos, caixas d'água, fios. Figura minúscula entra pela esquerda, sombra longa. Sacola plástica rola com o vento. | vento, um sino grave longe |
| 2 | 0:04–0:08 | Três tiras empilhadas deslizando: tênis na poeira / dreads balançando / óculos refletindo o sol. Corrente cinza fina brilha uma vez. | passos no tempo do beat que começa abafado (808 grave, sub) |
| 3 | 0:08–0:12 | As três sombras surgem no fim da rua, em contraluz. Ele para. Painéis verticais estreitos: olho dele / olho da sombra / mão fechando. A sacola passa entre eles. | beat corta; só vento e um zumbido subindo |
| 4 | 0:12–0:14 | Silêncio total, 12 quadros parados (só o pano da jaqueta mexe). Depois as sombras avançam. | silêncio, depois inspiração |
| 5 | 0:14–0:15 | CLARÃO: dois quadros invertidos (negativo), um traço vermelho diagonal cruza a tela. Ele aparece do outro lado, de costas pra eles. | golpe: estalo + whoosh + impacto grave |
| 6 | 0:15–0:18 | As três sombras desmancham em fumaça e caem. Pausa. Então a corrente cinza dele arrebenta no fecho e escorrega, câmera lenta, até a poeira. Close no elo partido. | tilintar fino de metal caindo, vento volta |
| 7 | 0:18–0:21 | Ele ergue os olhos. No fim da rua, um portão de concreto com a forma da estrutura do símbolo HASAG; no vão redondo, o sol. Ele caminha até lá, câmera empurra pra dentro do vão. | pad grave entra, coro sintético curto |
| 8 | 0:21–0:26 | Ateliê. Fundo vermelho do símbolo, mãos em silhueta enfiando pérolas num fio: cada pérola desce e encaixa no tempo de uma colcheia, strass acende, cruzes encaixam. Texto pequeno: "FEITO À MÃO". | beat volta cheio; cada pérola é um clique tonal (o hi-hat é a pérola) |
| 9 | 0:26–0:29 | Plano peito: as mãos fecham o 1K2Q no pescoço dele. Ele já vai virar, uma mão segura o punho dele e fecha a G1: clique seco. Etiqueta: "+ PULSEIRA G1". | clique do fecho no tempo 1, cowbell/sino |
| 10 | 0:29–0:32 | Ele sai pelo portão no instante da totalidade: céu vira vermelho quase preto, coroa de raios atrás do disco, as pérolas acendem com crescente de luz. Contra-plongée, vento, colar balançando, G1 brilha no punho erguido. | drop final, 808 e coro |
| 11 | 0:32–0:36 | Tela final off-white (hierarquia do banner): símbolo HSG, BLACK (vermelho) / November (preto itálico), G1 desenhada, "GANHE UMA PULSEIRA G1 / NA COMPRA DE QUALQUER COLAR.", "hasagstore.com.br". | cauda do sino, um tilintar final |

## Oferta (fato confirmado pelo Pedro em 2026-11-10)

"Ganhe uma pulseira G1 na compra de qualquer colar." Nada de preço nem prazo na tela (não confirmados).

## Peças (conferidas na foto da loja)

- G1: 15 pérolas, 4 rondelas de strass, ordem 3-R-3-R-3-R-3-R-3, corrente extensora e fecho lagosta.
- 1K2Q: pérolas brancas, bolas de strass, três cruzes góticas, a do meio maior e mais baixa.
