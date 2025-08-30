from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PROADAndamentoBase(BaseModel):
    """Schema base para andamentos de PROAD"""
    data_andamento: datetime
    descricao: str = Field(..., min_length=1, max_length=1000)
    responsavel: Optional[str] = Field(None, max_length=100)
    observacoes: Optional[str] = Field(None, max_length=2000)

class PROADAndamentoCreate(PROADAndamentoBase):
    """Schema para criação de andamento de PROAD"""
    pass

class PROADAndamento(PROADAndamentoBase):
    """Schema completo para andamento de PROAD"""
    id: int
    proad_id: int
    data_criacao: datetime
    
    class Config:
        from_attributes = True

class PROADBase(BaseModel):
    """Schema base para PROAD"""
    numero: str = Field(..., min_length=1, max_length=50)
    assunto: str = Field(..., min_length=1, max_length=500)
    interessado: Optional[str] = Field(None, max_length=200)
    setor_origem: Optional[str] = Field(None, max_length=100)
    setor_atual: Optional[str] = Field(None, max_length=100)
    status: str = Field(default="em_andamento", max_length=50)
    prioridade: str = Field(default="normal", max_length=20)
    data_entrada: Optional[datetime] = None
    data_prazo: Optional[datetime] = None
    observacoes: Optional[str] = Field(None, max_length=2000)

class PROADCreate(PROADBase):
    """Schema para criação de PROAD"""
    primeiro_andamento: PROADAndamentoCreate

class PROADUpdate(BaseModel):
    """Schema para atualização de PROAD"""
    numero: Optional[str] = Field(None, min_length=1, max_length=50)
    assunto: Optional[str] = Field(None, min_length=1, max_length=500)
    interessado: Optional[str] = Field(None, max_length=200)
    setor_origem: Optional[str] = Field(None, max_length=100)
    setor_atual: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    prioridade: Optional[str] = Field(None, max_length=20)
    data_entrada: Optional[datetime] = None
    data_prazo: Optional[datetime] = None
    observacoes: Optional[str] = Field(None, max_length=2000)

class PROAD(PROADBase):
    """Schema completo para PROAD"""
    id: int
    data_criacao: datetime
    data_atualizacao: datetime
    andamentos: List[PROADAndamento] = []
    
    class Config:
        from_attributes = True

class PROADFilter(BaseModel):
    """Schema para filtros de busca de PROAD"""
    numero: Optional[str] = None
    assunto: Optional[str] = None
    interessado: Optional[str] = None
    setor_origem: Optional[str] = None
    setor_atual: Optional[str] = None
    status: Optional[str] = None
    prioridade: Optional[str] = None
    data_entrada_inicio: Optional[datetime] = None
    data_entrada_fim: Optional[datetime] = None
    data_prazo_inicio: Optional[datetime] = None
    data_prazo_fim: Optional[datetime] = None

class PROADStats(BaseModel):
    """Schema para estatísticas de PROAD"""
    total_proads: int
    por_status: dict
    por_prioridade: dict
    por_setor: dict
    em_atraso: int
    vencendo_hoje: int
    vencendo_semana: int