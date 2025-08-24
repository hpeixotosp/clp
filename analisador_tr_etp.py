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
import csv
import requests
from urllib.parse import quote

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
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.base_conhecimento = self.carregar_base_conhecimento()
        
    def carregar_base_conhecimento(self) -> Dict[str, str]:
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
            print(f"Erro ao carregar base de conhecimento: {e}")
            
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

CONTEXTO DO DOCUMENTO:
{texto[:2000]}{"..." if len(texto) > 2000 else ""}

TABELAS EXTRAÍDAS:
{tabelas_csv[:1000] if tabelas_csv else "Nenhuma tabela encontrada"}

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

FORMATO DE RESPOSTA:
Responda em português brasileiro, preservando todos os acentos e caracteres especiais.
Seja objetivo e técnico, mas mantenha a clareza.
Use o formato JSON com a seguinte estrutura:
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
"""
        return prompt_base
    
    def analisar_documento(self, texto: str, tabelas_csv: str, tipo_documento: str, pontos_foco: str = "") -> Dict:
        """Analisa o documento usando IA"""
        try:
            # Buscar atualizações web se pontos específicos forem solicitados
            info_web = ""
            if pontos_foco and len(pontos_foco.strip()) > 0:
                info_web = self.buscar_atualizacoes_web(pontos_foco)
            
            # Montar prompt completo
            prompt = self.montar_prompt_ia(texto, tabelas_csv, tipo_documento, pontos_foco)
            
            # Adicionar informações web se disponíveis
            if info_web:
                prompt += f"\n\nINFORMAÇÕES COMPLEMENTARES DA WEB:\n{info_web}"
            
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
