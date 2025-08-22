"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Upload,
  Download,
  FileUp,
  FileDown,
  ExternalLink,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Trash2,
  Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TRModelo {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  linkAGU: string;
}

interface TRGerado {
  id: string;
  titulo: string;
  modelo: string;
  dataGeracao: Date;
  status: "rascunho" | "finalizado" | "exportado";
  conteudo: string;
}

// Modelos da AGU disponíveis
const modelosAGU: TRModelo[] = [
  {
    id: "pregao-bens",
    nome: "TR para Pregão/Concorrência - Aquisição de Bens",
    descricao: "Modelo para aquisição de bens através de pregão eletrônico ou concorrência",
    categoria: "Aquisição",
    linkAGU: "https://www.gov.br/agu/pt-br/assuntos/gestao/contratacoes-e-compras-publicas/modelos-de-termos-de-referencia"
  },
  {
    id: "pregao-servicos",
    nome: "TR para Pregão/Concorrência - Contratação de Serviços",
    descricao: "Modelo para contratação de serviços através de pregão eletrônico ou concorrência",
    categoria: "Serviços",
    linkAGU: "https://www.gov.br/agu/pt-br/assuntos/gestao/contratacoes-e-compras-publicas/modelos-de-termos-de-referencia"
  },
  {
    id: "dispensa-bens",
    nome: "TR para Dispensa de Licitação - Aquisição de Bens",
    descricao: "Modelo para aquisição de bens em dispensa de licitação",
    categoria: "Aquisição",
    linkAGU: "https://www.gov.br/agu/pt-br/assuntos/gestao/contratacoes-e-compras-publicas/modelos-de-termos-de-referencia"
  },
  {
    id: "dispensa-servicos",
    nome: "TR para Dispensa de Licitação - Contratação de Serviços",
    descricao: "Modelo para contratação de serviços em dispensa de licitação",
    categoria: "Serviços",
    linkAGU: "https://www.gov.br/agu/pt-br/assuntos/gestao/contratacoes-e-compras-publicas/modelos-de-termos-de-referencia"
  },
  {
    id: "inexigibilidade",
    nome: "TR para Inexigibilidade de Licitação",
    descricao: "Modelo para casos de inexigibilidade de licitação",
    categoria: "Especial",
    linkAGU: "https://www.gov.br/agu/pt-br/assuntos/gestao/contratacoes-e-compras-publicas/modelos-de-termos-de-referencia"
  }
];

