#!/bin/bash

# Trap für SIGINT (Ctrl+C)
trap cleanup SIGINT

# Funktion zum Beenden aller Prozesse
cleanup() {
    echo -e "\nBeende Server..."
    kill $STATIC_PID 2>/dev/null
    kill $STREAMLIT_PID 2>/dev/null
    exit 0
}

# Aktiviere virtuelle Umgebung, falls vorhanden
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Starte den statischen Server
echo "Starte statischen Server..."
python server.py &
STATIC_PID=$!

# Warte kurz, damit der statische Server hochfahren kann
sleep 2

# Starte Streamlit
echo "Starte Streamlit Server..."
streamlit run app.py &
STREAMLIT_PID=$!

# Warte auf beide Prozesse
wait $STATIC_PID $STREAMLIT_PID 