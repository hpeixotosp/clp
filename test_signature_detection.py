#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste para verificar a detecção de assinatura melhorada
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_pdf_processor import PontoProcessor

def test_signature_patterns():
    """Testa os padrões de detecção de assinatura"""
    processor = PontoProcessor()
    
    # Casos de teste - textos que DEVEM ser detectados como assinados
    positive_cases = [
        "Este documento foi assinado digitalmente pelo colaborador",
        "Ponto assinado digitalmente em 01/01/2025",
        "Documento com assinatura digital válida",
        "CPF: 123.456.789-01 - Documento assinado",
        "Colaborador assinou digitalmente este ponto",
        "Validação digital confirmada",
        "Autenticação digital realizada",
        "Certificado digital aplicado"
    ]
    
    # Casos de teste - textos que NÃO devem ser detectados como assinados
    negative_cases = [
        "CPF: 12345678901",  # CPF sem formatação
        "cpf",  # Apenas a palavra cpf
        "Cartão ponto emitido em 01/01/2025",
        "Colaborador: João da Silva",
        "Período: 01/2025",
        "Horário de trabalho: 08:00 às 17:00",
        "Empresa: TECHCOM TECNOLOGIA"
    ]
    
    print("=== TESTE DE DETECÇÃO DE ASSINATURA MELHORADA ===")
    print("\n1. CASOS POSITIVOS (devem ser detectados como assinados):")
    
    for i, text in enumerate(positive_cases, 1):
        result = processor.check_digital_signature(text)
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{i}. {status}: '{text[:50]}...'")
    
    print("\n2. CASOS NEGATIVOS (NÃO devem ser detectados como assinados):")
    
    for i, text in enumerate(negative_cases, 1):
        result = processor.check_digital_signature(text)
        status = "✅ PASSOU" if not result else "❌ FALHOU"
        print(f"{i}. {status}: '{text[:50]}...'")
    
    # Teste com dados de tabela
    print("\n3. TESTE COM DADOS DE TABELA:")
    
    # Tabela com assinatura
    table_with_signature = [
        ["Data", "Entrada", "Saída", "Assinado digitalmente"],
        ["01/01/2025", "08:00", "17:00", "Sim"]
    ]
    
    # Tabela sem assinatura
    table_without_signature = [
        ["Data", "Entrada", "Saída", "CPF"],
        ["01/01/2025", "08:00", "17:00", "12345678901"]
    ]
    
    result1 = processor.check_table_signature(table_with_signature)
    status1 = "✅ PASSOU" if result1 else "❌ FALHOU"
    print(f"Tabela COM assinatura: {status1}")
    
    result2 = processor.check_table_signature(table_without_signature)
    status2 = "✅ PASSOU" if not result2 else "❌ FALHOU"
    print(f"Tabela SEM assinatura: {status2}")
    
    print("\n=== TESTE CONCLUÍDO ===")

if __name__ == "__main__":
    test_signature_patterns()