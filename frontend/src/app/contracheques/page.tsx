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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Upload, Search, FileText, DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useContracheques, useFileUpload } from '@/hooks/useApi';
import { API_CONFIG } from '@/lib/api-config';

interface Contracheque {
  id: number;
  colaborador: string;
  periodo: string;
  tipo_documento: string;
  vencimentos: string;
  descontos: string;
  valor_liquido: string;
  status: string;
  status_validacao: string;
  data_processamento: string;
  arquivo_origem?: string;
  erro?: string;
}

interface ContrachequeStats {
  total: number;
  total_vencimentos: number;
  total_descontos: number;
  total_liquido: number;
  media_vencimentos: number;
  media_descontos: number;
  media_liquido: number;
  por_status: Record<string, number>;
  por_validacao: Record<string, number>;
}

export default function ContrachequesPage() {
  const {
    contracheques,
    loading,
    error,
    stats,
    statsLoading,
    loadContracheques,
    loadStats,
    clearAll,
    reset
  } = useContracheques();

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
    loadContracheques();
    loadStats();
  }, [loadContracheques, loadStats]);

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
      await upload(selectedFiles, API_CONFIG.ENDPOINTS.CONTRACHEQUES_PROCESS);
      setSelectedFiles([]);
      // Recarregar dados após upload
      loadContracheques();
      loadStats();
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const handleSearch = () => {
    loadContracheques(filtros);
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja remover todos os contracheques?')) {
      try {
        await clearAll();
        loadStats();
      } catch (error) {
        console.error('Erro ao limpar dados:', error);
      }
    }
  };

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') {
      // Tentar converter string para número
      const numValue = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (isNaN(numValue)) return value;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue);
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
      'processado': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'erro': { variant: 'destructive', color: 'bg-red-100 text-red-800' },
      'pendente': { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
    };
    
    const config = statusMap[status] || { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  const getValidationBadge = (validation: string) => {
    const validationMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
      'validado': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'pendente': { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      'erro': { variant: 'destructive', color: 'bg-red-100 text-red-800' },
      'sem_recibo': { variant: 'outline', color: 'bg-gray-100 text-gray-800' },
    };
    
    const config = validationMap[validation] || { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {validation.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contracheques</h1>
          <p className="text-muted-foreground">Gerencie e processe contracheques dos colaboradores</p>
        </div>
        <Button 
          onClick={handleClearAll} 
          variant="destructive" 
          disabled={loading || !contracheques?.contracheques?.length}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Todos
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contracheques</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vencimentos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.total_vencimentos || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Descontos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.total_descontos || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.total_liquido || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload de PDFs</TabsTrigger>
          <TabsTrigger value="lista">Lista de Contracheques</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processar PDFs de Contracheques</CardTitle>
              <CardDescription>
                Faça upload dos arquivos PDF de contracheques para processamento automático
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
                    ✅ {uploadResult.processed_count} contracheques processados com sucesso!
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
                    placeholder="Ex: Janeiro/2024"
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

          {/* Lista de Contracheques */}
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
                  <p>Carregando contracheques...</p>
                </div>
              </CardContent>
            </Card>
          ) : contracheques?.contracheques?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Contracheques Processados</CardTitle>
                <CardDescription>
                  {contracheques.contracheques.length} de {contracheques.total} registros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vencimentos</TableHead>
                      <TableHead>Descontos</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracheques.contracheques.map((contracheque: Contracheque) => (
                      <TableRow key={contracheque.id}>
                        <TableCell className="font-medium">{contracheque.colaborador}</TableCell>
                        <TableCell>{contracheque.periodo}</TableCell>
                        <TableCell>{contracheque.tipo_documento || 'Contracheque'}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(contracheque.vencimentos || '0')}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(contracheque.descontos || '0')}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {formatCurrency(contracheque.valor_liquido || '0')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(contracheque.status || 'pendente')}
                        </TableCell>
                        <TableCell>
                          {getValidationBadge(contracheque.status_validacao || 'pendente')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum contracheque encontrado</p>
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