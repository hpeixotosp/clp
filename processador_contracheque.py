import sys
import json
import re
import os
from pathlib import Path
import backend_pdf_processor
from typing import List, Dict, Any

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extrai texto de um PDF usando backend_pdf_processor com OCR otimizado"""
    try:
        processor = backend_pdf_processor.PontoProcessor()
        # Primeiro tentar extração normal
        text = processor.extract_text_from_pdf(pdf_path)
        
        # Se o texto for muito pequeno ou não contém letras, tentar OCR
        if len(text.strip()) < 100 or not re.search(r'[A-Za-z]', text):
            print(f"Texto extraído insuficiente, tentando OCR...", file=sys.stderr)
            ocr_text = processor.extract_text_with_ocr(pdf_path)
            if len(ocr_text) > len(text):
                text = ocr_text
        
        print(f"Texto extraído de {pdf_path} usando backend_pdf_processor", file=sys.stderr)
        return text
    
    except Exception as e:
        print(f"Erro ao extrair texto de {pdf_path}: {e}", file=sys.stderr)
        return ""

def extract_colaborador_name(text: str) -> str:
    """Extrai o nome do colaborador do contracheque com logs detalhados"""
    print(f"🔍 DEBUG_NOME - Iniciando extração de nome do colaborador", file=sys.stderr)
    print(f"🔍 DEBUG_NOME - Tamanho do texto: {len(text)} caracteres", file=sys.stderr)
    
    # Mostrar as primeiras 15 linhas não vazias para debug
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    print(f"🔍 DEBUG_NOME - Primeiras 15 linhas não vazias:", file=sys.stderr)
    for i, line in enumerate(lines[:15]):
        print(f"  {i+1}: {line}", file=sys.stderr)
    
    print(f"🔍 DEBUG_NOME - Texto para análise (primeiros 500 chars): {text[:500]}", file=sys.stderr)
    
    # Padrões para extrair nome do colaborador (reordenados por prioridade)
    patterns = [
        # Padrão específico para TRT - nome após número e antes de números
        r'\b\d{3,4}\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{10,50})\s+\d{4,6}\s+\d{1,2}\s+\d',
        
        # Padrão específico para TRT - nome após matrícula e antes do cargo
        r'\b(\d{4,6})\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)\s+\d{4,6}\s+\d{1,2}\s+\d',
        
        # Padrão para nome após matrícula
        r'\b\d{4,6}\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,50})(?=\s+[A-Z]{3,}|\s+\d)',
        
        # Padrão 1: Nome após "Matrícula" ou "Período"
        r'(?:Matrícula|Período)\s*[:\-]?\s*\d+[^\n]*?([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,4})\s*(?:\n|$)',
        
        # Padrão 2: Nome após matrícula (4-6 dígitos)
        r'\b\d{4,6}\b[^\n]*?([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,4})\s*(?:\n|$)',
        
        # Padrão 3: Nome em linha isolada (2-4 palavras)
        r'^\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,3})\s*$',
        
        # Padrão 4: Nome após "Nome:" ou "Colaborador:"
        r'(?:Nome|Colaborador)\s*[:\-]?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,4})',
        
        # Padrão 5: Nome após "Funcionário:"
        r'Funcionário\s*[:\-]?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,4})',
        
        # Padrão 6: Nome no início de linha seguido de dados
        r'^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,4})\s+\d',
    ]
    
    for i, pattern in enumerate(patterns, 1):
        print(f"🔍 DEBUG_NOME - Testando padrão {i}: {pattern[:50]}...", file=sys.stderr)
        
        if i == 1:  # Padrão específico TRT - nome direto
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                nome = match.group(1).strip()  # Primeiro grupo é o nome
                print(f"✅ DEBUG_NOME - Nome encontrado com padrão TRT {i}: '{nome}'", file=sys.stderr)
                return nome
        elif i == 2:  # Padrão específico TRT com 2 grupos
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                nome = match.group(2).strip()  # Segundo grupo é o nome
                print(f"✅ DEBUG_NOME - Nome encontrado com padrão TRT {i}: '{nome}'", file=sys.stderr)
                return nome
        elif i == 5:  # Padrão de linha isolada
            for line in text.split('\n'):
                match = re.search(pattern, line.strip(), re.MULTILINE)
                if match:
                    nome = match.group(1).strip()
                    print(f"✅ DEBUG_NOME - Nome encontrado com padrão {i}: '{nome}'", file=sys.stderr)
                    return nome
        else:
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                nome = match.group(1).strip()
                print(f"✅ DEBUG_NOME - Nome encontrado com padrão {i}: '{nome}'", file=sys.stderr)
                return nome
    
    print(f"❌ DEBUG_NOME - Nenhum nome encontrado com os padrões disponíveis", file=sys.stderr)
    return None

def extract_mes_referencia(text: str) -> str:
    """Extrai o mês de referência do contracheque"""
    patterns = [
        r'(?:Mês|Período|Referência)\s*[:\-]?\s*(\d{2}/\d{4})',
        r'(\d{2}/\d{4})',
        r'(?:Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s*/\s*(\d{4})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extract_valores(text: str) -> Dict[str, str]:
    """Extrai valores do contracheque"""
    valores = {
        'vencimentos': None,
        'descontos': None,
        'liquido': None
    }
    
    # Padrões para extrair valores
    patterns = {
        'vencimentos': [
            r'(?:Total\s+de\s+)?Vencimentos\s*[:\-]?\s*R?\$?\s*([\d.,]+)',
            r'Proventos\s*[:\-]?\s*R?\$?\s*([\d.,]+)',
            r'Total\s+Vencimentos\s*[:\-]?\s*R?\$?\s*([\d.,]+)'
        ],
        'descontos': [
            r'(?:Total\s+de\s+)?Descontos\s*[:\-]?\s*R?\$?\s*([\d.,]+)',
            r'Total\s+Descontos\s*[:\-]?\s*R?\$?\s*([\d.,]+)'
        ],
        'liquido': [
            r'(?:Valor\s+)?Líquido\s*[:\-]?\s*R?\$?\s*([\d.,]+)',
            r'Total\s+Líquido\s*[:\-]?\s*R?\$?\s*([\d.,]+)',
            r'Líquido\s+a\s+Receber\s*[:\-]?\s*R?\$?\s*([\d.,]+)'
        ]
    }
    
    for tipo, tipo_patterns in patterns.items():
        for pattern in tipo_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                valores[tipo] = match.group(1)
                break
    
    return valores

def extract_dados_bancarios(text: str) -> Dict[str, str]:
    """Extrai dados bancários do documento"""
    dados = {
        'banco': None,
        'agencia': None,
        'conta': None
    }
    
    # Padrões para extrair dados bancários
    banco_pattern = r'Banco\s*[:\-]?\s*([\d\-\s]+[A-Za-z\s]*[A-Za-z]+)'
    agencia_pattern = r'Agência\s*[:\-]?\s*([\d\-]+)'
    conta_pattern = r'Conta\s*[:\-]?\s*([\d\-]+)'
    
    banco_match = re.search(banco_pattern, text, re.IGNORECASE)
    if banco_match:
        dados['banco'] = banco_match.group(1).strip()
    
    agencia_match = re.search(agencia_pattern, text, re.IGNORECASE)
    if agencia_match:
        dados['agencia'] = agencia_match.group(1).strip()
    
    conta_match = re.search(conta_pattern, text, re.IGNORECASE)
    if conta_match:
        dados['conta'] = conta_match.group(1).strip()
    
    return dados

def normalize_money_value(value_str: str) -> float:
    """Normaliza valor monetário para float"""
    if not value_str:
        return 0.0
    
    # Remove símbolos e espaços
    clean_value = re.sub(r'[R$\s]', '', value_str)
    
    # Substitui vírgula por ponto se for o separador decimal
    if ',' in clean_value and '.' in clean_value:
        # Se tem ambos, vírgula é separador de milhares
        clean_value = clean_value.replace(',', '')
    elif ',' in clean_value:
        # Se só tem vírgula, é separador decimal
        clean_value = clean_value.replace(',', '.')
    
    try:
        return float(clean_value)
    except ValueError:
        return 0.0

def validate_calculo(vencimentos: str, descontos: str, liquido: str) -> bool:
    """Valida se o cálculo está correto: líquido = vencimentos - descontos"""
    try:
        venc_val = normalize_money_value(vencimentos)
        desc_val = normalize_money_value(descontos)
        liq_val = normalize_money_value(liquido)
        
        calculado = venc_val - desc_val
        diferenca = abs(calculado - liq_val)
        
        # Tolerância de 1 centavo
        return diferenca <= 0.01
    except:
        return False

def classify_document(text: str) -> str:
    """Classifica o documento como contracheque ou recibo"""
    contracheque_keywords = ['contracheque', 'folha de pagamento', 'vencimentos', 'descontos', 'folhamensal', 'diasnormais', 'inss']
    recibo_keywords = ['recibo', 'comprovante de pagamento', 'depósito', 'transferência', 'pagamento', 'ted', 'pix', 'banco', 'agencia', 'conta']
    
    text_lower = text.lower()
    
    # Verificar se contém palavras-chave específicas de contracheque
    contracheque_score = sum(1 for keyword in contracheque_keywords if keyword in text_lower)
    recibo_score = sum(1 for keyword in recibo_keywords if keyword in text_lower)
    
    # Se o nome do arquivo contém 'Pagamento', é provavelmente um recibo
    if 'pagamento' in text_lower or 'comprovante' in text_lower:
        recibo_score += 2
    
    # Se contém estrutura típica de contracheque (vencimentos/descontos)
    if 'totaldevencimentos' in text_lower and 'totaldedescontos' in text_lower:
        contracheque_score += 2
    
    print(f"📊 DEBUG_CLASSIFICACAO - Contracheque score: {contracheque_score}, Recibo score: {recibo_score}", file=sys.stderr)
    
    if contracheque_score > recibo_score:
        return 'contracheque'
    elif recibo_score > contracheque_score:
        return 'recibo'
    else:
        return 'indefinido'

def process_documents(pdf_paths: List[str]) -> List[Dict[str, Any]]:
    """Processa múltiplos documentos PDF"""
    results = []
    
    try:
        print(f"📋 DEBUG_PROCESSAMENTO - Iniciando processamento de {len(pdf_paths)} documentos", file=sys.stderr)
        
        # Extrair texto de todos os PDFs e classificar
        documentos = []
        for path in pdf_paths:
            print(f"📄 DEBUG_PROCESSAMENTO - Extraindo texto de: {path}", file=sys.stderr)
            text = extract_text_from_pdf(path)
            if text:
                # Incluir o nome do arquivo na classificação
                text_with_filename = text + " " + path.lower()
                tipo = classify_document(text_with_filename)
                documentos.append({
                    'path': path,
                    'text': text,
                    'tipo': tipo,
                    'filename': os.path.basename(path)
                })
                print(f"📄 DEBUG_PROCESSAMENTO - Documento classificado como: {tipo}", file=sys.stderr)
            else:
                print(f"❌ DEBUG_PROCESSAMENTO - Falha ao extrair texto de: {path}", file=sys.stderr)
        
        # Separar contracheques e recibos
        contracheques = [doc for doc in documentos if doc['tipo'] == 'contracheque']
        recibos = [doc for doc in documentos if doc['tipo'] == 'recibo']
        
        print(f"📊 DEBUG_PROCESSAMENTO - Total identificado: {len(contracheques)} contracheques, {len(recibos)} recibos", file=sys.stderr)
        
        # Processar cada contracheque
        for idx, contracheque in enumerate(contracheques):
            try:
                print(f"\n🔄 DEBUG_PROCESSAMENTO - Processando contracheque {idx+1}/{len(contracheques)}: {contracheque['path']}", file=sys.stderr)
                text = contracheque['text']
                
                # Verificar se o texto foi extraído corretamente
                if not text or len(text.strip()) < 50:
                    print(f"⚠️ DEBUG_PROCESSAMENTO - Texto muito pequeno ou vazio ({len(text)} chars), pulando...", file=sys.stderr)
                    continue
                
                # Extrair dados do contracheque
                print(f"📝 DEBUG_PROCESSAMENTO - Extraindo nome do colaborador...", file=sys.stderr)
                colaborador = extract_colaborador_name(text)
                print(f"📝 DEBUG_PROCESSAMENTO - Nome extraído: '{colaborador}'", file=sys.stderr)
                
                # Se não conseguiu extrair o nome, pular este documento
                if not colaborador:
                    print(f"❌ DEBUG_PROCESSAMENTO - Nome não encontrado, pulando documento...", file=sys.stderr)
                    continue
                
                print(f"📅 DEBUG_PROCESSAMENTO - Extraindo mês de referência...", file=sys.stderr)
                mes_ref = extract_mes_referencia(text)
                print(f"📅 DEBUG_PROCESSAMENTO - Mês extraído: '{mes_ref}'", file=sys.stderr)
                
                print(f"💰 DEBUG_PROCESSAMENTO - Extraindo valores...", file=sys.stderr)
                valores = extract_valores(text)
                print(f"💰 DEBUG_PROCESSAMENTO - Valores extraídos: {valores}", file=sys.stderr)
                
                dados_bancarios = extract_dados_bancarios(text)
            
                # Validar cálculo
                calculo_ok = validate_calculo(
                    valores['vencimentos'],
                    valores['descontos'], 
                    valores['liquido']
                )
                
                # Verificar assinatura digital
                print(f"🔐 DEBUG_ASSINATURA - Verificando assinatura digital...", file=sys.stderr)
                processor = backend_pdf_processor.PontoProcessor()
                tem_assinatura = processor.check_digital_signature(text, contracheque['path'])
                print(f"🔐 DEBUG_ASSINATURA - Assinatura encontrada: {tem_assinatura}", file=sys.stderr)
                
                # Procurar recibo correspondente
                recibo_correspondente = None
                dados_bancarios_recibo = None
                valor_depositado = None
                
                print(f"🔍 DEBUG_VALIDACAO - Procurando recibo para colaborador: '{colaborador}'", file=sys.stderr)
                print(f"🔍 DEBUG_VALIDACAO - Total de recibos disponíveis: {len(recibos)}", file=sys.stderr)
                
                # Função para normalizar nomes para comparação
                def normalize_name_for_comparison(name):
                    if not name:
                        return ""
                    # Remove acentos, converte para minúsculas e remove espaços extras
                    import unicodedata
                    normalized = unicodedata.normalize('NFD', name.lower())
                    normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
                    return ' '.join(normalized.split())
                
                def extract_colaborador_name_from_recibo(text):
                    """Extrai nome do colaborador especificamente de recibos"""
                    patterns = [
                        # Padrão para recibos bancários - nome após "Para:" ou "Favorecido:"
                        r'(?:Para|Favorecido|Beneficiário)\s*[:\-]?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,50})',
                        # Padrão para nome em linha isolada (comum em recibos)
                        r'^\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{15,50})\s*$',
                        # Padrão para nome após CPF
                        r'CPF[^\n]*?([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,50})',
                        # Padrão genérico para nomes em maiúsculas
                        r'\b([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,}\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,}(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,})*)',
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
                        for match in matches:
                            nome = match.strip()
                            # Filtrar nomes muito genéricos ou inválidos
                            if (len(nome) > 10 and 
                                not any(word in nome.upper() for word in ['BANCO', 'AGENCIA', 'CONTA', 'VALOR', 'DATA', 'COMPROVANTE', 'SISPAG', 'SALARIOS']) and
                                len(nome.split()) >= 2):
                                return nome
                    return None
                
                def extract_valor_from_recibo(text):
                    """Extrai valor do recibo para correspondência"""
                    patterns = [
                        r'Valor[:\s]*([\d.,]+)',
                        r'R\$[\s]*([\d.,]+)',
                        r'([\d]{1,3}(?:\.[\d]{3})*,\d{2})',
                        r'\b([\d]{1,3}(?:\.[\d]{3})*,\d{2})\b',
                        r'([\d]+,\d{2})'
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, text)
                        for match in matches:
                            # Verificar se é um valor monetário válido
                            if ',' in match and len(match.split(',')[1]) == 2:
                                valor = match.replace('.', '').replace(',', '.')
                                try:
                                    valor_float = float(valor)
                                    if valor_float > 0:  # Apenas valores positivos
                                        return match
                                except:
                                    continue
                    return None
                
                def check_filename_correspondence(filename, colaborador_name):
                    """Verifica correspondência baseada no nome do arquivo"""
                    if not filename or not colaborador_name:
                        return False
                    
                    filename_lower = filename.lower()
                    colaborador_lower = colaborador_name.lower()
                    
                    # Remover espaços e caracteres especiais para comparação
                    colaborador_clean = re.sub(r'[^a-z]', '', colaborador_lower)
                    
                    # Verificar se o nome do colaborador aparece no nome do arquivo
                    return colaborador_clean in re.sub(r'[^a-z]', '', filename_lower)
                
                colaborador_normalizado = normalize_name_for_comparison(colaborador)
                print(f"🔍 DEBUG_VALIDACAO - Nome normalizado: '{colaborador_normalizado}'", file=sys.stderr)
                
                for i, recibo in enumerate(recibos):
                    recibo_text = recibo['text']
                    print(f"🔍 DEBUG_VALIDACAO - Verificando recibo {i+1}: primeiros 200 chars: {recibo_text[:200]}", file=sys.stderr)
                    
                    # Tentar extrair nome do recibo usando padrões específicos
                    nome_recibo = extract_colaborador_name_from_recibo(recibo_text)
                    if not nome_recibo:
                        # Fallback: tentar extrair com padrões de contracheque
                        nome_recibo = extract_colaborador_name(recibo_text)
                    
                    print(f"🔍 DEBUG_VALIDACAO - Nome extraído do recibo {i+1}: '{nome_recibo}'", file=sys.stderr)
                    
                    # Extrair valor do recibo para correspondência alternativa
                    valor_recibo = extract_valor_from_recibo(recibo_text)
                    print(f"🔍 DEBUG_VALIDACAO - Valor extraído do recibo {i+1}: '{valor_recibo}'", file=sys.stderr)
                    
                    # Verificar correspondência de várias formas
                    correspondencia_encontrada = False
                    
                    # 1. Correspondência por nome (se disponível)
                    if nome_recibo and colaborador and colaborador_normalizado:
                        nome_recibo_normalizado = normalize_name_for_comparison(nome_recibo)
                        print(f"🔍 DEBUG_VALIDACAO - Comparando '{colaborador_normalizado}' com '{nome_recibo_normalizado}'", file=sys.stderr)
                        
                        # 1a. Verificação exata (nome completo)
                        if colaborador_normalizado == nome_recibo_normalizado:
                            correspondencia_encontrada = True
                            print(f"✅ DEBUG_VALIDACAO - Correspondência exata por nome encontrada", file=sys.stderr)
                        
                        # 1b. Verificação por partes do nome (pelo menos 2 palavras)
                        elif len(colaborador_normalizado.split()) >= 2:
                            palavras_colaborador = colaborador_normalizado.split()
                            # Verificar se pelo menos 2 palavras do nome aparecem no recibo
                            palavras_encontradas = sum(1 for palavra in palavras_colaborador 
                                                     if len(palavra) > 2 and palavra in nome_recibo_normalizado)
                            
                            if palavras_encontradas >= 2:
                                correspondencia_encontrada = True
                                print(f"✅ DEBUG_VALIDACAO - Correspondência parcial encontrada ({palavras_encontradas} palavras)", file=sys.stderr)
                            else:
                                print(f"❌ DEBUG_VALIDACAO - Poucas palavras encontradas ({palavras_encontradas})", file=sys.stderr)
                        
                        # 1c. Verificação pelo primeiro e último nome
                        elif len(colaborador_normalizado.split()) >= 2:
                            palavras = colaborador_normalizado.split()
                            primeiro_nome = palavras[0]
                            ultimo_nome = palavras[-1]
                            
                            if (len(primeiro_nome) > 2 and primeiro_nome in nome_recibo_normalizado and 
                                len(ultimo_nome) > 2 and ultimo_nome in nome_recibo_normalizado):
                                correspondencia_encontrada = True
                                print(f"✅ DEBUG_VALIDACAO - Correspondência por primeiro e último nome", file=sys.stderr)
                    
                    # 2. Correspondência por valor (quando nome não está disponível)
                    if not correspondencia_encontrada and valor_recibo and valores['liquido']:
                        # Normalizar valores para comparação
                        valor_recibo_norm = normalize_money_value(valor_recibo)
                        liquido_norm = normalize_money_value(valores['liquido'])
                        
                        # Verificar se os valores são iguais (com tolerância de 0.01)
                        if abs(valor_recibo_norm - liquido_norm) <= 0.01:
                            correspondencia_encontrada = True
                            print(f"✅ DEBUG_VALIDACAO - Correspondência por valor encontrada: {valor_recibo} = {valores['liquido']}", file=sys.stderr)
                        else:
                            print(f"❌ DEBUG_VALIDACAO - Valores não conferem: {valor_recibo} ≠ {valores['liquido']}", file=sys.stderr)
                    
                    # 3. Correspondência por nome do arquivo
                    if not correspondencia_encontrada:
                        filename = recibo.get('filename', '')
                        print(f"🔍 DEBUG_VALIDACAO - Verificando nome do arquivo: '{filename}' para colaborador '{colaborador}'", file=sys.stderr)
                        if check_filename_correspondence(filename, colaborador):
                            correspondencia_encontrada = True
                            print(f"✅ DEBUG_VALIDACAO - Correspondência por nome do arquivo: {filename}", file=sys.stderr)
                        else:
                            print(f"❌ DEBUG_VALIDACAO - Nome do arquivo não corresponde", file=sys.stderr)
                    
                    # 4. Fallback: buscar nome diretamente no texto do recibo
                    if not correspondencia_encontrada:
                        recibo_normalizado = normalize_name_for_comparison(recibo_text)
                        if colaborador and colaborador_normalizado in recibo_normalizado:
                            correspondencia_encontrada = True
                            print(f"✅ DEBUG_VALIDACAO - Correspondência encontrada no texto completo do recibo", file=sys.stderr)
                    
                    if correspondencia_encontrada:
                        print(f"✅ DEBUG_VALIDACAO - Recibo correspondente encontrado para '{colaborador}'", file=sys.stderr)
                        recibo_correspondente = recibo
                        dados_bancarios_recibo = extract_dados_bancarios(recibo_text)
                        # Extrair valor depositado do recibo
                        valores_recibo = extract_valores(recibo_text)
                        valor_depositado = valores_recibo.get('liquido')
                        print(f"💰 DEBUG_VALIDACAO - Valor no recibo: '{valor_depositado}'", file=sys.stderr)
                        break
                    else:
                        print(f"❌ DEBUG_VALIDACAO - Recibo {i+1} não corresponde ao colaborador '{colaborador}'", file=sys.stderr)
                
                # Determinar status final
                status = "Não confere"
                detalhes = []
                
                if not colaborador:
                    detalhes.append("Nome do colaborador não encontrado")
                
                if not calculo_ok:
                    detalhes.append("Cálculo incorreto: líquido ≠ vencimentos - descontos")
                
                if not tem_assinatura:
                    detalhes.append("Assinatura digital não encontrada")
                
                if recibo_correspondente:
                    print(f"✅ DEBUG_VALIDACAO - Recibo encontrado, iniciando comparação de valores", file=sys.stderr)
                    print(f"💰 DEBUG_VALIDACAO - Valor líquido contracheque: '{valores['liquido']}'", file=sys.stderr)
                    print(f"💰 DEBUG_VALIDACAO - Valor depositado recibo: '{valor_depositado}'", file=sys.stderr)
                    print(f"🧮 DEBUG_VALIDACAO - Cálculo OK: {calculo_ok}", file=sys.stderr)
                    
                    # Comparar valores
                    valor_ok = True
                    if valor_depositado and valores['liquido']:
                        valor_contracheque_norm = normalize_money_value(valores['liquido'])
                        valor_recibo_norm = normalize_money_value(valor_depositado)
                        diferenca = abs(valor_contracheque_norm - valor_recibo_norm)
                        
                        print(f"🔢 DEBUG_VALIDACAO - Valor contracheque normalizado: {valor_contracheque_norm}", file=sys.stderr)
                        print(f"🔢 DEBUG_VALIDACAO - Valor recibo normalizado: {valor_recibo_norm}", file=sys.stderr)
                        print(f"🔢 DEBUG_VALIDACAO - Diferença: {diferenca}", file=sys.stderr)
                        
                        if diferenca > 0.01:
                            valor_ok = False
                            detalhes.append(f"Valor depositado ({valor_depositado}) diferente do valor líquido ({valores['liquido']}) - diferença: {diferenca}")
                            print(f"❌ DEBUG_VALIDACAO - Valores não conferem - diferença: {diferenca}", file=sys.stderr)
                        else:
                            print(f"✅ DEBUG_VALIDACAO - Valores conferem - diferença: {diferenca}", file=sys.stderr)
                    else:
                        print(f"⚠️ DEBUG_VALIDACAO - Um dos valores está vazio - recibo: '{valor_depositado}', contracheque: '{valores['liquido']}'", file=sys.stderr)
                    
                    print(f"📊 DEBUG_VALIDACAO - Resumo validação: calculo_ok={calculo_ok}, valor_ok={valor_ok}, colaborador='{colaborador}'", file=sys.stderr)
                    
                    if calculo_ok and valor_ok and colaborador and tem_assinatura:
                        status = "Confere"
                        detalhes = ["Validação bem-sucedida com assinatura digital válida"]
                        print(f"✅ DEBUG_VALIDACAO - Status final: CONFERE", file=sys.stderr)
                    else:
                        print(f"❌ DEBUG_VALIDACAO - Status final: NÃO CONFERE - motivos: calculo_ok={calculo_ok}, valor_ok={valor_ok}, colaborador='{colaborador}'", file=sys.stderr)
                else:
                    detalhes.append("Recibo correspondente não encontrado")
                    print(f"❌ DEBUG_VALIDACAO - Nenhum recibo correspondente encontrado", file=sys.stderr)
                
                # Adicionar resultado
                print(f"✅ DEBUG_PROCESSAMENTO - Adicionando resultado para '{colaborador}' com status '{status}'", file=sys.stderr)
                results.append({
                    'colaborador': colaborador or 'Não identificado',
                    'mesReferencia': mes_ref or 'Não identificado',
                    'vencimentos': valores['vencimentos'] or '0,00',
                    'descontos': valores['descontos'] or '0,00',
                    'liquido': valores['liquido'] or '0,00',
                    'assinatura_digital': tem_assinatura,
                    'status': status,
                    'detalhes': '; '.join(detalhes) if detalhes else 'Processado'
                })
                
            except Exception as e:
                print(f"❌ DEBUG_PROCESSAMENTO - Erro ao processar contracheque {idx+1}: {str(e)}", file=sys.stderr)
                import traceback
                traceback.print_exc(file=sys.stderr)
                
                # Adicionar resultado de erro para este documento específico
                results.append({
                    'colaborador': f'Erro no documento {idx+1}',
                    'mesReferencia': 'N/A',
                    'vencimentos': '0,00',
                    'descontos': '0,00',
                    'liquido': '0,00',
                    'status': 'Erro',
                    'detalhes': f'Erro no processamento: {str(e)}'
                })
                continue  # Continuar com o próximo documento
    
    except Exception as e:
        results.append({
            'colaborador': 'Erro',
            'mesReferencia': 'N/A',
            'status': 'Erro',
            'detalhes': f'Erro no processamento: {str(e)}'
        })
    
    return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps([{
            'colaborador': 'Erro',
            'mesReferencia': 'N/A', 
            'status': 'Erro',
            'detalhes': 'Nenhum arquivo fornecido'
        }]), file=sys.stdout)
        return
    
    pdf_paths = sys.argv[1:]
    results = process_documents(pdf_paths)
    print(json.dumps(results, ensure_ascii=False, indent=2), file=sys.stdout)

if __name__ == '__main__':
    main()