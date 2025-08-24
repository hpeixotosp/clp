#!/usr/bin/env python3
"""
Script para testar a conversão de minutos para horas e identificar o problema do valor 2844:00
"""

def minutes_to_time_str(minutes: int) -> str:
    """Converte minutos para string HH:MM"""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

def test_conversions():
    """Testa várias conversões para identificar o problema"""
    print("=== TESTE DE CONVERSÕES ===\n")
    
    # Valores do pont.pdf que sabemos estar corretos
    test_values = [
        (14880, "248:00"),  # Total previsto correto
        (14662, "244:22"),  # Total realizado correto
        (2844 * 60, "2844:00"),  # Valor problemático em minutos
        (2844, "47:24"),    # Se 2844 fosse minutos, seria isso
        (170640, "2844:00"), # Quantos minutos seriam necessários para 2844:00
    ]
    
    print("Testando conversões conhecidas:")
    for minutes, expected in test_values:
        result = minutes_to_time_str(minutes)
        status = "✓" if result == expected else "✗"
        print(f"{status} {minutes} minutos = {result} (esperado: {expected})")
    
    print("\n=== INVESTIGAÇÃO DO PROBLEMA ===\n")
    
    # Verificar se 2844 pode estar sendo interpretado como horas em algum lugar
    print("Possíveis origens do valor 2844:00:")
    print(f"1. Se 2844 fosse minutos: {minutes_to_time_str(2844)}")
    print(f"2. Se 2844 fosse horas: 2844:00 (valor problemático)")
    print(f"3. Minutos necessários para 2844:00: {2844 * 60} minutos")
    
    # Verificar se há alguma operação matemática que resulte em 2844
    print("\nPossíveis cálculos que resultam em 2844:")
    print(f"14880 / 60 = {14880 / 60} (conversão incorreta de minutos para horas?)")
    print(f"14880 - 14662 = {14880 - 14662} (diferença entre previsto e realizado)")
    print(f"14880 + 14662 = {14880 + 14662} (soma incorreta?)")
    print(f"14880 * 60 / 60 / 60 = {14880 * 60 / 60 / 60} (dupla conversão?)")
    
    # Verificar se há algum problema na formatação
    print("\nTestando formatações problemáticas:")
    problematic_values = [248, 2844, 14880, 170640]
    for val in problematic_values:
        print(f"{val} -> {minutes_to_time_str(val)}")
    
    print("\n=== ANÁLISE FINAL ===\n")
    print("Valores corretos do pont.pdf:")
    print(f"- Total previsto: 14880 minutos = {minutes_to_time_str(14880)}")
    print(f"- Total realizado: 14662 minutos = {minutes_to_time_str(14662)}")
    print(f"- Saldo: {14662 - 14880} minutos = {minutes_to_time_str(abs(14662 - 14880))}")
    
    print("\nO valor 2844:00 NÃO deveria aparecer em lugar nenhum!")
    print("Possível causa: algum código está tratando 248 horas como 2844 horas.")

if __name__ == "__main__":
    test_conversions()