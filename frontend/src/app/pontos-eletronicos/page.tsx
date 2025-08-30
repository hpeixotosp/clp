'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, Search, FileText, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { usePontosEletronicos, useFileUpload } from '@/hooks/useApi';
import { API_CONFIG } from '@/lib/api-config';

interface PontoEletronico {
  id: number;
  colaborador: string;
  periodo: string;
  previsto: string;
  realizado: string;
  saldo: string;
  saldo_minutos: number;
  assinatura: string;
  data_processamento: string;
  arquivo_origem?: string;
}

interface Stats {
  total: number;
  com_assinatura: number;
  sem_assinatura: number;
  saldo_positivo: number;
  saldo_negativo: number;
  saldo_zero: number;
}

export default function PontosEletronicosPage() {
  const {
    pontos,
    loading,
    error,
    stats,
    statsLoading,
    loadPontos,
    loadStats,
    clearAll,
    reset
  } = usePontosEletronicos();

  const {
    uploading,
    progress,
    error: uploadError,
    result: uploadResult,
    upload,
    reset: resetUpload
  } = useFileUpload();

  const [filtros, setFiltros] = useState({
    colaborador: '',
    periodo: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadPontos();
    loadStats();
  }, [loadPontos, loadStats]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      alert('Apenas arquivos PDF são permitidos');
    }
    
    setSelectedFiles(pdfFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Selecione pelo menos um arquivo PDF');
      return;
    }

    try {
      await upload(selectedFiles, API_CONFIG.ENDPOINTS.PONTOS_ELETRONICOS_PROCESS);
      setSelectedFiles([]);
      // Recarregar dados após upload
      loadPontos();
      loadStats();
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const handleSearch = () => {
    loadPontos(filtros);
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja remover todos os pontos eletrônicos?')) {
      try {
        await clearAll();
        loadStats();
      } catch (error) {
        console.error('Erro ao limpar dados:', error);
      }
    }
  };

  const formatSaldo = (saldo: string, saldoMinutos: number) => {
    const isNegative = saldoMinutos < 0;
    return (
      <span className={isNegative ? 'text-red-600' : saldoMinutos > 0 ? 'text-green-600' : 'text-gray-600'}>
        {saldo}
      </span>
    );
  };

  const getAssinaturaBadge = (assinatura: string) => {
    const isOk = assinatura === 'OK';
    return (
      <Badge variant={isOk ? 'default' : 'secondary'} className={isOk ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
        {isOk ? (
          <><CheckCircle className="w-3 h-3 mr-1" /> {assinatura}</>
        ) : (
          <><XCircle className="w-3 h-3 mr-1" /> {assinatura}</>
        )}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pontos Eletrônicos</h1>
          <p className="text-muted-foreground">Gerencie e processe pontos eletrônicos dos colaboradores</p>
        </div>
        <Button 
          onClick={handleClearAll} 
          variant="destructive" 
          disabled={loading || !pontos?.pontos?.length}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Todos
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Assinatura</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.com_assinatura}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Assinatura</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.sem_assinatura}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Positivo</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.saldo_positivo}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Negativo</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.saldo_negativo}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Zero</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.saldo_zero}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload de PDFs</TabsTrigger>
          <TabsTrigger value="lista">Lista de Pontos</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processar PDFs de Frequência</CardTitle>
              <CardDescription>
                Faça upload dos arquivos PDF de frequência para processamento automático
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pdf-files">Selecionar Arquivos PDF</Label>
                <Input
                  id="pdf-files"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <Label>Arquivos Selecionados:</Label>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <Label>Progresso do Upload</Label>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{progress}% concluído</p>
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {uploadResult && (
                <Alert>
                  <AlertDescription>
                    ✅ {uploadResult.total_salvos} pontos eletrônicos processados com sucesso!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={selectedFiles.length === 0 || uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Processando...' : 'Processar PDFs'}
                </Button>
                
                {(uploadError || uploadResult) && (
                  <Button variant="outline" onClick={resetUpload}>
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="colaborador">Colaborador</Label>
                  <Input
                    id="colaborador"
                    placeholder="Nome do colaborador"
                    value={filtros.colaborador}
                    onChange={(e) => setFiltros(prev => ({ ...prev, colaborador: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Input
                    id="periodo"
                    placeholder="Ex: 01/07/2025 a 31/07/2025"
                    value={filtros.periodo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pontos */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Carregando pontos eletrônicos...</p>
                </div>
              </CardContent>
            </Card>
          ) : pontos?.pontos?.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {pontos.pontos.length} de {pontos.total} registros
              </div>
              
              <div className="grid gap-4">
                {pontos.pontos.map((ponto: PontoEletronico) => (
                  <Card key={ponto.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div>
                          <Label className="text-xs text-muted-foreground">Colaborador</Label>
                          <p className="font-medium">{ponto.colaborador}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Período</Label>
                          <p className="text-sm">{ponto.periodo}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Previsto</Label>
                          <p className="text-sm">{ponto.previsto}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Realizado</Label>
                          <p className="text-sm">{ponto.realizado}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Saldo</Label>
                          <p className="text-sm font-medium">
                            {formatSaldo(ponto.saldo, ponto.saldo_minutos)}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Assinatura</Label>
                          <div className="mt-1">
                            {getAssinaturaBadge(ponto.assinatura)}
                          </div>
                        </div>
                      </div>
                      
                      {ponto.arquivo_origem && (
                        <div className="mt-3 pt-3 border-t">
                          <Label className="text-xs text-muted-foreground">Arquivo de Origem</Label>
                          <p className="text-xs text-muted-foreground">{ponto.arquivo_origem}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum ponto eletrônico encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Faça upload de PDFs ou ajuste os filtros de busca
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}