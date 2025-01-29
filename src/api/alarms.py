from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from src.database import get_db, Alarm, Device

router = APIRouter()

@router.get("/alarms")
async def get_alarms(db: Session = Depends(get_db)):
    alarms = db.query(Alarm).all()
    return [alarm.to_dict() for alarm in alarms]

@router.post("/alarms")
async def create_alarm(alarm_data: dict, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.mac == alarm_data["device_mac"]).first()
    if not device:
        raise HTTPException(status_code=404, detail="Gerät nicht gefunden")
    
    alarm = Alarm(
        device_id=device.id,
        type=alarm_data["type"],
        priority=alarm_data["priority"],
        title=alarm_data["title"],
        description=alarm_data["description"],
        location=json.dumps(alarm_data.get("location", {})),
        timeline=json.dumps([{
            "timestamp": datetime.utcnow().isoformat(),
            "event": "Alarm erstellt",
            "description": alarm_data["description"]
        }])
    )
    
    db.add(alarm)
    try:
        db.commit()
        return alarm.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/alarms/{alarm_id}/acknowledge")
async def acknowledge_alarm(alarm_id: int, db: Session = Depends(get_db)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    
    timeline = json.loads(alarm.timeline)
    timeline.append({
        "timestamp": datetime.utcnow().isoformat(),
        "event": "Alarm bestätigt",
        "description": "Alarm wurde vom Benutzer bestätigt"
    })
    
    alarm.status = "acknowledged"
    alarm.timeline = json.dumps(timeline)
    
    try:
        db.commit()
        return alarm.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/alarms/{alarm_id}/resolve")
async def resolve_alarm(alarm_id: int, db: Session = Depends(get_db)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    
    timeline = json.loads(alarm.timeline)
    timeline.append({
        "timestamp": datetime.utcnow().isoformat(),
        "event": "Alarm gelöst",
        "description": "Alarm wurde als gelöst markiert"
    })
    
    alarm.status = "resolved"
    alarm.timeline = json.dumps(timeline)
    
    try:
        db.commit()
        return alarm.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) 