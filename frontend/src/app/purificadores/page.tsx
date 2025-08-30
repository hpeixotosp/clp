import {
  loadFiltrosDataDirectly,
  loadSiglasDataDirectly,
  type FiltroData,
} from "@/lib/csv-loader";
import { PurificadoresClient } from "./PurificadoresClient";
import { type Sigla } from "@/lib/types";

interface Purificador {
  id?: number;
  tombo: string;
  modelo: string;
  localidade: string;
  sublocalidade: string;
  refilTrocadoEm?: Date;
  status: "ativo" | "defeito" | "manutencao" | "baixado";
  observacoes?: string;
  dataCadastro: Date;
}

// Helper para acessar propriedades do objeto de forma case-insensitive
const getProp = (obj: FiltroData, key: string) => {
  const keyFound = Object.keys(obj).find(k => k.toLowerCase().trim() === key.toLowerCase());
  return keyFound ? obj[keyFound] : undefined;
}

export default async function PurificadoresPage() {
  // Carregando dados diretamente no servidor
  const filtros = await loadFiltrosDataDirectly();
  const siglas = await loadSiglasDataDirectly();
  
  // Processando os dados no servidor, antes de enviar para o cliente
  const modelosUnicos = new Set<string>();
  filtros.forEach(f => {
    const modelo = getProp(f, 'modelo');
    if (modelo && modelo.trim()) {
      modelosUnicos.add(modelo.trim());
    }
  });
  const modelosArray = Array.from(modelosUnicos).sort();

  let currentUniqueId = 0;
  const purificadoresFromCSV: Purificador[] = [];

  filtros.forEach((filtro: FiltroData) => {
    const tombo = getProp(filtro, 'tombo');
    const modelo = getProp(filtro, 'modelo');
    const localidade = getProp(filtro, 'localidade');
    const sublocalidade = getProp(filtro, 'sublocalidade');
    const trocadoEm = getProp(filtro, 'trocado em'); // Corrigido para corresponder ao header
    const observacoes = getProp(filtro, 'observações'); // Corrigido para corresponder ao header

    if (tombo && modelo && localidade) {
      currentUniqueId++;
      purificadoresFromCSV.push({
        id: currentUniqueId,
        tombo: tombo,
        modelo: modelo,
        localidade: localidade,
        sublocalidade: sublocalidade || '',
        refilTrocadoEm: trocadoEm ? (() => {
          try {
            // Tenta converter de DD/MM/YY ou DD/MM/YYYY para um formato que o Date entende
            const parts = trocadoEm.split('/');
            if (parts.length === 3) {
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              const date = new Date(`${year}-${parts[1]}-${parts[0]}`);
              return isNaN(date.getTime()) ? undefined : date;
            }
            const date = new Date(trocadoEm);
            return isNaN(date.getTime()) ? undefined : date;
          } catch {
            return undefined;
          }
        })() : undefined,
        status: observacoes?.toLowerCase().includes('defeito') ? 'defeito' :
               observacoes?.toLowerCase().includes('manutencao') || observacoes?.toLowerCase().includes('manutenção') ? 'manutencao' :
               observacoes?.toLowerCase().includes('baixado') ? 'baixado' : 'ativo',
        observacoes: observacoes || '',
        dataCadastro: new Date()
      });
    }
  });

  return (
    <PurificadoresClient 
      initialPurificadores={purificadoresFromCSV}
      initialSiglas={siglas}
      initialModelos={modelosArray}
    />
  );
}
