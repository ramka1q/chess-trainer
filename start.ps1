# Шаховий тренер: запуск на ПК (викликається з «Запустити шахи.cmd»)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$Host.UI.RawUI.WindowTitle = 'Шаховий тренер'

# 1) Python потрібен для локального сервера
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host 'Для тренера потрібен Python 3. Зараз відкриється сторінка завантаження.' -ForegroundColor Yellow
  Write-Host 'Під час встановлення постав галочку "Add python.exe to PATH", потім запусти тренер ще раз.'
  Start-Process 'https://www.python.org/downloads/'
  Read-Host 'Натисни Enter, щоб закрити'
  exit
}

# 2) Перший запуск: офіційний Stockfish 19 (~80 МБ)
$exe = Get-ChildItem -Path 'engine' -Recurse -Filter 'stockfish*.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $exe) {
  Write-Host 'Завантажую Stockfish 19 з офіційного GitHub (близько 80 МБ, лише перший раз)...' -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path 'engine' | Out-Null
  $url = 'https://github.com/official-stockfish/Stockfish/releases/download/sf_19/stockfish-windows-x86-64-universal.zip'
  & curl.exe -L -# -o 'engine\sf.zip' $url
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path 'engine\sf.zip')) { Invoke-WebRequest $url -OutFile 'engine\sf.zip' }
  Write-Host 'Розпаковую...' -ForegroundColor Cyan
  Expand-Archive 'engine\sf.zip' 'engine' -Force
  Remove-Item 'engine\sf.zip'
  Write-Host 'Stockfish 19 готовий!' -ForegroundColor Green
}

# 3) Зупинити старий сервер тренера, якщо він ще працює
Get-NetTCPConnection -LocalPort 8799 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# 4) Запуск
Start-Process python -ArgumentList 'server.py','8799' -WindowStyle Minimized
Start-Sleep -Seconds 2
Start-Process 'http://127.0.0.1:8799/'
Write-Host 'Тренер запущено. Це вікно можна закрити.' -ForegroundColor Green
Start-Sleep -Seconds 3
