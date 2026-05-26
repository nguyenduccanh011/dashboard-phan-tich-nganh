@echo off
chcp 65001 > nul
title Dashboard Phân Tích Ngành - Server

REM Check if venv exists and activate it
if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Using system Python.
)

echo.
echo ===================================
echo Starting FastAPI Server...
echo ===================================
echo.
echo Server will run at: http://localhost:8000
echo API Docs:         http://localhost:8000/docs
echo ReDoc:            http://localhost:8000/redoc
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000

pause
