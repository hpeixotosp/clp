const http = require('http');

// Função para fazer requisição GET
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testAPI() {
  try {
    console.log('=== TESTANDO API /api/pontos-eletronicos ===');
    
    const response = await makeRequest('/api/pontos-eletronicos');
    console.log('Resposta da API:');
    console.log(JSON.stringify(response, null, 2));
    
    if (Array.isArray(response)) {
      console.log(`\n=== ANÁLISE DOS DADOS ===`);
      console.log(`Total de registros: ${response.length}`);
      
      response.forEach((item, index) => {
        console.log(`\n${index + 1}. Colaborador: ${item.colaborador}`);
        console.log(`   Período: ${item.periodo}`);
        console.log(`   Previsto: ${item.previsto}`);
        console.log(`   Realizado: ${item.realizado}`);
        console.log(`   Saldo: ${item.saldo}`);
        
        // Verificar se há caracteres estranhos
        if (item.colaborador && (item.colaborador.includes('NMO') || item.colaborador.includes('PQ') || item.colaborador.includes('RQ'))) {
          console.log(`   ⚠️  PROBLEMA ENCONTRADO: Este registro contém dados suspeitos!`);
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao testar API:', error.message);
    console.log('\n=== VERIFICANDO SE O SERVIDOR ESTÁ RODANDO ===');
    console.log('Certifique-se de que o servidor Next.js está rodando na porta 3000');
    console.log('Execute: npm run dev');
  }
}

testAPI();