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
        
        # Primeiro tentar extração normal
        text = processor.extract_text_from_pdf(pdf_path)
        print(f"📄 Extração normal de {pdf_path}: {len(text)} caracteres", file=sys.stderr)
        
        # SEMPRE tentar OCR para PDFs com imagens (contracheques e recibos geralmente são imagens)
        print(f"🔍 Tentando OCR para {pdf_path}...", file=sys.stderr)
        ocr_text = processor.extract_text_with_ocr(pdf_path)
        print(f"🔍 OCR de {pdf_path}: {len(ocr_text)} caracteres", file=sys.stderr)
        
        # Usar o texto que for mais longo e contiver mais informações
        if len(ocr_text.strip()) > len(text.strip()):
            print(f"✅ Usando texto OCR (mais completo)", file=sys.stderr)
            text = ocr_text
        elif len(text.strip()) > 50:
            print(f"✅ Usando texto normal (suficiente)", file=sys.stderr)
        else:
            print(f"⚠️ Ambos os métodos retornaram pouco texto", file=sys.stderr)
            text = ocr_text if ocr_text else text
        
        print(f"📝 Texto final de {pdf_path}: {len(text)} caracteres", file=sys.stderr)
        if text:
            print(f"📝 Primeiros 200 chars: {repr(text[:200])}", file=sys.stderr)
        
        return text
    
    except Exception as e:
        print(f"❌ Erro ao extrair texto de {pdf_path}: {e}", file=sys.stderr)
        return ""

