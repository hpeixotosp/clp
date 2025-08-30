from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PontoEletronicoBase(BaseModel):
    colaborador: str = Field(..., min_length=1, max_length=255)
    periodo: str = Field(..., min_length=1, max_length=50)
    previsto: str = Field(..., min_length=1, max_length=20)
    realizado: str = Field(..., min_length=1, max_length=20)
    saldo: str = Field(..., min_length=1, max_length=20)
    saldo_minutos: Optional[int] = 0
    assinatura: str = Field(default="Pendente", max_length=20)
    arquivo_origem: Optional[str] = Field(None, max_length=255)

class PontoEletronicoCreate(PontoEletronicoBase):
    pass

class PontoEletronicoUpdate(BaseModel):
    colaborador: Optional[str] = Field(None, min_length=1, max_length=255)
    periodo: Optional[str] = Field(None, min_length=1, max_length=50)
    previsto: Optional[str] = Field(None, min_length=1, max_length=20)
    realizado: Optional[str] = Field(None, min_length=1, max_length=20)
    saldo: Optional[str] = Field(None, min_length=1, max_length=20)
    saldo_minutos: Optional[int] = None
    assinatura: Optional[str] = Field(None, max_length=20)
    arquivo_origem: Optional[str] = Field(None, max_length=255)

class PontoEletronico(PontoEletronicoBase):
    id: int
    data_processamento: datetime
    
    class Config:
        from_attributes = True

class PontoEletronicoFilter(BaseModel):
    colaborador: Optional[str] = None
    periodo: Optional[str] = None
    saldo_minimo: Optional[int] = None
    saldo_maximo: Optional[int] = None
    assinatura: Optional[str] = None
    limit: Optional[int] = Field(100, ge=1, le=1000)
    offset: Optional[int] = Field(0, ge=0)

class PontoEletronicoStats(BaseModel):
    total: int
    com_assinatura: int
    sem_assinatura: int
    saldo_positivo: int
    saldo_negativo: int
    saldo_zero: int