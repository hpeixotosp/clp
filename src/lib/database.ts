import { open, Database } from 'sqlite';
import path from 'path';
import { 
  PontoEletronico, 
  FiltrosPonto, 
  EstatisticasPontos, 
  PROAD, 
  FiltrosPROAD,
  Demanda,
  FiltrosDemanda,
  Purificador,
  Refil,
  TR,
  AnaliseProposta,
  Email
} from './types';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }
  
  const dbPath = path.join(process.cwd(), 'trt21.db');
  
  try {
    const sqlite3 = await import('sqlite3');
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    // Criar tabelas se não existirem
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pontos_eletronicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        colaborador TEXT NOT NULL,
        periodo TEXT NOT NULL,
        previsto TEXT NOT NULL,
        realizado TEXT NOT NULL,
        saldo TEXT NOT NULL,
        assinatura TEXT NOT NULL,
        data_processamento DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS proads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL,
        ano TEXT NOT NULL,
        setor TEXT NOT NULL,
        prioridade TEXT NOT NULL,
        situacao TEXT NOT NULL,
        dataCadastro DATETIME NOT NULL,
        andamento TEXT,
        responsavel TEXT,
        assunto TEXT,
        responsavel_custom TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS proad_andamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proad_id INTEGER NOT NULL,
        data DATETIME NOT NULL,
        descricao TEXT NOT NULL,
        usuario TEXT,
        FOREIGN KEY (proad_id) REFERENCES proads(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS refis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marca TEXT NOT NULL,
        quantidadeDisponivel INTEGER NOT NULL,
        fotoUrl TEXT,
        descricao TEXT,
        dataCadastro DATETIME NOT NULL,
        ultimaAtualizacao DATETIME NOT NULL
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS demandas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        setor TEXT NOT NULL,
        prioridade TEXT NOT NULL,
        situacao TEXT NOT NULL,
        dataCadastro DATETIME NOT NULL,
        prazo DATETIME,
        responsavel TEXT,
        responsavel_custom TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índices para melhor performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_proads_numero_ano ON proads(numero, ano);
      CREATE INDEX IF NOT EXISTS idx_proads_setor ON proads(setor);
      CREATE INDEX IF NOT EXISTS idx_proads_prioridade ON proads(prioridade);
      CREATE INDEX IF NOT EXISTS idx_proads_situacao ON proads(situacao);
      CREATE INDEX IF NOT EXISTS idx_andamentos_proad_id ON proad_andamentos(proad_id);
      CREATE INDEX IF NOT EXISTS idx_demandas_setor ON demandas(setor);
      CREATE INDEX IF NOT EXISTS idx_demandas_prioridade ON demandas(prioridade);
      CREATE INDEX IF NOT EXISTS idx_demandas_situacao ON demandas(situacao);
    `);
    
    console.log('✅ Banco SQLite conectado com sucesso');
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco SQLite:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    if (db) {
      await db.close();
      db = null;
      console.log('✅ Banco SQLite fechado com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro ao fechar banco SQLite:', error);
    throw error;
  }
}

// Funções para Pontos Eletrônicos (mantidas)
export async function salvarPontoEletronico(dados: PontoEletronico): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO pontos_eletronicos (colaborador, periodo, previsto, realizado, saldo, saldo_minutos, assinatura, arquivo_origem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [dados.colaborador, dados.periodo, dados.previsto, dados.realizado, dados.saldo, dados.saldo_minutos, dados.assinatura, dados.arquivo_origem]);
    console.log('✅ Ponto eletrônico salvo com sucesso');
    return result.lastID!;
  } catch (error) {
    console.error('❌ Erro ao salvar ponto eletrônico:', error);
    throw error;
  }
}

export async function buscarPontosEletronicos(filtros: FiltrosPonto = {}): Promise<PontoEletronico[]> {
  try {
    const db = await getDatabase();
    let query = 'SELECT * FROM pontos_eletronicos WHERE 1=1';
    const params: (string | number)[] = [];

    if (filtros.colaborador) {
      query += ' AND colaborador LIKE ?';
      params.push(`%${filtros.colaborador}%`);
    }

    if (filtros.periodo) {
      query += ' AND periodo LIKE ?';
      params.push(`%${filtros.periodo}%`);
    }

    if (filtros.saldo_minimo) {
      query += ' AND CAST(REPLACE(REPLACE(saldo, ":", ""), "-", "") AS INTEGER) >= ?';
      params.push(filtros.saldo_minimo);
    }

    if (filtros.saldo_maximo) {
      query += ' AND CAST(REPLACE(REPLACE(saldo, ":", ""), "-", "") AS INTEGER) <= ?';
      params.push(filtros.saldo_maximo);
    }

    if (filtros.assinatura !== undefined) {
      query += ' AND assinatura = ?';
      params.push(typeof filtros.assinatura === 'boolean' ? (filtros.assinatura ? 'OK' : 'Pendente') : filtros.assinatura);
    }

    query += ' ORDER BY data_processamento DESC';

    const pontos = await db.all(query, params);
    console.log(`✅ ${pontos.length} pontos eletrônicos encontrados`);
    return pontos;
  } catch (error) {
    console.error('❌ Erro ao buscar pontos eletrônicos:', error);
    throw error;
  }
}

export async function limparTodosPontos(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM pontos_eletronicos');
    console.log('✅ Todos os pontos eletrônicos foram removidos');
  } catch (error) {
    console.error('❌ Erro ao limpar pontos eletrônicos:', error);
    throw error;
  }
}

export async function obterEstatisticas(): Promise<EstatisticasPontos> {
  try {
    const db = await getDatabase();
    const total = await db.get('SELECT COUNT(*) as total FROM pontos_eletronicos');
    const comAssinatura = await db.get('SELECT COUNT(*) as comAssinatura FROM pontos_eletronicos WHERE assinatura = "OK"');
    const semAssinatura = await db.get('SELECT COUNT(*) as semAssinatura FROM pontos_eletronicos WHERE assinatura = "Pendente"');
    
    console.log('✅ Estatísticas obtidas com sucesso');
    return {
      total: total.total,
      comAssinatura: comAssinatura.comAssinatura,
      semAssinatura: semAssinatura.semAssinatura
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
}

// Funções para PROADs
export async function salvarPROAD(dados: PROAD): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO proads (numero, ano, setor, prioridade, situacao, dataCadastro, andamento, responsavel, assunto, responsavel_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dados.numero, 
      dados.ano, 
      dados.setor, 
      dados.prioridade, 
      dados.situacao, 
      dados.dataCadastro, 
      dados.andamento, 
      dados.responsavel, 
      dados.assunto,
      dados.responsavel_custom
    ]);
    console.log('✅ PROAD salvo com sucesso, ID:', result.lastID);

    // Salvar o primeiro andamento no histórico
    if (dados.andamento && result.lastID) {
      await db.run(`
        INSERT INTO proad_andamentos (proad_id, data, descricao)
        VALUES (?, ?, ?)
      `, [result.lastID, new Date(), dados.andamento]);
      console.log('✅ Primeiro andamento salvo no histórico para o PROAD ID:', result.lastID);
    }

    return result.lastID!;
  } catch (error) {
    console.error('❌ Erro ao salvar PROAD:', error);
    throw error;
  }
}

export async function buscarPROADs(filtros: FiltrosPROAD = {}): Promise<PROAD[]> {
  try {
    const db = await getDatabase();
    let query = 'SELECT * FROM proads WHERE 1=1';
    const params: (string | number)[] = [];

    if (filtros.searchTerm) {
      query += ' AND (numero LIKE ? OR ano LIKE ? OR assunto LIKE ? OR setor LIKE ?)';
      const searchTerm = `%${filtros.searchTerm}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filtros.setor && filtros.setor !== 'all') {
      query += ' AND setor = ?';
      params.push(filtros.setor);
    }

    if (filtros.prioridade && filtros.prioridade !== 'all') {
      query += ' AND prioridade = ?';
      params.push(filtros.prioridade);
    }

    if (filtros.situacao && filtros.situacao !== 'all') {
      query += ' AND situacao = ?';
      params.push(filtros.situacao);
    }

    query += ' ORDER BY data_criacao DESC';

    const proads = await db.all(query, params);
    
    // Para cada PROAD, buscar seu histórico de andamentos
    for (const proad of proads) {
      proad.historicoAndamentos = await db.all(
        'SELECT * FROM proad_andamentos WHERE proad_id = ? ORDER BY data DESC',
        [proad.id]
      );
    }
    
    console.log(`✅ ${proads.length} PROADs encontrados com seus históricos`);
    return proads;
  } catch (error) {
    console.error('❌ Erro ao buscar PROADs:', error);
    throw error;
  }
}

