// Script para verificar e remover colaborador corrompido NEVE
const fs = require('fs');
const path = require('path');

async function checkNeveCollaborator() {
    try {
        console.log('=== VERIFICANDO COLABORADOR NEVE ===');
        
        // Fazer requisição para a API
        const response = await fetch('http://localhost:3000/api/pontos-eletronicos');
        const data = await response.json();
        
        console.log(`Total de registros na API: ${data.data ? data.data.length : 0}`);
        
        // Procurar por registros com NEVE
        const neveRecords = data.data ? data.data.filter(record => 
            record.colaborador && record.colaborador.includes('NEVE')
        ) : [];
        
        console.log(`Registros com NEVE encontrados: ${neveRecords.length}`);
        
        neveRecords.forEach((record, index) => {
            console.log(`\nRegistro ${index + 1}:`);
            console.log(`  ID: ${record.id}`);
            console.log(`  Colaborador: ${record.colaborador}`);
            console.log(`  Período: ${record.periodo}`);
            console.log(`  Previsto: ${record.previsto}`);
            console.log(`  Realizado: ${record.realizado}`);
            console.log(`  Saldo: ${record.saldo}`);
        });
        
        // Verificar também outros colaboradores para comparação
        console.log('\n=== OUTROS COLABORADORES ===');
        const otherRecords = data.data ? data.data.filter(record => 
            record.colaborador && !record.colaborador.includes('NEVE')
        ) : [];
        
        otherRecords.forEach((record, index) => {
            console.log(`${index + 1}. ${record.colaborador} - ${record.periodo}`);
        });
        
    } catch (error) {
        console.error('Erro ao verificar colaborador NEVE:', error.message);
    }
}

// Executar verificação
checkNeveCollaborator();