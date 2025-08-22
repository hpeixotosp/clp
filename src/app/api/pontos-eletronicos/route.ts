import { NextRequest, NextResponse } from 'next/server';
import { 
  salvarPontoEletronico, 
  buscarPontosEletronicos, 
  limparTodosPontos,
  obterEstatisticas 
} from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { colaborador, periodo, previsto, realizado, saldo, saldo_minutos, assinatura, arquivo_origem } = body;

    if (!colaborador || !periodo || !previsto || !realizado || !saldo || saldo_minutos === undefined || assinatura === undefined) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const result = await salvarPontoEletronico({
      colaborador,
      periodo,
      previsto,
      realizado,
      saldo,
      saldo_minutos,
      assinatura,
      arquivo_origem
    });

    return NextResponse.json({
      success: true,
      message: 'Ponto eletrônico salvo com sucesso',
      id: result
    });

  } catch (error) {
    console.error('Erro ao salvar ponto eletrônico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const colaborador = searchParams.get('colaborador') || undefined;
    const periodo = searchParams.get('periodo') || undefined;
    const saldo_minimo = searchParams.get('saldo_minimo') ? parseInt(searchParams.get('saldo_minimo')!) : undefined;
    const saldo_maximo = searchParams.get('saldo_maximo') ? parseInt(searchParams.get('saldo_maximo')!) : undefined;
    const assinatura = searchParams.get('assinatura') ? searchParams.get('assinatura') === 'true' : undefined;

    const filtros = {
      colaborador,
      periodo,
      saldo_minimo,
      saldo_maximo,
      assinatura
    };

    const pontos = await buscarPontosEletronicos(filtros);
    const estatisticas = await obterEstatisticas();

    return NextResponse.json({
      success: true,
      data: pontos,
      estatisticas
    });

  } catch (error) {
    console.error('Erro ao buscar pontos eletrônicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await limparTodosPontos();
    
    return NextResponse.json({
      success: true,
      message: 'Todos os pontos eletrônicos foram removidos'
    });

  } catch (error) {
    console.error('Erro ao limpar pontos eletrônicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
