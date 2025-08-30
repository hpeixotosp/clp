import { NextRequest, NextResponse } from 'next/server';
import { atualizarPROAD, deletarPROAD } from '@/lib/database';

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
    await atualizarPROAD(idNum, dados);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PROAD atualizado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar PROAD:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar PROAD' },
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

    await deletarPROAD(idNum);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PROAD deletado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao deletar PROAD:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar PROAD' },
      { status: 500 }
    );
  }
}
