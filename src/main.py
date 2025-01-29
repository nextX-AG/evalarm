from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path

# Absolute Imports verwenden
from src.api import devices, alarms, models

app = FastAPI(title="EVALARM SOS Platform")
templates = Jinja2Templates(directory="templates")

# CORS und Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Statische Dateien
app.mount("/static", StaticFiles(directory="static"), name="static")

# WebSocket Verbindungen
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# API Routes
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/devices")
async def get_devices():
    # Implementierung folgt
    return {"devices": []}

@app.get("/api/alarms")
async def get_alarms():
    # Implementierung folgt
    return {"alarms": []}

# API Router einbinden
app.include_router(devices.router, prefix="/api")
app.include_router(alarms.router, prefix="/api")
app.include_router(models.router, prefix="/api") 