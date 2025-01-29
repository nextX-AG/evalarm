from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import shutil
import uuid

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

# Mock-Daten für Geräte
MOCK_DEVICES = [
    {
        "id": 1,
        "type": "sensor",
        "name": "Temperatursensor 1.01",
        "status": {"state": "operational", "health": 95},
        "location": {"x": 10, "y": 20, "z": 0},
        "assetId": 3,  # Konferenzraum 1.01
        "lastUpdate": "2024-02-08T10:00:00Z",
        "metrics": {
            "battery": 85,
            "signal": 92,
            "temperature": 21.5
        }
    },
    {
        "id": 2,
        "type": "emergency_button",
        "name": "Notfallknopf Eingang",
        "status": {"state": "operational", "health": 100},
        "location": {"x": 5, "y": 2, "z": 0},
        "assetId": 3,
        "lastUpdate": "2024-02-08T10:05:00Z",
        "metrics": {
            "battery": 95,
            "signal": 88
        }
    },
    {
        "id": 3,
        "type": "gateway",
        "name": "Gateway 1.OG",
        "status": {"state": "warning", "health": 75},
        "location": {"x": 15, "y": 15, "z": 0},
        "assetId": 2,  # 1.OG
        "lastUpdate": "2024-02-08T09:55:00Z",
        "metrics": {
            "signal": 65,
            "connectedDevices": 8
        }
    }
]

@app.get("/api/devices")
async def get_devices():
    return MOCK_DEVICES

@app.get("/api/alarms")
async def get_alarms():
    # Implementierung folgt
    return {"alarms": []}

# API Router einbinden
app.include_router(devices.router, prefix="/api")
app.include_router(alarms.router, prefix="/api")
app.include_router(models.router, prefix="/api")

# Mock-Daten für Gebäude und Oberlichter
MOCK_BUILDINGS = [
    {
        "id": 1,
        "name": "Halle 1",
        "skylights": [
            {
                "id": 101,
                "name": "Oberlicht 1.1",
                "status": "closed",
                "health": 100,
                "sensors": [
                    {
                        "id": 1001,
                        "type": "contact",
                        "status": "closed",
                        "battery": 95,
                        "signal": 87,
                        "lastUpdate": "2024-02-08T10:00:00Z"
                    }
                ]
            },
            {
                "id": 102,
                "name": "Oberlicht 1.2",
                "status": "open",
                "health": 95,
                "sensors": [
                    {
                        "id": 1002,
                        "type": "contact",
                        "status": "open",
                        "battery": 82,
                        "signal": 92,
                        "lastUpdate": "2024-02-08T10:05:00Z"
                    }
                ]
            },
            {
                "id": 103,
                "name": "Oberlicht 1.3",
                "status": "closed",
                "health": 98,
                "sensors": [
                    {
                        "id": 1003,
                        "type": "contact",
                        "status": "closed",
                        "battery": 90,
                        "signal": 95,
                        "lastUpdate": "2024-02-08T09:55:00Z"
                    },
                    {
                        "id": 1004,
                        "type": "temperature",
                        "status": "normal",
                        "value": "22.5°C",
                        "battery": 88,
                        "signal": 91,
                        "lastUpdate": "2024-02-08T10:02:00Z"
                    }
                ]
            },
            {
                "id": 104,
                "name": "Oberlicht 1.4",
                "status": "partial",
                "health": 85,
                "sensors": [
                    {
                        "id": 1005,
                        "type": "contact",
                        "status": "partial",
                        "battery": 75,  # Niedriger Batteriestand
                        "signal": 65,   # Schwaches Signal
                        "lastUpdate": "2024-02-08T09:45:00Z"
                    },
                    {
                        "id": 1006,
                        "type": "humidity",
                        "status": "warning",
                        "value": "75%",
                        "battery": 85,
                        "signal": 72,
                        "lastUpdate": "2024-02-08T09:50:00Z"
                    }
                ]
            }
        ]
    },
    {
        "id": 2,
        "name": "Halle 2",
        "skylights": [
            {
                "id": 201,
                "name": "Oberlicht 2.1",
                "status": "closed",
                "health": 100,
                "sensors": [
                    {
                        "id": 2001,
                        "type": "contact",
                        "status": "closed"
                    }
                ]
            },
            {
                "id": 202,
                "name": "Oberlicht 2.2",
                "status": "open",
                "health": 92,
                "sensors": [
                    {
                        "id": 2002,
                        "type": "contact",
                        "status": "open"
                    },
                    {
                        "id": 2003,
                        "type": "temperature",
                        "status": "normal",
                        "value": "21.8°C"
                    }
                ]
            }
        ]
    }
]

