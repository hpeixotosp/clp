#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import PyPDF2
import fitz  # PyMuPDF
from pathlib import Path

def extract_text_pypdf2(pdf_path):
    """Extrai texto usando PyPDF2"""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Erro PyPDF2: {e}", file=sys.stderr)
        return ""

def extract_text_pymupdf(pdf_path):
    """Extrai texto usando PyMuPDF"""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text
    except Exception as e:
        print(f"Erro PyMuPDF: {e}", file=sys.stderr)
        return ""

def main():
    if len(sys.argv) < 2:
        print("Uso: python test_pdf_extraction.py <arquivo.pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(f"Arquivo não encontrado: {pdf_path}")
        sys.exit(1)
    
    print(f"=== Testando extração de texto de: {pdf_path} ===")
    
    # Teste com PyPDF2
    print("\n--- PyPDF2 ---")
    text_pypdf2 = extract_text_pypdf2(pdf_path)
    print(f"Tamanho do texto: {len(text_pypdf2)} caracteres")
    print("Primeiras 500 caracteres:")
    print(repr(text_pypdf2[:500]))
    
    # Teste com PyMuPDF
    print("\n--- PyMuPDF ---")
    text_pymupdf = extract_text_pymupdf(pdf_path)
    print(f"Tamanho do texto: {len(text_pymupdf)} caracteres")
    print("Primeiras 500 caracteres:")
    print(repr(text_pymupdf[:500]))
    
    # Buscar padrões de nome
    print("\n--- Buscando padrões de nome ---")
    import re
    
    patterns = [
        r'(?:nome|colaborador|funcionário|servidor)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'Nome\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'NOME\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)(?=\s*(?:CPF|RG|Matrícula))',
        r'^\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)\s*$',
        r'(?:Funcionário|Servidor|Empregado)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+)',
    ]
    
    for i, pattern in enumerate(patterns, 1):
        print(f"\nPadrão {i}: {pattern}")
        matches = re.findall(pattern, text_pymupdf, re.MULTILINE | re.IGNORECASE)
        if matches:
            print(f"Encontrados: {matches}")
        else:
            print("Nenhum match encontrado")

if __name__ == "__main__":
    main()