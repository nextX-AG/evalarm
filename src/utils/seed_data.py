from datetime import datetime
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import SessionLocal, Device, Alarm
import json

def seed_database():
    db = SessionLocal()
    
    # Lösche existierende Daten
    db.query(Alarm).delete()
    db.query(Device).delete()
    
    # Beispiel-Geräte
    devices = [
        Device(
            mac="00:11:22:33:44:55",
            name="Notfallknopf Eingang",
            type="button",
            location=json.dumps({"x": 0, "y": 0, "z": 0}),
            battery=85,
            online=True,
            last_seen=datetime.utcnow()
        ),
        Device(
            mac="AA:BB:CC:DD:EE:FF",
            name="Gateway EG",
            type="gateway",
            location=json.dumps({"x": 10, "y": 0, "z": 10}),
            battery=100,
            online=True,
            last_seen=datetime.utcnow()
        )
    ]
    
    for device in devices:
        db.add(device)
    
    db.commit()
    
    # Beispiel-Alarme
    button = db.query(Device).filter(Device.type == "button").first()
    
    alarms = [
        Alarm(
            device_id=button.id,
            type="panic",
            priority="high",
            title="Notfall am Eingang",
            description="Notfallknopf wurde ausgelöst",
            location=json.dumps({"x": 0, "y": 0, "z": 0}),
            timeline=json.dumps([{
                "timestamp": datetime.utcnow().isoformat(),
                "event": "Alarm erstellt",
                "description": "Notfallknopf wurde ausgelöst"
            }])
        )
    ]
    
    for alarm in alarms:
        db.add(alarm)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    print("Fülle Datenbank mit Testdaten...")
    seed_database()
    print("Fertig!") 