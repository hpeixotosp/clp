"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package2, 
  Plus, 
  Search, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Refil, type Sigla } from "@/lib/types";

const marcasFormulario = ["IBBL", "TOP LIFE", "LIBELL", "EUROPA HF 180"];

interface RefisClientProps {
    initialRefis: Refil[];
    marcasDisponiveis: string[];
    initialSiglas: Sigla[];
}

export function RefisClient({ initialRefis, marcasDisponiveis: initialMarcas, initialSiglas }: RefisClientProps) {
  const [refis, setRefis] = useState<Refil[]>(initialRefis.map(r => ({...r, dataCadastro: new Date(r.dataCadastro), ultimaAtualizacao: new Date(r.ultimaAtualizacao)})));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRefil, setEditingRefil] = useState<Refil | null>(null);
  const [selectedMarca, setSelectedMarca] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Refil>("marca");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [marcasDisponiveis, setMarcasDisponiveis] = useState<string[]>(initialMarcas);
  const [siglasData, setSiglasData] = useState<Sigla[]>(initialSiglas);

  const [formData, setFormData] = useState<Partial<Omit<Refil, 'id'>>>({
    marca: "",
    quantidadeDisponivel: 0,
    fotoUrl: "",
    descricao: "",
  });

  const fetchRefis = useCallback(async () => {
    try {
      const response = await fetch('/api/refis');
      if (!response.ok) throw new Error('Falha ao carregar refis.');
      const data: Refil[] = await response.json();
      const refisComDatas = data.map(r => ({
        ...r,
        dataCadastro: new Date(r.dataCadastro),
        ultimaAtualizacao: new Date(r.ultimaAtualizacao),
      }));
      setRefis(refisComDatas);
      setMarcasDisponiveis(Array.from(new Set(refisComDatas.map(r => r.marca).filter(Boolean))));
      
      // Carregar siglas se não estiverem disponíveis
      if (siglasData.length === 0) {
        try {
          const siglasResponse = await fetch('/api/siglas');
          if (siglasResponse.ok) {
            const siglasData = await siglasResponse.json();
            setSiglasData(siglasData);
          }
        } catch (error) {
          console.error('Erro ao carregar siglas:', error);
        }
      }
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  const getSiglaDescricao = (sigla: string) => {
    const siglaInfo = siglasData.find(s => s.sigla === sigla);
    return siglaInfo ? `${sigla} - ${siglaInfo.descricao}` : sigla;
  };
  
  const handleInputChange = (field: keyof typeof formData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      marca: "",
      quantidadeDisponivel: 0,
      fotoUrl: "",
      descricao: "",
    });
  };

  const handleOpenModal = (refil: Refil | null) => {
    if (refil) {
      setEditingRefil(refil);
      setFormData({
        marca: refil.marca,
        quantidadeDisponivel: refil.quantidadeDisponivel,
        fotoUrl: refil.fotoUrl,
        descricao: refil.descricao,
      });
    } else {
      setEditingRefil(null);
      resetForm();
    }
    setIsModalOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marca) {
      alert('Por favor, selecione a marca.');
      return;
    }

    try {
      if (editingRefil) {
        const payload: Partial<Omit<Refil, 'id'>> = {
          ...formData,
          ultimaAtualizacao: new Date(),
        };
        const response = await fetch(`/api/refis/${editingRefil.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Falha ao atualizar refil.');
      } else {
        const payload: Omit<Refil, 'id'> = {
          marca: formData.marca!,
          quantidadeDisponivel: formData.quantidadeDisponivel!,
          fotoUrl: formData.fotoUrl,
          descricao: formData.descricao,
          dataCadastro: new Date(),
          ultimaAtualizacao: new Date(),
        };
        const response = await fetch('/api/refis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Falha ao salvar refil.');
      }
      
      await fetchRefis();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este refil?')) {
      try {
        const response = await fetch(`/api/refis/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha ao excluir refil.');
        await fetchRefis();
      } catch (error) {
        console.error(error);
        alert((error as Error).message);
      }
    }
  };

  const getQuantidadeBadge = (quantidade: number) => {
    const quantidadeMinima = 5; // Definindo um valor fixo para estoque mínimo
    if (quantidade <= 0) {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Esgotado</Badge>;
    } else if (quantidade <= quantidadeMinima) {
      return <Badge variant="outline" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Baixo Estoque</Badge>;
    } else {
      return <Badge variant="default" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Em Estoque</Badge>;
    }
  };

  const filteredAndSortedRefis = refis
    .filter(refil => {
      const matchesSearch = refil.marca.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarca = selectedMarca === "all" || refil.marca === selectedMarca;
      return matchesSearch && matchesMarca;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (sortDirection === "asc") {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue);
        }
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return bValue.localeCompare(aValue);
        }
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: keyof Refil) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Refil) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Métricas
  const totalRefis = refis.length;
  const totalEstoque = refis.reduce((sum, r) => sum + r.quantidadeDisponivel, 0);
  const baixoEstoque = refis.filter(r => r.quantidadeDisponivel > 0 && r.quantidadeDisponivel <= 5).length;
  const esgotados = refis.filter(r => r.quantidadeDisponivel <= 0).length;

  useEffect(() => {
    fetchRefis();
  }, [fetchRefis]);

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Refis</h1>
              <p className="text-muted-foreground mt-1">Gestão de Refis para Purificadores</p>
            </div>
            <Button onClick={() => handleOpenModal(null)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Refil
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Modelos</CardTitle>
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalRefis}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total em Estoque</CardTitle>
                    <Package2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{totalEstoque}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-orange-600">{baixoEstoque}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Esgotados</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{esgotados}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por marca" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
                <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Marcas</SelectItem>
                    {marcasDisponiveis.map((marca, index) => (
                      <SelectItem key={`marca-filter-${index}`} value={marca}>{marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRefil ? 'Editar Refil' : 'Adicionar Novo Refil'}</DialogTitle>
                <DialogDescription>Preencha as informações do refil.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Marca *</label>
                        <Select value={formData.marca} onValueChange={(value) => handleInputChange('marca', value)}>
                            <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                            <SelectContent>
                                {marcasFormulario.map((marca, index) => (
                                    <SelectItem key={`marca-${index}`} value={marca}>{marca}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Quantidade Disponível *</label>
                        <Input type="number" min="0" placeholder="0" value={formData.quantidadeDisponivel} onChange={(e) => handleInputChange('quantidadeDisponivel', parseInt(e.target.value) || 0)} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea placeholder="Descrição detalhada do refil..." value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} rows={3}/>
                </div>
                {/* Foto do Refil */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Foto do Refil</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              handleInputChange('fotoUrl', imageUrl);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => handleInputChange('fotoUrl', '')}>
                        Limpar
                      </Button>
                    </div>
                    
                    {formData.fotoUrl && (
                      <div className="flex justify-center">
                        <img 
                          src={formData.fotoUrl} 
                          alt="Preview do refil"
                          className="w-40 h-40 object-cover rounded-lg border shadow-sm"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">{editingRefil ? 'Atualizar Refil' : 'Salvar Refil'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("marca")}>
                        <div className="flex items-center gap-1">Marca{getSortIcon("marca")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("quantidadeDisponivel")}>
                        <div className="flex items-center gap-1">Estoque{getSortIcon("quantidadeDisponivel")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("ultimaAtualizacao")}>
                        <div className="flex items-center gap-1">Atualização{getSortIcon("ultimaAtualizacao")}</div>
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedRefis.length > 0 ? (
                      filteredAndSortedRefis.map((refil) => (
                        <TableRow key={refil.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{refil.marca}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{refil.quantidadeDisponivel}</div>
                              {getQuantidadeBadge(refil.quantidadeDisponivel)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {refil.ultimaAtualizacao.toLocaleDateString('pt-BR')}
                            </div>
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
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Detalhes do Refil</DialogTitle>
                                            <DialogDescription>Informações completas do item de estoque.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            {refil.fotoUrl && (
                                                <div className="flex justify-center">
                                                    <img src={refil.fotoUrl} alt={`Foto do refil ${refil.marca}`} className="w-40 h-40 object-cover rounded-lg border shadow-sm" />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                                <div><p className="font-medium text-sm">Marca:</p><p>{refil.marca}</p></div>
                                                <div><p className="font-medium text-sm">Estoque:</p><p>{refil.quantidadeDisponivel}</p></div>
                                                <div><p className="font-medium text-sm">Cadastrado em:</p><p>{refil.dataCadastro.toLocaleDateString('pt-BR')}</p></div>
                                                <div><p className="font-medium text-sm">Última Atualização:</p><p>{refil.ultimaAtualizacao.toLocaleDateString('pt-BR')}</p></div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Descrição:</p>
                                                <p className="text-sm text-muted-foreground">{refil.descricao || "Nenhuma descrição."}</p>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Tooltip><TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(refil)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                                </TooltipTrigger><TooltipContent><p>Editar Refil</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(refil.id!)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                                </TooltipTrigger><TooltipContent><p>Excluir Refil</p></TooltipContent></Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {initialRefis.length === 0 && refis.length === 0 ? "Nenhum refil cadastrado." : "Nenhum refil encontrado."}
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
