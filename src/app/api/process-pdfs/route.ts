import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, readFile } from 'fs/promises';
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

    // Usar /tmp que é um diretório padrão para arquivos temporários em ambientes de contêiner
    const tempDir = '/tmp';
    await mkdir(tempDir, { recursive: true });

    const tempFilePaths: string[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempFilePath = join(tempDir, `pdf_${Date.now()}_${file.name}`);
      await writeFile(tempFilePath, buffer);
      tempFilePaths.push(tempFilePath);
    }

    console.log(`Arquivos salvos em: ${tempFilePaths.join(', ')}`);

    const csvFileName = `resultados_ponto_${Date.now()}.csv`;
    const csvFilePath = join(tempDir, csvFileName);
    const wrapperPath = join(process.cwd(), 'backend_pdf_processor_wrapper.py');
    
    // Construir comando com argumentos corretos: wrapper.py pdf1.pdf pdf2.pdf /tmp nome.csv
    const command = `python3 "${wrapperPath}" ${tempFilePaths.map(p => `"${p}"`).join(' ')} "${tempDir}" "${csvFileName}"`;

    console.log(`Executando comando: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 600000, // 10 minutos
      cwd: process.cwd(),
    });

    // Logs de debug não são erros - apenas informativos
    if (stderr) {
      console.log('Logs de debug do Python:', stderr);
    }

    // Verificar se stdout contém JSON válido
    if (!stdout || stdout.trim() === '') {
      return NextResponse.json({ error: 'Script Python não retornou dados' }, { status: 500 });
    }

    try {
      const result = JSON.parse(stdout);
      
      // Se o script retornou sucesso, retornar o resultado
      if (result.success && result.csvContent) {
        return NextResponse.json({
          success: true,
          csvContent: result.csvContent,
          message: 'Processamento de PDFs concluído com sucesso',
        });
      } else if (result.error) {
        // Se o script retornou erro
        return NextResponse.json({
          error: result.error,
          details: 'Erro retornado pelo script Python',
        }, { status: 500 });
      } else {
        // Resposta inesperada
        return NextResponse.json({
          error: 'Resposta inesperada do script Python',
          details: result,
        }, { status: 500 });
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('Saída do Python:', stdout);
      return NextResponse.json({ 
        error: 'Resposta inválida do script Python',
        details: stdout.substring(0, 500) // Primeiros 500 caracteres para debug
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro no processamento de PDFs:', error);
    return NextResponse.json({
      error: 'Falha no processamento do lado do servidor.',
      details: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }, { status: 500 });
  }
}
