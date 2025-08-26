#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste para verificar o funcionamento do processador_contracheque.py
"""

import sys
import json
import subprocess
import os
from pathlib import Path

def test_processador_contracheque():
    """
    Testa o processador_contracheque.py com arquivos de exemplo
    """
    print("=== TESTE DO PROCESSADOR DE CONTRACHEQUES ===")
    
    # Verificar se o script existe
    script_path = "processador_contracheque.py"
    if not os.path.exists(script_path):
        print(f"❌ Script não encontrado: {script_path}")
        return
    
    print(f"✅ Script encontrado: {script_path}")
    
    # Procurar por arquivos PDF de contracheque no diretório
    pdf_files = []
    for file in os.listdir('.'):
        if file.endswith('.pdf') and ('contracheque' in file.lower() or 'cc' in file.lower()):
            pdf_files.append(file)
    
    if not pdf_files:
        print("❌ Nenhum arquivo PDF de contracheque encontrado")
        print("Procurando por qualquer arquivo PDF...")
        pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]
        if pdf_files:
            print(f"📄 PDFs encontrados: {pdf_files[:3]}")
            pdf_files = pdf_files[:1]  # Usar apenas o primeiro
        else:
            print("❌ Nenhum arquivo PDF encontrado")
            return
    
    print(f"📄 Testando com arquivos: {pdf_files}")
    
    # Executar o processador
    try:
        cmd = ["python", script_path] + pdf_files
        print(f"🚀 Executando: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        print(f"📤 Código de retorno: {result.returncode}")
        
        if result.stdout:
            print("📤 STDOUT:")
            print(result.stdout)
            
            # Tentar parsear como JSON
            try:
                json_result = json.loads(result.stdout)
                print("✅ JSON válido retornado")
                print(f"📊 Resultados: {len(json_result)} item(s)")
                
                for i, item in enumerate(json_result):
                    print(f"  Item {i+1}:")
                    print(f"    Colaborador: {item.get('colaborador', 'N/A')}")
                    print(f"    Mês: {item.get('mesReferencia', 'N/A')}")
                    print(f"    Status: {item.get('status', 'N/A')}")
                    print(f"    Vencimentos: {item.get('vencimentos', 'N/A')}")
                    print(f"    Descontos: {item.get('descontos', 'N/A')}")
                    print(f"    Líquido: {item.get('liquido', 'N/A')}")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Erro ao parsear JSON: {e}")
                print("📝 Conteúdo bruto:")
                print(repr(result.stdout))
        
        if result.stderr:
            print("📤 STDERR:")
            print(result.stderr)
            
    except subprocess.TimeoutExpired:
        print("❌ Timeout na execução")
    except Exception as e:
        print(f"❌ Erro na execução: {e}")

def test_backend_pdf_processor():
    """
    Testa o backend_pdf_processor.py diretamente
    """
    print("\n=== TESTE DO BACKEND PDF PROCESSOR ===")
    
    try:
        import backend_pdf_processor
        
        # Procurar por arquivos PDF
        pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]
        if not pdf_files:
            print("❌ Nenhum arquivo PDF encontrado")
            return
            
        pdf_file = pdf_files[0]
        print(f"📄 Testando com: {pdf_file}")
        
        # Criar processador
        processor = backend_pdf_processor.PontoProcessor()
        
        # Testar extração de texto
        print("🔍 Testando extração de texto...")
        text = processor.extract_text_from_pdf(pdf_file)
        print(f"📝 Texto extraído: {len(text)} caracteres")
        
        if len(text) > 0:
            print(f"📝 Primeiros 200 caracteres: {repr(text[:200])}")
        else:
            print("❌ Nenhum texto extraído")
            
        # Testar OCR se disponível
        print("🔍 Testando OCR...")
        try:
            ocr_text = processor.extract_text_with_ocr(pdf_file)
            print(f"📝 Texto OCR: {len(ocr_text)} caracteres")
            
            if len(ocr_text) > 0:
                print(f"📝 Primeiros 200 caracteres OCR: {repr(ocr_text[:200])}")
            else:
                print("❌ Nenhum texto extraído via OCR")
        except Exception as e:
            print(f"❌ Erro no OCR: {e}")
            
    except ImportError as e:
        print(f"❌ Erro ao importar backend_pdf_processor: {e}")
    except Exception as e:
        print(f"❌ Erro no teste: {e}")

if __name__ == "__main__":
    test_processador_contracheque()
    test_backend_pdf_processor()
    print("\n=== TESTE CONCLUÍDO ===")