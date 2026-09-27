@echo off
rem ============================================================
rem  MED canvas layout switcher (row <-> square)
rem  Usage:
rem    1) double-click            -> pick a canvas from the menu
rem    2) drag a .ncanvas onto me -> that file, then pick a mode
rem    3) command line            -> layout_menu.ps1 -Path <file> -Mode row|square|toggle
rem  Env: NO_PAUSE=1 skips the final pause (for scripts/tests)
rem ============================================================
chcp 65001 >nul
setlocal
set "PS1=%~dp0layout_menu.ps1"
if not exist "%PS1%" (
  echo [ERROR] layout_menu.ps1 not found next to this .bat:
  echo         %PS1%
  if not "%NO_PAUSE%"=="1" pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" %*
set "RC=%ERRORLEVEL%"
if not "%NO_PAUSE%"=="1" pause
exit /b %RC%
