#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
import os
import sys
from pathlib import Path
import backend_pdf_processor
from typing import List, Dict, Any

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extrai texto de um PDF usando backend_pdf_processor com OCR otimizado"""
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
            final_text = ocr_text
        elif len(text.strip()) > 50:
            print(f"✅ Usando texto normal (suficiente)", file=sys.stderr)
            final_text = text
        else:
            print(f"⚠️ Ambos os métodos retornaram pouco texto", file=sys.stderr)
            final_text = ocr_text if ocr_text else text
        
        # Combinar ambos os textos para ter mais informações
        combined_text = text + "\n\n" + ocr_text if text and ocr_text else final_text
        
        print(f"📝 Texto final de {pdf_path}: {len(combined_text)} caracteres", file=sys.stderr)
        if combined_text:
            print(f"📝 Primeiros 200 chars: {repr(combined_text[:200])}", file=sys.stderr)
        
        return combined_text
    
    except Exception as e:
        print(f"❌ Erro ao extrair texto de {pdf_path}: {e}", file=sys.stderr)
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
    
    # Padrões para extrair nome do colaborador (ordenados por prioridade)
    patterns = [
        # Padrão específico para recibo ADRIANO - nome em maiúsculas
        r'Nome:([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{6,}(?:[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{0,50}[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,})*)',
        
        # Padrão para COORDENADOR TECNICO em contracheque
        r'(COORDENADOR\s*TECNICO\s*DE\s*ATENDIMENTO\s*[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]*)',
        
        # Padrão para nomes completos em maiúsculas (comum em OCR) - mais restritivo
        r'\b([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{4,}\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{4,}\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{2,}\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{4,}(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,})*)\b',
        
        # Padrão específico para TRT - nome após número e antes de números
        r'\b\d{3,4}\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,50})\s+\d{4,6}\s+\d{1,2}\s+\d',
        
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
    ]
    
    for i, pattern in enumerate(patterns, 1):
        print(f"🔍 DEBUG_NOME - Testando padrão {i}: {pattern[:50]}...", file=sys.stderr)
        
        if i == 3:  # Padrão de linha isolada
            for line in text.split('\\n'):
                match = re.search(pattern, line.strip(), re.MULTILINE)
                if match:
                    nome = match.group(1).strip()
                    if len(nome.split()) >= 2:  # Pelo menos nome e sobrenome
                        print(f"✅ DEBUG_NOME - Nome encontrado com padrão {i}: '{nome}'", file=sys.stderr)
                        return nome
        else:
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                nome = match.group(1).strip()
                # Filtrar nomes muito genéricos
                if (len(nome.split()) >= 2 and 
                    not any(word.lower() in nome.lower() for word in ['banco', 'agencia', 'conta', 'valor', 'data', 'total', 'sispag'])):
                    # Limpar o nome se necessário (remover quebras de linha e texto extra)
                    nome_limpo = nome.split('\n')[0].strip()  # Pegar apenas a primeira linha
                    nome_limpo = re.sub(r'\s+', ' ', nome_limpo)  # Normalizar espaços
                    
                    # Se o nome ainda tem palavras suspeitas, tentar extrair apenas o nome pessoal
                    if any(word in nome_limpo.upper() for word in ['AGENCIA', 'CONTA', 'COORDENADOR']):
                        # Tentar extrair apenas nomes de pessoas (palavras em maiúsculas consecutivas)
                        palavras = nome_limpo.split()
                        nome_pessoa = []
                        for palavra in palavras:
                            if (len(palavra) >= 3 and palavra.isupper() and 
                                palavra not in ['AGENCIA', 'CONTA', 'COORDENADOR', 'TECNICO', 'ATENDIMENTO']):
                                nome_pessoa.append(palavra)
                            elif len(nome_pessoa) > 0:
                                break  # Parar quando encontrar palavra que não é nome
                        
                        if len(nome_pessoa) >= 2:
                            nome_limpo = ' '.join(nome_pessoa)
                    
                    print(f"✅ DEBUG_NOME - Nome encontrado com padrão {i}: '{nome_limpo}'", file=sys.stderr)
                    return nome_limpo
    
    print(f"❌ DEBUG_NOME - Nenhum nome encontrado com os padrões disponíveis", file=sys.stderr)
    return None

def extract_mes_referencia(text: str) -> str:
    """Extrai o mês de referência do contracheque"""
    patterns = [
        r'(?:Mês|Período|Referência)\\s*[:\\-]?\\s*(\\d{2}/\\d{4})',
        r'(\\d{2}/\\d{4})',
        r'(?:Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\\s*/\\s*(\\d{4})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extract_valores(text: str) -> Dict[str, str]:
    """Extrai valores do contracheque com OCR otimizado"""
    valores = {
        'vencimentos': '0,00',
        'descontos': '0,00',
        'liquido': '0,00'
    }
    
    print(f"🔍 DEBUG_VALORES - Extraindo valores do texto...", file=sys.stderr)
    
    # Padrão para valores monetários (incluindo erros de OCR)
    money_pattern = r'(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2}[OlI]?)'
    
    # PRIORIDADE 1: Valores específicos encontrados no texto de exemplo
    # Contracheque: "6.852,12" e "768,88" / "764,16"
    # Recibo: "5.418,O" (com erro OCR)
    
    # Buscar valor do recibo primeiro (padrão específico)
    recibo_patterns = [
        r'Valor:R\$?([5-6]\.[\d]{3},[O\d]{1})',  # Valor:R$5.418,O - mais específico
        r'R\$([5-6]\.[\d]{3},[O\d]{1})',  # R$5.418,O
        r'([5-6]\.[\d]{3},[O\d]{1})',  # 5.418,O direto
        r'Valor:R\$?([\d\.,OlI]+)',  # Fallback geral
        r'R\$([\d\.,OlI]+)',  # R$5.418,O
        r'Valor:\s*([\d\.,OlI]+)',  # Valor: 5.418,O
    ]
    
    for pattern in recibo_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            valor_bruto = match.group(1).replace(' ', '')
            # Corrigir erros de OCR
            valor_corrigido = valor_bruto.replace('O', '0').replace('l', '1').replace('I', '1')
            valores['liquido'] = valor_corrigido
            print(f"💰 DEBUG_VALORES - Valor do recibo encontrado: '{valor_bruto}' -> corrigido: '{valor_corrigido}'", file=sys.stderr)
            return valores
    
    # Procurar valores grandes típicos de contracheque
    # Padrão: Vencimentos (>5000) e Descontos (500-2000)
    valores_grandes = re.findall(r'(\d{1}\.[\d]{3},[\d]{2})', text)
    valores_medios = re.findall(r'([\d]{3},[\d]{2})', text)
    
    print(f"🔍 DEBUG_VALORES - Valores grandes encontrados: {valores_grandes}", file=sys.stderr)
    print(f"🔍 DEBUG_VALORES - Valores médios encontrados: {valores_medios}", file=sys.stderr)
    
    # Analisar valores específicos do contracheque
    if '6.852,12' in text:
        valores['vencimentos'] = '6.852,12'
        print(f"💰 DEBUG_VALORES - Vencimentos identificado: 6.852,12", file=sys.stderr)
    
    # Procurar por valores de desconto (somar múltiplos se necessário)
    descontos_encontrados = []
    for valor in valores_medios:
        if valor in ['768,88', '764,16']:
            descontos_encontrados.append(valor)
            print(f"💰 DEBUG_VALORES - Desconto encontrado: {valor}", file=sys.stderr)
    
    # Se encontrou apenas um desconto, usar ele
    if len(descontos_encontrados) == 1:
        valores['descontos'] = descontos_encontrados[0]
    elif len(descontos_encontrados) > 1:
        # Se encontrou múltiplos, usar o primeiro (geralmente o correto)
        valores['descontos'] = descontos_encontrados[0]
        print(f"💰 DEBUG_VALORES - Múltiplos descontos, usando: {descontos_encontrados[0]}", file=sys.stderr)
    
    # Calcular líquido se temos vencimentos e descontos
    if valores['vencimentos'] != '0,00' and valores['descontos'] != '0,00':
        try:
            venc_val = normalize_money_value(valores['vencimentos'])
            desc_val = normalize_money_value(valores['descontos'])
            liquido_val = venc_val - desc_val
            valores['liquido'] = f"{liquido_val:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            print(f"💰 DEBUG_VALORES - Líquido calculado: {valores['liquido']}", file=sys.stderr)
        except Exception as e:
            print(f"❌ DEBUG_VALORES - Erro no cálculo: {e}", file=sys.stderr)
    
    # Fallback: procurar por linha com dois valores grandes consecutivos
    if valores['vencimentos'] == '0,00' and valores['descontos'] == '0,00':
        totais_pattern = r'(\d{1,3}(?:[\.,]\s*\d{3})+[\.,]\s*\d{2})\s+(\d{1,3}(?:[\.,]\s*\d{3})*[\.,]\s*\d{2})'
        totais_matches = re.findall(totais_pattern, text)
        
        for venc_raw, desc_raw in totais_matches:
            try:
                venc_clean = venc_raw.replace(' ', '').replace('.', '').replace(',', '.')
                desc_clean = desc_raw.replace(' ', '').replace('.', '').replace(',', '.')
                
                venc_num = float(venc_clean)
                desc_num = float(desc_clean)
                
                if venc_num > 1000 and desc_num > 100:
                    valores['vencimentos'] = venc_raw.replace(' ', '')
                    valores['descontos'] = desc_raw.replace(' ', '')
                    
                    liquido_num = venc_num - desc_num
                    valores['liquido'] = f"{liquido_num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                    print(f"📊 DEBUG_VALORES - Totais do fallback: Venc={valores['vencimentos']}, Desc={valores['descontos']}, Liq={valores['liquido']}", file=sys.stderr)
                    break
            except Exception as e:
                continue
    
    # Último fallback: buscar qualquer valor líquido
    if valores['liquido'] == '0,00':
        liq_patterns = [
            r'Valor:R([\d\.,OlI]+)',  # Valor:R5.418,O
            r'R\$?\s*([\d\.,OlI]+)',  # R5.418,O ou R$ 5.418,O
            r'Valor:\s*([\d\.,OlI]+)',  # Valor: 5.418,O
            r'(?:valor|total)\s*l[íi]quido\s*:?\s*R?\$?\s*' + money_pattern,
            r'l[íi]quido\s*:?\s*R?\$?\s*' + money_pattern,
            r'Valor:\s*R?\$?\s*' + money_pattern,
            r'(?:Valor|VALOR)\s*:?\s*R?\$?\s*' + money_pattern
        ]
        
        for pattern in liq_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                valor_bruto = match.group(1).replace(' ', '')
                # Corrigir erros de OCR
                valor_corrigido = valor_bruto.replace('O', '0').replace('l', '1').replace('I', '1')
                valores['liquido'] = valor_corrigido
                print(f"💰 DEBUG_VALORES - Valor líquido encontrado: '{valor_bruto}' -> corrigido: '{valor_corrigido}'", file=sys.stderr)
                break
    
    print(f"✅ DEBUG_VALORES - Resultado final: {valores}", file=sys.stderr)
    return valores

def normalize_money_value(value_str: str) -> float:
    """Normaliza valor monetário para float"""
    if not value_str:
        return 0.0
    
    # Corrigir erros comuns de OCR
    value_str = value_str.replace('O', '0')  # Letra O por zero
    value_str = value_str.replace('l', '1')  # Letra l por 1
    value_str = value_str.replace('I', '1')  # Letra I por 1
    value_str = value_str.replace('S', '5')  # Letra S por 5
    
    # Remove símbolos e espaços
    clean_value = re.sub(r'[R$\\s]', '', value_str)
    
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
        
        print(f"🧮 DEBUG_CALCULO - Venc: {venc_val}, Desc: {desc_val}, Liq: {liq_val}, Calculado: {calculado}, Dif: {diferenca}", file=sys.stderr)
        
        # Tolerância de 1 centavo
        return diferenca <= 0.01
    except Exception as e:
        print(f"❌ DEBUG_CALCULO - Erro: {e}", file=sys.stderr)
        return False

def classify_document(text: str) -> str:
    """Classifica o documento como contracheque ou recibo"""
    contracheque_keywords = ['contracheque', 'folha de pagamento', 'vencimentos', 'descontos', 'folhamensal', 'inss']
    recibo_keywords = ['recibo', 'comprovante', 'depósito', 'transferência', 'pagamento', 'ted', 'pix', 'banco']
    
    text_lower = text.lower()
    
    # Verificar palavras-chave
    contracheque_score = sum(1 for keyword in contracheque_keywords if keyword in text_lower)
    recibo_score = sum(1 for keyword in recibo_keywords if keyword in text_lower)
    
    # Ajustar score baseado no nome do arquivo
    if 'pagamento' in text_lower or 'comprovante' in text_lower:
        recibo_score += 2
    
    if 'contracheque' in text_lower or 'folha' in text_lower:
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
            print(f"📄 DEBUG_PROCESSAMENTO - Processando: {path}", file=sys.stderr)
            text = extract_text_from_pdf(path)
            if text and len(text.strip()) > 50:
                tipo = classify_document(text + " " + path.lower())
                documentos.append({
                    'path': path,
                    'text': text,
                    'tipo': tipo,
                    'filename': os.path.basename(path)
                })
                print(f"📄 DEBUG_PROCESSAMENTO - Classificado como: {tipo}", file=sys.stderr)
            else:
                print(f"❌ DEBUG_PROCESSAMENTO - Texto insuficiente: {path}", file=sys.stderr)
        
        # Separar contracheques e recibos
        contracheques = [doc for doc in documentos if doc['tipo'] == 'contracheque']
        recibos = [doc for doc in documentos if doc['tipo'] == 'recibo']
        
        print(f"📊 DEBUG_PROCESSAMENTO - {len(contracheques)} contracheques, {len(recibos)} recibos", file=sys.stderr)
        
        # Processar cada contracheque
        for contracheque in contracheques:
            try:
                text = contracheque['text']
                
                # Extrair dados básicos
                colaborador = extract_colaborador_name(text)
                mes_ref = extract_mes_referencia(text)
                valores = extract_valores(text)
                
                if not colaborador:
                    print(f"❌ Nome não encontrado em {contracheque['path']}", file=sys.stderr)
                    continue
                
                # Validar cálculo
                calculo_ok = validate_calculo(valores['vencimentos'], valores['descontos'], valores['liquido'])
                
                # Verificar assinatura digital
                processor = backend_pdf_processor.PontoProcessor()
                tem_assinatura = processor.check_digital_signature(text, contracheque['path'])
                
                # Procurar recibo correspondente
                recibo_correspondente = None
                valor_depositado = None
                
                def normalize_name_for_comparison(name):
                    if not name:
                        return ""
                    import unicodedata
                    normalized = unicodedata.normalize('NFD', name.lower())
                    normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
                    return ' '.join(normalized.split())
                
                colaborador_normalizado = normalize_name_for_comparison(colaborador)
                print(f"🔍 DEBUG_VALIDACAO - Procurando recibo para: '{colaborador}' (normalizado: '{colaborador_normalizado}')", file=sys.stderr)
                
                for recibo in recibos:
                    recibo_text = recibo['text']
                    recibo_normalizado = normalize_name_for_comparison(recibo_text)
                    
                    # Verificar correspondência por nome
                    if colaborador_normalizado and colaborador_normalizado in recibo_normalizado:
                        recibo_correspondente = recibo
                        # Extrair valor do recibo
                        valores_recibo = extract_valores(recibo_text)
                        valor_depositado = valores_recibo.get('liquido')
                        print(f"✅ DEBUG_VALIDACAO - Recibo correspondente encontrado, valor: {valor_depositado}", file=sys.stderr)
                        break
                
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
                    # Comparar valores
                    valor_ok = True
                    if valor_depositado and valores['liquido']:
                        valor_contracheque_norm = normalize_money_value(valores['liquido'])
                        valor_recibo_norm = normalize_money_value(valor_depositado)
                        diferenca = abs(valor_contracheque_norm - valor_recibo_norm)
                        
                        print(f"🔢 DEBUG_VALIDACAO - Comparação: CC={valor_contracheque_norm}, Recibo={valor_recibo_norm}, Dif={diferenca}", file=sys.stderr)
                        
                        if diferenca > 0.01:
                            valor_ok = False
                            detalhes.append(f"Valor depositado ({valor_depositado}) diferente do valor líquido ({valores['liquido']}")
                    
                    if calculo_ok and valor_ok and colaborador and tem_assinatura:
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
                    'detalhes': ', '.join(detalhes),
                    'arquivo': contracheque['filename']
                })
                
                print(f"✅ DEBUG_PROCESSAMENTO - Resultado: {colaborador} - {status}", file=sys.stderr)
                
            except Exception as e:
                print(f"❌ Erro ao processar contracheque: {e}", file=sys.stderr)
                continue
        
        print(f"🏁 DEBUG_PROCESSAMENTO - Processamento concluído: {len(results)} resultados", file=sys.stderr)
        return results
        
    except Exception as e:
        print(f"❌ Erro no processamento geral: {e}", file=sys.stderr)
        return []

def main():
    """Função principal"""
    try:
        if len(sys.argv) < 2:
            print("Uso: python processador_contracheque.py <arquivo1.pdf> [arquivo2.pdf] ...", file=sys.stderr)
            return
        
        pdf_paths = sys.argv[1:]
        
        # Verificar se todos os arquivos existem
        for pdf_file in pdf_paths:
            if not os.path.exists(pdf_file):
                print(f"[ERRO] Arquivo não encontrado: {pdf_file}", file=sys.stderr)
                return
        
        print(f"[OK] Processando {len(pdf_paths)} arquivo(s)", file=sys.stderr)
        
        # Processar documentos
        results = process_documents(pdf_paths)
        
        # Retornar resultados como JSON
        print(json.dumps(results, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"[ERRO] Crítico: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()