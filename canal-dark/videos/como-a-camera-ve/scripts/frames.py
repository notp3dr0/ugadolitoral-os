# imprime o início de cada cena (frames) a partir do bundle: lê vo.json e replica timing.ts
import json
vo=json.load(open('src/data/vo.json',encoding='utf-8'))
keys=[f's{i}' for i in range(1,9)]; t=0.45; st={}
for k in keys: st[k]=t; t+=vo[k]['seconds']+0.55
fr=[0]+[round((st[k]-0.25)*30) for k in keys[1:]]
print('inicio das cenas:',fr,'fim da fala:',round((t-0.55)*30))
