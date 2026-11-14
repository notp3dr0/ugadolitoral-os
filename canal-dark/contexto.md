# Contexto · Canal Dark

## O que é
Canal sem rosto de vídeos curtos verticais (1080×1920, cerca de 60 s) que explicam como algo funciona
por uma cadeia de problemas e soluções. Um sistema 3D low-poly é montado peça por peça na frente de
quem assiste. O primeiro recorte é audiovisual (câmera, luz, som) e pode abrir pra outros temas depois.

## Como se produz (combinado em 2026-11-03)
- **Método:** a skill `remotion-problem-resolve-video`, nas skills da raiz. Fonte: o zip que o Pedro
  colocou em `canal-dark/videos/joao-gabriel/out/remotion-problem-resolve-video.zip` (a pasta morava em `uga-do-litoral/instagram/reels/` e foi movida pra cá em 2026-11-03).
  - Fase 1 é o roteiro com tabela cronológica e `scene-plan.ts`, e precisa de aprovação.
  - Fase 2 é o render.
- **Stack:**
  - Remotion 4, `@remotion/three` e React Three Fiber.
  - Voz: VoiceStudio local (127.0.0.1:3900), perfil "joao gabriel", que é a voz do Pedro.
  - Efeitos e trilha sintetizados em Python.
  - Master em −14 LUFS.
- **Organização:** um vídeo por pasta em `videos/<tema>/`.

## Skills que podem agregar (ideias, ainda não criadas)
- **pauta do canal:** buscar temas com potencial (vidIQ outliers no IG/TikTok/YouTube) e devolver uma
  lista de "como funciona X" com gancho.
- **série visual:** fixar a identidade do canal (abertura, badge e paleta) pra todo vídeo sair com a
  mesma cara.
- **cortes e legenda de post:** gerar título, legenda e hashtags por plataforma a partir do roteiro.

## Série narrativa 2D (decidido em 2026-11-04)
- **Formato:** série curta vertical em bonecos 2D de peças articuladas (não 3D low-poly), um dia por
  episódio, narrada em segunda pessoa, terminando numa escolha em que o público vota nos comentários.
  O mesmo episódio vai pra TikTok, Instagram, Shorts e Facebook.
- **Referência de técnica:** Edu Dark, "Trancados" (vídeo https://www.youtube.com/watch?v=4e74CFd0F1E).
  Copia-se técnica (câmera, luz, som, estrutura de susto, medição de referência), nunca a história nem os
  personagens. Estudo em `referencias/trancados-teaser-estudo.md` e `referencias/trancados-edu-dark-estilo.md`;
  resumo do vídeo e da transcrição em `referencias/curtas-animacao-claude/`.
- **Motor:** `templates/remotion-2d-pecas/` (Remotion 4, SVG, sem Three.js). Conferido por render do MP4.
- **Skills da pasta:** `estudar-referencia-video` (mede vídeo de referência e devolve tabela) e `biblia-serie`
  (continuidade). A pasta da série nasce em `series/<serie>/`.
- **Série escolhida (2026-11-04):** Revelação, em `series/revelacao/`.
- **Cuidado:** os números de views e ganhos que o Edu Dark cita são dele e não foram verificados; o vídeo
  também vende um curso.
