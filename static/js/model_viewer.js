let scene, camera, renderer, model, controls;
let markers = [];  // Array für alle Marker
let sectors = [];  // Array für alle Sektoren
let axesHelper, gridHelper;
let gridSize = 100;
let gridLabels = [];

// Gitter-Beschriftungen Funktion
function createGridLabels(container) {
    const labels = [];
    // Entferne alte Labels
    const oldLabels = container.getElementsByClassName('grid-label');
    while (oldLabels.length > 0) {
        oldLabels[0].remove();
    }
    
    // Achsen-Farben
    const axesColors = {
        x: '#ff0000',  // Rot für X-Achse
        y: '#00ff00',  // Grün für Y-Achse
        z: '#0000ff'   // Blau für Z-Achse
    };
    
    // Achsenbeschriftungen
    const createAxisLabel = (text, color) => {
        const label = document.createElement('div');
        label.className = 'axis-label';
        label.style.cssText = `
            background-color: ${color};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
            position: absolute;
            pointer-events: none;
        `;
        label.textContent = text;
        container.appendChild(label);
        return label;
    };
    
    // Erstelle Achsenbeschriftungen
    const xAxisLabel = createAxisLabel('X', axesColors.x);
    const yAxisLabel = createAxisLabel('Y', axesColors.y);
    const zAxisLabel = createAxisLabel('Z', axesColors.z);
    
    labels.push(
        {element: xAxisLabel, position: new THREE.Vector3(gridSize * 1.1, 0, 0), fixed: true},
        {element: yAxisLabel, position: new THREE.Vector3(0, gridSize * 1.1, 0), fixed: true},
        {element: zAxisLabel, position: new THREE.Vector3(0, 0, gridSize * 1.1), fixed: true}
    );
    
    // Erstelle neue Labels
    const step = 5;  // Abstand zwischen Labels
    for (let i = -gridSize; i <= gridSize; i += step) {
        // X-Achsen Beschriftung
        const xLabel = document.createElement('div');
        xLabel.className = 'grid-label';
        xLabel.style.cssText = `
            position: absolute;
            background-color: rgba(255, 0, 0, 0.1);
            border: 1px solid ${axesColors.x};
            color: ${axesColors.x};
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10px;
            pointer-events: none;
        `;
        xLabel.textContent = `${i}`;
        container.appendChild(xLabel);
        labels.push({element: xLabel, position: new THREE.Vector3(i, 0, -gridSize)});
        
        // Z-Achsen Beschriftung
        const zLabel = document.createElement('div');
        zLabel.className = 'grid-label';
        zLabel.style.cssText = `
            position: absolute;
            background-color: rgba(0, 0, 255, 0.1);
            border: 1px solid ${axesColors.z};
            color: ${axesColors.z};
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10px;
            pointer-events: none;
        `;
        zLabel.textContent = `${i}`;
        container.appendChild(zLabel);
        labels.push({element: zLabel, position: new THREE.Vector3(-gridSize, 0, i)});
        
        // Y-Achsen Beschriftung
        const yLabel = document.createElement('div');
        yLabel.className = 'grid-label';
        yLabel.style.cssText = `
            position: absolute;
            background-color: rgba(0, 255, 0, 0.1);
            border: 1px solid ${axesColors.y};
            color: ${axesColors.y};
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10px;
            pointer-events: none;
        `;
        yLabel.textContent = `${i}`;
        container.appendChild(yLabel);
        labels.push({element: yLabel, position: new THREE.Vector3(-gridSize, i, 0)});
    }
    return labels;
}

// Hilfsfunktionen für Grid und Achsen als globales Objekt
const gridHelpers = {
    update: function(scene, modelSize) {
        // Entferne alte Helfer
        if (axesHelper) scene.remove(axesHelper);
        if (gridHelper) scene.remove(gridHelper);
        
        // Berechne neue Größe basierend auf Modellgröße
        gridSize = Math.ceil(Math.max(modelSize.x, modelSize.z) * 1.5 / 10) * 10;
        const divisions = Math.ceil(gridSize / 5);
        
        // Verbesserte Achsen
        const axes = [];
        const axesGeometry = new THREE.CylinderGeometry(0.1, 0.1, gridSize * 2, 32);
        const materials = {
            x: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            y: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            z: new THREE.MeshBasicMaterial({ color: 0x0000ff })
        };
        
        // X-Achse (rot)
        const xAxis = new THREE.Mesh(axesGeometry, materials.x);
        xAxis.rotation.z = -Math.PI / 2;
        xAxis.position.x = gridSize;
        axes.push(xAxis);
        
        // Y-Achse (grün)
        const yAxis = new THREE.Mesh(axesGeometry, materials.y);
        yAxis.position.y = gridSize;
        axes.push(yAxis);
        
        // Z-Achse (blau)
        const zAxis = new THREE.Mesh(axesGeometry, materials.z);
        zAxis.rotation.x = Math.PI / 2;
        zAxis.position.z = gridSize;
        axes.push(zAxis);
        
        // Füge Achsen zur Szene hinzu
        axesHelper = new THREE.Group();
        axes.forEach(axis => axesHelper.add(axis));
        axesHelper.visible = true;
        scene.add(axesHelper);
        
        // Neues Gitter
        gridHelper = new THREE.GridHelper(gridSize * 2, divisions * 2);
        gridHelper.visible = true;
        scene.add(gridHelper);
        
        // Aktualisiere Beschriftungen
        this.updateLabels(document.getElementById('model-viewer'));
    },
    updateLabels: function(container) {
        gridLabels = createGridLabels(container);
    }
};

