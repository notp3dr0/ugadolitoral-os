# Showreel no Blender · leia primeiro

Plano escrito pelo Fable 5.2 em 2026-11-15, pra o Opus executar. Leia este arquivo e depois **só o
arquivo da etapa da vez** em `plano/`. Uma etapa por vez; cada uma termina com o Pedro olhando.

## O que é

O showreel de lançamento do portfólio (`../PLANO.md`, v2 aprovada em `../saida/showreel-v2.mp4`) foi
filmado dentro do motor do site, que é feito pra celular: material chapado, sem sombra, sem luz de
verdade. O flash e a profundidade foram simulados depois em Python. Agora o mesmo filme ganha **luz
física**: o corredor é reconstruído no Blender a partir dos dados do site e renderizado como cinema.

O filme não muda: mesma música, mesma grade de batidas (`../tempo.json`), mesma montagem
(`../montagem.json`), mesma ideia (LUZ DE SEGURANÇA). O que muda é de onde vêm os quadros do corredor.
E sai em **dois formatos: vertical 1080×1920 e horizontal 1920×1080**, da mesma cena, com duas câmeras.

## Decisões já tomadas (não reabrir)

- **O que já foi aprovado pelo Pedro fica:** a estrutura da v2, os cortes, a música abafada, o showreel
  do site, a grade do acervo, o AGENDA ABERTA. Ele disse "gostei muito de tudo".
- **Fotos e filmes são dele:** entram como textura, sem recolorir, sem gerar imagem por IA. O Blender dá
  corpo ao cenário em volta das fotos; não fabrica show, artista nem gente realista. Gente continua
  sendo silhueta.
- **Movimento:** fluido, câmera sempre andando, corte carrega o movimento. Cortes no quadro exato.
- **Sem Remotion, sem HyperFrames, sem repertório de outros projetos de vídeo do repositório.**
- **O site (`portfolio/site-lab/`) é só leitura.** Nada de commit, push ou deploy.
- **A v1 e a v2 não são sobrescritas.** Tudo novo sai com sufixo: `quadros/<ID>_bl/` (vertical),
  `quadros/<ID>_blh/` (horizontal), `saida/showreel-v3-vertical.mp4`, `saida/showreel-v3-horizontal.mp4`.

## O que existe e foi testado nesta máquina (2026-11-15)

- **Blender 5.3** em `C:\Program Files\Blender Foundation\Blender 5.3\blender.exe`. Roda sem tela:
  `blender.exe -b --python script.py -- argumentos`.
- **Placa:** GTX 1660 Super, 6 GB. O Cycles enxerga por CUDA e por OptiX. Teste em `teste_placa.py`
  (corredor simples, 1080×1920): EEVEE 11,6 s, Cycles 64 amostras com redução de ruído 13,6 s (CUDA) e
  18,4 s (OptiX), **incluindo o arranque do Blender**. O tempo por quadro numa sequência é menor; meça.
- **Disco:** 28 GB livres em C:. Sequências em JPG/PNG de 8 bits; EXR só onde precisar e apagando depois.
- **O arreio de câmera do site:** `../captura/` (`planos.js` tem a pose de cada plano em função do
  tempo; `pagina.js` e `filmar.mjs` abrem o motor). O motor expõe `window.__bastidor` (`plan`, `world`).
- **O laboratório:** `../pos/montar.py` monta o filme a partir de `quadros/<ID>/<passe>/` e
  `montagem.json`. Passes: `cor` (JPG), `fio` (JPG cinza), `prof` (PNG 16 bits em RG, 0 a 30 m).

## Orçamento de render (o limite real deste trabalho)

O filme tem 960 quadros; uns 560 são de corredor 3D. Em dois formatos, são uns 1.100 quadros de Blender.
A 10 s por quadro, 3 horas de máquina; a 60 s, 19 horas. Por isso:

- **Teto: 20 s por quadro em média**, medido, na resolução final. Estourou, simplifique (menos amostras
  com redução de ruído, menos volume, luz mais simples) antes de pedir mais tempo.
- Compare EEVEE e Cycles na etapa 1 e **escolha um motor só** pra o filme inteiro, mostrando ao Pedro o
  mesmo quadro nos dois, com o tempo de cada.
- Render longo roda em segundo plano, por faixas de quadros que dá pra retomar (não refazer o que já
  existe em disco), com um registro de progresso em arquivo.
- Sempre um quadro parado aprovado antes de renderizar a sequência.

## As etapas

| etapa | arquivo | entrega | quem olha |
|---|---|---|---|
| 1 | `plano/etapa-1-corredor.md` | o corredor do site reconstruído no Blender, com luz; 4 quadros parados nos dois formatos | Pedro escolhe o motor e o clima |
| 2 | `plano/etapa-2-porta.md` | o plano-teste: a corrida até a porta do PALCO, nos dois formatos, lado a lado com a atual | Pedro decide se segue |
| 3 | `plano/etapa-3-filme.md` | todos os planos de corredor, o laboratório e o palco; v3 vertical montada | Pedro revisa a v3 vertical |
| 4 | `plano/etapa-4-horizontal.md` | a v3 horizontal completa (site, acervo, cartela, fotos e filmes recompostos) | Pedro revisa a v3 horizontal |

**A etapa 2 é um portão.** Se o Pedro não achar que o Blender melhorou, para ali e a v2 continua sendo
o filme. Não renderize o filme inteiro antes desse sim.

## Como trabalhar

- Scripts em `blender/` (Python do Blender e Node), versionáveis e reexecutáveis: rodar de novo dá o
  mesmo resultado. Nada feito à mão na interface.
- A cena é **gerada por script a partir dos dados do site**, não modelada à mão: se o acervo mudar,
  roda de novo.
- Antes de dizer que está pronto: abrir a imagem e olhar. Sem olhar, dizer "não conferi".
- Ao fim de cada etapa: uma linha em `blender/andamento.md` (data, o que entregou, tempos medidos, o que
  desviou do plano e por quê) e parar pro Pedro olhar.
- Falhou alguma coisa: dizer o que aconteceu, o que continua seguro e o próximo passo.
