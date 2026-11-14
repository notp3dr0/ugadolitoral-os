---
name: biblia-serie
description: Mantém a "bíblia" de uma série narrativa em episódios (um dia por vídeo, com o público votando no fim): linha do tempo de cada episódio, onde cada personagem está, objetos e portas em jogo, regras acumuladas e a escolha que o público fez. Antes de escrever o próximo episódio, lê a bíblia e todos os roteiros anteriores e procura furo de continuidade; depois de aprovar, atualiza a bíblia. Use sempre que o Pedro for escrever, revisar ou planejar episódio de uma série narrativa, falar em "continuidade", "bíblia da série", "furo de roteiro", "próximo episódio", "o público votou", ou abrir uma série nova, mesmo sem dizer "skill".
---

# Bíblia da série

Série em que o público decide o rumo tem um problema: **o público lembra de tudo.** Se no dia 3 a corrente ficou por dentro da porta, no dia 10 ninguém pode tirá-la pelo lado de fora. Alguém vai comentar, e comentário de furo mata a confiança na série.

A bíblia é um arquivo vivo na pasta da série. Quem a lê e atualiza é este fluxo, não a memória da conversa.

## Onde mora

Na pasta da série, dentro de `canal-dark/series/<serie>/`. Estrutura:

```
canal-dark/series/<serie>/
├── biblia.md            # a bíblia (fonte de verdade da continuidade)
├── episodios/
│   ├── ep01/roteiro.md
│   └── ...
└── votacao.md           # opções oferecidas e o que o público escolheu, por episódio
```

## Formato da `biblia.md`

```markdown
# Bíblia — <série>

## Premissa e voz
<premissa em 3 linhas, pessoa narrativa (ex.: segunda pessoa, "você"), tom>

## Elenco
| Personagem | Quem é | Estado atual | Última aparição |

## Lugares e objetos que importam
| Item | Estado (porta, corrente, gerador, luz, arma...) | Desde o EP |

## Regras da série (acumulam, nunca somem)
1. <regra> — nasceu no EP xx, por quê

## Linha do tempo
- EP01 (Dia 1, 03:17): <o que aconteceu, quem estava onde, o que mudou>

## Votação
- EP01: opções A / B, venceu <X>, consequência <Y>

## Furos já pegos (viram regra)
```

## Fluxo antes de cada episódio

1. Ler `biblia.md` inteira e os roteiros anteriores (não confiar em resumo antigo).
2. Aplicar a escolha vencedora da votação do episódio anterior. Se ainda não tem, **perguntar**; não inventar o resultado.
3. Escrever (ou receber) o roteiro do próximo dia.
4. **Caçar furo**, item por item, e listar o que achou:
   - alguém em lugar onde não podia estar naquele momento;
   - objeto que mudou de estado sem motivo (porta trancada que abre, corrente que some);
   - regra anterior quebrada sem consequência;
   - informação que um personagem usa antes de saber;
   - relógio e dia que não fecham;
   - escolha do público ignorada.
5. Entregar o roteiro com a lista de furos, resolvidos ou pendentes. Nada vai pra produção com furo aberto.
6. Depois da aprovação do Pedro, atualizar elenco, objetos, regra nova do episódio, linha do tempo e votação.

## Regras

- **Uma regra nova por episódio**, curta e testável (ex.: "quando a luz apagar, nenhum barulho"). Ela vira ferramenta de susto e de comentário.
- Nunca editar o passado: se um furo for achado depois, registrar em "Furos já pegos" e consertar no roteiro futuro (ou, se já publicou, decidir com o Pedro se vale a correção).
- Um dia por vídeo. Episódio com vários dias não se mede nem se vota bem.
- A bíblia guarda fatos da história, não estilo visual (isso é do manual de produção e da skill `estudar-referencia-video`).
- Data absoluta e número do episódio em toda entrada.
