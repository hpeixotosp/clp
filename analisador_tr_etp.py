#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisador de TRs e ETPs
Sistema de analise automatizada de conformidade legal

Autor: TRT21-CLP
Versao: 1.0
"""

import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Optional
import fitz  # PyMuPDF
import tabula
import pandas as pd
import google.generativeai as genai
import os

# Configurar encoding UTF-8 para preservar caracteres especiais do português
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Configurar stdout e stderr para UTF-8
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

class AnalisadorTREtp:
    def __init__(self, api_key: str):
        """Inicializa o analisador com a chave da API do Google AI"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
    def extrair_texto_pdf(self, caminho_arquivo: str) -> str:
        """Extrai texto de um PDF usando PyMuPDF"""
        try:
            doc = fitz.open(caminho_arquivo)
            texto_completo = ""
            
            for pagina in doc:
                texto_pagina = pagina.get_text()
                texto_completo += texto_pagina + "\n"
            
            doc.close()
            return texto_completo
            
        except Exception as e:
            raise ValueError(f"Erro ao processar PDF: {str(e)}")
    
    def extrair_tabelas_csv(self, caminho_arquivo: str) -> str:
        """Extrai tabelas do PDF e converte para CSV usando tabula-py"""
        try:
            # Extrair todas as tabelas
            tabelas = tabula.read_pdf(caminho_arquivo, pages='all')
            
            if not tabelas:
                return ""
            
            # Converter cada tabela para CSV
            csv_content = ""
            for i, tabela in enumerate(tabelas):
                if not tabela.empty:
                    csv_content += f"\n--- TABELA {i+1} ---\n"
                    csv_content += tabela.to_csv(index=False, header=True)
                    csv_content += "\n"
            
            return csv_content
            
        except Exception as e:
            print(f"Aviso: Nao foi possivel extrair tabelas: {str(e)}")
            return ""
    
    def montar_prompt_ia(self, texto: str, tabelas_csv: str, tipo_documento: str, pontos_foco: str = "") -> str:
        """Monta o prompt completo para a IA"""
        
        prompt_base = f"""
ATENÇÃO CRÍTICA: VOCÊ É OBRIGADO A SEGUIR ESTAS REGRAS SEM EXCEÇÃO

REGRA 1: NUNCA, EM HIPÓTESE ALGUMA, USE EMOJIS, SÍMBOLOS OU CARACTERES ESPECIAIS
REGRA 2: USE APENAS LETRAS (a-z, A-Z, ç, ã, õ, á, é, í, ó, ú), NÚMEROS (0-9), ESPAÇOS E PONTUAÇÃO BÁSICA
REGRA 3: SE VOCÊ USAR QUALQUER EMOJI, A RESPOSTA SERÁ REJEITADA
REGRA 4: SE VOCÊ USAR QUALQUER SÍMBOLO ESPECIAL, A RESPOSTA SERÁ REJEITADA
REGRA 5: USE APENAS TEXTO SIMPLES E DIRETO
REGRA 6: PRESERVE TODOS OS CARACTERES ESPECIAIS DO PORTUGUÊS (ç, ã, õ, á, é, í, ó, ú)

INSTRUÇÕES TÉCNICAS:
- NÃO USE 🔴, 🔵, 🟢, ✅, ❌, 🚀, 📄, 🔧, 📊, 📝, 🔄, 🤖, 📤, 📋, 🎯
- NÃO USE QUALQUER CARACTERE UNICODE DESNECESSÁRIO
- USE APENAS CARACTERES LATINOS BÁSICOS + CARACTERES ESPECIAIS DO PORTUGUÊS
- SEJA DIRETO E OBJETIVO
- NÃO ADICIONE FORMATAÇÃO EXTRA
- PRESERVE ACENTOS E CEDILHAS CORRETAMENTE

ANÁLISE DO DOCUMENTO:
TIPO: {tipo_documento.upper()}
PONTOS DE FOCO: {pontos_foco if pontos_foco else "Análise completa do documento"}

CONTEXTO DO DOCUMENTO:
{texto[:2000]}{"..." if len(texto) > 2000 else ""}

TABELAS EXTRAÍDAS:
{tabelas_csv[:1000] if tabelas_csv else "Nenhuma tabela encontrada"}

INSTRUÇÕES ESPECÍFICAS:
1. Analise a conformidade legal do documento
2. Identifique possíveis problemas ou melhorias
3. Forneça recomendações práticas
4. Use linguagem técnica mas acessível
5. PRESERVE TODOS OS CARACTERES ESPECIAIS DO PORTUGUÊS
6. NÃO USE EMOJIS OU SÍMBOLOS

FORMATO DE RESPOSTA:
Responda em português brasileiro, preservando todos os acentos e caracteres especiais.
Seja objetivo e técnico, mas mantenha a clareza.
"""
        return prompt_base
    
    def analisar_documento(self, texto: str, tabelas_csv: str, tipo_documento: str, pontos_foco: str = "") -> Dict:
        """Analisa o documento usando IA"""
        try:
            # Montar prompt completo
            prompt = self.montar_prompt_ia(texto, tabelas_csv, tipo_documento, pontos_foco)
            
            # Chamar IA
            response = self.model.generate_content(prompt)
            
            # Tentar extrair JSON da resposta
            # LIMPEZA RADICAL DE EMOJIS - SOLUÇÃO DEFINITIVA
            response_ascii = response.text.encode('ascii', 'ignore').decode('ascii')
            
            # Limpeza RADICAL: remover TODOS os emojis e caracteres especiais
            import re
            response_clean = re.sub(r'[^\x00-\x7F]+', '', response_ascii)
            
            # Limpeza adicional de emojis específicos
            response_clean = re.sub(r'[🔴🔵🟢✅❌🚀📄🔧📊📝🔄🤖📤📋🎯]', '', response_clean)
            
            # LIMPEZA FINAL: remover QUALQUER caractere restante
            response_final = re.sub(r'[^\x00-\x7F]+', '', response_clean)
            
            json_match = re.search(r'\{.*\}', response_final, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    # Se falhar, retornar resposta formatada manualmente
                    return self.formatar_resposta_manual(response_ascii)
            else:
                return self.formatar_resposta_manual(response_ascii)
                
        except Exception as e:
            return {
                "error": f"Erro na analise: {str(e)}",
                "results": []
            }
    
    def formatar_resposta_manual(self, texto_resposta: str) -> Dict:
        """Formata manualmente a resposta se o JSON falhar"""
        return {
            "results": [
                {
                    "section": "Analise Geral",
                    "findings": [
                        {
                            "category": "SUGESTAO DE MELHORIA",
                            "description": "Resposta da IA processada manualmente",
                            "legalBasis": "Analise baseada no conteudo fornecido",
                            "recommendation": "Revisar a resposta completa da IA",
                            "impact": "Informacoes podem estar incompletas"
                        }
                    ]
                }
            ],
            "raw_response": texto_resposta
        }

def main():
    parser = argparse.ArgumentParser(description='Analisador de TRs e ETPs')
    parser.add_argument('--file', help='Caminho para o arquivo PDF')
    parser.add_argument('--text', help='Texto do documento')
    parser.add_argument('--type', choices=['tr', 'etp'], default='tr', help='Tipo de documento')
    parser.add_argument('--focus', help='Pontos de foco para analise')
    parser.add_argument('--api-key', required=True, help='Chave da API do Google AI')
    
    args = parser.parse_args()
    
    if not args.file and not args.text:
        print(json.dumps({
            "error": "E necessario fornecer um arquivo PDF ou texto para analise"
        }))
        sys.exit(1)
    
    try:
        # Inicializar analisador
        analisador = AnalisadorTREtp(args.api_key)
        
        texto = ""
        tabelas_csv = ""
        
        # Processar arquivo PDF se fornecido
        if args.file:
            if not Path(args.file).exists():
                print(json.dumps({
                    "error": f"Arquivo nao encontrado: {args.file}"
                }))
                sys.exit(1)
            
            texto = analisador.extrair_texto_pdf(args.file)
            tabelas_csv = analisador.extrair_tabelas_csv(args.file)
        
        # Usar texto fornecido se nao houver arquivo
        if not texto and args.text:
            texto = args.text
        
        # Analisar documento
        resultado = analisador.analisar_documento(
            texto, 
            tabelas_csv, 
            args.type, 
            args.focus or ""
        )
        
        # Retornar resultado
        resultado_json = json.dumps(resultado, ensure_ascii=False, separators=(',', ':'), default=str)
        
        # LIMPEZA SELETIVA: remover apenas emojis e símbolos indesejados, preservando caracteres especiais do português
        import re
        
        # Remover emojis específicos
        resultado_limpo = re.sub(r'[🔴🔵🟢✅❌🚀📄🔧📊📝🔄🤖📤📋🎯]', '', resultado_json)
        
        # Remover outros símbolos unicode desnecessários, mas preservar caracteres latinos
        resultado_limpo = re.sub(r'[^\x00-\x7F\u00A0-\u017F\u00C0-\u00FF\u0100-\u017F]+', '', resultado_limpo)
        
        # Garantir que caracteres especiais do português sejam preservados
        resultado_final = resultado_limpo
        
        # Imprimir resultado preservando encoding UTF-8
        print(resultado_final)
        
    except Exception as e:
        print(json.dumps({
            "error": f"Erro fatal: {str(e)}",
            "results": []
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
