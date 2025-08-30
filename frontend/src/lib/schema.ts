import { openDb } from './db';

async function createSchema() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS proads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      ano TEXT NOT NULL,
      setor_origem TEXT NOT NULL,
      prioridade TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS demandas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      setor_origem TEXT NOT NULL,
      prioridade TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS andamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proad_id INTEGER,
      demanda_id INTEGER,
      descricao TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proad_id) REFERENCES proads (id),
      FOREIGN KEY (demanda_id) REFERENCES demandas (id)
    );

    CREATE TABLE IF NOT EXISTS frequencia_historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes TEXT NOT NULL,
      colaborador TEXT NOT NULL,
      saldo_horas TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database schema created successfully.');
}

createSchema();
