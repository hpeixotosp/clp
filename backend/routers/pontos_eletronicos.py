from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
import subprocess
import json

from database.connection import get_db
from database.models import PontoEletronico as PontoEletronicoModel
from schemas.pontos_eletronicos import (
    PontoEletronico,
    PontoEletronicoCreate,
    PontoEletronicoUpdate,
    PontoEletronicoFilter,
    PontoEletronicoStats
)
from schemas.common import APIResponse
from services.pdf_processor import PDFProcessorService

router = APIRouter()

@router.get("/", response_model=APIResponse)
async def get_pontos_eletronicos(
    colaborador: Optional[str] = None,
    periodo: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Buscar pontos eletrônicos com filtros opcionais"""
    try:
        query = db.query(PontoEletronicoModel)
        
        if colaborador:
            query = query.filter(PontoEletronicoModel.colaborador.ilike(f"%{colaborador}%"))
        
        if periodo:
            query = query.filter(PontoEletronicoModel.periodo.ilike(f"%{periodo}%"))
        
        total = query.count()
        pontos = query.offset(offset).limit(limit).all()
        
        return APIResponse(
            success=True,
            message=f"{len(pontos)} pontos eletrônicos encontrados",
            data={
                "pontos": pontos,
                "total": total,
                "limit": limit,
                "offset": offset
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=APIResponse)
async def create_ponto_eletronico(
    ponto: PontoEletronicoCreate,
    db: Session = Depends(get_db)
):
    """Criar um novo ponto eletrônico"""
    try:
        # Verificar se já existe um registro para o mesmo colaborador e período
        existing = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.colaborador == ponto.colaborador,
            PontoEletronicoModel.periodo == ponto.periodo
        ).first()
        
        if existing:
            # Atualizar registro existente
            for field, value in ponto.dict().items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            
            return APIResponse(
                success=True,
                message="Ponto eletrônico atualizado com sucesso",
                data=existing
            )
        else:
            # Criar novo registro
            db_ponto = PontoEletronicoModel(**ponto.dict())
            db.add(db_ponto)
            db.commit()
            db.refresh(db_ponto)
            
            return APIResponse(
                success=True,
                message="Ponto eletrônico criado com sucesso",
                data=db_ponto
            )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=APIResponse)
async def delete_all_pontos_eletronicos(db: Session = Depends(get_db)):
    """Deletar todos os pontos eletrônicos"""
    try:
        count = db.query(PontoEletronicoModel).count()
        db.query(PontoEletronicoModel).delete()
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"{count} pontos eletrônicos removidos com sucesso"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=APIResponse)
async def get_pontos_stats(db: Session = Depends(get_db)):
    """Obter estatísticas dos pontos eletrônicos"""
    try:
        total = db.query(PontoEletronicoModel).count()
        com_assinatura = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.assinatura == "OK"
        ).count()
        sem_assinatura = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.assinatura == "Pendente"
        ).count()
        saldo_positivo = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.saldo_minutos > 0
        ).count()
        saldo_negativo = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.saldo_minutos < 0
        ).count()
        saldo_zero = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.saldo_minutos == 0
        ).count()
        
        stats = PontoEletronicoStats(
            total=total,
            com_assinatura=com_assinatura,
            sem_assinatura=sem_assinatura,
            saldo_positivo=saldo_positivo,
            saldo_negativo=saldo_negativo,
            saldo_zero=saldo_zero
        )
        
        return APIResponse(
            success=True,
            message="Estatísticas obtidas com sucesso",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-pdfs", response_model=APIResponse)
async def process_frequency_pdfs_endpoint(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Processar PDFs de frequência"""
    try:
        # Validar arquivos
        for file in files:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(
                    status_code=400,
                    detail=f"Arquivo {file.filename} não é um PDF válido"
                )
        
        # Processar PDFs usando o serviço
        pdf_processor = PDFProcessorService()
        
        # Converter UploadFile para bytes
        file_contents = []
        filenames = []
        for file in files:
            content = await file.read()
            file_contents.append(content)
            filenames.append(file.filename)
        
        processing_result = await pdf_processor.process_frequency_pdfs(file_contents, filenames)
        results = processing_result.get('data', [])
        
        # Salvar resultados no banco de dados
        saved_count = 0
        for result in results:
            try:
                ponto_data = PontoEletronicoCreate(**result)
                
                # Verificar se já existe
                existing = db.query(PontoEletronicoModel).filter(
                    PontoEletronicoModel.colaborador == ponto_data.colaborador,
                    PontoEletronicoModel.periodo == ponto_data.periodo
                ).first()
                
                if existing:
                    # Atualizar
                    for field, value in ponto_data.dict().items():
                        setattr(existing, field, value)
                else:
                    # Criar novo
                    db_ponto = PontoEletronicoModel(**ponto_data.dict())
                    db.add(db_ponto)
                
                saved_count += 1
            except Exception as e:
                print(f"Erro ao salvar resultado: {e}")
                continue
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"{saved_count} pontos eletrônicos processados e salvos com sucesso",
            data={
                "total_processados": len(results),
                "total_salvos": saved_count,
                "resultados": results
            }
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ponto_id}", response_model=APIResponse)
async def get_ponto_eletronico(ponto_id: int, db: Session = Depends(get_db)):
    """Buscar um ponto eletrônico específico"""
    try:
        ponto = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.id == ponto_id
        ).first()
        
        if not ponto:
            raise HTTPException(status_code=404, detail="Ponto eletrônico não encontrado")
        
        return APIResponse(
            success=True,
            message="Ponto eletrônico encontrado",
            data=ponto
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{ponto_id}", response_model=APIResponse)
async def update_ponto_eletronico(
    ponto_id: int,
    ponto_update: PontoEletronicoUpdate,
    db: Session = Depends(get_db)
):
    """Atualizar um ponto eletrônico"""
    try:
        ponto = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.id == ponto_id
        ).first()
        
        if not ponto:
            raise HTTPException(status_code=404, detail="Ponto eletrônico não encontrado")
        
        # Atualizar apenas campos fornecidos
        update_data = ponto_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ponto, field, value)
        
        db.commit()
        db.refresh(ponto)
        
        return APIResponse(
            success=True,
            message="Ponto eletrônico atualizado com sucesso",
            data=ponto
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{ponto_id}", response_model=APIResponse)
async def delete_ponto_eletronico(ponto_id: int, db: Session = Depends(get_db)):
    """Deletar um ponto eletrônico específico"""
    try:
        ponto = db.query(PontoEletronicoModel).filter(
            PontoEletronicoModel.id == ponto_id
        ).first()
        
        if not ponto:
            raise HTTPException(status_code=404, detail="Ponto eletrônico não encontrado")
        
        db.delete(ponto)
        db.commit()
        
        return APIResponse(
            success=True,
            message="Ponto eletrônico removido com sucesso"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))