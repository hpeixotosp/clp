import requests
import os

def test_contracheques_api():
    """Testa a API web de processamento de contracheques"""
    
    url = 'http://localhost:3000/api/process-contracheques'
    
    if not os.path.exists('cc.pdf') or not os.path.exists('recibo.pdf'):
        print("❌ Arquivos cc.pdf ou recibo.pdf não encontrados")
        return
    
    print("🌐 TESTANDO API WEB - Processamento de Contracheques")
    print("=" * 60)
    
    try:
        # Enviar arquivos via POST
        files = []
        with open('cc.pdf', 'rb') as f1, open('recibo.pdf', 'rb') as f2:
            files = [
                ('files', ('cc.pdf', f1.read(), 'application/pdf')),
                ('files', ('recibo.pdf', f2.read(), 'application/pdf'))
            ]
            
            print("📤 Enviando cc.pdf e recibo.pdf para API...")
            response = requests.post(url, files=files, timeout=120)
            
            print(f"📥 Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Resposta recebida com sucesso!")
                print(f"📄 Resposta completa:")
                print(f"  Success: {result.get('success')}")
                print(f"  Message: {result.get('message')}")
                
                # Verificar resultados
                resultados = result.get('resultados', [])
                print(f"📊 Total de resultados: {len(resultados)}")
                
                for i, resultado in enumerate(resultados):
                    print(f"\n📋 Resultado {i+1}:")
                    if resultado.get('status') == 'sucesso':
                        dados = resultado.get('dados', {})
                        print(f"  ✅ Status: {resultado['status']}")
                        print(f"  👤 Colaborador: {dados.get('colaborador')}")
                        print(f"  📅 Período: {dados.get('periodo')}")
                        print(f"  💰 Vencimentos: {dados.get('vencimentos')}")
                        print(f"  💸 Descontos: {dados.get('descontos')}")
                        print(f"  💵 Valor Líquido: {dados.get('valorLiquido')}")
                        print(f"  ✔️ Status Validação: {dados.get('statusValidacao')}")
                    else:
                        print(f"  ❌ Status: {resultado['status']}")
                        print(f"  ⚠️ Erro: {resultado.get('erro')}")
                        
            else:
                print(f"❌ Erro na API: {response.status_code}")
                print(f"📄 Erro: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar à API. Servidor rodando?")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    print("=" * 60)
    print("🏁 TESTE DA API CONCLUÍDO")

if __name__ == "__main__":
    test_contracheques_api()