"use client";

import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Plus, AlertTriangle, Clock, CheckCircle, AlertCircle, Edit, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { setores } from "@/lib/data";
import { responsaveis } from "@/lib/responsaveis";

interface Demanda {
  id?: number;
  titulo: string;
  descricao: string;
  setor: string;
  prioridade: "alta" | "media" | "baixa";
  situacao: "pendente" | "em_andamento" | "concluida" | "cancelada";
  dataCadastro: Date;
  prazo?: Date;
  responsavel?: string;
  responsavel_custom?: string;
}

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCustomResponsavel, setShowCustomResponsavel] = useState(false);

  const [formData, setFormData] = useState<Demanda>({
    titulo: "",
    descricao: "",
    setor: "",
    prioridade: "media",
    situacao: "pendente",
    dataCadastro: new Date(),
    prazo: undefined,
    responsavel: "",
    responsavel_custom: ""
  });

  // Carregar demandas do banco
  useEffect(() => {
    carregarDemandas();
  }, []);

  const carregarDemandas = async () => {
    try {
      const response = await fetch('/api/demandas');
      if (response.ok) {
        const data = await response.json();
        // Converter strings de data para objetos Date
        const demandasComData = data.map((demanda: Record<string, unknown>) => ({
          ...demanda,
          dataCadastro: new Date(demanda.dataCadastro as string),
          prazo: demanda.prazo ? new Date(demanda.prazo as string) : undefined
        }));
        setDemandas(demandasComData);
      }
    } catch (error) {
      console.error('Erro ao carregar demandas:', error);
    }
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
      titulo: "",
      descricao: "",
      setor: "",
      prioridade: "media",
      situacao: "pendente",
      dataCadastro: new Date(),
      prazo: undefined,
      responsavel: "",
      responsavel_custom: ""
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
        const response = await fetch(`/api/demandas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await carregarDemandas();
          setIsEditing(false);
          setEditingId(null);
          resetForm();
        }
      } else {
        // Criar nova demanda
        const response = await fetch('/api/demandas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await carregarDemandas();
          setIsAdding(false);
          resetForm();
        }
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
      responsavel_custom: demanda.responsavel_custom || ""
    });
    setShowCustomResponsavel(demanda.responsavel === 'Outro(a)');
    setIsEditing(true);
    setEditingId(demanda.id!);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta demanda?')) {
      try {
        const response = await fetch(`/api/demandas/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await carregarDemandas();
        }
      } catch (error) {
        console.error('Erro ao deletar demanda:', error);
        alert('Erro ao deletar demanda. Tente novamente.');
      }
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
      case "em_andamento":
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
  const emAndamento = demandas.filter(d => d.situacao === "em_andamento").length;
  const concluidas = demandas.filter(d => d.situacao === "concluida").length;
  const altaPrioridade = demandas.filter(d => d.prioridade === "alta").length;

  return (
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

        {/* Formulário de Adicionar/Editar Demanda */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Editar Demanda' : 'Adicionar Nova Demanda'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
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
                          onSelect={(date) => handleInputChange('dataCadastro', date || new Date())}
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
                    {isEditing ? 'Atualizar Demanda' : 'Salvar Demanda'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={isEditing ? cancelEdit : () => setIsAdding(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Demandas em formato de Cards */}
        <div className="space-y-4">
          {demandas.length > 0 ? (
            demandas.map((demanda) => (
              <Card key={demanda.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{demanda.titulo}</CardTitle>
                        {getPrioridadeBadge(demanda.prioridade)}
                        {getSituacaoBadge(demanda.situacao)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-muted-foreground">Assunto:</p>
                          <p className="text-foreground">{demanda.descricao}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground">Responsável:</p>
                          <p className="text-foreground">{demanda.responsavel === 'Outro(a)' ? demanda.responsavel_custom : demanda.responsavel || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Setor: {demanda.setor}</span>
                      <span>Data: {format(demanda.dataCadastro, "dd/MM/yyyy", { locale: ptBR })}</span>
                      {demanda.prazo && (
                        <span>Prazo: {format(demanda.prazo, "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center justify-end">
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
  );
}
