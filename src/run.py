import uvicorn
from pathlib import Path
import sys
import os
import socket

# Füge das Projektverzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database import init_db

DEFAULT_PORT = 8081

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

def find_free_port(start_port: int = DEFAULT_PORT) -> int:
    port = start_port
    while is_port_in_use(port):
        port += 1
        if port > start_port + 100:
            raise RuntimeError("Kein freier Port gefunden")
    return port

def setup():
    Path("static/models").mkdir(parents=True, exist_ok=True)
    Path("static/uploads").mkdir(parents=True, exist_ok=True)
    init_db()

if __name__ == "__main__":
    try:
        setup()
        port = find_free_port()
        print(f"Server startet auf Port {port}")
        uvicorn.run(
            "src.main:app",
            host="0.0.0.0", 
            port=port, 
            reload=True,
            reload_dirs=["src"]
        )
    except Exception as e:
        print(f"Fehler beim Starten des Servers: {e}", file=sys.stderr)
        sys.exit(1) 