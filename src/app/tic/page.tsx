"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Search, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X
} from "lucide-react";
import { TimeSheetResult } from "@/types/timesheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function TICPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TimeSheetResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [saldoFilter, setSaldoFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof TimeSheetResult>("colaborador");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [processingStats, setProcessingStats] = useState({
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0
  });
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Carregar dados salvos do banco ao montar o componente
  useEffect(() => {
    carregarDadosSalvos();
  }, []);

  const carregarDadosSalvos = async () => {
    try {
      const response = await fetch('/api/pontos-eletronicos');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const pontosConvertidos = data.data.map((ponto: Record<string, unknown>) => ({
            colaborador: ponto.colaborador,
            periodo: ponto.periodo,
            previsto: ponto.previsto,
            realizado: ponto.realizado,
            saldo: ponto.saldo,
            assinatura: ponto.assinatura === 1,
            saldoMinutes: ponto.saldo_minutos
          }));
          setResults(pontosConvertidos);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    setSelectedFiles(pdfFiles);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setAnalysisProgress(0);
    setProcessingStats({
      totalFiles: selectedFiles.length,
      processedFiles: 0,
      failedFiles: 0
    });
    
    // Progresso inicial
    setAnalysisProgress(10);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      console.log(`=== PROCESSANDO ${selectedFiles.length} ARQUIVO(S) VIA PYTHON ===`);

      // Progresso: iniciando processamento
      setAnalysisProgress(30);
      
      const response = await fetch('/api/process-pdfs', {
        method: 'POST',
        body: formData
      });
      
      // Progresso: processamento em andamento
      setAnalysisProgress(70);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Resultados recebidos do Python:', data);
        // Progresso: processando resultados
        setAnalysisProgress(90);
        
        // Simular pequeno delay para mostrar progresso de 90% a 100%
        setTimeout(() => setAnalysisProgress(100), 500);
        
        // Parse do CSV string para array de objetos
        const csvLines = (data.csvContent || '').split('\n').filter((line: string) => line.trim());
        const headers = csvLines[0]?.split(',') || [];
        const csvData = csvLines.slice(1).map((line: string) => {
          const values = line.split(',');
          const row: Record<string, string> = {};
          headers.forEach((header: string, index: number) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          return row;
        });
        
        // Converter resultados do CSV para o formato esperado
        const processedResults = csvData
          .filter((row: Record<string, unknown>) => row.colaborador && row.periodo && row.previsto && row.realizado)
          .map((row: Record<string, unknown>) => ({
            colaborador: row.colaborador as string,
            periodo: row.periodo as string,
            previsto: row.previsto as string,
            realizado: row.realizado as string,
            saldo: row.saldo as string,
            assinatura: row.assinatura === 'Sim',
            saldoMinutes: row.saldo_minutos ? parseInt(row.saldo_minutos as string) : parseSaldoToMinutes(row.saldo as string || '+00:00')
          }));

        // Salvar cada resultado no banco SQLite
        for (const result of processedResults) {
          try {
            await fetch('/api/pontos-eletronicos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                colaborador: result.colaborador,
                periodo: result.periodo,
                previsto: result.previsto,
                realizado: result.realizado,
                saldo: result.saldo,
                saldo_minutos: result.saldoMinutes,
                assinatura: result.assinatura,
                arquivo_origem: selectedFiles[0]?.name || 'PDF processado'
              })
            });
          } catch (error) {
            console.error('Erro ao salvar no banco:', error);
          }
        }

        setResults(prev => [...prev, ...processedResults]);
        setProcessingStats(prev => ({
          ...prev,
          processedFiles: selectedFiles.length
        }));
        
        // Recarregar dados salvos do banco para garantir sincronização
        await carregarDadosSalvos();
        
        console.log(`✅ ${processedResults.length} resultado(s) processado(s) e salvos no banco`);
      } else {
        throw new Error(data.error || 'Erro desconhecido no processamento');
      }

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setProcessingStats(prev => ({
        ...prev,
        failedFiles: selectedFiles.length
      }));
    } finally {
      setIsProcessing(false);
      setSelectedFiles([]);
      setTimeout(() => setAnalysisProgress(0), 2000); // Resetar progresso após um atraso
    }
  };

  const limparFila = async () => {
    try {
      // Limpar dados do banco de dados
      const response = await fetch('/api/pontos-eletronicos', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Limpar também a UI
        setResults([]);
        setSearchTerm("");
        setSelectedMonth("all");
        setSaldoFilter("all");
        console.log('✅ Todos os dados foram removidos permanentemente');
        
        // Mostrar feedback visual
        alert('Todos os dados foram removidos permanentemente!');
      } else {
        throw new Error('Erro ao limpar dados do servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      alert('Erro ao limpar dados. Tente novamente.');
    }
  };

  // Função para limpar apenas a visualização, mantendo dados carregados
  const limparVisualizacao = async () => {
    try {
      // Limpar apenas a visualização, mas manter os dados carregados
      setSearchTerm("");
      setSelectedMonth("all");
      setSaldoFilter("all");
      console.log('✅ Visualização limpa (dados mantidos para filtros)');
      
      // Mostrar feedback visual
      alert('Visualização limpa! Os dados permanecem carregados e os filtros funcionarão normalmente.');
    } catch (error) {
      console.error('❌ Erro ao limpar visualização:', error);
    }
  };

  // Função desabilitada - não remover dados do banco
  const limparBanco = async () => {
    alert('⚠️ Função desabilitada por segurança. Os dados permanecerão salvos no banco.');
    return;
  };

  const parseSaldoToMinutes = (saldo: string): number => {
    try {
      const sign = saldo.startsWith('-') ? -1 : 1;
      const timePart = saldo.replace(/^[+-]/, '');
      const [hours, minutes] = timePart.split(':').map(Number);
      return sign * (hours * 60 + minutes);
    } catch {
      return 0;
    }
  };

  const handleSort = (field: keyof TimeSheetResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof TimeSheetResult) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? <ChevronDown className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 rotate-180" />;
  };

  const getSaldoBadgeVariant = (saldoMinutes: number) => {
    return saldoMinutes < 0 ? "destructive" : "default";
  };

  const getAssinaturaBadgeVariant = (assinado: boolean) => {
    return assinado ? "default" : "secondary";
  };

  // Filtrar e ordenar resultados
  const filteredResults = results
    .filter(result => {
      const matchesSearch = result.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.periodo.includes(searchTerm);
      const matchesMonth = selectedMonth === "all" || result.periodo.includes(selectedMonth);
      
      let matchesSaldo = true;
      if (saldoFilter === "positive") {
        matchesSaldo = result.saldoMinutes > 0;
      } else if (saldoFilter === "negative") {
        matchesSaldo = result.saldoMinutes < 0;
      } else if (saldoFilter === "zero") {
        matchesSaldo = result.saldoMinutes === 0;
      }
      
      return matchesSearch && matchesMonth && matchesSaldo;
    })
    .sort((a, b) => {
      // Quando um mês específico é selecionado, priorizar ordenação alfabética por colaborador
      if (selectedMonth !== "all" && sortField === "colaborador") {
        const comparison = a.colaborador.localeCompare(b.colaborador, 'pt-BR', { 
          sensitivity: 'base',
          numeric: true,
          ignorePunctuation: true
        });
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Tratamento especial para campos numéricos
      if (sortField === "saldoMinutes") {
        aValue = a.saldoMinutes;
        bValue = b.saldoMinutes;
      }
      
      // Tratamento para valores undefined ou null
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";
      
      // Comparação de strings com locale para nomes de colaboradores
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue, 'pt-BR', { 
          sensitivity: 'base',
          numeric: true,
          ignorePunctuation: true
        });
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      // Comparação numérica
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      // Fallback para outros tipos
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Calcular métricas
  const totalProcessed = results.length;
  const signedCount = results.filter(r => r.assinatura).length;
  const pendingCount = results.filter(r => !r.assinatura).length;
  const positiveBalance = results.filter(r => r.saldoMinutes > 0).length;
  const negativeBalance = results.filter(r => r.saldoMinutes < 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Tabs para Frequência e Contracheque */}
        <Tabs defaultValue="frequencia" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
            <TabsTrigger value="contracheque">Contracheque</TabsTrigger>
          </TabsList>

          <TabsContent value="frequencia" className="space-y-4">
            {/* Header com Título e Botões de Ação */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Controle de Frequência</h1>
                <p className="text-muted-foreground mt-1">
                  {totalProcessed} arquivo(s) processado(s) com sucesso
                </p>
              </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={carregarDadosSalvos}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <FileText className="h-4 w-4" />
              Recarregar Dados
            </Button>
            
            <Button 
              variant="outline" 
              onClick={limparVisualizacao}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
            
            <Button 
              variant="outline" 
              onClick={limparFila}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Tudo
            </Button>
            
            <Button 
              variant="outline" 
              onClick={limparBanco}
              className="flex items-center gap-2 text-gray-400 cursor-not-allowed"
              disabled
            >
              <Trash2 className="h-4 w-4" />
              Limpar Banco
            </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProcessed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{signedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo +</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{positiveBalance}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo -</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{negativeBalance}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por colaborador ou período"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Dropdown de Meses */}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todos os Meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Meses</SelectItem>
                  <SelectItem value="01">Janeiro</SelectItem>
                  <SelectItem value="02">Fevereiro</SelectItem>
                  <SelectItem value="03">Março</SelectItem>
                  <SelectItem value="04">Abril</SelectItem>
                  <SelectItem value="05">Maio</SelectItem>
                  <SelectItem value="06">Junho</SelectItem>
                  <SelectItem value="07">Julho</SelectItem>
                  <SelectItem value="08">Agosto</SelectItem>
                  <SelectItem value="09">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por Saldo */}
              <Select value={saldoFilter} onValueChange={setSaldoFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todos os Saldos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Saldos</SelectItem>
                  <SelectItem value="positive">Saldo Positivo (+)</SelectItem>
                  <SelectItem value="negative">Saldo Negativo (-)</SelectItem>
                  <SelectItem value="zero">Saldo Zero (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Arquivos - Melhorado */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de PDFs de Ponto</CardTitle>
            <CardDescription>
              Selecione um ou mais arquivos PDF para análise automática via Python
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Área de Upload Melhorada */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              <Input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Clique para selecionar PDFs ou arraste e solte
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suporta múltiplos arquivos PDF
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Lista de Arquivos Selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Arquivos selecionados ({selectedFiles.length})</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllFiles}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar Todos
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Processar */}
            <div className="flex justify-center">
              <Button
                onClick={handleProcessFiles}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="min-w-[200px] h-12 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Processar Ponto(s)
                  </>
                )}
              </Button>
            </div>

            {/* Estatísticas de Processamento */}
            {isProcessing && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Processando via Python...</span>
                </div>
                <div className="space-y-4">
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {analysisProgress}% - Processando folhas de ponto...
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Total: {processingStats.totalFiles} | 
                    Processados: {processingStats.processedFiles} | 
                    Falharam: {processingStats.failedFiles}
                  </div>
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Erro no processamento:</span>
                </div>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        {filteredResults.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("colaborador")}>
                        <div className="flex items-center gap-1">
                          Colaborador
                          {getSortIcon("colaborador")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("periodo")}>
                        <div className="flex items-center gap-1">
                          Período
                          {getSortIcon("periodo")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("previsto")}>
                        <div className="flex items-center gap-1">
                          Previsto
                          {getSortIcon("previsto")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("realizado")}>
                        <div className="flex items-center gap-1">
                          Realizado
                          {getSortIcon("realizado")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort("saldoMinutes")}>
                        <div className="flex items-center gap-1 justify-end">
                          BH (Saldo)
                          {getSortIcon("saldoMinutes")}
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort("assinatura")}>
                        <div className="flex items-center gap-1 justify-center">
                          Assinatura
                          {getSortIcon("assinatura")}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{result.colaborador}</TableCell>
                        <TableCell>{result.periodo}</TableCell>
                        <TableCell>{result.previsto}</TableCell>
                        <TableCell>{result.realizado}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={getSaldoBadgeVariant(result.saldoMinutes)}
                            className="font-mono text-sm px-3 py-1"
                          >
                            {result.saldo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={getAssinaturaBadgeVariant(result.assinatura)}
                            className="flex items-center gap-1 mx-auto w-fit"
                          >
                            {result.assinatura ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                OK
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                Pendente
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem inicial */}
        {results.length === 0 && !isProcessing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aguardando PDFs para análise</h3>
              <p className="text-muted-foreground">
                Selecione um ou mais arquivos PDF de ponto para iniciar o processamento via Python
              </p>
            </CardContent>
          </Card>
        )}
            </TabsContent>

            <TabsContent value="contracheque" className="space-y-4">
              <ContrachequeTab />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

// Componente separado para a aba Contracheque
function ContrachequeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{
    colaborador: string;
    mesReferencia: string;
    status: string;
    detalhes: string;
  }>>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const processFiles = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/contracheque/process', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setCurrentStep('results');
      } else {
        console.error('Erro ao processar arquivos');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setFiles([]);
    setResults([]);
    setCurrentStep('upload');
  };

  return (
    <div className="space-y-6">
      {/* Header com Título e Botões de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Validação de Pagamento</h1>
          <p className="text-muted-foreground mt-1">
            Validação automatizada de contracheques e recibos de pagamento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={clearResults}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Upload de Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de PDFs de Contracheque e Recibo</CardTitle>
          <CardDescription>
            Selecione arquivos PDF de contracheque e recibos para validação automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 'upload' && (
            <>
              {/* Área de Upload Melhorada */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                  id="contracheque-file-upload"
                />
                <label htmlFor="contracheque-file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Clique para selecionar PDFs ou arraste e solte
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Selecione pelo menos 2 arquivos: contracheque e recibo correspondente
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Lista de Arquivos Selecionados */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Arquivos selecionados ({files.length})</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFiles}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar Todos
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão Processar */}
              <div className="flex justify-center">
                <Button
                  onClick={processFiles}
                  disabled={files.length < 2 || isProcessing}
                  className="min-w-[200px] h-12 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Processar Ponto(s)
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Estado de Processamento */}
          {currentStep === 'processing' && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Processando via Python...</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Validando contracheques e recibos...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Resultados */}
      {currentStep === 'results' && results.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Mês de Referência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{result.colaborador}</TableCell>
                      <TableCell>{result.mesReferencia}</TableCell>
                      <TableCell>
                        <Badge
                          variant={result.status === 'Confere' ? 'default' : 'destructive'}
                          className="font-mono text-sm px-3 py-1"
                        >
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.detalhes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem inicial */}
      {results.length === 0 && !isProcessing && currentStep === 'upload' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aguardando PDFs para validação</h3>
            <p className="text-muted-foreground">
              Selecione arquivos PDF de contracheque e recibo para iniciar a validação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
