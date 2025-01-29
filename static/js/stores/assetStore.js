import { ref, computed } from 'vue';
import { Asset, AssetType, AssetStatus } from '../types/Asset.js';

const mockAssets = [
    {
        id: 1,
        type: 'building',
        name: 'Hauptgebäude',
        status: { state: 'operational', health: 95 },
        children: [
            {
                id: 2,
                type: 'floor',
                name: '1. OG',
                status: { state: 'operational', health: 90 },
                children: [
                    {
                        id: 3,
                        type: 'room',
                        name: 'Konferenzraum 1.01',
                        status: { state: 'operational', health: 100 },
                        children: [
                            {
                                id: 4,
                                type: 'window',
                                name: 'Fenster Nord',
                                status: { state: 'warning', health: 75 }
                            }
                        ]
                    },
                    {
                        id: 5,
                        type: 'room',
                        name: 'Büro 1.02',
                        status: { state: 'critical', health: 45 }
                    }
                ]
            },
            {
                id: 6,
                type: 'floor',
                name: 'EG',
                status: { state: 'operational', health: 98 },
                children: [
                    {
                        id: 7,
                        type: 'room',
                        name: 'Empfang',
                        status: { state: 'operational', health: 100 }
                    }
                ]
            }
        ]
    },
    {
        id: 8,
        type: 'building',
        name: 'Lager',
        status: { state: 'maintenance', health: 80 },
        children: []
    }
];

export const useAssetStore = () => {
    const assets = ref([]);
    const currentAsset = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Computed Properties
    const skylights = computed(() => {
        return getAllAssets().filter(asset => asset.type === AssetType.SKYLIGHT);
    });

    const buildingCount = computed(() => {
        return assets.value.filter(asset => asset.type === AssetType.BUILDING).length;
    });

    // Helper Functions
    const getAllAssets = () => {
        const allAssets = [];
        const traverse = (asset) => {
            allAssets.push(asset);
            asset.children?.forEach(traverse);
        };
        assets.value.forEach(traverse);
        return allAssets;
    };

    // Getters
    const getAssetsByType = (type) => {
        return assets.value.filter(asset => asset.type === type);
    };

    const getAssetById = (id) => {
        return assets.value.find(asset => asset.id === id);
    };

    // API Calls
    const fetchAssets = async () => {
        loading.value = true;
        try {
            const response = await fetch('/api/assets');
            const data = await response.json();
            assets.value = data;
        } catch (err) {
            error.value = 'Fehler beim Laden der Assets';
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const createAsset = async (assetData) => {
        const formData = new FormData();
        Object.keys(assetData).forEach(key => {
            if (assetData[key] !== null) {
                formData.append(key, assetData[key]);
            }
        });

        try {
            const response = await fetch('/api/assets', {
                method: 'POST',
                body: formData
            });
            const newAsset = await response.json();
            
            if (assetData.parentId) {
                const parent = findAssetById(assetData.parentId);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(newAsset);
                }
            } else {
                assets.value.push(newAsset);
            }
            
            return newAsset;
        } catch (err) {
            error.value = 'Fehler beim Erstellen des Assets';
            throw err;
        }
    };

    const findAssetById = (id) => {
        return getAllAssets().find(asset => asset.id === id);
    };

    // ... weitere Store-Methoden

    return {
        assets,
        currentAsset,
        loading,
        error,
        skylights,
        buildingCount,
        getAssetsByType,
        getAssetById,
        fetchAssets,
        createAsset,
        findAssetById
    };
}; 