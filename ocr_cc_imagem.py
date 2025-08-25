import pytesseract
from PIL import Image
import re
import os

# Configurar o caminho do Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

print("🔍 Fazendo OCR na imagem cc_page_1.png...")

try:
    # Verificar se o arquivo existe
    if not os.path.exists('cc_page_1.png'):
        print("❌ Arquivo cc_page_1.png não encontrado!")
        exit(1)
    
    # Carregar a imagem
    img = Image.open('cc_page_1.png')
    print(f"📐 Dimensões da imagem: {img.size}")
    
    # Fazer OCR com diferentes configurações
    print("\n📝 Extraindo texto com OCR (português)...")
    try:
        text_por = pytesseract.image_to_string(img, lang='por')
    except:
        text_por = ""
        print("⚠️ Idioma português não disponível")
    
    print("\n📝 Extraindo texto com OCR (inglês)...")
    text_eng = pytesseract.image_to_string(img, lang='eng')
    
    print("\n📝 Extraindo texto com OCR (configuração padrão)...")
    text_default = pytesseract.image_to_string(img)
    
    # Combinar todos os textos
    all_texts = [(text_por, 'Português'), (text_eng, 'Inglês'), (text_default, 'Padrão')]
    
    for text, lang_name in all_texts:
        print(f"\n=== TEXTO EXTRAÍDO ({lang_name}) ===")
        print(f"Tamanho: {len(text)} caracteres")
        if text.strip():
            print("Primeiros 500 caracteres:")
            print(text[:500])
            print("=" * 50)
            
            # Procurar valor líquido
            print(f"\n🔍 Procurando valor líquido no texto {lang_name}...")
            
            patterns = [
                r'líquido[:\s]*([\d.,]+)',
                r'valor\s+líquido[:\s]*([\d.,]+)',
                r'total\s+líquido[:\s]*([\d.,]+)',
                r'([\d.,]+)\s*líquido',
                r'líquido[:\s]*r?\$?\s*([\d.,]+)',
                r'\b([\d]{1,3}(?:[.,]\d{3})*[.,]\d{2})\b',  # Formato monetário
                r'([\d]+[.,]\d{2})',  # Qualquer valor com 2 decimais
                r'([\d]{1,3}[.,]\d{3}[.,]\d{2})',  # Formato brasileiro
                r'([\d]+[.,]\d{2})',  # Valores simples
            ]
            
            valores_encontrados = []
            for j, pattern in enumerate(patterns, 1):
                matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
                if matches:
                    print(f"✅ Padrão {j}: {matches}")
                    valores_encontrados.extend(matches)
            
            if valores_encontrados:
                print(f"\n💰 VALORES ENCONTRADOS ({lang_name}): {valores_encontrados}")
                # Salvar o texto completo para análise
                with open(f'texto_ocr_{lang_name.lower()}.txt', 'w', encoding='utf-8') as f:
                    f.write(text)
                print(f"💾 Texto completo salvo em: texto_ocr_{lang_name.lower()}.txt")
            else:
                print(f"\n❌ Nenhum valor encontrado no texto {lang_name}")
        else:
            print(f"❌ Nenhum texto extraído com {lang_name}")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()