#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para migrar dados do SQLite para MySQL
Execute este script após configurar o banco MySQL
"""

import sqlite3
import mysql.connector
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
import json
from datetime import datetime

# Adicionar o diretório pai ao path
sys.path.append(str(Path(__file__).parent.parent))

from database import DatabaseManager

class SQLiteToMySQLMigrator:
    def __init__(self, sqlite_path: str, mysql_config: Dict[str, Any]):
        self.sqlite_path = sqlite_path
        self.mysql_config = mysql_config
        self.sqlite_conn = None
        self.mysql_manager = DatabaseManager()
        
        # Sobrescrever configuração do MySQL
        self.mysql_manager.config.update(mysql_config)
    
    def connect_sqlite(self):
        """Conecta ao banco SQLite"""
        try:
            self.sqlite_conn = sqlite3.connect(self.sqlite_path)
            self.sqlite_conn.row_factory = sqlite3.Row
            print(f"✅ Conectado ao SQLite: {self.sqlite_path}")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar ao SQLite: {e}")
            return False
    
    def get_sqlite_tables(self) -> List[str]:
        """Obtém lista de tabelas do SQLite"""
        cursor = self.sqlite_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row['name'] for row in cursor.fetchall()]
        cursor.close()
        return tables
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, Any]]:
        """Obtém schema de uma tabela do SQLite"""
        cursor = self.sqlite_conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = []
        for row in cursor.fetchall():
            columns.append({
                'name': row['name'],
                'type': row['type'],
                'notnull': bool(row['notnull']),
                'default': row['dflt_value'],
                'pk': bool(row['pk'])
            })
        cursor.close()
        return columns
    
    def convert_sqlite_type_to_mysql(self, sqlite_type: str) -> str:
        """Converte tipos de dados do SQLite para MySQL"""
        sqlite_type = sqlite_type.upper()
        
        if 'INT' in sqlite_type:
            return 'INT'
        elif 'REAL' in sqlite_type or 'FLOAT' in sqlite_type or 'DOUBLE' in sqlite_type:
            return 'DECIMAL(10,2)'
        elif 'TEXT' in sqlite_type:
            return 'TEXT'
        elif 'BLOB' in sqlite_type:
            return 'LONGBLOB'
        elif 'BOOLEAN' in sqlite_type:
            return 'BOOLEAN'
        else:
            return 'VARCHAR(255)'
    
    def create_mysql_table(self, table_name: str, columns: List[Dict[str, Any]]):
        """Cria tabela no MySQL baseada no schema do SQLite"""
        try:
            # Mapear nomes de tabelas para os novos nomes MySQL
            table_mapping = {
                'contracheques': 'contracheques',
                'pontos_eletronicos': 'pontos_eletronicos',
                'colaboradores': 'colaboradores',
                'propostas': 'propostas',
                'trs': 'trs'
            }
            
            mysql_table_name = table_mapping.get(table_name, table_name)
            
            # Criar tabela se não existir
            if mysql_table_name == 'contracheques':
                self.mysql_manager.execute_query("""
                    CREATE TABLE IF NOT EXISTS contracheques (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        colaborador_id INT,
                        periodo VARCHAR(20) NOT NULL,
                        tipo_documento ENUM('contracheque', 'recibo') NOT NULL,
                        vencimentos DECIMAL(10,2) DEFAULT 0.00,
                        descontos DECIMAL(10,2) DEFAULT 0.00,
                        valor_liquido DECIMAL(10,2) DEFAULT 0.00,
                        status_validacao ENUM('confere', 'nao_confere', 'pendente') DEFAULT 'pendente',
                        arquivo_original VARCHAR(255),
                        dados_processados JSON,
                        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
            elif mysql_table_name == 'pontos_eletronicos':
                self.mysql_manager.execute_query("""
                    CREATE TABLE IF NOT EXISTS pontos_eletronicos (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        colaborador_id INT,
                        data DATE NOT NULL,
                        entrada_manha TIME,
                        saida_manha TIME,
                        entrada_tarde TIME,
                        saida_tarde TIME,
                        total_horas DECIMAL(4,2),
                        observacoes TEXT,
                        arquivo_original VARCHAR(255),
                        dados_processados JSON,
                        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
            elif mysql_table_name == 'colaboradores':
                self.mysql_manager.execute_query("""
                    CREATE TABLE IF NOT EXISTS colaboradores (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        nome VARCHAR(255) NOT NULL,
                        matricula VARCHAR(50) UNIQUE,
                        cpf VARCHAR(14) UNIQUE,
                        email VARCHAR(255),
                        cargo VARCHAR(255),
                        departamento VARCHAR(255),
                        data_admissao DATE,
                        status ENUM('ativo', 'inativo') DEFAULT 'ativo',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
            
            print(f"✅ Tabela {mysql_table_name} criada/verificada no MySQL")
            
        except Exception as e:
            print(f"❌ Erro ao criar tabela {table_name}: {e}")
            raise e
    
    def migrate_table_data(self, table_name: str):
        """Migra dados de uma tabela do SQLite para MySQL"""
        try:
            cursor = self.sqlite_conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            cursor.close()
            
            if not rows:
                print(f"ℹ️ Tabela {table_name} está vazia, pulando...")
                return
            
            print(f"📊 Migrando {len(rows)} registros da tabela {table_name}")
            
            # Mapear nomes de tabelas
            table_mapping = {
                'contracheques': 'contracheques',
                'pontos_eletronicos': 'pontos_eletronicos',
                'colaboradores': 'colaboradores'
            }
            
            mysql_table_name = table_mapping.get(table_name, table_name)
            
            for row in rows:
                try:
                    if mysql_table_name == 'contracheques':
                        # Migrar contracheques
                        self.mysql_manager.execute_insert("""
                            INSERT INTO contracheques (
                                periodo, tipo_documento, vencimentos, descontos, 
                                valor_liquido, status_validacao, arquivo_original, 
                                dados_processados, processado_em
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            row.get('periodo', ''),
                            row.get('tipo_documento', 'contracheque'),
                            float(row.get('vencimentos', 0)),
                            float(row.get('descontos', 0)),
                            float(row.get('valor_liquido', 0)),
                            row.get('status_validacao', 'pendente'),
                            row.get('arquivo_original', ''),
                            json.dumps(dict(row)),
                            datetime.now()
                        ))
                    
                    elif mysql_table_name == 'pontos_eletronicos':
                        # Migrar pontos eletrônicos
                        self.mysql_manager.execute_insert("""
                            INSERT INTO pontos_eletronicos (
                                data, entrada_manha, saida_manha, entrada_tarde, 
                                saida_tarde, total_horas, observacoes, 
                                arquivo_original, dados_processados, processado_em
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            row.get('data', datetime.now().date()),
                            row.get('entrada_manha'),
                            row.get('saida_manha'),
                            row.get('entrada_tarde'),
                            row.get('saida_tarde'),
                            float(row.get('total_horas', 0)),
                            row.get('observacoes', ''),
                            row.get('arquivo_original', ''),
                            json.dumps(dict(row)),
                            datetime.now()
                        ))
                    
                    elif mysql_table_name == 'colaboradores':
                        # Migrar colaboradores
                        self.mysql_manager.execute_insert("""
                            INSERT INTO colaboradores (
                                nome, matricula, cpf, email, cargo, departamento, 
                                data_admissao, status
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            row.get('nome', ''),
                            row.get('matricula'),
                            row.get('cpf'),
                            row.get('email'),
                            row.get('cargo'),
                            row.get('departamento'),
                            row.get('data_admissao'),
                            row.get('status', 'ativo')
                        ))
                
                except Exception as e:
                    print(f"⚠️ Erro ao migrar registro da tabela {table_name}: {e}")
                    continue
            
            print(f"✅ Dados da tabela {table_name} migrados com sucesso")
            
        except Exception as e:
            print(f"❌ Erro ao migrar tabela {table_name}: {e}")
            raise e
    
    def migrate_all(self):
        """Executa a migração completa"""
        try:
            print("🚀 Iniciando migração do SQLite para MySQL...")
            
            # Conectar ao SQLite
            if not self.connect_sqlite():
                return False
            
            # Conectar ao MySQL
            if not self.mysql_manager.connect():
                return False
            
            # Obter tabelas do SQLite
            tables = self.get_sqlite_tables()
            print(f"📋 Tabelas encontradas no SQLite: {tables}")
            
            # Migrar cada tabela
            for table_name in tables:
                try:
                    print(f"\n🔄 Migrando tabela: {table_name}")
                    
                    # Obter schema da tabela
                    columns = self.get_table_schema(table_name)
                    
                    # Criar tabela no MySQL
                    self.create_mysql_table(table_name, columns)
                    
                    # Migrar dados
                    self.migrate_table_data(table_name)
                    
                except Exception as e:
                    print(f"❌ Erro na migração da tabela {table_name}: {e}")
                    continue
            
            print("\n🎉 Migração concluída com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro durante a migração: {e}")
            return False
        finally:
            if self.sqlite_conn:
                self.sqlite_conn.close()
            self.mysql_manager.disconnect()

def main():
    """Função principal"""
    # Configuração do MySQL (substitua pelos seus valores)
    mysql_config = {
        'host': '143.110.196.243',
        'user': 'clp_user',
        'password': 'sua_senha_aqui',
        'database': 'clp_manager',
        'port': 3306
    }
    
    # Caminho para o banco SQLite (ajuste conforme necessário)
    sqlite_path = "../trt21.db"  # Ajuste o caminho conforme necessário
    
    if not os.path.exists(sqlite_path):
        print(f"❌ Arquivo SQLite não encontrado: {sqlite_path}")
        return
    
    # Executar migração
    migrator = SQLiteToMySQLMigrator(sqlite_path, mysql_config)
    success = migrator.migrate_all()
    
    if success:
        print("✅ Migração concluída com sucesso!")
    else:
        print("❌ Migração falhou!")
        sys.exit(1)

if __name__ == "__main__":
    main()
