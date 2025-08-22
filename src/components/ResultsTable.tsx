"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimeSheetResult } from "@/types/timesheet";
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ResultsTableProps {
  results: TimeSheetResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof TimeSheetResult>("colaborador");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Filtrar e ordenar resultados
  const filteredAndSortedResults = useMemo(() => {
    const filtered = results.filter(result =>
      (result.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.periodo.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterMonth === "all" || result.periodo.startsWith(filterMonth + "/"))
    );

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Tratamento especial para campos numéricos
      if (sortField === "saldoMinutes") {
        aValue = a.saldoMinutes;
        bValue = b.saldoMinutes;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [results, searchTerm, sortField, sortDirection, filterMonth]);

  const handleSort = (field: keyof TimeSheetResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof TimeSheetResult) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const totalFiles = results.length;
    const signedFiles = results.filter(r => r.assinatura).length;
    const pendingFiles = totalFiles - signedFiles;
    const positiveBalance = results.filter(r => r.saldoMinutes >= 0).length;
    const negativeBalance = results.filter(r => r.saldoMinutes < 0).length;
    
    const totalBalanceMinutes = results.reduce((acc, r) => acc + r.saldoMinutes, 0);
    const averageBalance = totalBalanceMinutes / totalFiles;

    return {
      totalFiles,
      signedFiles,
      pendingFiles,
      positiveBalance,
      negativeBalance,
      averageBalance
    };
  }, [results]);

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Análise</CardTitle>
          <CardDescription>
            Aguardando arquivos para análise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum resultado disponível</p>
            <p className="text-sm">Faça o upload e processe os arquivos PDF para ver os resultados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resultados da Análise</CardTitle>
            <CardDescription>
              {results.length} arquivo(s) processado(s) com sucesso
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou período..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
                         <Select value={filterMonth} onValueChange={setFilterMonth}>
               <SelectTrigger className="w-48">
                 <SelectValue placeholder="Filtrar por mês..." />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os Meses</SelectItem>
                {/* Gerar opções de meses dinamicamente */}
                {[...new Set(results.map(r => r.periodo.split('/')[0]))].map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {stats.totalFiles}
            </div>
            <div className="text-sm text-muted-foreground">
              Total
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle className="h-5 w-5" />
              {stats.signedFiles}
            </div>
            <div className="text-sm text-muted-foreground">
              Assinados
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <AlertCircle className="h-5 w-5" />
              {stats.pendingFiles}
            </div>
            <div className="text-sm text-muted-foreground">
              Assinaturas Pendentes
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {stats.positiveBalance}
            </div>
            <div className="text-sm text-muted-foreground">
              Saldo +
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
              <TrendingDown className="h-5 w-5" />
              {stats.negativeBalance}
            </div>
            <div className="text-sm text-muted-foreground">
              Saldo -
            </div>
          </div>
        </div>

        {/* Tabela de resultados */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("colaborador")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Colaborador {getSortIcon("colaborador")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("periodo")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Período {getSortIcon("periodo")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("previsto")}
                    className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
                  >
                    Previsto {getSortIcon("previsto")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("realizado")}
                    className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
                  >
                    Realizado {getSortIcon("realizado")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("saldoMinutes")}
                    className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
                  >
                    BH (Saldo) {getSortIcon("saldoMinutes")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("assinatura")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Assinatura {getSortIcon("assinatura")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedResults.map((result, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {result.colaborador}
                  </TableCell>
                  <TableCell>{result.periodo}</TableCell>
                  <TableCell className="text-right font-mono">
                    {result.previsto}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {result.realizado}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={result.saldoMinutes < 0 ? "destructive" : "default"}
                      className="font-mono text-sm px-3 py-1"
                    >
                      {result.saldo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={result.assinatura ? "default" : "secondary"}
                      className="text-sm px-3 py-1"
                    >
                      {result.assinatura ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendente
                        </>
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Resumo final */}
        {filteredAndSortedResults.length > 0 && (
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>
              Mostrando {filteredAndSortedResults.length} de {results.length} resultados
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
