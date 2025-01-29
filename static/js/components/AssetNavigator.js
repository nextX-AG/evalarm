import { ref, computed } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';
import { AssetType } from '../types/Asset.js';

export default {
    name: 'AssetNavigator',
    template: `
        <div class="asset-navigator">
            <!-- Breadcrumb-Navigation -->
            <div class="breadcrumb">
                <div v-for="(item, index) in currentPath" 
                     :key="item.id"
                     class="breadcrumb-item"
                     @click="navigateTo(item)">
                    <i :class="getAssetIcon(item.type)"></i>
                    {{ item.name }}
                    <i v-if="index < currentPath.length - 1" class="fas fa-chevron-right separator"></i>
                </div>
            </div>

            <!-- Asset Details mit Grundriss und Objektmarkierung -->
            <div v-if="currentAsset" class="asset-details">
                <div class="asset-header">
                    <h2>{{ currentAsset.name }}</h2>
                    <div class="asset-actions">
                        <button @click="editMode = !editMode" class="button">
                            <i class="fas" :class="editMode ? 'fa-eye' : 'fa-edit'"></i>
                            {{ editMode ? 'Ansicht' : 'Bearbeiten' }}
                        </button>
                    </div>
                </div>

                <div class="asset-content">
                    <!-- Grundriss mit Objektmarkierung -->
                    <object-marker v-if="editMode"
                                 :floorplan="currentAsset.floorplan"
                                 @object-created="onObjectCreated"
                                 @object-updated="onObjectUpdated"/>
                    
                    <!-- Normale Ansicht -->
                    <div v-else class="floorplan-view">
                        <img :src="currentAsset.floorplan" alt="Grundriss">
                        <div v-for="object in currentAsset.objects" 
                             :key="object.id"
                             class="object-overlay"
                             :class="[object.type, getObjectStatus(object)]"
                             :style="getObjectStyle(object)"
                             @click="showObjectDetails(object)">
                            <i :class="getObjectIcon(object)"></i>
                            <div class="object-tooltip">
                                {{ object.name }}
                                <div v-if="object.type === 'window'" class="window-status">
                                    {{ getWindowState(object) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}; 