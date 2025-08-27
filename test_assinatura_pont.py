#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import backend_pdf_processor
import os

def test_pont_signature():
    """Teste específico para detectar assinatura no pont.pdf"""
    
    if not os.path.exists('pont.pdf'):
        print("❌ Arquivo pont.pdf não encontrado")
        return
    
    print("🔍 TESTE DE DETECÇÃO DE ASSINATURA - pont.pdf")
    print("=" * 50)
    
    processor = backend_pdf_processor.PontoProcessor()
    
    # 1. Extrair texto do PDF
    print("\n1. EXTRAINDO TEXTO DO PDF...")
    text = processor.extract_text_from_pdf('pont.pdf')
    print(f"✅ Texto extraído: {len(text)} caracteres")
    
    # 2. Procurar por 'assinado' no texto
    print("\n2. PROCURANDO 'ASSINADO' NO TEXTO...")
    text_lower = text.lower()
    if 'assinado' in text_lower:
        print("✅ Palavra 'assinado' ENCONTRADA no texto!")
        # Encontrar contexto
        start = max(0, text_lower.find('assinado') - 50)
        end = min(len(text), text_lower.find('assinado') + 50)
        context = text[start:end]
        print(f"📝 Contexto: ...{context}...")
    else:
        print("❌ Palavra 'assinado' NÃO ENCONTRADA no texto")
    
    # 3. Testar detector de assinatura
    print("\n3. TESTANDO DETECTOR DE ASSINATURA...")
    has_signature = processor.check_digital_signature(text, 'pont.pdf')
    print(f"🔍 Resultado detecção: {has_signature}")
    
    # 4. Mostrar últimas 500 caracteres do texto para ver se há assinatura no final
    print("\n4. ÚLTIMOS 500 CARACTERES DO PDF (onde geralmente fica a assinatura):")
    print("📄", text[-500:])
    
    # 5. Procurar outras palavras relacionadas
    print("\n5. PROCURANDO OUTRAS PALAVRAS RELACIONADAS...")
    keywords = ['assinatura', 'digital', 'certificado', 'válido', 'autenticado', 'aprovado']
    for keyword in keywords:
        if keyword in text_lower:
            print(f"✅ Encontrado: '{keyword}'")
        else:
            print(f"❌ Não encontrado: '{keyword}'")
    
    # 6. Teste com OCR usando apenas inglês (mais estável)
    print("\n6. TESTE OCR SIMPLES (INGLÊS)...")
    try:
        import pytesseract
        import fitz
        from PIL import Image
        import io
        
        # Tentar OCR apenas em inglês
        doc = fitz.open('pont.pdf')
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        
        # OCR simples em inglês
        ocr_text = pytesseract.image_to_string(img, lang='eng')
        print(f"📄 OCR extraído ({len(ocr_text)} chars): {ocr_text[:200]}...")
        
        if 'assinado' in ocr_text.lower():
            print("✅ 'assinado' encontrado via OCR!")
        else:
            print("❌ 'assinado' não encontrado via OCR")
            
        doc.close()
        
    except Exception as e:
        print(f"⚠️ OCR falhou: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 TESTE CONCLUÍDO")

if __name__ == "__main__":
    test_pont_signature()