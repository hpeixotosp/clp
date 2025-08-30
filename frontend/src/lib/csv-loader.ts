import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';
import { type Sigla } from './types';

export interface FiltroData {
  tombo: string;
  modelo: string;
  localidade: string;
  sublocalidade: string;
  trocadoEm: string;
  trocaEm6Meses: string;
  observacoes: string;
  [key: string]: string;
}

export interface Filtro1Data {
  tomboEuropa: string;
  tombo: string;
  modelo: string;
  localidade: string;
  sublocalidade: string;
  trocadoEm: string;
  trocaEm6Meses: string;
  observacoes: string;
  [key: string]: string;
}

export interface Filtro2Data {
  tombo: string;
  modelo: string;
  localidade: string;
  sublocalidade: string;
  trocadoEm: string;
  trocaEm6Meses: string;
  observacoes: string;
  [key: string]: string;
}

export interface RefisData {
  marca: string;
  quantidade: string;
  [key: string]: string;
}

export interface LocalidadeData {
  codigo: string;
  nome: string;
  [key: string]: string;
}

// Funções de fetch para cada tipo de dado, chamando a API correspondente

export async function loadFiltrosData(): Promise<FiltroData[]> {
  try {
    const response = await fetch('/api/csv/filtros');
    if (!response.ok) throw new Error('Falha ao carregar filtros');
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar filtros:', error);
    return [];
  }
}

export async function loadRefisData(): Promise<RefisData[]> {
  try {
    const response = await fetch('/api/csv/refis');
    if (!response.ok) throw new Error('Falha ao carregar refis');
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar refis:', error);
    return [];
  }
}

export async function loadLocalidadesData(): Promise<LocalidadeData[]> {
  try {
    const response = await fetch('/api/csv/localidades');
    if (!response.ok) throw new Error('Falha ao carregar localidades');
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar localidades:', error);
    return [];
  }
}

// Função para obter localidades únicas de todos os filtros
export async function getUniqueLocalidades(): Promise<string[]> {
  try {
    const filtros = await loadFiltrosData();
    const localidades = new Set<string>();
    filtros.forEach(f => {
      if (f.localidade) localidades.add(f.localidade);
    });
    return Array.from(localidades).sort();
  } catch (error) {
    console.error('Erro ao obter localidades únicas:', error);
    return [];
  }
}

// Função para obter modelos únicos de todos os filtros
export async function getUniqueModelos(): Promise<string[]> {
  try {
    const filtros = await loadFiltrosData();
    const modelos = new Set<string>();
    filtros.forEach(f => {
      if (f.modelo) modelos.add(f.modelo);
    });
    return Array.from(modelos).sort();
  } catch (error) {
    console.error('Erro ao obter modelos únicos:', error);
    return [];
  }
}

// --- NOVAS FUNÇÕES PARA LEITURA DIRETA NO SERVIDOR ---

export async function loadFiltrosDataDirectly(): Promise<FiltroData[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'filtros.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    
    // @ts-expect-error - Papa.parse returns data with dynamic keys
    return parsed.data;
  } catch (error) {
    console.error('Erro ao ler diretamente o arquivo filtros.csv:', error);
    return [];
  }
}

export async function loadRefisDataDirectly(): Promise<RefisData[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'refis.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    return parsed.data as RefisData[];
  } catch (error) {
    console.error('Erro ao ler diretamente o arquivo refis.csv:', error);
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log("Criando um arquivo refis.csv vazio porque ele não foi encontrado.")
        // Se o arquivo não existe, cria um array vazio para não quebrar a página
        return [];
    }
    return [];
  }
}

export async function loadLocalidadesDataDirectly(): Promise<LocalidadeData[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'localidades.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    // @ts-expect-error - Papa.parse returns data with dynamic keys
    const mappedData = parsed.data.map((row: Record<string, string>, index: number) => {
      const codigo = row['Cód'] || row['codigo'] || row['Código'];
      const nome = row['Descrição'] || row['nome'] || row['Nome'];
      
      if (!codigo || !nome) {
        console.warn(`Linha ${index + 1} sem código ou nome:`, row);
      }
      
      return {
        codigo: codigo || `unknown-${index}`,
        nome: nome || `Unknown-${index}`
      };
    }).filter(item => item.codigo && item.nome && item.codigo !== `unknown-${item.nome}`);

    return mappedData;
  } catch (error) {
    console.error('Erro ao ler diretamente o arquivo localidades.csv:', error);
    return [];
  }
}

export async function loadSiglasDataDirectly(): Promise<Sigla[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'siglas.csv');
    const fileContent = await fs.readFile(filePath, 'latin1');
    
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    // @ts-expect-error - Papa.parse returns data with dynamic keys
    const mappedData = parsed.data.map((row: Record<string, string>, index: number) => {
      const sigla = row['Sigla'];
      const descricao = row['Descrição'] || row['Descricao'];
      
      if (!sigla || !descricao) {
        console.warn(`Linha ${index + 1} sem sigla ou descrição:`, row);
      }
      
      return {
        sigla: sigla || `unknown-${index}`,
        descricao: descricao || `Unknown-${index}`
      };
    }).filter(item => item.sigla && item.descricao && item.sigla !== `unknown-${item.descricao}`);

    return mappedData;
  } catch (error) {
    console.error('Erro ao ler diretamente o arquivo siglas.csv:', error);
    return [];
  }
}
