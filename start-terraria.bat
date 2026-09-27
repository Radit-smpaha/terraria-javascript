@echo off
cd /d "%~dp0"
title Terracraft - http://localhost:8000/terraria.html

where node >nul 2>nul
if errorlevel 1 goto python

echo Starting Terracraft server on port 8000...
echo Close this window to stop the server.
echo.
rem Give the server a second to bind, then open the browser.
start "" /b cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:8000/terraria.html"
node server.js
pause
exit /b

:python
echo Node.js not found - falling back to Python...
start "" http://localhost:8000/terraria.html
python -m http.server 8000
pause
