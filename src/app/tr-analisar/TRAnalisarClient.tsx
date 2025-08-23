"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Search, AlertTriangle, CheckCircle, Info, Loader2, X } from 'lucide-react';

interface AnalysisResult {
  sectionTitle: string;
  findings: Finding[];
}

interface Finding {
  category: string;
  description: string;
  legalBasis?: string;
  recommendation?: string;
  potentialImpact?: string;
}

export function TRAnalisarClient() {
  const [documentType, setDocumentType] = useState<'etp' | 'tr'>('etp');
  const [focusPoints, setFocusPoints] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !textInput.trim()) {
      alert('Por favor, forneça um arquivo PDF ou texto para análise.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simular progresso da análise
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }
      if (textInput.trim()) {
        formData.append('text', textInput);
      }
      formData.append('document_type', documentType);
      if (focusPoints.trim()) {
        formData.append('focus_points', focusPoints);
      }

      const response = await fetch('/api/tr-analisar/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setAnalysisProgress(100);
      } else {
        const errorData = await response.json();
        alert(`Erro na análise: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert(`Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  };

  const getCategoryBadge = (category: string) => {
    // Limpar emojis e caracteres especiais da categoria
    const cleanCategory = category.replace(/[^\x00-\x7F]+/g, '').trim();
    
    // Mapear categorias para variantes de badge
    if (cleanCategory.includes('CONFORMIDADE')) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{cleanCategory}</Badge>;
    } else if (cleanCategory.includes('NAO CONFORMIDADE') || cleanCategory.includes('NÃO CONFORMIDADE')) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">{cleanCategory}</Badge>;
    } else if (cleanCategory.includes('SUGESTAO') || cleanCategory.includes('SUGESTÃO')) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">{cleanCategory}</Badge>;
    } else {
      return <Badge variant="secondary">{cleanCategory}</Badge>;
    }
  };

  const clearAll = () => {
    setUploadedFile(null);
    setTextInput('');
    setFocusPoints('');
    setResults([]);
    setAnalysisProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise Técnica de ETP/TR</h1>
          <p className="text-muted-foreground">
            Análise automatizada de conformidade legal de Estudos Técnicos Preliminares e Termos de Referência
          </p>
        </div>
        <Button onClick={clearAll} variant="outline">
          Limpar Tudo
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna Esquerda: Configuração e Upload */}
        <div className="space-y-6">
          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Configurações da Análise
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para a análise técnica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">Tipo de Documento</Label>
                <Select value={documentType} onValueChange={(value: 'etp' | 'tr') => setDocumentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="etp">Estudo Técnico Preliminar (ETP)</SelectItem>
                    <SelectItem value="tr">Termo de Referência (TR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus-points">Pontos de Foco (Opcional)</Label>
                <Textarea
                  id="focus-points"
                  placeholder="Especifique pontos específicos para análise detalhada..."
                  value={focusPoints}
                  onChange={(e) => setFocusPoints(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload de Arquivo - Estilo Melhorado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de PDF
              </CardTitle>
              <CardDescription>
                Faça upload do arquivo PDF para análise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Área de Upload Melhorada */}
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isAnalyzing}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Clique para selecionar PDF ou arraste e solte
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Suporta arquivos PDF
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Arquivo Selecionado */}
              {uploadedFile && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entrada de Texto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Entrada de Texto (Alternativa)
              </CardTitle>
              <CardDescription>
                Cole o texto do documento diretamente para análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Cole aqui o texto do TR ou ETP para análise..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={8}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Botão de Análise */}
          {/* Progresso da Análise */}
          {isAnalyzing && (
            <div className="space-y-3 mb-4">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {analysisProgress}% - Analisando {documentType === 'tr' ? 'Termo de Referência' : 'Estudo Técnico Preliminar'}...
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || (!uploadedFile && !textInput.trim())}
              size="lg"
              className="px-8"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Iniciar Análise
                </>
              )}
            </Button>
          </div>

        </div>

        {/* Coluna Direita: Resultados */}
        <div className="space-y-6">
          {results.length > 0 ? (
            results.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {section.sectionTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.findings.map((finding, findingIndex) => (
                    <div key={findingIndex} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {getCategoryBadge(finding.category)}
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">{finding.description}</p>
                          
                          <div className="grid gap-2 text-sm">
                            {finding.legalBasis && (
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-blue-600">Fundamentação Legal:</span>
                                  <p className="text-muted-foreground">{finding.legalBasis}</p>
                                </div>
                              </div>
                            )}
                            
                            {finding.recommendation && (
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-green-600">Recomendação:</span>
                                  <p className="text-muted-foreground">{finding.recommendation}</p>
                                </div>
                              </div>
                            )}
                            
                            {finding.potentialImpact && (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-orange-600">Impacto:</span>
                                  <p className="text-muted-foreground">{finding.potentialImpact}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Análise</CardTitle>
                <CardDescription>
                  Aguardando arquivos para análise.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhum resultado disponível</p>
                  <p className="text-sm">Faça o upload e processe os arquivos PDF para ver os resultados.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
