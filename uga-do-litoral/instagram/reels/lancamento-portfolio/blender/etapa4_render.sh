#!/bin/bash
# etapa 4: o corredor no formato horizontal (1920x1080). Retomável: o que já existe em disco é pulado.
cd "$(dirname "$0")"
echo "INICIO $(date +%H:%M:%S)"
for p in C2a C2b C2c C2d C2f C2g C2e_mergulho; do python sequencia.py $p h -- --sem-borrao || exit 1; done
python sequencia.py B1_travessia h -- --borrao-desde 108 || exit 1
python sequencia.py A1_planta h --seg --quadros 168-222 || exit 1
python sequencia.py B1_travessia h --seg -- --borrao-desde 108 || exit 1
echo "FIM $(date +%H:%M:%S)"
