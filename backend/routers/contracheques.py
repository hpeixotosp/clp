from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database.connection import get_db
from database.models import Contracheque as ContrachequeModel
from schemas.contracheques import (
    Contracheque,
    ContrachequeCreate,
    ContrachequeUpdate,
    ContrachequeProcessResult,
    ContrachequeProcessResponse
)
from schemas.common import APIResponse, FileUploadResponse
from services.pdf_processor import PDFProcessorService

router = APIRouter()
pdf_service = PDFProcessorService()

@router.get("/", response_model=APIResponse)
async def get_contracheques(
    colaborador: Optional[str] = None,
    periodo: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Buscar contracheques com filtros opcionais"""
    try:
        query = db.query(ContrachequeModel)
        
        if colaborador:
            query = query.filter(ContrachequeModel.colaborador.ilike(f"%{colaborador}%"))
        
        if periodo:
            query = query.filter(ContrachequeModel.periodo == periodo)
        
        contracheques = query.offset(skip).limit(limit).all()
        total = query.count()
        
        return APIResponse(
            success=True,
            message=f"{len(contracheques)} contracheques encontrados",
            data={
                "contracheques": contracheques,
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=APIResponse)
async def create_contracheque(
    contracheque: ContrachequeCreate,
    db: Session = Depends(get_db)
):
    """Criar um novo contracheque"""
    try:
        db_contracheque = ContrachequeModel(**contracheque.dict())
        db.add(db_contracheque)
        db.commit()
        db.refresh(db_contracheque)
        
        return APIResponse(
            success=True,
            message="Contracheque criado com sucesso",
            data=db_contracheque
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{contracheque_id}", response_model=APIResponse)
async def get_contracheque(
    contracheque_id: int,
    db: Session = Depends(get_db)
):
    """Buscar um contracheque específico"""
    try:
        contracheque = db.query(ContrachequeModel).filter(
            ContrachequeModel.id == contracheque_id
        ).first()
        
        if not contracheque:
            raise HTTPException(status_code=404, detail="Contracheque não encontrado")
        
        return APIResponse(
            success=True,
            message="Contracheque encontrado",
            data=contracheque
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{contracheque_id}", response_model=APIResponse)
async def update_contracheque(
    contracheque_id: int,
    contracheque_update: ContrachequeUpdate,
    db: Session = Depends(get_db)
):
    """Atualizar um contracheque"""
    try:
        contracheque = db.query(ContrachequeModel).filter(
            ContrachequeModel.id == contracheque_id
        ).first()
        
        if not contracheque:
            raise HTTPException(status_code=404, detail="Contracheque não encontrado")
        
        # Atualizar apenas campos fornecidos
        update_data = contracheque_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contracheque, field, value)
        
        db.commit()
        db.refresh(contracheque)
        
        return APIResponse(
            success=True,
            message="Contracheque atualizado com sucesso",
            data=contracheque
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{contracheque_id}", response_model=APIResponse)
async def delete_contracheque(
    contracheque_id: int,
    db: Session = Depends(get_db)
):
    """Deletar um contracheque"""
    try:
        contracheque = db.query(ContrachequeModel).filter(
            ContrachequeModel.id == contracheque_id
        ).first()
        
        if not contracheque:
            raise HTTPException(status_code=404, detail="Contracheque não encontrado")
        
        db.delete(contracheque)
        db.commit()
        
        return APIResponse(
            success=True,
            message="Contracheque deletado com sucesso",
            data=None
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-pdfs", response_model=ContrachequeProcessResponse)
async def process_contracheque_pdfs(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Processar PDFs de contracheques"""
    try:
        if not files:
            raise HTTPException(status_code=400, detail="Nenhum arquivo fornecido")
        
        # Validar arquivos
        file_contents = []
        filenames = []
        
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(
                    status_code=400,
                    detail=f"Arquivo {file.filename} não é um PDF"
                )
            
            content = await file.read()
            if not pdf_service.validate_pdf_file(content, file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"Arquivo {file.filename} não é um PDF válido"
                )
            
            file_contents.append(content)
            filenames.append(file.filename)
        
        # Processar PDFs
        result = await pdf_service.process_contracheque_pdfs(file_contents, filenames)
        
        if not result.get('success', False):
            raise HTTPException(
                status_code=500,
                detail=result.get('message', 'Erro no processamento')
            )
        
        # Salvar resultados no banco de dados
        saved_contracheques = []
        processed_data = result.get('data', [])
        
        for item in processed_data:
            try:
                # Verificar se já existe
                existing = db.query(ContrachequeModel).filter(
                    ContrachequeModel.colaborador == item.get('colaborador'),
                    ContrachequeModel.periodo == item.get('periodo'),
                    ContrachequeModel.tipo_documento == item.get('tipo_documento', 'contracheque')
                ).first()
                
                if existing:
                    # Atualizar registro existente
                    for key, value in item.items():
                        if hasattr(existing, key) and value is not None:
                            setattr(existing, key, value)
                    existing.data_processamento = datetime.now()
                    saved_contracheques.append(existing)
                else:
                    # Criar novo registro
                    contracheque_data = {
                        'colaborador': item.get('colaborador'),
                        'periodo': item.get('periodo'),
                        'tipo_documento': item.get('tipo_documento', 'contracheque'),
                        'vencimentos': item.get('vencimentos', 0.0),
                        'descontos': item.get('descontos', 0.0),
                        'liquido': item.get('liquido', 0.0),
                        'status': item.get('status', 'processado'),
                        'status_validacao': item.get('status_validacao', 'pendente'),
                        'arquivo_origem': item.get('arquivo_origem'),
                        'data_processamento': datetime.now()
                    }
                    
                    db_contracheque = ContrachequeModel(**contracheque_data)
                    db.add(db_contracheque)
                    saved_contracheques.append(db_contracheque)
                    
            except Exception as e:
                print(f"Erro ao salvar contracheque: {e}")
                continue
        
        db.commit()
        
        # Refresh dos objetos salvos
        for contracheque in saved_contracheques:
            db.refresh(contracheque)
        
        return ContrachequeProcessResponse(
            success=True,
            message=f"{len(saved_contracheques)} contracheques processados com sucesso",
            processed_count=len(saved_contracheques),
            total_files=len(files),
            results=[
                ContrachequeProcessResult(
                    colaborador=c.colaborador,
                    periodo=c.periodo,
                    vencimentos=c.vencimentos,
                    descontos=c.descontos,
                    liquido=c.liquido,
                    status=c.status,
                    status_validacao=c.status_validacao
                ) for c in saved_contracheques
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear-all", response_model=APIResponse)
async def clear_all_contracheques(db: Session = Depends(get_db)):
    """Limpar todos os contracheques"""
    try:
        count = db.query(ContrachequeModel).count()
        db.query(ContrachequeModel).delete()
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"{count} contracheques removidos com sucesso",
            data=None
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/summary", response_model=APIResponse)
async def get_contracheques_stats(db: Session = Depends(get_db)):
    """Obter estatísticas dos contracheques"""
    try:
        total = db.query(ContrachequeModel).count()
        
        # Estatísticas por status
        stats_by_status = db.query(
            ContrachequeModel.status,
            db.func.count(ContrachequeModel.id).label('count')
        ).group_by(ContrachequeModel.status).all()
        
        # Estatísticas por validação
        stats_by_validation = db.query(
            ContrachequeModel.status_validacao,
            db.func.count(ContrachequeModel.id).label('count')
        ).group_by(ContrachequeModel.status_validacao).all()
        
        # Totais financeiros
        financial_stats = db.query(
            db.func.sum(ContrachequeModel.vencimentos).label('total_vencimentos'),
            db.func.sum(ContrachequeModel.descontos).label('total_descontos'),
            db.func.sum(ContrachequeModel.liquido).label('total_liquido'),
            db.func.avg(ContrachequeModel.liquido).label('media_liquido')
        ).first()
        
        stats = {
            'total_contracheques': total,
            'por_status': {status: count for status, count in stats_by_status},
            'por_validacao': {status: count for status, count in stats_by_validation},
            'financeiro': {
                'total_vencimentos': float(financial_stats.total_vencimentos or 0),
                'total_descontos': float(financial_stats.total_descontos or 0),
                'total_liquido': float(financial_stats.total_liquido or 0),
                'media_liquido': float(financial_stats.media_liquido or 0)
            }
        }
        
        return APIResponse(
            success=True,
            message="Estatísticas obtidas com sucesso",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))