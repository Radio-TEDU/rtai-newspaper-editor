@echo off
chcp 65001 >nul
title Gazete Atolyesi
rem Editor klasoru (package.json'inda "name": "rtai-newspaper-editor" yazan klasor).
rem Asagidaki yerlerde bulunamazsa ATOLYE_DIR satirina tam yolu yazin.
set "ATOLYE_DIR="
if not defined ATOLYE_DIR if exist "%~dp0..\rtai-newspaper-editor-main\package.json" set "ATOLYE_DIR=%~dp0..\rtai-newspaper-editor-main"
if not defined ATOLYE_DIR if exist "%~dp0..\..\rtai-newspaper-editor-main\package.json" set "ATOLYE_DIR=%~dp0..\..\rtai-newspaper-editor-main"
if not defined ATOLYE_DIR (
  echo Gazete Atolyesi klasoru bulunamadi. Bu dosyadaki ATOLYE_DIR satirina editor klasorunun yolunu yazin.
  pause
  exit /b 1
)
cd /d "%ATOLYE_DIR%"
if not exist node_modules call npm ci
if not exist dist\index.html call npm run build
echo.
echo Gazete Atolyesi calisiyor: http://127.0.0.1:4173
echo Bu pencere acik kaldigi surece ERP icindeki sekme calisir. Kapatmak icin pencereyi kapatin.
echo.
call npm run preview -- --port 4173 --strictPort
pause
