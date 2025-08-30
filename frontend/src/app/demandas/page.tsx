"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, AlertTriangle, Clock, CheckCircle, AlertCircle, Edit, Trash2, FileText as FileTextIcon, Check, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { setores } from "@/lib/data";
import { responsaveis } from "@/lib/responsaveis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDemandas } from "@/hooks/useApi";
import { Demanda, AndamentoDemanda } from "@/lib/types";

export default function DemandasPage() {
  const {
    demandas,
    loading: isLoading,
    error,
    loadDemandas,
    createDemanda,
    updateDemanda,
    deleteDemanda,
    addAndamento
  } = useDemandas();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCustomResponsavel, setShowCustomResponsavel] = useState(false);
  const [editingAndamentoId, setEditingAndamentoId] = useState<number | null>(null);
  const [editingAndamentoData, setEditingAndamentoData] = useState({ descricao: '', data: new Date() });

  const [formData, setFormData] = useState<Demanda>({
    titulo: "",
    descricao: "",
    setor: "",
    prioridade: "media",
    situacao: "pendente",
    dataCadastro: new Date(),
    prazo: undefined,
    responsavel: "",
    responsavel_custom: "",
    andamento: ""
  });

  // Carregar demandas do banco
  useEffect(() => {
    loadDemandas();
  }, [loadDemandas]);

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
      titulo: "",
      descricao: "",
      setor: "",
      prioridade: "media",
      situacao: "pendente",
      dataCadastro: new Date(),
      prazo: undefined,
      responsavel: "",
      responsavel_custom: "",
      andamento: ""
    });
    setShowCustomResponsavel(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descricao || !formData.setor) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (isEditing && editingId) {
        // Atualizar demanda existente
        await updateDemanda(editingId, formData);
        setIsEditing(false);
        setEditingId(null);
        setIsAdding(false); // Fechar o modal de edição
        resetForm();
      } else {
        // Criar nova demanda
        await createDemanda(formData);
        setIsAdding(false);
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar demanda:', error);
      alert('Erro ao salvar demanda. Tente novamente.');
    }
  };

  const handleEdit = (demanda: Demanda) => {
    setFormData({
      titulo: demanda.titulo,
      descricao: demanda.descricao,
      setor: demanda.setor,
      prioridade: demanda.prioridade,
      situacao: demanda.situacao,
      dataCadastro: demanda.dataCadastro,
      prazo: demanda.prazo,
      responsavel: demanda.responsavel || "",
      responsavel_custom: demanda.responsavel_custom || "",
      andamento: demanda.andamento || ""
    });
    setShowCustomResponsavel(demanda.responsavel === 'Outro(a)');
    setIsEditing(true);
    setEditingId(demanda.id!);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta demanda?')) {
      try {
        await deleteDemanda(id);
      } catch (error) {
        console.error('Erro ao excluir demanda:', error);
        alert('Erro ao excluir demanda');
      }
    }
  };

  const handleEditAndamento = (andamento: AndamentoDemanda) => {
    setEditingAndamentoId(andamento.id);
    setEditingAndamentoData({
      descricao: andamento.descricao,
      data: new Date(andamento.data)
    });
  };

  const handleCancelEditAndamento = () => {
    setEditingAndamentoId(null);
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
        await loadDemandas(); // Recarregar para mostrar as mudanças
      } else {
        throw new Error('Falha ao salvar andamento');
      }
    } catch (error) {
      console.error('Erro ao salvar andamento:', error);
      alert('Erro ao salvar andamento');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Alta
          </Badge>
        );
      case "media":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Média
          </Badge>
        );
      case "baixa":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Baixa
          </Badge>
        );
      default:
        return <Badge variant="outline">{prioridade}</Badge>;
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case "pendente":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "emandamento":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Em Andamento
          </Badge>
        );
      case "concluida":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Concluída
          </Badge>
        );
      case "cancelada":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  // Calcular estatísticas
  const totalDemandas = demandas.length;
  const pendentes = demandas.filter(d => d.situacao === "pendente").length;
  const emAndamento = demandas.filter(d => d.situacao === "emandamento").length;
  const concluidas = demandas.filter(d => d.situacao === "concluida").length;
  const altaPrioridade = demandas.filter(d => d.prioridade === "alta").length;

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Demandas</h1>
            <p className="text-muted-foreground mt-1">
              Gestão de demandas e solicitações do sistema
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Demanda
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDemandas}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendentes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{concluidas}</div>
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
        </div>

        {/* Modal de Adicionar/Editar Demanda */}
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Demanda' : 'Adicionar Nova Demanda'}</DialogTitle>
            </DialogHeader>
            
            {isEditing ? (
              <Tabs defaultValue="andamento" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="andamento">Atualizar Andamento</TabsTrigger>
                  <TabsTrigger value="geral">Editar Geral</TabsTrigger>
                </TabsList>
                
                <TabsContent value="andamento" className="space-y-4 pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Data</label>
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
                                {formData.dataCadastro ? (
                                  format(formData.dataCadastro, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.dataCadastro}
                                onSelect={(date) => handleInputChange('dataCadastro', date)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Andamento</label>
                        <Textarea
                          placeholder="Descreva o andamento da demanda..."
                          value={formData.andamento}
                          onChange={(e) => handleInputChange('andamento', e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          Atualizar Andamento
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="geral" className="space-y-4 pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título *</label>
                        <Input
                          placeholder="Digite o título da demanda"
                          value={formData.titulo}
                          onChange={(e) => handleInputChange('titulo', e.target.value)}
                          required
                        />
                      </div>
                       
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
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição *</label>
                      <Textarea
                        placeholder="Descreva detalhadamente a demanda..."
                        value={formData.descricao}
                        onChange={(e) => handleInputChange('descricao', e.target.value)}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Prioridade</label>
                        <Select value={formData.prioridade} onValueChange={(value: string) => handleInputChange('prioridade', value)}>
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

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Situação</label>
                        <Select value={formData.situacao} onValueChange={(value: string) => handleInputChange('situacao', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="emandamento">Em Andamento</SelectItem>
                            <SelectItem value="concluida">Concluída</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Responsável</label>
                        <Select
                          value={formData.responsavel}
                          onValueChange={(value) => handleInputChange('responsavel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            {responsaveis.map((responsavel) => (
                              <SelectItem key={responsavel} value={responsavel}>
                                {responsavel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              {formData.dataCadastro ? (
                                format(formData.dataCadastro, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.dataCadastro}
                              onSelect={(date) => handleInputChange('dataCadastro', date)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Prazo (opcional)</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.prazo && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.prazo ? (
                                format(formData.prazo, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.prazo}
                              onSelect={(date) => handleInputChange('prazo', date)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        Atualizar Demanda
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={cancelEdit}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              // Modal de adição (formulário original)
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título *</label>
                    <Input
                      placeholder="Digite o título da demanda"
                      value={formData.titulo}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      required
                    />
                  </div>
                   
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição *</label>
                  <Textarea
                    placeholder="Descreva detalhadamente a demanda..."
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={formData.prioridade} onValueChange={(value: string) => handleInputChange('prioridade', value)}>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Situação</label>
                    <Select value={formData.situacao} onValueChange={(value: string) => handleInputChange('situacao', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="emandamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Responsável</label>
                    <Select
                      value={formData.responsavel}
                      onValueChange={(value) => handleInputChange('responsavel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsaveis.map((responsavel) => (
                          <SelectItem key={responsavel} value={responsavel}>
                            {responsavel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {formData.dataCadastro ? (
                            format(formData.dataCadastro, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.dataCadastro}
                          onSelect={(date) => handleInputChange('dataCadastro', date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prazo (opcional)</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.prazo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.prazo ? (
                            format(formData.prazo, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.prazo}
                          onSelect={(date) => handleInputChange('prazo', date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Salvar Demanda
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Lista de Demandas em formato de Cards */}
        <div className="space-y-4">
          {demandas.length > 0 ? (
            demandas.map((demanda) => (
              <Card key={demanda.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Cabeçalho com título e badges */}
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-xl font-bold">{demanda.titulo}</CardTitle>
                        <div className="flex gap-2">
                          {getPrioridadeBadge(demanda.prioridade)}
                          {getSituacaoBadge(demanda.situacao)}
                        </div>
                      </div>
                      
                      {/* Informações principais em grid responsivo */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Assunto</p>
                          <p className="text-foreground text-base">{demanda.descricao || "Sem descrição"}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Data do Último Andamento</p>
                          <p className="text-foreground text-base">
                            {demanda.historicoAndamentos && demanda.historicoAndamentos.length > 0 
                              ? format(new Date(demanda.historicoAndamentos[0].data), "dd/MM/yyyy", { locale: ptBR })
                              : format(demanda.dataCadastro, "dd/MM/yyyy", { locale: ptBR })
                            }
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Responsável</p>
                          <p className="text-foreground text-base">{demanda.responsavel === 'Outro(a)' ? demanda.responsavel_custom : demanda.responsavel || "-"}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Setor</p>
                          <p className="text-foreground text-base">{demanda.setor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Informações secundárias */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                      <span className="font-medium">Data de Cadastro: {format(demanda.dataCadastro, "dd/MM/yyyy", { locale: ptBR })}</span>
                      {demanda.prazo && (
                        <span className="font-medium">Prazo: {format(demanda.prazo, "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                      
                      {/* Botões de ação na mesma linha */}
                      <div className="flex gap-2 items-center">
                        {/* Botão de Histórico */}
                        {demanda.historicoAndamentos && demanda.historicoAndamentos.length > 0 && (
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
                                <DialogTitle>Histórico da Demanda: {demanda.titulo}</DialogTitle>
                                <DialogDescription>Todos os andamentos registrados para esta demanda.</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[70vh] overflow-y-auto pr-6 py-4">
                                <div className="relative pl-12">
                                  {/* Linha vertical */}
                                  <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-border"></div>
                                
                                <ul className="space-y-8">
                                  {demanda.historicoAndamentos.map((andamento, index) => (
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

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(demanda)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(demanda.id!)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remover a seção de botões de ação que estava duplicada */}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>{demandas.length === 0 ? "Nenhuma demanda cadastrada ainda." : "Nenhuma demanda encontrada com os filtros aplicados."}</p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
