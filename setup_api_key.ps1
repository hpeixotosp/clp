# Configurador da Chave da API Google AI
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurador da Chave da API Google AI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script irá configurar a variável de ambiente GOOGLE_AI_API_KEY" -ForegroundColor Yellow
Write-Host ""

# Solicitar a chave da API
$apiKey = Read-Host "Digite sua chave da API do Google AI"

if ($apiKey -eq "") {
    Write-Host "❌ Chave da API não pode estar vazia!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configurando variável de ambiente..." -ForegroundColor Yellow

try {
    # Configurar variável de ambiente para o usuário atual
    [Environment]::SetEnvironmentVariable("GOOGLE_AI_API_KEY", $apiKey, "User")
    
    Write-Host "✅ Variável de ambiente configurada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Feche e reabra o terminal/PowerShell para que a mudança tenha efeito" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Após reabrir o terminal, execute: npm run dev" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erro ao configurar a variável de ambiente: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar este script como administrador" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione Enter para sair"
