@echo off
title Insight Report
cd /d "%~dp0"

echo ================================================
echo   Insight Report - Instagram Insights Tool
echo ================================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check dependencies
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

REM Create data folders
if not exist "data\" mkdir data
if not exist "uploads\" mkdir uploads

echo.
echo ================================================
echo   Starting servers...
echo ================================================
echo.
echo [1/3] Starting Backend Server (Port 5000)...
start "Backend Server (DO NOT CLOSE)" /min cmd /k "cd /d "%~dp0" && node server/index.js"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Frontend Server (Port 3000)...
start "Frontend Server (DO NOT CLOSE)" /min cmd /k "cd /d "%~dp0" && npm run dev"

echo [3/3] Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo.
echo ================================================
echo   Opening browser...
echo ================================================
start http://localhost:3000

echo.
echo ================================================
echo   SUCCESS! Servers are running!
echo ================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT: Do NOT close the 2 black windows!
echo            They are running the servers.
echo.
echo To stop: Close the 2 minimized windows or press Ctrl+C in them.
echo.
pause

