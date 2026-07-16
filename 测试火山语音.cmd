@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
  echo Installing local dependencies...
  call npm.cmd install --cache .npm-cache
  if errorlevel 1 goto :error
)

node scripts\test-volcengine-speech.mjs
if errorlevel 1 goto :error
echo.
echo Test completed successfully.
pause
goto :eof

:error
echo.
echo Test failed. Check the message above; do not paste the real API key into chat.
pause

