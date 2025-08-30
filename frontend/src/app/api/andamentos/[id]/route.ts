import { NextRequest, NextResponse } from 'next/server';
import { atualizarAndamento, atualizarAndamentoDemanda, deletarAndamento, deletarAndamentoDemanda, getDatabase } from '@/lib/database';

interface Params {
  params: Promise<{ id: string; }>
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { descricao, data } = body;
    
    const andamentoId = parseInt(id);
    if (isNaN(andamentoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar se o andamento pertence a uma demanda ou PROAD
    const db = await getDatabase();
    const demandaAndamento = await db.get('SELECT id FROM demandaandamentos WHERE id = ?', [andamentoId]);
    
    if (demandaAndamento) {
      // É um andamento de demanda
      await atualizarAndamentoDemanda(andamentoId, { descricao, data });
    } else {
      // É um andamento de PROAD
      await atualizarAndamento(andamentoId, { descricao, data });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar andamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const andamentoId = parseInt(id);
    
    if (isNaN(andamentoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar se o andamento pertence a uma demanda ou PROAD
    const db = await getDatabase();
    const demandaAndamento = await db.get('SELECT id FROM demandaandamentos WHERE id = ?', [andamentoId]);
    
    if (demandaAndamento) {
      // É um andamento de demanda
      await deletarAndamentoDemanda(andamentoId);
    } else {
      // É um andamento de PROAD
      await deletarAndamento(andamentoId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar andamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