export async function atualizarPROAD(id: number, dados: Partial<PROAD>): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Antes de atualizar, buscar o andamento atual
    const proadAtual = await db.get('SELECT andamento FROM proads WHERE id = ?', [id]);

    await db.run(`
      UPDATE proads 
      SET numero = ?, ano = ?, setor = ?, prioridade = ?, situacao = ?, 
          dataCadastro = ?, andamento = ?, responsavel = ?, assunto = ?, responsavel_custom = ?
      WHERE id = ?
    `, [
      dados.numero, 
      dados.ano, 
      dados.setor, 
      dados.prioridade, 
      dados.situacao, 
      dados.dataCadastro, 
      dados.andamento, 
      dados.responsavel, 
      dados.assunto,
      dados.responsavel_custom,
      id
    ]);
    console.log('✅ PROAD atualizado com sucesso, ID:', id);

    // Adicionar novo andamento ao histórico se o texto do andamento mudou
    if (dados.andamento && dados.andamento !== proadAtual.andamento) {
        await db.run(`
            INSERT INTO proad_andamentos (proad_id, data, descricao)
            VALUES (?, ?, ?)
        `, [id, new Date(), dados.andamento]);
        console.log('✅ Novo andamento salvo no histórico para o PROAD ID:', id);
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar PROAD:', error);
    throw error;
  }
}

export async function deletarPROAD(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM proads WHERE id = ?', [id]);
    console.log('✅ PROAD deletado com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar PROAD:', error);
    throw error;
  }
}

