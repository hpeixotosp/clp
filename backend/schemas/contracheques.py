from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ContrachequeBase(BaseModel):
    colaborador: str = Field(..., min_length=1, max_length=255)
    periodo: str = Field(..., min_length=1, max_length=50)
    tipo_documento: Optional[str] = Field(None, max_length=50)
    vencimentos: Optional[str] = Field(None, max_length=20)
    descontos: Optional[str] = Field(None, max_length=20)
    valor_liquido: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=50)
    status_validacao: Optional[str] = Field(None, max_length=50)
    arquivo_origem: Optional[str] = Field(None, max_length=255)
    erro: Optional[str] = None

class ContrachequeCreate(ContrachequeBase):
    pass

class ContrachequeUpdate(BaseModel):
    colaborador: Optional[str] = Field(None, min_length=1, max_length=255)
    periodo: Optional[str] = Field(None, min_length=1, max_length=50)
    tipo_documento: Optional[str] = Field(None, max_length=50)
    vencimentos: Optional[str] = Field(None, max_length=20)
    descontos: Optional[str] = Field(None, max_length=20)
    valor_liquido: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=50)
    status_validacao: Optional[str] = Field(None, max_length=50)
    arquivo_origem: Optional[str] = Field(None, max_length=255)
    erro: Optional[str] = None

class Contracheque(ContrachequeBase):
    id: int
    data_processamento: datetime
    
    class Config:
        from_attributes = True

class ContrachequeProcessResult(BaseModel):
    colaborador: str
    periodo: str
    tipo_documento: str
    vencimentos: str
    descontos: str
    valor_liquido: str
    status: str
    status_validacao: str
    erro: Optional[str] = None

class ContrachequeProcessResponse(BaseModel):
    success: bool
    message: str
    resultados: List[ContrachequeProcessResult]
    total_processados: int
    total_com_erro: int