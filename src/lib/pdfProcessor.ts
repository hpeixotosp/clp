import * as pdfjs from 'pdfjs-dist';
import { TimeSheetResult } from '@/types/timesheet';

// --- SOLUÇÃO DEFINITIVA PARA O WORKER USANDO ARQUIVO LOCAL ---
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
  console.log(`PDF.js worker configurado para usar arquivo local: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
}
// -----------------------------------------------------------

/**
 * Converte uma string de tempo HH:MM:SS ou HH:MM para minutos totais.
 */
function timeStrToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  try {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) { // HH:MM
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) { // HH:MM:SS
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Converte um total de minutos para uma string de tempo formatada +/-HH:MM.
 */
function minutesToTimeStr(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '+';
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = Math.round(absMinutes % 60);
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Converte um total de minutos para uma string de tempo formatada HH:MM.
 */
function formatMinutesToHHMM(totalMinutes: number): string {
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = Math.round(absMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export class PDFProcessor {
  /**
   * Extrai texto de um arquivo PDF.
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await pdfjs.getDocument(uint8Array).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => 'str' in item ? item.str : '').join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  }

  /**
   * Processa um arquivo PDF com LÓGICA ULTRA SIMPLES conforme explicado pelo usuário.
   */
  static async processPDF(file: File): Promise<TimeSheetResult> {
    try {
      console.log(`=== INICIANDO PROCESSAMENTO ULTRA SIMPLES: ${file.name} ===`);
      const fullText = await this.extractTextFromPDF(file);
      const fullTextForRegex = fullText.replace(/\s+/g, ' ');

      // 1. Extração de Dados Essenciais
      let nome_colaborador = "Não encontrado";
      let periodo = "Não encontrado";
      let assinado = false;

      // Regex para nome e período
      const nomeMatch = fullTextForRegex.match(/([A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+)\s*-\s*Período:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*à\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      if (nomeMatch && nomeMatch[1]) {
        nome_colaborador = nomeMatch[1].trim();
        const dataInicioStr = nomeMatch[2];
        if (dataInicioStr) {
            const dateParts = dataInicioStr.split('/');
            const mes = dateParts[1].padStart(2, '0');
            const ano = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
            periodo = `${mes}/${ano}`;
        }
      }
      
      console.log(`Nome: ${nome_colaborador}`);
      console.log(`Período: ${periodo}`);

      // Verificação de Assinatura Digital
      const assinaturaPatterns = [
        /assinado\s*(de forma)?\s*digitalmente/i,
        /pré-assinalado/i,
        /pre-assinalado/i,
        /assinatura\s*digital/i,
        /documento\s*assinado/i
      ];
      assinado = assinaturaPatterns.some(pattern => pattern.test(fullTextForRegex));

      // 2. LÓGICA ULTRA SIMPLES: Procurar linhas de ponto
      let carga_horaria_realizada_minutes = 0;
      let carga_horaria_prevista_minutes = 0;
      let dias_processados = 0;
      
      console.log(`\n=== PROCESSAMENTO LINHA POR LINHA ===`);

      // Regex para capturar linhas de ponto: DATA - DIA CAMPO1 CAMPO2 CAMPO3 CAMPO4 C.PRE
      // ESTRUTURA REAL: 01/05/2025 - Qui Feriado - Feriado Feriado - Feriado 08:00:00
      const linhaPontoRegex = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\w{3})\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/g;
      let match;
      
      while ((match = linhaPontoRegex.exec(fullText)) !== null) {
        const [, data, diaSemana, campo1, campo2, campo3, campo4, cpre] = match;
        
        console.log(`\n--- LINHA ENCONTRADA ---`);
        console.log(`Data: ${data}, Dia: ${diaSemana}`);
        console.log(`Campos: ${campo1} | ${campo2} | ${campo3} | ${campo4}`);
        console.log(`C.PRE: ${cpre}`);
        
        // DEBUG: Mostrar todos os grupos capturados
        console.log(`DEBUG - Todos os grupos:`, match);
        
        // Verificar se C.PRE tem horário válido (06:00:00 ou 08:00:00)
        const cpreMatch = cpre.match(/(0[68]:00:00)/);
        if (!cpreMatch) {
          console.log(`❌ ${data}: C.PRE inválido ou vazio - ignorado`);
          continue;
        }
        
        const cpreMinutos = timeStrToMinutes(cpre);
        console.log(`✅ ${data}: C.PRE válido = ${cpre} (${cpreMinutos} min)`);
        
        // Somar ao total previsto
        carga_horaria_prevista_minutes += cpreMinutos;
        
        let jornada_total_dia = 0;
        let tipoDia = 'Normal';
        
        // Verificar se algum campo é texto (Feriado, Compensação, Atestado, etc.)
        const isTexto = /[a-zA-Z]/.test(campo1) || /[a-zA-Z]/.test(campo2) || /[a-zA-Z]/.test(campo3) || /[a-zA-Z]/.test(campo4);
        
        if (isTexto) {
          // REGRA 1: Se algum campo é texto, usar C.PRE completo
          jornada_total_dia = cpreMinutos;
          tipoDia = 'Especial';
          console.log(`🏖️ ${data}: ESPECIAL (${campo1} ${campo2} ${campo3} ${campo4}) - usando C.PRE completo = ${formatMinutesToHHMM(jornada_total_dia)}`);
          
        } else {
          // REGRA 2: Se todos os campos são horários, calcular (Sai2-Ent2)+(Sai1-Ent1)
          const ent1 = timeStrToMinutes(campo1);
          const sai1 = timeStrToMinutes(campo2);
          const ent2 = timeStrToMinutes(campo3);
          const sai2 = timeStrToMinutes(campo4);
          
          if (ent1 > 0 && sai1 > 0 && ent2 > 0 && sai2 > 0) {
            // Cálculo: (Sai2-Ent2) + (Sai1-Ent1)
            const manha = sai1 - ent1;
            const tarde = sai2 - ent2;
            jornada_total_dia = manha + tarde;
            
            console.log(`💼 ${data}: NORMAL - ${campo1}-${campo2} ${campo3}-${campo4} = ${formatMinutesToHHMM(jornada_total_dia)}`);
          } else {
            console.log(`❌ ${data}: Horários inválidos - ignorado`);
            continue;
          }
        }
        
        // Acumular realizado
        carga_horaria_realizada_minutes += jornada_total_dia;
        dias_processados++;
        
        console.log(`📊 ${data}: ${tipoDia} | Dia=${formatMinutesToHHMM(jornada_total_dia)} | Acumulado=${formatMinutesToHHMM(carga_horaria_realizada_minutes)}`);
      }

      // 3. Cálculo Final
      const saldoMinutes = carga_horaria_realizada_minutes - carga_horaria_prevista_minutes;
      
      console.log(`\n=== RESUMO FINAL ===`);
      console.log(`Dias processados: ${dias_processados}`);
      console.log(`Total PREVISTO: ${formatMinutesToHHMM(carga_horaria_prevista_minutes)} (${carga_horaria_prevista_minutes} min)`);
      console.log(`Total REALIZADO: ${formatMinutesToHHMM(carga_horaria_realizada_minutes)} (${carga_horaria_realizada_minutes} min)`);
      console.log(`SALDO: ${minutesToTimeStr(saldoMinutes)} (${saldoMinutes} min)`);

      const result: TimeSheetResult = {
        colaborador: nome_colaborador,
        periodo: periodo,
        previsto: formatMinutesToHHMM(carga_horaria_prevista_minutes),
        realizado: formatMinutesToHHMM(carga_horaria_realizada_minutes),
        saldo: minutesToTimeStr(saldoMinutes),
        assinatura: assinado,
        saldoMinutes: saldoMinutes
      };

      console.log(`✅ RESULTADO FINAL:`, result);
      return result;

    } catch (error) {
      console.error(`❌ ERRO NO PROCESSAMENTO: ${file.name}`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao processar o PDF ${file.name}: ${errorMessage}`);
    }
  }
}