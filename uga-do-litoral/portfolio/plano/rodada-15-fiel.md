# Rodada 15 · o corredor do filme no site (matéria) e o elenco

Feito pelo Opus em 2026-11-18, a pedido do Pedro: "as texturas do bastidor e dos quadros iguais às do vídeo" e
"personagens característicos, não um boneco articulado". Antes de mexer, pesquisa aprofundada:
`reports/Bastidor fiel ao vídeo.md` (notas em `research_notes/Bastidor fiel ao vídeo/`).

## Matéria (liga com `?luz=blender`; `&materia=0` volta só pra luz da rodada 13)

- **Concreto de fôrma e piso polido do filme.** `showreel/blender/bake_texturas.py` assa a COR do mesmo material
  do Blender (painéis 2,4 x 1,2 m, emendas, furos de tirante, manchas) em ladrilhos nítidos: parede 4,8 m x 3,3 m em
  2048 x 1408 (427 px/m; o mapa de luz tem 54 px/m e não segura emenda de 6 mm), piso 3,4 m em 1024. Duas (quatro,
  no piso) passadas deslocadas e misturadas no `bake_texturas_pos.py`: o ladrilho emenda sem costura. 35 KB.
  A luz continua sendo o mapa da rodada 13, por cima (UV2).
- **Fotos como papel colado.** O papel e a fita gaffer (12 x 3,5 cm, como no filme) recebem a luz pintada da parede
  (lida do próprio mapa na CPU, uma vez); a foto NÃO recebe luz (a cor é do fotógrafo). Cada cópia ganha sombra macia.
- **Piso que reflete (reflexo falso).** Embaixo do piso, uma malha instanciada espelha a cor média de cada foto, o
  cone de cada refletor e as lâmpadas vermelhas; o piso deixa ver um pouco (mais onde é polido, menos onde é fosco,
  pelo mapa de rugosidade do próprio material). Uma chamada de desenho.
- **Régua:** `ferramentas/fiel.mjs` tira o site em 4 pontos e grava a pose da câmera; o `render.py` do showreel
  renderiza o MESMO quadro (`--plano REF_site`); `ferramentas/lado_a_lado.py` monta a comparação e mede o brilho.
  Parede: site 27 x Blender 24; piso: 17 x 21 (o resto é o brilho especular do Cycles).

## Elenco (liga com `?gente=elenco`)

- Base CC0 (Quaternius Universal Base Characters + Universal Animation Library): corpo de gente, esqueleto de 65
  ossos, animação de verdade (parado respirando, andando). Mixamo e Synty ficaram de fora (licença não deixa
  distribuir o arquivo, e no site o arquivo é baixável).
- `portfolio/elenco/personagens.py` (Blender, por script): cabeça vira oval lisa de manequim (sem rosto), a roupa
  é a própria pele alisada e inflada por região (camiseta, calça, bota), e cada função ganha o que a pesquisa diz
  que a faz ser lida de longe:
  - **segurança:** porte largo, camiseta preta com SEGURANÇA amarelo nas costas (e pequeno no peito), fone com
    fio espiral, cinto com rádio e antena, bota; poses braço cruzado e mão no ouvido (rádio).
  - **produtora:** headset de um ouvido com microfone, prancheta com a lista, cordão vermelho e crachá ALL ACCESS,
    rádio, PRODUÇÃO nas costas.
  - **staff da foto:** crachá STAFF, STAFF nas costas, tênis claro; pose braço no alto e mão na cintura.
  - **artista:** moletom largo, capuz caído pra trás (o rosto some), corrente prateada, tênis grosso claro.
  - **equipe:** boné, STAFF nas costas, luva, fita gaffer e mosquetão no cinto.
- Poses resolvidas por cinemática inversa no Blender e exportadas como animação de braço; no site, o "parado" toca
  sem os ossos que a pose manda, e o "andando" entra por cima quando a pessoa se move. A cabeça acompanha a câmera.
- Peso: 735 KB os seis `.glb` (meshopt), 20 KB o atlas, ~175 KB de biblioteca (GLTFLoader etc., vendorizada).
  Só baixa quem usa o elenco. Uma chamada de desenho por pessoa.
- Montagem: `python atlas.py` → `blender -b --python personagens.py [-- --previa]` → `gltf-transform resample` e
  `meshopt` em cada `.glb` (ver `portfolio/elenco/LEIA.md`).

## Testes (2026-11-18)

- `EXTRA="&gente=elenco&luz=blender" node encontros.mjs`: todos OK, pior caso 88 chamadas (teto 96).
- Sem chave: encontros 19 OK, `rodada12`, `rodada8`, `bastidor` passam.
- `EXTRA=... node medir-bastidor.mjs` (celular simulado): quadro mediano 16,7 ms igual, pior 117 ms (hoje 133),
  +1 MB no download.
