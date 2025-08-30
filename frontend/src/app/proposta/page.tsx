"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PropostaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Análise de Proposta</h1>
            <p className="text-muted-foreground mt-1">
              Ferramenta para análise de propostas e documentos
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Análise de Proposta
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Funcionalidade em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              Esta página está sendo desenvolvida. Por enquanto, utilize a funcionalidade de 
              <Link href="/analise-proposta" className="text-primary hover:underline mx-1">
                Análise de Conformidade por Item
              </Link>
              para análises detalhadas.
            </p>
            <Link href="/analise-proposta">
              <Button>
                Ir para Análise de Conformidade
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}