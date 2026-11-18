@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo EMPLOX - First Time Setup
echo ========================================
echo.
echo This will create server\.env using your MySQL root credentials.
echo Your password is not stored anywhere except server\.env on this PC.
echo.

set /p MYSQL_PASSWORD=Enter your MySQL root password (leave blank if none):

(
  echo PORT=5000
  echo DB_HOST=localhost
  echo DB_USER=root
  echo DB_PASSWORD=%MYSQL_PASSWORD%
  echo DB_NAME=employee_management
  echo DB_PORT=3306
  echo JWT_SECRET=emplox_super_secret_key_2026
) > "server\.env"

echo.
echo server\.env has been created.
echo.
echo Make sure MySQL is running and the employee_management database exists.
echo Then start EMPLOX with START_EMPLOX.bat
pause
endlocal
