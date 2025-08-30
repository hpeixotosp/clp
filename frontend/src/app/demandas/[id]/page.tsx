"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDemandas } from "@/hooks/useApi";

interface Demanda {
  id: number;
  descricao: string;
  setor_origem: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: string;
}

interface Andamento {
    id: number;
    descricao: string;
    created_at: string;
}

export default function DemandaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const {
    demandas,
    loading,
    loadDemandas,
    addAndamento
  } = useDemandas();
  
  const [novoAndamento, setNovoAndamento] = useState("");
  const [adicionandoAndamento, setAdicionandoAndamento] = useState(false);
  
  const demanda = demandas.find(d => d.id === parseInt(id));
  const andamentos = demanda?.andamentos || [];

  useEffect(() => {
    if (!demandas || demandas.length === 0) {
      loadDemandas();
    }
  }, [demandas?.length, loadDemandas]);

  const handleAddAndamento = async () => {
    if (!novoAndamento.trim()) return;
    
    setAdicionandoAndamento(true);
    try {
      await addAndamento(parseInt(id), {
        descricao: novoAndamento,
        data: new Date()
      });
      setNovoAndamento("");
      // Recarregar demandas para obter os andamentos atualizados
      await loadDemandas();
    } catch (error) {
      console.error('Erro ao adicionar andamento:', error);
      alert('Erro ao adicionar andamento');
    } finally {
      setAdicionandoAndamento(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!demanda) return <div>Demanda não encontrada.</div>;

  return (
    <DashboardLayout>
    <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Detalhes da Demanda</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Descrição:</strong> {demanda.descricao}</p>
                <p><strong>Setor de Origem:</strong> {demanda.setor_origem}</p>
                <p><strong>Prioridade:</strong> <Badge>{demanda.prioridade}</Badge></p>
                <p><strong>Status:</strong> {demanda.status}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Andamentos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 mb-4">
                    {andamentos.map((andamento) => (
                      <div key={andamento.id} className="border-l-2 border-blue-200 pl-4 py-2">
                        <p className="text-sm text-gray-600">
                          {new Date(andamento.created_at).toLocaleDateString('pt-BR')} às {new Date(andamento.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="mt-1">{andamento.descricao}</p>
                      </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <Textarea 
                        placeholder="Adicionar novo andamento..." 
                        value={novoAndamento}
                        onChange={e => setNovoAndamento(e.target.value)}
                    />
                    <Button onClick={handleAddAndamento} disabled={adicionandoAndamento}>
                       {adicionandoAndamento ? "Adicionando..." : "Adicionar Andamento"}
                     </Button>
                </div>
            </CardContent>
        </Card>
    </div>
    </DashboardLayout>
  )
}
