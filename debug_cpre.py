#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_pdf_processor import PontoProcessor
import json

def debug_cpre_extraction(pdf_path):
    """Debug da extração de C.PRE de um PDF específico"""
    print(f"=== DEBUG C.PRE EXTRACTION ===")
    print(f"Arquivo: {pdf_path}")
    
    processor = PontoProcessor()
    
    # Extrair dados das tabelas
    table_data = processor.extract_table_data(pdf_path)
    print(f"\nTabelas extraídas: {len(table_data)} linhas")
    
    # Mostrar primeiras 20 linhas das tabelas
    print("\n=== PRIMEIRAS 20 LINHAS DAS TABELAS ===")
    for i, row in enumerate(table_data[:20]):
        print(f"Linha {i:2d}: {row}")
    
    # Extrair entradas usando parse_table_entries
    entries = processor.parse_table_entries(table_data)
    print(f"\n=== ENTRADAS EXTRAÍDAS ({len(entries)}) ===")
    
    total_cpre_minutos = 0
    for i, entry in enumerate(entries):
        print(f"Entrada {i+1:2d}: {entry['data']} - C.PRE: {entry['cpre']} ({entry['cpre_minutos']} min)")
        total_cpre_minutos += entry['cpre_minutos']
    
    print(f"\n=== TOTAIS ===")
    print(f"Total C.PRE em minutos: {total_cpre_minutos}")
    print(f"Total C.PRE em horas: {processor.minutes_to_time_str(total_cpre_minutos)}")
    
    # Verificar se há valores absurdos
    if total_cpre_minutos > 10000:  # Mais de 166 horas
        print(f"\n⚠️  VALOR ABSURDO DETECTADO: {total_cpre_minutos} minutos!")
        print("Analisando entradas individuais...")
        
        for entry in entries:
            if entry['cpre_minutos'] > 600:  # Mais de 10 horas por dia
                print(f"  ⚠️  Entrada problemática: {entry['data']} - C.PRE: {entry['cpre']} ({entry['cpre_minutos']} min)")
    
    return entries, total_cpre_minutos

if __name__ == "__main__":
    # Testar com um PDF específico
    pdf_files = [
        "C:\\ia\\trae\\clp\\pont.pdf",
        "C:\\ia\\trae\\clp\\pontoex.pdf"
    ]
    
    for pdf_path in pdf_files:
        if os.path.exists(pdf_path):
            print(f"\n{'='*60}")
            debug_cpre_extraction(pdf_path)
        else:
            print(f"Arquivo não encontrado: {pdf_path}")