import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length < 2) {
      return NextResponse.json(
        { error: 'É necessário pelo menos 2 arquivos: contracheque e recibo' },
        { status: 400 }
      );
    }

    // Garantir que o diretório temp existe
    const tempDir = join(process.cwd(), 'temp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (error) {
      console.log('Diretório temp já existe ou erro ao criar:', error);
    }

    // Salvar arquivos temporariamente com nomes mais simples
    const tempFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Nome de arquivo muito simples para evitar problemas
      const tempPath = join(tempDir, `file_${i}.pdf`);
      
      try {
        await writeFile(tempPath, buffer);
        tempFiles.push(tempPath);
        console.log(`✅ Arquivo temporário criado: ${tempPath}`);
        console.log(`   Tamanho: ${buffer.length} bytes`);
        console.log(`   Nome original: ${file.name}`);
      } catch (error) {
        console.error(`❌ Erro ao criar arquivo temporário ${tempPath}:`, error);
        throw new Error(`Falha ao criar arquivo temporário: ${error}`);
      }
    }

    try {
      // Executar script Python para processar contracheques
      const pythonScript = join(process.cwd(), '..', 'processador_contracheque.py');
      
      // Verificar se o script Python existe
      if (!existsSync(pythonScript)) {
        throw new Error(`Script Python não encontrado: ${pythonScript}`);
      }
      
      // Construir comando com aspas para cada arquivo
      const filePaths = tempFiles.map(path => `"${path}"`).join(' ');
      const command = `python "${pythonScript}" ${filePaths}`;
      
      console.log('🚀 Executando comando Python:');
      console.log('   Script:', pythonScript);
      console.log('   Arquivos:', tempFiles);
      console.log('   Comando completo:', command);
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000, // 30 segundos de timeout
        maxBuffer: 1024 * 1024 // 1MB de buffer
      });
      
      if (stderr) {
        console.error('⚠️ Stderr do Python:', stderr);
      }

      console.log('📤 Output do Python:');
      console.log('   Conteúdo:', stdout);
      console.log('   Tamanho:', stdout.length);
      console.log('   Linhas:', stdout.split('\n').length);

      // Processar resultado
      const results = parsePythonOutput(stdout);
      
      console.log('✅ Resultados processados:', results);
      
      return NextResponse.json({ 
        success: true, 
        results,
        message: 'Contracheques processados com sucesso'
      });

    } finally {
      // Limpar arquivos temporários
      console.log('🧹 Limpando arquivos temporários...');
      for (const tempFile of tempFiles) {
        try {
          await unlink(tempFile);
          console.log(`   ✅ Arquivo removido: ${tempFile}`);
        } catch (error) {
          console.error(`   ❌ Erro ao remover arquivo ${tempFile}:`, error);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar contracheques:', error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}

function parsePythonOutput(output: string): Array<{
  colaborador: string;
  mesReferencia: string;
  status: string;
  detalhes: string;
}> {
  try {
    console.log('🔍 Tentando fazer parse do output Python...');
    
    if (!output || output.trim().length === 0) {
      console.log('❌ Output vazio ou nulo');
      return [{
        colaborador: 'Erro',
        mesReferencia: 'N/A',
        status: 'Erro',
        detalhes: 'Output do Python vazio'
      }];
    }
    
    // Tentar fazer parse do JSON - procurar por qualquer linha que contenha JSON válido
    const lines = output.trim().split('\n');
    let jsonLine = '';
    
    console.log(`📝 Analisando ${lines.length} linhas...`);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      console.log(`   Linha ${i + 1}: "${trimmedLine}"`);
      
      if (trimmedLine.startsWith('[') || trimmedLine.startsWith('{')) {
        jsonLine = trimmedLine;
        console.log(`✅ JSON encontrado na linha ${i + 1}:`, jsonLine);
        break;
      }
    }
    
    if (jsonLine) {
      try {
        const parsed = JSON.parse(jsonLine);
        console.log('✅ JSON parseado com sucesso:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        console.error('   JSON problemático:', jsonLine);
        throw parseError;
      }
    }
    
    console.log('❌ Nenhum JSON válido encontrado, usando fallback');
    // Fallback: retornar resultado básico
    return [{
      colaborador: 'Erro',
      mesReferencia: 'N/A',
      status: 'Erro',
      detalhes: 'Nenhum JSON válido encontrado no output do Python'
    }];
    
  } catch (error) {
    console.error('❌ Erro na função parsePythonOutput:', error);
    return [{
      colaborador: 'Erro',
      mesReferencia: 'N/A',
      status: 'Erro',
      detalhes: `Falha na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }];
  }
}
