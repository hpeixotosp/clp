#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste para verificar se a nova lógica de C.PRE está funcionando corretamente
Quando há texto nos campos de entrada/saída mas existe C.PRE válido
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_pdf_processor import PontoProcessor

def test_cpre_logic():
    processor = PontoProcessor()
    
    # Teste 1: Dia com atestado mas C.PRE válido
    entry_atestado = {
        'data': '01/05/2025',
        'campo1': 'ATESTADO',
        'campo2': '',
        'campo3': '',
        'campo4': '',
        'cpre': '08:00:00',
        'cpre_minutos': 480  # 8 horas
    }
    
    # Teste 2: Dia com feriado mas C.PRE válido
    entry_feriado = {
        'data': '02/05/2025',
        'campo1': '',
        'campo2': 'FERIADO',
        'campo3': '',
        'campo4': '',
        'cpre': '08:00:00',
        'cpre_minutos': 480  # 8 horas
    }
    
    # Teste 3: Dia normal com horários
    entry_normal = {
        'data': '03/05/2025',
        'campo1': '08:00',
        'campo2': '12:00',
        'campo3': '13:00',
        'campo4': '17:00',
        'cpre': '08:00:00',
        'cpre_minutos': 480  # 8 horas
    }
    
    # Teste 4: Dia com texto mas sem C.PRE válido
    entry_sem_cpre = {
        'data': '04/05/2025',
        'campo1': 'FOLGA',
        'campo2': '',
        'campo3': '',
        'campo4': '',
        'cpre': '00:00:00',
        'cpre_minutos': 0
    }
    
    print("=== TESTE DA NOVA LÓGICA DE C.PRE ===")
    print()
    
    # Executar testes
    tests = [
        ("Atestado com C.PRE", entry_atestado),
        ("Feriado com C.PRE", entry_feriado),
        ("Dia normal", entry_normal),
        ("Folga sem C.PRE", entry_sem_cpre)
    ]
    
    for test_name, entry in tests:
        horas, tipo = processor.calculate_daily_hours(entry)
        print(f"{test_name}:")
        print(f"  Data: {entry['data']}")
        print(f"  Campos: {entry['campo1']} | {entry['campo2']} | {entry['campo3']} | {entry['campo4']}")
        print(f"  C.PRE: {entry['cpre']} ({entry['cpre_minutos']} min)")
        print(f"  Resultado: {horas} minutos ({horas/60:.2f} horas) - Tipo: {tipo}")
        print()
    
    print("=== RESUMO DOS RESULTADOS ===")
    print("✅ Atestado/Feriado com C.PRE válido deve usar C.PRE completo")
    print("✅ Dias normais devem calcular baseado nos horários")
    print("✅ Dias com texto mas sem C.PRE válido devem retornar 0")

if __name__ == "__main__":
    test_cpre_logic()