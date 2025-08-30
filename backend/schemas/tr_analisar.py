from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TRBase(BaseModel):
    """Schema base para TR (Termo de Referência)"""
    numero: str = Field(..., min_length=1, max_length=50)
    titulo: str = Field(..., min_length=1, max_length=200)
    objeto: str = Field(..., min_length=1, max_length=1000)
    setor_solicitante: Optional[str] = Field(None, max_length=100)
    responsavel: Optional[str] = Field(None, max_length=100)
    valor_estimado: Optional[float] = Field(None, ge=0)
    prazo_execucao: Optional[int] = Field(None, ge=1)  # em dias
    status: str = Field(default="em_analise", max_length=50)
    prioridade: str = Field(default="normal", max_length=20)
    data_solicitacao: Optional[datetime] = None
    data_prazo_analise: Optional[datetime] = None
    observacoes: Optional[str] = Field(None, max_length=2000)
    justificativa: Optional[str] = Field(None, max_length=2000)
    especificacoes_tecnicas: Optional[str] = Field(None, max_length=5000)

class TRCreate(TRBase):
    """Schema para criação de TR"""
    pass

class TRUpdate(BaseModel):
    """Schema para atualização de TR"""
    numero: Optional[str] = Field(None, min_length=1, max_length=50)
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    objeto: Optional[str] = Field(None, min_length=1, max_length=1000)
    setor_solicitante: Optional[str] = Field(None, max_length=100)
    responsavel: Optional[str] = Field(None, max_length=100)
    valor_estimado: Optional[float] = Field(None, ge=0)
    prazo_execucao: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, max_length=50)
    prioridade: Optional[str] = Field(None, max_length=20)
    data_solicitacao: Optional[datetime] = None
    data_prazo_analise: Optional[datetime] = None
    observacoes: Optional[str] = Field(None, max_length=2000)
    justificativa: Optional[str] = Field(None, max_length=2000)
    especificacoes_tecnicas: Optional[str] = Field(None, max_length=5000)

class TR(TRBase):
    """Schema completo para TR"""
    id: int
    data_criacao: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True

class TRFilter(BaseModel):
    """Schema para filtros de busca de TR"""
    numero: Optional[str] = None
    titulo: Optional[str] = None
    objeto: Optional[str] = None
    setor_solicitante: Optional[str] = None
    responsavel: Optional[str] = None
    status: Optional[str] = None
    prioridade: Optional[str] = None
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    data_solicitacao_inicio: Optional[datetime] = None
    data_solicitacao_fim: Optional[datetime] = None
    data_prazo_inicio: Optional[datetime] = None
    data_prazo_fim: Optional[datetime] = None

class TRStats(BaseModel):
    """Schema para estatísticas de TR"""
    total_trs: int
    por_status: dict
    por_prioridade: dict
    por_setor: dict
    em_atraso: int
    vencendo_hoje: int
    vencendo_semana: int
    valor_total_estimado: float
    valor_medio_estimado: float