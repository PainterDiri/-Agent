@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install Node.js and reopen this file.
  goto :error
)

if not exist node_modules (
  echo Installing local dependencies...
  where npm.cmd >nul 2>&1
  if errorlevel 1 (
    echo npm.cmd was not found. Reinstall Node.js with npm enabled.
    goto :error
  )
  call npm.cmd install --cache .npm-cache
  if errorlevel 1 goto :error
)

node "%~dp0scripts\test-volcengine-speech.mjs"
if errorlevel 1 goto :error
echo.
echo Test completed successfully.
pause
exit /b 0

:error
echo.
echo Test failed. Check the message above; do not paste the real API key into chat.
pause
exit /b 1
