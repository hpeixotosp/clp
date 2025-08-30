from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ColaboradorBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)
    ativo: bool = True

class ColaboradorCreate(ColaboradorBase):
    pass

class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=255)
    ativo: Optional[bool] = None

class Colaborador(ColaboradorBase):
    id: int
    data_cadastro: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True

class ColaboradorBulkCreate(BaseModel):
    colaboradores: List[str] = Field(..., min_items=1)

class ColaboradorBulkResponse(BaseModel):
    success: bool
    message: str
    data: List[Colaborador]
    errors: Optional[List[str]] = None