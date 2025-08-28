#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import backend_pdf_processor
import re

def search_specific_values():
    """Busca pelos valores específicos da captura de tela no texto OCR"""
    try:
        processor = backend_pdf_processor.PontoProcessor()
        
        # Extrair texto OCR do cc.pdf
        pdf_path = "cc.pdf"
        print(f"🔍 Extraindo OCR de {pdf_path}...")
        ocr_text = processor.extract_text_with_ocr(pdf_path)
        
        print(f"\n📄 TEXTO OCR COMPLETO DO {pdf_path.upper()}:")
        print(f"=" * 100)
        print(ocr_text)
        print(f"=" * 100)
        print(f"Total de caracteres: {len(ocr_text)}")
        
        # Valores específicos da captura de tela
        target_values = [
            "7.066,33",   # Total de Vencimentos
            "1.648,33",   # Total de Descontos  
            "5.418,00",   # Valor Líquido
            "7066,33",    # Sem pontos
            "1648,33",    # Sem pontos
            "5418,00",    # Sem pontos
            "7066", "1648", "5418", "6852",  # Só números principais
            "Total", "Vencimentos", "Descontos", "Líquido"
        ]
        
        print(f"\n🔍 BUSCANDO VALORES ESPECÍFICOS DA CAPTURA DE TELA:")
        print(f"-" * 60)
        found_values = []
        for value in target_values:
            if value.lower() in ocr_text.lower():
                print(f"✅ ENCONTRADO: '{value}'")
                found_values.append(value)
                # Mostrar contexto mais amplo
                idx = ocr_text.lower().find(value.lower())
                start = max(0, idx - 80)
                end = min(len(ocr_text), idx + len(value) + 80)
                context = ocr_text[start:end].replace('\n', ' | ')
                print(f"   📍 Contexto: ...{context}...")
                print()
            else:
                print(f"❌ NÃO encontrado: '{value}'")
        
        # Buscar TODOS os valores monetários
        print(f"\n💰 TODOS OS VALORES MONETÁRIOS ENCONTRADOS:")
        print(f"-" * 60)
        money_patterns = [
            r'\d{1,3}(?:\.\d{3})*,\d{2}',  # Formato brasileiro: 1.234,56
            r'\d{1,4},\d{2}',               # Formato simples: 1234,56
            r'\d{1,3}\s*\.\s*\d{3}\s*,\s*\d{2}',  # Com espaços
        ]
        
        all_valores = set()
        for pattern in money_patterns:
            valores = re.findall(pattern, ocr_text)
            all_valores.update(valores)
        
        for valor in sorted(all_valores, key=lambda x: float(x.replace('.', '').replace(',', '.')), reverse=True):
            print(f"   💵 {valor}")
        
        # Buscar linhas com "Total" ou valores altos
        print(f"\n📝 LINHAS COM 'TOTAL' OU VALORES ALTOS:")
        print(f"-" * 60)
        lines = ocr_text.split('\n')
        for i, line in enumerate(lines, 1):
            line_clean = line.strip()
            if (line_clean and 
                ('total' in line_clean.lower() or 
                 'vencimento' in line_clean.lower() or
                 'desconto' in line_clean.lower() or
                 'liquido' in line_clean.lower() or
                 'líquido' in line_clean.lower() or
                 any(val in line_clean for val in ['7.066', '1.648', '5.418', '6.852', '7066', '1648', '5418']) or
                 re.search(r'\d{4}', line_clean))):
                print(f"   📄 Linha {i:2d}: {line_clean}")
        
        # Analisar final do documento (onde estariam os totais)
        print(f"\n🔚 ÚLTIMAS 20 LINHAS DO DOCUMENTO (onde deveriam estar os totais):")
        print(f"-" * 60)
        last_lines = lines[-20:]
        for i, line in enumerate(last_lines, len(lines)-19):
            if line.strip():
                print(f"   📄 Linha {i:2d}: {line.strip()}")
        
        # Testar recibo também
        print(f"\n\n" + "=" * 100)
        print(f"🔍 ANALISANDO RECIBO.PDF:")
        print(f"=" * 100)
        
        recibo_text = processor.extract_text_with_ocr("recibo.pdf")
        print(f"📄 Texto do recibo ({len(recibo_text)} chars):")
        print(recibo_text)
        
        # Buscar valor no recibo
        recibo_valores = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{1,2}', recibo_text)
        print(f"\n💰 Valores encontrados no recibo:")
        for valor in recibo_valores:
            print(f"   💵 {valor}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    search_specific_values()