@app.get("/api/buildings")
async def get_buildings():
    return MOCK_BUILDINGS

# Mock-Daten für Assets
MOCK_ASSETS = [
    {
        "id": 1,
        "type": "building",
        "name": "Hauptgebäude",
        "status": {"state": "operational", "health": 95},
        "children": [
            {
                "id": 2,
                "type": "floor",
                "name": "1. OG",
                "status": {"state": "operational", "health": 90},
                "children": [
                    {
                        "id": 3,
                        "type": "room",
                        "name": "Konferenzraum 1.01",
                        "status": {"state": "operational", "health": 100}
                    }
                ]
            }
        ]
    }
]

@app.get("/api/assets")
async def get_assets():
    return MOCK_ASSETS

@app.post("/api/assets")
async def create_asset(
    name: str = Form(...),
    type: str = Form(...),
    description: str = Form(None),
    parentId: int = Form(None),
    floorplan: UploadFile = File(None)
):
    # Generiere eine neue Asset-ID
    new_id = len(MOCK_ASSETS) + 1
    
    # Verarbeite den Grundriss, falls vorhanden
    floorplan_path = None
    if floorplan:
        file_extension = floorplan.filename.split('.')[-1]
        floorplan_path = f"static/uploads/floorplans/{uuid.uuid4()}.{file_extension}"
        with open(floorplan_path, "wb") as buffer:
            shutil.copyfileobj(floorplan.file, buffer)

    # Erstelle das neue Asset
    new_asset = {
        "id": new_id,
        "type": type,
        "name": name,
        "description": description,
        "status": {"state": "operational", "health": 100},
        "floorplan": f"/{floorplan_path}" if floorplan_path else None,
        "children": [],
        "devices": []
    }

    # Füge es zum übergeordneten Asset hinzu, falls vorhanden
    if parentId:
        parent = next((a for a in MOCK_ASSETS if a["id"] == parentId), None)
        if parent:
            parent["children"].append(new_asset)
    else:
        MOCK_ASSETS.append(new_asset)

    return new_asset

# Mock-Daten für Wartungsaufgaben
MOCK_MAINTENANCE_TASKS = [
    {
        "id": 1,
        "title": "Fenster-Wartung",
        "description": "Jährliche Inspektion und Wartung der Fensterantriebe",
        "date": "2024-02-15",
        "time": "09:00",
        "type": "inspection",
        "priority": "medium",
        "status": "pending",
        "assetId": 4,  # Fenster Nord
        "assignee": "Max Mustermann",
        "checklist": [
            {"text": "Antrieb auf Verschleiß prüfen", "completed": False},
            {"text": "Dichtungen kontrollieren", "completed": False},
            {"text": "Funktionstest durchführen", "completed": False}
        ]
    },
    {
        "id": 2,
        "title": "Notfall-Knopf Test",
        "description": "Monatlicher Test der Notfall-Knöpfe",
        "date": "2024-02-10",
        "time": "14:00",
        "type": "inspection",
        "priority": "high",
        "status": "pending",
        "assetId": 5,  # Büro 1.02
        "assignee": "Erika Musterfrau",
        "checklist": [
            {"text": "Sichtprüfung durchführen", "completed": False},
            {"text": "Alarmauslösung testen", "completed": False},
            {"text": "Protokoll erstellen", "completed": False}
        ]
    }
]

@app.get("/api/maintenance-tasks")
async def get_maintenance_tasks():
    return MOCK_MAINTENANCE_TASKS

@app.get("/")
async def read_root():
    return FileResponse('templates/index.html') 