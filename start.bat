@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo          AFTERCLICK MVP 0.6.0
echo ========================================
echo.

if not exist node_modules (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 goto :error
)

echo Starting AFTERCLICK...
echo The app now selects free local ports automatically.
echo If another AFTERCLICK window is already open, close it before starting a second copy.
echo.
call npm run dev
if errorlevel 1 goto :error
goto :eof

:error
echo.
echo AFTERCLICK could not start. Please copy the full error output when asking for help.
pause
exit /b 1
