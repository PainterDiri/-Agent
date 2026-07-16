@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
  echo Installing local dependencies...
  call npm.cmd install --cache .npm-cache
  if errorlevel 1 goto :error
)

echo Building the kiosk app...
call npm.cmd run build
if errorlevel 1 goto :error

echo.
echo Xixi Fortune Agent is starting at http://localhost:8787
echo Keep this window open during the event.
start "" "http://localhost:8787"
node server/index.mjs
goto :eof

:error
echo.
echo Startup failed. See README.md for setup details.
pause
