@echo off
setlocal
cd /d "%~dp0"
title AFTERCLICK - Build Windows Installer

echo.
echo  ========================================
echo       AFTERCLICK Windows Installer
echo  ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 22.12 or newer first.
  echo https://nodejs.org/
  pause
  exit /b 1
)

node -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1)"
if errorlevel 1 (
  echo Node.js 22.12 or newer is required. Please update Node.js first.
  pause
  exit /b 1
)

echo Syncing project dependencies (including the installer builder)...
call npm install --no-audit --no-fund
if errorlevel 1 goto :failed

echo Building AFTERCLICK and creating the installer...
call npm run dist:win
if errorlevel 1 goto :failed

echo.
echo Installer created in:
echo %~dp0release\
if exist "%~dp0release\AFTERCLICK-Setup-0.6.1-x64.exe" start "" explorer "%~dp0release"
echo.
echo Build finished. You can now test the setup file in the release folder.
pause
exit /b 0

:failed
echo.
echo The installer build failed. Read the messages above.
pause
exit /b 1
