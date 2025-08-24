#!/usr/bin/env python3
"""
Wrapper robusto para o Analisador de Propostas
Garante compatibilidade com Railway e tratamento de erros robusto
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def main():
    # Configurar encoding para evitar problemas
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
    
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
        print(json.dumps({"error": "Python não encontrado no sistema. Tentei: " + ", ".join(python_cmds)}))
        sys.exit(1)
    
    # Caminho para o script principal
    script_path = os.path.join(os.path.dirname(__file__), 'analisador_proposta.py')
    
    # Verificar se o script existe
    if not os.path.exists(script_path):
        print(json.dumps({"error": f"Script não encontrado: {script_path}"}))
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
            encoding='utf-8'
        )
        
        # Imprimir logs de debug no stderr (não interferem com a resposta)
        if result.stdout:
            print("STDOUT:", result.stdout, file=sys.stderr)
        if result.stderr:
            print("STDERR:", result.stderr, file=sys.stderr)
        
        # Se executou com sucesso, imprimir resultado JSON no stdout
        if result.returncode == 0:
            # Verificar se a saída é JSON válido
            try:
                # Tentar fazer parse do JSON para validar
                json.loads(result.stdout)
                # Se chegou aqui, é JSON válido - imprimir no stdout
                print(result.stdout)
            except json.JSONDecodeError:
                # Se não for JSON válido, retornar erro
                print(json.dumps({"error": "Script Python não retornou JSON válido", "output": result.stdout}))
                sys.exit(1)
        else:
            # Se falhou, retornar erro com detalhes
            error_msg = result.stderr if result.stderr else "Erro desconhecido na execução"
            print(json.dumps({"error": f"Erro na execução: {error_msg}"}))
        
        # Retornar código de saída
        sys.exit(result.returncode)
        
    except subprocess.TimeoutExpired:
        print(json.dumps({"error": "Timeout ao executar script"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Erro no wrapper: {e}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
