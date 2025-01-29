import { ref, computed } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';

export default {
    name: 'AssetGrid',
    template: `
        <div class="asset-grid">
            <div class="grid-header">
                <div class="search-bar">
                    <input type="text" v-model="searchQuery" placeholder="Assets durchsuchen...">
                    <i class="fas fa-search"></i>
                </div>
                <div class="grid-actions">
                    <button @click="createNewAsset" class="button primary">
                        <i class="fas fa-plus"></i> Neues Asset
                    </button>
                    <div class="view-toggle">
                        <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">
                            <i class="fas fa-th"></i>
                        </button>
                        <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid-content" :class="viewMode">
                <div v-for="asset in filteredAssets" 
                     :key="asset.id"
                     class="asset-item"
                     @click="selectAsset(asset)">
                    <div class="asset-preview">
                        <img v-if="asset.image" :src="asset.image" :alt="asset.name">
                        <i v-else :class="getAssetIcon(asset.type)"></i>
                        <div class="asset-status" :class="getStatusClass(asset)"></div>
                    </div>
                    <div class="asset-info">
                        <h3>{{ asset.name }}</h3>
                        <p>{{ asset.description }}</p>
                        <div class="asset-meta">
                            <span class="asset-type">{{ asset.type }}</span>
                            <span class="device-count">
                                <i class="fas fa-microchip"></i> {{ asset.devices.length }}
                            </span>
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

        const filteredAssets = computed(() => {
            return store.assets.value.filter(asset => 
                asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                asset.description.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });

        const getAssetIcon = (type) => {
            const icons = {
                building: 'fas fa-building',
                floor: 'fas fa-layer-group',
                room: 'fas fa-door-open',
                window: 'fas fa-window-maximize',
                device: 'fas fa-microchip'
            };
            return icons[type] || 'fas fa-cube';
        };

        const getStatusClass = (asset) => {
            return `status-${asset.status.state.toLowerCase()}`;
        };

        return {
            viewMode,
            searchQuery,
            filteredAssets,
            getAssetIcon,
            getStatusClass,
            selectAsset: (asset) => store.currentAsset.value = asset,
            createNewAsset: () => {
                // Implementierung des Asset-Erstellungsdialogs
            }
        };
    }
}; 