from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RefilBase(BaseModel):
    """Schema base para refil"""
    codigo: str = Field(..., min_length=1, max_length=50)
    descricao: str = Field(..., min_length=1, max_length=200)
    tipo: str = Field(..., max_length=50)
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    capacidade: Optional[str] = Field(None, max_length=50)
    preco_unitario: Optional[float] = Field(None, ge=0)
    estoque_atual: int = Field(default=0, ge=0)
    estoque_minimo: int = Field(default=0, ge=0)
    ativo: bool = Field(default=True)
    observacoes: Optional[str] = Field(None, max_length=1000)

class RefilCreate(RefilBase):
    """Schema para criação de refil"""
    pass

class RefilUpdate(BaseModel):
    """Schema para atualização de refil"""
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    descricao: Optional[str] = Field(None, min_length=1, max_length=200)
    tipo: Optional[str] = Field(None, max_length=50)
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    capacidade: Optional[str] = Field(None, max_length=50)
    preco_unitario: Optional[float] = Field(None, ge=0)
    estoque_atual: Optional[int] = Field(None, ge=0)
    estoque_minimo: Optional[int] = Field(None, ge=0)
    ativo: Optional[bool] = None
    observacoes: Optional[str] = Field(None, max_length=1000)

class Refil(RefilBase):
    """Schema completo para refil"""
    id: int
    data_criacao: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True

class RefilFilter(BaseModel):
    """Schema para filtros de busca de refil"""
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    ativo: Optional[bool] = None
    estoque_baixo: Optional[bool] = None  # Filtrar itens com estoque abaixo do mínimo

class RefilStats(BaseModel):
    """Schema para estatísticas de refis"""
    total_refis: int
    ativos: int
    inativos: int
    por_tipo: dict
    por_marca: dict
    estoque_baixo: int
    valor_total_estoque: float