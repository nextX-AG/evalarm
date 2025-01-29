import Scene3D from './3d/Scene3D.js';

export default {
    name: 'Dashboard',
    components: {
        Scene3D
    },
    template: `
        <div class="dashboard">
            <div class="overview-3d">
                <Scene3D 
                    ref="overview3d"
                    @scene-ready="onSceneReady"
                    :controls="false"
                />
            </div>
            <div class="metrics-grid">
                <div v-for="metric in metrics" :key="metric.id" class="metric-card">
                    <h3>{{ metric.title }}</h3>
                    <div class="metric-value">{{ metric.value }}</div>
                    <div class="metric-change" :class="metric.trend">
                        {{ metric.change }}
                    </div>
                </div>
            </div>
            <div class="active-alarms">
                <h2>Aktive Alarme</h2>
                <div v-if="activeAlarms.length === 0" class="no-alarms">
                    Keine aktiven Alarme
                </div>
                <div v-else class="alarm-list">
                    <div v-for="alarm in activeAlarms" 
                         :key="alarm.id" 
                         class="alarm-item"
                         :class="alarm.priority">
                        <div class="alarm-time">{{ formatTime(alarm.timestamp) }}</div>
                        <div class="alarm-title">{{ alarm.title }}</div>
                        <div class="alarm-location">{{ alarm.location }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            metrics: [
                { id: 1, title: 'Aktive Geräte', value: '24', change: '+2', trend: 'positive' },
                { id: 2, title: 'Online', value: '22', change: '92%', trend: 'neutral' },
                { id: 3, title: 'Aktive Alarme', value: '3', change: '+1', trend: 'negative' },
                { id: 4, title: 'Batterie kritisch', value: '2', change: '-1', trend: 'positive' }
            ],
            activeAlarms: []
        }
    },
    methods: {
        formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString();
        },
        async fetchAlarms() {
            try {
                const response = await fetch('/api/alarms');
                const data = await response.json();
                // Sicherstellen, dass data ein Array ist
                this.activeAlarms = Array.isArray(data) ? 
                    data.filter(alarm => alarm.status === 'active') : [];
            } catch (error) {
                console.error('Fehler beim Laden der Alarme:', error);
                this.activeAlarms = [];
            }
        },
        onSceneReady({ scene, camera }) {
            // Hier Overview-spezifische 3D-Logik
        }
    },
    mounted() {
        this.fetchAlarms();
        // Aktualisiere alle 30 Sekunden
        setInterval(this.fetchAlarms, 30000);
    }
} 