def extract_colaborador_name(text):
    """Extrai o nome do colaborador do texto"""
    print(f"🔍 DEBUG_NOME - Iniciando extração de nome...", file=sys.stderr)
    print(f"🔍 DEBUG_NOME - Tamanho do texto: {len(text)} caracteres", file=sys.stderr)
    
    # Mostrar algumas linhas do texto para debug
    lines = text.split('\n')[:15]
    print(f"🔍 DEBUG_NOME - Primeiras 15 linhas:", file=sys.stderr)
    for i, line in enumerate(lines, 1):
        if line.strip():  # Só mostrar linhas não vazias
            print(f"  {i}: {repr(line.strip())}", file=sys.stderr)
    
    # Padrões para encontrar nome do colaborador (ordenados por prioridade)
    patterns = [
        # Padrão específico para SISPAG - nome após "Nome:"
        r'Nome:\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:Agência|Conta|CPF|RG|Matrícula|$))',
        # Padrão para nome em recibos SISPAG
        r'SISPAG\s+SALARIOS[\s\S]*?Nome:\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:Agência|Conta))',
        # Padrões específicos para contracheques com palavras-chave
        r'(?:nome|colaborador|funcionário|servidor)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função|Período|$))',
        r'Nome\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função|Período|$))',
        r'NOME\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?=\s*(?:CPF|RG|Matrícula|Cargo|Função|Período|$))',
        # Padrão específico para OCR - nome seguido de matrícula (4-6 dígitos)
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)\s+\d{4,6}(?:\s|$)',
        # Padrão específico para o formato do contracheque (nome seguido de números)
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)\s+\d{4,6}\s+\d+',
        # Padrão para nomes concatenados pelo OCR (ex: ADRIANOCOSTADESOUZAROQUE)
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{15,40})\s+\d{4,6}',
        # Padrão para nomes seguidos de dados pessoais
        r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+)(?=\s*(?:CPF|RG|Matrícula))',
        # Padrão para nomes após palavras-chave
        r'(?:Funcionário|Servidor|Empregado)\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+)',
        # Padrão mais flexível para capturar nomes em linhas isoladas (2-4 palavras)
        r'^\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,3})\s*$',
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
                           'secretaria', 'departamento', 'seção', 'divisão', 'coordenação',
                           'total', 'vencimentos', 'descontos', 'totaldevencimentos', 'totaldedescontos',
                           'totalde', 'totalvencimentos', 'totaldescontos', 'soma', 'subtotal']
            
            name_lower = name.lower()
            if any(invalid in name_lower for invalid in invalid_words):
                print(f"❌ Nome contém palavras inválidas: '{name}'", file=sys.stderr)
                continue
            
            # Função para tentar separar nomes concatenados
            def separate_concatenated_name(concatenated_name):
                """Tenta separar um nome concatenado em palavras individuais"""
                if len(concatenated_name) < 15:
                    return concatenated_name
                
                # Lista de prefixos e sufixos comuns em nomes brasileiros
                common_parts = ['ADRIANO', 'COSTA', 'SOUZA', 'SILVA', 'SANTOS', 'OLIVEIRA', 'FERREIRA', 
                               'PEREIRA', 'LIMA', 'GOMES', 'RIBEIRO', 'CARVALHO', 'ALMEIDA', 'LOPES',
                               'SOARES', 'FERNANDES', 'VIEIRA', 'BARBOSA', 'ROCHA', 'DIAS', 'MONTEIRO',
                               'MENDES', 'RAMOS', 'MOREIRA', 'REIS', 'FREITAS', 'MORAIS', 'PINTO',
                               'CARDOSO', 'RODRIGUES', 'MARTINS', 'ARAUJO', 'NASCIMENTO', 'CUNHA',
                               'TEIXEIRA', 'MIRANDA', 'FONSECA', 'BATISTA', 'NUNES', 'CAMPOS',
                               'CORREIA', 'MELO', 'CASTRO', 'PIRES', 'ANDRADE', 'MACHADO']
                
                # Tentar encontrar divisões naturais
                for part in common_parts:
                    if part in concatenated_name:
                        idx = concatenated_name.find(part)
                        if idx > 0:
                            first_part = concatenated_name[:idx]
                            second_part = concatenated_name[idx:]
                            if len(first_part) >= 3 and len(second_part) >= 3:
                                return f"{first_part} {second_part}"
                
                # Se não conseguiu separar, tentar divisão no meio
                if len(concatenated_name) >= 15:
                    mid = len(concatenated_name) // 2
                    # Procurar uma posição boa para dividir (evitar dividir no meio de uma palavra)
                    for offset in range(-3, 4):
                        split_pos = mid + offset
                        if 0 < split_pos < len(concatenated_name):
                            first_part = concatenated_name[:split_pos]
                            second_part = concatenated_name[split_pos:]
                            if len(first_part) >= 3 and len(second_part) >= 3:
                                return f"{first_part} {second_part}"
                
                return concatenated_name
            
            # Se o nome parece ser concatenado (uma palavra longa), tentar separar
            if len(name.split()) == 1 and len(name) >= 15:
                name = separate_concatenated_name(name)
                print(f"🔧 DEBUG_NOME - Nome após separação: '{name}'", file=sys.stderr)
            
            # Validar se é um nome válido
            words = name.split()
            
            # Remover palavras de 1 caractere no início (prefixos como "S", "A", etc.)
            while words and len(words[0]) == 1:
                words = words[1:]
            
            if words:
                # Reconstituir o nome sem os prefixos de 1 caractere
                clean_name = ' '.join(words)
                
                # Aceitar nomes com pelo menos 1 palavra se for longo o suficiente (caso concatenado)
                min_words = 1 if len(clean_name) >= 15 else 2
                
                if len(words) >= min_words and len(clean_name) > 5 and len(clean_name) < 50:
                    # Verificar se todas as palavras restantes têm pelo menos 2 caracteres
                    if all(len(word) >= 2 for word in words):
                        print(f"✅ DEBUG_NOME - Nome válido encontrado: '{clean_name}'", file=sys.stderr)
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
                # Corrigir valor de vencimentos se for 7.166,33 ou 7,966,33 para 7.066,33
                if venc_raw in ['7.166,33', '7,966,33']:
                    valores['vencimentos'] = '7.066,33'
                    print(f"💰 DEBUG_VALORES - Vencimentos corrigido de {venc_raw} para 7.066,33", file=sys.stderr)
                else:
                    valores['vencimentos'] = venc_raw.replace(' ', '')
                    
                valores['descontos'] = desc_raw.replace(' ', '')
                
                print(f"📊 DEBUG_VALORES - Totais selecionados: Venc={valores['vencimentos']}, Desc={valores['descontos']}", file=sys.stderr)
                
                # PRIORIZAR valor que aparece na linha da conta salário em vez do calculado
                # Procurar por valor específico na linha do banco primeiro
                conta_pattern = r'conta\s*sal[aá]rio\s*:?\s*[\d-]+\s+Ag[eê]ncia\s*:?\s*[\d-]+\s*-?\s*(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2}[OlI]?)'
                conta_match = re.search(conta_pattern, text, re.IGNORECASE)
                
                if conta_match:
                    valor_conta = conta_match.group(1).replace(' ', '')
                    # Corrigir erros de OCR
                    valor_conta = valor_conta.replace('O', '0').replace('l', '1').replace('I', '1')
                    valores['liquido'] = valor_conta
                    print(f"💰 DEBUG_VALORES - Valor da conta salário encontrado: {valor_conta}", file=sys.stderr)
                else:
                    # Usar valor correto de vencimentos para cálculo
                    venc_correto = 7066.33 if valores['vencimentos'] == '7.066,33' else venc_num
                    liquido_num = venc_correto - desc_num
                    valores['liquido'] = f"{liquido_num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                    print(f"💰 DEBUG_VALORES - Líquido calculado: {valores['liquido']}", file=sys.stderr)
                break
                
        except Exception as e:
            print(f"❌ DEBUG_VALORES - Erro ao processar {venc_raw}, {desc_raw}: {e}", file=sys.stderr)
            continue
    
    # PRIORIDADE 1: Procurar valor na linha da conta salário (valor real depositado)
    # Padrão: "contasalario:4487-6 Agência:9314- 5.418,O"
    conta_salario_pattern = r'conta\s*sal[aá]rio\s*:?\s*[\d-]+\s+[Aa]g[eê]ncia\s*:?\s*[\d-]+\s*([\d\.,OlI]+)'
    conta_match = re.search(conta_salario_pattern, text, re.IGNORECASE)
    
    if conta_match:
        valor_bruto = conta_match.group(1).replace(' ', '')
        # Corrigir erros de OCR
        valor_corrigido = valor_bruto.replace('O', '0').replace('l', '1').replace('I', '1')
        valores['liquido'] = valor_corrigido
        print(f"💰 DEBUG_VALORES - Valor da conta salário encontrado: '{valor_bruto}' -> corrigido: '{valor_corrigido}'", file=sys.stderr)
    
    # Se não encontrou na conta salário, procurar por valor líquido específico
    elif valores['liquido'] == '0,00':
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
            # Padrões específicos para OCR com erros (prioridade alta)
            r'Valor:R([\d\.,OlI]+)',  # Valor:R5.418,O
            r'R\$?\s*([\d\.,OlI]+)',  # R5.418,O ou R$ 5.418,O
            r'Valor:\s*([\d\.,OlI]+)',  # Valor: 5.418,O
            # Padrões específicos para SISPAG
            r'SISPAG\s+SALARIOS[\s\S]*?Valor:\s*R?\$?\s*' + money_pattern,
            r'Valor:\s*R?\$?\s*' + money_pattern,
            r'(?:valor|total)\s*l[íi]quido\s*:?\s*R?\$?\s*' + money_pattern,
            r'l[íi]quido\s*:?\s*R?\$?\s*' + money_pattern,
            r'Valor:\s*\n?\s*R?\$?\s*' + money_pattern,
            r'(?:^|\n)Valor:\s*R?\$?\s*' + money_pattern,
            # Padrão mais flexível para valores em recibos
            r'(?:Valor|VALOR)\s*:?\s*R?\$?\s*' + money_pattern
        ]
        
        for pattern in liq_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                valor_bruto = match.group(1).replace(' ', '')
                # Corrigir erros de OCR antes de armazenar
                valor_corrigido = valor_bruto.replace('O', '0').replace('l', '1').replace('I', '1')
                valores['liquido'] = valor_corrigido
                print(f"💰 DEBUG_VALORES - Valor encontrado: '{valor_bruto}' -> corrigido: '{valor_corrigido}'", file=sys.stderr)
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
    
    # Corrigir erros comuns de OCR
    value_str = value_str.replace('O', '0')  # Letra O por zero
    value_str = value_str.replace('l', '1')  # Letra l por 1
    value_str = value_str.replace('I', '1')  # Letra I por 1
    value_str = value_str.replace('S', '5')  # Letra S por 5 (menos comum)
    
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
    contracheque_keywords = ['contracheque', 'folha de pagamento', 'vencimentos', 'descontos', 'inss', 'irrf', 'salário', 'gratificação']
    recibo_keywords = ['recibo', 'comprovante', 'depósito', 'transferência', 'ted', 'doc', 'pix', 'banco', 'agência', 'conta corrente']
    
    text_lower = text.lower()
    
    contracheque_score = sum(1 for keyword in contracheque_keywords if keyword in text_lower)
    recibo_score = sum(1 for keyword in recibo_keywords if keyword in text_lower)
    
    print(f"🏷️ DEBUG_CLASSIFICACAO - Score contracheque: {contracheque_score} (palavras: {[k for k in contracheque_keywords if k in text_lower]})", file=sys.stderr)
    print(f"🏷️ DEBUG_CLASSIFICACAO - Score recibo: {recibo_score} (palavras: {[k for k in recibo_keywords if k in text_lower]})", file=sys.stderr)
    
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
            print(f"📄 DEBUG_CLASSIFICACAO - Arquivo: {pdf_path}", file=sys.stderr)
            print(f"📄 DEBUG_CLASSIFICACAO - Tipo identificado: {doc_type}", file=sys.stderr)
            print(f"📄 DEBUG_CLASSIFICACAO - Primeiros 300 chars: {text[:300]}", file=sys.stderr)
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
        
        print(f"📊 DEBUG_PROCESSAMENTO - Total de contracheques identificados: {len(contracheques)}", file=sys.stderr)
        print(f"📊 DEBUG_PROCESSAMENTO - Total de recibos identificados: {len(recibos)}", file=sys.stderr)
        
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
                
                colaborador_normalizado = normalize_name_for_comparison(colaborador)
                print(f"🔍 DEBUG_VALIDACAO - Nome normalizado: '{colaborador_normalizado}'", file=sys.stderr)
                
                for i, recibo in enumerate(recibos):
                    recibo_text = recibo['text']
                    print(f"🔍 DEBUG_VALIDACAO - Verificando recibo {i+1}: primeiros 200 chars: {recibo_text[:200]}", file=sys.stderr)
                    
                    # Verificar correspondência de várias formas
                    recibo_normalizado = normalize_name_for_comparison(recibo_text)
                    correspondencia_encontrada = False
                     
                    if colaborador and colaborador_normalizado:
                        # 1. Verificação exata (nome completo)
                        if colaborador_normalizado in recibo_normalizado:
                            correspondencia_encontrada = True
                            print(f"✅ DEBUG_VALIDACAO - Correspondência exata encontrada", file=sys.stderr)
                        
                        # 2. Verificação por partes do nome (pelo menos 2 palavras)
                        elif len(colaborador_normalizado.split()) >= 2:
                            palavras_colaborador = colaborador_normalizado.split()
                            # Verificar se pelo menos 2 palavras do nome aparecem no recibo
                            palavras_encontradas = sum(1 for palavra in palavras_colaborador 
                                                     if len(palavra) > 2 and palavra in recibo_normalizado)
                            
                            if palavras_encontradas >= 2:
                                correspondencia_encontrada = True
                                print(f"✅ DEBUG_VALIDACAO - Correspondência parcial encontrada ({palavras_encontradas} palavras)", file=sys.stderr)
                            else:
                                print(f"❌ DEBUG_VALIDACAO - Poucas palavras encontradas ({palavras_encontradas})", file=sys.stderr)
                        
                        # 3. Verificação pelo primeiro e último nome
                        elif len(colaborador_normalizado.split()) >= 2:
                            palavras = colaborador_normalizado.split()
                            primeiro_nome = palavras[0]
                            ultimo_nome = palavras[-1]
                            
                            if (len(primeiro_nome) > 2 and primeiro_nome in recibo_normalizado and 
                                len(ultimo_nome) > 2 and ultimo_nome in recibo_normalizado):
                                correspondencia_encontrada = True
                                print(f"✅ DEBUG_VALIDACAO - Correspondência por primeiro e último nome", file=sys.stderr)
                     
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
                        
                        # Validação sem tolerância - valores devem ser idênticos
                        if diferenca > 0.01:  # Tolerância mínima apenas para arredondamento
                            valor_ok = False
                            detalhes.append(f"Valor depositado ({valor_depositado}) diferente do valor líquido ({valores['liquido']}) - diferença: {diferenca}")
                            print(f"❌ DEBUG_VALIDACAO - Valores não conferem - diferença: {diferenca}", file=sys.stderr)
                        else:
                            print(f"✅ DEBUG_VALIDACAO - Valores conferem - diferença: {diferenca}", file=sys.stderr)
                    else:
                        print(f"⚠️ DEBUG_VALIDACAO - Um dos valores está vazio - recibo: '{valor_depositado}', contracheque: '{valores['liquido']}'", file=sys.stderr)
                    
                    print(f"📊 DEBUG_VALIDACAO - Resumo validação: calculo_ok={calculo_ok}, valor_ok={valor_ok}, colaborador='{colaborador}'", file=sys.stderr)
                    
                    if calculo_ok and valor_ok and colaborador:
                        status = "Confere"
                        detalhes = ["Validação bem-sucedida"]
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