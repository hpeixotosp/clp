#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wrapper para o Analisador de Propostas
Configura o ambiente e executa o script de análise de propostas
"""

import os
import sys
import subprocess
from pathlib import Path

def configurar_ambiente():
    """Configura as variáveis de ambiente necessárias"""
    # Se estivermos no Vercel, o Python já está configurado
    is_vercel = os.environ.get('VERCEL') == '1' or os.environ.get('NODE_ENV') == 'production'
    
    if is_vercel:
        # No Vercel, usar python diretamente
        python_cmd = "python"
    else:
        # Localmente, usar python3
        python_cmd = "python3"
    
    return python_cmd

def executar_analisador():
    """Executa o analisador de propostas"""
    try:
        # Configurar comando Python
        python_cmd = configurar_ambiente()
        
        # Caminho para o script principal
        script_path = Path(__file__).parent.parent / "analisador_proposta.py"
        
        if not script_path.exists():
            return {"error": f"Script não encontrado: {script_path}"}
        
        # Executar o script principal com os mesmos argumentos
        cmd = [python_cmd, str(script_path)] + sys.argv[1:]
        
        print(f"Executando: {' '.join(cmd)}", file=sys.stderr)
        
        # Executar e capturar saída
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            env=os.environ.copy()
        )
        
        if result.returncode == 0:
            return result.stdout
        else:
            print(f"Erro na execução: {result.stderr}", file=sys.stderr)
            return {"error": f"Erro na execução: {result.stderr}"}
            
    except Exception as e:
        print(f"Erro no wrapper: {str(e)}", file=sys.stderr)
        return {"error": f"Erro no wrapper: {str(e)}"}

if __name__ == "__main__":
    # Executar e imprimir resultado
    resultado = executar_analisador()
    
    # Se for string (saída do script), imprimir diretamente
    if isinstance(resultado, str):
        print(resultado)
    else:
        # Se for dict (erro), imprimir como JSON
        import json
        print(json.dumps(resultado, ensure_ascii=False))
