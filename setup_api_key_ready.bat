@echo off
echo ========================================
echo Configurador da Chave da API Google AI
echo ========================================
echo.
echo ✅ Chave da API ja configurada!
echo Chave: AIzaSyDXAgbYdfGX_LhSAwljKoWeerzWHGgQC3I
echo.
echo Configurando variavel de ambiente...
setx GOOGLE_AI_API_KEY "AIzaSyDXAgbYdfGX_LhSAwljKoWeerzWHGgQC3I"
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ Variavel de ambiente configurada com sucesso!
    echo.
    echo IMPORTANTE: Feche e reabra o terminal/PowerShell para que a mudanca tenha efeito
    echo.
    echo Apos reabrir o terminal, execute: npm run dev
    echo.
    echo Sua aplicacao agora deve funcionar sem o erro de API key!
) else (
    echo ❌ Erro ao configurar a variavel de ambiente
    echo.
    echo Tente executar este script como administrador
)
echo.
pause
