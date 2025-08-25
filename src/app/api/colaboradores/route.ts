import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COLABORADORES_FILE = path.join(process.cwd(), 'colaboradores_validos.txt');

// GET - Listar colaboradores
export async function GET() {
  try {
    if (!fs.existsSync(COLABORADORES_FILE)) {
      return NextResponse.json({ success: true, data: [] });
    }

    const content = fs.readFileSync(COLABORADORES_FILE, 'utf-8');
    const colaboradores = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return NextResponse.json({ success: true, data: colaboradores });
  } catch (error) {
    console.error('Erro ao ler colaboradores:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar colaboradores' },
      { status: 500 }
    );
  }
}

// POST - Salvar lista de colaboradores
export async function POST(request: NextRequest) {
  try {
    const { colaboradores } = await request.json();

    if (!Array.isArray(colaboradores)) {
      return NextResponse.json(
        { success: false, error: 'Lista de colaboradores inválida' },
        { status: 400 }
      );
    }

    // Validar nomes
    const colaboradoresValidos = colaboradores
      .map(nome => nome.trim())
      .filter(nome => {
        // Validação básica: não vazio, sem caracteres especiais problemáticos
        return nome.length > 0 && 
               !nome.includes('[') && 
               !nome.includes(']') && 
               !nome.includes('<') && 
               !nome.includes('>') && 
               !nome.includes('@') && 
               !nome.includes('^') && 
               !nome.includes('\\');
      });

    const content = colaboradoresValidos.join('\n');
    fs.writeFileSync(COLABORADORES_FILE, content, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: `${colaboradoresValidos.length} colaboradores salvos com sucesso`,
      data: colaboradoresValidos
    });
  } catch (error) {
    console.error('Erro ao salvar colaboradores:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar colaboradores' },
      { status: 500 }
    );
  }
}

// PUT - Adicionar colaborador
export async function PUT(request: NextRequest) {
  try {
    const { nome } = await request.json();

    if (!nome || typeof nome !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nome do colaborador é obrigatório' },
        { status: 400 }
      );
    }

    const nomeValidado = nome.trim();
    
    // Validação do nome
    if (nomeValidado.length === 0 || 
        nomeValidado.includes('[') || 
        nomeValidado.includes(']') || 
        nomeValidado.includes('<') || 
        nomeValidado.includes('>') || 
        nomeValidado.includes('@') || 
        nomeValidado.includes('^') || 
        nomeValidado.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Nome contém caracteres inválidos' },
        { status: 400 }
      );
    }

    // Ler colaboradores existentes
    let colaboradores: string[] = [];
    if (fs.existsSync(COLABORADORES_FILE)) {
      const content = fs.readFileSync(COLABORADORES_FILE, 'utf-8');
      colaboradores = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    // Verificar se já existe
    if (colaboradores.includes(nomeValidado)) {
      return NextResponse.json(
        { success: false, error: 'Colaborador já existe na lista' },
        { status: 400 }
      );
    }

    // Adicionar e salvar
    colaboradores.push(nomeValidado);
    colaboradores.sort();
    
    const content = colaboradores.join('\n');
    fs.writeFileSync(COLABORADORES_FILE, content, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'Colaborador adicionado com sucesso',
      data: colaboradores
    });
  } catch (error) {
    console.error('Erro ao adicionar colaborador:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar colaborador' },
      { status: 500 }
    );
  }
}

// DELETE - Remover colaborador
export async function DELETE(request: NextRequest) {
  try {
    const { nome } = await request.json();

    if (!nome || typeof nome !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nome do colaborador é obrigatório' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(COLABORADORES_FILE)) {
      return NextResponse.json(
        { success: false, error: 'Lista de colaboradores não encontrada' },
        { status: 404 }
      );
    }

    // Ler colaboradores existentes
    const content = fs.readFileSync(COLABORADORES_FILE, 'utf-8');
    let colaboradores = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Remover colaborador
    const colaboradoresAtualizados = colaboradores.filter(c => c !== nome.trim());

    if (colaboradores.length === colaboradoresAtualizados.length) {
      return NextResponse.json(
        { success: false, error: 'Colaborador não encontrado na lista' },
        { status: 404 }
      );
    }

    // Salvar lista atualizada
    const newContent = colaboradoresAtualizados.join('\n');
    fs.writeFileSync(COLABORADORES_FILE, newContent, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'Colaborador removido com sucesso',
      data: colaboradoresAtualizados
    });
  } catch (error) {
    console.error('Erro ao remover colaborador:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover colaborador' },
      { status: 500 }
    );
  }
}