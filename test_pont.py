import backend_pdf_processor

processor = backend_pdf_processor.PontoProcessor()
result = processor.process_pdf('pont.pdf')

print('RESULTADO DO TESTE:')
print(f'Colaborador: {result.get("colaborador", "N/A")}')
print(f'Período: {result.get("periodo", "N/A")}')
print(f'Assinatura: {result.get("assinatura", "N/A")}')
print(f'Previsto: {result.get("previsto", "N/A")}')
print(f'Realizado: {result.get("realizado", "N/A")}')
print(f'Saldo: {result.get("saldo", "N/A")}')