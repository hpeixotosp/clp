import { NextRequest, NextResponse } from 'next/server';
import { atualizarDemanda, deletarDemanda } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    const dados = await request.json();
    await atualizarDemanda(idNum, dados);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Demanda atualizada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar Demanda:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar Demanda' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    await deletarDemanda(idNum);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Demanda deletada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao deletar Demanda:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar Demanda' },
      { status: 500 }
    );
  }
}
