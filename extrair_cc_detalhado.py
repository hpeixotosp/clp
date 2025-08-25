import fitz  # PyMuPDF
import re
import json

print("🔍 Analisando arquivo cc.pdf com PyMuPDF...")

try:
    # Abrir o PDF
    doc = fitz.open('cc.pdf')
    print(f"📄 PDF tem {len(doc)} página(s)")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        print(f"\n📖 Analisando página {page_num + 1}...")
        
        # Extrair texto da página
        text = page.get_text()
        print(f"📝 Texto extraído (método padrão): {len(text)} caracteres")
        if text.strip():
            print(f"Texto: {repr(text[:200])}...")
        
        # Tentar extrair texto com diferentes métodos
        text_dict = page.get_text("dict")
        print(f"📊 Estrutura da página: {len(text_dict.get('blocks', []))} blocos")
        
        # Extrair texto de todos os blocos
        all_text = ""
        for block in text_dict.get('blocks', []):
            if 'lines' in block:
                for line in block['lines']:
                    for span in line['spans']:
                        all_text += span.get('text', '') + " "
        
        print(f"📝 Texto de blocos: {len(all_text)} caracteres")
        if all_text.strip():
            print(f"Texto de blocos: {repr(all_text[:200])}...")
        
        # Verificar se há imagens na página
        image_list = page.get_images()
        print(f"🖼️ Imagens encontradas: {len(image_list)}")
        
        # Se há imagens, tentar extrair como bitmap e fazer OCR básico
        if image_list:
            print("🔄 Convertendo página para imagem...")
            pix = page.get_pixmap()
            print(f"📐 Dimensões da imagem: {pix.width}x{pix.height}")
            
            # Salvar imagem para análise
            img_filename = f"cc_page_{page_num + 1}.png"
            pix.save(img_filename)
            print(f"💾 Imagem salva como: {img_filename}")
        
        # Procurar por padrões de valor líquido no texto disponível
        combined_text = text + " " + all_text
        print(f"\n🔍 Procurando valor líquido no texto combinado...")
        
        # Padrões mais amplos para encontrar valores
        patterns = [
            r'líquido[:\s]*([\d.,]+)',
            r'valor\s+líquido[:\s]*([\d.,]+)',
            r'total\s+líquido[:\s]*([\d.,]+)',
            r'([\d.,]+)\s*líquido',
            r'líquido[:\s]*r?\$?\s*([\d.,]+)',
            r'([\d]+[.,]\d{2})\s*$',  # Valores no final da linha
            r'\b([\d]{1,3}(?:[.,]\d{3})*[.,]\d{2})\b',  # Formato monetário
        ]
        
        valores_encontrados = []
        for i, pattern in enumerate(patterns, 1):
            matches = re.findall(pattern, combined_text, re.IGNORECASE | re.MULTILINE)
            if matches:
                print(f"✅ Padrão {i} ({pattern}): {matches}")
                valores_encontrados.extend(matches)
            else:
                print(f"❌ Padrão {i}: Nenhum match")
        
        if valores_encontrados:
            print(f"\n💰 VALORES ENCONTRADOS: {valores_encontrados}")
        
        # Mostrar todo o texto para análise manual
        if combined_text.strip():
            print(f"\n📋 TEXTO COMPLETO DA PÁGINA {page_num + 1}:")
            print("=" * 50)
            print(combined_text)
            print("=" * 50)
        else:
            print(f"\n⚠️ Nenhum texto encontrado na página {page_num + 1}")
    
    doc.close()
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()