import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Usar diretório temporário compatível com Windows e outros sistemas
    const tempDir = process.platform === 'win32' ? 
      join(process.cwd(), 'temp') : 
      '/tmp';
    await mkdir(tempDir, { recursive: true });

    const results = [];
    const contracheques = new Map();
    const recibos = new Map();
    
    // Primeiro passo: processar cada arquivo individualmente usando o processador Python
    const tempFilePaths: string[] = [];
    
    for (const file of files) {
      const fileName = file.name;
      const tempFilePath = join(tempDir, fileName);
      
      try {
        // Salvar arquivo temporário
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(tempFilePath, buffer);
        tempFilePaths.push(tempFilePath);
        
        console.log(`Arquivo salvo: ${tempFilePath}`);
        
      } catch (error: any) {
        console.error(`Erro ao salvar ${fileName}:`, error);
        results.push({
          status: 'erro',
          erro: error.message,
          dados: null
        });
      }
    }
    
    // Executar o processador Python com todos os arquivos
    if (tempFilePaths.length > 0) {
      try {
        const pythonScript = join(process.cwd(), 'processador_contracheque.py');
        const filePaths = tempFilePaths.map(path => `"${path}"`).join(' ');
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const command = `${pythonCmd} "${pythonScript}" ${filePaths}`;
        
        console.log(`Executando processador: ${command}`);
        
        const { stdout, stderr } = await execAsync(command, { 
          timeout: 300000,
          maxBuffer: 1024 * 1024,
          cwd: process.cwd()
        });
        
        if (stderr) {
          console.warn('Stderr do processador:', stderr);
        }
        
        console.log('Output do processador:', stdout);
        
        // Processar resultado JSON do Python
        const resultadosPython = JSON.parse(stdout);
        
        for (const resultado of resultadosPython) {
          const dadosProcessados = {
            colaborador: resultado.colaborador || 'Não identificado',
            periodo: resultado.mesReferencia || 'Não identificado',
            tipoDocumento: 'Contracheque',
            vencimentos: resultado.vencimentos || '0,00',
            descontos: resultado.descontos || '0,00',
            valorLiquido: resultado.liquido || '0,00',
            statusValidacao: resultado.status === 'Confere' ? 'confere' : 'nao_confere',
            processadoEm: new Date().toISOString()
          };
          
          const chave = `${dadosProcessados.colaborador}_${dadosProcessados.periodo}`;
          contracheques.set(chave, dadosProcessados);
        }
        
      } catch (error: any) {
        console.error('Erro ao executar processador Python:', error);
        results.push({
          status: 'erro',
          erro: error.message,
          dados: null
        });
      }
    }

    // Adicionar contracheques processados aos resultados
    for (const [chave, contracheque] of contracheques) {
      results.push({
        status: 'sucesso',
        dados: contracheque
      });
    }

    return NextResponse.json({
      success: true,
      resultados: results,
      message: `Processamento concluído. ${results.filter(r => r.status === 'sucesso').length} de ${results.length} arquivo(s) processado(s) com sucesso.`
    });

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