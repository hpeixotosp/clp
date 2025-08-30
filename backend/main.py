from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import sys
from pathlib import Path
import tempfile
import shutil
import json
from typing import List, Dict, Any

# Adicionar o diretório pai ao path para importar os módulos Python existentes
sys.path.append(str(Path(__file__).parent.parent))

# Importar os processadores existentes
from processador_contracheque import processar_arquivo_contracheque
from analisador_proposta import analisar_proposta
from analisador_tr_etp import analisar_tr_etp
from analisador_tr import analisar_tr

app = FastAPI(
    title="CLP Manager API",
    description="API para processamento de documentos e análise de dados",
    version="1.0.0"
)

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trt21-clp-manager.vercel.app",  # Frontend na Vercel
        "http://localhost:3000",  # Desenvolvimento local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CLP Manager API - Backend Python Independente"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CLP Manager API"}

@app.post("/api/process-contracheques")
async def process_contracheques(files: List[UploadFile] = File(...)):
    """
    Processa contracheques enviados pelo frontend
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
        
        results = []
        
        for file in files:
            try:
                # Criar arquivo temporário
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                    shutil.copyfileobj(file.file, temp_file)
                    temp_path = temp_file.name
                
                # Processar arquivo usando o processador existente
                resultado = processar_arquivo_contracheque(temp_path)
                
                # Limpar arquivo temporário
                os.unlink(temp_path)
                
                results.append({
                    "status": "sucesso",
                    "dados": resultado
                })
                
            except Exception as e:
                results.append({
                    "status": "erro",
                    "erro": str(e),
                    "dados": None
                })
        
        return {
            "success": True,
            "resultados": results,
            "message": f"Processamento concluído. {len([r for r in results if r['status'] == 'sucesso'])} de {len(results)} arquivo(s) processado(s) com sucesso."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@app.post("/api/analise-proposta")
async def analise_proposta(file: UploadFile = File(...)):
    """
    Analisa proposta enviada pelo frontend
    """
    try:
        # Criar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Processar arquivo usando o analisador existente
        resultado = analisar_proposta(temp_path)
        
        # Limpar arquivo temporário
        os.unlink(temp_path)
        
        return {
            "success": True,
            "resultado": resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@app.post("/api/analise-tr")
async def analise_tr(file: UploadFile = File(...)):
    """
    Analisa TR enviado pelo frontend
    """
    try:
        # Criar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Processar arquivo usando o analisador existente
        resultado = analisar_tr(temp_path)
        
        # Limpar arquivo temporário
        os.unlink(temp_path)
        
        return {
            "success": True,
            "resultado": resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@app.post("/api/analise-tr-etp")
async def analise_tr_etp(file: UploadFile = File(...)):
    """
    Analisa TR ETP enviado pelo frontend
    """
    try:
        # Criar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Processar arquivo usando o analisador existente
        resultado = analisar_tr_etp(temp_path)
        
        # Limpar arquivo temporário
        os.unlink(temp_path)
        
        return {
            "success": True,
            "resultado": resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )