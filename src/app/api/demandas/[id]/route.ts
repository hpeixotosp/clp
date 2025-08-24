import { NextRequest, NextResponse } from 'next/server';
import { buscarDemandas, atualizarDemanda, deletarDemanda } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const demandas = await buscarDemandas();
    const demanda = demandas.find(d => d.id === id);
    
    if (!demanda) {
      return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(demanda);
  } catch (error) {
    console.error('Erro ao buscar demanda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const dados = await request.json();
    
    await atualizarDemanda(id, dados);
    
    return NextResponse.json({
      success: true,
      message: 'Demanda atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar demanda:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar demanda' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await deletarDemanda(id);
    
    return NextResponse.json({
      success: true,
      message: 'Demanda excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir demanda:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir demanda' },
      { status: 500 }
    );
  }
}
