"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FlaskConical, 
  Plus, 
  Search, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, isAfter, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type FiltroData } from "@/lib/csv-loader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Sigla } from "@/lib/types";

interface Purificador {
  id?: number;
  tombo: string;
  modelo: string;
  localidade: string;
  sublocalidade: string;
  refilTrocadoEm?: Date;
  status: "ativo" | "defeito" | "manutencao" | "baixado";
  observacoes?: string;
  dataCadastro: Date;
}

interface PurificadoresClientProps {
    initialPurificadores: Purificador[];
    initialSiglas: Sigla[];
    initialModelos: string[];
}

export function PurificadoresClient({ initialPurificadores, initialSiglas, initialModelos }: PurificadoresClientProps) {
  const [purificadores, setPurificadores] = useState<Purificador[]>(initialPurificadores);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedModelo, setSelectedModelo] = useState("");
  const [selectedLocalidade, setSelectedLocalidade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Purificador>("tombo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Os dados agora vêm por props, então não há mais isLoading ou `useEffect` para carregar dados
  const [siglasData, setSiglasData] = useState<Sigla[]>(initialSiglas);
  const [modelosData, setModelosData] = useState<string[]>(initialModelos);
  
  // Form state
  const [formData, setFormData] = useState<Purificador>({
    tombo: "",
    modelo: "",
    localidade: "",
    sublocalidade: "",
    refilTrocadoEm: undefined,
    status: "ativo",
    observacoes: "",
    dataCadastro: new Date()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurificador, setEditingPurificador] = useState<Purificador | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      tombo: "",
      modelo: "",
      localidade: "",
      sublocalidade: "",
      refilTrocadoEm: undefined,
      status: "ativo",
      observacoes: "",
      dataCadastro: new Date()
    });
  };

  const handleOpenModal = (purificador: Purificador | null) => {
    if (purificador) {
      setEditingPurificador(purificador);
      setFormData(purificador);
    } else {
      setEditingPurificador(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tombo || !formData.modelo || !formData.localidade) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingPurificador) {
        // Atualizar purificador existente
        const updatedPurificadores = purificadores.map(p => 
          p.id === editingPurificador.id ? { ...formData, id: editingPurificador.id } : p
        );
        setPurificadores(updatedPurificadores);
      } else {
        // Criar novo purificador
        const newPurificador = {
          ...formData,
          id: Date.now(),
          dataCadastro: new Date()
        };
        setPurificadores(prev => [...prev, newPurificador]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar purificador:', error);
      alert('Erro ao salvar purificador. Tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este purificador?')) {
      try {
        setPurificadores(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Erro ao deletar purificador:', error);
        alert('Erro ao deletar purificador. Tente novamente.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Ativo</Badge>;
      case "defeito":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Defeito</Badge>;
      case "manutencao":
        return <Badge variant="outline" className="flex items-center gap-1"><Wrench className="h-3 w-3" />Manutenção</Badge>;
      case "baixado":
        return <Badge variant="secondary" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Baixado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRefilAlert = (refilTrocadoEm?: Date) => {
    if (!refilTrocadoEm || isNaN(refilTrocadoEm.getTime())) return null;
    
        try {
      const proximaTroca = addMonths(refilTrocadoEm, 6);
      const diasRestantes = differenceInDays(proximaTroca, new Date());
      
      if (diasRestantes <= 0) {
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Refil vencido</Badge>;
      } else if (diasRestantes <= 30) {
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Trocar em {diasRestantes} dias</Badge>;
      }
      
      return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />OK</Badge>;
    } catch {
      return null;
    }
  };

  const getSiglaDescricao = (sigla: string) => {
    const siglaInfo = siglasData.find(s => s.sigla === sigla);
    return siglaInfo ? `${sigla} - ${siglaInfo.descricao}` : sigla;
  };

  const formatDateSafely = (date: Date | undefined, locale: typeof ptBR) => {
    if (!date || isNaN(date.getTime())) {
      return "Data inválida";
    }
    try {
      return format(date, "dd/MM/yyyy", { locale });
    } catch {
      return "Data inválida";
    }
  };

  const filteredAndSortedPurificadores = purificadores
    .filter(purificador => {
      const matchesSearch = 
        purificador.tombo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purificador.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purificador.sublocalidade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocalidade = selectedLocalidade === "all" || purificador.localidade === selectedLocalidade;
      const matchesStatus = selectedStatus === "all" || purificador.status === selectedStatus;
      
      return matchesSearch && matchesLocalidade && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: keyof Purificador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Purificador) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const totalPurificadores = purificadores.length;
  const ativos = purificadores.filter(p => p.status === "ativo").length;
  const emManutencao = purificadores.filter(p => p.status === "manutencao").length;
  const comDefeito = purificadores.filter(p => p.status === "defeito").length;
  const refilVencido = purificadores.filter(p => {
    if (!p.refilTrocadoEm || isNaN(p.refilTrocadoEm.getTime())) return false;
    try {
      const proximaTroca = addMonths(p.refilTrocadoEm, 6);
      return isAfter(new Date(), proximaTroca);
    } catch {
      return false;
    }
  }).length;

  return (
    <DashboardLayout>
        <TooltipProvider>
            {/* Modal de Adicionar/Editar Purificador */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingPurificador ? 'Editar Purificador' : 'Adicionar Novo Purificador'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tombo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tombo *</label>
                            <Input placeholder="Número do tombo" value={formData.tombo} onChange={(e) => handleInputChange('tombo', e.target.value)} required className="w-[150px]" />
                        </div>

                        {/* Modelo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Modelo *</label>
                            <Select value={formData.modelo} onValueChange={(value) => handleInputChange('modelo', value)}>
                                <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                                <SelectContent>
                                    {modelosData.map((modelo, index) => (<SelectItem key={`modelo-${index}`} value={modelo}>{modelo}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Localidade */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Localidade *</label>
                             <Select value={formData.localidade} onValueChange={(value) => handleInputChange('localidade', value)}>
                                <SelectTrigger><SelectValue placeholder="Selecione a localidade" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {siglasData.map((sigla, index) => (
                                        <SelectItem key={`sigla-${index}`} value={sigla.sigla}>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>{sigla.sigla}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{sigla.descricao}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Sublocalidade */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sublocalidade</label>
                            <Input placeholder="Ex: Copa, Corredor" value={formData.sublocalidade} onChange={(e) => handleInputChange('sublocalidade', e.target.value)} />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status *</label>
                            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as Purificador['status'])}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ativo">Ativo</SelectItem>
                                    <SelectItem value="defeito">Defeito</SelectItem>
                                    <SelectItem value="manutencao">Manutenção</SelectItem>
                                    <SelectItem value="baixado">Baixado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Refil Trocado Em */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Refil Trocado Em</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.refilTrocadoEm && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.refilTrocadoEm ? format(formData.refilTrocadoEm, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.refilTrocadoEm}
                                        onSelect={(date: Date | undefined) => handleInputChange('refilTrocadoEm', date)}
                                        className="rounded-md border shadow-sm"
                                        captionLayout="dropdown"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Observações</label>
                        <Textarea placeholder="Detalhes sobre o estado do purificador..." value={formData.observacoes} onChange={(e) => handleInputChange('observacoes', e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingPurificador ? 'Atualizar' : 'Adicionar'}</Button>
                    </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">Purificadores</h1>
                    <p className="text-muted-foreground mt-1">
                      Gestão de Purificadores de Água
                    </p>
                  </div>
                  
                  <Button onClick={() => handleOpenModal(null)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Purificador
                  </Button>
                </div>

                {/* Cards de Métricas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPurificadores}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{ativos}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
                            <Wrench className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{emManutencao}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Com Defeito</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{comDefeito}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Refil Vencido</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{refilVencido}</div>
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
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por tombo, modelo ou sublocalidade"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedLocalidade} onValueChange={setSelectedLocalidade}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Localidade" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">Todas as Localidades</SelectItem>
                          {siglasData.map((sigla, index) => (
                            <SelectItem key={`sigla-${index}`} value={sigla.sigla}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>{sigla.sigla}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{sigla.descricao}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="defeito">Defeito</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="baixado">Baixado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela de Purificadores */}
                <Card>
                  <CardContent className="p-0">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("tombo")}>
                                <div className="flex items-center gap-1">Tombo {getSortIcon("tombo")}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("modelo")}>
                                <div className="flex items-center gap-1">Modelo {getSortIcon("modelo")}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("localidade")}>
                                <div className="flex items-center gap-1">Localidade {getSortIcon("localidade")}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("sublocalidade")}>
                                <div className="flex items-center gap-1">Sublocalidade {getSortIcon("sublocalidade")}</div>
                            </TableHead>
                            <TableHead>Refil</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Observações</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedPurificadores.length > 0 ? (
                            filteredAndSortedPurificadores.map((purificador) => (
                              <TableRow key={purificador.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">
                                  {purificador.tombo}
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{purificador.modelo}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">{purificador.localidade}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{getSiglaDescricao(purificador.localidade)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[150px] truncate">{purificador.sublocalidade}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {purificador.refilTrocadoEm ? (
                                      <>
                                        <div className="text-sm">{formatDateSafely(purificador.refilTrocadoEm, ptBR)}</div>
                                        {getRefilAlert(purificador.refilTrocadoEm)}
                                      </>
                                    ) : (
                                      <Badge variant="outline">Não informado</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(purificador.status)}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {purificador.observacoes || "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                      <Dialog>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                  <DialogTrigger asChild>
                                                      <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                                                  </DialogTrigger>
                                              </TooltipTrigger>
                                              <TooltipContent><p>Ver Detalhes</p></TooltipContent>
                                          </Tooltip>
                                          <DialogContent className="max-w-2xl">
                                              <DialogHeader>
                                                  <DialogTitle>Detalhes do Purificador</DialogTitle>
                                                  <DialogDescription>Informações completas do equipamento</DialogDescription>
                                              </DialogHeader>
                                              <div className="space-y-4">
                                                  <div>
                                                      <h3 className="text-lg font-semibold">Detalhes do Purificador</h3>
                                                      <p><strong>Tombo:</strong> {purificador.tombo}</p>
                                                      <p><strong>Modelo:</strong> {purificador.modelo}</p>
                                                      <p><strong>Localidade:</strong> {getSiglaDescricao(purificador.localidade)}</p>
                                                      <p><strong>Sublocalidade:</strong> {purificador.sublocalidade}</p>
                                                      <p><strong>Status:</strong> {purificador.status}</p>
                                                      <p><strong>Refil Trocado Em:</strong> {purificador.refilTrocadoEm ? formatDateSafely(purificador.refilTrocadoEm, ptBR) : 'Não informado'}</p>
                                                      <p><strong>Observações:</strong> {purificador.observacoes || 'Nenhuma observação'}</p>
                                                      <p><strong>Data de Cadastro:</strong> {formatDateSafely(purificador.dataCadastro, ptBR)}</p>
                                                  </div>
                                              </div>
                                          </DialogContent>
                                      </Dialog>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <Button variant="outline" size="sm" onClick={() => handleOpenModal(purificador)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Editar Purificador</p></TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <Button variant="outline" size="sm" onClick={() => handleDelete(purificador.id!)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Excluir Purificador</p></TooltipContent>
                                      </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                {purificadores.length === 0 ? "Nenhum purificador cadastrado ainda." : "Nenhum purificador encontrado com os filtros aplicados."}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    </DashboardLayout>
  );
}
