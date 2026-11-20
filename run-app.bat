@echo off
REM Xoa bien moi truong lam Electron chay nhu Node thuong
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0desktop-app"
call npx electron-vite build
if errorlevel 1 (pause & exit /b 1)
node_modules\electron\dist\electron.exe out\main\index.js

