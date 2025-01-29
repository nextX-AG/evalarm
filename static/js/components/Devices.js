export default {
    name: 'Devices',
    template: `
        <div class="devices">
            <div class="toolbar">
                <input v-model="searchQuery" placeholder="Gerät suchen..." class="search-input">
                <div class="view-controls">
                    <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">
                        Liste
                    </button>
                    <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">
                        Grid
                    </button>
                </div>
            </div>

            <div class="device-list" :class="viewMode">
                <div v-for="device in filteredDevices" 
                     :key="device.mac" 
                     class="device-card"
                     :class="{ offline: !device.online }">
                    <div class="device-header">
                        <h3>{{ device.name }}</h3>
                        <span class="status-indicator" :class="{ online: device.online }">
                            {{ device.online ? 'Online' : 'Offline' }}
                        </span>
                    </div>
                    <div class="device-details">
                        <p>MAC: {{ device.mac }}</p>
                        <p>Typ: {{ device.type }}</p>
                        <p>Batterie: {{ device.battery }}%</p>
                        <p>Letzter Kontakt: {{ formatDate(device.lastSeen) }}</p>
                    </div>
                    <div class="device-actions">
                        <button @click="showDetails(device)">Details</button>
                        <button @click="locateDevice(device)">Lokalisieren</button>
                    </div>
                </div>
            </div>

            <!-- Details Modal -->
            <div v-if="selectedDevice" class="modal">
                <div class="modal-content">
                    <h2>{{ selectedDevice.name }}</h2>
                    <!-- Detaillierte Geräteinformationen -->
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            devices: [],
            filteredDevices: [],
            searchQuery: '',
            filterStatus: 'all',
            viewMode: 'grid',
            selectedDevice: null,
            websocket: null
        }
    },
    computed: {
        filteredDevices() {
            return this.filteredDevices;
        }
    },
    methods: {
        async fetchDevices() {
            try {
                const response = await fetch('/api/devices');
                const data = await response.json();
                this.devices = Array.isArray(data) ? data : [];
                this.updateFilteredDevices();
            } catch (error) {
                console.error('Fehler beim Laden der Geräte:', error);
                this.devices = [];
                this.filteredDevices = [];
            }
        },
        updateFilteredDevices() {
            let filtered = [...this.devices];
            
            if (this.searchQuery) {
                filtered = filtered.filter(device => 
                    device.name.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
            
            if (this.filterStatus !== 'all') {
                filtered = filtered.filter(device => 
                    device.status === this.filterStatus
                );
            }
            
            this.filteredDevices = filtered;
        },
        formatDate(date) {
            return new Date(date).toLocaleString();
        },
        showDetails(device) {
            this.selectedDevice = device;
        },
        locateDevice(device) {
            this.$emit('locate-device', device);
        },
        setupWebSocket() {
            this.websocket = new WebSocket(`ws://${window.location.host}/ws`);
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'device_update') {
                    this.updateDevice(data.device);
                }
            };
        },
        updateDevice(updatedDevice) {
            const index = this.devices.findIndex(d => d.mac === updatedDevice.mac);
            if (index !== -1) {
                this.devices[index] = { ...this.devices[index], ...updatedDevice };
            }
        }
    },
    mounted() {
        this.fetchDevices();
        this.setupWebSocket();
    },
    beforeUnmount() {
        if (this.websocket) {
            this.websocket.close();
        }
    },
    watch: {
        searchQuery() {
            this.updateFilteredDevices();
        },
        filterStatus() {
            this.updateFilteredDevices();
        }
    }
} 