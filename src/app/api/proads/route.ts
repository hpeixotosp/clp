import { NextRequest, NextResponse } from 'next/server';
import { salvarPROAD, buscarPROADs } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();
    const id = await salvarPROAD(dados);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PROAD salvo com sucesso',
      id 
    });
  } catch (error) {
    console.error('Erro ao salvar PROAD:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar PROAD' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtros = {
      searchTerm: searchParams.get('searchTerm') || '',
      setor: searchParams.get('setor') || 'all',
      prioridade: searchParams.get('prioridade') || 'all',
      situacao: searchParams.get('situacao') || 'all'
    };

    const proads = await buscarPROADs(filtros);
    
    return NextResponse.json(proads);
  } catch (error) {
    console.error('Erro ao buscar PROADs:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar PROADs' },
      { status: 500 }
    );
  }
}
