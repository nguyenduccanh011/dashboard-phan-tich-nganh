@echo off
taskkill /F /IM python.exe >/dev/null 2>&1
timeout /t 1 /nobreak >/dev/null 2>&1
echo [+] Starting Sector Hub server...
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
