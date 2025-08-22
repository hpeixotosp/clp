"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Inbox, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight,
  Filter,
  Users,
  Cpu,
  FlaskConical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  // Mock data para demonstração
  const proads = [
    { id: 1, numero: "001", ano: "24", setor: "Administração", prioridade: "alta", situacao: "ativo" },
    { id: 2, numero: "002", ano: "24", setor: "Tecnologia", prioridade: "media", situacao: "ativo" },
    { id: 3, numero: "003", ano: "24", setor: "Recursos Humanos", prioridade: "baixa", situacao: "concluido" }
  ];

  const demandas = [
    { id: 1, titulo: "Atualização Sistema", descricao: "Melhorias no sistema de controle", setor: "TI", prioridade: "alta", situacao: "em_andamento" },
    { id: 2, titulo: "Reforma Sala", descricao: "Renovação da sala de reuniões", setor: "Administração", prioridade: "media", situacao: "pendente" }
  ];

  const ticCount = 15; // Total de análises de frequência
  const pendenciasCount = proads.filter(p => p.situacao === "ativo").length + demandas.filter(d => d.prioridade === "alta").length;

  // Dados mockados para demonstração
  const stats = {
    purificadoresCount: 156
  };

  // Dados de atividade recente
  const atividadesRecentes = [
    { id: 1, tipo: "PROAD", acao: "Criado", descricao: "PROAD 123/25", tempo: "2 min atrás", cor: "blue" },
    { id: 2, tipo: "Demanda", acao: "Atualizada", descricao: "Sistema de Controle", tempo: "15 min atrás", cor: "green" },
    { id: 3, tipo: "TIC", acao: "Processado", descricao: "Frequência Mensal", tempo: "1 hora atrás", cor: "purple" },
    { id: 4, tipo: "PROAD", acao: "Concluído", descricao: "PROAD 098/24", tempo: "2 horas atrás", cor: "gray" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header com a imagem anexa */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 text-white flex items-center justify-center">
          <img 
            src="/images/trt21-clp-header.png" 
            alt="TRT21 - CLP Header" 
            className="max-w-full max-h-48 object-contain"
          />
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-4">
          <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50" onClick={() => window.location.href = '/purificadores'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Purificadores</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlaskConical className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.purificadoresCount}</div>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">
                Total de equipamentos
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50" onClick={() => window.location.href = '/proad'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">PROADs</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{proads.length}</div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
                Processos administrativos
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50" onClick={() => window.location.href = '/demandas'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Demandas</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Inbox className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">{demandas.length}</div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2">
                Solicitações pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50" onClick={() => window.location.href = '/tic'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">TIC</CardTitle>
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{ticCount}</div>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2">
                Análise de frequência
              </p>
            </CardContent>
          </Card>
        </div>





        {/* Atividade Recente */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {atividadesRecentes.map((atividade) => (
                  <div key={atividade.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium
                      ${atividade.cor === 'blue' ? 'bg-blue-500' : 
                        atividade.cor === 'green' ? 'bg-green-500' : 
                        atividade.cor === 'purple' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                      {atividade.tipo.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{atividade.acao} {atividade.descricao}</p>
                      <p className="text-xs text-muted-foreground">{atividade.tempo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                Resumo de Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Purificadores</span>
                  </div>
                  <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                    {stats.purificadoresCount}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </DashboardLayout>
  );
}
