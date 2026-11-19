#!/bin/bash
# Etapa 3: todas as sequências, em ordem, retomáveis (rodar de novo continua de onde parou).
cd "$(dirname "$0")"
date +"INICIO %F %T"
python sequencia.py C7_porta v h --flash 13,40 -- --amostras-faixa 86-110:96 || exit 1
python sequencia.py B1_travessia v -- --borrao-desde 108 || exit 1
for p in C2a C2b C2c C2d C2f C2g C2e_mergulho; do python sequencia.py $p v -- --sem-borrao || exit 1; done
python sequencia.py A1_planta v --seg --quadros 168-222 || exit 1
python sequencia.py B1_travessia v --seg -- --borrao-desde 108 || exit 1
date +"FIM %F %T"
