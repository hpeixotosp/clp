const fs = require('fs');
const path = require('path');

// Ler o arquivo CSV de detalhes
const csvPath = path.join(__dirname, 'resultados_ponto_detalhes.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');
const dataLines = lines.slice(1);

console.log('=== ANÁLISE DOS DADOS DO BRENO ===');
console.log(`Total de linhas de dados: ${dataLines.length}`);

let totalPrevistoMinutos = 0;
let totalRealizadoMinutos = 0;
let diasContados = 0;

console.log('\n=== DETALHAMENTO POR DIA ===');
dataLines.forEach((line, index) => {
  const values = line.split(',');
  const data = values[2];
  const cpreMinutos = parseInt(values[6]);
  const realizadoMinutos = parseInt(values[7]);
  
  totalPrevistoMinutos += cpreMinutos;
  totalRealizadoMinutos += realizadoMinutos;
  diasContados++;
  
  console.log(`${index + 1}. ${data}: C.PRE=${cpreMinutos}min (${(cpreMinutos/60).toFixed(1)}h), Realizado=${realizadoMinutos}min (${(realizadoMinutos/60).toFixed(1)}h)`);
});

console.log('\n=== TOTAIS CALCULADOS ===');
console.log(`Dias contados: ${diasContados}`);
console.log(`Total PREVISTO: ${totalPrevistoMinutos} minutos = ${(totalPrevistoMinutos/60).toFixed(0)} horas = ${Math.floor(totalPrevistoMinutos/60)}:${String(totalPrevistoMinutos%60).padStart(2,'0')}`);
console.log(`Total REALIZADO: ${totalRealizadoMinutos} minutos = ${(totalRealizadoMinutos/60).toFixed(0)} horas = ${Math.floor(totalRealizadoMinutos/60)}:${String(totalRealizadoMinutos%60).padStart(2,'0')}`);

const saldoMinutos = totalRealizadoMinutos - totalPrevistoMinutos;
console.log(`SALDO: ${saldoMinutos} minutos = ${saldoMinutos < 0 ? '-' : '+'}${Math.floor(Math.abs(saldoMinutos)/60)}:${String(Math.abs(saldoMinutos)%60).padStart(2,'0')}`);

console.log('\n=== ANÁLISE ===');
if (diasContados === 22) {
  console.log('✅ O Breno tem 22 dias registrados (correto para julho/2025)');
  console.log('✅ 22 dias × 8h = 176h (correto)');
} else {
  console.log(`❌ Esperado: 22 dias, Encontrado: ${diasContados} dias`);
}

if (totalPrevistoMinutos === 22 * 480) {
  console.log('✅ Cálculo do previsto está correto: 22 × 8h = 176h');
} else {
  console.log(`❌ Cálculo do previsto incorreto. Esperado: ${22*480}min, Encontrado: ${totalPrevistoMinutos}min`);
}

console.log('\n=== VERIFICAÇÃO DE DIAS FALTANTES ===');
const diasJulho2025 = [
  '01/07/2025', '02/07/2025', '03/07/2025', '04/07/2025', // Qua, Qui, Sex, Sab
  '07/07/2025', '08/07/2025', '09/07/2025', '10/07/2025', '11/07/2025', // Seg-Sex
  '14/07/2025', '15/07/2025', '16/07/2025', '17/07/2025', '18/07/2025', // Seg-Sex
  '21/07/2025', '22/07/2025', '23/07/2025', '24/07/2025', '25/07/2025', // Seg-Sex
  '28/07/2025', '29/07/2025', '30/07/2025', '31/07/2025' // Seg-Qui
];

const diasEncontrados = dataLines.map(line => line.split(',')[2]);
const diasFaltantes = diasJulho2025.filter(dia => !diasEncontrados.includes(dia));

if (diasFaltantes.length > 0) {
  console.log(`❌ Dias faltantes: ${diasFaltantes.join(', ')}`);
} else {
  console.log('✅ Todos os dias úteis de julho/2025 estão presentes');
}

console.log(`\nTotal de dias úteis esperados em julho/2025: ${diasJulho2025.length}`);
console.log(`Total de dias encontrados: ${diasEncontrados.length}`);

if (diasJulho2025.length === 23) {
  console.log('\n🔍 CONCLUSÃO: Julho/2025 tem 23 dias úteis, mas o Breno só tem 22 registrados.');
  console.log('   Isso explica por que a jornada prevista é 176h (22×8h) ao invés de 184h (23×8h)');
}