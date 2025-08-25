"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Users, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ColaboradoresManagerProps {
  onColaboradoresChange?: (colaboradores: string[]) => void;
}

function ColaboradoresManager({ onColaboradoresChange }: ColaboradoresManagerProps) {
  const [colaboradores, setColaboradores] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [novoColaborador, setNovoColaborador] = useState("");
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [listaCompleta, setListaCompleta] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    carregarColaboradores();
  }, []);

  const carregarColaboradores = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/colaboradores');
      const data = await response.json();
      
      if (data.success) {
        setColaboradores(data.data || []);
        setListaCompleta(data.data?.join('\n') || '');
        onColaboradoresChange?.(data.data || []);
      } else {
        setError(data.error || 'Erro ao carregar colaboradores');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarColaborador = async () => {
    if (!novoColaborador.trim()) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/colaboradores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoColaborador.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setColaboradores(data.data);
        setListaCompleta(data.data.join('\n'));
        setNovoColaborador('');
        setSuccess('Colaborador adicionado com sucesso!');
        onColaboradoresChange?.(data.data);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erro ao adicionar colaborador');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const removerColaborador = async (nome: string) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/colaboradores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setColaboradores(data.data);
        setListaCompleta(data.data.join('\n'));
        setSuccess('Colaborador removido com sucesso!');
        onColaboradoresChange?.(data.data);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erro ao remover colaborador');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const iniciarEdicao = (index: number) => {
    setEditandoIndex(index);
    setNomeEditado(colaboradores[index]);
  };

  const cancelarEdicao = () => {
    setEditandoIndex(null);
    setNomeEditado('');
  };

  const salvarEdicao = async () => {
    if (!nomeEditado.trim() || editandoIndex === null) return;

    const nomeAntigo = colaboradores[editandoIndex];
    
    try {
      setIsSaving(true);
      
      // Remover o nome antigo
      await fetch('/api/colaboradores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeAntigo })
      });
      
      // Adicionar o nome novo
      const response = await fetch('/api/colaboradores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEditado.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setColaboradores(data.data);
        setListaCompleta(data.data.join('\n'));
        setEditandoIndex(null);
        setNomeEditado('');
        setSuccess('Colaborador editado com sucesso!');
        onColaboradoresChange?.(data.data);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erro ao editar colaborador');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const salvarListaCompleta = async () => {
    try {
      setIsSaving(true);
      const novosColaboradores = listaCompleta
        .split('\n')
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0);
      
      const response = await fetch('/api/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colaboradores: novosColaboradores })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setColaboradores(data.data);
        setListaCompleta(data.data.join('\n'));
        setDialogAberto(false);
        setSuccess(`${data.data.length} colaboradores salvos com sucesso!`);
        onColaboradoresChange?.(data.data);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erro ao salvar lista');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando colaboradores...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gerenciar Colaboradores Válidos
        </CardTitle>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            {colaboradores.length} colaboradores cadastrados
          </Badge>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar Lista Completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Lista Completa de Colaboradores</DialogTitle>
                <DialogDescription>
                  Edite a lista completa de colaboradores. Um nome por linha.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={listaCompleta}
                  onChange={(e) => setListaCompleta(e.target.value)}
                  placeholder="Digite um nome por linha..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogAberto(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={salvarListaCompleta}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Lista
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensagens de feedback */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        {/* Adicionar novo colaborador */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="novo-colaborador" className="sr-only">
              Nome do colaborador
            </Label>
            <Input
              id="novo-colaborador"
              placeholder="Digite o nome do colaborador..."
              value={novoColaborador}
              onChange={(e) => setNovoColaborador(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && adicionarColaborador()}
              disabled={isSaving}
            />
          </div>
          <Button
            onClick={adicionarColaborador}
            disabled={!novoColaborador.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Lista de colaboradores */}
        {colaboradores.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Colaborador</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((colaborador, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editandoIndex === index ? (
                        <Input
                          value={nomeEditado}
                          onChange={(e) => setNomeEditado(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="font-medium"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{colaborador}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editandoIndex === index ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={salvarEdicao}
                              disabled={isSaving}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelarEdicao}
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => iniciarEdicao(index)}
                              disabled={isSaving}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isSaving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmar remoção</DialogTitle>
                                  <DialogDescription>
                                    Tem certeza que deseja remover "{colaborador}" da lista de colaboradores válidos?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Cancelar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => removerColaborador(colaborador)}
                                  >
                                    Remover
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum colaborador cadastrado</p>
            <p className="text-sm">Adicione colaboradores usando o campo acima</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ColaboradoresManager;