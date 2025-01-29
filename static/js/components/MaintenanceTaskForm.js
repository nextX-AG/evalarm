import { ref, computed } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';

export default {
    name: 'MaintenanceTaskForm',
    props: {
        task: {
            type: Object,
            default: null
        }
    },
    template: `
        <div class="task-form">
            <div class="form-header">
                <h2>{{ task ? 'Wartung bearbeiten' : 'Neue Wartung' }}</h2>
                <button class="close-button" @click="$emit('close')">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form @submit.prevent="saveTask" class="form-content">
                <!-- Basis-Informationen -->
                <div class="form-section">
                    <h3>Basis-Informationen</h3>
                    <div class="form-group">
                        <label>Titel</label>
                        <input type="text" v-model="formData.title" required>
                    </div>
                    <div class="form-group">
                        <label>Beschreibung</label>
                        <textarea v-model="formData.description" rows="3"></textarea>
                    </div>
                </div>

                <!-- Zeitplanung -->
                <div class="form-section">
                    <h3>Zeitplanung</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Datum</label>
                            <input type="date" v-model="formData.date" required>
                        </div>
                        <div class="form-group">
                            <label>Uhrzeit</label>
                            <input type="time" v-model="formData.time">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Wiederholung</label>
                        <select v-model="formData.recurrence">
                            <option value="">Keine</option>
                            <option value="daily">Täglich</option>
                            <option value="weekly">Wöchentlich</option>
                            <option value="monthly">Monatlich</option>
                            <option value="yearly">Jährlich</option>
                        </select>
                    </div>
                </div>

                <!-- Details -->
                <div class="form-section">
                    <h3>Details</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Priorität</label>
                            <select v-model="formData.priority" required>
                                <option value="low">Niedrig</option>
                                <option value="medium">Mittel</option>
                                <option value="high">Hoch</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Typ</label>
                            <select v-model="formData.type" required>
                                <option value="inspection">Inspektion</option>
                                <option value="repair">Reparatur</option>
                                <option value="replacement">Austausch</option>
                                <option value="calibration">Kalibrierung</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Zuordnung -->
                <div class="form-section">
                    <h3>Zuordnung</h3>
                    <div class="form-group">
                        <label>Asset</label>
                        <select v-model="formData.assetId" required>
                            <option v-for="asset in availableAssets" 
                                   :key="asset.id" 
                                   :value="asset.id">
                                {{ asset.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Verantwortlich</label>
                        <select v-model="formData.assigneeId">
                            <option v-for="user in availableUsers" 
                                   :key="user.id" 
                                   :value="user.id">
                                {{ user.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Checkliste -->
                <div class="form-section">
                    <h3>Wartungsschritte</h3>
                    <div class="checklist">
                        <div v-for="(item, index) in formData.checklist" 
                             :key="index"
                             class="checklist-item">
                            <input type="text" 
                                   v-model="item.text" 
                                   placeholder="Wartungsschritt">
                            <button type="button" @click="removeChecklistItem(index)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <button type="button" 
                                @click="addChecklistItem" 
                                class="add-checklist-item">
                            <i class="fas fa-plus"></i>
                            Schritt hinzufügen
                        </button>
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
                            :disabled="saving">
                        {{ task ? 'Speichern' : 'Erstellen' }}
                    </button>
                </div>
            </form>
        </div>
    `,
    setup(props, { emit }) {
        const store = useAssetStore();
        const saving = ref(false);

        // Form-Daten initialisieren
        const formData = ref(props.task ? { ...props.task } : {
            title: '',
            description: '',
            date: '',
            time: '',
            recurrence: '',
            priority: 'medium',
            type: 'inspection',
            assetId: '',
            assigneeId: '',
            checklist: []
        });

        // Computed Properties
        const availableAssets = computed(() => store.assets.value);
        
        const availableUsers = ref([
            { id: 1, name: 'Max Mustermann' },
            { id: 2, name: 'Erika Musterfrau' }
        ]);

        // Methoden
        const addChecklistItem = () => {
            formData.value.checklist.push({ text: '', completed: false });
        };

        const removeChecklistItem = (index) => {
            formData.value.checklist.splice(index, 1);
        };

        const saveTask = async () => {
            saving.value = true;
            try {
                // API-Call zum Speichern
                const response = await fetch('/api/maintenance-tasks', {
                    method: props.task ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData.value)
                });

                if (!response.ok) throw new Error('Fehler beim Speichern');

                const savedTask = await response.json();
                emit('saved', savedTask);
                emit('close');
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
            } finally {
                saving.value = false;
            }
        };

        return {
            formData,
            saving,
            availableAssets,
            availableUsers,
            addChecklistItem,
            removeChecklistItem,
            saveTask
        };
    }
}; 