export default function TRPage() {
  const [selectedModelo, setSelectedModelo] = useState<string>("");
  const [activeTab, setActiveTab] = useState("referencias");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [trGerado, setTrGerado] = useState<TRGerado | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    objeto: "",
    descricao: "",
    arquivosReferencia: [] as File[],
    observacoes: ""
  });

  const handleInputChange = (field: keyof typeof formData, value: string | Date | File[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => 
        file.type === "application/pdf" || 
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      
      if (validFiles.length !== fileArray.length) {
        alert("Apenas arquivos PDF e DOCX são aceitos.");
      }
      
      handleInputChange('arquivosReferencia', [...formData.arquivosReferencia, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = formData.arquivosReferencia.filter((_, i) => i !== index);
    handleInputChange('arquivosReferencia', newFiles);
  };

  const resetForm = () => {
    setFormData({
      objeto: "",
      descricao: "",
      arquivosReferencia: [],
      observacoes: ""
    });
    setSelectedModelo("");
    setActiveTab("referencias");
  };

  const simularGeracaoTR = async () => {
    if (!selectedModelo || (!formData.objeto && formData.arquivosReferencia.length === 0)) {
      alert("Por favor, selecione um modelo e forneça o objeto da licitação ou arquivos de referência.");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage("Iniciando análise...");

    // Simular progresso
    const progressSteps = [
      { progress: 20, message: "Analisando modelo base da AGU..." },
      { progress: 40, message: "Processando arquivos de referência..." },
      { progress: 60, message: "Extraindo cláusulas relevantes..." },
      { progress: 80, message: "Gerando minuta do TR..." },
      { progress: 100, message: "Finalizando..." }
    ];

    for (let i = 0; i < progressSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(progressSteps[i].progress);
      setProgressMessage(progressSteps[i].message);
    }

    // Simular TR gerado
    const modeloSelecionado = modelosAGU.find(m => m.id === selectedModelo);
    const trSimulado: TRGerado = {
      id: Date.now().toString(),
      titulo: `TR - ${formData.objeto || "Objeto da Licitação"}`,
      modelo: modeloSelecionado?.nome || "",
      dataGeracao: new Date(),
      status: "rascunho",
      conteudo: `
# TERMO DE REFERÊNCIA

## 1. OBJETO
${formData.objeto || "Descrição do objeto da licitação"}

## 2. JUSTIFICATIVA
Justificativa para a contratação baseada na necessidade identificada.

## 3. ESPECIFICAÇÕES TÉNICAS
### 3.1 Características Gerais
- Especificações técnicas detalhadas
- Requisitos de qualidade
- Padrões a serem atendidos

### 3.2 Especificações Específicas
- Detalhamento técnico do objeto
- Especificações de fabricação
- Requisitos de certificação

## 4. CRITÉRIOS DE ACEITAÇÃO
- Critérios para aceitação do objeto
- Testes e ensaios necessários
- Documentação técnica exigida

## 5. PRAZO DE EXECUÇÃO
Prazo para entrega/execução conforme cronograma estabelecido.

## 6. LOCAL DE EXECUÇÃO
Local onde o objeto será entregue ou o serviço será executado.

## 7. FORMA DE PAGAMENTO
Condições de pagamento conforme cronograma de execução.

## 8. GARANTIAS
Garantias oferecidas pelo contratado.

## 9. PENALIDADES
Penalidades aplicáveis em caso de descumprimento contratual.

## 10. DOCUMENTAÇÃO EXIGIDA
Documentação necessária para habilitação e execução contratual.
      `
    };

    setTrGerado(trSimulado);
    setIsGenerating(false);
    setProgress(0);
    setProgressMessage("");
  };

  const exportarTR = () => {
    if (!trGerado) return;

    // Simular exportação para Word
    const element = document.createElement("a");
    const file = new Blob([trGerado.conteudo], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `TR_${trGerado.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // Atualizar status
    setTrGerado(prev => prev ? { ...prev, status: "exportado" } : null);
  };

  const limparTR = () => {
    setTrGerado(null);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "rascunho":
        return <Badge variant="outline" className="flex items-center gap-1"><Edit3 className="h-3 w-3" />Rascunho</Badge>;
      case "finalizado":
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Finalizado</Badge>;
      case "exportado":
        return <Badge variant="secondary" className="flex items-center gap-1"><Download className="h-3 w-3" />Exportado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Assistente de TR</h1>
            <p className="text-muted-foreground mt-1">
              Assistente Inteligente para Elaboração de Termos de Referência
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => window.open("https://www.gov.br/agu/pt-br/assuntos/gestao/contratacoes-e-compras-publicas/modelos-de-termos-de-referencia", "_blank")}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Modelos AGU
          </Button>
        </div>

        {/* Passo 1: Seleção do Modelo Base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Passo 1: Seleção do Modelo Base
            </CardTitle>
            <CardDescription>
              Escolha o modelo oficial da AGU que servirá como base para o seu TR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedModelo} onValueChange={setSelectedModelo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo da AGU" />
                </SelectTrigger>
                <SelectContent>
                  {modelosAGU.map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      <div className="space-y-1">
                        <div className="font-medium">{modelo.nome}</div>
                        <div className="text-sm text-muted-foreground">{modelo.descricao}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedModelo && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Modelo Selecionado:</h4>
                  <p className="text-sm text-muted-foreground">
                    {modelosAGU.find(m => m.id === selectedModelo)?.descricao}
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => window.open(modelosAGU.find(m => m.id === selectedModelo)?.linkAGU, "_blank")}
                  >
                    Ver modelo completo na AGU →
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Passo 2: Fornecimento de Conteúdo */}
        {selectedModelo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Passo 2: Fornecimento de Conteúdo
              </CardTitle>
              <CardDescription>
                Escolha como deseja fornecer as informações para a IA gerar o TR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="referencias">Usar Referências</TabsTrigger>
                  <TabsTrigger value="descricao">Descrever Necessidade</TabsTrigger>
                </TabsList>

                <TabsContent value="referencias" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Upload de Arquivos de Referência</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Faça upload de TRs anteriores em formato PDF ou DOCX para extrair as melhores cláusulas
                      </p>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arraste arquivos aqui ou clique para selecionar
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.docx"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="flex items-center gap-2"
                        >
                          <FileUp className="h-4 w-4" />
                          Selecionar Arquivos
                        </Button>
                      </div>
                    </div>

                    {formData.arquivosReferencia.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Arquivos Selecionados:</label>
                        <div className="space-y-2">
                          {formData.arquivosReferencia.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {file.type.includes('pdf') ? 'PDF' : 'DOCX'}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Objeto da Licitação</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Descreva brevemente o objeto da licitação (ex: &quot;Aquisição de 200 estações de trabalho&quot;)
                      </p>
                      <Input
                        placeholder="Ex: Aquisição de 200 estações de trabalho (computadores) com monitor"
                        value={formData.objeto}
                        onChange={(e) => handleInputChange('objeto', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="descricao" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Descrição Detalhada da Necessidade</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Descreva em linguagem natural todas as especificações técnicas, condições de entrega, garantia, etc.
                    </p>
                    <Textarea
                      placeholder="Descreva detalhadamente o que você precisa, incluindo especificações técnicas, prazos, garantias, condições de entrega, etc..."
                      value={formData.descricao}
                      onChange={(e) => handleInputChange('descricao', e.target.value)}
                      rows={8}
                    />
                  </div>
                </TabsContent>

                <div className="pt-4">
                  <Separator />
                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={simularGeracaoTR}
                      disabled={isGenerating || (!formData.objeto && formData.arquivosReferencia.length === 0 && !formData.descricao)}
                      className="flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando TR...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          Gerar Minuta do TR
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Progresso da Análise */}
        {isGenerating && (
          <Card>
            <CardHeader>
              <CardTitle>Processando...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{progressMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* TR Gerado */}
        {trGerado && !isGenerating && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    TR Gerado com Sucesso
                  </CardTitle>
                  <CardDescription>
                    Revise, edite e exporte o TR gerado pela IA
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(trGerado.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <label className="text-sm font-medium">Título:</label>
                  <p className="text-sm">{trGerado.titulo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Modelo Base:</label>
                  <p className="text-sm">{trGerado.modelo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data de Geração:</label>
                  <p className="text-sm">{trGerado.dataGeracao.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Conteúdo do TR</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? 'Visualizar' : 'Editar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportarTR}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Exportar Word
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={limparTR}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpar
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <Textarea
                    value={trGerado.conteudo}
                    onChange={(e) => setTrGerado(prev => prev ? { ...prev, conteudo: e.target.value } : null)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <pre className="whitespace-pre-wrap font-mono text-sm">{trGerado.conteudo}</pre>
                  </div>
                )}
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  O TR foi gerado com sucesso! Revise o conteúdo, faça os ajustes necessários e exporte para Word (.docx) quando estiver satisfeito.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Instruções de Uso */}
        {!trGerado && !isGenerating && (
          <Card>
            <CardHeader>
              <CardTitle>Como Usar o Assistente de TR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium mb-2">Selecione o Modelo</h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha o modelo oficial da AGU que melhor se adequa ao seu caso
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium mb-2">Forneça Informações</h4>
                  <p className="text-sm text-muted-foreground">
                    Use referências ou descreva a necessidade para a IA gerar o TR
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium mb-2">Revise e Exporte</h4>
                  <p className="text-sm text-muted-foreground">
                    Revise o TR gerado, faça ajustes e exporte para Word
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
