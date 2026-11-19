# Rodada 14 · a gente do bastidor ganha corpo

Escrito pelo Opus em 2026-11-17. Leia o `LEIA-PRIMEIRO.md` antes. **Depende de uma escolha do Pedro**
(o estilo, abaixo); sem ela, não começar.

## Como é hoje

`bastidor/people.js`: cada pessoa é um recorte 2D desenhado em `<canvas>` (preto chapado, fio de luz na
borda, clarão atrás) num plano que vira pra câmera. Poses: segurança (e segurança no rádio), produtor,
staff fotografando, artista e grupo do camarim (`bastidor/scenes.js`). Regras que ficam: **sem rosto, nada
gerado por IA, ninguém imitando pessoa real**.

O problema: chegando perto ou de lado, o recorte vira papel. Não tem volume, não respira, não vira a cabeça.

## O estilo (escolha do Pedro)

1. **Silhueta 3D** (recomendado): corpo modelado de verdade, preto fosco, com a luz de borda do palco
   desenhando o contorno. Visto de qualquer ângulo é gente, mas continua sem rosto e sem cor de roupa:
   conversa com a linguagem de hoje e com o showreel.
2. **Manequim estilizado:** corpo com roupa (colete do segurança, jaqueta, fone), cores escuras, rosto liso.
   Mais personagem, mais trabalho de modelagem, mais peso.
3. **Realista:** fora, pela regra do showreel (não fabricar gente realista) e pelo peso no celular.

## Passos (estilo 1 ou 2)

1. **Modelar no Blender por script** (`blender/gente.py`): um corpo base low-poly (~3 a 5 mil triângulos)
   com esqueleto simples; variações por pessoa (porte do segurança, prancheta e rádio do produtor, câmera
   do staff, boné/capuz do artista). Acessórios são peças separadas.
2. **Animação curta em loop**, feita no Blender: respirar e pesar o corpo (todos), mão no ouvido (segurança
   no rádio), virar a cabeça pra quem chega, levantar a câmera e disparar (staff). 2 a 4 s cada.
3. **Exportar** um `.glb` com todas as pessoas e animações (Draco ou meshopt), meta ≤ 600 KB.
4. **No site:** `people.js` passa a devolver o modelo 3D com `AnimationMixer`; a interface (`person`,
   `setPose`, `expose`) continua igual, pra `scenes.js` quase não mudar. A luz de borda vem de um
   material com fresnel (rim) no shader, sem luz dinâmica. O recorte 2D fica como reserva pra quando o
   aparelho estiver no degrau de economia (`world.degrade`).
5. **Testar** com `ferramentas/encontros.mjs` (cada encontro, um a um) e prints de frente, de lado e de
   perto de cada pessoa.

## Critérios

- De lado e de perto continua sendo gente (print de 3 ângulos por pessoa).
- Celular simulado: quadro pior não piora mais que 10 % num encontro.
- `encontros.mjs`, `bastidor.mjs` e `rodada8.mjs` passam.

## Como foi feito (2026-11-17, Opus) · o Pedro escolheu **manequim estilizado**

Desvio do plano: o manequim é **montado em código** (`bastidor/manequim.js`), não modelado no Blender. Pesa
quase nada (sem download), as poses são juntas de verdade e dá pra ajustar olhando print.

- Corpo articulado (quadril, peito, pescoço, cabeça lisa, ombro/cotovelo/mão, coxa/joelho/pé), cinza quente
  fosco; roupa por tipo: segurança (colete escuro com duas faixas refletivas, SEGURANÇA nas costas e no peito,
  fone com fio), produtor (headset, prancheta, rádio na cintura), staff da foto (crachá com cordão vermelho,
  tênis claro), artista (moletom com capuz, tênis claro), equipe (boné, STAFF nas costas).
- Material próprio: cor chapada + luz de cima + fio de borda (fresnel) tingido pelo `glow` de cada encontro;
  neblina do corredor vale; o flash estoura a pessoa inteira.
- Poses resolvidas pela posição da mão (busca numérica): braços cruzados, mão na orelha (rádio), prancheta,
  mão na cintura, braço no alto. Respira, a cabeça acompanha a câmera (até 60°), o corpo vira se a pessoa
  passa muito pro lado, e quem é movido anda (passo e balanço de braço) virado pro rumo.
- `people.js` decide: `?gente=manequim` usa o manequim; sem a chave, o recorte 2D de antes. A interface
  (`person`, `animatePerson`, `expose`, `setPose`, `userData.cut.material.opacity`) é a mesma: `scenes.js`
  não mudou.
- Teste: `ferramentas/gente.mjs` (fila dos seis de frente, 3/4, lado, costas e de perto, em `saida/gente/`);
  `EXTRA="&gente=manequim&luz=blender" node encontros.mjs` roda os encontros com o manequim.
