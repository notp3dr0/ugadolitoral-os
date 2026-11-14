"""Extrai o "tom" de cada foto: a cor de luz de palco dominante, ou null se a foto e P&B / sem cor forte.

Uso:  python tons.py [pasta_do_site=../site-lab]          -> imprime JSON {indice_da_foto: "#rrggbb" | null}
      python tons.py ../site-lab --tabela                 -> imprime uma tabela legivel pra conferir

Le as fotos pequenas listadas em js/data.js (ou gallery-data.js, antes da rodada 2), campo "small". Nao altera nenhum arquivo.
Regra: pixels "coloridos" sao os com saturacao > .35 e brilho > .25. Se menos de 12% da foto for
colorida, o tom e null (o fundo liquido fica no vermelho da casa). Senao, o tom e a faixa de matiz
com mais peso (peso = saturacao x brilho), devolvida bem saturada pra render no fluido.
"""
import colorsys
import json
import os
import sys

from PIL import Image

FAIXAS = 24
MIN_COLORIDO = 0.12


def tom(caminho):
    im = Image.open(caminho).convert('RGB')
    im.thumbnail((72, 72))
    pesos = [0.0] * FAIXAS
    somas = [0.0] * FAIXAS
    coloridos = 0
    dados = im.tobytes()
    pixels = [(dados[k], dados[k + 1], dados[k + 2]) for k in range(0, len(dados), 3)]
    for r, g, b in pixels:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s > 0.35 and v > 0.25:
            coloridos += 1
            faixa = int(h * FAIXAS) % FAIXAS
            pesos[faixa] += s * v
            somas[faixa] += (h * FAIXAS - faixa) * s * v
    if coloridos / len(pixels) < MIN_COLORIDO:
        return None
    # junta cada faixa com as vizinhas pra nao rachar uma cor na fronteira
    juntas = [pesos[i - 1] + pesos[i] + pesos[(i + 1) % FAIXAS] for i in range(FAIXAS)]
    melhor = max(range(FAIXAS), key=lambda i: juntas[i])
    matiz = ((melhor + (somas[melhor] / pesos[melhor] if pesos[melhor] else 0.5)) / FAIXAS) % 1
    r, g, b = colorsys.hsv_to_rgb(matiz, 0.95, 1.0)
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))


def main():
    pasta = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '../site-lab'
    antigo = os.path.join(pasta, 'gallery-data.js')
    if os.path.exists(antigo):  # antes da rodada 2
        texto = open(antigo, encoding='utf-8').read()
        dados = json.JSONDecoder().raw_decode(texto[texto.find('{'):])[0]
    else:  # js/data.js: uma foto por linha dentro de `export const photos = [ ... ];`
        texto = open(os.path.join(pasta, 'js', 'data.js'), encoding='utf-8').read()
        bloco = texto[texto.index('export const photos = ['):]
        bloco = bloco[:bloco.index('\n];')]
        dados = {'photos': [json.loads(l.strip().rstrip(',')) for l in bloco.split('\n') if l.strip().startswith('{')]}
    saida = {}
    for foto in dados['photos']:
        saida[foto['i']] = tom(os.path.join(pasta, foto['small']))
    if '--tabela' in sys.argv:
        for foto in dados['photos']:
            print(f"{foto['i']:>3}  {str(saida[foto['i']]):<8} {foto['title']:<16} {foto['alt']}".encode('ascii', 'replace').decode())
        com_cor = sum(1 for v in saida.values() if v)
        print(f'\n{com_cor} com tom, {len(saida) - com_cor} sem (P&B ou cor fraca)')
    else:
        print(json.dumps(saida))


if __name__ == '__main__':
    main()
