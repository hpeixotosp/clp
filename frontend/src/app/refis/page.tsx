import { loadRefisDataDirectly, loadSiglasDataDirectly, type RefisData } from "@/lib/csv-loader";
import { RefisClient } from "./RefisClient";
import { type Sigla } from "@/lib/types";

interface Refil {
  id: number;
  marca: string;
  quantidadeDisponivel: number;
  fotoUrl?: string;
  descricao?: string;
  dataCadastro: Date;
  ultimaAtualizacao: Date;
}

// Helper para acessar propriedades do objeto de forma case-insensitive
const getProp = (obj: Record<string, string>, key: string) => {
  const keyFound = Object.keys(obj).find(k => k.toLowerCase().trim() === key.toLowerCase());
  return keyFound ? obj[keyFound] : undefined;
}

export default async function RefisPage() {
  const refisCSV = await loadRefisDataDirectly();
  const siglas = await loadSiglasDataDirectly();
  const marcasDisponiveis = Array.from(new Set(refisCSV.map(r => getProp(r, 'marca')).filter(Boolean) as string[]));
  const initialRefis: Refil[] = refisCSV.map((refil: Record<string, string>, index) => {
    const marca = getProp(refil, 'marca');
    const quantidade = getProp(refil, 'quantidade') || getProp(refil, 'quantidadedisponivel');
    return {
        id: index + 1,
        marca: marca || '',
        quantidadeDisponivel: parseInt(quantidade || '0') || 0,
        descricao: `Refil de filtro para marca ${marca}`,
        dataCadastro: new Date(),
        ultimaAtualizacao: new Date()
    }
  }).filter((r) => r.marca !== undefined && r.marca !== '') as Refil[];
  return (
    <RefisClient 
      initialRefis={initialRefis}
      marcasDisponiveis={marcasDisponiveis}
      initialSiglas={siglas}
    />
  );
}
