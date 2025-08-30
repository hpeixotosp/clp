/**
 * Cliente de API para consumir o backend Python na DigitalOcean
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://143.110.196.243:8000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ContrachequeData {
  colaborador: string;
  periodo: string;
  tipoDocumento: string;
  vencimentos: string;
  descontos: string;
  valorLiquido: string;
  statusValidacao: string;
  processadoEm: string;
}

export interface ProcessamentoResultado {
  status: 'sucesso' | 'erro';
  dados?: ContrachequeData;
  erro?: string;
}

export interface ProcessamentoResponse {
  success: boolean;
  resultados: ProcessamentoResultado[];
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Processamento de Contracheques
  async processarContracheques(files: File[]): Promise<ProcessamentoResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/process-contracheques`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao processar contracheques:', error);
      return {
        success: false,
        resultados: [],
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Análise de Proposta
  async analisarProposta(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/api/analise-proposta`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao analisar proposta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Análise de TR
  async analisarTR(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/api/analise-tr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao analisar TR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Análise de TR ETP
  async analisarTREtp(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/api/analise-tr-etp`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao analisar TR ETP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Obter informações da API
  async getApiInfo(): Promise<ApiResponse> {
    return this.request('/');
  }
}

// Instância global do cliente de API
export const apiClient = new ApiClient();

// Hook personalizado para usar a API
export const useApi = () => {
  return {
    processarContracheques: apiClient.processarContracheques.bind(apiClient),
    analisarProposta: apiClient.analisarProposta.bind(apiClient),
    analisarTR: apiClient.analisarTR.bind(apiClient),
    analisarTREtp: apiClient.analisarTREtp.bind(apiClient),
    healthCheck: apiClient.healthCheck.bind(apiClient),
    getApiInfo: apiClient.getApiInfo.bind(apiClient),
  };
};

export default apiClient;
