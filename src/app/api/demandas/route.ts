import { NextRequest, NextResponse } from 'next/server';
import { salvarDemanda, buscarDemandas } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();
    const id = await salvarDemanda(dados);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Demanda salva com sucesso',
      id 
    });
  } catch (error) {
    console.error('Erro ao salvar Demanda:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar Demanda' },
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

    const demandas = await buscarDemandas(filtros);
    
    return NextResponse.json(demandas);
  } catch (error) {
    console.error('Erro ao buscar Demandas:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar Demandas' },
      { status: 500 }
    );
  }
}
