export default {
    name: 'Alarms',
    template: `
        <div class="alarms">
            <div class="alarm-filters">
                <div class="filter-group">
                    <label>Priorität</label>
                    <select v-model="filters.priority">
                        <option value="">Alle</option>
                        <option value="high">Hoch</option>
                        <option value="medium">Mittel</option>
                        <option value="low">Niedrig</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status</label>
                    <select v-model="filters.status">
                        <option value="">Alle</option>
                        <option value="active">Aktiv</option>
                        <option value="acknowledged">Bestätigt</option>
                        <option value="resolved">Gelöst</option>
                    </select>
                </div>
                <div class="date-range">
                    <input type="date" v-model="filters.startDate">
                    <input type="date" v-model="filters.endDate">
                </div>
            </div>

            <div class="alarm-list">
                <div v-for="alarm in filteredAlarms" 
                     :key="alarm.id" 
                     class="alarm-card"
                     :class="alarm.priority">
                    <div class="alarm-header">
                        <span class="alarm-time">{{ formatDate(alarm.timestamp) }}</span>
                        <span class="alarm-priority">{{ alarm.priority }}</span>
                    </div>
                    <div class="alarm-content">
                        <h3>{{ alarm.title }}</h3>
                        <p>{{ alarm.description }}</p>
                        <div class="alarm-details">
                            <p>Gerät: {{ alarm.device.name }}</p>
                            <p>Standort: {{ alarm.location }}</p>
                        </div>
                    </div>
                    <div class="alarm-actions">
                        <button v-if="alarm.status === 'active'"
                                @click="acknowledgeAlarm(alarm.id)"
                                class="btn-acknowledge">
                            Bestätigen
                        </button>
                        <button v-if="alarm.status !== 'resolved'"
                                @click="resolveAlarm(alarm.id)"
                                class="btn-resolve">
                            Lösen
                        </button>
                        <button @click="showDetails(alarm)"
                                class="btn-details">
                            Details
                        </button>
                    </div>
                </div>
            </div>

            <!-- Details Modal -->
            <div v-if="selectedAlarm" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Alarm Details</h2>
                        <button @click="selectedAlarm = null" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="alarm-timeline">
                            <div v-for="event in selectedAlarm.timeline" 
                                 :key="event.timestamp" 
                                 class="timeline-event">
                                <span class="time">{{ formatDate(event.timestamp) }}</span>
                                <span class="event">{{ event.description }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            alarms: [],
            filteredAlarms: [],
            searchQuery: '',
            filterPriority: 'all',
            selectedAlarm: null,
            filters: {
                priority: '',
                status: '',
                startDate: '',
                endDate: ''
            },
            websocket: null
        }
    },
    computed: {
        filteredAlarms() {
            return this.alarms.filter(alarm => {
                if (this.filters.priority && alarm.priority !== this.filters.priority) return false;
                if (this.filters.status && alarm.status !== this.filters.status) return false;
                if (this.filters.startDate && new Date(alarm.timestamp) < new Date(this.filters.startDate)) return false;
                if (this.filters.endDate && new Date(alarm.timestamp) > new Date(this.filters.endDate)) return false;
                return true;
            });
        }
    },
    methods: {
        async fetchAlarms() {
            try {
                const response = await fetch('/api/alarms');
                const data = await response.json();
                this.alarms = Array.isArray(data) ? data : [];
                this.updateFilteredAlarms();
            } catch (error) {
                console.error('Fehler beim Laden der Alarme:', error);
                this.alarms = [];
                this.filteredAlarms = [];
            }
        },
        updateFilteredAlarms() {
            let filtered = [...this.alarms];
            
            if (this.searchQuery) {
                filtered = filtered.filter(alarm => 
                    alarm.title.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
            
            if (this.filterPriority !== 'all') {
                filtered = filtered.filter(alarm => 
                    alarm.priority === this.filterPriority
                );
            }
            
            this.filteredAlarms = filtered;
        },
        formatDate(date) {
            return new Date(date).toLocaleString();
        },
        async acknowledgeAlarm(alarmId) {
            try {
                await fetch(`/api/alarms/${alarmId}/acknowledge`, { method: 'POST' });
                this.fetchAlarms();
            } catch (error) {
                console.error('Fehler beim Bestätigen des Alarms:', error);
            }
        },
        async resolveAlarm(alarmId) {
            try {
                await fetch(`/api/alarms/${alarmId}/resolve`, { method: 'POST' });
                this.fetchAlarms();
            } catch (error) {
                console.error('Fehler beim Lösen des Alarms:', error);
            }
        },
        showDetails(alarm) {
            this.selectedAlarm = alarm;
        },
        setupWebSocket() {
            this.websocket = new WebSocket(`ws://${window.location.host}/ws`);
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'new_alarm') {
                    this.alarms.unshift(data.alarm);
                } else if (data.type === 'alarm_update') {
                    this.updateAlarm(data.alarm);
                }
            };
        },
        updateAlarm(updatedAlarm) {
            const index = this.alarms.findIndex(a => a.id === updatedAlarm.id);
            if (index !== -1) {
                this.alarms[index] = { ...this.alarms[index], ...updatedAlarm };
            }
        }
    },
    mounted() {
        this.fetchAlarms();
        this.setupWebSocket();
        // Aktualisiere alle 30 Sekunden
        this.updateInterval = setInterval(this.fetchAlarms, 30000);
    },
    beforeUnmount() {
        if (this.websocket) {
            this.websocket.close();
        }
        // Cleanup interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    },
    watch: {
        searchQuery() {
            this.updateFilteredAlarms();
        },
        filterPriority() {
            this.updateFilteredAlarms();
        }
    }
} 