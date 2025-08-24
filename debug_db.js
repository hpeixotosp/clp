const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'trt21.db');
const db = new sqlite3.Database(dbPath);

console.log('=== CONSULTANDO BANCO DE DADOS ===');

db.all('SELECT * FROM pontos_eletronicos ORDER BY data_processamento DESC', (err, rows) => {
  if (err) {
    console.error('Erro ao consultar banco:', err);
  } else {
    console.log(`Total de registros: ${rows.length}`);
    console.log('\n=== REGISTROS ENCONTRADOS ===');
    rows.forEach((row, index) => {
      console.log(`\n--- Registro ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Colaborador: ${row.colaborador}`);
      console.log(`Período: ${row.periodo}`);
      console.log(`Previsto: ${row.previsto}`);
      console.log(`Realizado: ${row.realizado}`);
      console.log(`Saldo: ${row.saldo}`);
      console.log(`Assinatura: ${row.assinatura}`);
      console.log(`Arquivo: ${row.arquivo_origem}`);
      console.log(`Data: ${row.data_processamento}`);
    });
  }
  
  db.close();
});