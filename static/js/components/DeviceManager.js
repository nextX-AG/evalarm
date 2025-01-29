import { ref, computed, onMounted } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';
import { AssetType, AssetStatus } from '../types/Asset.js';

export default {
    name: 'DeviceManager',
    template: `
        <div class="content-page">
            <div class="page-header">
                <div class="header-left">
                    <h2>Geräte</h2>
                    <div class="view-toggle">
                        <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">
                            <i class="fas fa-th-large"></i>
                        </button>
                        <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                </div>
                <div class="header-right">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" v-model="searchQuery" placeholder="Geräte suchen...">
                    </div>
                    <button @click="addDevice" class="button primary">
                        <i class="fas fa-plus"></i> Neues Gerät
                    </button>
                </div>
            </div>
            
            <div class="page-content">
                <div class="device-grid">
                    <div v-for="device in filteredDevices" 
                         :key="device.id"
                         class="device-card"
                         :class="device.type">
                        <div class="device-header">
                            <i :class="getDeviceIcon(device.type)"></i>
                            <div class="status-indicator" :class="device.status.state"></div>
                        </div>
                        <div class="device-content">
                            <h3>{{ device.name }}</h3>
                            <div class="device-location">
                                <i class="fas fa-map-marker-alt"></i>
                                {{ getAssetName(device.assetId) }}
                            </div>
                            <div class="device-metrics">
                                <div v-if="device.metrics.battery" class="metric">
                                    <i class="fas fa-battery-three-quarters"></i>
                                    {{ device.metrics.battery }}%
                                </div>
                                <div class="metric">
                                    <i class="fas fa-signal"></i>
                                    {{ device.metrics.signal }}%
                                </div>
                            </div>
                        </div>
                        <div class="device-footer">
                            <span class="last-update">
                                Aktualisiert: {{ formatDate(device.lastUpdate) }}
                            </span>
                            <div class="device-actions">
                                <button @click="editDevice(device)">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button @click="showDetails(device)">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = useAssetStore();
        const viewMode = ref('grid');
        const searchQuery = ref('');
        const devices = ref([]);

        // Fetch devices
        const fetchDevices = async () => {
            try {
                const response = await fetch('/api/devices');
                const data = await response.json();
                devices.value = data;
            } catch (error) {
                console.error('Fehler beim Laden der Geräte:', error);
            }
        };

        // Load devices on mount
        onMounted(fetchDevices);

        // Computed
        const filteredDevices = computed(() => {
            return devices.value.filter(device => {
                if (searchQuery.value) {
                    const query = searchQuery.value.toLowerCase();
                    return device.name.toLowerCase().includes(query);
                }
                return true;
            });
        });

        // Helper functions
        const getDeviceIcon = (type) => {
            const icons = {
                'sensor': 'fas fa-thermometer-half',
                'emergency_button': 'fas fa-exclamation-circle',
                'gateway': 'fas fa-wifi'
            };
            return icons[type] || 'fas fa-microchip';
        };

        const getAssetName = (assetId) => {
            const asset = store.assets.value.find(a => a.id === assetId);
            return asset ? asset.name : 'Unbekannt';
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString('de-DE');
        };

        return {
            viewMode,
            searchQuery,
            filteredDevices,
            getDeviceIcon,
            getAssetName,
            formatDate
        };
    }
}; 