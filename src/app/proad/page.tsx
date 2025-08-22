"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Plus, 
  ChevronDown, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  FileText as FileTextIcon,
  Edit,
  Trash2,
  Check,
  X
} from "lucide-react";
import { setores } from "@/lib/data";
import { responsaveis } from "@/lib/responsaveis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Andamento {
  id: number;
  data: string; // Vem como string do DB
  descricao: string;
}

interface PROAD {
  id?: number;
  numero: string;
  ano: string;
  setor: string;
  prioridade: "alta" | "media" | "baixa";
  situacao: "ativo" | "concluido" | "suspenso" | "cancelado";
  dataCadastro: Date;
  andamento?: string;
  historicoAndamentos?: Andamento[];
  responsavel?: string;
  assunto?: string;
  responsavel_custom?: string;
}

export default function PROADPage() {
  const [proads, setProads] = useState<PROAD[]>([]);
  const [isAdding, setIsAdding] = useState(false)
  const [editingAndamentoId, setEditingAndamentoId] = useState<number | null>(null)
  const [editingAndamentoData, setEditingAndamentoData] = useState({ descricao: '', data: new Date() });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSetor, setSelectedSetor] = useState("all");
  const [selectedPrioridade, setSelectedPrioridade] = useState("all");
  const [selectedSituacao, setSelectedSituacao] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomResponsavel, setShowCustomResponsavel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PROAD>({
    numero: "", 
    ano: "", 
    setor: "", 
    prioridade: "media",
    situacao: "ativo",
    dataCadastro: new Date(), 
    andamento: "",
    responsavel: "",
    assunto: "",
    responsavel_custom: ""
  });

  // Lista de anos disponíveis
  const anosDisponiveis = ["23", "24", "25", "26"];

  // Carregar PROADs do banco
  useEffect(() => {
    carregarPROADs();
  }, []);

  const carregarPROADs = async () => {
    try {
      const response = await fetch('/api/proads');
      if (response.ok) {
        const data = await response.json();
        // Converter strings de data para objetos Date
        const proadsComData = data.map((proad: Record<string, unknown>) => ({
          ...proad,
          dataCadastro: new Date(proad.dataCadastro as string)
        }));
        setProads(proadsComData);
      }
    } catch (error) {
      console.error('Erro ao carregar PROADs:', error);
    }
  };

  const handleNumeroChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, numero: numericValue }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mostrar campo customizado se "Outro(a)" for selecionado
    if (field === 'responsavel') {
      setShowCustomResponsavel(value === 'Outro(a)');
      if (value !== 'Outro(a)') {
        setFormData(prev => ({ ...prev, responsavel_custom: '' }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      numero: "", 
      ano: "", 
      setor: "", 
      prioridade: "media",
      situacao: "ativo",
      dataCadastro: new Date(), 
      andamento: "",
      responsavel: "",
      assunto: "",
      responsavel_custom: ""
    });
    setShowCustomResponsavel(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero || !formData.ano || !formData.setor) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (isEditing && editingId) {
        // Atualizar PROAD existente
        const response = await fetch(`/api/proads/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await carregarPROADs();
          setIsModalOpen(false); // Fechar o modal
          resetForm();
        }
      } else {
        // Criar novo PROAD
        const response = await fetch('/api/proads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await carregarPROADs();
          setIsModalOpen(false); // Fechar o modal
          resetForm();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar PROAD:', error);
      alert('Erro ao salvar PROAD. Tente novamente.');
    }
  };

  const handleEdit = (proad: PROAD) => {
    setFormData({
      numero: proad.numero,
      ano: proad.ano,
      setor: proad.setor,
      prioridade: proad.prioridade,
      situacao: proad.situacao,
      dataCadastro: proad.dataCadastro,
      andamento: proad.andamento || "",
      responsavel: proad.responsavel || "",
      assunto: proad.assunto || "",
      responsavel_custom: proad.responsavel_custom || ""
    });
    setShowCustomResponsavel(proad.responsavel === 'Outro(a)');
    setIsEditing(true);
    setEditingId(proad.id!);
    setIsModalOpen(true); // Abrir o modal
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este PROAD?')) {
      try {
        const response = await fetch(`/api/proads/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await carregarPROADs();
        }
      } catch (error) {
        console.error('Erro ao deletar PROAD:', error);
        alert('Erro ao deletar PROAD. Tente novamente.');
      }
    }
  };

  const handleEditAndamento = (andamento: { id: number; descricao: string; data: string }) => {
    setEditingAndamentoId(andamento.id);
    setEditingAndamentoData({
      descricao: andamento.descricao,
      data: new Date(andamento.data)
    });
  };

  const handleSaveAndamento = async () => {
    if (!editingAndamentoId) return;
    
    try {
      const response = await fetch(`/api/andamentos/${editingAndamentoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: editingAndamentoData.descricao,
          data: editingAndamentoData.data.toISOString()
        })
      });
      
      if (response.ok) {
        setEditingAndamentoId(null);
        setEditingAndamentoData({ descricao: '', data: new Date() });
        await carregarPROADs(); // Recarrega a lista para mostrar as mudanças
      }
    } catch (error) {
      console.error('Erro ao salvar andamento:', error);
    }
  };

  const handleCancelEditAndamento = () => {
    setEditingAndamentoId(null);
    setEditingAndamentoData({ descricao: '', data: new Date() });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(false); // Fechar o modal
    resetForm();
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Alta</Badge>;
      case "media":
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Média</Badge>;
      case "baixa":
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Baixa</Badge>;
      default:
        return <Badge variant="outline">{prioridade}</Badge>;
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case "ativo":
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Ativo</Badge>;
      case "concluido":
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Concluído</Badge>;
      case "suspenso":
        return <Badge variant="outline" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Suspenso</Badge>;
      case "cancelado":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  // Filtrar PROADs
  const filteredProads = proads.filter(proad => {
    const matchesSearch = proad.numero.includes(searchTerm) || 
                         proad.ano.includes(searchTerm) ||
                         (proad.assunto && proad.assunto.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         proad.setor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = selectedSetor === "all" || proad.setor === selectedSetor;
    const matchesPrioridade = selectedPrioridade === "all" || proad.prioridade === selectedPrioridade;
    const matchesSituacao = selectedSituacao === "all" || proad.situacao === selectedSituacao;
    
    return matchesSearch && matchesSetor && matchesPrioridade && matchesSituacao;
  });

  // Calcular métricas
  const totalProads = proads.length;
  const altaPrioridade = proads.filter(p => p.prioridade === "alta").length;
  const mediaPrioridade = proads.filter(p => p.prioridade === "media").length;
  const baixaPrioridade = proads.filter(p => p.prioridade === "baixa").length;
  const ativos = proads.filter(p => p.situacao === "ativo").length;

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">PROADs</h1>
              <p className="text-muted-foreground mt-1">
                Gestão de Processos Administrativos
              </p>
            </div>
            
            <Button onClick={() => { setIsAdding(true); setIsEditing(false); resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar PROAD
            </Button>
          </div>

          {/* Cards de Métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProads}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{altaPrioridade}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média Prioridade</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{mediaPrioridade}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Baixa Prioridade</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{baixaPrioridade}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{ativos}</div>
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
                  <FileTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, ano, assunto ou setor"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Setor */}
                <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Setor</SelectItem>
                    {setores.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Prioridade */}
                <Select value={selectedPrioridade} onValueChange={setSelectedPrioridade}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Prioridade</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                {/* Situação */}
                <Select value={selectedSituacao} onValueChange={setSelectedSituacao}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Situação</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Modal de Adicionar/Editar PROAD */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar PROAD' : 'Adicionar Novo PROAD'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto pr-6">
                  {/* Conteúdo do formulário (todo o <div grid...>) vai aqui */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Número PROAD */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Número PROAD *</label>
                      <Input
                        placeholder="0000"
                        value={formData.numero}
                        onChange={(e) => handleNumeroChange(e.target.value)}
                        maxLength={4}
                        className="w-24"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Máximo 4 dígitos</p>
                    </div>

                    {/* Ano */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ano *</label>
                      <Select value={formData.ano} onValueChange={(value) => handleInputChange('ano', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {anosDisponiveis.map((ano) => (
                            <SelectItem key={ano} value={ano}>
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assunto */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assunto</label>
                      <Input
                        placeholder="Digite o assunto do PROAD"
                        value={formData.assunto}
                        onChange={(e) => handleInputChange('assunto', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Setor */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Setor de Origem *</label>
                      <Select value={formData.setor} onValueChange={(value) => handleInputChange('setor', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {setores.map((setor) => (
                            <SelectItem key={setor} value={setor}>
                              {setor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prioridade */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prioridade</label>
                      <Select value={formData.prioridade} onValueChange={(value: string) => handleInputChange('prioridade', value as PROAD['prioridade'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Situação */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Situação Atual</label>
                      <Select value={formData.situacao} onValueChange={(value: string) => handleInputChange('situacao', value as PROAD['situacao'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="suspenso">Suspenso</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Responsável */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Responsável</label>
                      <Select value={formData.responsavel} onValueChange={(value) => handleInputChange('responsavel', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {responsaveis.map((responsavel) => (
                            <SelectItem key={responsavel} value={responsavel}>
                              {responsavel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Responsável Customizado */}
                    {showCustomResponsavel && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Responsável *</label>
                        <Input
                          placeholder="Digite o nome completo"
                          value={formData.responsavel_custom}
                          onChange={(e) => handleInputChange('responsavel_custom', e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                    )}

                    {/* Data de Cadastro */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Cadastro</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.dataCadastro && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dataCadastro ? format(formData.dataCadastro, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.dataCadastro}
                            onSelect={(date) => date && handleInputChange('dataCadastro', date)}
                            disabled={{ after: new Date() }}
  
                            
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Andamento */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Andamento</label>
                    <Textarea
                      placeholder="Descreva o andamento do PROAD..."
                      value={formData.andamento}
                      onChange={(e) => handleInputChange('andamento', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {isEditing ? 'Atualizar PROAD' : 'Salvar PROAD'}
                    </Button>
                  </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Lista de PROADs em formato de Cards */}
          <div className="space-y-4">
            {filteredProads.length > 0 ? (
              filteredProads.map((proad) => (
                <Card key={proad.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">PROAD {proad.numero}/{proad.ano}</CardTitle>
                        <p className="text-sm text-muted-foreground">{proad.assunto || "Sem assunto"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPrioridadeBadge(proad.prioridade)}
                        {getSituacaoBadge(proad.situacao)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground font-semibold mb-2">Último Andamento:</p>
                      <p>{proad.andamento || "Nenhum andamento registrado."}</p>
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-between p-6 pt-4 text-sm text-muted-foreground">
                    <div>
                      <span>Responsável: {proad.responsavel === 'Outro(a)' ? proad.responsavel_custom : proad.responsavel || "-"}</span>
                      <span className="mx-2">•</span>
                      <span>{proad.setor}</span>
                      <span className="mx-2">•</span>
                      <span>{format(new Date(proad.dataCadastro), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* Botão de Histórico */}
                      {proad.historicoAndamentos && proad.historicoAndamentos.length > 0 && (
                        <Dialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-1 flex items-center justify-center">
                                  <FileTextIcon className="h-4 w-4 flex-shrink-0" />
                                </Button>
                              </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Histórico de Andamentos</p></TooltipContent>
                          </Tooltip>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Histórico do PROAD {proad.numero}/{proad.ano}</DialogTitle>
                              <DialogDescription>Todos os andamentos registrados para este processo.</DialogDescription>
                            </DialogHeader>
                                                          <div className="max-h-[70vh] overflow-y-auto pr-6 py-4">
                                <div className="relative pl-12">
                                  {/* Linha vertical */}
                                  <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-border"></div>
                                
                                <ul className="space-y-8">
                                  {proad.historicoAndamentos.map((andamento, index) => (
                                    <li key={andamento.id} className="relative group">
                                      {/* Ponto na timeline */}
                                      <div className="absolute -left-[42px] top-1 h-8 w-8 bg-primary rounded-full flex items-center justify-center ring-4 ring-background">
                                        <FileTextIcon className="h-3 w-3 text-primary-foreground flex-shrink-0" />
                                      </div>
                                      
                                      <div className="ml-12">
                                        {editingAndamentoId === andamento.id ? (
                                          // Modo de edição
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <Input
                                                  type="date"
                                                  value={format(editingAndamentoData.data, "yyyy-MM-dd")}
                                                  onChange={(e) => {
                                                    const newDate = new Date(e.target.value);
                                                    newDate.setHours(editingAndamentoData.data.getHours(), editingAndamentoData.data.getMinutes());
                                                    setEditingAndamentoData(prev => ({ ...prev, data: newDate }));
                                                  }}
                                                  className="w-auto"
                                                />
                                                <Input
                                                  type="time"
                                                  value={format(editingAndamentoData.data, "HH:mm")}
                                                  onChange={(e) => {
                                                    const [hours, minutes] = e.target.value.split(':');
                                                    const newData = new Date(editingAndamentoData.data);
                                                    newData.setHours(parseInt(hours), parseInt(minutes));
                                                    setEditingAndamentoData(prev => ({ ...prev, data: newData }));
                                                  }}
                                                  className="w-20"
                                                />
                                              </div>
                                              <div className="flex gap-1">
                                                <Button size="sm" onClick={handleSaveAndamento} className="h-6 w-6 p-0">
                                                  <Check className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={handleCancelEditAndamento} className="h-6 w-6 p-0">
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                            <Textarea
                                              value={editingAndamentoData.descricao}
                                              onChange={(e) => setEditingAndamentoData(prev => ({ ...prev, descricao: e.target.value }))}
                                              className="min-h-[80px]"
                                              placeholder="Descreva o andamento..."
                                            />
                                          </div>
                                        ) : (
                                          // Modo de visualização
                                          <>
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="font-semibold text-sm">{format(new Date(andamento.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                                                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleEditAndamento(andamento)}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Editar andamento</p>
                                            </TooltipContent>
                                          </Tooltip>
                                            </div>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{andamento.descricao}</p>
                                          </>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(proad)} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar PROAD</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(proad.id!)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Excluir PROAD</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>{proads.length === 0 ? "Nenhum PROAD cadastrado ainda." : "Nenhum PROAD encontrado com os filtros aplicados."}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
