#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import subprocess
import sys

def analisar_pont_pdf():
    print("=== ANÁLISE ESPECÍFICA - PONT.PDF ===\n")
    
    # Processar o pont.pdf
    try:
        result = subprocess.run(
            [sys.executable, 'backend_pdf_processor.py', '--pdfs', 'pont.pdf'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        
        if result.returncode != 0:
            print(f"Erro ao processar pont.pdf: {result.stderr}")
            return
            
        if not result.stdout:
            print("Nenhum output recebido")
            return
            
        # Procurar pelo JSON no final do output
        output_text = result.stdout
        
        # Procurar por padrões que indicam o início do JSON
        json_start_markers = [
            '=== PROCESSAMENTO CONCLUÍDO COM SUCESSO ===',
            ']\n=== PROCESSAMENTO CONCLUÍDO',
            '] \n=== PROCESSAMENTO CONCLUÍDO'
        ]
        
        json_text = None
        
        # Tentar encontrar o JSON antes dos marcadores de fim
        for marker in json_start_markers:
            if marker in output_text:
                parts = output_text.split(marker)
                if len(parts) > 1:
                    # Pegar a parte antes do marcador e procurar pelo JSON
                    before_marker = parts[0]
                    lines = before_marker.split('\n')
                    
                    # Procurar de trás para frente por uma linha que termine com ]
                    for i in range(len(lines) - 1, -1, -1):
                        line = lines[i].strip()
                        if line.endswith(']'):
                            # Encontrar o início do JSON
                            for j in range(i, -1, -1):
                                if lines[j].strip().startswith('['):
                                    json_text = '\n'.join(lines[j:i+1])
                                    break
                            break
                    break
        
        if not json_text:
            # Fallback: procurar por [ e ] no output
            lines = output_text.split('\n')
            start_idx = -1
            end_idx = -1
            
            for i, line in enumerate(lines):
                if line.strip().startswith('[') and start_idx == -1:
                    start_idx = i
                if line.strip().endswith(']') and start_idx != -1:
                    end_idx = i
                    break
                    
            if start_idx != -1 and end_idx != -1:
                json_text = '\n'.join(lines[start_idx:end_idx+1])
        
        if not json_text:
            print("JSON não encontrado no output")
            print("Últimas 10 linhas do output:")
            lines = output_text.split('\n')
            for line in lines[-10:]:
                print(repr(line))
            return
            
        print(f"JSON encontrado: {len(json_text)} caracteres")
        print(f"Primeiros 1000 chars do JSON: {json_text[:1000]}")
        
        # Parse do JSON
        try:
            data = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"Erro ao fazer parse do JSON: {e}")
            print(f"JSON text (primeiros 500 chars): {repr(json_text[:500])}")
            return
        
        if not data:
            print("Dados vazios")
            return
            
        # A estrutura é uma lista com um objeto que contém 'dias_processados'
        primeiro_item = data[0]
        
        # Extrair informações básicas
        nome = primeiro_item.get('colaborador', 'N/A')
        periodo = primeiro_item.get('periodo', 'N/A')
        
        # Converter totais para minutos
        total_previsto_str = primeiro_item.get('previsto', '0:00')
        total_realizado_str = primeiro_item.get('realizado', '0:00')
        
        def time_to_minutes(time_str):
            if ':' in time_str:
                parts = time_str.split(':')
                return int(parts[0]) * 60 + int(parts[1])
            return 0
            
        total_previsto_min = time_to_minutes(total_previsto_str)
        total_realizado_min = time_to_minutes(total_realizado_str)
        
        # Obter dias processados
        dias_processados = primeiro_item.get('dias_processados', [])
        
        print(f"Nome: {nome}")
        print(f"Período: {periodo}")
        print(f"Total de registros diários: {len(dias_processados)}")
        print(f"Total previsto (minutos): {total_previsto_min}")
        print(f"Total realizado (minutos): {total_realizado_min}")
        print(f"Total previsto (horas): {total_previsto_min/60:.2f}")
        print(f"Total realizado (horas): {total_realizado_min/60:.2f}")
        
        print("\n=== ANÁLISE DETALHADA ===")
        
        # Analisar registros diários
        dias_normais = 0
        dias_cpre = 0
        total_previsto_calc = 0
        total_realizado_calc = 0
        
        for registro in dias_processados:
            if 'tipo' in registro:
                if registro['tipo'] == 'Normal':
                    dias_normais += 1
                elif registro['tipo'] == 'C.PRE apenas':
                    dias_cpre += 1
                    
                # Somar minutos
                if 'cpre_minutos' in registro:
                    total_previsto_calc += registro['cpre_minutos']
                if 'realizado_minutos' in registro:
                    total_realizado_calc += registro['realizado_minutos']
        
        print(f"Dias normais: {dias_normais}")
        print(f"Dias C.PRE apenas: {dias_cpre}")
        print(f"Total de dias: {dias_normais + dias_cpre}")
        
        print(f"\nTotal previsto calculado: {total_previsto_calc} minutos ({total_previsto_calc/60:.2f} horas)")
        print(f"Total realizado calculado: {total_realizado_calc} minutos ({total_realizado_calc/60:.2f} horas)")
        
        # Verificar discrepâncias
        if total_previsto_calc != total_previsto_min:
            print(f"\n⚠️  DISCREPÂNCIA NO TOTAL PREVISTO!")
            print(f"   Reportado: {total_previsto_min} minutos")
            print(f"   Calculado: {total_previsto_calc} minutos")
            print(f"   Diferença: {abs(total_previsto_min - total_previsto_calc)} minutos")
            
            # Investigar onde está o problema
            print(f"\n🔍 INVESTIGAÇÃO:")
            print(f"   String original previsto: '{total_previsto_str}'")
            print(f"   Conversão para minutos: {total_previsto_min}")
            print(f"   Isso equivale a: {total_previsto_min/60:.2f} horas ou {total_previsto_min//60}h{total_previsto_min%60:02d}m")
            
            # Verificar se o valor 2844 aparece em algum lugar
            if total_previsto_min == 2844 * 60:  # 2844 horas em minutos
                print(f"   ❗ PROBLEMA IDENTIFICADO: O valor está sendo interpretado como 2844 HORAS!")
                print(f"   ❗ Deveria ser {total_previsto_calc/60:.2f} horas ({total_previsto_calc} minutos)")
            
        if total_realizado_calc != total_realizado_min:
            print(f"\n⚠️  DISCREPÂNCIA NO TOTAL REALIZADO!")
            print(f"   Reportado: {total_realizado_min} minutos")
            print(f"   Calculado: {total_realizado_calc} minutos")
            print(f"   Diferença: {abs(total_realizado_min - total_realizado_calc)} minutos")
        
        # Verificar se há problema com 2844 horas
        if total_previsto_min/60 > 2800:
            print(f"\n🚨 PROBLEMA IDENTIFICADO: {total_previsto_min/60:.2f} horas previstas é um valor absurdo!")
            print(f"   Isso equivale a {total_previsto_min/60/8:.1f} dias de 8 horas")
            print(f"   Para um mês, deveria ser cerca de 160-200 horas")
            
        # Mostrar primeiros registros diários
        print("\n=== PRIMEIROS 5 REGISTROS DIÁRIOS ===")
        for i, registro in enumerate(dias_processados[:5]):
            print(f"{i+1}. Data: {registro.get('data')}, Tipo: {registro.get('tipo')}, CPRE: {registro.get('cpre_minutos')}min, Realizado: {registro.get('realizado_minutos')}min")
            
    except Exception as e:
        print(f"Erro durante análise: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analisar_pont_pdf()