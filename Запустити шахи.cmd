@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Шаховий тренер

rem --- Python is needed for the local server ---
where python >nul 2>&1
if errorlevel 1 (
  echo Для тренера потрібен Python 3. Зараз відкриється сторінка завантаження.
  echo Під час встановлення постав галочку "Add python.exe to PATH", потім запусти цей файл ще раз.
  start "" https://www.python.org/downloads/
  pause
  exit /b
)

rem --- first run: download the official Stockfish 19 (about 80 MB) ---
dir /s /b "engine\stockfish*.exe" >nul 2>&1
if errorlevel 1 (
  echo Завантажую Stockfish 19 з офіційного GitHub (близько 80 МБ, лише перший раз^)...
  if not exist engine mkdir engine
  curl.exe -L -# -o "engine\sf.zip" "https://github.com/official-stockfish/Stockfish/releases/download/sf_19/stockfish-windows-x86-64-universal.zip"
  if errorlevel 1 powershell -NoProfile -Command "Invoke-WebRequest 'https://github.com/official-stockfish/Stockfish/releases/download/sf_19/stockfish-windows-x86-64-universal.zip' -OutFile 'engine\sf.zip'"
  echo Розпаковую...
  powershell -NoProfile -Command "Expand-Archive 'engine\sf.zip' 'engine' -Force; Remove-Item 'engine\sf.zip'"
)

rem --- stop an older trainer server that may still hold the port ---
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8799 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
start "chess-server" /min python server.py 8799
timeout /t 2 >nul
start "" http://127.0.0.1:8799/
