import { useState, useEffect, useCallback } from 'react';
import { api, APIResponse } from '@/lib/api-config';

// Hook para gerenciar estado de loading e erro
export function useApiState<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<APIResponse<T>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Erro na requisição');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Hook específico para pontos eletrônicos
export function usePontosEletronicos() {
  const { data, loading, error, execute, reset } = useApiState();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadPontos = useCallback((params?: any) => {
    return execute(() => api.pontosEletronicos.list(params));
  }, [execute]);

  const processPDFs = useCallback(async (files: File[]) => {
    return execute(() => api.pontosEletronicos.processPDFs(files));
  }, [execute]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.pontosEletronicos.stats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    return execute(() => api.pontosEletronicos.clearAll());
  }, [execute]);

  return {
    pontos: data,
    loading,
    error,
    stats,
    statsLoading,
    loadPontos,
    processPDFs,
    loadStats,
    clearAll,
    reset,
  };
}

// Hook específico para colaboradores
export function useColaboradores() {
  const { data, loading, error, execute, reset } = useApiState();
  const [detailed, setDetailed] = useState<any[]>([]);
  const [detailedLoading, setDetailedLoading] = useState(false);

  const loadColaboradores = useCallback(() => {
    return execute(() => api.colaboradores.list());
  }, [execute]);

  const loadDetailed = useCallback(async () => {
    setDetailedLoading(true);
    try {
      const response = await api.colaboradores.listDetailed();
      if (response.success) {
        setDetailed(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar colaboradores detalhados:', err);
    } finally {
      setDetailedLoading(false);
    }
  }, []);

  const addColaborador = useCallback(async (nome: string) => {
    return execute(() => api.colaboradores.add(nome));
  }, [execute]);

  const removeColaborador = useCallback(async (nome: string) => {
    return execute(() => api.colaboradores.remove(nome));
  }, [execute]);

  const replaceAll = useCallback(async (colaboradores: string[]) => {
    return execute(() => api.colaboradores.replaceAll(colaboradores));
  }, [execute]);

  return {
    colaboradores: data,
    detailed,
    loading,
    detailedLoading,
    error,
    loadColaboradores,
    loadDetailed,
    addColaborador,
    removeColaborador,
    replaceAll,
    reset,
  };
}

// Hook específico para contracheques
export function useContracheques() {
  const { data, loading, error, execute, reset } = useApiState();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadContracheques = useCallback((params?: any) => {
    return execute(() => api.contracheques.list(params));
  }, [execute]);

  const processPDFs = useCallback(async (files: File[]) => {
    return execute(() => api.contracheques.processPDFs(files));
  }, [execute]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.contracheques.stats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    return execute(() => api.contracheques.clearAll());
  }, [execute]);

  return {
    contracheques: data,
    loading,
    error,
    stats,
    statsLoading,
    loadContracheques,
    processPDFs,
    loadStats,
    clearAll,
    reset,
  };
}

// Hook específico para PROADs
export function useProads() {
  const { data, loading, error, execute, reset } = useApiState();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadProads = useCallback((filters?: any) => {
    return execute(() => api.proads.list(filters));
  }, [execute]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.proads.stats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const createProad = useCallback(async (data: any) => {
    return execute(() => api.proads.create(data));
  }, [execute]);

  const updateProad = useCallback(async (id: number, data: any) => {
    return execute(() => api.proads.update(id, data));
  }, [execute]);

  const deleteProad = useCallback(async (id: number) => {
    return execute(() => api.proads.delete(id));
  }, [execute]);

  const addAndamento = useCallback(async (proadId: number, andamento: any) => {
    return execute(() => api.proads.addAndamento(proadId, andamento));
  }, [execute]);

  return {
    proads: data,
    loading,
    error,
    stats,
    statsLoading,
    loadProads,
    loadStats,
    createProad,
    updateProad,
    deleteProad,
    addAndamento,
    reset,
  };
}

// Hook específico para demandas
export function useDemandas() {
  const { data, loading, error, execute, reset } = useApiState();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadDemandas = useCallback((filters?: any) => {
    return execute(() => api.demandas.list(filters));
  }, [execute]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.demandas.stats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const createDemanda = useCallback(async (data: any) => {
    return execute(() => api.demandas.create(data));
  }, [execute]);

  const updateDemanda = useCallback(async (id: number, data: any) => {
    return execute(() => api.demandas.update(id, data));
  }, [execute]);

  const deleteDemanda = useCallback(async (id: number) => {
    return execute(() => api.demandas.delete(id));
  }, [execute]);

  const addAndamento = useCallback(async (demandaId: number, andamento: any) => {
    return execute(() => api.demandas.addAndamento(demandaId, andamento));
  }, [execute]);

  return {
    demandas: data,
    loading,
    error,
    stats,
    statsLoading,
    loadDemandas,
    loadStats,
    createDemanda,
    updateDemanda,
    deleteDemanda,
    addAndamento,
    reset,
  };
}

// Hook para verificar saúde da API
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const response = await api.health();
      setIsHealthy(response.success);
      setLastCheck(new Date());
    } catch (err) {
      setIsHealthy(false);
      setLastCheck(new Date());
    } finally {
      setChecking(false);
    }
  }, []);

  // Verificar saúde automaticamente ao montar o componente
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    isHealthy,
    checking,
    lastCheck,
    checkHealth,
  };
}

// Hook para upload de arquivos com progresso
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const upload = useCallback(async (files: File[], endpoint: string) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simular progresso (em uma implementação real, você usaria XMLHttpRequest para progresso real)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let response;
      if (endpoint.includes('pontos-eletronicos')) {
        response = await api.pontosEletronicos.processPDFs(files);
      } else if (endpoint.includes('contracheques')) {
        response = await api.contracheques.processPDFs(files);
      } else {
        throw new Error('Endpoint não suportado');
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || 'Erro no upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido no upload');
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    result,
    upload,
    reset,
  };
}