@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск сервера PC Build
echo ========================================
echo.

REM Переход в папку server относительно самого bat-файла
cd /d "%~dp0server"

echo Текущая папка: %cd%
echo.
echo Запуск Python...
python main.py

echo.
echo ========================================
echo   Сервер остановлен. Нажмите любую клавишу...
pause >nul