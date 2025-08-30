import mysql.connector
from mysql.connector import Error
import os
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'clp_user'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'clp_manager'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
    
    def connect(self) -> bool:
        """Estabelece conexão com o banco MySQL"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                logger.info("✅ Conectado ao banco MySQL com sucesso")
                return True
        except Error as e:
            logger.error(f"❌ Erro ao conectar ao MySQL: {e}")
            return False
        return False
    
    def disconnect(self):
        """Fecha a conexão com o banco"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("🔌 Conexão com MySQL fechada")
    
    @contextmanager
    def get_cursor(self):
        """Context manager para obter cursor do banco"""
        if not self.connection or not self.connection.is_connected():
            if not self.connect():
                raise Exception("Não foi possível conectar ao banco de dados")
        
        cursor = self.connection.cursor(dictionary=True)
        try:
            yield cursor
            self.connection.commit()
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def init_database(self):
        """Inicializa o banco de dados criando as tabelas necessárias"""
        try:
            with self.get_cursor() as cursor:
                # Tabela de colaboradores
                cursor.execute("""
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
                
                # Tabela de contracheques
                cursor.execute("""
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
                        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                # Tabela de pontos eletrônicos
                cursor.execute("""
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
                        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                # Tabela de propostas
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS propostas (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        numero VARCHAR(100) UNIQUE,
                        objeto TEXT,
                        valor DECIMAL(15,2),
                        empresa VARCHAR(255),
                        status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
                        data_analise DATE,
                        analista VARCHAR(255),
                        observacoes TEXT,
                        arquivo_original VARCHAR(255),
                        dados_processados JSON,
                        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                # Tabela de TRs
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS trs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        numero VARCHAR(100) UNIQUE,
                        tipo ENUM('TR', 'TR_ETP') NOT NULL,
                        objeto TEXT,
                        valor DECIMAL(15,2),
                        empresa VARCHAR(255),
                        status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
                        data_analise DATE,
                        analista VARCHAR(255),
                        observacoes TEXT,
                        arquivo_original VARCHAR(255),
                        dados_processados JSON,
                        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                # Índices para melhor performance
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_contracheques_colaborador ON contracheques(colaborador_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_contracheques_periodo ON contracheques(periodo)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_pontos_colaborador ON pontos_eletronicos(colaborador_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_pontos_data ON pontos_eletronicos(data)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_propostas_numero ON propostas(numero)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_trs_numero ON trs(numero)")
                
                logger.info("✅ Banco de dados inicializado com sucesso")
                
        except Error as e:
            logger.error(f"❌ Erro ao inicializar banco: {e}")
            raise e
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Executa uma query e retorna os resultados"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Error as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            raise e
    
    def execute_insert(self, query: str, params: tuple = None) -> int:
        """Executa uma query de inserção e retorna o ID inserido"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params)
                return cursor.lastrowid
        except Error as e:
            logger.error(f"❌ Erro ao executar insert: {e}")
            raise e
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """Executa uma query de atualização e retorna o número de linhas afetadas"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params)
                return cursor.rowcount
        except Error as e:
            logger.error(f"❌ Erro ao executar update: {e}")
            raise e

# Instância global do gerenciador de banco
db_manager = DatabaseManager()

def get_db() -> DatabaseManager:
    """Retorna a instância do gerenciador de banco"""
    return db_manager
