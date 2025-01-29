from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from src.database import get_db, Device

router = APIRouter()

@router.get("/devices", response_model=List[dict])
async def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return [device.to_dict() for device in devices]

@router.get("/devices/{mac}")
async def get_device(mac: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.mac == mac).first()
    if not device:
        raise HTTPException(status_code=404, detail="Gerät nicht gefunden")
    return device.to_dict()

@router.post("/devices")
async def create_device(device_data: dict, db: Session = Depends(get_db)):
    device = Device(
        mac=device_data["mac"],
        name=device_data.get("name", f"Gerät {device_data['mac'][-6:]}"),
        type=device_data.get("type", "unknown"),
        location=json.dumps(device_data.get("location", {})),
        config=json.dumps(device_data.get("config", {}))
    )
    db.add(device)
    try:
        db.commit()
        return device.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/devices/{mac}")
async def update_device(mac: str, device_data: dict, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.mac == mac).first()
    if not device:
        raise HTTPException(status_code=404, detail="Gerät nicht gefunden")
    
    for key, value in device_data.items():
        if key in ["location", "config"]:
            setattr(device, key, json.dumps(value))
        else:
            setattr(device, key, value)
    
    try:
        db.commit()
        return device.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/devices/{mac}")
async def delete_device(mac: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.mac == mac).first()
    if not device:
        raise HTTPException(status_code=404, detail="Gerät nicht gefunden")
    
    try:
        db.delete(device)
        db.commit()
        return {"message": "Gerät erfolgreich gelöscht"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) 