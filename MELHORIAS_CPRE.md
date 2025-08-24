# Melhorias na Análise de Carga Horária (C.PRE)

## Problema Identificado

Anteriormente, quando um colaborador tinha:
- Texto nos campos de entrada/saída (como "ATESTADO", "FERIADO", "FOLGA")
- Carga horária válida no campo C.PRE (ex: 08:00:00)

O sistema **ignorava completamente** essas entradas, não considerando a jornada diária na soma da jornada mensal.

## Correções Implementadas

### 1. Modificação na Função `parse_table_entries`

**Antes:**
```python
# Pular entradas com ATEST, FOLGA, etc.
if any(skip in ent1_sai1.upper() for skip in ['ATEST', 'FOLGA', 'FALTA']):
    continue
```

**Depois:**
```python
# Não pular entradas com ATEST, FOLGA, etc. se há C.PRE válido
# Essas entradas devem ser consideradas na jornada mensal
# (código comentado para não pular mais)
```

### 2. Melhoria na Função `calculate_daily_hours`

**Nova lógica implementada:**

1. **Detecção de dias especiais:** Verifica se há texto nos campos de entrada/saída
2. **Validação de C.PRE:** Confirma se existe carga horária válida no C.PRE
3. **Aplicação da regra:** Se há texto + C.PRE válido → usa C.PRE completo

**Casos tratados:**
- ✅ **Atestado + C.PRE válido** → Considera 8h (ou valor do C.PRE)
- ✅ **Feriado + C.PRE válido** → Considera 8h (ou valor do C.PRE)
- ✅ **Folga + C.PRE válido** → Considera 8h (ou valor do C.PRE)
- ✅ **Dia normal com horários** → Calcula baseado nos horários de entrada/saída
- ✅ **Texto sem C.PRE válido** → Considera 0h

## Resultados dos Testes

```
Atestado com C.PRE:
  Campos: ATESTADO |  |  |
  C.PRE: 08:00:00 (480 min)
  Resultado: 480 minutos (8.00 horas) - Tipo: Especial (C.PRE)

Feriado com C.PRE:
  Campos:  | FERIADO |  |
  C.PRE: 08:00:00 (480 min)
  Resultado: 480 minutos (8.00 horas) - Tipo: Especial (C.PRE)

Dia normal:
  Campos: 08:00 | 12:00 | 13:00 | 17:00
  C.PRE: 08:00:00 (480 min)
  Resultado: 480 minutos (8.00 horas) - Tipo: Normal

Folga sem C.PRE:
  Campos: FOLGA |  |  |
  C.PRE: 00:00:00 (0 min)
  Resultado: 0 minutos (0.00 horas) - Tipo: Sem C.PRE válido
```

## Impacto na Jornada Mensal

Agora, dias com atestado, feriado ou outras situações especiais **são corretamente incluídos** na soma da jornada mensal, desde que tenham carga horária definida no C.PRE.

**Exemplo prático:**
- Colaborador trabalha 20 dias normais (8h cada) = 160h
- Tem 2 dias de atestado com C.PRE de 8h = 16h
- **Total mensal:** 176h (antes seria apenas 160h)

## Arquivos Modificados

- `backend_pdf_processor.py` - Funções `parse_table_entries` e `calculate_daily_hours`
- `test_cpre_logic.py` - Script de teste criado para validar as correções

## Status

✅ **Implementado e testado com sucesso**

As correções garantem que a jornada diária definida no C.PRE seja sempre considerada na soma da jornada mensal, mesmo quando há texto nos campos de entrada e saída.