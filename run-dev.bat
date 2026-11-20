@echo off
REM Xoa bien moi truong lam Electron chay nhu Node thuong
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0desktop-app"
call npx electron-vite dev

