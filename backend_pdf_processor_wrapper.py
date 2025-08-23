#!/usr/bin/env python3
"""
Wrapper para backend_pdf_processor.py
Garante compatibilidade com Vercel e tratamento de erros robusto
"""

import sys
import os
import subprocess
import json

def main():
    # Configurar encoding para evitar problemas
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
    
    # Verificar se estamos no Vercel
    is_vercel = os.environ.get('VERCEL') == '1'
    
    # Determinar comando Python correto
    if is_vercel:
        python_cmd = 'python'
    else:
        python_cmd = 'python3'
    
    # Caminho para o script principal
    script_path = os.path.join(os.path.dirname(__file__), 'backend_pdf_processor.py')
    
    # Verificar se o script existe
    if not os.path.exists(script_path):
        print(f"ERRO: Script não encontrado: {script_path}")
        sys.exit(1)
    
    # Construir comando
    cmd = [python_cmd, script_path] + sys.argv[1:]
    
    try:
        print(f"Executando: {' '.join(cmd)}")
        print(f"Diretório atual: {os.getcwd()}")
        print(f"Script existe: {os.path.exists(script_path)}")
        
        # Executar com timeout e captura de erro
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutos
            cwd=os.path.dirname(__file__)
        )
        
        # Verificar se o arquivo CSV foi criado
        csv_path = os.path.join(os.path.dirname(__file__), 'resultados_ponto.csv')
        if os.path.exists(csv_path):
            print(f"✓ CSV criado com sucesso: {csv_path}")
            print(f"✓ Tamanho: {os.path.getsize(csv_path)} bytes")
        else:
            print(f"⚠️ CSV não encontrado em: {csv_path}")
            print(f"Arquivos no diretório: {os.listdir(os.path.dirname(__file__))}")
            
        # Verificar se o arquivo CSV foi criado no diretório de trabalho
        working_csv_path = 'resultados_ponto.csv'
        if os.path.exists(working_csv_path):
            print(f"✓ CSV também encontrado no diretório de trabalho: {working_csv_path}")
            print(f"✓ Tamanho: {os.path.getsize(working_csv_path)} bytes")
        else:
            print(f"⚠️ CSV não encontrado no diretório de trabalho: {working_csv_path}")
            print(f"Arquivos no diretório de trabalho: {os.listdir('.')}")
        
        # Imprimir saída
        if result.stdout:
            print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        # Retornar código de saída
        sys.exit(result.returncode)
        
    except subprocess.TimeoutExpired:
        print("ERRO: Timeout ao executar script")
        sys.exit(1)
    except Exception as e:
        print(f"ERRO: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
