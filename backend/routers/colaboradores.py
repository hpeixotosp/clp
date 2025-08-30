from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from database.models import Colaborador as ColaboradorModel
from schemas.colaboradores import (
    Colaborador,
    ColaboradorCreate,
    ColaboradorUpdate,
    ColaboradorBulkCreate,
    ColaboradorBulkResponse
)
from schemas.common import APIResponse

router = APIRouter()

@router.get("/", response_model=APIResponse)
async def get_colaboradores(db: Session = Depends(get_db)):
    """Buscar todos os colaboradores"""
    try:
        colaboradores = db.query(ColaboradorModel).filter(
            ColaboradorModel.ativo == True
        ).order_by(ColaboradorModel.nome).all()
        
        # Retornar apenas os nomes para compatibilidade com o frontend
        nomes = [colaborador.nome for colaborador in colaboradores]
        
        return APIResponse(
            success=True,
            message=f"{len(colaboradores)} colaboradores encontrados",
            data=nomes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/detailed", response_model=APIResponse)
async def get_colaboradores_detailed(db: Session = Depends(get_db)):
    """Buscar todos os colaboradores com detalhes completos"""
    try:
        colaboradores = db.query(ColaboradorModel).filter(
            ColaboradorModel.ativo == True
        ).order_by(ColaboradorModel.nome).all()
        
        return APIResponse(
            success=True,
            message=f"{len(colaboradores)} colaboradores encontrados",
            data=colaboradores
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/", response_model=APIResponse)
async def add_colaborador(
    colaborador: ColaboradorCreate,
    db: Session = Depends(get_db)
):
    """Adicionar um novo colaborador"""
    try:
        # Verificar se já existe
        existing = db.query(ColaboradorModel).filter(
            ColaboradorModel.nome == colaborador.nome
        ).first()
        
        if existing:
            if not existing.ativo:
                # Reativar colaborador
                existing.ativo = True
                db.commit()
                db.refresh(existing)
                
                # Retornar lista atualizada
                colaboradores = db.query(ColaboradorModel).filter(
                    ColaboradorModel.ativo == True
                ).order_by(ColaboradorModel.nome).all()
                nomes = [c.nome for c in colaboradores]
                
                return APIResponse(
                    success=True,
                    message="Colaborador reativado com sucesso",
                    data=nomes
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Colaborador já existe"
                )
        
        # Criar novo colaborador
        db_colaborador = ColaboradorModel(**colaborador.dict())
        db.add(db_colaborador)
        db.commit()
        
        # Retornar lista atualizada
        colaboradores = db.query(ColaboradorModel).filter(
            ColaboradorModel.ativo == True
        ).order_by(ColaboradorModel.nome).all()
        nomes = [c.nome for c in colaboradores]
        
        return APIResponse(
            success=True,
            message="Colaborador adicionado com sucesso",
            data=nomes
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=APIResponse)
async def remove_colaborador(
    colaborador_data: dict,
    db: Session = Depends(get_db)
):
    """Remover um colaborador (marcar como inativo)"""
    try:
        nome = colaborador_data.get("nome")
        if not nome:
            raise HTTPException(status_code=400, detail="Nome do colaborador é obrigatório")
        
        colaborador = db.query(ColaboradorModel).filter(
            ColaboradorModel.nome == nome,
            ColaboradorModel.ativo == True
        ).first()
        
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        # Marcar como inativo ao invés de deletar
        colaborador.ativo = False
        db.commit()
        
        # Retornar lista atualizada
        colaboradores = db.query(ColaboradorModel).filter(
            ColaboradorModel.ativo == True
        ).order_by(ColaboradorModel.nome).all()
        nomes = [c.nome for c in colaboradores]
        
        return APIResponse(
            success=True,
            message="Colaborador removido com sucesso",
            data=nomes
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk", response_model=APIResponse)
async def replace_all_colaboradores(
    bulk_data: ColaboradorBulkCreate,
    db: Session = Depends(get_db)
):
    """Substituir todos os colaboradores"""
    try:
        # Marcar todos como inativos
        db.query(ColaboradorModel).update({"ativo": False})
        
        # Adicionar novos colaboradores
        novos_colaboradores = []
        for nome in bulk_data.colaboradores:
            nome = nome.strip()
            if not nome:
                continue
                
            # Verificar se já existe
            existing = db.query(ColaboradorModel).filter(
                ColaboradorModel.nome == nome
            ).first()
            
            if existing:
                existing.ativo = True
                novos_colaboradores.append(existing)
            else:
                novo = ColaboradorModel(nome=nome, ativo=True)
                db.add(novo)
                novos_colaboradores.append(novo)
        
        db.commit()
        
        # Retornar lista atualizada
        colaboradores = db.query(ColaboradorModel).filter(
            ColaboradorModel.ativo == True
        ).order_by(ColaboradorModel.nome).all()
        nomes = [c.nome for c in colaboradores]
        
        return APIResponse(
            success=True,
            message=f"{len(nomes)} colaboradores atualizados com sucesso",
            data=nomes
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{colaborador_id}", response_model=APIResponse)
async def get_colaborador(colaborador_id: int, db: Session = Depends(get_db)):
    """Buscar um colaborador específico"""
    try:
        colaborador = db.query(ColaboradorModel).filter(
            ColaboradorModel.id == colaborador_id,
            ColaboradorModel.ativo == True
        ).first()
        
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        return APIResponse(
            success=True,
            message="Colaborador encontrado",
            data=colaborador
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{colaborador_id}", response_model=APIResponse)
async def update_colaborador(
    colaborador_id: int,
    colaborador_update: ColaboradorUpdate,
    db: Session = Depends(get_db)
):
    """Atualizar um colaborador"""
    try:
        colaborador = db.query(ColaboradorModel).filter(
            ColaboradorModel.id == colaborador_id
        ).first()
        
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        # Atualizar apenas campos fornecidos
        update_data = colaborador_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(colaborador, field, value)
        
        db.commit()
        db.refresh(colaborador)
        
        return APIResponse(
            success=True,
            message="Colaborador atualizado com sucesso",
            data=colaborador
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))