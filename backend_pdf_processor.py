#!/usr/bin/env python3
"""
Backend Python para Processamento de PDFs de Ponto
Converte PDFs para CSV e calcula banco de horas automaticamente
"""

import sys
import os

# Verificar dependências críticas
try:
    import pdfplumber
    print("[OK] pdfplumber importado com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"[ERRO] pdfplumber não encontrado: {e}")
    print("Instale com: pip install pdfplumber")
    sys.exit(1)

try:
    import pandas as pd
    print("[OK] pandas importado com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"[ERRO] pandas não encontrado: {e}")
    print("Instale com: pip install pandas")
    sys.exit(1)

try:
    import re
    import json
    import argparse
    from datetime import datetime, date
    from typing import Dict, List, Tuple, Optional
    print("[OK] Bibliotecas padrão importadas com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"[ERRO] Biblioteca padrão não encontrada: {e}")
    sys.exit(1)

# Configurar encoding
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
        print("[OK] Encoding configurado para UTF-8", file=sys.stderr)
    except Exception as e:
        print(f"[AVISO] Não foi possível configurar encoding: {e}")

print("=== INICIANDO PROCESSAMENTO DE PDFs ===", file=sys.stderr)
print(f"Python version: {sys.version}", file=sys.stderr)
print(f"Diretório atual: {os.getcwd()}", file=sys.stderr)
print(f"Script: {__file__}", file=sys.stderr)

class PontoProcessor:
    def __init__(self):
        self.results = []
    

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extrai texto completo de um PDF - SOLUÇÃO ROBUSTA"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                table_data = []
                
                for page_num, page in enumerate(pdf.pages):
                    # Tentar extrair texto
                    text = page.extract_text()
                    if text:
                        text = self.clean_text(text)
                        full_text += text + "\n"
                        print(f"Página {page_num + 1}: {len(text)} caracteres extraídos")
                        if page_num == 0:
                            print(f"Primeiros 200 chars: {text[:200]}")
                    
                    # SEMPRE tentar extrair tabelas
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            for row in table:
                                if row and any(cell for cell in row if cell):
                                    row_text = " ".join([str(cell) for cell in row if cell])
                                    table_data.append(row_text)
                                    full_text += row_text + "\n"
                
                # Se não conseguiu extrair texto legível, usar dados das tabelas
                if len(full_text.strip()) < 100 or not re.search(r'[A-Za-z]', full_text):
                    print("Texto extraído muito pobre, usando dados das tabelas...")
                    full_text = "\n".join(table_data)
                
                return full_text
        except Exception as e:
            print(f"Erro ao extrair texto de {pdf_path}: {e}")
            return ""
    
    def clean_text(self, text: str) -> str:
        """Limpa texto removendo caracteres especiais e normalizando"""
        # Remover caracteres CID
        text = re.sub(r'\(cid:\d+\)', ' ', text)
        
        # Remover caracteres especiais comuns e caracteres corrompidos
        text = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF\s]', ' ', text)
        
        # Remover caracteres problemáticos específicos
        text = re.sub(r'[\[\]<>@\^\\]', ' ', text)
        
        # Remover sequências de caracteres não imprimíveis
        text = re.sub(r'[\x00-\x1F\x7F-\x9F]', ' ', text)
        
        # Normalizar espaços
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def load_valid_colaboradores(self) -> List[str]:
        """Carrega a lista de colaboradores válidos do arquivo"""
        try:
            colaboradores_file = os.path.join(os.getcwd(), 'colaboradores_validos.txt')
            if os.path.exists(colaboradores_file):
                with open(colaboradores_file, 'r', encoding='utf-8') as f:
                    colaboradores = [linha.strip() for linha in f.readlines() if linha.strip()]
                print(f"Lista de colaboradores carregada: {len(colaboradores)} nomes")
                return colaboradores
            else:
                print("Arquivo colaboradores_validos.txt não encontrado, usando validação padrão")
                return []
        except Exception as e:
            print(f"Erro ao carregar lista de colaboradores: {e}")
            return []
    
    def validate_colaborador_name(self, nome: str) -> bool:
        """Valida se o nome do colaborador é válido usando lista de colaboradores válidos"""
        if not nome or nome == "Não encontrado":
            return False
        
        # Carregar lista de colaboradores válidos
        colaboradores_validos = self.load_valid_colaboradores()
        
        # Se existe lista de colaboradores válidos, usar apenas ela
        if colaboradores_validos:
            # Verificar se o nome está na lista (case-insensitive)
            nome_normalizado = nome.strip().upper()
            for colaborador_valido in colaboradores_validos:
                if colaborador_valido.strip().upper() == nome_normalizado:
                    print(f"✅ Colaborador '{nome}' encontrado na lista válida", file=sys.stderr)
                    return True
            
            print(f"❌ Colaborador '{nome}' NÃO encontrado na lista válida", file=sys.stderr)
            return False
        
        # Fallback: validação padrão se não há lista de colaboradores
        print("Usando validação padrão (sem lista de colaboradores)", file=sys.stderr)
        
        # Verificar se contém caracteres problemáticos
        if re.search(r'[\[\]<>@\^\\]', nome):
            return False
            
        # Verificar se tem pelo menos 2 palavras
        palavras = nome.split()
        if len(palavras) < 2:
            return False
            
        # Verificar se todas as palavras têm pelo menos 2 caracteres
        if any(len(palavra) < 2 for palavra in palavras):
            return False
            
        # Verificar se não contém números
        if re.search(r'\d', nome):
            return False
            
        return True
    
    def extract_header_info(self, text: str) -> Tuple[str, str]:
        """Extrai nome do colaborador e período do cabeçalho - SOLUÇÃO UNIVERSAL"""
        # Aplicar limpeza de texto primeiro
        text = self.clean_text(text)
        
        print(f"Texto extraído (primeiros 500 chars): {text[:500]}")
        
        # SOLUÇÃO UNIVERSAL: Múltiplas estratégias para encontrar nome
        nome = "Não encontrado"
        
        # Estratégia 1: Procurar por sequências de letras maiúsculas (nomes)
        nome_patterns = [
            r'([A-Z][A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+?)(?=\s*[0-9\/]|\s*$)',
            r'([A-Z][A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+?)(?=\s*[A-Z]{2,}|\s*$)',
            r'([A-Z][A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]{3,})'
        ]
        
        for pattern in nome_patterns:
            match = re.search(pattern, text)
            if match:
                nome_candidato = self.clean_text(match.group(1).strip())
                if self.validate_colaborador_name(nome_candidato):
                    nome = nome_candidato
                    print(f"Nome encontrado (Estratégia 1): '{nome}'")
                    break
        
        # Estratégia 2: Se não encontrou, procurar por padrões específicos
        if nome == "Não encontrado":
            specific_patterns = [
                r'Colaborador:\s*([A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+)',
                r'Nome:\s*([A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+)',
                r'Funcionário:\s*([A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+)'
            ]
            
            for pattern in specific_patterns:
                match = re.search(pattern, text)
                if match:
                    nome_candidato = self.clean_text(match.group(1).strip())
                    if self.validate_colaborador_name(nome_candidato):
                        nome = nome_candidato
                        print(f"Nome encontrado (Estratégia 2): '{nome}'")
                        break
        
        # Estratégia 3: Procurar por qualquer sequência que pareça nome
        if nome == "Não encontrado":
            # Procurar por sequências de 3+ palavras em maiúsculo
            words = text.split()
            nome_parts = []
            for word in words:
                if (word.isupper() and len(word) > 2 and 
                    not re.search(r'[0-9\/\-]', word) and
                    word not in ['PONTO', 'FOLHA', 'CONTROLE', 'PERIODO']):
                    nome_parts.append(word)
                    if len(nome_parts) >= 3:
                        nome_candidato = self.clean_text(" ".join(nome_parts))
                        if self.validate_colaborador_name(nome_candidato):
                            nome = nome_candidato
                            print(f"Nome encontrado (Estratégia 3): '{nome}'")
                            break
        
        # Estratégia 4: Se ainda não encontrou, usar primeira linha não vazia
        if nome == "Não encontrado":
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if (len(line) > 10 and 
                    re.search(r'[A-Z]', line) and 
                    not re.search(r'[0-9]{2}/[0-9]{2}', line)):
                    nome_candidato = self.clean_text(line[:50])  # Limitar tamanho
                    if self.validate_colaborador_name(nome_candidato):
                        nome = nome_candidato
                        print(f"Nome encontrado (Estratégia 4): '{nome}'")
                        break
        
        # Encontrar datas
        data_pattern = r'(\d{2}/\d{2}/\d{4})'
        datas = re.findall(data_pattern, text)
        
        if not datas:
            print("Datas não encontradas")
            return nome, "Não encontrado"
        
        # Usar a primeira data para determinar período
        primeira_data = datas[0]
        date_parts = primeira_data.split('/')
        if len(date_parts) >= 2:
            mes = date_parts[1].zfill(2)
            ano = date_parts[2]
            if len(ano) == 2:
                ano = f"20{ano}"
            periodo = f"{mes}/{ano}"
            print(f"Período determinado: {periodo} (da data {primeira_data})")
            return nome, periodo
        
        return nome, "Não encontrado"
    
    def check_digital_signature(self, text: str, pdf_path: str = None) -> bool:
        """Verifica se o documento tem assinatura digital - COM OCR"""
        # Padrões simples para detectar "assinado digitalmente" e similares
        patterns = [
            r'assinado\s+digitalmente',
            r'assinatura\s+digital',
            r'assinado\s+eletronicamente',
            r'assinatura\s+eletrônica',
            r'certificado\s+digital'
        ]
        
        text_lower = text.lower()
        
        # Verificar se algum dos padrões está presente no texto extraído
        for pattern in patterns:
            if re.search(pattern, text_lower):
                print(f"Assinatura digital detectada no texto: {pattern}")
                return True
        
        # Se não encontrou no texto, tentar OCR nas imagens do PDF
        if pdf_path:
            ocr_text = self.extract_text_with_ocr(pdf_path)
            if ocr_text:
                ocr_text_lower = ocr_text.lower()
                # Primeiro tentar os padrões completos
                for pattern in patterns:
                    if re.search(pattern, ocr_text_lower):
                        print(f"Assinatura digital detectada via OCR: {pattern}")
                        return True
                
                # Se não encontrou padrões completos, procurar por palavras-chave simples
                simple_keywords = ['assinado', 'assinatura']
                for keyword in simple_keywords:
                    if keyword in ocr_text_lower:
                        print(f"Assinatura detectada via OCR (palavra-chave): {keyword}")
                        return True
        
        print("Nenhuma assinatura detectada")
        return False
    
    def extract_text_with_ocr(self, pdf_path: str) -> str:
        """Extrai texto de imagens no PDF usando OCR"""
        try:
            import pytesseract
            import fitz  # PyMuPDF
            from PIL import Image
            import io
            
            print(f"Executando OCR no arquivo: {pdf_path}", file=sys.stderr)
            
            # Configurar caminho do Tesseract se necessário
            try:
                pytesseract.get_tesseract_version()
            except:
                # Tentar caminhos comuns do Tesseract no Windows
                possible_paths = [
                    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
                ]
                for path in possible_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        break
            
            # Abrir PDF com PyMuPDF
            doc = fitz.open(pdf_path)
            
            ocr_text = ""
            for page_num in range(len(doc)):
                print(f"Processando página {page_num+1} com OCR...", file=sys.stderr)
                page = doc.load_page(page_num)
                
                # Converter página para imagem
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom para melhor qualidade
                img_data = pix.tobytes("png")
                
                # Converter para PIL Image
                img = Image.open(io.BytesIO(img_data))
                
                # Extrair texto da imagem usando OCR
                page_text = pytesseract.image_to_string(img, lang='eng')
                ocr_text += page_text + "\n"
            
            doc.close()
            print(f"OCR concluído. Texto extraído: {len(ocr_text)} caracteres", file=sys.stderr)
            return ocr_text
            
        except ImportError as e:
            print(f"Erro: Dependências OCR não instaladas: {e}", file=sys.stderr)
            return ""
        except Exception as e:
            print(f"Erro durante OCR: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return ""
    
    def parse_daily_entries(self, text: str) -> List[Dict]:
        """Extrai e analisa as entradas diárias do ponto - SOLUÇÃO UNIVERSAL"""
        # Normalizar espaços
        text = re.sub(r'\s+', ' ', text)
        
        print(f"Procurando entradas diárias no texto...", file=sys.stderr)
        
        # SOLUÇÃO UNIVERSAL: Procurar por linhas que contenham DATA + 4 campos de tempo + C.PRE
        # Padrão: DATA + qualquer coisa + 4 horários + C.PRE (06:00:00 ou 08:00:00)
        
        # Primeiro, encontrar todas as datas no texto
        data_pattern = r'(\d{2}/\d{2}/\d{4})'
        datas = re.findall(data_pattern, text)
        
        entries = []
        for data in datas:
            # Para cada data, procurar a linha correspondente
            # Padrão: DATA + qualquer coisa + 4 horários + C.PRE
            linha_pattern = rf'{re.escape(data)}[^0-9]*?([0-9]{{1,2}}:[0-9]{{2}})[^0-9]*?([0-9]{{1,2}}:[0-9]{{2}})[^0-9]*?([0-9]{{1,2}}:[0-9]{{2}})[^0-9]*?([0-9]{{1,2}}:[0-9]{{2}})[^0-9]*?(0[68]:00:00)'
            
            match = re.search(linha_pattern, text)
            if match:
                campo1 = match.group(1)
                campo2 = match.group(2)
                campo3 = match.group(3)
                campo4 = match.group(4)
                cpre = match.group(5)
                
                entry = {
                    'data': data,
                    'dia_semana': 'N/A',
                    'campo1': campo1,
                    'campo2': campo2,
                    'campo3': campo3,
                    'campo4': campo4,
                    'cpre': cpre,
                    'cpre_minutos': self.time_to_minutes(cpre)
                }
                entries.append(entry)
                print(f"Entrada encontrada: {data} - {campo1} {campo2} {campo3} {campo4} C.PRE:{cpre}")
        
        # Se não encontrou com o padrão acima, tentar padrão mais genérico
        if not entries:
            print("Tentando padrão alternativo...")
            # Procurar por qualquer sequência: DATA + 4 horários + C.PRE
            alt_pattern = r'(\d{2}/\d{2}/\d{4}).*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2}).*?(0[68]:00:00)'
            
            matches = re.finditer(alt_pattern, text)
            for match in matches:
                data = match.group(1)
                campo1 = match.group(2)
                campo2 = match.group(3)
                campo3 = match.group(4)
                campo4 = match.group(5)
                cpre = match.group(6)
                
                entry = {
                    'data': data,
                    'dia_semana': 'N/A',
                    'campo1': campo1,
                    'campo2': campo2,
                    'campo3': campo3,
                    'campo4': campo4,
                    'cpre': cpre,
                    'cpre_minutos': self.time_to_minutes(cpre)
                }
                entries.append(entry)
                print(f"Entrada alternativa: {data} - {campo1} {campo2} {campo3} {campo4} C.PRE:{cpre}")
        
        print(f"Total de {len(entries)} entradas diárias encontradas")
        return entries
    
    def time_to_minutes(self, time_str: str) -> int:
        """Converte string de tempo HH:MM:SS para minutos"""
        try:
            parts = time_str.split(':')
            if len(parts) == 3:  # HH:MM:SS
                hours = int(parts[0])
                minutes = int(parts[1])
                seconds = int(parts[2])
                return hours * 60 + minutes + seconds // 60
            elif len(parts) == 2:  # HH:MM
                hours = int(parts[0])
                minutes = int(parts[1])
                return hours * 60 + minutes
            return 0
        except:
            return 0
    
    def calculate_daily_hours(self, entry: Dict) -> Tuple[int, str]:
        """Calcula horas trabalhadas para um dia específico"""
        # Verificar se é dia especial (Feriado, Folga, etc.)
        campos = [entry['campo1'], entry['campo2'], entry['campo3'], entry['campo4']]
        
        # Verificar se algum campo contém texto (atestado, feriado, etc.)
        has_text_in_fields = any(re.search(r'[a-zA-Z]', str(campo)) for campo in campos if campo)
        
        # Verificar se todos os campos estão vazios ou contêm apenas texto
        all_empty_or_text = all(not campo or re.search(r'^[a-zA-Z\s]*$', str(campo)) for campo in campos)
        
        if has_text_in_fields and entry['cpre_minutos'] > 0:
            # Dia especial com C.PRE válido: usar C.PRE completo
            return entry['cpre_minutos'], 'Especial (C.PRE)'
        elif all_empty_or_text and entry['cpre_minutos'] > 0:
            # Campos vazios ou só texto, mas há C.PRE: usar C.PRE
            return entry['cpre_minutos'], 'C.PRE apenas'
        elif not has_text_in_fields:
            # Dia normal: calcular com regras para registros ausentes
            try:
                ent1 = self.time_to_minutes(entry['campo1'])
                sai1 = self.time_to_minutes(entry['campo2'])
                ent2 = self.time_to_minutes(entry['campo3'])
                sai2 = self.time_to_minutes(entry['campo4'])
                
                # Verificar quais registros estão presentes (> 0)
                has_ent1 = ent1 > 0
                has_sai1 = sai1 > 0
                has_ent2 = ent2 > 0
                has_sai2 = sai2 > 0
                
                # Caso ideal: todos os registros presentes
                if has_ent1 and has_sai1 and has_ent2 and has_sai2:
                    manha = sai1 - ent1
                    tarde = sai2 - ent2
                    total = manha + tarde
                    return total, 'Normal'
                
                # Caso ausente ENT1 ou SAI1: calcular apenas SAI2 - ENT2
                elif (not has_ent1 or not has_sai1) and has_ent2 and has_sai2:
                    tarde = sai2 - ent2
                    return tarde, 'Normal'
                
                # Caso ausente ENT2 ou SAI2: calcular apenas SAI1 - ENT1
                elif has_ent1 and has_sai1 and (not has_ent2 or not has_sai2):
                    manha = sai1 - ent1
                    return manha, 'Normal'
                
                # Caso faltem dados de ambos os períodos: jornada zero
                elif (not has_ent1 or not has_sai1) and (not has_ent2 or not has_sai2):
                    return 0, 'Incompleto'
                
                # Outros casos inválidos
                else:
                    return 0, 'Inválido'
                    
            except Exception as e:
                return 0, 'Erro'
        else:
            # Casos onde há texto mas não há C.PRE válido
            return 0, 'Sem C.PRE válido'
    
    def process_pdf(self, pdf_path: str) -> Dict:
        """Processa um PDF completo e retorna resultados estruturados - SOLUÇÃO DEFINITIVA"""
        print(f"Processando: {pdf_path}")
        
        # SOLUÇÃO HÍBRIDA: Extrair texto E tabelas
        text_data = self.extract_text_from_pdf(pdf_path)
        table_data = self.extract_table_data(pdf_path)
        
        if not table_data:
            return {"error": f"Falha ao extrair dados de {pdf_path}"}
        
        # Analisar estrutura dos dados extraídos
        nome, periodo = self.analyze_hybrid_structure(text_data, table_data)
        assinado = self.check_hybrid_signature(text_data, table_data, pdf_path)
        
        # Extrair entradas diárias das tabelas (MANTIDO COMO ESTAVA)
        entries = self.parse_table_entries(table_data)
        
        # Calcular totais
        total_previsto = 0
        total_realizado = 0
        dias_processados = []
        
        for entry in entries:
            total_previsto += entry['cpre_minutos']
            horas_dia, tipo = self.calculate_daily_hours(entry)
            total_realizado += horas_dia
            
            dias_processados.append({
                'data': entry['data'],
                'tipo': tipo,
                'cpre': entry['cpre'],
                'realizado': self.minutes_to_time_str(horas_dia),
                'cpre_minutos': entry['cpre_minutos'],
                'realizado_minutos': horas_dia
            })
        
        # Calcular saldo (MANTIDO COMO ESTAVA)
        saldo_minutos = total_realizado - total_previsto
        
        result = {
            'colaborador': nome,
            'periodo': periodo,
            'previsto': self.minutes_to_time_str(total_previsto),
            'realizado': self.minutes_to_time_str(total_realizado),
            'saldo': self.format_saldo(saldo_minutos),
            'assinatura': assinado,
            'saldo_minutos': saldo_minutos,
            'dias_processados': dias_processados,
            'total_previsto_minutos': total_previsto,
            'total_realizado_minutos': total_realizado
        }
        
        return result
    
    def extract_table_data(self, pdf_path: str) -> List[List[str]]:
        """Extrai dados diretamente das tabelas do PDF"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                all_data = []
                
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if row and any(cell for cell in row if cell):
                                # Limpar e normalizar cada célula
                                clean_row = []
                                for cell in row:
                                    if cell:
                                        cell_text = str(cell).strip()
                                        cell_text = self.clean_text(cell_text)
                                        clean_row.append(cell_text)
                                    else:
                                        clean_row.append("")
                                
                                if clean_row and any(cell for cell in clean_row if cell):
                                    all_data.append(clean_row)
                                    # Debug: mostrar primeiras linhas
                                    if len(all_data) <= 5:
                                        print(f"Linha {len(all_data)}: {clean_row}")
                
                print(f"Extraídas {len(all_data)} linhas de tabela")
                return all_data
                
        except Exception as e:
            print(f"Erro ao extrair tabelas: {e}")
            return []
    
    def analyze_table_structure(self, table_data: List[List[str]]) -> Tuple[str, str]:
        """Analisa a estrutura da tabela para extrair nome e período"""
        nome = "Não encontrado"
        periodo = "Não encontrado"
        
        print("=== ANALISANDO ESTRUTURA DA TABELA ===", file=sys.stderr)
        for i, row in enumerate(table_data[:10]):  # Mostrar primeiras 10 linhas
            print(f"Linha {i}: {row}", file=sys.stderr)
        
        # ESTRATÉGIA CORRIGIDA: Procurar por nome REAL do colaborador
        for i, row in enumerate(table_data):
            row_text = " ".join(row)
            
            # IGNORAR linhas que são claramente cabeçalhos ou estruturais
            if any(exclude in row_text.upper() for exclude in [
                'HORARIO DE TRABALHO', 'TRT RN I', 'FOLHA DE PONTO', 'DIA E1 S1 E2 S2',
                'DOM FOLGA FOLGA FOLGA FOLGA', 'SEG 07:30 12:00 13:00 16:30',
                'DATA', 'ENT 1 - SAI 1', 'ENT 2 - SAI 2', 'C.PRE', 'H.NOT', 'H.FAL', 'H.EXT', 'E.NOT'
            ]):
                continue
            
            # FILTRO ESPECÍFICO: Rejeitar códigos problemáticos como 'NMO PQ RQ PS RS'
            if any(code in row_text.upper() for code in ['NMO', 'PQ', 'RQ', 'PS', 'RS']):
                print(f"Rejeitando linha com códigos problemáticos: '{row_text}'", file=sys.stderr)
                continue
            
            # FILTRO ADICIONAL: Rejeitar sequências muito curtas ou que parecem códigos
            words = row_text.split()
            if len(words) <= 2 or all(len(word) <= 3 for word in words):
                print(f"Rejeitando linha com palavras muito curtas: '{row_text}'")
                continue
            
            # ESTRATÉGIA 1: Procurar por nomes que parecem reais (pessoas)
            if (len(row_text) > 15 and 
                not re.search(r'[0-9\/\-:]', row_text) and  # Sem números, datas, horários
                re.search(r'[A-Z]{3,}\s+[A-Z]{3,}', row_text) and  # Pelo menos 2 palavras longas
                not any(exclude in row_text.upper() for exclude in [
                    'CARTÃO', 'PONTO', 'EMPRESA', 'CNPJ', 'TECNOLOGIA', 'INFORMATICA',
                    'ENDEREÇO', 'RUA', 'NOVA', 'GRANADA', 'BELO', 'HORIZONTE', 'MINAS', 'GERAIS'
                ])):
                
                # Verificar se parece nome de pessoa (não muito longo, não muito curto)
                if 15 < len(row_text) < 80:
                    nome = row_text.strip()
                    print(f"Nome encontrado por análise inteligente: '{nome}'")
                    break
        
        # ESTRATÉGIA 2: Se não encontrou, procurar por padrões específicos
        if nome == "Não encontrado":
            for row in table_data:
                row_text = " ".join(row)
                # Procurar por sequências que parecem nomes completos
                if (len(row_text) > 20 and 
                    re.search(r'[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}', row_text) and
                    not re.search(r'[0-9\/\-:]', row_text) and
                    not any(exclude in row_text.upper() for exclude in [
                        'HORARIO', 'TRABALHO', 'TRT', 'RN', 'I', 'FOLGA', 'DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'
                    ])):
                    nome = row_text.strip()
                    print(f"Nome encontrado por padrão específico: '{nome}'")
                    break
        
        # Procurar por datas para determinar período (MANTIDO COMO ESTAVA)
        for row in table_data:
            row_text = " ".join(row)
            data_match = re.search(r'(\d{2}/\d{2}/\d{4})', row_text)
            if data_match:
                data = data_match.group(1)
                date_parts = data.split('/')
                if len(date_parts) >= 2:
                    mes = date_parts[1].zfill(2)
                    ano = date_parts[2]
                    if len(ano) == 2:
                        ano = f"20{ano}"
                    periodo = f"{mes}/{ano}"
                    print(f"Período determinado: {periodo}")
                    break
        
        return nome, periodo
    
    def check_table_signature(self, table_data: List[List[str]]) -> bool:
        """Verifica assinatura baseada nos dados da tabela - MELHORADO E MAIS ESPECÍFICO"""
        for row in table_data:
            row_text = " ".join(str(cell) for cell in row if cell).lower()
            
            # Padrões específicos para assinatura digital (alta confiança)
            specific_patterns = [
                'assinado digitalmente',
                'assinatura digital',
                'documento assinado digitalmente',
                'ponto assinado digitalmente',
                'assinado eletronicamente',
                'assinatura eletrônica',
                'certificado digital',
                'validação digital',
                'autenticação digital',
                'colaborador assinou digitalmente'
            ]
            
            # Padrões de CPF formatado (média confiança)
            import re
            cpf_patterns = [
                r'cpf\s*:\s*[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}',
                r'cpf\s*[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}',
                r'[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}'
            ]
            
            # Padrões genéricos (baixa confiança)
            generic_patterns = [
                'documento assinado',
                'ponto assinado',
                'colaborador assinou',
                'verificado digitalmente',
                'validado digitalmente',
                'assinado por'
            ]
            
            # Verificar padrões específicos primeiro
            for pattern in specific_patterns:
                if pattern in row_text:
                    print(f"Assinatura digital detectada na tabela: '{pattern}' em '{row_text[:100]}...'")
                    return True
            
            # Verificar padrões de CPF
            for pattern in cpf_patterns:
                if re.search(pattern, row_text):
                    print(f"Assinatura detectada via CPF na tabela: '{pattern}' em '{row_text[:100]}...'")
                    return True
            
            # Verificar padrões genéricos
            for pattern in generic_patterns:
                if pattern in row_text:
                    print(f"Possível assinatura detectada na tabela: '{pattern}' em '{row_text[:100]}...'")
                    return True
        
        print("Nenhuma assinatura detectada nas tabelas")
        return False
    
    def parse_table_entries(self, table_data: List[List[str]]) -> List[Dict]:
        """Extrai entradas diárias diretamente das tabelas - CORRIGIDO"""
        entries = []
        
        for row in table_data:
            # Verificar se a linha tem pelo menos 4 colunas e contém uma data
            if len(row) >= 4:
                # Procurar por data na primeira coluna
                data_match = re.search(r'(\d{2}/\d{2}/\d{4})', str(row[0]))
                if data_match:
                    data = data_match.group(1)
                    
                    # Extrair horários das colunas 1 e 2 (Ent 1 - Sai 1, Ent 2 - Sai 2)
                    ent1_sai1 = str(row[1]) if len(row) > 1 else ''
                    ent2_sai2 = str(row[2]) if len(row) > 2 else ''
                    cpre = str(row[3]) if len(row) > 3 else '08:00:00'
                    
                    # Extrair horários individuais
                    horarios_1 = re.findall(r'(\d{1,2}:\d{2})', ent1_sai1)
                    horarios_2 = re.findall(r'(\d{1,2}:\d{2})', ent2_sai2)
                    
                    # Organizar os 4 horários: ENT1, SAI1, ENT2, SAI2
                    campo1 = horarios_1[0] if len(horarios_1) > 0 else ''
                    campo2 = horarios_1[1] if len(horarios_1) > 1 else ''
                    campo3 = horarios_2[0] if len(horarios_2) > 0 else ''
                    campo4 = horarios_2[1] if len(horarios_2) > 1 else ''
                    
                    # Verificar se C.PRE é válido
                    if not re.match(r'0[68]:00:00', cpre):
                        cpre = '08:00:00'  # Padrão
                    
                    # Não pular entradas com ATEST, FOLGA, etc. se há C.PRE válido
                    # Essas entradas devem ser consideradas na jornada mensal
                    # if any(skip in ent1_sai1.upper() for skip in ['ATEST', 'FOLGA', 'FALTA']):
                    #     continue
                    
                    entry = {
                        'data': data,
                        'dia_semana': 'N/A',
                        'campo1': campo1,  # ENT1
                        'campo2': campo2,  # SAI1
                        'campo3': campo3,  # ENT2
                        'campo4': campo4,  # SAI2
                        'cpre': cpre,
                        'cpre_minutos': self.time_to_minutes(cpre)
                    }
                    entries.append(entry)
                    print(f"Entrada da tabela: {data} - ENT1:{campo1} SAI1:{campo2} ENT2:{campo3} SAI2:{campo4} C.PRE:{cpre}")
        
        print(f"Total de {len(entries)} entradas extraídas das tabelas")
        return entries
    
    def analyze_hybrid_structure(self, text_data: str, table_data: List[List[str]]) -> Tuple[str, str]:
        """Analisa estrutura combinando texto e tabelas para extrair nome e período"""
        nome = "Não encontrado"
        periodo = "Não encontrado"
        
        print("=== ANÁLISE HÍBRIDA: TEXTO + TABELAS ===", file=sys.stderr)
        
        # ESTRATÉGIA 1: Procurar nome no texto extraído
        if text_data:
            print(f"Texto extraído (primeiros 300 chars): {text_data[:300]}")
            
            # ESTRATÉGIA UNIVERSAL: Procurar por QUALQUER nome de colaborador no texto
            print("=== PROCURANDO NOME DO COLABORADOR ===", file=sys.stderr)
            
            # ESTRATÉGIA DIRETA: Procurar por padrões específicos no texto completo
            # Padrão 1: Nome antes de "Período"
            nome_match = re.search(r'([A-Z][A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]+?)(?=\s*-\s*Período)', text_data)
            if nome_match:
                nome_candidato = nome_match.group(1).strip()
                # Filtrar códigos problemáticos
                if (len(nome_candidato) > 10 and 
                    not any(code in nome_candidato.upper() for code in ['NMO', 'PQ', 'RQ', 'PS', 'RS'])):
                    nome = nome_candidato
                    print(f"Nome encontrado por padrão 'Período': '{nome}'")
            
            # Padrão 2: Se não encontrou, procurar por sequências de palavras em maiúsculo
            if nome == "Não encontrado":
                nome_match = re.search(r'([A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,})', text_data)
                if nome_match:
                    nome_candidato = nome_match.group(1).strip()
                    # Verificar se não é cabeçalho, estrutura ou códigos problemáticos
                    if (not any(exclude in nome_candidato.upper() for exclude in [
                        'HORARIO DE TRABALHO', 'TRT RN I', 'DOM FOLGA FOLGA', 'SEG 07:30 12:00'
                    ]) and not any(code in nome_candidato.upper() for code in ['NMO', 'PQ', 'RQ', 'PS', 'RS'])):
                        nome = nome_candidato
                        print(f"Nome encontrado por padrão de palavras: '{nome}'")
            
            # Padrão 3: Se ainda não encontrou, procurar por qualquer sequência longa em maiúsculo
            if nome == "Não encontrado":
                nome_match = re.search(r'([A-Z][A-Z\sÇÁÉÍÓÚÀÂÊÔÃÕ\-]{20,})', text_data)
                if nome_match:
                    nome_candidato = nome_match.group(1).strip()
                    # Filtrar nomes que parecem reais e códigos problemáticos
                    if (len(nome_candidato) > 20 and 
                        not re.search(r'[0-9\/\-:]', nome_candidato) and
                        not any(exclude in nome_candidato.upper() for exclude in [
                            'CARTÃO', 'PONTO', 'EMPRESA', 'CNPJ', 'TECNOLOGIA', 'INFORMATICA',
                            'ENDEREÇO', 'RUA', 'NOVA', 'GRANADA', 'BELO', 'HORIZONTE', 'MINAS', 'GERAIS'
                        ]) and not any(code in nome_candidato.upper() for code in ['NMO', 'PQ', 'RQ', 'PS', 'RS'])):
                        nome = nome_candidato
                        print(f"Nome encontrado por padrão genérico: '{nome}'")
            
            # ESTRATÉGIA 4: Se não encontrou no texto, procurar nas tabelas
            if nome == "Não encontrado":
                nome, periodo = self.analyze_table_structure(table_data)
        
        # ESTRATÉGIA 3: Se ainda não encontrou, procurar por padrões específicos no texto
        if nome == "Não encontrado" and text_data:
            # Procurar por sequências que parecem nomes completos
            lines = text_data.split('\n')
            for line in lines:
                line = line.strip()
                # Verificar se a linha tem características de nome completo e não contém códigos problemáticos
                if (len(line) > 20 and 
                    re.search(r'[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}', line) and
                    not re.search(r'[0-9\/\-]', line) and
                    not any(exclude in line.upper() for exclude in ['CARTÃO', 'PONTO', 'HORARIO', 'TRABALHO', 'EMPRESA', 'CNPJ']) and
                    not any(code in line.upper() for code in ['NMO', 'PQ', 'RQ', 'PS', 'RS'])):
                    nome = line.strip()
                    print(f"Nome encontrado por análise de linha: '{nome}'")
                    break
        
        # Procurar período (priorizar tabelas, depois texto)
        if periodo == "Não encontrado":
            for row in table_data:
                row_text = " ".join(row)
                data_match = re.search(r'(\d{2}/\d{2}/\d{4})', row_text)
                if data_match:
                    data = data_match.group(1)
                    date_parts = data.split('/')
                    if len(date_parts) >= 2:
                        mes = date_parts[1].zfill(2)
                        ano = date_parts[2]
                        if len(ano) == 2:
                            ano = f"20{ano}"
                        periodo = f"{mes}/{ano}"
                        print(f"Período determinado: {periodo}")
                        break
        
        return nome, periodo
    
    def check_hybrid_signature(self, text_data: str, table_data: List[List[str]], pdf_path: str = None) -> bool:
        """Verifica assinatura apenas no texto - COM OCR"""
        # Verificar apenas no texto extraído do PDF
        if text_data:
            return self.check_digital_signature(text_data, pdf_path)
        
        return False
    
    def minutes_to_time_str(self, minutes: int) -> str:
        """Converte minutos para string HH:MM"""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"
    
    def format_saldo(self, saldo_minutos: int) -> str:
        """Formata saldo como +/-HH:MM"""
        sign = "-" if saldo_minutos < 0 else "+"
        abs_minutes = abs(saldo_minutos)
        hours = abs_minutes // 60
        mins = abs_minutes % 60
        return f"{sign}{hours:02d}:{mins:02d}"
    
    def save_to_csv(self, results: List[Dict], output_path: str):
        """Salva resultados em CSV - APENAS colaboradores válidos"""
        try:
            # Preparar dados para CSV - apenas o resumo principal E colaboradores válidos
            csv_data = []
            for result in results:
                if 'error' not in result:
                    # VALIDAÇÃO FINAL: Só incluir colaboradores válidos
                    if self.validate_colaborador_name(result['colaborador']):
                        # Apenas o resumo principal, sem detalhes diários
                        csv_data.append({
                            'colaborador': result['colaborador'],
                            'periodo': result['periodo'],
                            'previsto': result['previsto'],
                            'realizado': result['realizado'],
                            'saldo': result['saldo'],
                            'assinatura': 'Sim' if result['assinatura'] else 'Não',
                            'saldo_minutos': result['saldo_minutos']
                        })
                        print(f"✅ Colaborador '{result['colaborador']}' incluído no CSV", file=sys.stderr)
                    else:
                        print(f"❌ Colaborador '{result['colaborador']}' EXCLUÍDO do CSV (não está na lista válida)", file=sys.stderr)
            
            print(f"Preparando {len(csv_data)} registros para CSV")
            
            # Salvar CSV
            df = pd.DataFrame(csv_data)
            
            # Garantir que o diretório existe
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
                print(f"[OK] Diretório criado: {output_dir}", file=sys.stderr)
            
            # Salvar CSV
            df.to_csv(output_path, index=False, encoding='utf-8-sig')
            print(f"[OK] CSV salvo com sucesso em: {output_path}", file=sys.stderr)
            print(f"[OK] Tamanho do arquivo: {os.path.getsize(output_path)} bytes", file=sys.stderr)
            
            # Verificar se o arquivo foi realmente criado
            if os.path.exists(output_path):
                print(f"[OK] Arquivo confirmado no sistema: {output_path}", file=sys.stderr)
            else:
                print(f"[ERRO] Arquivo não foi criado: {output_path}")
                
        except Exception as e:
            print(f"[ERRO] ao salvar CSV: {e}")
            print(f"Diretório atual: {os.getcwd()}")
            print(f"Caminho tentado: {output_path}")
            raise
        
        # Salvar detalhes diários em arquivo separado (opcional) - APENAS colaboradores válidos
        detalhes_path = output_path.replace('.csv', '_detalhes.csv')
        detalhes_data = []
        for result in results:
            if 'error' not in result:
                # VALIDAÇÃO FINAL: Só incluir colaboradores válidos nos detalhes também
                if self.validate_colaborador_name(result['colaborador']):
                    for dia in result['dias_processados']:
                        detalhes_data.append({
                            'colaborador': result['colaborador'],
                            'periodo': result['periodo'],
                            'data': dia['data'],
                            'tipo_dia': dia['tipo'],
                            'cpre': dia['cpre'],
                            'realizado': dia['realizado'],
                            'cpre_minutos': dia['cpre_minutos'],
                            'realizado_minutos': dia['realizado_minutos']
                        })
        
        if detalhes_data:
            df_detalhes = pd.DataFrame(detalhes_data)
            df_detalhes.to_csv(detalhes_path, index=False, encoding='utf-8-sig')
            print(f"Detalhes diários salvos em: {detalhes_path}")
    
    def process_multiple_pdfs(self, pdf_paths: List[str]) -> List[Dict]:
        """Processa múltiplos PDFs"""
        results = []
        for pdf_path in pdf_paths:
            try:
                result = self.process_pdf(pdf_path)
                results.append(result)
                print(f"SUCESSO: {pdf_path} processado com sucesso")
            except Exception as e:
                error_result = {"error": f"Erro ao processar {pdf_path}: {str(e)}"}
                results.append(error_result)
                print(f"ERRO: {pdf_path} falhou: {e}")
        
        return results

def main():
    """Função principal com suporte a argumentos de linha de comando"""
    try:
        print("=== INICIANDO FUNÇÃO MAIN ===", file=sys.stderr)
        
        parser = argparse.ArgumentParser(description='Processa PDFs de ponto e gera CSV')
        parser.add_argument('--pdfs', nargs='+', help='Caminhos para os PDFs a serem processados')
        parser.add_argument('--output', default='resultados_ponto.csv', help='Nome do arquivo CSV de saída')
        
        args = parser.parse_args()
        print(f"Argumentos recebidos: {args}")
        
        processor = PontoProcessor()
        print("[OK] Processador inicializado", file=sys.stderr)
        
        if args.pdfs:
            # Processar PDFs especificados
            pdf_files = args.pdfs
            print(f"[OK] Processando PDFs especificados: {pdf_files}", file=sys.stderr)
        else:
            # Modo automático: procurar PDFs no diretório atual
            pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf') and 'ponto' in f.lower()]
            if not pdf_files:
                print("[AVISO] Nenhum PDF de ponto encontrado no diretório atual")
                return
            print(f"[OK] PDFs encontrados automaticamente: {pdf_files}", file=sys.stderr)
        
        # Verificar se os arquivos existem
        for pdf_file in pdf_files:
            if not os.path.exists(pdf_file):
                print(f"[ERRO] Arquivo não encontrado: {pdf_file}")
                return
        
        print(f"[OK] Todos os {len(pdf_files)} PDFs existem", file=sys.stderr)
        
        # Processar todos os PDFs
        print("=== INICIANDO PROCESSAMENTO ===", file=sys.stderr)
        results = processor.process_multiple_pdfs(pdf_files)
        print(f"[OK] Processamento concluído: {len(results)} resultados", file=sys.stderr)
        
        # Salvar resultados em CSV
        print("=== SALVANDO CSV ===", file=sys.stderr)
        processor.save_to_csv(results, args.output)
        print("[OK] CSV salvo com sucesso", file=sys.stderr)
        
        # Mostrar resumo
        print("\n=== RESUMO DOS RESULTADOS ===", file=sys.stderr)
        for result in results:
            if 'error' not in result:
                print(f"[OK] {result['colaborador']} - {result['periodo']}: {result['saldo']} ({result['assinatura']})", file=sys.stderr)
            else:
                print(f"[ERRO] {result['error']}")
        
        # Retornar resultados como JSON para a API
        if len(sys.argv) > 1:  # Se chamado via linha de comando
            print("\n=== RESULTADOS JSON ===", file=sys.stderr)
            print(json.dumps(results, indent=2, ensure_ascii=False))
        
        print("=== PROCESSAMENTO CONCLUÍDO COM SUCESSO ===", file=sys.stderr)
        
    except Exception as e:
        print(f"[ERRO] CRÍTICO na função main: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
