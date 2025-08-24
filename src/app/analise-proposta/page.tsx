"use client";

import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, ListTree, FileScan, CheckCircle2, AlertTriangle, X, FileUp, FileText, Trash2, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

// Estrutura de um item do relatório de análise
interface AnalysisItem {
  requirement: string;
  status: "Atende" | "Não Atende" | "Parcialmente Atende" | "Erro na Análise";
  evidence: string;
  page: number | null;
}

// Estrutura da resposta da API
interface AnalysisResponse {
  analysisItems?: AnalysisItem[];
  items?: string[];
  error?: string;
}

type AnalysisStep = "1_UPLOAD_TR" | "2_SELECT_ITEM" | "3_ANALYZE" | "3_SHOW_REPORT" | "4_SHOW_REPORT";

// Componente para renderizar o status com cores
const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'Atende':
            return <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">Atende</Badge>;
        case 'Não Atende':
            return <Badge variant="destructive">Não Atende</Badge>;
        case 'Parcialmente':
            return <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">Parcialmente</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

interface FileUploadBoxProps {
    files: File[];
    onUpload: (files: File[]) => void;
    onRemove: (file: File) => void;
    disabled?: boolean;
    id?: string;
}

const FileUploadBox = ({ files, onUpload, onRemove, disabled, id }: FileUploadBoxProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onUpload(Array.from(e.target.files));
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUpload(Array.from(e.dataTransfer.files));
        }
    };

    const commonDragProps = {
        onDragEnter: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); },
        onDragLeave: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); },
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); },
        onDrop: handleDrop,
    };

    if (files.length > 0) {
        return (
            <div className="space-y-2">
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 border rounded-lg bg-background">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onRemove(file)} disabled={disabled} className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={disabled}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Adicionar mais arquivos
                </Button>
                <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf" />
            </div>
        );
    }
    
    return (
        <div
            {...commonDragProps}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-32 px-4 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary-foreground' : 'border-border hover:border-primary/50'}`}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                </p>
                <p className="text-xs text-muted-foreground">Arquivos PDF</p>
            </div>
            <input id={id} type="file" ref={inputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf" />
        </div>
    );
};


