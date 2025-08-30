import os
import subprocess
import json
import tempfile
from typing import List, Dict, Any
from pathlib import Path

class PDFProcessorService:
    """Serviço para processamento de PDFs de frequência"""
    
    def __init__(self, python_scripts_dir: str = None):
        self.python_scripts_dir = python_scripts_dir or os.getenv('PYTHON_SCRIPTS_DIR', './scripts')
        self.temp_dir = os.getenv('TEMP_FILES_DIR', './temp')
        
        # Garantir que os diretórios existam
        Path(self.temp_dir).mkdir(parents=True, exist_ok=True)
    
    async def process_frequency_pdfs(self, files: List[bytes], filenames: List[str]) -> Dict[str, Any]:
        """Processar PDFs de frequência usando o script Python existente"""
        try:
            # Criar diretório temporário para os arquivos
            with tempfile.TemporaryDirectory(dir=self.temp_dir) as temp_dir:
                temp_files = []
                
                # Salvar arquivos temporariamente
                for i, (file_content, filename) in enumerate(zip(files, filenames)):
                    temp_file_path = os.path.join(temp_dir, f"file_{i}_{filename}")
                    with open(temp_file_path, 'wb') as f:
                        f.write(file_content)
                    temp_files.append(temp_file_path)
                
                # Executar script de processamento
                script_path = os.path.join(self.python_scripts_dir, 'process_frequency.py')
                
                if not os.path.exists(script_path):
                    raise FileNotFoundError(f"Script de processamento não encontrado: {script_path}")
                
                # Preparar comando
                cmd = [
                    'python',
                    script_path,
                    '--input-dir', temp_dir,
                    '--output-format', 'json'
                ]
                
                # Executar script
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minutos timeout
                )
                
                if result.returncode != 0:
                    raise Exception(f"Erro no processamento: {result.stderr}")
                
                # Parsear resultado
                try:
                    processed_data = json.loads(result.stdout)
                except json.JSONDecodeError:
                    # Se não for JSON, assumir que é texto simples
                    processed_data = {
                        'success': True,
                        'message': result.stdout,
                        'data': []
                    }
                
                return processed_data
                
        except subprocess.TimeoutExpired:
            raise Exception("Timeout no processamento dos PDFs")
        except Exception as e:
            raise Exception(f"Erro no processamento dos PDFs: {str(e)}")
    
    async def process_contracheque_pdfs(self, files: List[bytes], filenames: List[str]) -> Dict[str, Any]:
        """Processar PDFs de contracheques usando o script Python existente"""
        try:
            # Criar diretório temporário para os arquivos
            with tempfile.TemporaryDirectory(dir=self.temp_dir) as temp_dir:
                temp_files = []
                
                # Salvar arquivos temporariamente
                for i, (file_content, filename) in enumerate(zip(files, filenames)):
                    temp_file_path = os.path.join(temp_dir, f"file_{i}_{filename}")
                    with open(temp_file_path, 'wb') as f:
                        f.write(file_content)
                    temp_files.append(temp_file_path)
                
                # Executar script de processamento
                script_path = os.path.join(self.python_scripts_dir, 'process_contracheques.py')
                
                if not os.path.exists(script_path):
                    raise FileNotFoundError(f"Script de processamento não encontrado: {script_path}")
                
                # Preparar comando
                cmd = [
                    'python',
                    script_path,
                    '--input-dir', temp_dir,
                    '--output-format', 'json'
                ]
                
                # Executar script
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minutos timeout
                )
                
                if result.returncode != 0:
                    raise Exception(f"Erro no processamento: {result.stderr}")
                
                # Parsear resultado
                try:
                    processed_data = json.loads(result.stdout)
                except json.JSONDecodeError:
                    # Se não for JSON, assumir que é texto simples
                    processed_data = {
                        'success': True,
                        'message': result.stdout,
                        'data': []
                    }
                
                return processed_data
                
        except subprocess.TimeoutExpired:
            raise Exception("Timeout no processamento dos PDFs")
        except Exception as e:
            raise Exception(f"Erro no processamento dos PDFs: {str(e)}")
    
    def validate_pdf_file(self, file_content: bytes, filename: str) -> bool:
        """Validar se o arquivo é um PDF válido"""
        try:
            # Verificar extensão
            if not filename.lower().endswith('.pdf'):
                return False
            
            # Verificar cabeçalho PDF
            if not file_content.startswith(b'%PDF-'):
                return False
            
            return True
        except Exception:
            return False
    
    def get_file_info(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Obter informações do arquivo"""
        return {
            'filename': filename,
            'size': len(file_content),
            'is_valid_pdf': self.validate_pdf_file(file_content, filename)
        }