import requests
import os

def test_web_api():
    """Testa a API web de processamento de PDFs"""
    
    url = 'http://localhost:3000/api/process-pdfs'
    
    if not os.path.exists('pont.pdf'):
        print("❌ Arquivo pont.pdf não encontrado")
        return
    
    print("🌐 TESTANDO API WEB - Processamento de PDFs")
    print("=" * 50)
    
    try:
        # Enviar arquivo via POST
        with open('pont.pdf', 'rb') as f:
            files = {'files': f}
            
            print("📤 Enviando pont.pdf para API...")
            response = requests.post(url, files=files, timeout=60)
            
            print(f"📥 Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Resposta recebida com sucesso!")
                print(f"📄 Resposta: {result}")
                
                # Verificar se há dados de assinatura
                if 'csvContent' in result:
                    csv_content = result['csvContent']
                    print(f"📊 CSV Content: {csv_content}")
                    
                    # Procurar por informações de assinatura
                    if 'True' in csv_content or 'assinatura' in csv_content.lower():
                        print("✅ ASSINATURA DETECTADA na resposta da API!")
                    else:
                        print("❌ Assinatura não detectada na resposta")
                        
            else:
                print(f"❌ Erro na API: {response.status_code}")
                print(f"📄 Erro: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar à API. Servidor rodando?")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    print("=" * 50)
    print("🏁 TESTE DA API CONCLUÍDO")

if __name__ == "__main__":
    test_web_api()