import { ref, onMounted } from 'vue';

export default {
    name: 'AssetManager',
    template: `
        <div class="content-page">
            <!-- Gebäude-Übersicht -->
            <div class="buildings-grid">
                <div v-for="building in buildings" 
                     :key="building.id" 
                     class="building-card"
                     @click="selectBuilding(building)">
                    <h3>{{ building.name }}</h3>
                    <div class="skylight-stats">
                        <div class="stat">
                            <i class="fas fa-window-maximize"></i>
                            <div class="stat-info">
                                <div class="stat-value">{{ building.skylights.length }}</div>
                                <div class="stat-label">Oberlichter</div>
                            </div>
                        </div>
                        <div class="stat" :class="{ warning: hasOpenSkylights(building) }">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="stat-info">
                                <div class="stat-value">{{ getOpenSkylights(building) }}</div>
                                <div class="stat-label">Offen</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gebäude-Details -->
            <div v-if="selectedBuilding" class="building-detail">
                <div class="detail-header">
                    <button @click="selectedBuilding = null" class="back-button">
                        <i class="fas fa-arrow-left"></i> Zurück zur Übersicht
                    </button>
                    <h2>{{ selectedBuilding.name }}</h2>
                    <div class="header-stats">
                        <div class="header-stat">
                            {{ getOpenSkylights(selectedBuilding) }} von {{ selectedBuilding.skylights.length }} Oberlichter offen
                        </div>
                    </div>
                </div>
                
                <div class="skylights-grid">
                    <div v-for="skylight in selectedBuilding.skylights"
                         :key="skylight.id"
                         class="skylight-card"
                         :class="skylight.status">
                        <div class="skylight-header">
                            <h4>{{ skylight.name }}</h4>
                            <span class="status-badge">
                                <i :class="getStatusIcon(skylight.status)"></i>
                                {{ formatStatus(skylight.status) }}
                            </span>
                        </div>
                        <div class="skylight-sensors">
                            <div v-for="sensor in skylight.sensors"
                                 :key="sensor.id"
                                 class="sensor-status"
                                 :class="sensor.status">
                                <div class="sensor-main">
                                    <i :class="getSensorIcon(sensor.type)"></i>
                                    <span>{{ formatSensorStatus(sensor) }}</span>
                                </div>
                                <div class="sensor-metrics">
                                    <div class="metric" :class="getBatteryClass(sensor.battery)">
                                        <i class="fas fa-battery-three-quarters"></i>
                                        {{ sensor.battery }}%
                                    </div>
                                    <div class="metric" :class="getSignalClass(sensor.signal)">
                                        <i class="fas fa-signal"></i>
                                        {{ sensor.signal }}%
                                    </div>
                                    <div class="metric time">
                                        <i class="fas fa-clock"></i>
                                        {{ formatLastUpdate(sensor.lastUpdate) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const buildings = ref([]);
        const selectedBuilding = ref(null);

        onMounted(async () => {
            try {
                const response = await fetch('/api/buildings');
                buildings.value = await response.json();
            } catch (error) {
                console.error('Fehler beim Laden der Gebäude:', error);
            }
        });

        const getOpenSkylights = (building) => {
            return building.skylights.filter(s => s.status === 'open').length;
        };

        const formatStatus = (status) => {
            return status === 'open' ? 'Geöffnet' : 'Geschlossen';
        };

        const getStatusIcon = (status) => {
            return status === 'open' ? 'fas fa-lock-open' : 'fas fa-lock';
        };

        const getSensorIcon = (type) => {
            const icons = {
                'contact': 'fas fa-plug',
                'temperature': 'fas fa-thermometer-half',
                'humidity': 'fas fa-tint'
            };
            return icons[type] || 'fas fa-microchip';
        };

        const formatSensorStatus = (sensor) => {
            if (sensor.value) {
                return `${sensor.type}: ${sensor.value}`;
            }
            return `${sensor.type}: ${sensor.status}`;
        };

        const getBatteryClass = (level) => {
            if (!level) return '';
            if (level <= 20) return 'danger';
            if (level <= 40) return 'warning';
            return '';
        };

        const getSignalClass = (level) => {
            if (!level) return '';
            if (level <= 60) return 'danger';
            if (level <= 80) return 'warning';
            return '';
        };

        const formatLastUpdate = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            return date.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        };

        const hasOpenSkylights = (building) => {
            return getOpenSkylights(building) > 0;
        };

        return {
            buildings,
            selectedBuilding,
            getOpenSkylights,
            selectBuilding: (building) => selectedBuilding.value = building,
            formatStatus,
            getStatusIcon,
            getSensorIcon,
            formatSensorStatus,
            hasOpenSkylights,
            getBatteryClass,
            getSignalClass,
            formatLastUpdate
        };
    }
}; 