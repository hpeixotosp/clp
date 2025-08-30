from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AnalisePropostaBase(BaseModel):
    """Schema base para análise de proposta"""
    numero_proposta: str = Field(..., min_length=1, max_length=50)
    fornecedor: str = Field(..., min_length=1, max_length=200)
    objeto: str = Field(..., min_length=1, max_length=1000)
    valor_proposta: float = Field(..., ge=0)
    prazo_entrega: Optional[int] = Field(None, ge=1)  # em dias
    status_analise: str = Field(default="pendente", max_length=50)
    parecer_tecnico: Optional[str] = Field(None, max_length=2000)
    parecer_juridico: Optional[str] = Field(None, max_length=2000)
    parecer_financeiro: Optional[str] = Field(None, max_length=2000)
    analista_tecnico: Optional[str] = Field(None, max_length=100)
    analista_juridico: Optional[str] = Field(None, max_length=100)
    analista_financeiro: Optional[str] = Field(None, max_length=100)
    data_recebimento: Optional[datetime] = None
    data_prazo_analise: Optional[datetime] = None
    data_conclusao: Optional[datetime] = None
    resultado_final: Optional[str] = Field(None, max_length=50)  # aprovada, rejeitada, pendente
    observacoes: Optional[str] = Field(None, max_length=2000)
    documentos_anexos: Optional[str] = Field(None, max_length=1000)  # lista de documentos

class AnalisePropostaCreate(AnalisePropostaBase):
    """Schema para criação de análise de proposta"""
    pass

class AnalisePropostaUpdate(BaseModel):
    """Schema para atualização de análise de proposta"""
    numero_proposta: Optional[str] = Field(None, min_length=1, max_length=50)
    fornecedor: Optional[str] = Field(None, min_length=1, max_length=200)
    objeto: Optional[str] = Field(None, min_length=1, max_length=1000)
    valor_proposta: Optional[float] = Field(None, ge=0)
    prazo_entrega: Optional[int] = Field(None, ge=1)
    status_analise: Optional[str] = Field(None, max_length=50)
    parecer_tecnico: Optional[str] = Field(None, max_length=2000)
    parecer_juridico: Optional[str] = Field(None, max_length=2000)
    parecer_financeiro: Optional[str] = Field(None, max_length=2000)
    analista_tecnico: Optional[str] = Field(None, max_length=100)
    analista_juridico: Optional[str] = Field(None, max_length=100)
    analista_financeiro: Optional[str] = Field(None, max_length=100)
    data_recebimento: Optional[datetime] = None
    data_prazo_analise: Optional[datetime] = None
    data_conclusao: Optional[datetime] = None
    resultado_final: Optional[str] = Field(None, max_length=50)
    observacoes: Optional[str] = Field(None, max_length=2000)
    documentos_anexos: Optional[str] = Field(None, max_length=1000)

class AnaliseProposta(AnalisePropostaBase):
    """Schema completo para análise de proposta"""
    id: int
    data_criacao: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True

class AnalisePropostaFilter(BaseModel):
    """Schema para filtros de busca de análise de proposta"""
    numero_proposta: Optional[str] = None
    fornecedor: Optional[str] = None
    objeto: Optional[str] = None
    status_analise: Optional[str] = None
    resultado_final: Optional[str] = None
    analista_tecnico: Optional[str] = None
    analista_juridico: Optional[str] = None
    analista_financeiro: Optional[str] = None
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    data_recebimento_inicio: Optional[datetime] = None
    data_recebimento_fim: Optional[datetime] = None
    data_prazo_inicio: Optional[datetime] = None
    data_prazo_fim: Optional[datetime] = None

class AnalisePropostaStats(BaseModel):
    """Schema para estatísticas de análise de proposta"""
    total_propostas: int
    por_status: dict
    por_resultado: dict
    por_fornecedor: dict
    em_atraso: int
    vencendo_hoje: int
    vencendo_semana: int
    valor_total_propostas: float
    valor_medio_propostas: float
    tempo_medio_analise: float  # em dias