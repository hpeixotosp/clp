import backend_pdf_processor
import re

# Extrair texto do recibo
processor = backend_pdf_processor.PontoProcessor()
text = processor.extract_text_with_ocr('recibo.pdf')

print("=== TEXTO COMPLETO DO RECIBO ===")
print(repr(text))

print("\n=== PROCURANDO VALOR ===")
# Procurar linhas com "valor"
valores = re.findall(r'[Vv]alor[^\n]*', text)
print('Linhas com "valor":', valores)

# Procurar todos os números no formato brasileiro
valores_num = re.findall(r'\d[\d\.,]+\d', text)
print('Todos os números encontrados:', valores_num)

# Procurar especificamente após R$
valores_rs = re.findall(r'R\$?\s*([\d\.,]+)', text)
print('Valores após R$:', valores_rs)

# Testar padrão específico para formato brasileiro
padrao_brasileiro = r'R\$?\s*(\d{1,3}(?:[\.,]\d{3})*[\.,]\d{2})'
valores_br = re.findall(padrao_brasileiro, text)
print('Valores formato brasileiro:', valores_br)