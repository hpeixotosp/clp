// Tipos para Pontos Eletrônicos
export interface PontoEletronico {
  id?: number;
  colaborador: string;
  periodo: string;
  previsto: string;
  realizado: string;
  saldo: string;
  saldo_minutos?: number;
  assinatura: string;
  data_processamento?: string;
  arquivo_origem?: string;
}

export interface FiltrosPonto {
  colaborador?: string;
  periodo?: string;
  saldo_minimo?: number;
  saldo_maximo?: number;
  assinatura?: string | boolean;
}

export interface EstatisticasPontos {
  total: number;
  comAssinatura: number;
  semAssinatura: number;
}

// Tipos para PROADs
export interface PROAD {
  id?: number;
  numero: string;
  ano: string;
  setor: string;
  prioridade: string;
  situacao: "ativo" | "concluido" | "suspenso" | "cancelado";
  dataCadastro: Date;
  andamento?: string;
  historicoAndamentos?: Andamento[];
  responsavel?: string;
  assunto?: string;
  responsavel_custom?: string;
}

export interface Andamento {
  id: number;
  proad_id: number;
  data: Date;
  descricao: string;
  usuario?: string;
}

export interface FiltrosPROAD {
  numero?: string;
  ano?: string;
  setor?: string;
  prioridade?: string;
  situacao?: string;
  responsavel?: string;
  assunto?: string;
  searchTerm?: string;
}

// Tipos para Demandas
export interface Demanda {
  id?: number;
  titulo: string;
  descricao: string;
  setor: string;
  prioridade: "alta" | "media" | "baixa";
  situacao: "pendente" | "emandamento" | "concluida" | "cancelada";
  prazo?: Date;
  dataCadastro: Date;
  responsavel?: string;
  responsavel_custom?: string;
  andamento?: string;
  historicoAndamentos?: AndamentoDemanda[];
}

export interface AndamentoDemanda {
  id: number;
  demanda_id: number;
  data: Date;
  descricao: string;
  usuario?: string;
}

export interface FiltrosDemanda {
  titulo?: string;
  setor?: string;
  prioridade?: string;
  responsavel?: string;
  situacao?: string;
  searchTerm?: string;
}

// Tipos para Purificadores
export interface Purificador {
  id?: number;
  tombo: string;
  modelo: string;
  localidade: string;
  sublocalidade: string;
  refilTrocadoEm?: Date;
  status: string;
  observacoes?: string;
  dataCadastro?: Date;
}

// Tipos para Refis
export interface Refil {
  id?: number;
  marca: string;
  quantidadeDisponivel: number;
  fotoUrl?: string;
  descricao?: string;
  dataCadastro: Date;
  ultimaAtualizacao: Date;
}

export interface Sigla {
  sigla: string;
  descricao: string;
}

// Tipos para TR
export interface TR {
  id?: number;
  numero: string;
  titulo: string;
  descricao: string;
  dataCriacao: string;
  status: string;
  observacoes?: string;
}

// Tipos para Análise de Proposta
export interface AnaliseProposta {
  id?: number;
  numeroProcesso: string;
  empresaProponente: string;
  dataAnalise: string;
  resultado: string;
  observacoes?: string;
}

// Tipos para Emails
export interface Email {
  id?: number;
  assunto: string;
  remetente: string;
  destinatario: string;
  categoria: string;
  status: string;
  dataRecebimento: string;
  prioridade: string;
  conteudo?: string;
}
