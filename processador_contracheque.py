#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Processador de Contracheques e Recibos
Extrai dados de PDFs usando OCR e valida informações entre contracheque e recibo
"""

import sys
import json
import re
from pathlib import Path
import backend_pdf_processor
try:
    from PIL import Image
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Aviso: Tesseract não disponível. OCR de imagens será limitado.", file=sys.stderr)

def extract_text_from_pdf(pdf_path):
    """
    Extrai texto de PDF usando backend_pdf_processor com OCR otimizado
    """
    try:
        processor = backend_pdf_processor.PontoProcessor()
        text = processor.extract_text_with_ocr(pdf_path)
        print(f"Texto extraído de {pdf_path} usando backend_pdf_processor", file=sys.stderr)
        return text
    
    except Exception as e:
        print(f"Erro ao extrair texto de {pdf_path}: {e}", file=sys.stderr)
        return ""

def extract_colaborador_name(text):
    """Extrai o nome do colaborador do texto"""
    # print(f"🔍 DEBUG_TEXTO - Entrada (1000 chars): {repr(text[:1000])}", file=sys.stderr)
    # print(f"🔍 DEBUG_TEXTO - Tamanho total: {len(text)} caracteres", file=sys.stderr)
    
    # Salvar texto extraído para debug
    import time
    debug_file = f"debug_texto_{int(time.time())}.txt"
    try:
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(text)
        # print(f"🔍 DEBUG_SAVE - Texto salvo em: {debug_file}", file=sys.stderr)
    except Exception as e:
        print(f"❌ DEBUG_SAVE - Erro ao salvar: {e}", file=sys.stderr)
    
    # Mostrar algumas linhas do texto para debug
    lines = text.split('\n')[:10]
    # print(f"🔍 DEBUG_LINHAS - Primeiras 10 linhas:", file=sys.stderr)
    for i, line in enumerate(lines, 1):
        # print(f"  {i}: {repr(line)}", file=sys.stderr)
        pass
    
    # Padrões para encontrar nome do colaborador
    patterns = [
        # Padrão específico para o formato do contracheque (nome seguido de números)
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s+\d{6}\s+\d+',
        # Padrões específicos para contracheques
        r'(?:nome|colaborador|funcionário|servidor)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'Nome\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        r'NOME\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função))',
        # Padrão para nomes seguidos de dados pessoais
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)(?=\s*(?:CPF|RG|Matrícula))',
        # Padrão mais flexível para capturar nomes em linhas
        r'^\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)\s*$',
        # Padrão para nomes após palavras-chave
        r'(?:Funcionário|Servidor|Empregado)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+)',
    ]
    
    for i, pattern in enumerate(patterns):
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            name = match.group(1).strip()
            # print(f"📝 Padrão {i+1} encontrou: '{name}'", file=sys.stderr)
            # Remove caracteres especiais e limita o tamanho
            name = re.sub(r'[^A-Za-záàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\s]', '', name)
            # print(f"🧹 Nome após limpeza: '{name}'", file=sys.stderr)
            # Filtrar palavras inválidas
            invalid_words = ['da empresa', 'do tribunal', 'regional', 'trabalho', 'justiça', 'federal', 
                           'ministério', 'público', 'união', 'estado', 'município', 'prefeitura',
                           'secretaria', 'departamento', 'seção', 'divisão', 'coordenação']
            
            name_lower = name.lower()
            if any(invalid in name_lower for invalid in invalid_words):
                print(f"❌ Nome contém palavras inválidas: '{name}'", file=sys.stderr)
                continue
            
            # Validar se é um nome válido
            words = name.split()
            
            # Remover palavras de 1 caractere no início (prefixos como "S", "A", etc.)
            while words and len(words[0]) == 1:
                words = words[1:]
            
            if words:
                # Reconstituir o nome sem os prefixos de 1 caractere
                clean_name = ' '.join(words)
                
                if len(words) >= 2 and len(clean_name) > 5 and len(clean_name) < 50:
                    # Verificar se todas as palavras restantes têm pelo menos 2 caracteres
                    if all(len(word) >= 2 for word in words):
                        # print(f"✅ Nome válido encontrado: '{clean_name}'", file=sys.stderr)
                        return clean_name
                    else:
                        print(f"❌ Nome com palavras muito curtas: '{clean_name}'", file=sys.stderr)
                else:
                    print(f"❌ Nome inválido (palavras: {len(words)}, tamanho: {len(clean_name)}): '{clean_name}'", file=sys.stderr)
            else:
                print(f"❌ Nome com palavras muito curtas: '{name}'", file=sys.stderr)
    
    print("❌ Nenhum nome válido encontrado", file=sys.stderr)
    return None

def extract_mes_referencia(text):
    """
    Extrai mês de referência do contracheque
    """
    patterns = [
        # Priorizar padrões de mês por extenso
        r'(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:de\s*)?(\d{4})',
        # Padrões com palavras-chave específicas
        r'(?:referência|período|competência)\s*:?\s*(\d{1,2}[/\-]\d{4})',
        r'(\d{1,2}[/\-]\d{4})\s*(?:referência|período|competência)',
        r'(?:mês|mes)\s*:?\s*(\d{1,2}[/\-]\d{4})',
        # Padrões numéricos mais específicos (evitar CNPJ)
        r'(?<!\d{3}\.)(?<!\d{2}\.)(?<!\d\.)(?<!/)(?<!-)\b(\d{1,2}[/\-]\d{4})(?!/\d)(?!-\d)',
        r'\b(\d{2}-\d{4})\b'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2 and not match.group(1).isdigit():
                # Converte nome do mês para número
                months = {
                    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
                    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
                    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
                }
                month_name = match.group(1).lower()
                if month_name in months:
                    return f"{months[month_name]}/{match.group(2)}"
            else:
                return match.group(1)
    
    return None

def extract_valores(text):
    """
    Extrai valores monetários do texto (vencimentos, descontos, líquido)
    """
    valores = {
        'vencimentos': '0,00',
        'descontos': '0,00',
        'liquido': '0,00'
    }
    
    # print(f"🔍 DEBUG_VALORES - Extraindo valores do texto...", file=sys.stderr)
    
    # Padrão para valores monetários (incluindo espaços)
    money_pattern = r'(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2})'
    
    # Procurar pela linha com dois valores grandes consecutivos (padrão do contracheque)
    # Exemplo: "7.066, 33 1.648, 33" - valores maiores que 1000
    totais_pattern = r'(\d{1,3}(?:[\.,]\s*\d{3})+[\.,]\s*\d{2})\s+(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2})'
    
    # Encontrar todas as ocorrências
    totais_matches = re.findall(totais_pattern, text)
    
    # print(f"🔍 DEBUG_VALORES - Padrões encontrados: {totais_matches}", file=sys.stderr)
    
    # Procurar pelo par de valores que faz mais sentido (ambos > 1000)
    for venc_raw, desc_raw in totais_matches:
        try:
            # Normalizar e converter para verificar se são valores grandes
            venc_clean = venc_raw.replace(' ', '').replace('.', '').replace(',', '.')
            desc_clean = desc_raw.replace(' ', '').replace('.', '').replace(',', '.')
            
            venc_num = float(venc_clean)
            desc_num = float(desc_clean)
            
            # Verificar se ambos são valores significativos (> 1000)
            if venc_num > 1000 and desc_num > 100:
                valores['vencimentos'] = venc_raw.replace(' ', '')
                valores['descontos'] = desc_raw.replace(' ', '')
                
                # print(f"📊 DEBUG_VALORES - Totais selecionados: Venc={valores['vencimentos']}, Desc={valores['descontos']}", file=sys.stderr)
                
                # Calcular líquido
                liquido_num = venc_num - desc_num
                valores['liquido'] = f"{liquido_num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                # print(f"💰 DEBUG_VALORES - Líquido calculado: {valores['liquido']}", file=sys.stderr)
                break
                
        except Exception as e:
            print(f"❌ DEBUG_VALORES - Erro ao processar {venc_raw}, {desc_raw}: {e}", file=sys.stderr)
            continue
    
    # Se não encontrou os totais, procurar por valor líquido específico
    if valores['liquido'] == '0,00':
        # Procurar por valor na linha do banco (ex: "vatoruiiee 5.418,00")
        liquido_pattern = r'(?:valor|vator)\w*\s+(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2})'
        liquido_match = re.search(liquido_pattern, text, re.IGNORECASE)
        
        if liquido_match:
            valores['liquido'] = liquido_match.group(1).replace(' ', '')
            print(f"💰 DEBUG_VALORES - Líquido encontrado: {valores['liquido']}", file=sys.stderr)
    
    # Padrões tradicionais como fallback
    if valores['vencimentos'] == '0,00':
        venc_patterns = [
            r'(?:total|soma)\s*(?:de)?\s*vencimentos?\s*:?\s*R?\$?\s*' + money_pattern,
            r'vencimentos?\s*total\s*:?\s*R?\$?\s*' + money_pattern,
            r'(?:^|\n)Total\s+Vencimentos\s*:?\s*R?\$?\s*' + money_pattern
        ]
        
        for pattern in venc_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                valores['vencimentos'] = match.group(1).replace(' ', '')
                break
    
    if valores['descontos'] == '0,00':
        desc_patterns = [
            r'(?:total|soma)\s*(?:de)?\s*descontos?\s*:?\s*R?\$?\s*' + money_pattern,
            r'descontos?\s*total\s*:?\s*R?\$?\s*' + money_pattern,
            r'(?:^|\n)Total\s+Descontos\s*:?\s*R?\$?\s*' + money_pattern
        ]
        
        for pattern in desc_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                valores['descontos'] = match.group(1).replace(' ', '')
                break
    
    if valores['liquido'] == '0,00':
        liq_patterns = [
            r'(?:valor|total)\s*l[íi]quido\s*:?\s*R?\$?\s*' + money_pattern,
            r'l[íi]quido\s*:?\s*R?\$?\s*' + money_pattern,
            r'Valor:\s*\n?\s*R?\$?\s*' + money_pattern,
            r'(?:^|\n)Valor:\s*R?\$?\s*' + money_pattern
        ]
        
        for pattern in liq_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                valores['liquido'] = match.group(1).replace(' ', '')
                break
    
    # print(f"✅ DEBUG_VALORES - Resultado final: {valores}", file=sys.stderr)
    return valores

def extract_dados_bancarios(text):
    """
    Extrai dados bancários (banco, agência, conta)
    """
    dados = {
        'banco': None,
        'agencia': None,
        'conta': None
    }
    
    # Banco
    banco_patterns = [
        r'banco\s*:?\s*(\d{3})',
        r'banco\s+(\d{3})',
        r'cod\.?\s*banco\s*:?\s*(\d{3})',
        r'Banco\s*:?\s*(\d{3})'
    ]
    
    for pattern in banco_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            dados['banco'] = match.group(1)
            break
    
    # Agência
    agencia_patterns = [
        r'Agência\s*:?\s*([\d-]+)',
        r'agência\s*:?\s*([\d-]+)',
        r'agencia\s*:?\s*([\d-]+)',
        r'ag\.?\s*:?\s*([\d-]+)',
        r'Agencia\s*:?\s*([\d-]+)',
        r'Agência:\s*\n?\s*([\d-]+)',
        r'(?:^|\n)Agência:\s*([\d-]+)'
    ]
    
    for pattern in agencia_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            dados['agencia'] = match.group(1)
            break
    
    # Conta
    conta_patterns = [
        r'Conta\s+corrente\s*:?\s*([\d.-]+)',
        r'conta\s+corrente\s*:?\s*([\d.-]+)',
        r'Conta\s*:?\s*([\d.-]+)',
        r'conta\s*:?\s*([\d.-]+)',
        r'c/c\s*:?\s*([\d.-]+)',
        r'Conta\s+corrente:\s*\n?\s*([\d.-]+)',
        r'(?:^|\n)Conta\s+corrente:\s*([\d.-]+)'
    ]
    
    for pattern in conta_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            dados['conta'] = match.group(1)
            break
    
    return dados

def normalize_money_value(value_str):
    """
    Normaliza valor monetário para comparação
    """
    if not value_str:
        return 0.0
    
    # Remove pontos de milhares e substitui vírgula por ponto
    normalized = value_str.replace('.', '').replace(',', '.')
    try:
        return float(normalized)
    except:
        return 0.0

def validate_calculo(vencimentos, descontos, liquido):
    """
    Valida se líquido = vencimentos - descontos
    """
    try:
        venc_val = normalize_money_value(vencimentos)
        desc_val = normalize_money_value(descontos)
        liq_val = normalize_money_value(liquido)
        
        calculated = venc_val - desc_val
        # Tolerância de 0.01 para diferenças de arredondamento
        return abs(calculated - liq_val) <= 0.01
    except:
        return False

def simulate_contracheque_data():
    """
    Simula dados de contracheque extraídos para demonstração
    """
    return """
