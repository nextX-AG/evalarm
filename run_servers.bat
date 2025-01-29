@echo off
setlocal

:: Aktiviere virtuelle Umgebung, falls vorhanden
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)

:: Starte den statischen Server
start /B python server.py
timeout /t 2 /nobreak >nul

:: Starte Streamlit
start /B streamlit run app.py

:: Warte auf Benutzer-Input
echo Drücke Ctrl+C zum Beenden...
pause >nul

:: Beende alle Python-Prozesse
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM pythonw.exe >nul 2>&1

endlocal 