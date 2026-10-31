<!-- quem alimenta: o /setup semeia na entrevista; o /atualizar acrescenta integração nova, acesso novo ou "não alcanço"; a /faxina confere e pergunta. Lido antes de dizer "não consigo" e ao criar skill. -->
# Integrações

> O que o negócio usa e como o agente alcança cada coisa. **"não ligada" é resposta válida:** é assim
> que o agente sabe que aquilo existe e dá pra ligar, em vez de achar que é impossível.
> Chave nunca fica aqui. Chave mora no `.env` (fora do git) ou no gerenciador de senha; aqui vai só o
> nome da variável. O cardápio do que dá pra ligar está em `sistema/templates/integracoes/catalogo.md`.

| integração | pra quê | como o agente alcança | estado | última checagem |
|---|---|---|---|---|
| GitHub | código dos projetos | CLI (`gh`, logado como notp3dr0, escopos repo, read:org, gist) | ligada | 2026-10-31 |
| Google Drive | biblioteca de arquivos e assets | MCP (conector do claude.ai) | ligada | 2026-10-31 |
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

## Os sete assuntos que todo negócio tem

- **Mensagem com cliente:** WhatsApp aparece nos trabalhos, mas não sei se é o canal principal. Não ligada.
- **Tarefa e prazo:** nada definido. Obsidian guarda conhecimento, não é gerenciador de tarefas confirmado.
- **Email:** Gmail, ligado por MCP (2026-10-31).
- **Agenda:** nada definido.
- **Dinheiro entrando e saindo:** nada definido.
- **Ficha do cliente:** nada definido.
- **Reunião:** nada definido (sem app de videochamada confirmado).
