# Filme do PAÓ · plano de produção (v1, 2026-11-02)

Fontes: prancha `referencias/storyboard.png` (ordem da grade, Q01–Q90), personagem `referencias/pao-mapa-identidade.png`,
vídeo de referência "Duo's Work Day" (estudado com o Reanimate; medidas em `.reanimate/duo-workday/spec.md`, fora do git).

## Decisões do Pedro (2026-11-02)
- Linguagem 2D gráfica (a prancha tem cara de 3D, mas o filme é 2D).
- Textos novos, escritos aqui; a prancha é só guia.
- Forma vermelha grande (Q59–62) = o botão a ser apertado. Formas escuras (Q68–69) = índices de engajamento apagados antes do botão.
- Baús (Q24) ficam: o PAÓ indo atrás de algo que ajude o cliente a ter engajamento.
- Timestamps da prancha não valem; a duração sai do ritmo do original.
- Pode ficar bem parecido com o original, principalmente nos efeitos sonoros. Trilha segue o vídeo de referência.
- Dois formatos: 16:9 e 9:16.
- Final sem a logo em lettering: algo bonito, escolhido aqui (proposta abaixo).
- Ferramentas: Remotion (motor), Reanimate (medir e comparar), VoiceStudio (sons vocais do PAÓ).

## Textos (proposta)
- Chat 1, digitando e apagando: "Oi, eu sou o PAÓ! Post novo saindo do forno" → apaga → "Oi, eu sou o PAÓ. Fiz esse com carinho. Vem ver?"
- Chat 2, depois do post fraco: "O post não bombou…" → "…mas amanhã tem outro. Bora de novo!"
- Frases finais, nesta ordem: "para quem ama o que faz." / "independente do engajamento"

## Final (proposta, sem lettering)
O PAÓ, chorando de alegria, abre as asas e voa na direção da câmera. O corpo carvão cobre a tela inteira e sobram só os
dois olhos de anel vermelho, centralizados. Eles piscam uma vez (piscada medida), depois piscam de novo e fecham no ∩ do
"feliz". Um coraçãozinho acende no reflexo da pupila antes do fecho. Fade pro bege #F2E5D5. São os três últimos quadros
da prancha (Q88–90), sem a palavra PAÓ.

## Planos (ordem da grade)
| # | Q | o que acontece | câmera |
|---|---|---|---|
| 1 | 01–02 | PAÓ atrás do notebook digitando no escuro | PM fixo, balanço da digitação |
| 2 | 03–06 | Chat 1 digita, apaga, reescreve | insert, aproximação |
| 3 | 07–08 | PAÓ de perfil digitando rápido, sem piscar | PM perfil |
| 4 | 09–10 | Pedestal no escuro: luzes acendem, painéis de métricas abrem | PG, aproximação |
| 5 | 11–13 | Tigela com ♥ 💬 gráfico ↗ flutuando | órbita lenta |
| 6 | 14 | Olhos do PAÓ, pupila dilata | ECU |
| 7 | 15 | Notificações das redes (♥12 💬8 ↗1) no lugar do XP | insert, parallax |
| 8 | 16–17 | Torre com notas musicais subindo | sobe pela torre |
| 9 | 18–20 | Sala laranja de ícones; um balão apagado | PG → órbita |
| 10 | 21–22 | Asa no bico, preocupado | CU → PG |
| 11 | 23 | Post inicial ♥2 💬0 ↗0 | insert |
| 12 | 24 | Baús: atrás de algo que ajude o engajamento | PG |
| 13 | 25–26 | Por cima do ombro → primeira apertada do botão vermelho | OTS → insert |
| 14 | 27–28 | Chat 2 | insert |
| 15 | 29–34 | PAÓ vai até o balão cinza; post fraco do lado | PM → PG |
| 16 | 35–36 | Laboratório lilás, PAÓ correndo | travelling |
| 17 | 37–43 | Painel de likes, asa na plataforma, ECU, POSTAR | inserts rápidos |
| 18 | 44–46 | Balão segue apagado | PM, órbita |
| 19 | 47–50 | Olhar cansado com reflexo; botão; rosto espremido | ECU → PG |
| 20 | 51–56 | Montagem: lâmpada-coração, player, painéis, POSTAR de novo | cortes rápidos |
| 21 | 57–58 | Balão continua cinza | — |
| 22 | 59–62 | Botão gigante em primeiro plano, PAÓ pequeno no corredor | PG |
| 23 | 63–66 | Desaba na mesa, óculos/olhar caem | PM |
| 24 | 67 | Apertada pesada no botão | de cima, aproximação brusca |
| 25 | 68–70 | Índices apagados enchem a tela → revela o PAÓ de frente | — |
| 26 | 71–74 | Corpo inteiro; corações começam a surgir | CU → costas |
| 27 | 75–77 | Celular: ♥1,2 mil → 4,9 mil → 12,8 mil | insert |
| 28 | 78–81 | Ícones acendem; PAÓ chora de alegria | PM → CU |
| 29 | 82–83 | Balão principal acende (a virada) | PG |
| 30 | 84 | Lágrimas, de perto | ECU |
| 31 | 85 | "para quem ama o que faz." | — |
| 32 | 86 | "independente do engajamento" | — |
| 33 | 87–90 | Parede acesa → final sem lettering (acima) | — |

Duração alvo: ~88 s.

## Piloto (8 s) · feito em 2026-11-02
`piloto/piloto-16x9.mp4` e `piloto/piloto-9x16.mp4`. Três planos: leitura do post (olhar, piscada, meia pálpebra, "hm"),
insert do botão (preparação, golpe, contato, segunda apertada) e a virada (balão segura apagado, acende, a sala acende
em onda, o PAÓ agacha, pula e fecha no "feliz"). Sons sintetizados e provisórios (`remotion/scripts/sfx.py`).

## Pendente pro filme completo
- Trilha: original, com o desenho de energia da referência (não dá pra usar a música da Duolingo).
- Sons vocais do PAÓ ("hm", piado, choro feliz) no VoiceStudio.
- Fonte da marca PAÓ pros chats e frases (ainda não definida; no piloto, Segoe UI).
