# Pode rodar? · XR Extreme Reach Brasil (exercício da faculdade)

Quem abre esta pasta de dentro do sistema: as regras da raiz continuam valendo. Os gatilhos
abaixo dizem o que ler antes de agir.

## O que é
Filme de 45 s em motion gráfico 2D para a XR Extreme Reach Brasil, feito como exemplo acadêmico,
sem fins lucrativos e sem encomenda da marca. · **Tipo:** projeto interno (estudo)

## Antes de agir
- Pra saber do projeto: `contexto.md` (briefing, fontes, decisões) e `andamento.md` (onde está).
- O filme editável mora em `filme/` (HyperFrames). Ler `filme/REVIEW.md` antes de mudar qualquer coisa.
- Áudio: a fonte única é `filme/audio/faixas.json`; depois de mexer nela, rodar
  `node audio/montar-audio.mjs` dentro de `filme/`.
- Antes de salvar arquivo: a tabela de destinos em `../../AGENTS.md`.

## Regras deste projeto
- O storyboard em PDF (10 quadros, frames exatos) manda no enquadramento, no texto, na locução e no
  tempo. Mudança de frame é decisão do Pedro, não do agente.
- A roda é um vetor só (`filme/assets/peca/roda.svg`). Rotação 0 = pose congelada do f042. Nunca
  desenhar outra roda nem girar o desenho no arquivo: a continuidade depende disso.
- Marca da XR: só o logo oficial do site brasileiro (`filme/assets/marca/`), sem redesenhar.
  É peça de estudo: não publicar como se fosse da XR nem usar comercialmente.
- Fichas técnicas são ilustrativas (o -23,5 LUFS é exemplo do storyboard), não especificação de veículo.
