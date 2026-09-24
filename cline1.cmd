@echo off
setlocal
where node >nul 2>nul
if not errorlevel 1 goto :run
echo Node.js is required but was not found.
set /p "reply=Install Node.js now? [y/N]: "
if /i not "%reply%"=="Y" if /i not "%reply%"=="YES" goto :missing
where winget >nul 2>nul
if errorlevel 1 goto :missing
winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
if errorlevel 1 goto :failed
set "PATH=C:\Program Files\nodejs;%PATH%"
where node >nul 2>nul
if not errorlevel 1 goto :run
:missing
echo Install Node.js from https://nodejs.org/ and run cline1 again.
exit /b 1
:failed
echo Node.js installation failed. Install it from https://nodejs.org/ and run cline1 again.
exit /b 1
:run
node "%~dp0cline1-app.js" %*
exit /b %errorlevel%
