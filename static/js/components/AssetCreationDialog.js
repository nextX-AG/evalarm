import { ref } from 'vue';
import { AssetType } from '../types/Asset.js';

export default {
    name: 'AssetCreationDialog',
    emits: ['close', 'create'],
    template: `
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Neues Asset erstellen</h2>
                    <button class="close-button" @click="$emit('close')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form @submit.prevent="createAsset">
                        <div class="form-group">
                            <label>Asset-Typ</label>
                            <select v-model="assetData.type" required>
                                <option value="building">Gebäude</option>
                                <option value="floor">Etage</option>
                                <option value="room">Raum</option>
                                <option value="window">Fenster</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" v-model="assetData.name" required>
                        </div>

                        <div class="form-group">
                            <label>Beschreibung</label>
                            <textarea v-model="assetData.description" rows="3"></textarea>
                        </div>

                        <div class="form-group">
                            <label>Grundriss (optional)</label>
                            <input type="file" @change="handleFloorplanUpload" 
                                   accept="image/*">
                        </div>

                        <div class="form-group" v-if="assetData.type !== 'building'">
                            <label>Übergeordnetes Asset</label>
                            <select v-model="assetData.parentId" required>
                                <option v-for="asset in availableParents" 
                                       :key="asset.id"
                                       :value="asset.id">
                                    {{ asset.name }}
                                </option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="button" 
                                    class="button secondary" 
                                    @click="$emit('close')">
                                Abbrechen
                            </button>
                            <button type="submit" 
                                    class="button primary"
                                    :disabled="!isValid">
                                Asset erstellen
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const assetData = ref({
            type: 'building',
            name: '',
            description: '',
            parentId: null,
            floorplan: null
        });

        const isValid = computed(() => {
            return assetData.value.name && 
                   (assetData.value.type === 'building' || assetData.value.parentId);
        });

        const handleFloorplanUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                assetData.value.floorplan = file;
            }
        };

        const createAsset = async () => {
            const formData = new FormData();
            Object.keys(assetData.value).forEach(key => {
                formData.append(key, assetData.value[key]);
            });

            try {
                const response = await fetch('/api/assets', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Fehler beim Erstellen des Assets');

                const newAsset = await response.json();
                emit('create', newAsset);
                emit('close');
            } catch (error) {
                console.error('Fehler:', error);
                // Hier könnte eine Fehlerbehandlung implementiert werden
            }
        };

        return {
            assetData,
            isValid,
            handleFloorplanUpload,
            createAsset
        };
    }
}; 