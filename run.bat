@echo off
title Hotel Multi-Property Billing & Super Admin Suite
cd /d "%~dp0"
echo ========================================================
echo  Hotel Multi-Property Billing & Super Admin Suite
echo ========================================================
echo.
echo Starting server on http://localhost:5000 ...
echo.
start "" http://localhost:5000
node backend/server.js
pause

