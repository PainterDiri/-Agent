@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "setup_script="
for %%F in ("%~dp0*.ps1") do (
  set "setup_script=%%~fF"
  goto :run_setup
)

:run_setup
if not defined setup_script (
  echo No PowerShell setup script was found in this folder.
  goto :error
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%setup_script%"
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo Volcengine speech setup failed. Check the error message above.
pause
exit /b 1
