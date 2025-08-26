import fitz

# Abrir e extrair texto do recibo
doc = fitz.open('recibo.pdf')
text = doc[0].get_text()

print('TEXTO COMPLETO DO RECIBO:')
print('=' * 50)
print(text)
print('=' * 50)

print('\n\nLINHAS DO TEXTO:')
print('=' * 30)
for i, linha in enumerate(text.split('\n'), 1):
    print(f'{i:2d}: {repr(linha)}')

doc.close()