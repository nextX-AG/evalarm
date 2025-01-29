import { ref, computed, onMounted, watch } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';
import Scene3D from './3d/Scene3D.js';

export default {
    name: 'AssetViewer',
    components: {
        Scene3D
    },
    template: `
        <div class="asset-viewer">
            <div class="viewer-header">
                <div class="view-controls">
                    <button @click="viewMode = '2d'" 
                            :class="{ active: viewMode === '2d' }">
                        <i class="fas fa-map"></i> 2D
                    </button>
                    <button @click="viewMode = '3d'" 
                            :class="{ active: viewMode === '3d' }">
                        <i class="fas fa-cube"></i> 3D
                    </button>
                </div>
                <div class="viewer-actions">
                    <button @click="resetView" class="button">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button @click="toggleFullscreen" class="button">
                        <i :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
                    </button>
                </div>
            </div>

            <div class="viewer-content" :class="viewMode">
                <!-- 3D View -->
                <div v-show="viewMode === '3d'" class="view-3d">
                    <Scene3D 
                        ref="scene3d"
                        @scene-ready="onSceneReady"
                        :model-url="currentAsset?.model3d"
                    />
                    <div class="overlay-controls">
                        <div class="camera-controls">
                            <button @click="rotateCamera('left')">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <button @click="rotateCamera('up')">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button @click="rotateCamera('down')">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button @click="rotateCamera('right')">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                        <div class="zoom-controls">
                            <button @click="zoom(1)">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button @click="zoom(-1)">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 2D View -->
                <div v-show="viewMode === '2d'" class="view-2d">
                    <div class="floor-plan">
                        <img v-if="currentAsset?.floorPlan" 
                             :src="currentAsset.floorPlan" 
                             @load="initializeFloorPlan">
                        <div v-for="device in activeDevices" 
                             :key="device.id"
                             class="device-marker"
                             :class="device.type"
                             :style="getDevicePosition(device)"
                             @click="selectDevice(device)">
                            <i :class="getDeviceIcon(device.type)"></i>
                            <div class="device-tooltip">
                                {{ device.name }}
                                <div class="device-status" 
                                     :class="getStatusClass(device)">
                                    {{ device.status.state }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Device Details Sidebar -->
            <div v-if="selectedDevice" class="device-details">
                <div class="details-header">
                    <h3>{{ selectedDevice.name }}</h3>
                    <button @click="selectedDevice = null">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="details-content">
                    <div class="detail-group">
                        <label>Status</label>
                        <div class="status-badge" 
                             :class="getStatusClass(selectedDevice)">
                            {{ selectedDevice.status.state }}
                        </div>
                    </div>
                    <div class="detail-group">
                        <label>Typ</label>
                        <span>{{ selectedDevice.type }}</span>
                    </div>
                    <div class="detail-group">
                        <label>Letzte Aktualisierung</label>
                        <span>{{ formatDate(selectedDevice.status.lastUpdate) }}</span>
                    </div>
                    <!-- Weitere Gerätedetails -->
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = useAssetStore();
        const viewMode = ref('3d');
        const scene3d = ref(null);
        const selectedDevice = ref(null);
        const isFullscreen = ref(false);

        const currentAsset = computed(() => store.currentAsset.value);
        
        const activeDevices = computed(() => {
            if (!currentAsset.value) return [];
            return currentAsset.value.devices.filter(device => 
                device.position && device.position.x && device.position.y
            );
        });

        // 3D View Handlers
        const onSceneReady = ({ scene, camera, controls }) => {
            // Scene setup
        };

        const rotateCamera = (direction) => {
            if (!scene3d.value) return;
            // Camera rotation implementation
        };

        const zoom = (factor) => {
            if (!scene3d.value) return;
            // Zoom implementation
        };

        // 2D View Handlers
        const getDevicePosition = (device) => {
            return {
                left: `${device.position.x}%`,
                top: `${device.position.y}%`
            };
        };

        const getDeviceIcon = (type) => {
            const icons = {
                'emergency_button': 'fa-exclamation-circle',
                'sensor': 'fa-thermometer-half',
                'gateway': 'fa-wifi'
            };
            return `fas ${icons[type] || 'fa-microchip'}`;
        };

        const getStatusClass = (device) => {
            return `status-${device.status.state.toLowerCase()}`;
        };

        // Utility Functions
        const formatDate = (date) => {
            return new Date(date).toLocaleString();
        };

        const toggleFullscreen = () => {
            // Fullscreen implementation
        };

        return {
            viewMode,
            scene3d,
            currentAsset,
            activeDevices,
            selectedDevice,
            isFullscreen,
            onSceneReady,
            rotateCamera,
            zoom,
            getDevicePosition,
            getDeviceIcon,
            getStatusClass,
            formatDate,
            toggleFullscreen,
            selectDevice: (device) => selectedDevice.value = device
        };
    }
}; 