@echo off
echo ========================================
echo  Analytics Platform - Dev Mode (Hot Reload)
echo ========================================
cd /d "%~dp0"

REM electron-vite dev: starts Vite dev server + Electron together
REM ELECTRON_RENDERER_URL duoc tu dong set boi electron-vite
npx electron-vite dev

pause

