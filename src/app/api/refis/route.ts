import { NextRequest, NextResponse } from 'next/server';
import { salvarRefil, buscarRefis } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();
    const id = await salvarRefil(dados);
    return NextResponse.json({ success: true, message: 'Refil salvo com sucesso', id });
  } catch (error) {
    console.error('Erro ao salvar Refil:', error);
    return NextResponse.json({ success: false, message: 'Erro ao salvar Refil' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const refis = await buscarRefis();
    return NextResponse.json(refis);
  } catch (error) {
    console.error('Erro ao buscar Refis:', error);
    return NextResponse.json({ success: false, message: 'Erro ao buscar Refis' }, { status: 500 });
  }
}
