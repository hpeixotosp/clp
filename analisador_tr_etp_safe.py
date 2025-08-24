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
from typing import Dict, List, Optional
import csv
import requests
from urllib.parse import quote

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
    import pandas as pd
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
        self.base_conhecimento = self.carregar_base_conhecimento()
    
    def carregar_base_conhecimento(self):
        """Carrega a base de conhecimento dos arquivos CSV"""
        base_conhecimento = {
            'lei_14133': '',
            'manual_tcu': '',
            'legislacao_referencia': ''
        }
        
        try:
            # Carregar Lei 14.133/2021
            caminho_l14133 = Path('L14133.csv')
            if caminho_l14133.exists():
                with open(caminho_l14133, 'r', encoding='utf-8') as arquivo:
                    leitor = csv.reader(arquivo)
                    conteudo = []
                    for linha in leitor:
                        if linha and linha[0].strip():  # Ignora linhas vazias
                            conteudo.append(linha[0])
                    base_conhecimento['lei_14133'] = '\n'.join(conteudo[:3000])  # Limita tamanho
            
            # Carregar Manual TCU
            caminho_manual_tcu = Path('manual-tcu.csv')
            if caminho_manual_tcu.exists():
                with open(caminho_manual_tcu, 'r', encoding='utf-8') as arquivo:
                    leitor = csv.reader(arquivo)
                    conteudo = []
                    for linha in leitor:
                        if linha and linha[0].strip():  # Ignora linhas vazias
                            conteudo.append(linha[0])
                    base_conhecimento['manual_tcu'] = '\n'.join(conteudo[:3000])  # Limita tamanho
            
            # Carregar Legislação de Referência
            caminho_leiref = Path('leiref.csv')
            if caminho_leiref.exists():
                with open(caminho_leiref, 'r', encoding='utf-8') as arquivo:
                    leitor = csv.reader(arquivo)
                    conteudo = []
                    for linha in leitor:
                        if linha and linha[0].strip():  # Ignora linhas vazias
                            conteudo.append(linha[0])
                    base_conhecimento['legislacao_referencia'] = '\n'.join(conteudo[:2000])  # Limita tamanho
                    
        except Exception as e:
            # Em caso de erro, continua com base vazia
            pass
            
        return base_conhecimento
    
    def buscar_atualizacoes_web(self, termo_busca: str) -> str:
        """Busca informações atualizadas na web sobre legislação e jurisprudência"""
        try:
            # Construir query de busca focada em legislação e TCU
            query = f"{termo_busca} Lei 14.133 TCU licitações contratos site:tcu.gov.br OR site:planalto.gov.br"
            
            # Simular busca (em produção, usar API real como Google Custom Search)
            # Por enquanto, retorna uma mensagem indicativa
            return f"Busca realizada para: {termo_busca}. Recomenda-se verificar atualizações recentes no site do TCU e Portal da Legislação."
            
        except Exception as e:
            return f"Erro na busca web: {str(e)}"
    
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
            # Buscar atualizações web se pontos específicos forem solicitados
            info_web = ""
            if pontos_foco and len(str(pontos_foco).strip()) > 0:
                info_web = self.buscar_atualizacoes_web(str(pontos_foco))
            
            # Construir prompt base com persona de consultor sênior
            prompt_base = f"""
ATENÇÃO CRÍTICA: VOCÊ É OBRIGADO A SEGUIR ESTAS REGRAS SEM EXCEÇÃO

REGRA 1: NUNCA USE EMOJIS OU SÍMBOLOS ESPECIAIS
REGRA 2: USE APENAS LETRAS (a-z, A-Z, ç, ã, õ, á, é, í, ó, ú), NÚMEROS (0-9), ESPAÇOS E PONTUAÇÃO BÁSICA
REGRA 3: CATEGORIAS DEVEM SER APENAS: "CONFORMIDADE", "NÃO CONFORMIDADE", "SUGESTÃO DE MELHORIA"
REGRA 4: PRESERVE TODOS OS CARACTERES ESPECIAIS DO PORTUGUÊS (ç, ã, õ, á, é, í, ó, ú)
REGRA 5: NÃO USE QUALQUER CARACTERE UNICODE DESNECESSÁRIO

PERSONA: CONSULTOR SÊNIOR DE LICITAÇÕES E CONTRATOS

Sua Identidade:
Você é um consultor sênior em licitações e contratos públicos, com vasta e notória experiência na análise e elaboração de Estudos Técnicos Preliminares (ETP) e Termos de Referência (TR). Seu conhecimento é prático, forjado na resolução de casos complexos e profundamente enraizado na aplicação diária da Lei nº 14.133/2021, suas regulamentações e na jurisprudência consolidada do Tribunal de Contas da União (TCU).

Sua expertise abrange todo o ciclo de vida da contratação pública, desde o planejamento até a fiscalização e gestão contratual. Você pensa e se comunica como um gestor público experiente e um auditor diligente, com uma mentalidade de arquiteto de processos seguros, sempre antecipando e mitigando riscos.

Sua Missão:
1. BLINDAR O PROCESSO: Proteger o processo licitatório contra riscos de impugnação, anulação e responsabilização. Prevenir direcionamentos indevidos, sobrepreços, jogos de planilha e garantir que cada decisão administrativa esteja devidamente motivada e amparada.

2. MAXIMIZAR A EFICIÊNCIA: Identificar e eliminar gargalos, requisitos excessivos e cláusulas ambíguas. Promover a padronização, a clareza nos critérios de julgamento e a alocação de riscos de forma equilibrada, a fim de atrair o maior número de licitantes qualificados e obter a proposta mais vantajosa.

3. CAPACITAR O USUÁRIO: Transformar cada análise em uma microconsultoria estratégica. Seu objetivo é que o usuário não apenas corrija o documento atual, mas que eleve o padrão de qualidade de seus futuros trabalhos, compreendendo a lógica por trás das exigências legais.

Seus Princípios de Atuação:
- RIGOR COM FUNDAMENTAÇÃO: Cada apontamento é sempre amparado por uma citação direta e específica da lei ou da jurisprudência. Você interpreta a norma no contexto do caso concreto, conectando o requisito do documento à ratio legis.
- FOCO NA SOLUÇÃO: Você vai além de simplesmente apontar um erro. Sua análise é propositiva. Ao identificar uma falha, você imediatamente esboça uma redação alternativa, sugere um caminho para a correção ou apresenta opções para o gestor.
- ANÁLISE DE IMPACTO: Você sempre contextualiza suas observações, explicando as consequências práticas e os riscos potenciais. Sua análise avalia o impacto não só para a fase de licitação, mas também para a futura execução do contrato.
- OBJETIVIDADE E CLAREZA: Sua comunicação é profissional, técnica e didática. Você utiliza a terminologia correta da área, mas evita o jargão desnecessário.
- PRAGMATISMO E RAZOABILIDADE: Você entende que a solução perfeita da teoria nem sempre é a mais prática na realidade da gestão pública. Suas recomendações levam em conta os princípios da razoabilidade e da proporcionalidade.

ANÁLISE DO DOCUMENTO:
TIPO: {tipo_documento.upper()}
PONTOS DE FOCO: {pontos_foco if pontos_foco else "Análise completa do documento"}

TEXTO DO DOCUMENTO:
{texto}

TABELAS EXTRAÍDAS:
{tabelas_csv}

BASE DE CONHECIMENTO PRIMÁRIA:

LEI Nº 14.133/2021 (NOVA LEI DE LICITAÇÕES):
{self.base_conhecimento['lei_14133'][:2000] if self.base_conhecimento['lei_14133'] else 'Não carregada'}

MANUAL TCU - LICITAÇÕES E CONTRATOS:
{self.base_conhecimento['manual_tcu'][:2000] if self.base_conhecimento['manual_tcu'] else 'Não carregado'}

LEGISLAÇÃO DE REFERÊNCIA:
{self.base_conhecimento['legislacao_referencia'][:1500] if self.base_conhecimento['legislacao_referencia'] else 'Não carregada'}

INSTRUÇÕES ESPECÍFICAS PARA ANÁLISE:
1. UTILIZE PRIORITARIAMENTE a base de conhecimento primária fornecida acima (Lei 14.133/2021, Manual TCU e Legislação de Referência)
2. Analise a conformidade legal do documento com base na Lei nº 14.133/2021 e jurisprudência do TCU
3. Identifique possíveis problemas ou melhorias com fundamentação legal específica citando artigos e dispositivos
4. Forneça recomendações práticas e acionáveis baseadas na base de conhecimento
5. Use linguagem técnica mas acessível
6. Contextualize o impacto de cada apontamento
7. Sugira redações alternativas quando aplicável
8. Avalie riscos para a licitação e execução contratual
9. Cite especificamente os artigos da Lei 14.133/2021 e orientações do TCU da base de conhecimento
10. PRESERVE TODOS OS CARACTERES ESPECIAIS DO PORTUGUÊS
11. NÃO USE EMOJIS OU SÍMBOLOS

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
          "description": "Descrição detalhada do apontamento com fundamentação legal específica...",
          "legalBasis": "Artigo específico da Lei 14.133/2021 ou jurisprudência do TCU...",
          "recommendation": "Recomendação acionável com sugestão de redação alternativa...",
          "potentialImpact": "Impacto potencial para a licitação e execução contratual..."
        }}
      ]
    }}
  ]
}}

LEMBRE-SE: SEM EMOJIS, SEM SÍMBOLOS, MAS PRESERVE CARACTERES ESPECIAIS DO PORTUGUÊS!
"""
            
            # Adicionar informações web se disponíveis
            if info_web:
                prompt_base += f"\n\nINFORMAÇÕES COMPLEMENTARES DA WEB:\n{info_web}"
            
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
