#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Filtro de Emojis e Caracteres Especiais
Uso: python limpa_emojis.py < arquivo_entrada > arquivo_saida
"""

import sys
import re

def limpar_emojis(texto):
    # Forçar encoding ASCII - remove TODOS os caracteres não-ASCII
    texto_ascii = texto.encode('ascii', 'ignore').decode('ascii')
    return texto_ascii

if __name__ == "__main__":
    # Ler da entrada padrão
    texto = sys.stdin.read()
    
    # Limpar emojis
    texto_limpo = limpar_emojis(texto)
    
    # Escrever na saída padrão
    sys.stdout.write(texto_limpo)
