#!/usr/bin/env python3
"""
Wrapper para backend_pdf_processor.py
Garante compatibilidade com Railway e tratamento de erros robusto
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
    
    # Testar comandos Python disponíveis (Windows primeiro)
    if os.name == 'nt':  # Windows
        python_cmds = ['python', 'python3', 'py']
    else:  # Unix/Linux
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
    script_path = os.path.join(os.path.dirname(__file__), 'backend_pdf_processor.py')
    
    # Verificar se o script existe
    if not os.path.exists(script_path):
        print(json.dumps({"error": f"Script não encontrado: {script_path}"}))
        sys.exit(1)
    
    # Construir comando com argumentos corretos
    # O script espera: --pdfs arquivo1.pdf arquivo2.pdf --output nome.csv
    cmd = [python_cmd, script_path, '--pdfs'] + sys.argv[1:-2] + ['--output', sys.argv[-1]]
    
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
            cwd=os.path.dirname(__file__)
        )
        
        # Imprimir logs de debug no stderr (não interferem com a resposta)
        if result.stdout:
            print("STDOUT:", result.stdout, file=sys.stderr)
        if result.stderr:
            print("STDERR:", result.stderr, file=sys.stderr)
        
        # Se executou com sucesso, verificar se o CSV foi criado
        if result.returncode == 0:
            # Verificar se o arquivo CSV foi criado
            csv_path = sys.argv[-1]  # Último argumento é o caminho do CSV
            if os.path.exists(csv_path):
                print(f"✓ CSV criado com sucesso: {csv_path}", file=sys.stderr)
                print(f"✓ Tamanho: {os.path.getsize(csv_path)} bytes", file=sys.stderr)
                
                # Ler e retornar o conteúdo do CSV
                try:
                    with open(csv_path, 'r', encoding='utf-8') as f:
                        csv_content = f.read()
                    print(json.dumps({"success": True, "csvContent": csv_content}))
                except Exception as e:
                    print(json.dumps({"error": f"Erro ao ler CSV: {e}"}))
                    sys.exit(1)
            else:
                print(f"⚠️ CSV não encontrado em: {csv_path}", file=sys.stderr)
                print(json.dumps({"error": f"CSV não foi criado: {csv_path}"}))
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
