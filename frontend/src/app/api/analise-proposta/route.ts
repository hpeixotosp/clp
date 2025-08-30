import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const mode = formData.get('mode') as string;
    const trFile = formData.get('trFile') as File;

    if (!trFile) {
        return NextResponse.json({ error: 'Nenhum arquivo de TR enviado' }, { status: 400 });
    }

    const trPath = path.join(os.tmpdir(), `tr_${Date.now()}_${trFile.name}`);
    const cleanupCallbacks: (() => Promise<void>)[] = [() => fs.unlink(trPath)];

    try {
        const trBuffer = Buffer.from(await trFile.arrayBuffer());
        await fs.writeFile(trPath, trBuffer);

        const pythonWrapper = path.resolve(process.cwd(), 'analisador_proposta_wrapper.py');
        console.log('Wrapper path:', pythonWrapper);
        console.log('Wrapper exists:', await fs.access(pythonWrapper).then(() => true).catch(() => false));
        let command: string;

        // Usar 'python3' sempre
        const pythonCommand = 'python3';
        
        if (mode === 'identify_items') {
            command = `${pythonCommand} "${pythonWrapper}" --mode identify_items --tr "${trPath}"`;
        } else if (mode === 'analyze_item') {
            const proposalFiles = formData.getAll('proposalFiles') as File[];
            const itemName = formData.get('itemName') as string;

            if (!proposalFiles || proposalFiles.length === 0) {
                return NextResponse.json({ error: 'Nenhum arquivo de proposta enviado' }, { status: 400 });
            }
            if (!itemName) {
                return NextResponse.json({ error: 'Nome do item não especificado' }, { status: 400 });
            }

            const proposalPaths: string[] = [];
            for (const proposalFile of proposalFiles) {
                const proposalPath = path.join(os.tmpdir(), `proposal_${Date.now()}_${proposalFile.name}`);
                const proposalBuffer = Buffer.from(await proposalFile.arrayBuffer());
                await fs.writeFile(proposalPath, proposalBuffer);
                proposalPaths.push(proposalPath);
                cleanupCallbacks.push(() => fs.unlink(proposalPath));
            }
            
            const proposalArgs = proposalPaths.map(p => `"--proposal" "${p}"`).join(' ');
            command = `${pythonCommand} "${pythonWrapper}" --mode analyze_item --tr "${trPath}" --item_name "${itemName}" ${proposalArgs}`;
        } else {
            return NextResponse.json({ error: 'Modo de operação inválido' }, { status: 400 });
        }
        
        console.log('Executando comando:', command);
        
        const { stdout, stderr } = await execAsync(command);

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
            return NextResponse.json(result);
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError);
            console.error('Saída do Python:', stdout);
            return NextResponse.json({ 
                error: 'Resposta inválida do script Python',
                details: stdout.substring(0, 500) // Primeiros 500 caracteres para debug
            }, { status: 500 });
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
        console.error('Erro na API de análise de proposta:', error);
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
    } finally {
        // Executa a limpeza de todos os arquivos temporários criados.
        for (const callback of cleanupCallbacks) {
            try {
                await callback();
            } catch (cleanupError) {
                console.error("Erro durante a limpeza do arquivo temporário:", cleanupError);
            }
        }
    }
}
