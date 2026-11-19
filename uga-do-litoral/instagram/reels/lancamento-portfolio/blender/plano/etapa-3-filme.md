# Etapa 3 · O filme inteiro, vertical (v3)

Pré-requisito: etapa 2 aprovada pelo Pedro. Objetivo: todos os planos de corredor renderizados no
Blender, mais as duas cenas novas que só o Blender permite, e a v3 vertical montada.

Renderize na ordem abaixo. Cada plano: quadro parado olhado antes da sequência, passes `cor` e `prof` no
formato da etapa 2, saída em `../quadros/<ID>_bl/`, câmera exportada do `../captura/planos.js`.

## Planos de corredor (mesma câmera da v2)

| ID | quadros | o que a luz tem que fazer |
|---|---|---|
| `B1_travessia` | 217 | a travessia acelerando; luminárias e reflexos no piso passando; desfoque de movimento do Blender do quadro 108 em diante |
| `C2a`, `C2b`, `C2c`, `C2d`, `C2f`, `C2g` | 18 cada | a cópia de frente: papel com brilho, sombra da borda na parede, a luminária de cima desenhando o concreto. As mesmas fotos da v2 (veja cada `pronto.json`) |
| `C2e_mergulho` | 31 | mergulho até a foto cobrir o quadro no local 26 (corte central); no fim o quadro é a foto, sem luz de cena por cima, pra bater com o arquivo no corte seguinte |
| `C7_porta` | 111 | já feito na etapa 2 |

O `fio` de todos continua sendo o da v2 (a câmera é a mesma). Confira num quadro de cada plano que o
`fio` antigo encaixa no render novo.

## A revelação (seção B) com luz física

Hoje o `B1` começa em linha vermelha e é revelado por manchas. Mantenha o mecanismo do laboratório (ele
foi aprovado), mas agora o que se revela é o render do Blender. Uma melhoria permitida, se couber no
orçamento: renderizar o `B1` também num passe `seg` (o corredor iluminado **só** pela luz vermelha de
segurança, sem as luminárias das cópias), pra a passagem ser linha → corredor sob luz vermelha → corredor
revelado. Se fizer, é um passe a mais em `B1_travessia_bl/seg/` e um modo novo no `montar.py`; mostre o
antes e depois em 12 quadros antes de adotar.

## Duas cenas novas (só existem com o Blender)

Entram **no lugar de tempo que já existe**, sem mexer na grade:

1. **O laboratório como lugar, no fim da seção A.** Hoje [168, 221) é a câmera já dentro do corredor em
   linha vermelha. Proposta: nesses 53 quadros, por baixo da linha (a 30 a 40% no começo, sumindo), o
   corredor real sob luz vermelha de segurança, muito escuro, quase só reflexo no piso. A linha continua
   sendo a protagonista; o corredor só "assombra". Renderize `A1_planta_bl/seg/` pra os quadros 168 a 222.
2. **O palco, depois da porta.** Hoje [855, 866) é preto com pós-imagem. Proposta: do outro lado do vão
   existe o palco vazio antes do show: neblina, um contraluz, o chão de palco. Visível por 6 a 8 quadros
   depois de atravessar, escurecendo até o preto total no quadro 865, pra o AGENDA ABERTA continuar
   entrando do escuro. Sem gente, sem instrumento realista: só espaço e luz.

Cada uma é mostrada ao Pedro em quadros parados antes de entrar. Se ele não quiser, o filme fica como na
v2 naquele trecho.

## O que não vai pro Blender nesta etapa

- A planta se desenhando [0, 168): é desenho técnico, fica como está.
- As fotos em tela cheia, os trechos dos filmes, o showreel do site, o acervo e o AGENDA ABERTA.
- O acervo físico (cópias de papel com física real) fica como opção pra depois: o Pedro aprovou o acervo
  atual, não refaça sem ele pedir.

## Montagem

`../montagem-v3.json`: cópia da v2 com as fontes de corredor apontando pra `_bl`. Saída:
`../saida/showreel-v3-vertical.mp4` e a versão leve (CRF 21). Folhas de revisão em
`../saida/revisao-v3/` (não sobrescreva `../saida/revisao/`).

## Critérios de pronto

- 960 quadros, cortes no quadro exato, som em sincronia (a conferência do `montar.py` passa).
- Cortes entre plano do Blender e material real (fotos, filmes, site) sem salto de brilho ou de cor que
  pareça erro: olhe a folha de cortes.
- Tempo total de render registrado no `andamento.md`.
- v1 e v2 intactas.

## Parar aqui

Mostre a v3 vertical ao Pedro. Linha no `andamento.md`.
