import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const documentType = formData.get('document_type') as 'etp' | 'tr';
    const focusPoints = formData.get('focus_points') as string | null;

    if (!documentType) {
      return NextResponse.json({ error: 'Tipo de documento não especificado' }, { status: 400 });
    }

    if (!file && !text) {
      return NextResponse.json({ error: 'Arquivo ou texto não fornecido' }, { status: 400 });
    }

    console.log(`✅ Recebido pedido de análise de ${documentType}`);

    let filePath = '';
    let fileName = '';

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Criar diretório temporário no /tmp (gravável no Vercel)
      const tempDir = '/tmp';
      
      // Salvar arquivo temporário
      fileName = `tr_etp_${Date.now()}.pdf`;
      filePath = path.join(tempDir, fileName);
      await fs.writeFile(filePath, buffer);
      
      console.log(`✅ Arquivo temporário criado: ${filePath}`);
      console.log(`  Tamanho: ${buffer.length} bytes`);
      console.log(`  Nome original: ${file.name}`);
    }

    // Construir comando Python
    const scriptPath = path.join(process.cwd(), 'analisador_wrapper.py');
    let pythonCommand = `python "${scriptPath}" --type ${documentType}`;
    
    // Adicionar API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 });
    }
    pythonCommand += ` --api-key "${apiKey}"`;
    
    // Adicionar arquivo ou texto
    if (file) {
      pythonCommand += ` --file "${filePath}"`;
    } else if (text) {
      pythonCommand += ` --text "${text}"`;
    }
    
    // Adicionar pontos de foco se fornecidos
    if (focusPoints) {
      pythonCommand += ` --focus-points "${focusPoints}"`;
    }
    
    console.log('🚀 Executando comando Python:');
    console.log(`  Script: ${scriptPath}`);
    console.log(`  Tipo: ${documentType}`);
    console.log(`  Comando completo: ${pythonCommand}`);
    
    // Executar comando Python
    const executePython = () => {
      return new Promise<string>((resolve, reject) => {
        exec(pythonCommand, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
          console.log('📤 Output do Python:');
          console.log(`  Conteúdo: ${stdout}`);
          console.log(`  Tamanho: ${stdout.length}`);
          console.log(`  Linhas: ${stdout.split('\n').length}`);
          
          // Limpar arquivo temporário
          if (file && filePath) {
            try {
              console.log('🧹 Limpando arquivo temporário...');
              await fs.unlink(filePath);
              console.log(`  ✅ Arquivo removido: ${filePath}`);
            } catch (cleanupError) {
              console.error(`  ❌ Erro ao remover arquivo: ${cleanupError}`);
            }
          }
          
          if (error) {
            console.error(`❌ Erro na execução do Python: ${error.message}`);
            reject(error.message);
            return;
          }
          
          resolve(stdout);
        });
      });
    };
    
    const pythonOutput = await executePython();
    
    // Analisar o output do Python
    console.log('🔍 Tentando fazer parse do output Python...');
    
    // Verificar se há linhas de texto antes do JSON
    const lines = pythonOutput.split('\n').filter(line => line.trim() !== '');
    console.log(`📝 Analisando ${lines.length} linhas...`);
    
    let jsonString = '';
    let jsonFound = false;
    
    // Procurar por JSON no output
    for (let i = 0; i < lines.length; i++) {
      console.log(`  Linha ${i + 1}: "${lines[i]}"`);
      
      // Verificar se a linha parece ser JSON
      if (lines[i].trim().startsWith('{') && lines[i].trim().endsWith('}')) {
        jsonString = lines[i];
        jsonFound = true;
        console.log(`✅ JSON encontrado na linha ${i + 1}: ${jsonString}`);
        break;
      }
    }
    
    if (!jsonFound) {
      return NextResponse.json({ error: 'Não foi possível extrair JSON da resposta', results: [] }, { status: 500 });
    }
    
    try {
      // Limpar caracteres não ASCII do JSON antes de fazer parse
      const cleanJsonString = jsonString.replace(/[^\x00-\x7F]+/g, '');
      
      // Parse do JSON
      const result = JSON.parse(cleanJsonString);
      console.log(`✅ JSON parseado com sucesso: ${JSON.stringify(result, null, 2)}`);
      
      // Verificar se há erro na resposta
      if (result.error) {
        console.error(`❌ Erro retornado pelo Python: ${result.error}`);
        return NextResponse.json({ error: result.error, results: [] }, { status: 500 });
      }
      
      // Processar resultados
      console.log(`✅ Resultados processados: ${JSON.stringify(result, null, 2)}`);
      
      return NextResponse.json(result);
    } catch (jsonError) {
      console.error(`❌ Erro ao fazer parse do JSON: ${jsonError}`);
      return NextResponse.json({ error: `Erro ao processar resposta: ${jsonError}`, results: [] }, { status: 500 });
    }
  } catch (error) {
    console.error(`❌ Erro geral: ${error}`);
    return NextResponse.json({ error: `Erro interno: ${error}`, results: [] }, { status: 500 });
  }
}