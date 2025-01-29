import { ref, computed } from 'vue';
import { AssetType } from '../types/Asset.js';
import { useAssetStore } from '../stores/assetStore.js';

export default {
    name: 'AssetForm',
    props: {
        editAsset: {
            type: Object,
            default: null
        }
    },
    template: `
        <div class="asset-form-dialog">
            <div class="dialog-header">
                <h2>{{ editAsset ? 'Asset bearbeiten' : 'Neues Asset erstellen' }}</h2>
                <button class="close-button" @click="$emit('close')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form @submit.prevent="saveAsset" class="asset-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Asset Typ</label>
                        <select v-model="formData.type" required>
                            <option v-for="(label, type) in assetTypes" 
                                  :key="type" 
                                  :value="type">
                                {{ label }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" v-model="formData.name" required>
                    </div>

                    <div class="form-group full-width">
                        <label>Beschreibung</label>
                        <textarea v-model="formData.description" rows="3"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Seriennummer</label>
                        <input type="text" v-model="formData.serialNumber">
                    </div>

                    <div class="form-group">
                        <label>Hersteller</label>
                        <input type="text" v-model="formData.manufacturer">
                    </div>

                    <div class="form-group">
                        <label>Installationsdatum</label>
                        <input type="date" v-model="formData.installationDate">
                    </div>

                    <div class="form-group">
                        <label>Nächste Wartung</label>
                        <input type="date" v-model="formData.nextMaintenance">
                    </div>

                    <div class="form-group full-width">
                        <label>Bild</label>
                        <div class="file-upload">
                            <input type="file" 
                                   @change="handleImageUpload" 
                                   accept="image/*"
                                   ref="imageInput">
                            <div class="upload-preview" v-if="formData.image">
                                <img :src="formData.image" alt="Asset Preview">
                                <button type="button" @click="removeImage">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <button type="button" 
                                    class="upload-button" 
                                    @click="$refs.imageInput.click()"
                                    v-if="!formData.image">
                                <i class="fas fa-upload"></i>
                                Bild hochladen
                            </button>
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label>3D Modell</label>
                        <div class="file-upload">
                            <input type="file" 
                                   @change="handle3DModelUpload" 
                                   accept=".glb,.gltf"
                                   ref="modelInput">
                            <button type="button" 
                                    class="upload-button"
                                    @click="$refs.modelInput.click()">
                                <i class="fas fa-cube"></i>
                                3D Modell hochladen
                            </button>
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label>Dokumente</label>
                        <div class="documents-list">
                            <div v-for="(doc, index) in formData.documents" 
                                 :key="index"
                                 class="document-item">
                                <i :class="getDocIcon(doc.type)"></i>
                                <span>{{ doc.name }}</span>
                                <button type="button" @click="removeDocument(index)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <button type="button" 
                                    class="add-document"
                                    @click="$refs.documentInput.click()">
                                <i class="fas fa-plus"></i>
                                Dokument hinzufügen
                            </button>
                            <input type="file"
                                   @change="handleDocumentUpload"
                                   ref="documentInput"
                                   style="display: none">
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" 
                            class="button secondary" 
                            @click="$emit('close')">
                        Abbrechen
                    </button>
                    <button type="submit" 
                            class="button primary"
                            :disabled="loading">
                        {{ editAsset ? 'Speichern' : 'Erstellen' }}
                    </button>
                </div>
            </form>
        </div>
    `,
    setup(props, { emit }) {
        const store = useAssetStore();
        const loading = ref(false);
        
        const formData = ref(props.editAsset ? { ...props.editAsset } : {
            type: '',
            name: '',
            description: '',
            serialNumber: '',
            manufacturer: '',
            installationDate: '',
            nextMaintenance: '',
            image: null,
            model3d: null,
            documents: []
        });

        const assetTypes = {
            [AssetType.BUILDING]: 'Gebäude',
            [AssetType.FLOOR]: 'Etage',
            [AssetType.ROOM]: 'Raum',
            [AssetType.WINDOW]: 'Fenster',
            [AssetType.DEVICE]: 'Gerät'
        };

        const handleImageUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const base64 = await fileToBase64(file);
                formData.value.image = base64;
            } catch (error) {
                console.error('Fehler beim Bildupload:', error);
            }
        };

        const handle3DModelUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                // Hier Implementation für 3D-Modell-Upload
            } catch (error) {
                console.error('Fehler beim 3D-Modell-Upload:', error);
            }
        };

        const handleDocumentUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const document = {
                    name: file.name,
                    type: getFileType(file),
                    size: file.size,
                    uploadDate: new Date()
                };
                formData.value.documents.push(document);
            } catch (error) {
                console.error('Fehler beim Dokumenten-Upload:', error);
            }
        };

        const saveAsset = async () => {
            loading.value = true;
            try {
                const result = props.editAsset 
                    ? await store.updateAsset(formData.value)
                    : await store.createAsset(formData.value);
                emit('saved', result);
                emit('close');
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
            } finally {
                loading.value = false;
            }
        };

        return {
            formData,
            loading,
            assetTypes,
            handleImageUpload,
            handle3DModelUpload,
            handleDocumentUpload,
            saveAsset
        };
    }
}; 