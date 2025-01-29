import { computed } from 'vue';
import { AssetType } from '../types/Asset.js';

export default {
    name: 'AssetTreeNode',
    props: {
        asset: {
            type: Object,
            required: true
        },
        expanded: {
            type: Boolean,
            default: false
        },
        level: {
            type: Number,
            default: 0
        }
    },
    template: `
        <div class="tree-node" :style="{ paddingLeft: level * 20 + 'px' }">
            <div class="node-header" 
                 :class="{ 'has-children': hasChildren }"
                 @click="$emit('select', asset)">
                <button v-if="hasChildren" 
                        class="toggle-btn"
                        @click.stop="$emit('toggle', asset.id)">
                    <i :class="expanded ? 'fa-chevron-down' : 'fa-chevron-right'" 
                       class="fas"></i>
                </button>
                <i :class="getAssetIcon(asset.type)" class="asset-icon"></i>
                <span class="node-name">{{ asset.name }}</span>
                <div class="node-status" :class="getStatusClass(asset)"></div>
            </div>
            
            <div v-if="expanded && hasChildren" class="node-children">
                <asset-tree-node v-for="child in asset.children"
                               :key="child.id"
                               :asset="child"
                               :expanded="isExpanded(child.id)"
                               :level="level + 1"
                               @toggle="onToggle"
                               @select="onSelect"
                />
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const hasChildren = computed(() => 
            props.asset.children && props.asset.children.length > 0
        );

        const getAssetIcon = (type) => {
            const icons = {
                [AssetType.BUILDING]: 'fas fa-building',
                [AssetType.FLOOR]: 'fas fa-layer-group',
                [AssetType.ROOM]: 'fas fa-door-open',
                [AssetType.WINDOW]: 'fas fa-window-maximize'
            };
            return icons[type] || 'fas fa-cube';
        };

        const getStatusClass = (asset) => {
            return `status-${asset.status.state.toLowerCase()}`;
        };

        const isExpanded = (id) => {
            return props.expanded;
        };

        const onToggle = (id) => {
            emit('toggle', id);
        };

        const onSelect = (asset) => {
            emit('select', asset);
        };

        return {
            hasChildren,
            getAssetIcon,
            getStatusClass,
            isExpanded,
            onToggle,
            onSelect
        };
    }
}; 