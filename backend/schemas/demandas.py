from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DemandaAndamentoBase(BaseModel):
    """Schema base para andamentos de demanda"""
    data_andamento: datetime
    descricao: str = Field(..., min_length=1, max_length=1000)
    responsavel: Optional[str] = Field(None, max_length=100)
    observacoes: Optional[str] = Field(None, max_length=2000)

class DemandaAndamentoCreate(DemandaAndamentoBase):
    """Schema para criação de andamento de demanda"""
    pass

class DemandaAndamento(DemandaAndamentoBase):
    """Schema completo para andamento de demanda"""
    id: int
    demanda_id: int
    data_criacao: datetime
    
    class Config:
        from_attributes = True

class DemandaBase(BaseModel):
    """Schema base para demanda"""
    titulo: str = Field(..., min_length=1, max_length=200)
    descricao: str = Field(..., min_length=1, max_length=2000)
    solicitante: Optional[str] = Field(None, max_length=100)
    setor_solicitante: Optional[str] = Field(None, max_length=100)
    setor_responsavel: Optional[str] = Field(None, max_length=100)
    tipo_demanda: str = Field(default="geral", max_length=50)
    status: str = Field(default="aberta", max_length=50)
    prioridade: str = Field(default="normal", max_length=20)
    data_solicitacao: Optional[datetime] = None
    data_prazo: Optional[datetime] = None
    observacoes: Optional[str] = Field(None, max_length=2000)

class DemandaCreate(DemandaBase):
    """Schema para criação de demanda"""
    primeiro_andamento: DemandaAndamentoCreate

class DemandaUpdate(BaseModel):
    """Schema para atualização de demanda"""
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    descricao: Optional[str] = Field(None, min_length=1, max_length=2000)
    solicitante: Optional[str] = Field(None, max_length=100)
    setor_solicitante: Optional[str] = Field(None, max_length=100)
    setor_responsavel: Optional[str] = Field(None, max_length=100)
    tipo_demanda: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    prioridade: Optional[str] = Field(None, max_length=20)
    data_solicitacao: Optional[datetime] = None
    data_prazo: Optional[datetime] = None
    observacoes: Optional[str] = Field(None, max_length=2000)

class Demanda(DemandaBase):
    """Schema completo para demanda"""
    id: int
    data_criacao: datetime
    data_atualizacao: datetime
    andamentos: List[DemandaAndamento] = []
    
    class Config:
        from_attributes = True

class DemandaFilter(BaseModel):
    """Schema para filtros de busca de demanda"""
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    solicitante: Optional[str] = None
    setor_solicitante: Optional[str] = None
    setor_responsavel: Optional[str] = None
    tipo_demanda: Optional[str] = None
    status: Optional[str] = None
    prioridade: Optional[str] = None
    data_solicitacao_inicio: Optional[datetime] = None
    data_solicitacao_fim: Optional[datetime] = None
    data_prazo_inicio: Optional[datetime] = None
    data_prazo_fim: Optional[datetime] = None

class DemandaStats(BaseModel):
    """Schema para estatísticas de demandas"""
    total_demandas: int
    por_status: dict
    por_prioridade: dict
    por_tipo: dict
    por_setor: dict
    em_atraso: int
    vencendo_hoje: int
    vencendo_semana: int