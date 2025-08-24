#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_pdf_processor import PontoProcessor
import pdfplumber
import re

def debug_signature_detection(pdf_path):
    """Debug detalhado do reconhecimento de assinatura"""
    print(f"=== DEBUG ASSINATURA: {pdf_path} ===")
    
    if not os.path.exists(pdf_path):
        print(f"❌ Arquivo não encontrado: {pdf_path}")
        return
    
    try:
        # 1. Extrair texto completo do PDF
        print("\n1. EXTRAINDO TEXTO COMPLETO...")
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += page.extract_text() or ""
        
        print(f"Texto extraído ({len(full_text)} caracteres):")
        print("=" * 50)
        print(full_text[:1000] + "..." if len(full_text) > 1000 else full_text)
        print("=" * 50)
        
        # 2. Extrair tabelas
        print("\n2. EXTRAINDO TABELAS...")
        with pdfplumber.open(pdf_path) as pdf:
            table_data = []
            for page in pdf.pages:
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        table_data.extend(table)
        
        print(f"Tabelas extraídas ({len(table_data)} linhas):")
        for i, row in enumerate(table_data[:10]):
            print(f"Linha {i}: {row}")
        
        # 3. Testar padrões de assinatura no texto
        print("\n3. TESTANDO PADRÕES DE ASSINATURA NO TEXTO...")
        text_lower = full_text.lower()
        signature_patterns = [
            'assinado digitalmente', 'assinatura digital', 'documento assinado digitalmente',
            'ponto assinado digitalmente', 'assinado eletronicamente', 'assinatura eletrônica',
            'certificado digital', 'assinado', 'assinatura', 'cpf', 'verificado', 'validado',
            'colaborador assinou', 'ponto assinado', 'documento assinado'
        ]
        
        found_patterns = []
        for pattern in signature_patterns:
            if pattern in text_lower:
                found_patterns.append(pattern)
                print(f"✅ Padrão encontrado no texto: '{pattern}'")
        
        if not found_patterns:
            print("❌ Nenhum padrão de assinatura encontrado no texto")
        
        # 4. Testar padrões de assinatura nas tabelas
        print("\n4. TESTANDO PADRÕES DE ASSINATURA NAS TABELAS...")
        table_patterns_found = []
        for i, row in enumerate(table_data):
            row_text = " ".join(str(cell) for cell in row if cell).lower()
            for pattern in signature_patterns:
                if pattern in row_text:
                    table_patterns_found.append((i, pattern, row_text))
                    print(f"✅ Padrão encontrado na linha {i}: '{pattern}' em '{row_text}'")
        
        if not table_patterns_found:
            print("❌ Nenhum padrão de assinatura encontrado nas tabelas")
        
        # 5. Usar o processador oficial
        print("\n5. TESTANDO COM PROCESSADOR OFICIAL...")
        processor = PontoProcessor()
        result = processor.process_pdf(pdf_path)
        
        print(f"Resultado oficial:")
        print(f"  Colaborador: {result.get('colaborador', 'N/A')}")
        print(f"  Período: {result.get('periodo', 'N/A')}")
        print(f"  Assinatura: {result.get('assinatura', 'N/A')}")
        print(f"  Previsto: {result.get('previsto', 'N/A')}")
        print(f"  Realizado: {result.get('realizado', 'N/A')}")
        print(f"  Saldo: {result.get('saldo', 'N/A')}")
        
        # 6. Buscar por palavras-chave específicas
        print("\n6. BUSCANDO PALAVRAS-CHAVE ESPECÍFICAS...")
        keywords = ['assin', 'digit', 'certif', 'valid', 'verif', 'cpf']
        for keyword in keywords:
            if keyword in text_lower:
                # Encontrar contexto
                start = max(0, text_lower.find(keyword) - 50)
                end = min(len(full_text), text_lower.find(keyword) + 50)
                context = full_text[start:end]
                print(f"✅ '{keyword}' encontrado: ...{context}...")
        
        # 7. Verificar se há CPF no documento
        print("\n7. VERIFICANDO CPF...")
        cpf_pattern = r'\d{3}\.\d{3}\.\d{3}-\d{2}'
        cpf_matches = re.findall(cpf_pattern, full_text)
        if cpf_matches:
            print(f"✅ CPF encontrado: {cpf_matches}")
        else:
            print("❌ Nenhum CPF encontrado")
        
        # 8. Verificar se há números que podem ser CPF sem formatação
        print("\n8. VERIFICANDO NÚMEROS LONGOS...")
        number_pattern = r'\d{11}'
        number_matches = re.findall(number_pattern, full_text)
        if number_matches:
            print(f"✅ Números de 11 dígitos encontrados: {number_matches[:5]}")
        else:
            print("❌ Nenhum número de 11 dígitos encontrado")
            
    except Exception as e:
        print(f"❌ Erro durante debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Testar com pont.pdf
    debug_signature_detection("pont.pdf")
    
    # Se existir, testar também com pontoex.pdf
    if os.path.exists("pontoex.pdf"):
        print("\n" + "="*80 + "\n")
        debug_signature_detection("pontoex.pdf")