import { NextRequest, NextResponse } from 'next/server';
import { atualizarRefil, deletarRefil } from '@/lib/database';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const dados = await request.json();
    await atualizarRefil(idNum, dados);
    return NextResponse.json({ success: true, message: 'Refil atualizado com sucesso' });
  } catch (error) {
    console.error(`Erro ao atualizar Refil:`, error);
    return NextResponse.json({ success: false, message: 'Erro ao atualizar Refil' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    await deletarRefil(idNum);
    return NextResponse.json({ success: true, message: 'Refil deletado com sucesso' });
  } catch (error) {
    console.error(`Erro ao deletar Refil:`, error);
    return NextResponse.json({ success: false, message: 'Erro ao deletar Refil' }, { status: 500 });
  }
}
