import re

# Texto do recibo como extraído pelo OCR
text = "Valor:R5.418,O"

print(f"Texto original: {repr(text)}")

# Testar diferentes padrões
patterns = [
    r'Valor:\s*R?\$?\s*(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2})',
    r'R\$?\s*([\d\.,O]+)',
    r'Valor:\s*([\d\.,O]+)',
    r'R\$?\s*(\d[\d\.,O]*)',
    r'Valor:R([\d\.,O]+)'
]

for i, pattern in enumerate(patterns):
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        valor_bruto = match.group(1)
        valor_corrigido = valor_bruto.replace('O', '0').replace('l', '1').replace('I', '1')
        print(f"Padrão {i+1}: '{pattern}' -> '{valor_bruto}' -> '{valor_corrigido}'")
    else:
        print(f"Padrão {i+1}: '{pattern}' -> Não encontrado")

# Testar com texto mais completo
text_completo = """BancoItati-ComprovantedeTransfer6ncia
decontacorrenteparacontacorrente
Identificagaonoextrato:SISPAGSALARIOS
Dadosdacontadebitada:
Nomedaempresa:TECHCOMTECNOLOGIAEINFORMATI
Agncia:5325 Contacorrente:18611-1
Dadosdacontacreditada:
Nome:ADRIANOCOSTADESOUZAROQUE
Agncia:9314 Contacorrente:4487-6
Valor:R5.418,O
Informagdesfornecidaspelo"""

print("\n=== TESTE COM TEXTO COMPLETO ===")
for i, pattern in enumerate(patterns):
    match = re.search(pattern, text_completo, re.IGNORECASE)
    if match:
        valor_bruto = match.group(1)
        valor_corrigido = valor_bruto.replace('O', '0').replace('l', '1').replace('I', '1')
        print(f"Padrão {i+1}: '{valor_bruto}' -> '{valor_corrigido}'")
    else:
        print(f"Padrão {i+1}: Não encontrado")