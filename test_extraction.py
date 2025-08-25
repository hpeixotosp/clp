#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Ler o texto extraído
with open('debug_texto_1756162664.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print("=== TESTANDO EXTRAÇÃO DE PERÍODO ===")
# Testar padrões de período
period_patterns = [
    r'(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:de\s*)?(\d{4})',
    r'(?:referência|período|competência)\s*:?\s*(\d{1,2}[/\-]\d{4})',
    r'(?<!\d{3}\.)(?<!\d{2}\.)(?<!\d\.)(?<!/)(?<!-)\b(\d{1,2}[/\-]\d{4})(?!/\d)(?!-\d)'
]

for i, pattern in enumerate(period_patterns):
    print(f"\nPadrão {i+1}: {pattern}")
    matches = re.findall(pattern, text, re.IGNORECASE)
    if matches:
        print(f"  Encontrados: {matches}")
    else:
        print("  Não encontrado")

print("\n=== TESTANDO EXTRAÇÃO DE NOME ===")
# Testar padrões de nome
name_patterns = [
    r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s+\d{6}\s+\d+',
    r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+)\s+\d{6}\s+\d+'
]

for i, pattern in enumerate(name_patterns):
    print(f"\nPadrão {i+1}: {pattern}")
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    if match:
        name = match.group(1).strip()
        print(f"  Encontrado: '{name}'")
    else:
        print("  Não encontrado")

print("\n=== LINHAS COM NOMES POTENCIAIS ===")
lines = text.split('\n')
for i, line in enumerate(lines[:15]):
    if 'ADRIANO' in line or 'ANDRE' in line:
        print(f"Linha {i+1}: {line.strip()}")