export default function AnalisePropostaPage() {
  const [step, setStep] = useState<AnalysisStep>("1_UPLOAD_TR");
  const [trFile, setTrFile] = useState<File | null>(null);
  const [proposalFiles, setProposalFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [identifiedItems, setIdentifiedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisItem[]>([]);

  const resetState = () => {
    setStep("1_UPLOAD_TR");
    setTrFile(null);
    setProposalFiles([]);
    setIsLoading(false);
    setError(null);
    setIdentifiedItems([]);
    setSelectedItem("");
    setAnalysisResult([]);
  };

  const handleItemSelectionChange = (itemName: string) => {
    setSelectedItem(itemName);
    setProposalFiles([]); // Limpa as propostas anteriores ao trocar de item
    setAnalysisResult([]); // Limpa o resultado anterior
    setError(null);
    setStep("2_SELECT_ITEM"); // Garante que estamos no passo de análise
  };

  const handleAnalyzeAnotherItem = () => {
    setStep("2_SELECT_ITEM");
    setProposalFiles([]);
    setSelectedItem("");
    setAnalysisResult([]);
    setError(null);
  };

  const handleFileUpload = (files: FileList | null, type: 'tr' | 'proposal') => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== "application/pdf") {
      alert("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (type === 'tr') setTrFile(file);
    if (type === 'proposal') setProposalFiles(prevFiles => [...prevFiles, file]);
  };

  const removeFile = (type: 'tr' | 'proposal') => {
    if (type === 'tr') setTrFile(null);
    if (type === 'proposal') setProposalFiles(prevFiles => prevFiles.filter(f => f !== proposalFiles.find(pf => pf.name === f.name)));
  };

  const handleProposalUpload = (newFiles: File[]) => {
      setProposalFiles(prevFiles => [...prevFiles, ...newFiles.filter(f => f.type === 'application/pdf')]);
  };

  const handleProposalRemove = (fileToRemove: File) => {
      setProposalFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const handleIdentifyItems = async () => {
    if (!trFile) return;
    setIsLoading(true);
    setLoadingMessage("Identificando itens no TR...");
    setError(null);
    try {
      const formData = new FormData();
      formData.append('mode', 'identify_items');
      formData.append('trFile', trFile);

      const response = await fetch('/api/analise-proposta', { method: 'POST', body: formData });
      const result: AnalysisResponse = await response.json();
      
      if (!response.ok || result.error) throw new Error(result.error || "Erro ao identificar itens.");
      
      if (result.items && result.items.length > 0) {
        setIdentifiedItems(result.items);
        setStep("2_SELECT_ITEM");
      } else {
        setError("Nenhum item para análise foi encontrado no Termo de Referência.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeItem = async () => {
    if (!trFile || proposalFiles.length === 0 || !selectedItem) {
      setError("Por favor, selecione um item e envie a(s) proposta(s) para análise.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage(`Analisando item: ${selectedItem}...`);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('trFile', trFile);
      formData.append('mode', 'analyze_item');
      formData.append('itemName', selectedItem);
      proposalFiles.forEach(file => {
          formData.append('proposalFiles', file);
      });

      const response = await fetch('/api/analise-proposta', { method: 'POST', body: formData });
      const result: AnalysisResponse = await response.json();

      if (!response.ok || result.error) throw new Error(result.error || "Erro ao analisar o item.");
      
      if (result.analysisItems) {
        setAnalysisResult(result.analysisItems);
        setStep("3_SHOW_REPORT");
      } else {
        setError("A análise não retornou um resultado válido.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToCSV = () => {
    if (analysisResult.length === 0) return;

    const dataToExport = analysisResult.map((item, index) => ({
      '#': index + 1,
      'Requisito Técnico': item.requirement,
      'Status': item.status,
      'Evidência na Proposta': item.evidence,
      'Página': item.page || 'N/A',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `analise_conformidade_${selectedItem.replace(/ /g, '_')}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Análise de Conformidade por Item</h1>
            <p className="text-muted-foreground mt-1">
              {step === "1_UPLOAD_TR" 
                ? "Comece enviando um Termo de Referência para identificar os itens." 
                : "Selecione um item, envie a proposta e analise a conformidade."}
            </p>
          </div>
          <Button variant="destructive" onClick={resetState}>
            <Trash2 className="mr-2 h-4 w-4" /> Nova Análise
          </Button>
        </div>

        {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Etapa 1: Upload TR */}
        {step === "1_UPLOAD_TR" && (
            <Card>
                <CardHeader>
                    <CardTitle>Etapa 1: Enviar Termo de Referência (TR)</CardTitle>
                    <CardDescription>
                        Faça o upload do arquivo TR no formato PDF para que a IA possa identificar os itens a serem analisados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mx-auto max-w-lg">
                        <FileUploadBox
                            files={trFile ? [trFile] : []}
                            onUpload={(files) => setTrFile(files[0] || null)}
                            onRemove={() => setTrFile(null)}
                        />
                    </div>
                    {trFile && (
                        <div className="flex justify-center mt-6">
                            <Button onClick={handleIdentifyItems} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListTree className="mr-2 h-4 w-4" />}
                                {loadingMessage || 'Identificar Itens do TR'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

        {/* Etapa 2 e 3: Painel de Análise */}
        {step !== "1_UPLOAD_TR" && (
            <Card>
                <CardHeader>
                    <CardTitle>Painel de Análise</CardTitle>
                    <CardDescription>
                        Analisando o TR: <span className="font-semibold text-primary">{trFile?.name}</span>.
                        <br />
                        Selecione um item e envie os documentos da proposta para análise de conformidade.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Coluna 1: Seleção de Item */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="item-select" className="text-sm font-medium">Selecione o Item para Análise</Label>
                                <Select onValueChange={handleItemSelectionChange} value={selectedItem} disabled={isLoading}>
                                    <SelectTrigger id="item-select" className="h-11">
                                        <SelectValue placeholder="Selecione um item..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {identifiedItems.map((item, index) => (
                                            <SelectItem key={index} value={item}>{item}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Coluna 2: Upload da Proposta e Botão de Ação */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="proposal-upload" className="text-sm font-medium">Selecione a(s) Proposta(s) e Documentos</Label>
                                <FileUploadBox
                                    id="proposal-upload"
                                    files={proposalFiles}
                                    onUpload={handleProposalUpload}
                                    onRemove={handleProposalRemove}
                                    disabled={!selectedItem || isLoading}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress indicator e botão de ação centralizados */}
                    {selectedItem && proposalFiles.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                            {isLoading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Analisando conformidade...</span>
                                        <span className="text-muted-foreground">Aguarde</span>
                                    </div>
                                    <Progress value={75} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-center">{loadingMessage}</p>
                                </div>
                            )}
                            <div className="flex justify-center">
                                <Button 
                                    onClick={handleAnalyzeItem} 
                                    disabled={isLoading} 
                                    className="min-w-[200px] h-11"
                                    size="lg"
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileScan className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Analisando Item...' : 'Analisar Item'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

        {/* Etapa 4: Relatório de Análise */}
        {step === "3_SHOW_REPORT" && analysisResult.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                  <CardTitle className="text-green-600">Relatório de Análise: {selectedItem}</CardTitle>
                  <CardDescription>Resultado da análise de conformidade para o item selecionado.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportToCSV}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {/* ... Tabela de resultados ... */}
              <div className="rounded-md border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[40px]">#</TableHead>
                              <TableHead className="w-1/3">Requisito Técnico</TableHead>
                              <TableHead className="w-[160px]">Status</TableHead>
                              <TableHead>Evidência na Proposta</TableHead>
                              <TableHead className="w-[80px]">Página</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {analysisResult.map((item, index) => (
                              <TableRow key={index}>
                                  <TableCell className="font-medium align-top">{index + 1}</TableCell>
                                  <TableCell className="text-sm align-top max-w-md break-words whitespace-pre-wrap">{item.requirement}</TableCell>
                                  <TableCell className="align-top">
                                      <StatusBadge status={item.status} />
                                  </TableCell>
                                  <TableCell className="text-sm italic align-top max-w-md break-words whitespace-pre-wrap">&ldquo;{item.evidence}&rdquo;</TableCell>
                                  <TableCell className="align-top">{item.page ? <Badge variant="outline">{item.page}</Badge> : '-'}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
