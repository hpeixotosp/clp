// Script para limpar cache do frontend e verificar dados
console.log('=== LIMPEZA DE CACHE DO FRONTEND ===');

// Verificar se estamos no navegador
if (typeof window !== 'undefined') {
  console.log('\n=== VERIFICANDO LOCALSTORAGE ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`LocalStorage[${key}]: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
  }
  
  console.log('\n=== VERIFICANDO SESSIONSTORAGE ===');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    console.log(`SessionStorage[${key}]: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
  }
  
  console.log('\n=== LIMPANDO TODOS OS DADOS ===');
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Cache limpo!');
  
  // Recarregar a página
  console.log('🔄 Recarregando página...');
  window.location.reload();
} else {
  console.log('❌ Este script deve ser executado no navegador.');
  console.log('\n📋 INSTRUÇÕES:');
  console.log('1. Abra o DevTools do navegador (F12)');
  console.log('2. Vá para a aba Console');
  console.log('3. Cole e execute este código:');
  console.log('\n--- CÓDIGO PARA COLAR NO CONSOLE ---');
  console.log(`
console.log('=== VERIFICANDO CACHE ===');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log('LocalStorage[' + key + ']:', value.substring(0, 100) + (value.length > 100 ? '...' : ''));
}
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  const value = sessionStorage.getItem(key);
  console.log('SessionStorage[' + key + ']:', value.substring(0, 100) + (value.length > 100 ? '...' : ''));
}
console.log('=== LIMPANDO CACHE ===');
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cache limpo! Recarregando...');
window.location.reload();
`);
  console.log('--- FIM DO CÓDIGO ---\n');
}