// Marker-Klasse für bessere Organisation
class DeviceMarker {
    constructor(position, name, type = 'button') {
        this.position = position;
        this.name = name;
        this.type = type;
        this.mesh = this.createMarkerMesh();
        this.label = this.createLabel();
    }

    createMarkerMesh() {
        const geometry = new THREE.SphereGeometry(2, 32, 32);  // Größerer Marker
        let color;
        switch(this.type) {
            case 'button':
                color = 0xff0000;  // Rot
                break;
            case 'gateway':
                color = 0x00ff00;  // Grün
                break;
            case 'sensor':
                color = 0x0000ff;  // Blau
                break;
            default:
                color = 0xff0000;
        }
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.renderOrder = 999;  // Immer über anderen Objekten rendern
        
        // Pulsierender Effekt
        this.pulse = 0;
        mesh.userData.animate = () => {
            this.pulse += 0.1;
            mesh.scale.setScalar(1 + Math.sin(this.pulse) * 0.2);  // Stärkeres Pulsieren
        };
        
        return mesh;
    }

    createLabel() {
        const div = document.createElement('div');
        div.className = 'marker-label';
        div.textContent = this.name;
        div.style.cssText = `
            position: absolute;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            display: none;
        `;
        document.getElementById('model-viewer').appendChild(div);
        return div;
    }

    updateLabelPosition(camera, container) {
        const vector = this.position.clone();
        vector.project(camera);
        
        const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-vector.y * 0.5 + 0.5) * container.clientHeight;
        
        this.label.style.transform = `translate(-50%, -100%) translate(${x}px,${y}px)`;
        this.label.style.display = vector.z < 1 ? 'block' : 'none';
    }
}

// Sektor-Klasse für Gebäudebereiche
class Sector {
    constructor(points, height = 10, name = '') {
        this.points = points;
        this.height = height;
        this.name = name;
        this.mesh = this.createSectorMesh();
    }

    createSectorMesh() {
        const shape = new THREE.Shape(this.points);
        const extrudeSettings = {
            depth: this.height,
            bevelEnabled: false
        };
        
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshPhongMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;  // Drehe horizontal
        mesh.position.y = 0;  // Auf Bodenhöhe
        
        return mesh;
    }
}

function init(containerId) {
    const container = document.getElementById(containerId);
    let isLoading = false;  // Track loading state
    
    // Initiale Größenanpassung
    function updateSize() {
        const height = window.innerHeight - 100;
        container.style.height = `${height}px`;
        if (camera) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        }
        if (renderer) {
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }
    
    // Führe initiale Größenanpassung durch
    updateSize();
    
    // Reagiere auf Größenänderungen
    window.addEventListener('resize', updateSize);
    
    // Scene erstellen
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Handle container resize
    new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }).observe(container);

    // Beleuchtung
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        markers.forEach(marker => {
            marker.mesh.userData.animate();
            marker.updateLabelPosition(camera, container);
        });
        gridHelpers.updateLabels(container);
        renderer.render(scene, camera);
    }
    animate();

    return {
        loadModel: (url) => {
            if (isLoading) {
                console.log('Already loading a model, ignoring new request');
                return Promise.reject('Already loading');
            }
            isLoading = true;
            return loadModel(url, controls).finally(() => {
                isLoading = false;
                console.log('Loading process completed');
            });
        },
        getScene: () => scene,
        getCamera: () => camera,
        getControls: () => controls,
        addMarker: (position, name, type) => {
            console.log('Adding marker:', { position, name, type });
            const marker = new DeviceMarker(position, name, type);
            markers.push(marker);
            scene.add(marker.mesh);
            console.log('Marker added, total markers:', markers.length);
        },
        addSector: (points, height, name) => {
            const sector = new Sector(points, height, name);
            sectors.push(sector);
            scene.add(sector.mesh);
        },
        clearMarkers: () => {
            markers.forEach(marker => {
                scene.remove(marker.mesh);
                marker.label.remove();
            });
            markers = [];
        },
        toggleGrid: () => {
            console.log('Toggling grid visibility');
            if (gridHelper) {
                gridHelper.visible = !gridHelper.visible;
                gridLabels.forEach(label => {
                    label.element.style.display = gridHelper.visible ? 'block' : 'none';
                });
            }
        },
        toggleAxes: () => {
            console.log('Toggling axes visibility');
            if (axesHelper) {
                axesHelper.visible = !axesHelper.visible;
            }
        }
    };
}

