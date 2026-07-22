@echo off
chcp 65001 >nul
echo ========================================
echo     AI人格模拟项目 - 一键启动
echo ========================================
echo.

:: 配置AI
set AI_API_KEY=sk-Jo9OYHKdm6CiezVHZBHN2nLMAapa64PJ3x2bfrx8G25tZQGK
set AI_PROVIDER=agnes

:: 运行项目
echo 正在启动...
echo.
npx ts-node src/index-ai.ts

pause
