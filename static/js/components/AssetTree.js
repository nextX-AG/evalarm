import { ref, computed } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';
import { AssetType } from '../types/Asset.js';

export default {
    name: 'AssetTree',
    template: `
        <div class="asset-tree">
            <div class="tree-header">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" 
                           v-model="searchQuery" 
                           placeholder="Assets durchsuchen...">
                </div>
            </div>
            
            <div class="tree-content">
                <div v-if="loading" class="tree-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Lade Assets...
                </div>
                
                <div v-else-if="error" class="tree-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    {{ error }}
                </div>
                
                <div v-else class="tree-items">
                    <div v-for="asset in rootAssets" 
                         :key="asset.id" 
                         class="tree-item">
                        <TreeNode 
                            :asset="asset"
                            :expanded="expandedNodes[asset.id]"
                            @toggle="toggleNode"
                            @select="selectAsset"
                        />
                    </div>
                </div>
            </div>
            
            <div class="tree-footer">
                <button @click="createNewAsset" class="button primary">
                    <i class="fas fa-plus"></i>
                    Neues Asset
                </button>
            </div>
        </div>
    `,
    components: {
        TreeNode: {
            name: 'TreeNode',
            props: {
                asset: { type: Object, required: true },
                expanded: { type: Boolean, default: false }
            },
            template: `
                <div class="tree-node" :class="{ 'has-children': hasChildren }">
                    <div class="node-header" 
                         :class="{ 'active': isSelected }"
                         @click="$emit('select', asset)">
                        <button v-if="hasChildren" 
                                class="toggle-btn"
                                @click.stop="$emit('toggle', asset.id)">
                            <i :class="expanded ? 'fa-chevron-down' : 'fa-chevron-right'" 
                               class="fas"></i>
                        </button>
                        <i :class="getAssetIcon(asset.type)" class="asset-icon"></i>
                        <span class="node-name">{{ asset.name }}</span>
                        <div class="node-status" :class="statusClass"></div>
                    </div>
                    
                    <div v-if="expanded && hasChildren" class="node-children">
                        <TreeNode v-for="child in asset.children"
                                :key="child.id"
                                :asset="child"
                                :expanded="isExpanded(child.id)"
                                @toggle="onToggle"
                                @select="onSelect"
                        />
                    </div>
                </div>
            `,
            setup(props, { emit }) {
                const store = useAssetStore();
                
                const hasChildren = computed(() => 
                    props.asset.children && props.asset.children.length > 0
                );
                
                const isSelected = computed(() => 
                    store.currentAsset.value?.id === props.asset.id
                );
                
                const statusClass = computed(() => 
                    `status-${props.asset.status.state.toLowerCase()}`
                );
                
                return {
                    hasChildren,
                    isSelected,
                    statusClass,
                    getAssetIcon: (type) => {
                        const icons = {
                            [AssetType.BUILDING]: 'fa-building',
                            [AssetType.FLOOR]: 'fa-layer-group',
                            [AssetType.ROOM]: 'fa-door-open',
                            [AssetType.WINDOW]: 'fa-window-maximize',
                            [AssetType.DEVICE]: 'fa-microchip'
                        };
                        return `fas ${icons[type] || 'fa-cube'}`;
                    },
                    onToggle: (id) => emit('toggle', id),
                    onSelect: (asset) => emit('select', asset)
                };
            }
        }
    },
    setup() {
        const store = useAssetStore();
        const searchQuery = ref('');
        const expandedNodes = ref({});
        
        // Root-Level Assets (Gebäude)
        const rootAssets = computed(() => 
            store.assets.value.filter(asset => 
                asset.type === AssetType.BUILDING &&
                (asset.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                hasMatchingChildren(asset))
            )
        );
        
        const hasMatchingChildren = (asset) => {
            if (!asset.children) return false;
            return asset.children.some(child => 
                child.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                hasMatchingChildren(child)
            );
        };
        
        const toggleNode = (id) => {
            expandedNodes.value[id] = !expandedNodes.value[id];
        };
        
        return {
            searchQuery,
            expandedNodes,
            rootAssets,
            loading: store.loading,
            error: store.error,
            toggleNode,
            selectAsset: (asset) => store.currentAsset.value = asset,
            createNewAsset: () => {
                // Implementierung des Asset-Erstellungsdialogs
            }
        };
    }
}; 