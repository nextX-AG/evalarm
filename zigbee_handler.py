import time
from datetime import datetime

class ZigbeeHandler:
    def __init__(self):
        self.active_alarms = {}
    
    def rssi_to_distance(self, rssi):
        """Berechnet die ungefähre Entfernung basierend auf RSSI"""
        if rssi == 0:
            return -1
        tx_power = -59  # Referenzwert in dBm
        return 10 ** ((tx_power - rssi) / 20)
    
    def process_alarm(self, mac, rssi, value, zone):
        """Verarbeitet eingehende Alarmdaten"""
        timestamp = datetime.now()
        distance = self.rssi_to_distance(rssi)
        
        alarm_data = {
            "timestamp": timestamp,
            "mac": mac,
            "rssi": rssi,
            "value": value,
            "zone": zone,
            "distance": distance
        }
        
        if value == 1:  # Alarm aktiv
            self.active_alarms[mac] = alarm_data
        else:  # Alarm inaktiv
            self.active_alarms.pop(mac, None)
        
        return alarm_data 