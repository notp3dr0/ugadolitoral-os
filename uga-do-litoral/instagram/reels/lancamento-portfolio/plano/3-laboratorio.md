# Agente 3 · Laboratório (Python: luz, montagem, som, MP4)

Você junta tudo. Recebe sequências de quadros dos agentes 1 e 2 em `quadros/<ID>/<passe>/`, as fotos e os
filmes do site, a música, e entrega o MP4. Toda a luz do filme é sua. Sua pasta: `pos/`.
Saídas: `saida/showreel-v1.mp4`, `saida/revisao/`.

## Entradas

- `tempo.json` (grade de batidas, a única fonte de tempo) e `montagem.json` (o que entra em que quadro).
- `quadros/<ID>/cor|fio|prof/` e `quadros/<ID>/pronto.json`. Passes: `cor` JPG; `fio` JPG em cinza
  (linha branca, fundo preto); `prof` PNG com distância linear de 0 a 30 m em 16 bits (R alto, G baixo;
  65535 = vazio). `G1_nome` é PNG com transparência.
- Fotos: `portfolio/site-lab/assets/*-lg.webp` (até 1600 px) e os dados em `portfolio/site-lab/js/data.js`
  (dá pra ler com `node -e`). Filmes: `portfolio/site-lab/assets/film-N-preview-1080.mp4` (5 s cada;
  verticais: 2, 5 e 6; os outros são horizontais).
- Música: `audio/musica.wav`.

## Ordem de trabalho

1. **Animático primeiro.** Escreva o montador (`pos/montar.py`) que lê `montagem.json` e produz os 960
   quadros. Onde a sequência ainda não existe (sem `pronto.json`), entra um cartão cinza com o ID e o
   número do quadro local. Renderize o animático com som já no primeiro dia: é a prova de que os cortes
   caem na batida. O montador roda de novo a qualquer hora e pega o que chegou.
2. **Escolha das fotos.** `heroi`, `p2`, `p3`, `p4` (o `p1` vem do `pronto.json` do `C2e_mergulho`).
   Olhe as fotos de verdade (abra as imagens): verticais, fortes, artistas e cores diferentes entre si,
   rosto inteiro dentro do corte 9:16. A herói é a que aguenta o nome por cima. Grave a escolha em
   `pos/fotos.json` com o motivo de cada uma. Não recolorir.
3. **Trechos dos filmes.** Quatro trechos (13, 13, 6 e 7 quadros): escolha os momentos de mais luz e
   movimento, de filmes diferentes; os horizontais entram em corte central 9:16 (confira que o assunto
   cabe). Converta 24 → 30 qps sem duplicar quadro de forma visível (trechos curtos: pegue o quadro mais
   próximo).
4. **A luz** (abaixo).
5. **Som e MP4.**
6. **Revisão.**

## A luz (o coração do seu trabalho)

Trabalhe em ponto flutuante, em luz linear (decodifique o sRGB, opere, recodifique), pra o flash estourar
como luz e não como "brilho +50".

- **Laboratório (seção A e o começo da B).** O passe `fio` vira luz vermelha de laboratório fotográfico:
  vermelho profundo de palco sobre preto, com um halo suave (a linha "acende"). Em cada batida de 0 a 15
  a linha pulsa (sobe uns 40% e cai em 6 a 8 quadros). Com o `prof` do A1/B1, a linha perde força com a
  distância. É a única parte monocromática do filme, e nela não aparece foto nenhuma.
- **Revelação (seção B).** `B1_travessia` chega nos três passes com a mesma câmera. Começa 100% linha
  vermelha e vai sendo revelado **por degraus, no ritmo da caixa**: um degrau por batida (16 a 19), por
  oitava (20 a 23), por semicolcheia (24 a 27); na batida 28 está tudo revelado. Cada degrau revela mais
  uma região, e a região revelada entra como foto no revelador: estourada e sem contraste por 3 ou 4
  quadros, e assenta. A máscara tem que ser **do mundo, não da tela**: use o `prof` (por exemplo, a
  revelação avança em fatias de distância, ou em manchas que grudam nas superfícies e andam com a câmera
  quadro a quadro). Mancha de ruído parada na tela não serve. Das batidas 28 a 30: tudo revelado, com
  um flash curto a cada semicolcheia. Respiro [425, 436): a imagem apaga em 2 quadros e fica só a
  **pós-imagem** (o último quadro como mancha de retina: borrada, em negativo ou em complementar,
  morrendo exponencialmente até o preto).
