@echo off
echo ========================================
echo Configurador da Chave da API Google AI
echo ========================================
echo.
echo Este script ira configurar a variavel de ambiente GOOGLE_AI_API_KEY
echo.
set /p API_KEY="Digite sua chave da API do Google AI: "
echo.
echo Configurando variavel de ambiente...
setx GOOGLE_AI_API_KEY "%API_KEY%"
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ Variavel de ambiente configurada com sucesso!
    echo.
    echo IMPORTANTE: Feche e reabra o terminal/PowerShell para que a mudanca tenha efeito
    echo.
    echo Apos reabrir o terminal, execute: npm run dev
) else (
    echo ❌ Erro ao configurar a variavel de ambiente
    echo.
    echo Tente executar este script como administrador
)
echo.
pause
