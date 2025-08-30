import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Redirecionar para o backend Python na DigitalOcean
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://143.110.196.243:8000';
    
    try {
      const backendFormData = new FormData();
      files.forEach((file) => {
        backendFormData.append('files', file);
      });

      const response = await fetch(`${backendUrl}/api/process-contracheques`, {
        method: 'POST',
        body: backendFormData,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return NextResponse.json(result);

    } catch (backendError: any) {
      console.error('Erro ao comunicar com backend:', backendError);
      return NextResponse.json({
        error: 'Erro na comunicação com o backend',
        details: backendError.message,
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('Erro no processamento de contracheques:', error);
    return NextResponse.json({
      error: 'Falha no processamento do lado do servidor.',
      details: error.message,
    }, { status: 500 });
  }
}

// Função para processar o texto extraído e estruturar os dados
async function processarTextoContracheque(texto: string, nomeArquivo: string) {
  try {
    // Determinar tipo de arquivo baseado no padrão de nome
    const isRecibo = nomeArquivo.includes('-Pagamento');
    const tipoDocumento = isRecibo ? 'Recibo' : 'Contracheque';

    // Extrair nome do colaborador do nome do arquivo
    const nomeArquivoMatch = nomeArquivo.match(/\d{4}_\d{2}-TRT RN-ContrachequeSalario-([^-]+)/);
    const colaborador = nomeArquivoMatch ? nomeArquivoMatch[1].replace(/\.pdf$/i, '') : 'Nome não encontrado';

    // Extrair período do nome do arquivo
    const periodoArquivoMatch = nomeArquivo.match(/(\d{4})_(\d{2})/);
    let periodo = 'Período não encontrado';
    if (periodoArquivoMatch) {
      const ano = periodoArquivoMatch[1];
      const mes = periodoArquivoMatch[2];
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      periodo = `${meses[parseInt(mes) - 1]} ${ano}`;
    }

    // Extrair valores monetários corretos
    let vencimentos = '0,00';
    let descontos = '0,00';
    let valorLiquido = '0,00';

    // Estratégia 1: Procurar por valores grandes consecutivos (padrão dos contracheques)
    const valoresGrandes = texto.match(/\d{1,3}(?:\.\d{3})+,\s*\d{2}/g);
    if (valoresGrandes && valoresGrandes.length >= 2) {
      // Procurar especificamente pela sequência de totais
      const sequenciaTotais = texto.match(/(\d{1,3}(?:\.\d{3})+,\s*\d{2})\s+(\d{1,3}(?:\.\d{3})+,\s*\d{2})/g);
      
      if (sequenciaTotais && sequenciaTotais.length > 0) {
        // Pegar a primeira sequência de dois valores grandes
        const match = sequenciaTotais[0].match(/(\d{1,3}(?:\.\d{3})+,\s*\d{2})\s+(\d{1,3}(?:\.\d{3})+,\s*\d{2})/);
        if (match) {
          vencimentos = match[1].replace(/\s/g, '');
          descontos = match[2].replace(/\s/g, '');
          
          // Calcular valor líquido
          const vencNum = parseFloat(vencimentos.replace(/\./g, '').replace(',', '.'));
          const descNum = parseFloat(descontos.replace(/\./g, '').replace(',', '.'));
          const liquido = vencNum - descNum;
          valorLiquido = liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
    }
    
    // Estratégia 2: Se não encontrou valores grandes, procurar por padrões específicos
    if (vencimentos === '0,00') {
      const totalVencimentosMatch = texto.match(/TOTAL\s+DE\s+VENCIMENTOS[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (totalVencimentosMatch) {
        vencimentos = totalVencimentosMatch[1];
      }

      const totalDescontosMatch = texto.match(/TOTAL\s+DE\s+DESCONTOS[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (totalDescontosMatch) {
        descontos = totalDescontosMatch[1];
      }

      const valorLiquidoMatch = texto.match(/VALOR\s+L[ÍI]QUIDO[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (valorLiquidoMatch) {
        valorLiquido = valorLiquidoMatch[1];
      }
    }

    console.log(`Valores extraídos para ${nomeArquivo}: Vencimentos=${vencimentos}, Descontos=${descontos}, Líquido=${valorLiquido}`);

    return {
      colaborador,
      periodo,
      tipoDocumento,
      vencimentos,
      descontos,
      valorLiquido,
      processadoEm: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro ao processar texto do contracheque:', error);
    return {
      colaborador: 'Erro na extração',
      periodo: 'Erro na extração',
      tipoDocumento: 'Erro na extração',
      vencimentos: '0,00',
      descontos: '0,00',
      valorLiquido: '0,00',
      erro: 'Falha no processamento do texto',
      processadoEm: new Date().toISOString()
    };
  }
}