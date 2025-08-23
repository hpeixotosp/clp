#!/usr/bin/env python3
"""
Analisador de Proposta Técnica - VERSÃO ROBUSTA PARA VERCEL
Converte PDFs de TR e Propostas para CSV e extrai informações estruturadas
"""

import sys
import os

# Verificar dependências críticas
try:
    import pdfplumber
    print("✓ pdfplumber importado com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"❌ ERRO: pdfplumber não encontrado: {e}", file=sys.stderr)
    print("Instale com: pip install pdfplumber", file=sys.stderr)
    sys.exit(1)

try:
    import google.generativeai as genai
    print("✓ google-generativeai importado com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"❌ ERRO: google-generativeai não encontrado: {e}", file=sys.stderr)
    print("Instale com: pip install google-generativeai", file=sys.stderr)
    sys.exit(1)

try:
    import argparse
    import json
    import re
    import time
    print("✓ Bibliotecas padrão importadas com sucesso", file=sys.stderr)
except ImportError as e:
    print(f"❌ ERRO: Biblioteca padrão não encontrada: {e}", file=sys.stderr)
    sys.exit(1)

# Configurar encoding
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
        print("✓ Encoding configurado para UTF-8", file=sys.stderr)
    except Exception as e:
        print(f"⚠️ Aviso: Não foi possível configurar encoding: {e}", file=sys.stderr)

print("=== INICIANDO ANALISADOR DE PROPOSTA ===", file=sys.stderr)
print(f"Python version: {sys.version}", file=sys.stderr)
print(f"Diretório atual: {os.getcwd()}", file=sys.stderr)
print(f"Script: {__file__}", file=sys.stderr)

def configure_ai():
    """Configura o modelo de IA generativa."""
    try:
        # Usar API key do ambiente
        api_key = os.environ.get('GOOGLE_AI_API_KEY')
        if not api_key:
            print(json.dumps({"error": "GOOGLE_AI_API_KEY não encontrada no ambiente"}), file=sys.stderr)
            sys.exit(1)
        
        genai.configure(api_key=api_key)
        print(f"✓ API key configurada", file=sys.stderr)
        
        # Configurações de segurança para permitir uma gama mais ampla de prompts
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        model = genai.GenerativeModel('gemini-1.5-flash', safety_settings=safety_settings)
        print("✓ Modelo configurado com sucesso", file=sys.stderr)
        return model
    except Exception as e:
        print(json.dumps({"error": f"Erro ao configurar a IA. Detalhes: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

def extract_full_text_with_pages(pdf_path):
    """Extrai o texto completo do PDF, mantendo a referência de página."""
    print(f"✓ Extraindo texto de: {pdf_path}", file=sys.stderr)
    full_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"✓ PDF aberto: {len(pdf.pages)} páginas", file=sys.stderr)
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    full_text += f"[Página {i+1}]\\n{page_text}\\n\\n"
                    print(f"✓ Página {i+1}: {len(page_text)} caracteres", file=sys.stderr)
        print(f"✓ Extração concluída: {len(full_text)} caracteres totais", file=sys.stderr)
    except Exception as e:
        error_msg = f"Erro ao ler o PDF {os.path.basename(pdf_path)}: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr)
        return error_msg
    return full_text

def identify_items_in_tr(model, tr_text):
    """Usa a IA para identificar os itens distintos sendo licitados no TR."""
    print("✓ Identificando itens no TR", file=sys.stderr)
    prompt = f"""
    Você é um especialista em licitações. Sua tarefa é ler o Termo de Referência (TR) e identificar os principais itens que estão sendo solicitados.
    Liste apenas os nomes dos itens.

    Exemplo de saída:
    {{
        "items": [
            "Bateria Tracionária",
            "Carregador de Bateria",
            "Empilhadeira Elétrica"
        ]
    }}

    Retorne um objeto JSON com uma chave "items", que é um array de strings.

    Texto do Termo de Referência:
    {tr_text}
    """
    try:
        response = model.generate_content(prompt)
        clean_response = response.text.strip()
        print(f"✓ Resposta da IA recebida: {len(clean_response)} caracteres", file=sys.stderr)
        
        match = re.search(r'\{.*\}', clean_response, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            items = data.get("items", [])
            print(f"✓ {len(items)} itens identificados", file=sys.stderr)
            return items
        
        print("❌ A IA não retornou JSON válido", file=sys.stderr)
        return {"error": "A IA não conseguiu identificar os itens no TR."}
    except Exception as e:
        print(f"❌ Erro na identificação: {e}", file=sys.stderr)
        return {"error": f"Erro da IA ao identificar itens: {str(e)}"}

def get_requirements_from_tr(model, tr_text, item_name):
    """Usa a IA para extrair os requisitos técnicos e ambientais de um item específico."""
    print(f"✓ Extraindo requisitos para: {item_name}", file=sys.stderr)
    prompt = f"""
    Você é um especialista em análise de especificações técnicas e ambientais para licitações.
    Leia o Termo de Referência (TR) e extraia *apenas* os requisitos técnicos e de certificação para o seguinte item: "{item_name}".

    **O que extrair:**
    - Especificações de hardware (ex: "tensão de 24 volts", "tela OLED").
    - Características funcionais (ex: "sistema de refrigeração por ventilação forçada").
    - Requisitos de material e composição (ex: "placas positivas pluritubulares").
    - **Padrões, laudos e certificações técnicas ou ambientais (ex: "acreditado junto ao Inmetro", "Resolução Conama nº 401/2008", "Registro no CTF/IBAMA").**
    - Prazo de garantia, se especificado (ex: "garantia mínima de 24 meses").

    **O que IGNORAR (NÃO extrair):**
    - Cláusulas puramente contratuais (ex: "Não é admitida a subcontratação").
    - Prazos e condições de entrega.
    - Detalhes sobre a execução da garantia (ex: "O custo do transporte será de responsabilidade do Contratado").
    - Obrigações legais, fiscais ou trabalhistas do fornecedor.
    - Condições de pagamento.

    Retorne um objeto JSON com uma chave "requirements", que é um array de strings.

    Texto do Termo de Referência:
    {tr_text}
    """
    try:
        response = model.generate_content(prompt)
        clean_response = response.text.strip()
        print(f"✓ Resposta da IA recebida: {len(clean_response)} caracteres", file=sys.stderr)
        
        match = re.search(r'\{.*\}', clean_response, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            requirements = data.get("requirements", [])
            print(f"✓ {len(requirements)} requisitos extraídos", file=sys.stderr)
            return requirements
        
        print("❌ A IA não retornou JSON válido", file=sys.stderr)
        return {"error": f"A IA não retornou um JSON de requisitos para o item '{item_name}'."}
    except Exception as e:
        print(f"❌ Erro na extração: {e}", file=sys.stderr)
        return {"error": f"Erro da IA ao extrair requisitos para o item '{item_name}': {str(e)}"}

def analyze_proposal_compliance_batch(model, requirements, proposal_text):
    """
    Analisa todos os requisitos técnicos de uma vez em relação ao texto da proposta,
    solicitando um formato de texto estruturado em vez de JSON.
    """
    if not requirements:
        return []

    print(f"✓ Analisando {len(requirements)} requisitos", file=sys.stderr)

    # Constrói uma string numerada de requisitos
    requirements_str = "\n".join([f"{i+1}. {req}" for i, req in enumerate(requirements)])

    prompt = f"""
    Análise de Conformidade de Proposta Técnica

    Contexto: Você é um assistente especialista em analisar propostas técnicas para licitações. Sua tarefa é verificar se uma proposta atende aos requisitos técnicos de um Termo de Referência (TR).

    Termo de Referência (TR) - Requisitos Técnicos Exigidos:
    ---
    {requirements_str}
    ---

    Proposta do Fornecedor - Texto Completo:
    ---
    {proposal_text}
    ---

    Sua Tarefa:
    Analise CADA UM dos {len(requirements)} requisitos listados acima, um por um, e verifique se eles são atendidos pelo texto da proposta. Para cada requisito, forneça as seguintes informações EXATAMENTE no formato especificado abaixo, sem adicionar comentários, introduções ou conclusões.

    Formato de Saída OBRIGATÓRIO (repita este bloco para cada requisito):

    REQUIREMENT: [Repita o texto completo do requisito aqui]
    STATUS: [Responda com UMA das três opções: "Atende", "Não Atende" ou "Parcialmente"]
    EVIDENCE: [Cite o trecho EXATO da proposta que comprova sua análise. Se não houver evidência, escreva "Nenhuma evidência encontrada na proposta."]
    PAGE: [Indique o número da página onde a evidência foi encontrada, se houver. Ex: "Página 5". Se não houver, escreva "N/A"]
    ---

    Comece a análise pelo requisito 1. Não inclua nada antes do primeiro bloco "REQUIREMENT:".
    """

    try:
        response = model.generate_content(prompt)
        # Tenta extrair o texto, lidando com possíveis erros de resposta
        clean_response = getattr(response, 'text', str(response))
        print(f"✓ Resposta da IA recebida: {len(clean_response)} caracteres", file=sys.stderr)

        # Parsing da resposta em texto estruturado
        analysis_items = []
        blocks = clean_response.strip().split('---')

        for block in blocks:
            if not block.strip():
                continue

            item = {}
            lines = block.strip().split('\n')
            
            # Um dicionário para mapear os prefixos para as chaves do item
            key_map = {
                "REQUIREMENT:": "requirement",
                "STATUS:": "status",
                "EVIDENCE:": "evidence",
                "PAGE:": "page"
            }

            for line in lines:
                line = line.strip()
                for prefix, key in key_map.items():
                    if line.startswith(prefix):
                        # Atribui o valor removendo o prefixo e espaços em branco
                        item[key] = line[len(prefix):].strip()
                        break
            
            # Garante que o bloco foi parseado corretamente antes de adicionar
            if "requirement" in item and "status" in item:
                # Garante que todas as chaves existam para consistência
                item.setdefault("evidence", "N/A")
                item.setdefault("page", "N/A")
                analysis_items.append(item)

        print(f"✓ {len(analysis_items)} itens analisados", file=sys.stderr)

        # Validação final: se o parsing falhou, retorna erro
        if not analysis_items or len(analysis_items) != len(requirements):
             # Se o parsing falhar, tentamos a análise individual como fallback
             print("⚠️ Parsing falhou, tentando análise individual", file=sys.stderr)
             return analyze_proposal_compliance_one_by_one(model, requirements, proposal_text)

        return analysis_items

    except Exception as e:
        # Se ocorrer qualquer erro na API ou no processo, recorre ao fallback
        print(f"❌ Erro na análise em lote: {e}", file=sys.stderr)
        return analyze_proposal_compliance_one_by_one(model, requirements, proposal_text)


def analyze_proposal_compliance_one_by_one(model, requirements, proposal_text):
    """
    Fallback: Analisa os requisitos um por um se a análise em lote falhar.
    """
    print("✓ Iniciando análise individual", file=sys.stderr)
    analysis_report = []
    for i, req in enumerate(requirements):
        try:
            print(f"✓ Analisando requisito {i+1}/{len(requirements)}", file=sys.stderr)
            
            # Reutiliza o mesmo prompt, mas para um único requisito
            prompt = f"""
            Análise de Conformidade de Proposta Técnica

            Contexto: Você é um assistente especialista em analisar propostas técnicas para licitações.

            Requisito Técnico a ser Analisado:
            ---
            {req}
            ---

            Proposta do Fornecedor - Texto Completo:
            ---
            {proposal_text}
            ---

            Sua Tarefa:
            Verifique se o requisito técnico acima é atendido pelo texto da proposta. Forneça sua análise EXATAMENTE no formato especificado abaixo.

            Formato de Saída OBRIGATÓRIO:

            REQUIREMENT: {req}
            STATUS: [Responda com UMA das três opções: "Atende", "Não Atende" ou "Parcialmente"]
            EVIDENCE: [Cite o trecho EXATO da proposta que comprova sua análise. Se não houver evidência, escreva "Nenhuma evidência encontrada na proposta."]
            PAGE: [Indique o número da página onde a evidência foi encontrada, se houver. Ex: "Página 5". Se não houver, escreva "N/A"]
            """
            
            response = model.generate_content(prompt)
            clean_response = getattr(response, 'text', str(response))
            
            # Parsing da resposta de item único
            item = {"requirement": req} # Já sabemos o requisito
            lines = clean_response.strip().split('\n')
            
            key_map = {
                "STATUS:": "status",
                "EVIDENCE:": "evidence",
                "PAGE:": "page"
            }

            for line in lines:
                line = line.strip()
                for prefix, key in key_map.items():
                    if line.startswith(prefix):
                        item[key] = line[len(prefix):].strip()
                        break
            
            item.setdefault("status", "Erro na Análise")
            item.setdefault("evidence", f"A IA não conseguiu processar este item. Detalhes: Resposta em formato inesperado.")
            item.setdefault("page", "N/A")
            analysis_report.append(item)
            
            time.sleep(1) # Pausa para evitar limites de taxa

        except Exception as e:
            print(f"❌ Erro no requisito {i+1}: {e}", file=sys.stderr)
            analysis_report.append({
                "requirement": req,
                "status": "Erro na Análise",
                "evidence": f"A IA não conseguiu processar este item. Detalhes: {str(e)}",
                "page": "N/A"
            })
    
    print(f"✓ Análise individual concluída: {len(analysis_report)} itens", file=sys.stderr)
    return analysis_report

def main():
    """Função principal que orquestra a análise."""
    try:
        print("=== INICIANDO FUNÇÃO MAIN ===", file=sys.stderr)
        
        parser = argparse.ArgumentParser(description='Análise de Propostas com IA.')
        parser.add_argument('--mode', required=True, choices=['identify_items', 'analyze_item'], help='Modo de operação.')
        parser.add_argument('--tr', required=True, help='Caminho para o PDF do TR.')
        parser.add_argument('--proposal', action='append', help='Caminho para um PDF da proposta. Pode ser usado várias vezes.')
        parser.add_argument('--item_name', help='Nome do item a ser analisado (necessário para o modo analyze_item).')
        
        args = parser.parse_args()
        print(f"Argumentos recebidos: {args}", file=sys.stderr)
        
        model = configure_ai()
        print("✓ Modelo de IA configurado", file=sys.stderr)

        tr_text = extract_full_text_with_pages(args.tr)
        if "Erro" in tr_text:
            print(json.dumps({"error": tr_text}))
            sys.exit(1)

        if args.mode == 'identify_items':
            print("=== MODO: IDENTIFICAR ITENS ===", file=sys.stderr)
            items = identify_items_in_tr(model, tr_text)
            print(json.dumps({"items": items}, ensure_ascii=False, indent=2))
        
        elif args.mode == 'analyze_item':
            print("=== MODO: ANALISAR ITEM ===", file=sys.stderr)
            if not args.proposal or not args.item_name:
                print(json.dumps({"error": "Para 'analyze_item', os argumentos --proposal e --item_name são obrigatórios."}))
                sys.exit(1)

            # Concatena o texto de todos os arquivos de proposta fornecidos
            full_proposal_text = ""
            for i, proposal_path in enumerate(args.proposal):
                print(f"✓ Processando proposta {i+1}: {proposal_path}", file=sys.stderr)
                # Adiciona um separador claro entre os conteúdos dos arquivos
                separator = f"\\n\\n--- INÍCIO DO DOCUMENTO DA PROPOSTA {i+1} ({os.path.basename(proposal_path)}) ---\\n\\n"
                full_proposal_text += separator
                
                proposal_text = extract_full_text_with_pages(proposal_path)
                if "Erro" in proposal_text:
                    print(json.dumps({"error": f"Erro ao processar o arquivo de proposta {proposal_path}: {proposal_text}"}))
                    sys.exit(1)
                full_proposal_text += proposal_text

            requirements = get_requirements_from_tr(model, tr_text, args.item_name)
            if isinstance(requirements, dict) and 'error' in requirements:
                print(json.dumps(requirements))
                sys.exit(1)
            
            if not requirements:
                print(json.dumps({"error": f"Nenhum requisito técnico encontrado para o item '{args.item_name}'."}))
                sys.exit(1)

            analysis_report = analyze_proposal_compliance_batch(model, requirements, full_proposal_text)
            
            if not analysis_report:
                print(json.dumps({"error": "A análise da IA não produziu resultados. Verifique os PDFs ou a chave de API."}))
                sys.exit(1)

            print(json.dumps({"analysisItems": analysis_report}, ensure_ascii=False, indent=2))

        print("=== PROCESSAMENTO CONCLUÍDO COM SUCESSO ===", file=sys.stderr)
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO na função main: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
