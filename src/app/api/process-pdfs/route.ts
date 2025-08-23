import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIANDO PROCESSAMENTO DE PDFs ===');
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log(`Arquivos recebidos: ${files.length}`);
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Criar diretório temporário para os PDFs
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const tempDir = isVercel ? '/tmp' : join(process.cwd(), 'temp_pdfs');
    console.log(`Criando diretório temporário: ${tempDir}`);
    if (!isVercel) {
      await mkdir(tempDir, { recursive: true });
    }

    // Salvar PDFs temporariamente
    const savedPaths: string[] = [];
    for (const file of files) {
      if (file.type === 'application/pdf') {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(tempDir, file.name);
        await writeFile(filePath, buffer);
        savedPaths.push(filePath);
        console.log(`PDF salvo: ${filePath}`);
      }
    }

    if (savedPaths.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum PDF válido encontrado' },
        { status: 400 }
      );
    }

    // Executar script Python
    const pythonScript = isVercel 
      ? join(process.cwd(), 'backend_pdf_processor.py')
      : join(process.cwd(), '..', 'backend_pdf_processor.py');
    
    console.log(`Script Python: ${pythonScript}`);
    console.log(`PDFs para processar: ${savedPaths.join(', ')}`);
    console.log(`Diretório de trabalho: ${process.cwd()}`);

    // Verificar se o script Python existe
    if (!existsSync(pythonScript)) {
      console.error(`Script Python não encontrado: ${pythonScript}`);
      return NextResponse.json(
        { error: 'Script Python não encontrado' },
        { status: 500 }
      );
    }

    try {
      const pythonCommand = isVercel ? 'python' : 'python3';
      
      // Construir comando com aspas corretas para cada arquivo
      const quotedPaths = savedPaths.map(path => `"${path}"`).join(' ');
      const command = `${pythonCommand} "${pythonScript}" --pdfs ${quotedPaths}`;
      
      console.log('Comando executado:', command);
      
      const workingDir = isVercel ? process.cwd() : join(process.cwd(), '..');
      const { stdout, stderr } = await execAsync(
        command,
        { cwd: workingDir }
      );

      if (stderr) {
        console.error('Erro Python (stderr):', stderr);
      }

      console.log('Saída Python (stdout):', stdout);

      // Ler resultados do CSV gerado
      const csvPath = isVercel 
        ? join(process.cwd(), 'resultados_ponto.csv')
        : join(process.cwd(), '..', 'resultados_ponto.csv');
      
      if (existsSync(csvPath)) {
        console.log(`CSV encontrado: ${csvPath}`);
        const csvContent = readFileSync(csvPath, 'utf-8');
        
        // Parse CSV para JSON
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');
        const results = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row: Record<string, string> = {};
            headers.forEach((header: string, index: number) => {
              row[header.trim()] = values[index]?.trim() || '';
            });
            results.push(row);
          }
        }

        console.log(`Resultados parseados: ${results.length} linhas`);

        // Limpar arquivos temporários
        for (const path of savedPaths) {
          try {
            await unlink(path);
            console.log(`Arquivo temporário removido: ${path}`);
          } catch (e) {
            console.error(`Erro ao deletar ${path}:`, e);
          }
        }

        return NextResponse.json({
          success: true,
          results: results,
          message: `${files.length} PDF(s) processado(s) com sucesso`
        });

      } else {
        console.error(`CSV não encontrado: ${csvPath}`);
        return NextResponse.json(
          { error: 'Falha ao gerar CSV de resultados' },
          { status: 500 }
        );
      }

    } catch (execError) {
      console.error('Erro na execução do Python:', execError);
      return NextResponse.json(
        { error: `Erro na execução do Python: ${execError}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro geral no processamento:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