- **Flash (seção C).** Em todo corte da seção C acende um flash de câmera. Com `prof`: o ganho cai com o
  quadrado da distância (perto estoura, o fundo do corredor fica escuro), com uma vinheta leve de
  refletor, e morre em 4 a 6 quadros (pico no primeiro quadro do plano, nunca antes do corte). Sem
  `prof` (fotos, filmes, gráficos): ganho uniforme, mais curto (3 quadros). Forte nas cabeças de
  compasso, médio nas outras (lista em `montagem.json`). **Nunca um quadro branco chapado**: o estouro
  preserva alguma forma. A frequência de flash fica na batida (2,2 por segundo); nada de estrobo mais
  rápido que isso com tela cheia, salvo o trecho das batidas 28 a 30, que deve ser bem mais fraco.
- **Raio X.** Nos planos `C5`, nos quadros de `montagem.json → raio_x`, por 2 quadros a estrutura pisca:
  o passe `fio` em vermelho somado por cima da imagem escurecida.
- **Fotos em tela cheia.** Corte `cover` 9:16 escolhido olhando a foto (não cortar rosto). Cada uma tem
  movimento: um avanço lento, e a direção do movimento continua de uma foto pra seguinte. A `p1` começa
  no mesmo enquadramento em que o `C2e_mergulho` termina.
- **Segundo respiro [855, 866).** O `C7` já entrega o escuro; você acrescenta a pós-imagem da porta.
- **Acabamento.** Grão fino de filme por cima de tudo (animado, discreto), mais forte na seção A. Nada
  de vinheta pesada, aberração cromática ou tremor de câmera falso.

## Som

`audio/musica.wav` do zero. Corta no quadro 920 (30,666 s), exatamente na batida 68, e sai com uma cauda
curta (eco ou reverb do último meio segundo, morrendo até o quadro 959). Pico máximo de -1 dBTP. Sem
normalizar a dinâmica da faixa. O arquivo vai em `audio/trilha-final.wav`.

## MP4

H.264 High, yuv420p, 1080×1920, 30 qps constante, CRF 16, `-preset slow`, `+faststart`, bt709 marcado;
AAC 320 kb/s. Escreva os quadros direto num pipe pro ffmpeg (não precisa gravar 960 PNGs).

## Revisão (pra direção olhar)

Em `saida/revisao/`:
- `cortes.jpg`: pra cada corte, o último quadro antes e o primeiro depois, lado a lado, com o número do
  quadro e a batida.
- `batidas-A.jpg`, `-B.jpg`, `-C1.jpg`, `-C2.jpg`, `-D.jpg`: um quadro por batida (o primeiro de cada).
- `flash.jpg`: os 6 primeiros quadros de três flashes diferentes (pra ver a queda).
- `revelacao.jpg`: 12 quadros da seção B.
- `sincronia.txt`: conferência automática de que os picos de luz caem no quadro da batida (tolerância:
  0 quadro) e de que o som do MP4 começa em 0 e tem a duração certa.

Abra essas folhas e olhe antes de entregar. Cada folha com no máximo 2400 px no lado maior.

## Critérios de pronto

- 960 quadros, 32,0 s, som em sincronia (a batida 32 do som cai no quadro 436).
- Nenhum cartão cinza no filme final (se algum plano não chegou, diga qual e o que pôs no lugar).
- Rodar `python pos/montar.py` de novo reproduz o mesmo arquivo.
- O filme inteiro monta em tempo razoável (menos de 15 min); se a luz ficar pesada, vetorize em numpy.
