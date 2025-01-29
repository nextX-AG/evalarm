from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

Base = declarative_base()

class Device(Base):
    __tablename__ = 'devices'
    
    id = Column(Integer, primary_key=True)
    mac = Column(String, unique=True, nullable=False)
    name = Column(String)
    type = Column(String)
    location = Column(JSON)  # Speichert Position als {x: float, y: float, z: float}
    battery = Column(Float)
    online = Column(Boolean, default=False)
    last_seen = Column(DateTime)
    config = Column(JSON)
    alarms = relationship("Alarm", back_populates="device")

    def to_dict(self):
        return {
            "id": self.id,
            "mac": self.mac,
            "name": self.name,
            "type": self.type,
            "location": json.loads(self.location) if self.location else None,
            "battery": self.battery,
            "online": self.online,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "config": json.loads(self.config) if self.config else {}
        }

class Alarm(Base):
    __tablename__ = 'alarms'
    
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey('devices.id'))
    timestamp = Column(DateTime, default=datetime.utcnow)
    type = Column(String)
    priority = Column(String)
    status = Column(String, default='active')  # active, acknowledged, resolved
    title = Column(String)
    description = Column(String)
    location = Column(JSON)
    timeline = Column(JSON)  # Liste von Events mit Timestamps
    device = relationship("Device", back_populates="alarms")

    def to_dict(self):
        return {
            "id": self.id,
            "device": self.device.to_dict() if self.device else None,
            "timestamp": self.timestamp.isoformat(),
            "type": self.type,
            "priority": self.priority,
            "status": self.status,
            "title": self.title,
            "description": self.description,
            "location": json.loads(self.location) if self.location else None,
            "timeline": json.loads(self.timeline) if self.timeline else []
        }

# Datenbankverbindung
engine = create_engine('sqlite:///evalarm.db', echo=True)
SessionLocal = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 