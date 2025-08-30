from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base

class PontoEletronico(Base):
    __tablename__ = "pontos_eletronicos"
    
    id = Column(Integer, primary_key=True, index=True)
    colaborador = Column(String(255), nullable=False, index=True)
    periodo = Column(String(50), nullable=False)
    previsto = Column(String(20), nullable=False)
    realizado = Column(String(20), nullable=False)
    saldo = Column(String(20), nullable=False)
    saldo_minutos = Column(Integer, default=0)
    assinatura = Column(String(20), default="Pendente")
    data_processamento = Column(DateTime, default=func.now())
    arquivo_origem = Column(String(255))

class Colaborador(Base):
    __tablename__ = "colaboradores_validos"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False, unique=True, index=True)
    ativo = Column(Boolean, default=True)
    data_cadastro = Column(DateTime, default=func.now())
    data_atualizacao = Column(DateTime, default=func.now(), onupdate=func.now())

class PROAD(Base):
    __tablename__ = "proads"
    
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(50), nullable=False, index=True)
    ano = Column(String(4), nullable=False)
    setor = Column(String(100), nullable=False)
    prioridade = Column(String(20), nullable=False)
    situacao = Column(String(20), nullable=False, default="ativo")
    data_cadastro = Column(DateTime, default=func.now())
    data_criacao = Column(DateTime, default=func.now())
    andamento = Column(Text)
    responsavel = Column(String(255))
    assunto = Column(Text)
    responsavel_custom = Column(String(255))
    
    # Relationship with andamentos
    andamentos = relationship("PROADAndamento", back_populates="proad", cascade="all, delete-orphan")

class PROADAndamento(Base):
    __tablename__ = "proad_andamentos"
    
    id = Column(Integer, primary_key=True, index=True)
    proad_id = Column(Integer, ForeignKey("proads.id"), nullable=False)
    data = Column(DateTime, default=func.now())
    descricao = Column(Text, nullable=False)
    usuario = Column(String(255))
    
    # Relationship with PROAD
    proad = relationship("PROAD", back_populates="andamentos")

class Demanda(Base):
    __tablename__ = "demandas"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text)
    setor = Column(String(100), nullable=False)
    prioridade = Column(String(20), nullable=False)
    situacao = Column(String(20), nullable=False, default="pendente")
    prazo = Column(DateTime)
    data_cadastro = Column(DateTime, default=func.now())
    responsavel = Column(String(255))
    responsavel_custom = Column(String(255))
    andamento = Column(Text)
    
    # Relationship with andamentos
    andamentos = relationship("DemandaAndamento", back_populates="demanda", cascade="all, delete-orphan")

class DemandaAndamento(Base):
    __tablename__ = "demanda_andamentos"
    
    id = Column(Integer, primary_key=True, index=True)
    demanda_id = Column(Integer, ForeignKey("demandas.id"), nullable=False)
    data = Column(DateTime, default=func.now())
    descricao = Column(Text, nullable=False)
    usuario = Column(String(255))
    
    # Relationship with Demanda
    demanda = relationship("Demanda", back_populates="andamentos")

class Refil(Base):
    __tablename__ = "refis"
    
    id = Column(Integer, primary_key=True, index=True)
    marca = Column(String(100), nullable=False)
    quantidade_disponivel = Column(Integer, default=0)
    foto_url = Column(String(500))
    descricao = Column(Text)
    data_cadastro = Column(DateTime, default=func.now())
    ultima_atualizacao = Column(DateTime, default=func.now(), onupdate=func.now())

class Sigla(Base):
    __tablename__ = "siglas"
    
    id = Column(Integer, primary_key=True, index=True)
    sigla = Column(String(20), nullable=False, unique=True, index=True)
    descricao = Column(Text, nullable=False)
    data_cadastro = Column(DateTime, default=func.now())

class TR(Base):
    __tablename__ = "trs"
    
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(50), nullable=False, unique=True, index=True)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text)
    data_criacao = Column(DateTime, default=func.now())
    status = Column(String(50), default="pendente")
    observacoes = Column(Text)

class AnaliseProposta(Base):
    __tablename__ = "analise_propostas"
    
    id = Column(Integer, primary_key=True, index=True)
    numero_processo = Column(String(100), nullable=False, index=True)
    empresa_proponente = Column(String(255), nullable=False)
    data_analise = Column(DateTime, default=func.now())
    resultado = Column(String(100), nullable=False)
    observacoes = Column(Text)

class Contracheque(Base):
    __tablename__ = "contracheques"
    
    id = Column(Integer, primary_key=True, index=True)
    colaborador = Column(String(255), nullable=False, index=True)
    periodo = Column(String(50), nullable=False)
    tipo_documento = Column(String(50))
    vencimentos = Column(String(20))
    descontos = Column(String(20))
    valor_liquido = Column(String(20))
    status = Column(String(50))
    status_validacao = Column(String(50))
    data_processamento = Column(DateTime, default=func.now())
    arquivo_origem = Column(String(255))
    erro = Column(Text)