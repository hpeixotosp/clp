#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wrapper para o Analisador de TRs e ETPs
Configura o ambiente Java antes da execução
"""

import os
import sys
import subprocess
from pathlib import Path

# Configurar encoding UTF-8
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def configurar_ambiente_java():
    """Configura as variáveis de ambiente Java"""
    java_home = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
    
    if os.path.exists(java_home):
        os.environ['JAVA_HOME'] = java_home
        os.environ['PATH'] = f"{java_home}\\bin;{os.environ.get('PATH', '')}"
        print(f"JAVA_HOME configurado: {java_home}")
        return True
    else:
        print(f"Java nao encontrado em: {java_home}")
        return False

def executar_analisador():
    """Executa o analisador principal"""
    try:
        # Configurar ambiente Java
        if not configurar_ambiente_java():
            return {"error": "Java não encontrado", "results": []}
        
        # Caminho para o script principal (versão segura)
        script_path = Path(__file__).parent / "analisador_tr_etp_safe.py"
        
        if not script_path.exists():
            return {"error": f"Script não encontrado: {script_path}", "results": []}
        
        # Executar o script principal com os mesmos argumentos
        cmd = ["python3", str(script_path)] + sys.argv[1:]
        
        print(f"Executando: {' '.join(cmd)}")
        
        # Executar e capturar saída
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='ascii',  # Forçar encoding ASCII
            errors='ignore',   # Ignorar erros de encoding
            env=os.environ.copy()
        )
        
        if result.returncode == 0:
            print("Script executado com sucesso")
            # SOLUÇÃO DEFINITIVA: Filtrar através do limpa_emojis.py
            limpa_cmd = [sys.executable, "limpa_emojis.py"]
            limpa = subprocess.run(
                limpa_cmd,
                input=result.stdout,
                capture_output=True,
                text=True,
                encoding='ascii',
                errors='ignore'
            )
            return limpa.stdout
        else:
            print(f"Erro na execucao: {result.stderr}")
            if result.stdout.strip():
                # SOLUÇÃO DEFINITIVA: Filtrar através do limpa_emojis.py
                limpa_cmd = [sys.executable, "limpa_emojis.py"]
                limpa = subprocess.run(
                    limpa_cmd,
                    input=result.stdout,
                    capture_output=True,
                    text=True,
                    encoding='ascii',
                    errors='ignore'
                )
                return limpa.stdout
            else:
                return {"error": f"Erro na execução: {result.stderr}", "results": []}
            
    except Exception as e:
        print(f"Erro no wrapper: {str(e)}")
        return {"error": f"Erro no wrapper: {str(e)}", "results": []}

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
