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
    
    const command = `python3 "${wrapperPath}" ${tempFilePaths.map(p => `"${p}"`).join(' ')} "${tempDir}" "${csvFilePath}"`;

    console.log(`Executando comando: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 600000, // 10 minutos
      cwd: process.cwd(),
    });

    console.log('STDOUT:', stdout);
    if (stderr) console.error('STDERR:', stderr);

    const csvContent = await readFile(csvFilePath, 'utf-8');

    return NextResponse.json({
      success: true,
      csvContent: csvContent,
      message: 'Processamento de PDFs concluído com sucesso',
    });

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
