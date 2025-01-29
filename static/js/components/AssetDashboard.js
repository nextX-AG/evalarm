import { ref, computed, onMounted } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';
import { AssetType, AssetStatus } from '../types/Asset.js';

export default {
    name: 'AssetDashboard',
    template: `
        <div class="asset-dashboard">
            <!-- KPI Overview -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="kpi-content">
                        <h3>Gebäude</h3>
                        <div class="kpi-value">{{ buildingCount }}</div>
                        <div class="kpi-trend" :class="{ positive: buildingTrend > 0 }">
                            <i :class="buildingTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'" class="fas"></i>
                            {{ Math.abs(buildingTrend) }}%
                        </div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="kpi-content">
                        <h3>Kritische Assets</h3>
                        <div class="kpi-value">{{ criticalAssets.length }}</div>
                        <div class="kpi-list">
                            <span v-for="asset in criticalAssets.slice(0,3)" 
                                  :key="asset.id"
                                  class="critical-item">
                                {{ asset.name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="kpi-content">
                        <h3>Systemstatus</h3>
                        <div class="kpi-value">{{ systemHealth }}%</div>
                        <div class="health-bar">
                            <div class="health-fill" :style="{ width: systemHealth + '%' }"></div>
                        </div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon info">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="kpi-content">
                        <h3>Nächste Wartungen</h3>
                        <div class="maintenance-list">
                            <div v-for="task in upcomingMaintenance" 
                                 :key="task.id"
                                 class="maintenance-item">
                                <span class="maintenance-date">
                                    {{ formatDate(task.date) }}
                                </span>
                                <span class="maintenance-asset">
                                    {{ task.asset.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Asset Status Overview -->
            <div class="status-overview">
                <h2>Asset Status Übersicht</h2>
                <div class="status-grid">
                    <div v-for="status in assetStatusSummary" 
                         :key="status.state"
                         class="status-card"
                         :class="status.state.toLowerCase()">
                        <div class="status-icon">
                            <i :class="getStatusIcon(status.state)"></i>
                        </div>
                        <div class="status-info">
                            <h4>{{ status.state }}</h4>
                            <div class="status-count">{{ status.count }} Assets</div>
                        </div>
                        <div class="status-percentage">
                            {{ status.percentage }}%
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="recent-activity">
                <h2>Letzte Aktivitäten</h2>
                <div class="activity-list">
                    <div v-for="activity in recentActivities" 
                         :key="activity.id"
                         class="activity-item"
                         :class="activity.type">
                        <div class="activity-icon">
                            <i :class="getActivityIcon(activity.type)"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-header">
                                <span class="activity-asset">{{ activity.asset.name }}</span>
                                <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
                            </div>
                            <p class="activity-description">{{ activity.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = useAssetStore();
        const recentActivities = ref([]);

        // Computed Properties
        const buildingCount = computed(() => 
            store.assets.value.filter(a => a.type === AssetType.BUILDING).length
        );

        const criticalAssets = computed(() => 
            store.assets.value.filter(a => a.status.state === AssetStatus.CRITICAL)
        );

        const systemHealth = computed(() => {
            const assets = store.assets.value;
            if (!assets.length) return 100;
            
            const totalHealth = assets.reduce((sum, asset) => sum + asset.status.health, 0);
            return Math.round(totalHealth / assets.length);
        });

        const assetStatusSummary = computed(() => {
            const summary = {};
            const assets = store.assets.value;
            
            Object.values(AssetStatus).forEach(state => {
                const count = assets.filter(a => a.status.state === state).length;
                summary[state] = {
                    state,
                    count,
                    percentage: assets.length ? Math.round((count / assets.length) * 100) : 0
                };
            });
            
            return Object.values(summary);
        });

        // Helper Functions
        const getStatusIcon = (status) => {
            const icons = {
                [AssetStatus.OPERATIONAL]: 'fa-check-circle',
                [AssetStatus.WARNING]: 'fa-exclamation-triangle',
                [AssetStatus.CRITICAL]: 'fa-times-circle',
                [AssetStatus.MAINTENANCE]: 'fa-tools',
                [AssetStatus.OFFLINE]: 'fa-power-off'
            };
            return `fas ${icons[status] || 'fa-question-circle'}`;
        };

        const formatTimeAgo = (timestamp) => {
            // Zeit-Formatierung implementieren
        };

        // Lifecycle Hooks
        onMounted(async () => {
            await store.fetchAssets();
            // Weitere Initialisierungen
        });

        return {
            buildingCount,
            criticalAssets,
            systemHealth,
            assetStatusSummary,
            recentActivities,
            getStatusIcon,
            formatTimeAgo
        };
    }
}; 