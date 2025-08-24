const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('trt21-clp.db');

db.all('SELECT * FROM pontos_eletronicos', (err, rows) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('=== TRT21-CLP.DB ===');
    console.log('Total de registros:', rows.length);
    rows.forEach((row, i) => {
      console.log(`--- Registro ${i+1} ---`);
      console.log('ID:', row.id);
      console.log('Colaborador:', row.colaborador);
      console.log('Período:', row.periodo);
      console.log('Assinatura:', row.assinatura);
    });
  }
  db.close();
});