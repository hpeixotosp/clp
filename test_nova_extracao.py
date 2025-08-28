#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import backend_pdf_processor
import processador_contracheque

def test_nova_extracao():
    """Testa especificamente a nova lógica de extração de valores"""
    try:
        processor = backend_pdf_processor.PontoProcessor()
        
        # Extrair texto OCR do cc.pdf
        pdf_path = "cc.pdf"
        print(f"🔍 Extraindo OCR de {pdf_path}...")
        ocr_text = processor.extract_text_with_ocr(pdf_path)
        
        print(f"\n📄 TEXTO OCR COMPLETO:")
        print("=" * 80)
        print(ocr_text)
        print("=" * 80)
        
        # Testar a nova função extract_valores
        print(f"\n🧮 TESTANDO NOVA FUNÇÃO extract_valores:")
        print("-" * 60)
        
        valores = processador_contracheque.extract_valores(ocr_text)
        
        print(f"\n✅ RESULTADO FINAL:")
        print(f"   Vencimentos: {valores['vencimentos']}")
        print(f"   Descontos: {valores['descontos']}")
        print(f"   Líquido: {valores['liquido']}")
        
        # Mostrar se a validação está correta
        calculo_ok = processador_contracheque.validate_calculo(
            valores['vencimentos'], 
            valores['descontos'], 
            valores['liquido']
        )
        
        print(f"\n🧮 VALIDAÇÃO DE CÁLCULO: {'✅ CORRETO' if calculo_ok else '❌ INCORRETO'}")
        
        # Testar também o recibo
        print(f"\n" + "=" * 80)
        print(f"🔍 TESTANDO RECIBO.PDF:")
        print("=" * 80)
        
        recibo_text = processor.extract_text_with_ocr("recibo.pdf")
        print(f"\n📄 TEXTO RECIBO:")
        print(recibo_text)
        
        valores_recibo = processador_contracheque.extract_valores(recibo_text)
        print(f"\n✅ VALORES DO RECIBO:")
        print(f"   Líquido: {valores_recibo['liquido']}")
        
        # Comparar valores
        print(f"\n🔢 COMPARAÇÃO FINAL:")
        print(f"   Contracheque: {valores['liquido']}")
        print(f"   Recibo: {valores_recibo['liquido']}")
        
        venc_cc = processador_contracheque.normalize_money_value(valores['liquido'])
        venc_recibo = processador_contracheque.normalize_money_value(valores_recibo['liquido'])
        diferenca = abs(venc_cc - venc_recibo)
        
        print(f"   Diferença: {diferenca:.2f}")
        print(f"   Status: {'✅ CONFERE' if diferenca <= 0.01 else '❌ NÃO CONFERE'}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_nova_extracao()