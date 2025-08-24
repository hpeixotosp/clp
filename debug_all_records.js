const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'trt21.db');
const db = new sqlite3.Database(dbPath);

console.log('=== ANÁLISE COMPLETA DO BANCO DE DADOS ===');

// Função para executar query e retornar Promise
function queryDatabase(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function analyzeDatabase() {
try {
  // Buscar TODOS os registros
  const allRecords = await queryDatabase(`
    SELECT * FROM pontos_eletronicos 
    ORDER BY data_processamento DESC
  `);

  console.log(`Total de registros no banco: ${allRecords.length}\n`);

  if (allRecords.length === 0) {
    console.log('❌ Nenhum registro encontrado no banco de dados.');
    db.close();
    process.exit(0);
  }

  // Agrupar por período
  const recordsByPeriod = {};
  allRecords.forEach(record => {
    if (!recordsByPeriod[record.periodo]) {
      recordsByPeriod[record.periodo] = [];
    }
    recordsByPeriod[record.periodo].push(record);
  });

  console.log('=== REGISTROS POR PERÍODO ===');
  Object.keys(recordsByPeriod).sort().forEach(periodo => {
    const records = recordsByPeriod[periodo];
    console.log(`\n📅 PERÍODO: ${periodo} (${records.length} registros)`);
    
    records.forEach((record, index) => {
      console.log(`  ${index + 1}. ID: ${record.id}`);
      console.log(`     Colaborador: ${record.colaborador}`);
      console.log(`     Previsto: ${record.previsto}`);
      console.log(`     Realizado: ${record.realizado}`);
      console.log(`     Saldo: ${record.saldo}`);
      console.log(`     Arquivo: ${record.arquivo_origem}`);
      console.log(`     Data: ${record.data_processamento}`);
      
      // Verificar registros problemáticos
      if (record.colaborador.includes('NMO') || record.colaborador.includes('PQ') || record.colaborador.includes('RQ')) {
        console.log(`     ⚠️  PROBLEMA: Registro contém dados suspeitos!`);
      }
      
      console.log('');
    });
  });

  // Verificar duplicações
  console.log('\n=== ANÁLISE DE DUPLICAÇÕES ===');
  const collaboratorPeriods = {};
  
  allRecords.forEach(record => {
    const key = `${record.colaborador}_${record.periodo}`;
    if (!collaboratorPeriods[key]) {
      collaboratorPeriods[key] = [];
    }
    collaboratorPeriods[key].push(record);
  });

  let duplicatesFound = false;
  Object.keys(collaboratorPeriods).forEach(key => {
    const records = collaboratorPeriods[key];
    if (records.length > 1) {
      duplicatesFound = true;
      const [colaborador, periodo] = key.split('_');
      console.log(`\n❌ DUPLICAÇÃO ENCONTRADA:`);
      console.log(`   Colaborador: ${colaborador}`);
      console.log(`   Período: ${periodo}`);
      console.log(`   Quantidade: ${records.length} registros`);
      
      records.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Data: ${record.data_processamento}`);
      });
    }
  });

  if (!duplicatesFound) {
    console.log('✅ Nenhuma duplicação encontrada.');
  }

  // Verificar registros suspeitos
  console.log('\n=== ANÁLISE DE REGISTROS SUSPEITOS ===');
  const suspiciousRecords = allRecords.filter(record => 
    record.colaborador.includes('NMO') || 
    record.colaborador.includes('PQ') || 
    record.colaborador.includes('RQ') ||
    record.colaborador.includes('PS') ||
    record.colaborador.includes('RS') ||
    record.colaborador.length < 5 ||
    !record.colaborador.includes(' ')
  );

  if (suspiciousRecords.length > 0) {
    console.log(`❌ ${suspiciousRecords.length} registro(s) suspeito(s) encontrado(s):`);
    suspiciousRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}, Colaborador: "${record.colaborador}", Período: ${record.periodo}`);
    });
  } else {
    console.log('✅ Nenhum registro suspeito encontrado.');
  }

  // Estatísticas finais
  console.log('\n=== ESTATÍSTICAS FINAIS ===');
  console.log(`Total de registros: ${allRecords.length}`);
  console.log(`Períodos únicos: ${Object.keys(recordsByPeriod).length}`);
  console.log(`Colaboradores únicos: ${new Set(allRecords.map(r => r.colaborador)).size}`);
  console.log(`Duplicações: ${duplicatesFound ? 'SIM' : 'NÃO'}`);
  console.log(`Registros suspeitos: ${suspiciousRecords.length}`);

} catch (error) {
  console.error('Erro ao consultar banco de dados:', error);
} finally {
  db.close();
}
}

// Executar a análise
analyzeDatabase();