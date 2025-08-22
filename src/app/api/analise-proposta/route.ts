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

        const pythonScript = path.resolve(process.cwd(), '..', 'analisador_proposta.py');
        let command: string;

        if (mode === 'identify_items') {
            command = `python "${pythonScript}" --mode identify_items --tr "${trPath}"`;
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
            command = `python "${pythonScript}" --mode analyze_item --tr "${trPath}" --item_name "${itemName}" ${proposalArgs}`;
        } else {
            return NextResponse.json({ error: 'Modo de operação inválido' }, { status: 400 });
        }
        
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          console.error('Erro do Python:', stderr);
          return NextResponse.json({ error: `Erro no script Python: ${stderr}` }, { status: 500 });
        }
        
        const result = JSON.parse(stdout);
        return NextResponse.json(result);

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
