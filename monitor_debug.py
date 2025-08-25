import os
import time
import glob

print("🔍 Monitorando criação de arquivos de debug...")
print("📁 Diretório atual:", os.getcwd())

# Listar arquivos debug existentes
existing_files = set(glob.glob("debug_texto_*.txt"))
print(f"📋 Arquivos debug existentes: {len(existing_files)}")

while True:
    current_files = set(glob.glob("debug_texto_*.txt"))
    new_files = current_files - existing_files
    
    if new_files:
        for file in new_files:
            print(f"🆕 Novo arquivo debug criado: {file}")
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()[:500]  # Primeiros 500 chars
                print(f"📄 Conteúdo (500 chars): {repr(content)}")
            except Exception as e:
                print(f"❌ Erro ao ler {file}: {e}")
        existing_files = current_files
    
    time.sleep(2)