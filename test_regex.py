#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import sys

def test_name_extraction():
    # Texto de exemplo
    with open('test_contracheque.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    print("=== Texto de entrada ===")
    print(text[:500])
    print("\n" + "="*50)
    
    # Padrões para encontrar nome do colaborador
    patterns = [
        # Padrões específicos para contracheques
        r'(?:nome|colaborador|funcionário|servidor)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'Nome\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'NOME\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        # Padrão para nomes seguidos de dados pessoais
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)(?=\s*(?:CPF|RG|Matrícula))',
        # Padrão mais flexível para capturar nomes em linhas
        r'^\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)\s*$',
        # Padrão para nomes após palavras-chave
        r'(?:Funcionário|Servidor|Empregado)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+)',
    ]
    
    print("\n=== Testando padrões ===")
    
    for i, pattern in enumerate(patterns, 1):
        print(f"\nPadrão {i}: {pattern}")
        
        # Testar com flags diferentes
        flags_combinations = [
            re.MULTILINE | re.IGNORECASE,
            re.IGNORECASE,
            re.MULTILINE,
            0
        ]
        
        for j, flags in enumerate(flags_combinations):
            flag_names = []
            if flags & re.MULTILINE:
                flag_names.append('MULTILINE')
            if flags & re.IGNORECASE:
                flag_names.append('IGNORECASE')
            if not flag_names:
                flag_names.append('NONE')
            
            matches = re.findall(pattern, text, flags)
            print(f"  Flags {' | '.join(flag_names)}: {matches}")
            
            if matches:
                for match in matches:
                    # Limpar o nome
                    name = match.strip()
                    name = re.sub(r'\s+', ' ', name)
                    name = re.sub(r'[^A-Za-záàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\s]', '', name)
                    
                    # Filtrar palavras inválidas
                    invalid_words = ['da empresa', 'do tribunal', 'regional', 'trabalho', 'justiça', 'federal', 
                                   'ministério', 'público', 'união', 'estado', 'município', 'prefeitura',
                                   'secretaria', 'departamento', 'seção', 'divisão', 'coordenação']
                    
                    name_lower = name.lower()
                    if any(invalid in name_lower for invalid in invalid_words):
                        print(f"    ❌ Nome contém palavras inválidas: '{name}'")
                        continue
                    
                    # Validar se é um nome válido
                    words = name.split()
                    if len(words) >= 2 and len(name) > 5 and len(name) < 50:
                        # Verificar se todas as palavras têm pelo menos 2 caracteres
                        if all(len(word) >= 2 for word in words):
                            print(f"    ✅ Nome válido encontrado: '{name}'")
                        else:
                            print(f"    ❌ Nome com palavras muito curtas: '{name}'")
                    else:
                        print(f"    ❌ Nome inválido (palavras: {len(words)}, tamanho: {len(name)}): '{name}'")

if __name__ == "__main__":
    test_name_extraction()