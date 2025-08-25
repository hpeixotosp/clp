import PyPDF2
import pytesseract
from PIL import Image
import fitz
import io
import re

print("🔍 Analisando arquivo cc.pdf...")

try:
    # Abrir o PDF
    doc = fitz.open('cc.pdf')
    page = doc[0]
    
    # Converter página para imagem
    pix = page.get_pixmap()
    img_data = pix.tobytes('png')
    img = Image.open(io.BytesIO(img_data))
    
    print("📄 Extraindo texto com OCR...")
    # Extrair texto com OCR
    text = pytesseract.image_to_string(img, lang='por')
    
    print("=== TEXTO EXTRAÍDO COM OCR ===")
    print(text)
    print("\n" + "="*50)
    
    print("\n🔍 PROCURANDO VALOR LÍQUIDO...")
    
    # Padrões para encontrar valor líquido
    liquido_patterns = [
        r'(?:valor\s+)?líquido[:\s]*([\d.,]+)',
        r'líquido[:\s]*r?\$?\s*([\d.,]+)',
        r'total\s+líquido[:\s]*([\d.,]+)',
        r'valor\s+líquido[:\s]*([\d.,]+)',
        r'líquido[:\s]*([\d.,]+)',
        r'([\d.,]+)\s*líquido'
    ]
    
    valores_encontrados = []
    
    for i, pattern in enumerate(liquido_patterns, 1):
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            print(f"✅ Padrão {i}: {matches}")
            valores_encontrados.extend(matches)
        else:
            print(f"❌ Padrão {i}: Nenhum match")
    
    if valores_encontrados:
        print(f"\n💰 VALORES LÍQUIDOS ENCONTRADOS: {valores_encontrados}")
    else:
        print("\n❌ Nenhum valor líquido encontrado")
        print("\n📝 Texto completo para análise manual:")
        print(repr(text))
    
    doc.close()
    
except Exception as e:
    print(f"❌ Erro: {e}")
    
# Tentar método alternativo sem OCR
print("\n🔄 Tentando extração de texto sem OCR...")
try:
    with open('cc.pdf', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        
    print("=== TEXTO EXTRAÍDO SEM OCR ===")
    print(text)
    print("\n" + "="*50)
    
    # Padrões para encontrar valor líquido
    liquido_patterns = [
        r'(?:valor\s+)?líquido[:\s]*([\d.,]+)',
        r'líquido[:\s]*r?\$?\s*([\d.,]+)',
        r'total\s+líquido[:\s]*([\d.,]+)',
        r'valor\s+líquido[:\s]*([\d.,]+)',
        r'líquido[:\s]*([\d.,]+)',
        r'([\d.,]+)\s*líquido'
    ]
    
    valores_encontrados = []
    
    print("\n🔍 PROCURANDO VALOR LÍQUIDO...")
    # Procurar valor líquido no texto extraído
    for i, pattern in enumerate(liquido_patterns, 1):
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            print(f"✅ Padrão {i}: {matches}")
            valores_encontrados.extend(matches)
        else:
            print(f"❌ Padrão {i}: Nenhum match")
    
    if valores_encontrados:
        print(f"\n💰 VALORES LÍQUIDOS ENCONTRADOS: {valores_encontrados}")
    else:
        print("\n❌ Nenhum valor líquido encontrado")
        print("\n📝 Texto completo para análise manual:")
        print(repr(text))

except Exception as e2:
    print(f"❌ Erro na extração alternativa: {e2}")