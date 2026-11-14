# Portfólio · Uga do Litoral

Regras pra qualquer agente que mexa no site do portfólio (ugadolitoral.vercel.app). Valem junto com o
`AGENTS.md` da raiz. Antes de começar, ler também `contexto.md` e `andamento.md` desta pasta.

**Há um plano pronto e aprovado.** Pra executar: ler `plano/LEIA-PRIMEIRO.md` e depois só o arquivo
da rodada da vez (o `andamento.md` diz qual é). As ferramentas de teste estão em `ferramentas/`.

## As duas pastas

| pasta | branch | o que é | pode mexer? |
|---|---|---|---|
| `site/` | `master` | o site **antigo** (até 12/11/2026 era a produção). Hoje é só histórico | **não.** Só leitura, como referência |
| `site-lab/` | `lab` | a versão experimental | **sim.** Todo trabalho acontece aqui |

As duas são o mesmo repositório git (worktree). O que se faz no `site-lab/` não encosta no `site/`.
Se o Pedro gostar, ele decide o merge do `lab` no `master`. Se não gostar, apaga-se o branch e nada
mudou no site de verdade. **Nunca** commitar no `master`, nunca fazer merge sem ele pedir, nunca
fazer deploy de produção.

## Como trabalhar

- Rodadas pequenas, uma por vez. Cada rodada termina com um commit no `lab` (mensagem em português,
  dizendo o que mudou e por quê) e uma linha no `andamento.md`. Assim cada passo dá pra desfazer
  sozinho (`git revert`), sem perder o resto.
- Antes de mexer em algo que já existe, conferir se ele faz parte do "coração" (`contexto.md`). Se
  fizer, melhorar por dentro, nunca tirar ou trocar por outra coisa.
- Coisa grande e nova (ex.: o corredor 3D) entra como **página ou aba separada**, que dá pra ligar e
  desligar, e não por cima da home.
- Ver o resultado: `preview.cmd` nesta pasta abre o site original e o lab lado a lado
  (original em http://localhost:4173, lab em http://localhost:4174). Isso é pro Pedro olhar; o agente
  testa com `ferramentas/` (`fumaca.mjs`, `comparar.mjs`, `medir.mjs`, `foto.mjs`), que sobem e fecham
  o próprio servidor. Testar no tamanho de celular
  (390 px) antes do desktop: o público chega pelo link da bio do Instagram.
- Deploy de prévia na Vercel (URL separada, não produção) só quando o Pedro pedir. O CLI da Vercel
  não está instalado; o conector Vercel do claude.ai está ligado.
- Antes de dizer que funciona: abrir no navegador e olhar. Sem teste, dizer "não testei".

## Restrições técnicas

- Site estático: HTML, CSS e JS puros, sem build. A Vercel serve a pasta como está (`vercel.json`).
  Se uma rodada precisar de build (Vite, por exemplo), propor antes e explicar o ganho.
- Bibliotecas ficam locais em `vendor/` (já tem GSAP, ScrollTrigger, Flip, hls.js). Biblioteca nova
  (three.js, por exemplo) também vai pra `vendor/`, com a licença junto, versão fixa.
- `prefers-reduced-motion` sempre respeitado: quem pede menos movimento recebe o site parado e inteiro.
- Acessibilidade que já existe (skip link, `aria-*`, `sr-only`, `noscript`, teclado na galeria) não
  pode regredir.
- Fotos e filmes são do Pedro: não trocar, cortar, recolorir nem gerar imagem por IA no lugar delas.
- Em texto do site: sem travessão (—), português do Brasil, tom do `_contexto/marca/tom-de-voz.md`.

## Gosto do Pedro em movimento

Fluidez: easing, câmera andando, transição que carrega o movimento. Corte seco só como acento, em um
ou dois momentos. Nada com cara de template ou de "site feito por IA". Autoral e bem executado.
