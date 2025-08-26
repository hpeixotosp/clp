import fitz

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ''
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return f"Erro ao extrair texto: {e}"

if __name__ == "__main__":
    pdf_path = r"c:\ia\trae\clp\temp\2025_07-TRT RN-ContrachequeSalario-AndreLuizDaCostaBraz-Pagamento.pdf"
    text = extract_text_from_pdf(pdf_path)
    
    print("TEXTO EXTRAÍDO DO RECIBO:")
    print("=" * 50)
    if text and text.strip():
        print(text[:1500])
        print("\n" + "=" * 50)
        print(f"Total de caracteres: {len(text)}")
    else:
        print("Nenhum texto encontrado - PDF pode ser apenas imagem")