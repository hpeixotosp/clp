"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProads } from "@/hooks/useApi";

interface Proad {
  id: number;
  numero: string;
  ano: string;
  setor_origem: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: string;
}

interface Andamento {
    id: number;
    descricao: string;
    created_at: string;
}

export default function ProadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { proads, isLoading, addAndamento, loadProads } = useProads();
  const [newAndamento, setNewAndamento] = useState("");
  
  // Encontrar o PROAD específico na lista carregada
  const proad = proads.find(p => p.id === parseInt(id));

  useEffect(() => {
    if (!id) return;
    // Carregar PROADs se ainda não foram carregados
    if (proads.length === 0) {
      loadProads();
    }
  }, [id, proads.length, loadProads]);

  const handleAddAndamento = async () => {
    if (!newAndamento.trim() || !id) return;

    try {
      await addAndamento(parseInt(id), {
        descricao: newAndamento,
        data: new Date().toISOString()
      });
      setNewAndamento("");
      // Recarregar PROADs para obter os andamentos atualizados
      loadProads();
    } catch (error) {
      console.error('Erro ao adicionar andamento:', error);
    }
  }

  if (isLoading) return <div>Carregando...</div>;
  if (!proad) return <div>PROAD não encontrado.</div>;

  return (
    <DashboardLayout>
    <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Detalhes do PROAD: {proad.numero}/{proad.ano}</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Setor de Origem:</strong> {proad.setor_origem}</p>
                <p><strong>Prioridade:</strong> <Badge>{proad.prioridade}</Badge></p>
                <p><strong>Status:</strong> {proad.status}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Andamentos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 mb-4">
                    {proad.andamentos?.map(a => (
                        <div key={a.id} className="p-2 border rounded">
                            <p className="text-sm text-muted-foreground">{new Date(a.data).toLocaleString('pt-BR')}</p>
                            <p>{a.descricao}</p>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <Textarea 
                        placeholder="Adicionar novo andamento..." 
                        value={newAndamento}
                        onChange={e => setNewAndamento(e.target.value)}
                    />
                    <Button onClick={handleAddAndamento}>Adicionar Andamento</Button>
                </div>
            </CardContent>
        </Card>
    </div>
    </DashboardLayout>
  )
}
