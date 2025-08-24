const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'pontos_eletronicos.db');

function queryDatabase(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

async function debugAdriano() {
  try {
    console.log('=== ANÁLISE ESPECÍFICA - ADRIANO COSTA DE SOUZA ROQUE ===\n');
    
    // Buscar todos os registros de Adriano
    const adrianoRecords = await queryDatabase(
      "SELECT * FROM pontos_eletronicos WHERE colaborador LIKE '%ADRIANO%' ORDER BY periodo, colaborador"
    );
    
    console.log(`📊 Total de registros de Adriano encontrados: ${adrianoRecords.length}\n`);
    
    if (adrianoRecords.length > 0) {
      console.log('📋 Detalhes dos registros:');
      adrianoRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. Registro:`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Colaborador: ${record.colaborador}`);
        console.log(`   Período: ${record.periodo}`);
        console.log(`   Previsto: ${record.previsto}`);
        console.log(`   Realizado: ${record.realizado}`);
        console.log(`   Saldo: ${record.saldo}`);
        console.log(`   Assinatura: ${record.assinatura}`);
        console.log(`   Data Criação: ${record.created_at}`);
      });
      
      // Verificar duplicações por período
      const periodos = {};
      adrianoRecords.forEach(record => {
        if (!periodos[record.periodo]) {
          periodos[record.periodo] = [];
        }
        periodos[record.periodo].push(record);
      });
      
      console.log('\n🔍 Análise de duplicações por período:');
      Object.keys(periodos).forEach(periodo => {
        const registros = periodos[periodo];
        if (registros.length > 1) {
          console.log(`\n⚠️  DUPLICAÇÃO ENCONTRADA no período ${periodo}:`);
          registros.forEach((reg, idx) => {
            console.log(`   ${idx + 1}. ID: ${reg.id} | Previsto: ${reg.previsto} | Realizado: ${reg.realizado}`);
          });
        } else {
          console.log(`\n✅ Período ${periodo}: 1 registro (OK)`);
        }
      });
    } else {
      console.log('ℹ️  Nenhum registro de Adriano encontrado no banco.');
    }
    
    // Buscar registros similares (variações do nome)
    console.log('\n🔍 Buscando variações do nome Adriano...');
    const variationsQuery = await queryDatabase(
      "SELECT * FROM pontos_eletronicos WHERE colaborador LIKE '%ADRIANO%' OR colaborador LIKE '%COSTA%' OR colaborador LIKE '%SOUZA%' OR colaborador LIKE '%ROQUE%' ORDER BY colaborador, periodo"
    );
    
    if (variationsQuery.length > adrianoRecords.length) {
      console.log(`\n📋 Encontradas ${variationsQuery.length} variações do nome:`);
      variationsQuery.forEach((record, index) => {
        console.log(`${index + 1}. ${record.colaborador} (${record.periodo})`);
      });
    } else {
      console.log('✅ Nenhuma variação adicional encontrada.');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Executar análise
debugAdriano();