CONTRACHEQUE
Nome: JOÃO DA SILVA SANTOS
CPF: 123.456.789-00
Matrícula: 12345
Cargo: ANALISTA JUDICIÁRIO
Período: 12/2024

VENCIMENTOS:
Salário Base: 8.500,00
Gratificação: 1.200,00
Total Vencimentos: 9.700,00

DESCONTOS:
INSS: 850,00
IRRF: 450,00
Total Descontos: 1.300,00

VALOR LÍQUIDO: 8.400,00

DADOS BANCÁRIOS:
Banco: 341
Agência: 1234
Conta corrente: 56789-0
"""

def classify_document_type(text):
    """
    Classifica se o documento é contracheque ou recibo
    """
    contracheque_keywords = ['contracheque', 'folha de pagamento', 'vencimentos', 'descontos']
    recibo_keywords = ['recibo', 'comprovante', 'depósito', 'transferência']
    
    text_lower = text.lower()
    
    contracheque_score = sum(1 for keyword in contracheque_keywords if keyword in text_lower)
    recibo_score = sum(1 for keyword in recibo_keywords if keyword in text_lower)
    
    if contracheque_score > recibo_score:
        return 'contracheque'
    elif recibo_score > contracheque_score:
        return 'recibo'
    else:
        return 'indefinido'

def process_documents(pdf_paths):
    """
    Processa documentos e retorna resultado da validação
    """
    results = []
    
    try:
        # Extrair texto de todos os PDFs
        documents = []
        for pdf_path in pdf_paths:
            text = extract_text_from_pdf(pdf_path)
            doc_type = classify_document_type(text)
            documents.append({
                'path': pdf_path,
                'text': text,
                'type': doc_type
            })
        
        # Separar contracheques e recibos
        contracheques = [doc for doc in documents if doc['type'] == 'contracheque']
        recibos = [doc for doc in documents if doc['type'] == 'recibo']
        
        # Se não conseguiu classificar, tenta processar todos como contracheque
        if not contracheques:
            contracheques = documents
        
        # Processar cada contracheque
        for contracheque in contracheques:
            text = contracheque['text']
            
            # Extrair dados do contracheque
            colaborador = extract_colaborador_name(text)
            mes_ref = extract_mes_referencia(text)
            valores = extract_valores(text)
            dados_bancarios = extract_dados_bancarios(text)
            
            # Validar cálculo
            calculo_ok = validate_calculo(
                valores['vencimentos'],
                valores['descontos'], 
                valores['liquido']
            )
            
            # Procurar recibo correspondente
            recibo_correspondente = None
            dados_bancarios_recibo = None
            valor_depositado = None
            
            for recibo in recibos:
                recibo_text = recibo['text']
                # Verificar se o nome do colaborador aparece no recibo
                if colaborador and colaborador.lower() in recibo_text.lower():
                    recibo_correspondente = recibo
                    dados_bancarios_recibo = extract_dados_bancarios(recibo_text)
                    # Extrair valor depositado do recibo
                    valores_recibo = extract_valores(recibo_text)
                    valor_depositado = valores_recibo.get('liquido')
                    break
            
            # Determinar status final
            status = "Não confere"
            detalhes = []
            
            if not colaborador:
                detalhes.append("Nome do colaborador não encontrado")
            
            if not calculo_ok:
                detalhes.append("Cálculo incorreto: líquido ≠ vencimentos - descontos")
            
            if recibo_correspondente:
                # Comparar valores
                valor_ok = True
                if valor_depositado and valores['liquido']:
                    if abs(normalize_money_value(valor_depositado) - normalize_money_value(valores['liquido'])) > 0.01:
                        valor_ok = False
                        detalhes.append("Valor depositado diferente do valor líquido")
                
                if calculo_ok and valor_ok and colaborador:
                    status = "Confere"
                    detalhes = ["Validação bem-sucedida"]
            else:
                detalhes.append("Recibo correspondente não encontrado")
            
            # Adicionar resultado
            results.append({
                'colaborador': colaborador or 'Não identificado',
                'mesReferencia': mes_ref or 'Não identificado',
                'vencimentos': valores['vencimentos'] or '0,00',
                'descontos': valores['descontos'] or '0,00',
                'liquido': valores['liquido'] or '0,00',
                'status': status,
                'detalhes': '; '.join(detalhes) if detalhes else 'Processado'
            })
    
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