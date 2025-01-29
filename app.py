import streamlit as st
import json
import pandas as pd
from datetime import datetime
import time
from pathlib import Path
import os
import shutil

# Konstanten
DATA_DIR = Path("data")
STATIC_DIR = Path("static")
UPLOADS_DIR = STATIC_DIR / "uploads"
EMPLOYEES_FILE = DATA_DIR / "employees.json"

# Erstelle Upload-Verzeichnis falls nicht vorhanden
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Seitenkonfiguration
st.set_page_config(
    page_title="EVALARM SOS Platform",
    page_icon="🚨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS für Layout und Header
st.markdown("""
    <style>
        /* Header Styling */
        .header-container {
            padding: 1rem 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 2rem;
        }
        .platform-title {
            font-size: 2.2rem;
            font-weight: 600;
            margin-bottom: 0.2rem;
            color: #1a1a1a;
            letter-spacing: -0.5px;
        }
        .company-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .powered-by {
            font-size: 0.85rem;
            color: #666;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        .company-name {
            color: #2c3e50;
            font-weight: 500;
        }
        .made-with-love {
            font-size: 0.75rem;
            color: #666;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            margin-left: auto;
        }
        .swiss-flag {
            width: 14px;
            height: 14px;
            vertical-align: middle;
        }
        .main > div {
            padding-top: 1rem;
        }
        .block-container {
            padding-top: 1rem;
            padding-bottom: 0rem;
        }
        section[data-testid="stSidebar"] > div {
            padding-top: 1rem;
        }
        section[data-testid="stSidebar"] .block-container {
            padding-top: 0rem;
        }
        div[data-testid="stExpander"] {
            background-color: white;
            border-radius: 4px;
            margin-bottom: 0.5rem;
        }
        iframe {
            height: calc(100vh - 100px) !important;
        }
        .marker-label {
            pointer-events: none;
            z-index: 1000;
            transition: transform 0.1s ease-out;
        }
        .grid-label {
            pointer-events: none;
            z-index: 999;
        }
        .axis-label {
            z-index: 1000;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
    </style>
    <div class="header-container">
        <div class="platform-title">EVALARM SOS Platform</div>
        <div class="company-info">
            <div class="powered-by">
                powered by <span class="company-name">nextX AG</span>
            </div>
            <div class="made-with-love">
                Made with ❤️ in Switzerland
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'%3E%3Cpath fill='%23D52B1E' d='M0 0h320v320H0z'/%3E%3Cpath fill='%23fff' d='M60 130h200v60H60z'/%3E%3Cpath fill='%23fff' d='M130 60h60v200h-60z'/%3E%3C/svg%3E" 
                     class="swiss-flag" 
                     alt="Swiss flag"/>
            </div>
        </div>
    </div>
""", unsafe_allow_html=True)

def load_employees():
    """Lädt Mitarbeiterdaten aus der JSON-Datei"""
    try:
        with open(EMPLOYEES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"employees": []}

def get_employee_by_mac(mac, employees):
    """Findet einen Mitarbeiter anhand der MAC-Adresse"""
    for employee in employees["employees"]:
        if employee["mac"].lower() == mac.lower():
            return employee
    return None

def check_file_exists(file_path):
    """Überprüft, ob die Datei existiert und gibt den vollständigen Pfad zurück"""
    full_path = STATIC_DIR / file_path
    if full_path.exists():
        st.success(f"Datei gefunden: {file_path}")
        return True
    st.error(f"Datei nicht gefunden: {file_path}")
    return False

def handle_model_upload():
    """Verarbeitet den Upload von 3D-Modellen"""
    uploaded_file = st.file_uploader(
        "3D-Modell hochladen (.glb oder .gltf)", 
        type=['glb', 'gltf']
    )
    
    if uploaded_file is not None:
        # Progress Bar für den Upload
        progress_bar = st.progress(0)
        file_size_mb = len(uploaded_file.getbuffer()) / (1024 * 1024)
        upload_status = st.empty()
        upload_status.write(f"Lade Modell hoch (0 MB / {file_size_mb:.1f} MB)...")
        
        file_path = UPLOADS_DIR / uploaded_file.name
        chunk_size = 1024 * 1024  # 1MB chunks
        file_size = len(uploaded_file.getbuffer())
        
        # Datei in Chunks schreiben
        with open(file_path, "wb") as f:
            bytes_written = 0
            while bytes_written < file_size:
                chunk = uploaded_file.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                bytes_written += len(chunk)
                progress = int((bytes_written / file_size) * 100)
                mb_written = bytes_written / (1024 * 1024)
                progress_bar.progress(progress)
                upload_status.write(f"Lade Modell hoch ({mb_written:.1f} MB / {file_size_mb:.1f} MB)...")
        
        # Warte kurz, damit die Datei vollständig geschrieben wird
        time.sleep(1)
        
        relative_path = f"uploads/{uploaded_file.name}"
        if check_file_exists(relative_path):
            upload_status.success(f"Upload abgeschlossen! Dateigröße: {file_size_mb:.1f} MB")
            # Setze Upload-Status in Session State
            st.session_state['upload_complete'] = True
            st.session_state['upload_time'] = time.time()
            return relative_path
        else:
            upload_status.error(f"Fehler beim Upload der Datei ({file_size_mb:.1f} MB)")
            st.session_state['upload_complete'] = False
        return None
    return None

def render_model_viewer(model_path=None):
    """Rendert den 3D-Model-Viewer"""
    html_content = '''
    <div id="model-viewer" style="width: 100%; height: calc(100vh - 100px); border: 1px solid #ddd; border-radius: 5px;"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <script>
        {1}
        
        // Initialisiere den Viewer
        const viewer = init('model-viewer');
        
        // Event-Listener für Streamlit-Nachrichten
        window.addEventListener('message', function(event) {{
            if (event.data.type === 'toggleGrid') {{
                viewer.toggleGrid();
            }} else if (event.data.type === 'toggleAxes') {{
                viewer.toggleAxes();
            }}
        }}, false);
        
        if ('{0}') {{
            console.log('Loading model:', 'http://localhost:8076/static/{0}');
            const uploadComplete = {2};
            const loadDelay = uploadComplete ? 1000 : 0;
            
            setTimeout(() => {{
                viewer.loadModel('http://localhost:8076/static/{0}');
                // Warte kurz, bevor die Marker hinzugefügt werden
                setTimeout(() => {{
                    console.log('Model loaded, adding markers...');
                    // Test-Marker hinzufügen
                    viewer.addMarker(new THREE.Vector3(0, 0, 0), 'Zentrum', 'button');
                    viewer.addMarker(new THREE.Vector3(10, 0, 10), 'Nordost', 'gateway');
                    viewer.addMarker(new THREE.Vector3(-10, 0, -10), 'Südwest', 'sensor');
                    
                    // Benutzerdefinierte Marker hinzufügen
                    {3}
                    
                    // Sektoren hinzufügen
                    {4}
                }}, 4000);  // 4 Sekunden warten, bis das Modell geladen ist
            }}, loadDelay);
        }}
    </script>
    <style>
        .marker-label {{
            pointer-events: none;
            z-index: 1000;
            transition: transform 0.1s ease-out;
        }}
    </style>
    '''
    
    # Lade den JavaScript-Code für den Model-Viewer
    with open('static/js/model_viewer.js', 'r') as f:
        model_viewer_js = f.read()
    
    # Prüfe Upload-Status
    upload_complete = st.session_state.get('upload_complete', False)
    if upload_complete:
        # Reset Upload-Status nach Verwendung
        st.session_state['upload_complete'] = False
    
    # Erstelle Marker-JavaScript
    markers_js = ""
    if st.session_state.get('markers'):
        for marker in st.session_state.markers:
            markers_js += f"""
            viewer.addMarker(
                new THREE.Vector3({marker['position'][0]}, {marker['position'][1]}, {marker['position'][2]}),
                '{marker['name']}',
                '{marker['type']}'
            );
            """
    
    # Erstelle Sektor-JavaScript
    sectors_js = ""
    if st.session_state.get('sectors'):
        for sector in st.session_state.sectors:
            points_str = ", ".join([f"new THREE.Vector2({p[0]}, {p[1]})" for p in sector['points']])
            sectors_js += f"""
            viewer.addSector([{points_str}], {sector['height']}, '{sector['name']}');
            """
    
    st.components.v1.html(
        html_content.format(
            model_path or '', 
            model_viewer_js, 
            str(upload_complete).lower(),
            markers_js,
            sectors_js
        ),
        height=2000
    )

def render_device_list(devices, view_type="list"):
    """Rendert die Geräteliste in List- oder Grid-Ansicht"""
    if not devices:
        st.info("Keine Geräte gefunden. Starte die Geräteerkennung...")
        return

    if view_type == "list":
        # Listen-Ansicht
        for device in devices:
            with st.container():
                col1, col2, col3 = st.columns([2,3,1])
                with col1:
                    st.write(f"📱 **{device['name']}**")
                with col2:
                    st.write(f"""
                        MAC: `{device['mac']}`  
                        Typ: {device['type']}  
                        Status: {'🟢 Online' if device['online'] else '🔴 Offline'}
                    """)
                with col3:
                    st.button("Details", key=f"details_{device['mac']}")
                st.divider()
    else:
        # Grid-Ansicht
        cols = st.columns(3)
        for idx, device in enumerate(devices):
            with cols[idx % 3]:
                with st.container():
                    st.markdown(f"""
                        <div style="
                            padding: 1rem;
                            border: 1px solid #ddd;
                            border-radius: 0.5rem;
                            margin-bottom: 1rem;
                        ">
                            <h3>{device['name']}</h3>
                            <p>MAC: <code>{device['mac']}</code></p>
                            <p>Typ: {device['type']}</p>
                            <p>Status: {'🟢 Online' if device['online'] else '🔴 Offline'}</p>
                        </div>
                    """, unsafe_allow_html=True)
                    st.button("Details", key=f"grid_details_{device['mac']}")

def main():
    st.title("🚨 Zigbee Alarm Monitoring System")
    
    # Sidebar für Navigation
    page = st.sidebar.selectbox(
        "Navigation",
        ["Dashboard", "3D-Modell", "Geräte", "Mitarbeiterverwaltung", "Alarmhistorie"]
    )
    
    if page == "3D-Modell":
        st.subheader("3D-Gebäudemodell")
        
        # Sidebar für 3D-Modell-Verwaltung
        with st.sidebar:
            st.subheader("Marker & Sektoren")
            
            # Hilfslinien-Steuerung
            with st.expander("Hilfslinien", expanded=True):
                col1, col2 = st.columns(2)
                if col1.button("Gitter Ein/Aus", key="toggle_grid"):
                    st.session_state['grid_visible'] = not st.session_state.get('grid_visible', True)
                    st.components.v1.html(
                        f"""
                        <script>
                            window.parent.postMessage({{ type: 'toggleGrid' }}, '*');
                        </script>
                        """,
                        height=0
                    )
                
                if col2.button("Achsen Ein/Aus", key="toggle_axes"):
                    st.session_state['axes_visible'] = not st.session_state.get('axes_visible', True)
                    st.components.v1.html(
                        f"""
                        <script>
                            window.parent.postMessage({{ type: 'toggleAxes' }}, '*');
                        </script>
                        """,
                        height=0
                    )
            
            # Marker hinzufügen
            with st.expander("Neuen Marker hinzufügen"):
                marker_name = st.text_input("Marker Name", key="marker_name")
                marker_type = st.selectbox("Typ", ["button", "gateway", "sensor"])
                col1, col2, col3 = st.columns(3)
                marker_x = col1.number_input("X", value=0.0, step=1.0)
                marker_y = col2.number_input("Y", value=0.0, step=1.0)
                marker_z = col3.number_input("Z", value=0.0, step=1.0)
                if st.button("Marker hinzufügen"):
                    st.session_state.markers = st.session_state.get('markers', [])
                    st.session_state.markers.append({
                        "name": marker_name,
                        "type": marker_type,
                        "position": [marker_x, marker_y, marker_z]
                    })
                    st.success(f"Marker '{marker_name}' hinzugefügt")
            
            # Sektor hinzufügen
            with st.expander("Neuen Sektor hinzufügen"):
                sector_name = st.text_input("Sektor Name", key="sector_name")
                sector_height = st.number_input("Höhe", value=10.0, step=1.0)
                
                # Punkte für den Sektor
                st.write("Eckpunkte (mindestens 3)")
                points = []
                for i in range(st.session_state.get('num_points', 3)):
                    col1, col2 = st.columns(2)
                    x = col1.number_input(f"X{i+1}", key=f"x{i}")
                    z = col2.number_input(f"Z{i+1}", key=f"z{i}")
                    points.append([x, z])
                
                if st.button("Punkt hinzufügen"):
                    st.session_state.num_points = st.session_state.get('num_points', 3) + 1
                    st.experimental_rerun()
                
                if st.button("Sektor erstellen"):
                    st.session_state.sectors = st.session_state.get('sectors', [])
                    st.session_state.sectors.append({
                        "name": sector_name,
                        "height": sector_height,
                        "points": points
                    })
                    st.success(f"Sektor '{sector_name}' hinzugefügt")
            
            # Liste aller Marker und Sektoren
            st.subheader("Aktuelle Elemente")
            if st.session_state.get('markers'):
                st.write("Marker:")
                for i, marker in enumerate(st.session_state.markers):
                    col1, col2 = st.columns([3, 1])
                    col1.write(f"{marker['name']} ({marker['type']})")
                    if col2.button("Löschen", key=f"del_marker_{i}"):
                        st.session_state.markers.pop(i)
                        st.experimental_rerun()
            
            if st.session_state.get('sectors'):
                st.write("Sektoren:")
                for i, sector in enumerate(st.session_state.sectors):
                    col1, col2 = st.columns([3, 1])
                    col1.write(f"{sector['name']}")
                    if col2.button("Löschen", key=f"del_sector_{i}"):
                        st.session_state.sectors.pop(i)
                        st.experimental_rerun()

        # Model Upload und Viewer
        model_path = handle_model_upload()
        
        if model_path:
            render_model_viewer(model_path)
    
    # Mitarbeiterdaten laden
    employees_data = load_employees()
    
    if page == "Dashboard":
        # Dashboard Layout
        # Erste Reihe: Wichtige Metriken
        # Beispiel-Geräteliste (später durch echte Daten ersetzen)
        devices = [
            {
                "name": "Zigbee Button 1",
                "mac": "00:11:22:33:44:55",
                "type": "button",
                "online": True,
                "last_seen": "2024-02-20 15:30:00",
                "battery": 85
            },
            {
                "name": "Gateway EG",
                "mac": "AA:BB:CC:DD:EE:FF",
                "type": "gateway",
                "online": True,
                "last_seen": "2024-02-20 15:45:00",
                "battery": None
            },
            {
                "name": "Bewegungssensor 1",
                "mac": "11:22:33:44:55:66",
                "type": "sensor",
                "online": False,
                "last_seen": "2024-02-20 14:15:00",
                "battery": 32
            }
        ]

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric(
                "Aktive Geräte",
                len(devices),
                delta="+2 seit gestern",
                delta_color="normal"
            )
        with col2:
            online_count = sum(1 for d in devices if d.get('online', False))
            online_percentage = (online_count/len(devices)*100) if devices else 0
            st.metric(
                "Online",
                online_count,
                delta=f"{online_percentage:.0f}%",
                delta_color="normal"
            )
        with col3:
            st.metric(
                "Aktive Alarme",
                "2",
                delta="+1 in 24h",
                delta_color="inverse"
            )
        with col4:
            low_battery_count = sum(1 for d in devices 
                                  if isinstance(d.get('battery'), (int, float)) and d['battery'] < 20)
            st.metric(
                "Batterie kritisch",
                low_battery_count,
                delta=f"{low_battery_count} Geräte",
                delta_color="inverse"
            )
        
        # Zweite Reihe: Alarme und Aktivitäten
        st.markdown("---")
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("🚨 Aktive Alarme")
            # Alarmliste
            for i, alarm in enumerate([
                {
                    "time": "2024-02-20 15:45:23",
                    "device": "Notfall-Button EG",
                    "location": "Haupteingang",
                    "type": "Panic Button",
                    "priority": "Hoch"
                },
                {
                    "time": "2024-02-20 15:30:12",
                    "device": "Bewegungsmelder 2",
                    "location": "Lager Süd",
                    "type": "Bewegung",
                    "priority": "Mittel"
                }
            ]):
                with st.container():
                    st.markdown(f"""
                        <div style="
                            padding: 1rem;
                            background-color: {'#ffe6e6' if alarm['priority'] == 'Hoch' else '#fff3e6'};
                            border-radius: 0.5rem;
                            margin-bottom: 0.5rem;
                        ">
                            <div style="color: {'#cc0000' if alarm['priority'] == 'Hoch' else '#cc7700'}; font-weight: bold;">
                                {alarm['type']} - {alarm['priority']}e Priorität
                            </div>
                            <div style="font-size: 0.9rem; margin-top: 0.3rem;">
                                📍 {alarm['location']} | 🔔 {alarm['device']}
                            </div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 0.2rem;">
                                ⏰ {alarm['time']}
                            </div>
                        </div>
                    """, unsafe_allow_html=True)
            
        with col2:
            st.subheader("📊 System Status")
            # System Status
            status_items = [
                {"name": "Zigbee Netzwerk", "status": "Online", "uptime": "5d 12h"},
                {"name": "Datenbank", "status": "Online", "uptime": "12d 3h"},
                {"name": "Alarm Server", "status": "Online", "uptime": "5d 12h"}
            ]
            
            for item in status_items:
                st.markdown(f"""
                    <div style="
                        padding: 0.5rem;
                        background-color: #f8f9fa;
                        border-radius: 0.3rem;
                        margin-bottom: 0.5rem;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>{item['name']}</span>
                            <span style="color: #00cc00">●</span>
                        </div>
                        <div style="font-size: 0.8rem; color: #666;">
                            Uptime: {item['uptime']}
                        </div>
                    </div>
                """, unsafe_allow_html=True)
            
            # Letzte Aktivitäten
            st.subheader("Letzte Aktivitäten")
            activities = [
                "15:45 - Neue Geräteerkennung",
                "15:30 - Systemupdate durchgeführt",
                "15:15 - Backup erstellt",
                "15:00 - Netzwerk-Check OK"
            ]
            for activity in activities:
                st.markdown(f"- {activity}")
    
    elif page == "Geräte":
        st.subheader("Geräteverwaltung")
        
        # Steuerelemente in der oberen Leiste
        col1, col2, col3 = st.columns([2,1,1])
        with col1:
            search = st.text_input("🔍 Suche", placeholder="Gerät suchen...")
        with col2:
            view_type = st.selectbox("Ansicht", ["Liste", "Grid"], key="device_view")
        with col3:
            if st.button("🔄 Aktualisieren"):
                st.cache_data.clear()

        # Filtern basierend auf Sucheingabe
        if search:
            devices = [d for d in devices if search.lower() in d['name'].lower() or search.lower() in d['mac'].lower()]

        # Geräteliste rendern
        render_device_list(devices, "list" if view_type == "Liste" else "grid")

        # Statistiken
        st.subheader("Statistiken")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Gesamtgeräte", len(devices))
        with col2:
            online_count = sum(1 for d in devices if d['online'])
            st.metric("Online", online_count)
        with col3:
            offline_count = len(devices) - online_count
            st.metric("Offline", offline_count)
        with col4:
            low_battery = sum(1 for d in devices if isinstance(d.get('battery'), (int, float)) and d['battery'] < 20)
            st.metric("Niedriger Akku", low_battery)
    
    elif page == "Mitarbeiterverwaltung":
        st.subheader("Mitarbeiterverwaltung")
        # Mitarbeiterliste als DataFrame anzeigen
        df = pd.DataFrame(employees_data["employees"])
        st.dataframe(df)
        
        # Neuen Mitarbeiter hinzufügen
        with st.expander("Neuen Mitarbeiter hinzufügen"):
            with st.form("new_employee"):
                name = st.text_input("Name")
                mac = st.text_input("MAC-Adresse")
                department = st.text_input("Abteilung")
                if st.form_submit_button("Hinzufügen"):
                    # Hier später: Logik zum Hinzufügen
                    st.success("Mitarbeiter hinzugefügt!")
    
    elif page == "Alarmhistorie":
        st.subheader("Alarmhistorie")
        # Hier später: Implementierung der Alarmhistorie

if __name__ == "__main__":
    main() 