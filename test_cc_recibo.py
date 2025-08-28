#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
sys.path.append('.')
from processador_contracheque import extract_text_from_pdf, extract_valores, extract_colaborador_name

def test_contracheque_recibo():
    """Testa especificamente os arquivos cc.pdf e recibo.pdf"""
    
    print("🔍 TESTE ESPECÍFICO - cc.pdf e recibo.pdf")
    print("=" * 60)
    
    # Verificar se os arquivos existem
    cc_exists = os.path.exists('cc.pdf')
    recibo_exists = os.path.exists('recibo.pdf')
    
    print(f"📁 cc.pdf existe: {cc_exists}")
    print(f"📁 recibo.pdf existe: {recibo_exists}")
    
    if not cc_exists or not recibo_exists:
        print("❌ Um ou ambos os arquivos não foram encontrados")
        return
    
    # Teste 1: Extrair texto do contracheque
    print("\n🧾 TESTE 1: PROCESSANDO CONTRACHEQUE (cc.pdf)")
    print("-" * 40)
    
    cc_text = extract_text_from_pdf('cc.pdf')
    print(f"📄 Texto extraído ({len(cc_text)} chars):")
    print(f"Primeiros 500 chars: {cc_text[:500]}")
    print(f"Últimos 200 chars: {cc_text[-200:]}")
    
    # Extrair nome do colaborador
    cc_colaborador = extract_colaborador_name(cc_text)
    print(f"👤 Colaborador extraído: '{cc_colaborador}'")
    
    # Extrair valores
    cc_valores = extract_valores(cc_text)
    print(f"💰 Valores extraídos:")
    print(f"  Vencimentos: {cc_valores.get('vencimentos', 'N/A')}")
    print(f"  Descontos: {cc_valores.get('descontos', 'N/A')}")
    print(f"  Líquido: {cc_valores.get('liquido', 'N/A')}")
    
    # Teste 2: Extrair texto do recibo
    print("\n🧾 TESTE 2: PROCESSANDO RECIBO (recibo.pdf)")
    print("-" * 40)
    
    recibo_text = extract_text_from_pdf('recibo.pdf')
    print(f"📄 Texto extraído ({len(recibo_text)} chars):")
    print(f"Primeiros 500 chars: {recibo_text[:500]}")
    print(f"Últimos 200 chars: {recibo_text[-200:]}")
    
    # Extrair nome do colaborador
    recibo_colaborador = extract_colaborador_name(recibo_text)
    print(f"👤 Colaborador extraído: '{recibo_colaborador}'")
    
    # Extrair valores
    recibo_valores = extract_valores(recibo_text)
    print(f"💰 Valores extraídos:")
    print(f"  Vencimentos: {recibo_valores.get('vencimentos', 'N/A')}")
    print(f"  Descontos: {recibo_valores.get('descontos', 'N/A')}")
    print(f"  Líquido: {recibo_valores.get('liquido', 'N/A')}")
    
    # Teste 3: Comparação de valores
    print("\n⚖️ TESTE 3: COMPARAÇÃO DE VALORES")
    print("-" * 40)
    
    cc_liquido = cc_valores.get('liquido')
    recibo_liquido = recibo_valores.get('liquido')
    
    print(f"💰 Valor líquido contracheque: '{cc_liquido}'")
    print(f"💰 Valor líquido recibo: '{recibo_liquido}'")
    
    if cc_liquido and recibo_liquido:
        try:
            # Normalizar valores
            cc_norm = float(cc_liquido.replace('.', '').replace(',', '.'))
            recibo_norm = float(recibo_liquido.replace('.', '').replace(',', '.'))
            diferenca = abs(cc_norm - recibo_norm)
            
            print(f"🧮 Valor contracheque normalizado: {cc_norm}")
            print(f"🧮 Valor recibo normalizado: {recibo_norm}")
            print(f"🧮 Diferença: {diferenca}")
            
            if diferenca <= 0.01:
                print("✅ VALORES CONFEREM!")
            else:
                print("❌ VALORES NÃO CONFEREM!")
                
        except Exception as e:
            print(f"❌ Erro na comparação: {e}")
    else:
        print("❌ Um dos valores está ausente")
    
    # Teste 4: Buscar por padrões específicos
    print("\n🔍 TESTE 4: BUSCA POR PADRÕES ESPECÍFICOS")
    print("-" * 40)
    
    import re
    
    # Procurar valores no contracheque
    print("Contracheque - valores encontrados:")
    valores_cc = re.findall(r'\d{1,3}(?:[.,]\d{3})*[.,]\d{2}', cc_text)
    for i, valor in enumerate(valores_cc[:10]):  # Mostrar apenas os primeiros 10
        print(f"  {i+1}: {valor}")
    
    print("\nRecibo - valores encontrados:")
    valores_recibo = re.findall(r'\d{1,3}(?:[.,]\d{3})*[.,]\d{2}', recibo_text)
    for i, valor in enumerate(valores_recibo[:10]):  # Mostrar apenas os primeiros 10
        print(f"  {i+1}: {valor}")
    
    print("\n" + "=" * 60)
    print("🏁 TESTE CONCLUÍDO")

if __name__ == "__main__":
    test_contracheque_recibo()