@echo off
cd /d "%~dp0"
echo === 安装依赖 ===
call npm install
if errorlevel 1 goto fail
echo.
echo === 安装成功 ===
echo 请运行: npm run dev
goto end
:fail
echo.
echo 安装失败，请确认已安装 Node.js (node -v)
:end
pause
