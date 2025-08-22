"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/DashboardLayout";

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
  const id = params.id;
  const [proad, setProad] = useState<Proad | null>(null);
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [newAndamento, setNewAndamento] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
        const [proadRes, andamentosRes] = await Promise.all([
            fetch(`/api/proads?id=${id}`),
            fetch(`/api/andamentos?proad_id=${id}`)
        ]);

        const proadData = await proadRes.json();
        const andamentosData = await andamentosRes.json();

        if (proadData.success) setProad(proadData.data);
        if (andamentosData.success) setAndamentos(andamentosData.data);
        
        setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleAddAndamento = async () => {
    if (!newAndamento.trim() || !id) return;

    const response = await fetch('/api/andamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proad_id: id, descricao: newAndamento })
    });

    if (response.ok) {
        setNewAndamento("");
        // Re-fetch andamentos
        const andamentosRes = await fetch(`/api/andamentos?proad_id=${id}`);
        const andamentosData = await andamentosRes.json();
        if (andamentosData.success) setAndamentos(andamentosData.data);
    }
  }

  if (loading) return <div>Carregando...</div>;
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
                    {andamentos.map(a => (
                        <div key={a.id} className="p-2 border rounded">
                            <p className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
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