function loadModel(url, controls) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        
        console.log('=== Starting model load process ===');
        console.log('Attempting to load model from:', url);
        
        // Lade-Animation oder Indikator hinzufügen
        const overlayDiv = document.createElement('div');
        overlayDiv.id = 'loading-overlay';
        overlayDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-text';
        loadingDiv.style.background = 'rgba(0, 0, 0, 0.7)';
        loadingDiv.style.color = 'white';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.borderRadius = '10px';
        loadingDiv.style.fontFamily = 'Arial, sans-serif';
        loadingDiv.style.fontSize = '14px';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.minWidth = '200px';
        loadingDiv.textContent = 'Lade Modell...';
        overlayDiv.appendChild(loadingDiv);
        document.getElementById('model-viewer').appendChild(overlayDiv);

        // Timeout für den Ladevorgang
        const timeout = setTimeout(() => {
            console.log('Loading timeout reached');
            loadingDiv.innerHTML = '⚠️ Timeout beim Laden des Modells.<br>Bitte laden Sie die Seite neu.';
            loadingDiv.style.background = 'rgba(255, 150, 0, 0.9)';
            reject(new Error('Loading timeout'));
        }, 30000);

        loader.load(url, 
            function(gltf) {  // Success callback
                console.log('=== Model loaded successfully ===');
                clearTimeout(timeout);
                console.log('Model data:', gltf);
                if (model) {
                    console.log('Removing old model');
                    scene.remove(model);
                }
                model = gltf.scene;
                console.log('Adding new model to scene');
                scene.add(model);
                
                // Modell zentrieren und auf Boden setzen
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                console.log('Model dimensions:', {
                    size: size,
                    center: center,
                    boundingBox: {
                        min: box.min,
                        max: box.max
                    }
                });
                
                // Zentriere nur auf X und Z Achse, Y (Höhe) bleibt unverändert
                model.position.x = -center.x;
                model.position.z = -center.z;
                
                // Setze das Modell auf den Boden (Y=0)
                model.position.y = -box.min.y;
                
                // Aktualisiere Marker-Positionen relativ zum Modell
                markers.forEach(marker => {
                    marker.mesh.position.y += -box.min.y;
                });
                
                // Kamera-Position anpassen
                const maxDim = Math.max(size.x, size.y, size.z);
                camera.position.set(maxDim, maxDim / 2, maxDim);
                controls.target.set(0, 0, 0);
                controls.update();
                
                // Aktualisiere Hilfslinien basierend auf Modellgröße
                gridHelpers.update(scene, size);
                
                // Signalisiere, dass das Modell erfolgreich geladen wurde
                window.parent.postMessage({ type: 'modelLoaded', success: true }, '*');
                
                // Lade-Animation mit Fade-Out entfernen
                console.log('Starting fade-out animation');
                overlayDiv.style.transition = 'opacity 0.5s ease-out';
                overlayDiv.style.opacity = '0';
                setTimeout(() => {
                    console.log('Removing overlay');
                    overlayDiv.remove();
                    resolve(gltf);
                }, 500);
            },
            function(xhr) {  // Progress callback
                const percent = Math.floor(xhr.loaded / xhr.total * 100);
                const loaded_mb = xhr.loaded / (1024 * 1024);
                const total_mb = xhr.total / (1024 * 1024);
                console.log(`Loading progress: ${percent}% (${loaded_mb.toFixed(1)}MB / ${total_mb.toFixed(1)}MB)`);
                loadingDiv.innerHTML = `Lade Modell...<br>${percent}%<br>(${loaded_mb.toFixed(1)} MB / ${total_mb.toFixed(1)} MB)`;
            },
            function(error) {  // Error callback
                console.log('=== Error loading model ===');
                console.error('Error details:', error);
                clearTimeout(timeout);
                loadingDiv.innerHTML = `❌ Fehler beim Laden des Modells:<br>${error.message}`;
                loadingDiv.style.background = 'rgba(255, 0, 0, 0.9)';
                reject(error);
            }
        );
    });
}

// Fenster-Größenänderung
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 