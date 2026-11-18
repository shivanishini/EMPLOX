@echo off
setlocal
set "ROOT=%~dp0"

echo ========================================
echo EMPLOX - Employee Management System
echo ========================================
echo.

if not exist "%ROOT%node_modules" (
    echo Frontend dependencies not found. Installing...
    cd /d "%ROOT%"
    call npm install
    if errorlevel 1 (
        echo.
        echo Frontend installation failed.
        pause
        exit /b 1
    )
)

if not exist "%ROOT%server\node_modules" (
    echo Backend dependencies not found. Installing...
    cd /d "%ROOT%server"
    call npm install
    if errorlevel 1 (
        echo.
        echo Backend installation failed.
        pause
        exit /b 1
    )
)

echo Starting backend...
start "EMPLOX Backend" cmd /k "cd /d "%ROOT%server" && npm start"

timeout /t 3 /nobreak >nul

echo Starting frontend...
start "EMPLOX Frontend" cmd /k "cd /d "%ROOT%" && npm run dev"

echo.
echo Two terminals have been opened.
echo Keep both running while using EMPLOX.
pause
endlocal
