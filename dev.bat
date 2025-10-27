@echo off
REM E-Commerce Development Server Starter for Windows
REM This script starts both backend (Laravel) and frontend (Next.js) development servers

echo.
echo ============================================
echo   E-Commerce Development Servers
echo ============================================
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo [ERROR] backend directory not found
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo [ERROR] frontend directory not found
    pause
    exit /b 1
)

REM Check if PHP is installed
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PHP is not installed
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

echo [INFO] Starting Laravel Backend on port 8000...
cd backend
start "Laravel Backend" cmd /k "php artisan serve"
cd ..

timeout /t 3 /nobreak >nul

echo [INFO] Starting Next.js Frontend on port 3000...
cd frontend
start "Next.js Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ============================================
echo   Servers Started Successfully!
echo ============================================
echo.
echo Backend API:  http://localhost:8000
echo Frontend App: http://localhost:3000
echo.
echo Two new command windows have been opened.
echo Close those windows to stop the servers.
echo.
pause

