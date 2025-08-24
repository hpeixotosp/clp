#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Analisador de TR/ETP - VERSÃO SEGURA PRESERVANDO CARACTERES ESPECIAIS
Sistema de análise de Termos de Referência e Estudos Técnicos Preliminares
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path

# Configurar encoding UTF-8 para preservar caracteres especiais do português
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Configurar stdout e stderr para UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Importações específicas
try:
    import fitz  # PyMuPDF
    import tabula
    import google.generativeai as genai
except ImportError as e:
    print(json.dumps({
        "error": f"Erro ao importar bibliotecas: {str(e)}. Execute 'pip install -r requirements_tr_etp.txt'",
        "results": []
    }))
    sys.exit(1)

class AnalisadorTREtp:
    def __init__(self, api_key):
        self.api_key = api_key
        self.configurar_genai()
    
    def configurar_genai(self):
        try:
            genai.configure(api_key=self.api_key)
            self.modelo = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            print(json.dumps({
                "error": f"Erro ao configurar Google AI: {str(e)}",
                "results": []
            }))
            sys.exit(1)
    
    def extrair_texto_pdf(self, arquivo_pdf):
        try:
            texto = ""
            with fitz.open(arquivo_pdf) as doc:
                for pagina in doc:
                    texto += pagina.get_text()
            return texto
        except Exception as e:
            print(json.dumps({
                "error": f"Erro ao extrair texto do PDF: {str(e)}",
                "results": []
            }))
            sys.exit(1)
    
    def extrair_tabelas_pdf(self, arquivo_pdf):
        try:
            # Verificar se Java está disponível
            tabelas_df = tabula.read_pdf(arquivo_pdf, pages='all', multiple_tables=True)
            
            # Converter DataFrames para CSV
            tabelas_csv = ""
            for i, df in enumerate(tabelas_df):
                if not df.empty:
                    tabelas_csv += f"TABELA {i+1}:\n"
                    tabelas_csv += df.to_csv(index=False)
                    tabelas_csv += "\n\n"
            
            return tabelas_csv
        except Exception as e:
            # Se falhar, retornar mensagem de erro mas continuar
            return f"Não foi possível extrair tabelas: {str(e)}"
    
    def analisar_documento(self, texto, tabelas_csv, tipo_documento, pontos_foco=None):
        try:
            # Construir prompt base
            prompt_base = f"""
ATENÇÃO CRÍTICA: VOCÊ É OBRIGADO A SEGUIR ESTAS REGRAS SEM EXCEÇÃO

REGRA 1: NUNCA USE EMOJIS OU SÍMBOLOS ESPECIAIS
REGRA 2: USE APENAS LETRAS (a-z, A-Z, ç, ã, õ, á, é, í, ó, ú), NÚMEROS (0-9), ESPAÇOS E PONTUAÇÃO BÁSICA
REGRA 3: CATEGORIAS DEVEM SER APENAS: "CONFORMIDADE", "NÃO CONFORMIDADE", "SUGESTÃO DE MELHORIA"
REGRA 4: PRESERVE TODOS OS CARACTERES ESPECIAIS DO PORTUGUÊS (ç, ã, õ, á, é, í, ó, ú)
REGRA 5: NÃO USE QUALQUER CARACTERE UNICODE DESNECESSÁRIO

ANÁLISE DO DOCUMENTO:
TIPO: {tipo_documento.upper()}
PONTOS DE FOCO: {pontos_foco if pontos_foco else "Análise completa do documento"}

TEXTO DO DOCUMENTO:
{texto}

TABELAS EXTRAÍDAS:
{tabelas_csv}

FORMATO DE RESPOSTA (JSON):
{{
  "results": [
    {{
      "sectionTitle": "Título da Seção Analisada",
      "findings": [
        {{
          "category": "CONFORMIDADE",
          "description": "Este item está em conformidade com a legislação vigente."
        }},
        {{
          "category": "NÃO CONFORMIDADE",
          "description": "Descrição detalhada do apontamento...",
          "legalBasis": "Fundamentação legal...",
          "recommendation": "Recomendação acionável...",
          "potentialImpact": "Impacto potencial..."
        }}
      ]
    }}
  ]
}}

LEMBRE-SE: SEM EMOJIS, SEM SÍMBOLOS, MAS PRESERVE CARACTERES ESPECIAIS DO PORTUGUÊS!
"""
            
            # Enviar prompt para o modelo
            response = self.modelo.generate_content(prompt_base)
            
            # Limpeza seletiva: remover apenas emojis e símbolos indesejados, preservando caracteres especiais
            response_text = response.text
            
            # Remover emojis específicos
            response_clean = re.sub(r'[🔴🔵🟢✅❌🚀📄🔧📊📝🔄🤖📤📋🎯]', '', response_text)
            
            # Remover outros símbolos unicode desnecessários, mas preservar caracteres latinos
            response_clean = re.sub(r'[^\x00-\x7F\u00A0-\u017F\u00C0-\u00FF\u0100-\u017F]+', '', response_clean)
            
            # Buscar JSON na resposta
            json_match = re.search(r'\{.*\}', response_clean, re.DOTALL)
            if json_match:
                try:
                    # Fazer parse do JSON preservando caracteres especiais
                    json_text = json_match.group()
                    return json.loads(json_text)
                except json.JSONDecodeError:
                    # Se falhar, retornar resposta formatada manualmente
                    return {
                        "results": [
                            {
                                "sectionTitle": "Erro de Processamento",
                                "findings": [
                                    {
                                        "category": "NÃO CONFORMIDADE",
                                        "description": "Não foi possível processar a resposta da IA em formato JSON.",
                                        "legalBasis": "N/A",
                                        "recommendation": "Tente novamente ou contate o suporte.",
                                        "potentialImpact": "Análise incompleta."
                                    }
                                ]
                            }
                        ]
                    }
            else:
                return {
                    "results": [
                        {
                            "sectionTitle": "Erro de Processamento",
                            "findings": [
                                {
                                    "category": "NAO CONFORMIDADE",
                                    "description": "Não foi possível encontrar JSON na resposta da IA.",
                                    "legalBasis": "N/A",
                                    "recommendation": "Tente novamente ou contate o suporte.",
                                    "potentialImpact": "Análise incompleta."
                                }
                            ]
                        }
                    ]
                }
                  
        except Exception as e:
            return {
                "results": [
                    {
                        "sectionTitle": "Erro de Processamento",
                        "findings": [
                            {
                                "category": "NAO CONFORMIDADE",
                                "description": f"Erro ao processar documento: {str(e)}",
                                "legalBasis": "N/A",
                                "recommendation": "Tente novamente ou contate o suporte.",
                                "potentialImpact": "Análise incompleta."
                            }
                        ]
                    }
                ]
            }

