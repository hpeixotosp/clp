import sys
sys.path.append('.')
from processador_contracheque import extract_text_from_pdf, extract_valores

# Extrair texto do contracheque
text = extract_text_from_pdf('cc.pdf')
print('=== TEXTO DO CONTRACHEQUE (primeiras 2000 chars) ===')
print(text[:2000])

# Extrair valores
valores = extract_valores(text)
print('\n=== VALORES EXTRAÍDOS ===')
print(f'Vencimentos: {valores.get("vencimentos", "N/A")}')
print(f'Descontos: {valores.get("descontos", "N/A")}')
print(f'Líquido: {valores.get("liquido", "N/A")}')

# Procurar por linhas com valores
print('\n=== LINHAS COM VALORES ===')
for i, linha in enumerate(text.split('\n')):
    if any(char.isdigit() for char in linha) and (',' in linha or '.' in linha):
        if len(linha.strip()) > 0:
            print(f'Linha {i+1}: {linha.strip()}')