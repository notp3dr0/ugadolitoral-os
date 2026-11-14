# REVIEW · Pode rodar? (animatic v1, 2026-11-06)

## Decisões de criação
- Segui o storyboard em PDF quadro a quadro (frames, textos, locução). Não fiz storylines alternativas:
  o roteiro já veio fechado.
- **A roda é um arquivo só** (`assets/peca/roda.svg`), desenhado já na pose do f042 (rotação 0).
  Toda cena monta a mesma "peça" (fundo, faixas, riscos, garfo, roda) e só muda escala e recorte;
  o recorte vertical centra no cubo da roda. O marcador claro no aro confere a pose.
- Cada cena começa no quadro final da anterior (as fichas nascem da tela do player, a ficha de TV
  cresce até virar o player, o player encolhe até a miniatura, as miniaturas abrem nas três telas).
- **Trilha:** a música tem um respiro próprio aos 17,68 s. A abertura usa o compasso antes dele e corta
  seco no f042; o drop dela (18,54 s) cai no f1026; aos 38,6 s emenda no compasso com o final da
  música, cuja última nota cai na assinatura. No miolo, uma cama sem bateria (escolha minha, não está
  no PDF) que some antes do contato pra deixar o impacto entrar no silêncio.
- **Q04** ganhou um "folhear" das três fichas durante a fala (estava 4,75 s parada).
- Sem efeito na Q10: o PDF pede só a locução e a nota final da trilha.

## O que foi medido e o que só foi olhado
- `hyperframes check`: ok (0 erro). Avisos que ficaram de propósito: textos que continuam na emenda
  entre cenas (a cópia da cena anterior saindo conta como "linha curta"), sobreposição dos três
  recortes no primeiro meio segundo da Q03 (estão empilhados de propósito).
- Folhas de revisão e emendas olhadas; o contato foi conferido frame a frame (f1019 a f1030): roda
  congelada até f1019, retoma no f1020, encosta no f1026 nas três telas, respingo junto.
- Áudio medido, **não ouvido**: no MP4 final, -14,4 LUFS integrado, pico -1,0 dBTP, sem clip. Silêncio de 1,405 s a 2,375 s (o som corta no congelamento) e de 33,75 s a 34,02 s (o respiro antes do contato); o impacto entra em 34,26 s. Os stems em `audio/stems/` são a mesma mixagem feita no ffmpeg (-17,2 LUFS), pra edição fora daqui.
- A locução foi transcrita de volta (Parakeet) e as palavras batem, inclusive "XR", "streaming", "TV",
  "closed caption" e "Extreme Reach". Sotaque e naturalidade: só ouvindo.

## Mais fraco / o que eu faria com mais tempo
- A voz do VoiceStudio (clonada de uma voz desenhada) é guia de animatic: vale ouvir e, pra versão
  final, trocar por voz de locutor ou ElevenLabs.
- A água ainda é simples (leque + gotas). Dá pra desenhar uma coroa de respingo mais rica no f1026.
- Q07: as rotas podiam ter curva; hoje são retas.
- Motion blur no giro da roda (Q01 e Q08) ficaria mais bonito; deixei desligado no animatic pelo custo de render.

## Avisos mantidos
- `duplicate_media_discovery_risk`: a mesma peça aparece em três telas ao mesmo tempo, de propósito.