def main():
    try:
        parser = argparse.ArgumentParser(description='Analisador de TR/ETP')
        parser.add_argument('--type', choices=['tr', 'etp'], required=True, help='Tipo de documento (TR ou ETP)')
        parser.add_argument('--api-key', required=True, help='API key para o Google AI')
        parser.add_argument('--file', help='Caminho para o arquivo PDF')
        parser.add_argument('--text', help='Texto para análise')
        parser.add_argument('--focus-points', help='Pontos de foco para a análise')
        
        args = parser.parse_args()
        
        if not args.file and not args.text:
            print(json.dumps({
                "error": "Erro: É necessário fornecer um arquivo ou texto para análise",
                "results": []
            }))
            sys.exit(1)
        
        analisador = AnalisadorTREtp(args.api_key)
        
        # Extrair texto e tabelas do PDF ou usar texto fornecido
        if args.file:
            texto = analisador.extrair_texto_pdf(args.file)
            tabelas_csv = analisador.extrair_tabelas_pdf(args.file)
        else:
            texto = args.text
            tabelas_csv = ""
        
        # Analisar documento
        resultado = analisador.analisar_documento(texto, tabelas_csv, args.type, args.focus_points)
        
        # Retornar resultado
        resultado_json = json.dumps(resultado, ensure_ascii=True, separators=(',', ':'), default=str)
        
        # Limpar novamente qualquer caractere não ASCII
        resultado_limpo = resultado_json.encode('ascii', 'ignore').decode('ascii')
        print(resultado_limpo)
        
    except Exception as e:
        print(json.dumps({
            "error": f"Erro fatal: {str(e)}",
            "results": []
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