// Funções para Demandas
export async function salvarDemanda(dados: Demanda): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO demandas (titulo, descricao, setor, prioridade, situacao, dataCadastro, prazo, responsavel, responsavel_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dados.titulo, 
      dados.descricao, 
      dados.setor, 
      dados.prioridade, 
      dados.situacao, 
      dados.dataCadastro, 
      dados.prazo, 
      dados.responsavel,
      dados.responsavel_custom
    ]);
    console.log('✅ Demanda salva com sucesso, ID:', result.lastID);
    return result.lastID!;
  } catch (error) {
    console.error('❌ Erro ao salvar Demanda:', error);
    throw error;
  }
}

export async function buscarDemandas(filtros: FiltrosDemanda = {}): Promise<Demanda[]> {
  try {
    const db = await getDatabase();
    let query = 'SELECT * FROM demandas WHERE 1=1';
    const params: (string | number)[] = [];

    if (filtros.searchTerm) {
      query += ' AND (titulo LIKE ? OR descricao LIKE ? OR setor LIKE ?)';
      const searchTerm = `%${filtros.searchTerm}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filtros.setor && filtros.setor !== 'all') {
      query += ' AND setor = ?';
      params.push(filtros.setor);
    }

    if (filtros.prioridade && filtros.prioridade !== 'all') {
      query += ' AND prioridade = ?';
      params.push(filtros.prioridade);
    }

    if (filtros.situacao && filtros.situacao !== 'all') {
      query += ' AND situacao = ?';
      params.push(filtros.situacao);
    }

    query += ' ORDER BY data_criacao DESC';

    const demandas = await db.all(query, params);
    console.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  } catch (error) {
    console.error('❌ Erro ao buscar demandas:', error);
    throw error;
  }
}

export async function atualizarDemanda(id: number, dados: Partial<Demanda>): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run(`
      UPDATE demandas 
      SET titulo = ?, descricao = ?, setor = ?, prioridade = ?, situacao = ?, 
          dataCadastro = ?, prazo = ?, responsavel = ?, responsavel_custom = ?
      WHERE id = ?
    `, [
      dados.titulo, 
      dados.descricao, 
      dados.setor, 
      dados.prioridade, 
      dados.situacao, 
      dados.dataCadastro, 
      dados.prazo, 
      dados.responsavel,
      dados.responsavel_custom,
      id
    ]);
    console.log('✅ Demanda atualizada com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar Demanda:', error);
    throw error;
  }
}

export async function deletarDemanda(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM demandas WHERE id = ?', [id]);
    console.log('✅ Demanda deletada com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar Demanda:', error);
    throw error;
  }
}

// Funções para Refis
export async function salvarRefil(dados: Omit<Refil, 'id'>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO refis (marca, quantidadeDisponivel, fotoUrl, descricao, dataCadastro, ultimaAtualizacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      dados.marca,
      dados.quantidadeDisponivel,
      dados.fotoUrl,
      dados.descricao,
      dados.dataCadastro,
      dados.ultimaAtualizacao
    ]);
    console.log('✅ Refil salvo com sucesso, ID:', result.lastID);
    return result.lastID!;
  } catch (error) {
    console.error('❌ Erro ao salvar Refil:', error);
    throw error;
  }
}

export async function buscarRefis(): Promise<Refil[]> {
  try {
    const db = await getDatabase();
    const refis = await db.all('SELECT * FROM refis ORDER BY marca ASC');
    console.log(`✅ ${refis.length} refis encontrados`);
    return refis.map(r => ({
      ...r,
      dataCadastro: new Date(r.dataCadastro),
      ultimaAtualizacao: new Date(r.ultimaAtualizacao)
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar Refis:', error);
    throw error;
  }
}

export async function atualizarRefil(id: number, dados: Partial<Omit<Refil, 'id'>>): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run(`
      UPDATE refis 
      SET marca = ?, quantidadeDisponivel = ?, fotoUrl = ?, descricao = ?, ultimaAtualizacao = ?
      WHERE id = ?
    `, [
      dados.marca,
      dados.quantidadeDisponivel,
      dados.fotoUrl,
      dados.descricao,
      dados.ultimaAtualizacao,
      id
    ]);
    console.log('✅ Refil atualizado com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar Refil:', error);
    throw error;
  }
}

export async function deletarRefil(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM refis WHERE id = ?', [id]);
    console.log('✅ Refil deletado com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar Refil:', error);
    throw error;
  }
}

// Funções para gerenciar andamentos
export async function atualizarAndamento(id: number, dados: { descricao: string; data: string }): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run(`
      UPDATE proad_andamentos 
      SET descricao = ?, data = ?
      WHERE id = ?
    `, [dados.descricao, dados.data, id]);
    console.log('✅ Andamento atualizado com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar andamento:', error);
    throw error;
  }
}

export async function deletarAndamento(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM proad_andamentos WHERE id = ?', [id]);
    console.log('✅ Andamento deletado com sucesso, ID:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar andamento:', error);
    throw error;
  }
}
