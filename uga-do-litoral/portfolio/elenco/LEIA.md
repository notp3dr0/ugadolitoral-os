# Elenco do bastidor

As pessoas do site (`site-lab/bastidor/elenco/`), montadas por script. Ver `../plano/rodada-15-fiel.md`.

- `fonte/` (fora do git, CC0, refazer o download se sumir): da Quaternius, `Superhero_Male_FullBody.gltf/.bin` e
  `Superhero_Female_FullBody.gltf/.bin` (Universal Base Characters, Standard) e `UAL1_Standard.glb` (Universal
  Animation Library, Standard). quaternius.itch.io, gratuitos.
- `atlas.py` → `atlas.png` + `atlas.json` (palavras das costas, crachás, papel da prancheta).
- `personagens.py` → um `.glb` por tipo e `movimento.glb`, direto em `site-lab/bastidor/elenco/`.
  `-- --so seguranca` faz um só; `-- --previa` grava prints em `previa/`; `python juntar_previa.py seguranca` junta.
- Depois, comprimir (cópia sem compressão fica em `bruto/`, fora do git):

```
cd ../site-lab/bastidor/elenco
for f in *.glb; do npx -y @gltf-transform/cli@4.1.1 resample "$f" "$f"; npx -y @gltf-transform/cli@4.1.1 meshopt "$f" "$f" --level medium; done
cp ../../../elenco/atlas.png .
```

Regras: sem rosto, nada gerado por IA, ninguém imitando pessoa real. A função se lê pela silhueta, pela roupa e
pelo objeto.
