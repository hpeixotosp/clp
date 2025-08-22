import { NextResponse } from 'next/server';
import { loadSiglasDataDirectly } from '@/lib/csv-loader';

export async function GET() {
  try {
    const siglas = await loadSiglasDataDirectly();
    return NextResponse.json(siglas);
  } catch (error) {
    console.error('Erro ao buscar Siglas:', error);
    return NextResponse.json({ success: false, message: 'Erro ao buscar Siglas' }, { status: 500 });
  }
}
