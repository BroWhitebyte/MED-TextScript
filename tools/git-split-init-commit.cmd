@echo off
rem git split-init-commit: split the initial mega-commit of MED-TextScript (Windows entry)
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-split-init-commit.ps1" %*
set "EXITCODE=%ERRORLEVEL%"
endlocal & exit /b %EXITCODE%