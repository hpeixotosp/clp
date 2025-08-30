// Configuração da API externa
export const API_CONFIG = {
  // URL base da API - será diferente em desenvolvimento e produção
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Timeout para requisições (em ms)
  TIMEOUT: 30000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints da API
  ENDPOINTS: {
    // Pontos Eletrônicos
    PONTOS_ELETRONICOS: '/api/pontos-eletronicos',
    PONTOS_ELETRONICOS_PROCESS: '/api/pontos-eletronicos/process-pdfs',
    PONTOS_ELETRONICOS_STATS: '/api/pontos-eletronicos/stats',
    PONTOS_ELETRONICOS_CLEAR: '/api/pontos-eletronicos/clear-all',
    
    // Colaboradores
    COLABORADORES: '/api/colaboradores',
    COLABORADORES_DETAILED: '/api/colaboradores/detailed',
    COLABORADORES_BULK: '/api/colaboradores/bulk',
    
    // Contracheques
    CONTRACHEQUES: '/api/contracheques',
    CONTRACHEQUES_PROCESS: '/api/contracheques/process-pdfs',
    CONTRACHEQUES_STATS: '/api/contracheques/stats/summary',
    CONTRACHEQUES_CLEAR: '/api/contracheques/clear-all',
    
    // PROADs
    PROADS: '/api/proads',
    PROADS_STATS: '/api/proads/stats',
    PROADS_ANDAMENTOS: '/api/proads/{id}/andamentos',
    
    // Demandas
    DEMANDAS: '/api/demandas',
    DEMANDAS_STATS: '/api/demandas/stats',
    DEMANDAS_ANDAMENTOS: '/api/demandas/{id}/andamentos',
    
    // Refis
    REFIS: '/api/refis',
    REFIS_STATS: '/api/refis/stats',
    
    // Siglas
    SIGLAS: '/api/siglas',
    SIGLAS_STATS: '/api/siglas/stats',
    
    // TR
    TR: '/api/tr',
    TR_STATS: '/api/tr/stats',
    
    // Análise de Propostas
    ANALISE_PROPOSTAS: '/api/analise-propostas',
    ANALISE_PROPOSTAS_STATS: '/api/analise-propostas/stats',
    
    // Health Check
    HEALTH: '/health',
  },
};

// Tipos para as respostas da API
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface APIError {
  detail: string;
  status_code?: number;
}

// Classe para gerenciar chamadas à API
export class APIClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }
  
  // Método para fazer requisições GET
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.defaultHeaders,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout na requisição');
        }
        throw error;
      }
      throw new Error('Erro desconhecido na requisição');
    }
  }
  
  // Método para fazer requisições POST
  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout na requisição');
        }
        throw error;
      }
      throw new Error('Erro desconhecido na requisição');
    }
  }
  
  // Método para fazer requisições PUT
  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout na requisição');
        }
        throw error;
      }
      throw new Error('Erro desconhecido na requisição');
    }
  }
  
  // Método para fazer requisições DELETE
  async delete<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout na requisição');
        }
        throw error;
      }
      throw new Error('Erro desconhecido na requisição');
    }
  }
  
  // Método para upload de arquivos
  async uploadFiles<T>(endpoint: string, files: File[]): Promise<APIResponse<T>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Timeout maior para uploads
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout no upload');
        }
        throw error;
      }
      throw new Error('Erro desconhecido no upload');
    }
  }
}

// Instância global do cliente da API
export const apiClient = new APIClient();

// Funções de conveniência para endpoints específicos
export const api = {
  // Pontos Eletrônicos
  pontosEletronicos: {
    list: (params?: any) => apiClient.get(API_CONFIG.ENDPOINTS.PONTOS_ELETRONICOS, params),
    processPDFs: (files: File[]) => apiClient.uploadFiles(API_CONFIG.ENDPOINTS.PONTOS_ELETRONICOS_PROCESS, files),
    stats: () => apiClient.get(API_CONFIG.ENDPOINTS.PONTOS_ELETRONICOS_STATS),
    clearAll: () => apiClient.delete(API_CONFIG.ENDPOINTS.PONTOS_ELETRONICOS_CLEAR),
  },
  
  // Colaboradores
  colaboradores: {
    list: () => apiClient.get(API_CONFIG.ENDPOINTS.COLABORADORES),
    listDetailed: () => apiClient.get(API_CONFIG.ENDPOINTS.COLABORADORES_DETAILED),
    add: (nome: string) => apiClient.put(API_CONFIG.ENDPOINTS.COLABORADORES, { nome }),
    remove: (nome: string) => apiClient.delete(API_CONFIG.ENDPOINTS.COLABORADORES, { nome }),
    replaceAll: (colaboradores: string[]) => apiClient.post(API_CONFIG.ENDPOINTS.COLABORADORES_BULK, { colaboradores }),
  },
  
  // Contracheques
  contracheques: {
    list: (params?: any) => apiClient.get(API_CONFIG.ENDPOINTS.CONTRACHEQUES, params),
    processPDFs: (files: File[]) => apiClient.uploadFiles(API_CONFIG.ENDPOINTS.CONTRACHEQUES_PROCESS, files),
    stats: () => apiClient.get(API_CONFIG.ENDPOINTS.CONTRACHEQUES_STATS),
    clearAll: () => apiClient.delete(API_CONFIG.ENDPOINTS.CONTRACHEQUES_CLEAR),
  },
  
  // PROADs
  proads: {
    list: (filters?: any) => apiClient.get(API_CONFIG.ENDPOINTS.PROADS, filters),
    create: (data: any) => apiClient.post(API_CONFIG.ENDPOINTS.PROADS, data),
    update: (id: number, data: any) => apiClient.put(`${API_CONFIG.ENDPOINTS.PROADS}/${id}`, data),
    delete: (id: number) => apiClient.delete(`${API_CONFIG.ENDPOINTS.PROADS}/${id}`),
    stats: () => apiClient.get(API_CONFIG.ENDPOINTS.PROADS_STATS),
    addAndamento: (proadId: number, andamento: any) => 
      apiClient.post(API_CONFIG.ENDPOINTS.PROADS_ANDAMENTOS.replace('{id}', proadId.toString()), andamento),
  },

  // Demandas
  demandas: {
    list: (filters?: any) => apiClient.get(API_CONFIG.ENDPOINTS.DEMANDAS, filters),
    create: (data: any) => apiClient.post(API_CONFIG.ENDPOINTS.DEMANDAS, data),
    update: (id: number, data: any) => apiClient.put(`${API_CONFIG.ENDPOINTS.DEMANDAS}/${id}`, data),
    delete: (id: number) => apiClient.delete(`${API_CONFIG.ENDPOINTS.DEMANDAS}/${id}`),
    stats: () => apiClient.get(API_CONFIG.ENDPOINTS.DEMANDAS_STATS),
    addAndamento: (demandaId: number, andamento: any) => 
      apiClient.post(API_CONFIG.ENDPOINTS.DEMANDAS_ANDAMENTOS.replace('{id}', demandaId.toString()), andamento),
  },
  
  // Health Check
  health: () => apiClient.get(API_CONFIG.ENDPOINTS.HEALTH),
};