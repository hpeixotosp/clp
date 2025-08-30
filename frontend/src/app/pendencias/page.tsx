"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  FileText,
  Inbox,
  ChevronDown
} from "lucide-react";

export default function PendenciasPage() {
    // Dados mockados para demonstração
    const pendencias = [
        {
            id: 1,
            tipo: "PROAD",
            descricao: "PROAD 2024/001 - Aguardando aprovação",
            prioridade: "Alta",
            setor: "TIC",
            diasPendente: 3,
            responsavel: "João Silva"
        },
        {
            id: 2,
            tipo: "Demanda",
            descricao: "Atualização do sistema de ponto eletrônico",
            prioridade: "Média",
            setor: "RH",
            diasPendente: 5,
            responsavel: "Maria Santos"
        },
        {
            id: 3,
            tipo: "PROAD",
            descricao: "PROAD 2024/002 - Documentação incompleta",
            prioridade: "Alta",
            setor: "Jurídico",
            diasPendente: 7,
            responsavel: "Pedro Costa"
        },
        {
            id: 4,
            tipo: "Demanda",
            descricao: "Relatório mensal de produtividade",
            prioridade: "Baixa",
            setor: "Administrativo",
            diasPendente: 2,
            responsavel: "Ana Oliveira"
        }
    ];

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority) {
            case "Alta":
                return "destructive";
            case "Média":
                return "secondary";
            default:
                return "outline";
        }
    };

    const getTipoIcon = (tipo: string) => {
        return tipo === "PROAD" ? <FileText className="h-4 w-4" /> : <Inbox className="h-4 w-4" />;
    };

    // Calcular métricas
    const totalPendencias = pendencias.length;
    const altaPrioridade = pendencias.filter(p => p.prioridade === "Alta").length;
    const mediaPrioridade = pendencias.filter(p => p.prioridade === "Média").length;
    const baixaPrioridade = pendencias.filter(p => p.prioridade === "Baixa").length;
    const maisDe5Dias = pendencias.filter(p => p.diasPendente > 5).length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Pendências</h1>
                    <p className="text-muted-foreground mt-1">
                        Itens que requerem atenção e ação
                    </p>
                </div>

                {/* Cards de Métricas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPendencias}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Prioridade Alta</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{altaPrioridade}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Prioridade Média</CardTitle>
                            <Clock className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{mediaPrioridade}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Prioridade Baixa</CardTitle>
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{baixaPrioridade}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">+5 Dias</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{maisDe5Dias}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabela de Pendências */}
                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold">Lista de Pendências</h3>
                                <p className="text-sm text-muted-foreground">
                                    Clique em uma pendência para ver detalhes e tomar ação
                                </p>
                            </div>
                            
                            <div className="divide-y">
                                {pendencias.map((pendencia) => (
                                    <div 
                                        key={pendencia.id} 
                                        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="mt-1">
                                                    {getTipoIcon(pendencia.tipo)}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-medium">{pendencia.descricao}</h4>
                                                        <Badge variant={getPriorityBadgeVariant(pendencia.prioridade)}>
                                                            {pendencia.prioridade}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>Setor: {pendencia.setor}</span>
                                                        <span>Responsável: {pendencia.responsavel}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {pendencia.diasPendente} dia(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline">
                                                    Ver Detalhes
                                                </Button>
                                                <Button size="sm">
                                                    Resolver
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mensagem quando não há pendências */}
                {pendencias.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhuma pendência encontrada!</h3>
                            <p className="text-muted-foreground">
                                Todos os itens estão em dia. Parabéns pela organização!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
