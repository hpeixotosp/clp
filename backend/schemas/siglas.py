from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SiglaBase(BaseModel):
    """Schema base para sigla"""
    sigla: str = Field(..., min_length=1, max_length=20)
    significado: str = Field(..., min_length=1, max_length=500)
    categoria: Optional[str] = Field(None, max_length=100)
    descricao_detalhada: Optional[str] = Field(None, max_length=2000)
    ativo: bool = Field(default=True)

class SiglaCreate(SiglaBase):
    """Schema para criação de sigla"""
    pass

class SiglaUpdate(BaseModel):
    """Schema para atualização de sigla"""
    sigla: Optional[str] = Field(None, min_length=1, max_length=20)
    significado: Optional[str] = Field(None, min_length=1, max_length=500)
    categoria: Optional[str] = Field(None, max_length=100)
    descricao_detalhada: Optional[str] = Field(None, max_length=2000)
    ativo: Optional[bool] = None

class Sigla(SiglaBase):
    """Schema completo para sigla"""
    id: int
    data_criacao: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True

class SiglaFilter(BaseModel):
    """Schema para filtros de busca de sigla"""
    sigla: Optional[str] = None
    significado: Optional[str] = None
    categoria: Optional[str] = None
    ativo: Optional[bool] = None

class SiglaStats(BaseModel):
    """Schema para estatísticas de siglas"""
    total_siglas: int
    ativas: int
    inativas: int
    por_categoria: dict