import { ref, onMounted } from 'vue';

export default {
    name: 'ObjectMarker',
    props: {
        floorplan: {
            type: String,
            required: true
        }
    },
    template: `
        <div class="object-marker">
            <div class="toolbar">
                <div class="drawing-tools">
                    <button @click="setTool('circle')" :class="{ active: currentTool === 'circle' }">
                        <i class="fas fa-circle"></i> Kreis
                    </button>
                    <button @click="setTool('rectangle')" :class="{ active: currentTool === 'rectangle' }">
                        <i class="fas fa-square"></i> Rechteck
                    </button>
                    <button @click="setTool('polygon')" :class="{ active: currentTool === 'polygon' }">
                        <i class="fas fa-draw-polygon"></i> Polygon
                    </button>
                </div>
                <div class="object-type">
                    <select v-model="selectedType">
                        <option value="window">Dachfenster</option>
                        <option value="door">Tür</option>
                        <option value="area">Bereich</option>
                    </select>
                </div>
                <div class="actions">
                    <button @click="cancelDrawing" v-if="isDrawing">Abbrechen</button>
                    <button @click="finishDrawing" v-if="isDrawing" class="primary">Fertig</button>
                </div>
            </div>

            <div class="canvas-container" ref="container">
                <canvas ref="canvas" 
                        @mousedown="startDrawing"
                        @mousemove="draw"
                        @mouseup="endDrawing"></canvas>
                
                <!-- Objekt-Details Popup -->
                <div v-if="showObjectDetails" class="object-details" :style="popupStyle">
                    <h3>{{ selectedObject.type }}</h3>
                    <div class="object-info">
                        <input v-model="selectedObject.name" placeholder="Objektname">
                        <div class="device-list">
                            <h4>Zugewiesene Geräte</h4>
                            <div v-for="device in selectedObject.devices" :key="device.id" class="device-item">
                                <i :class="getDeviceIcon(device.type)"></i>
                                {{ device.name }}
                                <button @click="removeDevice(device)" class="remove-device">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <button @click="showDeviceSelector = true" class="add-device">
                                <i class="fas fa-plus"></i> Gerät zuweisen
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="object-type-selector" v-if="selectedType === 'window'">
                <label>Fenstertyp:</label>
                <select v-model="windowType">
                    <option v-for="type in windowTypes" 
                            :key="type.id" 
                            :value="type.id">
                        {{ type.name }}
                    </option>
                </select>
            </div>

            <!-- Status-Anzeige für Fenster -->
            <div v-if="selectedObject?.type === 'window'" class="window-status">
                <div class="status-indicator" :class="getWindowStatus(selectedObject)">
                    <i class="fas" :class="'fa-' + (getWindowStatus(selectedObject) === 'closed' ? 'lock' : 'lock-open')"></i>
                    {{ getWindowStatusLabel(selectedObject) }}
                </div>
                <div class="sensor-list">
                    <div v-for="sensor in getWindowSensors(selectedObject)" 
                         :key="sensor.id"
                         class="sensor-item">
                        <i class="fas fa-microchip"></i>
                        {{ sensor.name }}
                        <span class="sensor-status" :class="sensor.state">
                            {{ sensor.state }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup(props) {
        const canvas = ref(null);
        const context = ref(null);
        const currentTool = ref('rectangle');
        const selectedType = ref('window');
        const isDrawing = ref(false);
        const startPoint = ref({ x: 0, y: 0 });
        const currentShape = ref(null);
        const shapes = ref([]);
        const selectedObject = ref(null);
        const showObjectDetails = ref(false);
        const windowType = ref('skylight');

        const windowTypes = [
            { id: 'skylight', name: 'Oberlicht', icon: 'window-maximize' },
            { id: 'window', name: 'Fenster', icon: 'window' }
        ];

        const getWindowStatus = (window) => {
            if (!window.devices?.length) return 'no-sensor';
            
            const sensors = window.devices.filter(d => d.type === 'contact_sensor');
            if (!sensors.length) return 'no-sensor';

            const states = sensors.map(s => s.state);
            if (states.every(s => s === 'closed')) return 'closed';
            if (states.every(s => s === 'open')) return 'open';
            return 'partial';
        };

        const getWindowStatusLabel = (window) => {
            const status = getWindowStatus(window);
            switch (status) {
                case 'closed':
                    return 'geschlossen';
                case 'open':
                    return 'offen';
                case 'partial':
                    return 'teilweise offen';
                case 'no-sensor':
                    return 'keine Sensoren';
                default:
                    return status;
            }
        };

        const getWindowSensors = (window) => {
            return window.devices.filter(d => d.type === 'contact_sensor');
        };

        onMounted(() => {
            const ctx = canvas.value.getContext('2d');
            context.value = ctx;
            loadFloorplan();
        });

        const loadFloorplan = () => {
            const img = new Image();
            img.onload = () => {
                canvas.value.width = img.width;
                canvas.value.height = img.height;
                context.value.drawImage(img, 0, 0);
                redrawShapes();
            };
            img.src = props.floorplan;
        };

        const startDrawing = (event) => {
            isDrawing.value = true;
            const rect = canvas.value.getBoundingClientRect();
            startPoint.value = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            currentShape.value = {
                type: currentTool.value,
                objectType: selectedType.value,
                points: [{ ...startPoint.value }],
                devices: []
            };
        };

        const draw = (event) => {
            if (!isDrawing.value) return;

            const rect = canvas.value.getBoundingClientRect();
            const currentPoint = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };

            if (currentTool.value === 'polygon') {
                currentShape.value.points.push(currentPoint);
            } else {
                currentShape.value.points = [
                    startPoint.value,
                    currentPoint
                ];
            }

            redrawShapes();
        };

        const endDrawing = () => {
            if (currentTool.value !== 'polygon') {
                finishShape();
            }
        };

        const finishShape = () => {
            isDrawing.value = false;
            if (currentShape.value) {
                shapes.value.push(currentShape.value);
                currentShape.value = null;
            }
            redrawShapes();
        };

        const redrawShapes = () => {
            context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
            loadFloorplan();

            // Zeichne alle gespeicherten Formen
            shapes.value.forEach(shape => drawShape(shape));

            // Zeichne aktuelle Form während des Zeichnens
            if (currentShape.value) {
                drawShape(currentShape.value, true);
            }
        };

        const drawShape = (shape, isDrawing = false) => {
            context.value.beginPath();
            context.value.strokeStyle = isDrawing ? '#ff0000' : '#00ff00';
            context.value.lineWidth = 2;

            if (shape.type === 'circle') {
                const radius = Math.sqrt(
                    Math.pow(shape.points[1].x - shape.points[0].x, 2) +
                    Math.pow(shape.points[1].y - shape.points[0].y, 2)
                );
                context.value.arc(
                    shape.points[0].x,
                    shape.points[0].y,
                    radius,
                    0,
                    2 * Math.PI
                );
            } else if (shape.type === 'rectangle') {
                const width = shape.points[1].x - shape.points[0].x;
                const height = shape.points[1].y - shape.points[0].y;
                context.value.rect(
                    shape.points[0].x,
                    shape.points[0].y,
                    width,
                    height
                );
            } else if (shape.type === 'polygon') {
                context.value.moveTo(shape.points[0].x, shape.points[0].y);
                shape.points.forEach(point => {
                    context.value.lineTo(point.x, point.y);
                });
                if (!isDrawing) {
                    context.value.closePath();
                }
            }

            context.value.stroke();
        };

        return {
            canvas,
            currentTool,
            selectedType,
            isDrawing,
            showObjectDetails,
            selectedObject,
            startDrawing,
            draw,
            endDrawing,
            cancelDrawing: () => {
                isDrawing.value = false;
                currentShape.value = null;
                redrawShapes();
            },
            finishDrawing: finishShape,
            windowType,
            windowTypes,
            getWindowStatus,
            getWindowStatusLabel,
            getWindowSensors
        };
    }
}; 