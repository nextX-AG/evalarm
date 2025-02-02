import Scene3D from './3d/Scene3D.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { ref, onMounted, shallowRef, watch } from 'vue';

export default {
    name: 'ModelViewer',
    components: {
        Scene3D
    },
    template: `
        <div class="model-viewer">
            <div class="controls">
                <div class="control-group">
                    <label>3D-Modell laden:</label>
                    <input type="file" @change="handleModelUpload" accept=".glb,.gltf" />
                </div>
                <div class="control-group">
                    <button @click="resetCamera" class="button">Reset Kamera</button>
                    <button @click="toggleGrid" class="button">
                        {{ showGrid ? 'Grid ausblenden' : 'Grid einblenden' }}
                    </button>
                    <button @click="togglePlacementMode" class="button" :class="{ active: placementMode }">
                        {{ placementMode ? 'Platzierung beenden' : 'Gerät platzieren' }}
                    </button>
                </div>
                <div v-if="placementMode" class="placement-controls">
                    <select v-model="selectedDeviceType">
                        <option value="button">Notfallknopf</option>
                        <option value="gateway">Gateway</option>
                        <option value="sensor">Sensor</option>
                    </select>
                    <input v-model="deviceName" placeholder="Gerätename" />
                </div>
                <div class="grid-settings">
                    <div class="setting-group">
                        <label>Position:</label>
                        <div class="position-inputs">
                            <input type="number" v-model.number="gridPosition.x" placeholder="X">
                            <input type="number" v-model.number="gridPosition.y" placeholder="Y">
                            <input type="number" v-model.number="gridPosition.z" placeholder="Z">
                        </div>
                        <div class="position-actions">
                            <button @click="centerModel">Modell zentrieren</button>
                            <button @click="alignToGrid">Am Grid ausrichten</button>
                        </div>
                    </div>
                    <div class="setting-group">
                        <label>Grid-Größe:</label>
                        <div class="grid-size-inputs">
                            <div class="input-group">
                                <label>Breite (X):</label>
                                <input type="number" 
                                       v-model.number="gridConfig.size" 
                                       step="10" 
                                       min="10"> m
                            </div>
                            <div class="input-group">
                                <label>Teilung:</label>
                                <input type="number" 
                                       v-model.number="gridConfig.divisions" 
                                       step="1" 
                                       min="1"> m
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Scene3D 
                ref="scene3dRef"
                @scene-ready="onSceneReady"
            />
        </div>
    `,
    setup() {
        const devices = ref([]);
        const showGrid = ref(true);
        const placementMode = ref(false);
        const selectedDeviceType = ref('button');
        const deviceName = ref('');
        const loading = ref(false);
        const scene3dRef = shallowRef(null);
        const currentModel = ref(null);
        const camera = ref(null);
        const renderer = ref(null);
        const controls = ref(null);
        const grid = ref(null);
        const raycaster = ref(null);
        const mouse = ref(null);
        const animationFrameId = ref(null);
        const cube = ref(null);
        let sceneData = null; // Speichert die Daten aus scene-ready

        // Nicht-reaktives Engine-Objekt
        const engine = {
            scene: null,
            camera: null,
            renderer: null,
            controls: null,
            currentModel: null,
            grid: null
        };

        // Modellposition als reactive ref
        const modelPosition = ref({ x: 0, y: 0, z: 0 });

        const gridConfig = ref({
            size: 200,
            divisions: 2
        });

        const gridPosition = ref({
            x: 0,
            y: 0,
            z: 0
        });

        const createBaseGrid = () => {
            if (engine.grid) {
                engine.scene.remove(engine.grid);
            }
            engine.grid = new THREE.GridHelper(
                gridConfig.value.size, 
                gridConfig.value.size / gridConfig.value.divisions
            );
            engine.scene.add(engine.grid);
        };

        const onSceneReady = ({ scene, camera, renderer, controls }) => {
            engine.scene = scene;
            engine.camera = camera;
            engine.renderer = renderer;
            engine.controls = controls;

            // Festes Grid erstellen
            createBaseGrid();
        };

        const updateModelPosition = () => {
            if (!engine.currentModel) return;
            
            engine.currentModel.position.set(
                modelPosition.value.x,
                modelPosition.value.y,
                modelPosition.value.z
            );
        };

        const centerModel = () => {
            if (!engine.currentModel) return;

            // Berechne Modell-Bounding Box
            const box = new THREE.Box3().setFromObject(engine.currentModel);
            const center = box.getCenter(new THREE.Vector3());

            // Setze Position auf 0,0,0
            modelPosition.value = { x: 0, y: 0, z: 0 };
            engine.currentModel.position.set(0, 0, 0);
        };

        const alignModelToGrid = () => {
            if (!engine.currentModel) return;

            // Berechne Modell-Bounding Box
            const box = new THREE.Box3().setFromObject(engine.currentModel);
            const size = box.getSize(new THREE.Vector3());

            // Setze Modell auf nächste Grid-Linie
            modelPosition.value = {
                x: Math.round(modelPosition.value.x),
                y: Math.round(modelPosition.value.y),
                z: Math.round(modelPosition.value.z)
            };
            updateModelPosition();
        };

        const loadModel = async (url) => {
            if (!engine.scene) return;
            
            try {
                loading.value = true;
                if (engine.currentModel) {
                    engine.scene.remove(engine.currentModel);
                }

                const loader = new GLTFLoader();
                const gltf = await loader.loadAsync(url);
                engine.currentModel = gltf.scene;

                // Modell initial auf 0,0,0 setzen
                modelPosition.value = { x: 0, y: 0, z: 0 };
                engine.currentModel.position.set(0, 0, 0);
                
                engine.scene.add(engine.currentModel);
                
                // Kamera ausrichten
                fitCameraToModel();

                console.log('Modell erfolgreich geladen');
            } catch (error) {
                console.error('Fehler beim Laden des Modells:', error);
            } finally {
                loading.value = false;
            }
        };

        const fitCameraToModel = () => {
            if (!engine.currentModel) return;

            const box = new THREE.Box3().setFromObject(engine.currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = engine.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
            
            engine.camera.position.set(
                center.x + cameraZ/2,
                center.y + cameraZ/2,
                center.z + cameraZ
            );
            engine.camera.lookAt(center);
            engine.controls.target.copy(center);
            engine.controls.update();
        };

        const handleModelUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('model', file);

            try {
                const response = await fetch('/api/upload-model', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error('Upload fehlgeschlagen');
                
                const data = await response.json();
                await loadModel(data.modelUrl);
            } catch (error) {
                console.error('Fehler beim Upload:', error);
                alert('Fehler beim Upload des Modells');
            }
        };

        const togglePlacementMode = () => {
            placementMode.value = !placementMode.value;
            controls.value.enabled = !placementMode.value;
        };

        const onMouseClick = (event) => {
            if (!placementMode.value) return;

            const rect = renderer.value.domElement.getBoundingClientRect();
            mouse.value.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.value.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.value.setFromCamera(mouse.value, camera.value);
            
            // Prüfe Intersection mit dem Modell
            const intersects = raycaster.value.intersectObject(scene3dRef.value.scene, true);

            if (intersects.length > 0) {
                const position = intersects[0].point;
                createDevice(position);
            }
        };

        const createDevice = async (position) => {
            const deviceData = {
                name: deviceName.value || `Neues ${selectedDeviceType.value}`,
                type: selectedDeviceType.value,
                location: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                }
            };

            try {
                const response = await fetch('/api/devices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(deviceData)
                });

                if (!response.ok) throw new Error('Fehler beim Erstellen des Geräts');

                const device = await response.json();
                devices.value.push(device);
                const marker = createDeviceMarker(device);
                scene3dRef.value.scene.add(marker);

                // Reset Placement Mode
                deviceName.value = '';
                placementMode.value = false;
                controls.value.enabled = true;
            } catch (error) {
                console.error('Fehler beim Erstellen des Geräts:', error);
                alert('Fehler beim Erstellen des Geräts');
            }
        };

        const createDeviceMarker = (device) => {
            const geometry = new THREE.SphereGeometry(0.2, 32, 32);
            const material = new THREE.MeshBasicMaterial({ 
                color: device.online ? 0x2ecc71 : 0xe74c3c 
            });
            const marker = new THREE.Mesh(geometry, material);
            
            // Position aus Device-Daten
            const position = JSON.parse(device.location);
            marker.position.set(position.x, position.y, position.z);
            
            // Speichere Device-Info am Marker
            marker.userData.device = device;
            
            return marker;
        };

        const updateDeviceMarkers = () => {
            // Entferne alte Marker
            scene3dRef.value.scene.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.userData.device) {
                    scene3dRef.value.scene.remove(child);
                }
            });

            // Erstelle neue Marker
            devices.value.forEach(device => {
                const marker = createDeviceMarker(device);
                scene3dRef.value.scene.add(marker);
            });
        };

        const showDeviceInfo = (device) => {
            // Hier können wir ein Modal oder Popup mit Device-Info anzeigen
            console.log('Device Info:', device);
        };

        const switchFloor = async (event) => {
            await loadFloorModel(event.target.value);
            updateDeviceMarkers();
        };

        const toggleMarkers = () => {
            // Implementieren Sie die Logik zum Ein- oder Ausblenden der Marker
        };

        const resetCamera = () => {
            if (camera.value && controls.value) {
                camera.value.position.set(5, 5, 5);
                camera.value.lookAt(0, 0, 0);
                controls.value.reset();
            }
        };

        const toggleGrid = () => {
            if (grid.value) {
                showGrid.value = !showGrid.value;
                grid.value.visible = showGrid.value;
            }
        };

        const onWindowResize = () => {
            camera.value.aspect = renderer.value.domElement.clientWidth / renderer.value.domElement.clientHeight;
            camera.value.updateProjectionMatrix();
            renderer.value.setSize(
                renderer.value.domElement.clientWidth,
                renderer.value.domElement.clientHeight
            );
        };

        const loadDevices = async () => {
            try {
                const response = await fetch('/api/devices');
                const data = await response.json();
                devices.value = Array.isArray(data) ? data : [];
            } catch (error) {
                console.error('Fehler beim Laden der Geräte:', error);
                devices.value = [];
            }
        };

        const animate = () => {
            requestAnimationFrame(animate.bind(this));
            
            if (cube.value) {
                cube.value.rotation.x += 0.01;
                cube.value.rotation.y += 0.01;
            }
            
            renderer.value.render(scene3dRef.value.scene, camera.value);
        };

        const updateGrid = () => {
            if (!engine.grid) return;
            
            engine.scene.remove(engine.grid);
            engine.grid = new THREE.GridHelper(
                gridConfig.value.size,
                gridConfig.value.size / gridConfig.value.divisions
            );
            engine.scene.add(engine.grid);
        };

        watch([() => gridConfig.value.size, () => gridConfig.value.divisions], updateGrid);

        // CSS für die neuen Controls
        const style = document.createElement('style');
        style.textContent = `
            .model-transform-controls {
                padding: 10px;
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
                margin-top: 10px;
            }
            .position-control {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            .axis-inputs {
                display: flex;
                gap: 5px;
            }
            .axis-inputs input {
                width: 80px;
                padding: 5px;
            }
            .grid-controls {
                padding: 10px;
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
                margin-top: 10px;
            }
            .grid-size-inputs {
                display: flex;
                gap: 20px;
                margin-top: 5px;
            }
            .input-group {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .input-group input {
                width: 60px;
                padding: 3px;
                margin: 0 5px;
            }
        `;
        document.head.appendChild(style);

        onMounted(() => {
            scene3dRef.value = document.querySelector('.scene3d-container');
            loadDevices();
            window.addEventListener('resize', onWindowResize);
        });

        return {
            devices,
            showGrid,
            placementMode,
            selectedDeviceType,
            deviceName,
            loading,
            scene3dRef,
            onSceneReady,
            handleModelUpload,
            togglePlacementMode,
            onMouseClick,
            createDevice,
            createDeviceMarker,
            updateDeviceMarkers,
            showDeviceInfo,
            switchFloor,
            toggleMarkers,
            resetCamera,
            toggleGrid,
            onWindowResize,
            loadDevices,
            animate,
            modelPosition,
            updateModelPosition,
            centerModel,
            alignModelToGrid,
            gridConfig,
            gridPosition,
            updateGrid
        };
    },
    beforeUnmount() {
        if (animationFrameId.value) {
            cancelAnimationFrame(animationFrameId.value);
        }
        if (renderer.value) {
            renderer.value.domElement.removeEventListener('click', onMouseClick);
            renderer.value.dispose();
        }
        if (controls.value) {
            controls.value.dispose();
        }
        window.removeEventListener('resize', onWindowResize);
    }
} 