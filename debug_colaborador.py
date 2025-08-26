#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de debug para testar extração de colaborador
"""

import sys
import re
import backend_pdf_processor

def debug_extract_colaborador():
    """
    Debug da extração de colaborador
    """
    print("=== DEBUG EXTRAÇÃO DE COLABORADOR ===")
    
    # Extrair texto do PDF usando OCR
    try:
        processor = backend_pdf_processor.PontoProcessor()
        text = processor.extract_text_with_ocr('cc.pdf')
        print(f"📝 Texto extraído: {len(text)} caracteres")
        print(f"📝 Primeiros 500 caracteres:")
        print(repr(text[:500]))
        print("\n" + "="*50)
        
        # Mostrar linhas do texto
        lines = text.split('\n')[:15]
        print("📝 Primeiras 15 linhas:")
        for i, line in enumerate(lines, 1):
            print(f"  {i:2d}: {repr(line)}")
        print("\n" + "="*50)
        
        # Testar padrões de extração de nome
        patterns = [
            # Padrão específico para o formato do contracheque (nome seguido de números)
            r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s+\d{6}\s+\d+',
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
            # Padrão específico para o texto OCR extraído
            r'([A-Z][A-Z\s]+)\s+\d{6}',
            # Padrão para capturar nome antes de números
            r'([A-Z][A-Z\s]+?)\s+\d+',
            # Padrão mais simples para nomes em maiúsculo
            r'\b([A-Z]{2,}(?:\s+[A-Z]{2,})+)\b',
        ]
        
        print("🔍 Testando padrões de extração:")
        for i, pattern in enumerate(patterns, 1):
            print(f"\n--- Padrão {i} ---")
            print(f"Regex: {pattern}")
            
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                print(f"✅ Encontrou {len(matches)} match(es):")
                for j, match in enumerate(matches[:5], 1):  # Mostrar apenas os primeiros 5
                    print(f"  {j}: '{match}'")
                    
                    # Testar validação
                    name = match.strip() if isinstance(match, str) else match[0].strip()
                    name = re.sub(r'[^A-Za-záàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\s]', '', name)
                    
                    words = name.split()
                    # Remover palavras de 1 caractere no início
                    while words and len(words[0]) == 1:
                        words = words[1:]
                    
                    if words:
                        clean_name = ' '.join(words)
                        if len(words) >= 2 and len(clean_name) > 5 and len(clean_name) < 50:
                            if all(len(word) >= 2 for word in words):
                                print(f"    ✅ Nome válido: '{clean_name}'")
                            else:
                                print(f"    ❌ Palavras muito curtas: '{clean_name}'")
                        else:
                            print(f"    ❌ Nome inválido (palavras: {len(words)}, tamanho: {len(clean_name)}): '{clean_name}'")
                    else:
                        print(f"    ❌ Sem palavras válidas")
            else:
                print("❌ Nenhum match encontrado")
        
        # Testar busca manual por ADRIANO
        print("\n🔍 Buscando especificamente por 'ADRIANO':")
        adriano_matches = re.findall(r'(ADRIANO[^\n]*)', text, re.IGNORECASE)
        if adriano_matches:
            print(f"✅ Encontrou ADRIANO: {adriano_matches}")
        else:
            print("❌ ADRIANO não encontrado")
            
        # Buscar por padrões de números que podem indicar matrícula
        print("\n🔍 Buscando padrões de matrícula (6 dígitos):")
        matricula_matches = re.findall(r'(\w+[^\d]*)(\d{6})', text)
        if matricula_matches:
            print(f"✅ Encontrou padrões de matrícula:")
            for match in matricula_matches[:5]:
                print(f"  Nome: '{match[0].strip()}' | Matrícula: '{match[1]}'")
        else:
            print("❌ Nenhum padrão de matrícula encontrado")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_extract_colaborador()
    print("\n=== DEBUG CONCLUÍDO ===")