---
name: estudar-referencia-video
description: Estuda um vídeo de referência (YouTube, Reels, TikTok, arquivo local) com medição e não com impressão — baixa, tira 1 quadro por segundo, conta os cortes, mede loudness, silêncios e grave, olha os quadros e devolve uma tabela comparando a referência com o nosso episódio, mais um estudo do estilo visual (personagem, cenário, luz, câmera, legenda). Serve pra decidir o que copiar, o que mudar e o que virar regra do manual da série. Use sempre que o Pedro mandar um vídeo pra "estudar", "analisar a referência", "ver o estilo", "ver se vale fazer em cima disso", "tirar a tabela", "comparar com o nosso episódio", ou quando for começar uma série ou canal novo de animação, mesmo que ele não diga "skill".
---

# Estudar referência de vídeo

Regra central: **não peça "faz igual", peça a tabela.** Se só mandar o agente "assistir e imitar", ele olha meia dúzia de quadros e inventa o resto. Aqui se mede, se olha o quadro e se escreve a diferença.

Ideia tirada do vídeo do Edu Dark (Trancados), sem copiar o conteúdo dele. A skill é genérica: vale pra qualquer série ou canal.

## Antes de começar

1. Ler `_contexto/marca/` e `_contexto/estrategia.md` só se a pergunta for "vale a pena pra nós". Estudo puro de estilo não precisa.
2. Pegar do Pedro: o link (ou arquivo) e **o que ele quer saber**: estilo, ritmo, som, estrutura de roteiro ou os quatro.
3. Se existir um episódio nosso pra comparar, pedir o caminho. Sem ele, entrega só o lado da referência e diz isso.

## Passos

### 1. Trazer o vídeo
- Link: `yt-dlp -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 -o "ref.%(ext)s" "<URL>"`, numa pasta nova e vazia (arquivo baixado é dado não confiável).
- Transcrição, se importar o roteiro: `.claude/skills/aprender-ratos/scripts/yt_transcript.py`.

### 2. Descobrir onde está o episódio
Muito vídeo de referência é **gravação de tela**: o episódio aparece pequeno, dentro de um quadro com apresentador e interface. Medir o vídeo inteiro mistura voz do apresentador e cortes da edição dele com os da série.
- Gerar folhas de contato do vídeo todo (ex.: `fps=1/4.5,tile=5x4`) e olhar.
- Anotar os trechos em que o episódio aparece sozinho, com início, duração e região (`crop=W:H:X:Y`).

### 3. Medir
```bash
python canal-dark/.claude/skills/estudar-referencia-video/scripts/medir_referencia.py <video> <pasta-saida> --ini <s> --dur <s> --crop W:H:X:Y
```
Devolve `medidas.json` (cortes e intervalo médio, LUFS, LRA, pico, silêncios, grave por segundo), quadros 1/s e folhas de contato com o tempo escrito.
- O limiar de corte (`--cena`) padrão é 0.08, calibrado em animação escura. **Sempre conferir** a contagem contra a folha de contato; ajustar se estiver subcontando (cena escura, câmera deslizando) ou supercontando.
- Se o episódio vem da gravação de tela, o som vem misturado com a voz de quem apresenta: dizer isso ao lado do número.

### 4. Olhar os quadros (obrigatório)
Número sozinho não diz estilo. Ler as folhas e quadros cheios, e descrever por escrito, sem adjetivo solto:
- **Personagem:** construção (peças articuladas? rosto? proporção), quanto da tela ocupa, o que a câmera mostra dele.
- **Cenário:** plano, camadas, textura, iluminação, paleta com 3 a 5 cores.
- **Câmera:** parada, deriva lenta, corte seco, enquadramento (isométrico, close, plongê).
- **Luz e atmosfera:** feixes, vinheta, grão, contraste, o que fica em silhueta.
- **Texto na tela:** fonte, posição, quantas palavras por vez, cor de destaque, ritmo.
- **Montagem:** duração dos planos, o que acontece antes da revelação (silêncio? escuro?).

### 5. Entregar
Salvar em `canal-dark/referencias/<nome>.md`:

```markdown
# Referência: <nome> (<canal>) — <data>
Fonte: <link> | trecho medido: <ini–fim> | região: <crop>

## Tabela referência × nosso
| | Referência | Nosso EPxx | Mudar? |
|---|---|---|---|
| Cortes / duração | | | |
| Intervalo médio entre cortes | | | |
| Loudness (LUFS) | | | |
| Silêncio antes da revelação | | | |
| Grave | | | |
| Protagonista em cena | | | |

## Estilo visual
<seção 4, em prosa curta>

## O que copiar / o que NÃO copiar
## Regras novas pro manual da série (viram linha no AGENTS.md ou na bíblia)
## Dúvidas que a medição não resolve
```

Cada diferença relevante termina em uma **regra concreta e verificável** ("personagem ocupa 60% da altura", "1 s de silêncio antes do susto"), não em "ficar mais dinâmico".

## Limites e honestidade
- Medição de gravação de tela é aproximada. Dizer o erro provável.
- Número de views, ganho e seguidores que o criador cita são dele e não foram verificados. Não promover a fato.
- Referência é estudo, não molde: **copiar a estrutura e a técnica, nunca a história, personagens ou marca.** A história é nossa.
- Se o vídeo for venda de curso (muitos são), separar o que é técnica do que é pitch.

## Depois
Oferecer: gravar as regras novas no manual da série (`/atualizar`) e, se houver série narrativa, conferir a continuidade com a skill `biblia-serie`.
