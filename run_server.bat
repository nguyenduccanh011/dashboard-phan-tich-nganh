@echo off
REM Kill any existing Python processes running on port 8000
for /f "tokens=5" %%a in ('netstat -ano 2^>/dev/null ^| find ":8000"') do (
    taskkill /F /PID %%a >/dev/null 2>&1
)

REM Wait a moment for processes to die
timeout /t 1 /nobreak >/dev/null 2>&1

REM Start the server with uvicorn
echo [+] Starting Sector Hub server on http://localhost:8000
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
