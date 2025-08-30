"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setores } from "@/lib/data";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function NewDemandaPage() {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [setorOrigem, setSetorOrigem] = useState("");
  const [prioridade, setPrioridade] = useState<"Alta" | "Média" | "Baixa">("Média");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/demandas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        descricao,
        setor_origem: setorOrigem,
        prioridade,
      }),
    });

    if (response.ok) {
      router.push("/demandas");
    } else {
      // Adicionar tratamento de erro aqui
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Nova Demanda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="setor-origem">Setor de Origem</Label>
            <Select value={setorOrigem} onValueChange={setSetorOrigem} required>
                <SelectTrigger id="setor-origem">
                    <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                    {setores.map((setor) => (
                        <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <RadioGroup
              value={prioridade}
              onValueChange={(val: "Alta" | "Média" | "Baixa") => setPrioridade(val)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Baixa" id="baixa" />
                <Label htmlFor="baixa">Baixa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Média" id="média" />
                <Label htmlFor="média">Média</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Alta" id="alta" />
                <Label htmlFor="alta">Alta</Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </DashboardLayout>
  );
}
