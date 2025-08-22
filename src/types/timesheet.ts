export interface DailyEntry {
  date: string;
  dayOfWeek: string;
  ent1: string;
  sai1: string;
  ent2: string;
  sai2: string;
  cpre: string;
}

export interface TimeSheetData {
  colaborador: string;
  periodo: string;
  dailyEntries: DailyEntry[];
  totalPrevisto: string;
  totalRealizado: string;
  saldo: string;
  assinatura: boolean;
  saldoMinutes: number;
}

export interface TimeSheetResult {
  colaborador: string;
  periodo: string;
  previsto: string;
  realizado: string;
  saldo: string;
  assinatura: boolean;
  saldoMinutes: number;
}

export interface ProcessedFile {
  fileName: string;
  result: TimeSheetResult;
  error?: string;
}
