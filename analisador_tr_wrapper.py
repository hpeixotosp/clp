#!/usr/bin/env python3
"""
Wrapper robusto para o Analisador de TRs e ETPs
Garante compatibilidade com Vercel e tratamento de erros robusto
"""

import sys
import os
import subprocess
import json
from pathlib import Path

def main():
    # Configurar encoding para evitar problemas
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
    
    # Verificar se estamos no Vercel
    is_vercel = os.environ.get('VERCEL') == '1'
    
    # Testar comandos Python disponíveis
    python_cmds = ['python3', 'python', '/usr/bin/python3', '/usr/bin/python']
    python_cmd = None
    
    for cmd in python_cmds:
        try:
            test_result = subprocess.run([cmd, '--version'], capture_output=True, text=True)
            if test_result.returncode == 0:
                python_cmd = cmd
                print(f"✓ Python encontrado: {cmd} - {test_result.stdout.strip()}", file=sys.stderr)
                break
        except:
            continue
    
    if not python_cmd:
        print(json.dumps({"error": "Python não encontrado no sistema. Tentei: " + ", ".join(python_cmds), "results": []}))
        sys.exit(1)
    
    # Caminho para o script principal
    script_path = os.path.join(os.path.dirname(__file__), 'analisador_tr_etp_safe.py')
    
    # Verificar se o script existe
    if not os.path.exists(script_path):
        print(json.dumps({"error": f"Script não encontrado: {script_path}", "results": []}))
        sys.exit(1)
    
    # Construir comando
    cmd = [python_cmd, script_path] + sys.argv[1:]
    
    try:
        print(f"Executando: {' '.join(cmd)}", file=sys.stderr)
        print(f"Diretório atual: {os.getcwd()}", file=sys.stderr)
        print(f"Script existe: {os.path.exists(script_path)}", file=sys.stderr)
        
        # Executar com timeout e captura de erro
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutos
            cwd=os.path.dirname(__file__),
            encoding='utf-8',
            errors='ignore'
        )
        
        # Imprimir saída
        if result.stdout:
            print("STDOUT:", result.stdout, file=sys.stderr)
        if result.stderr:
            print("STDERR:", result.stderr, file=sys.stderr)
        
        # Se executou com sucesso, filtrar emojis através do limpa_emojis.py
        if result.returncode == 0:
            limpa_script = os.path.join(os.path.dirname(__file__), 'limpa_emojis.py')
            if os.path.exists(limpa_script):
                print("✓ Executando limpeza de emojis", file=sys.stderr)
                limpa_cmd = [python_cmd, limpa_script]
                limpa_result = subprocess.run(
                    limpa_cmd,
                    input=result.stdout,
                    capture_output=True,
                    text=True,
                    encoding='ascii',
                    errors='ignore'
                )
                print(limpa_result.stdout)
            else:
                # Se não tiver o limpa_emojis, fazer limpeza básica
                output_limpo = result.stdout.encode('ascii', errors='ignore').decode('ascii')
                print(output_limpo)
        else:
            print(json.dumps({"error": f"Erro na execução: {result.stderr}", "results": []}))
        
        # Retornar código de saída
        sys.exit(result.returncode)
        
    except subprocess.TimeoutExpired:
        print(json.dumps({"error": "Timeout ao executar script", "results": []}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Erro no wrapper: {e}", "results": []}))
        sys.exit(1)

if __name__ == "__main__":
    main()
