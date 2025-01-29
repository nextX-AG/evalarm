import { ref, computed } from 'vue';
import { AssetStatus } from '../types/Asset.js';
import { useAssetStore } from '../stores/assetStore.js';
import ModelViewer from './ModelViewer.js';
import ObjectMarker from './ObjectMarker.js';

export default {
    name: 'AssetDetail',
    components: {
        ModelViewer,
        ObjectMarker
    },
    props: {
        assetId: {
            type: Number,
            required: true
        }
    },
    template: `
        <div class="asset-detail">
            <div class="asset-header">
                <div class="asset-title">
                    <h2>{{ asset.name }}</h2>
                    <div class="asset-badges">
                        <span class="badge" :class="asset.status.state">
                            {{ asset.status.state }}
                        </span>
                        <span class="badge type">
                            {{ getAssetTypeLabel(asset.type) }}
                        </span>
                    </div>
                </div>
                <div class="asset-actions">
                    <button @click="editMode = !editMode" class="button">
                        <i class="fas" :class="editMode ? 'fa-eye' : 'fa-edit'"></i>
                        {{ editMode ? 'Ansicht' : 'Bearbeiten' }}
                    </button>
                    <button @click="addDevice" class="button primary">
                        <i class="fas fa-plus"></i> Gerät hinzufügen
                    </button>
                </div>
            </div>

            <div class="asset-content">
                <!-- Visualisierung (2D/3D) -->
                <div class="asset-visualization">
                    <div class="view-toggle">
                        <button @click="currentView = '2d'" :class="{ active: currentView === '2d' }">
                            2D-Ansicht
                        </button>
                        <button @click="currentView = '3d'" :class="{ active: currentView === '3d' }"
                                :disabled="!asset.model3d">
                            3D-Ansicht
                        </button>
                    </div>
                    
                    <!-- 2D-Ansicht mit ObjectMarker -->
                    <div v-if="currentView === '2d'" class="view-2d">
                        <object-marker 
                            v-if="editMode"
                            :floorplan="asset.floorplan"
                            @object-created="onObjectCreated"
                            @object-selected="onObjectSelected"
                        />
                        <div v-else class="floorplan-view">
                            <img :src="asset.floorplan" alt="Grundriss">
                            <div v-for="object in asset.objects" 
                                 :key="object.id"
                                 class="object-overlay"
                                 :class="[object.type, getObjectStatus(object)]"
                                 :style="getObjectStyle(object)"
                                 @click="showObjectDetails(object)">
                                <i :class="getObjectIcon(object)"></i>
                                <div class="object-tooltip">
                                    {{ object.name }}
                                    <div class="device-status" v-if="object.devices.length">
                                        {{ getDevicesSummary(object) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3D-Ansicht -->
                    <model-viewer 
                        v-else-if="currentView === '3d'"
                        :model-url="asset.model3d"
                        :markers="objectMarkers"
                        @marker-click="onMarkerClick"
                    />
                </div>

                <!-- Objekt- und Geräteliste -->
                <div class="asset-sidebar">
                    <div class="section-header">
                        <h3>Objekte und Geräte</h3>
                        <div class="view-options">
                            <button @click="sidebarView = 'objects'" :class="{ active: sidebarView === 'objects' }">
                                <i class="fas fa-shapes"></i>
                            </button>
                            <button @click="sidebarView = 'devices'" :class="{ active: sidebarView === 'devices' }">
                                <i class="fas fa-microchip"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Objektliste -->
                    <div v-if="sidebarView === 'objects'" class="object-list">
                        <div v-for="object in asset.objects" 
                             :key="object.id"
                             class="object-item"
                             :class="{ selected: selectedObject?.id === object.id }"
                             @click="selectObject(object)">
                            <i :class="getObjectIcon(object)"></i>
                            <div class="object-info">
                                <span class="object-name">{{ object.name }}</span>
                                <span class="object-type">{{ object.type }}</span>
                            </div>
                            <div class="object-devices">
                                {{ object.devices.length }} Geräte
                            </div>
                        </div>
                    </div>

                    <!-- Geräteliste -->
                    <div v-else class="device-list">
                        <h3>Verbundene Geräte</h3>
                        <div class="device-grid">
                            <div v-for="device in connectedDevices" 
                                 :key="device.id"
                                 class="device-card"
                                 :class="device.status.state">
                                <div class="device-icon">
                                    <i :class="getDeviceIcon(device.type)"></i>
                                </div>
                                <div class="device-info">
                                    <h4>{{ device.name }}</h4>
                                    <div class="device-meta">
                                        <span class="device-type">{{ device.type }}</span>
                                        <span class="device-protocol">{{ device.protocol }}</span>
                                    </div>
                                    <div class="device-metrics">
                                        <div v-for="(value, key) in device.metrics" 
                                             :key="key"
                                             class="metric">
                                            <i :class="getMetricIcon(key)"></i>
                                            {{ formatMetric(key, value) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup(props) {
        const statusClass = computed(() => {
            return `status-${props.asset.status.state.toLowerCase()}`;
        });

        const healthPercent = computed(() => {
            return props.asset.status.health;
        });

        const maintenanceClass = computed(() => {
            if (!props.asset.nextMaintenance) return '';
            const daysUntil = Math.floor((new Date(props.asset.nextMaintenance) - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntil < 7 ? 'warning' : daysUntil < 0 ? 'danger' : '';
        });

        // ... weitere Methoden

        return {
            statusClass,
            healthPercent,
            maintenanceClass,
            formatDate: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
            getDocIcon: (type) => {
                const icons = {
                    pdf: 'fas fa-file-pdf',
                    doc: 'fas fa-file-word',
                    image: 'fas fa-file-image'
                };
                return icons[type] || 'fas fa-file';
            },
            getAssetTypeLabel: (type) => {
                // Implement the logic to get a label based on the asset type
                return type;
            },
            getDeviceIcon: (type) => {
                // Implement the logic to get a device icon based on the device type
                return 'fas fa-device';
            },
            formatMetric: (key, value) => {
                // Implement the logic to format a metric based on its key and value
                return value;
            }
        };
    }
}; 