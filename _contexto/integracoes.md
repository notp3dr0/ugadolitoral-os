<!-- quem alimenta: o /setup semeia na entrevista; o /atualizar acrescenta integração nova, acesso novo ou "não alcanço"; a /faxina confere e pergunta. Lido antes de dizer "não consigo" e ao criar skill. -->
# Integrações

> O que o negócio usa e como o agente alcança cada coisa. **"não ligada" é resposta válida:** é assim
> que o agente sabe que aquilo existe e dá pra ligar, em vez de achar que é impossível.
> Chave nunca fica aqui. Chave mora no `.env` (fora do git) ou no gerenciador de senha; aqui vai só o
> nome da variável. O cardápio do que dá pra ligar está em `sistema/templates/integracoes/catalogo.md`.

| integração | pra quê | como o agente alcança | estado | última checagem |
|---|---|---|---|---|
| GitHub | código dos projetos e este sistema (`notp3dr0/ugadolitoral-os`) | CLI (`gh`, logado como notp3dr0, escopos repo, read:org, gist) | ligada | 2026-10-31 |
| Google Drive | biblioteca de arquivos e assets; as skills usam a pasta MEUS TRABALHOS > FOTOS | MCP (conector do claude.ai) | ligada (pasta lida em 2026-10-31) | 2026-10-31 |
| Gmail | email | MCP (conector do claude.ai) | ligada | 2026-10-31 |
| context7 | documentação atualizada de bibliotecas (React etc.) | MCP (`npx`) | ligada (caiu uma vez na primeira conexão; o pacote roda; rever na próxima sessão) | 2026-10-31 |
| Obsidian | base de conhecimento e documentação | só você, na mão (arquivos Markdown) | não ligada | 2026-10-31 |
| Figma e Figma Make | interfaces, site da PAÓ | só você, na mão | não ligada | 2026-10-31 |
| Adobe (Illustrator, Acrobat) | arquivos de impressão, vetor | só você, na mão | não ligada | 2026-10-31 |
| Canva | assets e design | MCP (conector do claude.ai) | ligada | 2026-10-31 |
| n8n | automações (Let's Tribunal) | MCP (conector do claude.ai da sua conta já aparece conectado) | decidido não usar por enquanto | 2026-10-31 |
| Supabase | banco de dados (Let's Tribunal) | MCP (conector do claude.ai) | ligada | 2026-10-31 |
| Vercel | hospedagem do portfólio, ver e alterar o código | MCP (conector do claude.ai) | ligada | 2026-10-31 |
| Instagram (@uga_do_litoral) | publicar e ler posts | API Meta (`.env`) ou exportação de dados | não ligada | 2026-10-31 |
| Codex | outro agente, skills antigas | só você, na mão | não ligada | 2026-10-31 |
| Playwright | renderizar HTML em PNG (story, peças visuais) | CLI/MCP, ainda sem instalar | não ligada (o /story-trabalho precisa) | 2026-10-31 |
| Remotion | motion em MP4 (story animado) | repos + Remotion Skills baixados em `projetos/estudio-motion/repos/`; CLI ainda sem instalar | não ligada | 2026-11-02 |
| HyperFrames | motion e vídeo em HTML (o filme do Semear saiu por ele) | CLI `npx hyperframes` + skills globais (hyperframes, media-use); login HeyGen (ugadolitoral@gmail.com, plano grátis) | ligada: trilha do catálogo liberada; voz HeyGen exige plano pago | 2026-11-02 |
| Gemini API (voz) | locução em PT-BR (TTS) | variável `GEMINI_API_KEY` em `~/.hyperframes/gemini.env` (fora do git); plano grátis = 3 pedidos/min | ligada (trocar a chave, exposta em 2026-11-02) | 2026-11-02 |
| VoiceStudio | voz local, clonagem e design de voz (reserva) | app em `D:VoiceStudioapp`, API em http://127.0.0.1:3900, GPU GTX 1660 Super | instalado, sem modelo baixado | 2026-11-02 |
| FFmpeg + Parakeet | encode de vídeo e transcrição local (legendas) | FFmpeg via winget; Parakeet via `npx hyperframes models install` | ligada | 2026-11-02 |
| WebSearch e WebFetch | pesquisa de referências na web (/cacar-referencias) | nativas do Claude Code | disponíveis, ainda não testadas nesta skill | 2026-10-31 |

## Os sete assuntos que todo negócio tem

- **Mensagem com cliente:** WhatsApp aparece nos trabalhos, mas não sei se é o canal principal. Não ligada.
- **Tarefa e prazo:** nada definido. Obsidian guarda conhecimento, não é gerenciador de tarefas confirmado.
- **Email:** Gmail, ligado por MCP (2026-10-31).
- **Agenda:** nada definido.
- **Dinheiro entrando e saindo:** nada definido.
- **Ficha do cliente:** nada definido.
- **Reunião:** nada definido (sem app de videochamada confirmado).
