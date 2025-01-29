import { ref, computed } from 'vue';
import { useAssetStore } from './assetStore.js';

const mockTasks = [
    {
        id: 1,
        title: 'Fenster-Wartung',
        description: 'Jährliche Inspektion und Wartung der Fensterantriebe',
        date: '2024-02-15',
        time: '09:00',
        type: 'inspection',
        priority: 'medium',
        status: 'pending',
        assetId: 4, // Fenster Nord
        assignee: 'Max Mustermann',
        checklist: [
            { text: 'Antrieb auf Verschleiß prüfen', completed: false },
            { text: 'Dichtungen kontrollieren', completed: false },
            { text: 'Funktionstest durchführen', completed: false }
        ]
    },
    {
        id: 2,
        title: 'Notfall-Knopf Test',
        description: 'Monatlicher Test der Notfall-Knöpfe',
        date: '2024-02-10',
        time: '14:00',
        type: 'inspection',
        priority: 'high',
        status: 'pending',
        assetId: 5, // Büro 1.02
        assignee: 'Erika Musterfrau',
        checklist: [
            { text: 'Sichtprüfung durchführen', completed: false },
            { text: 'Alarmauslösung testen', completed: false },
            { text: 'Protokoll erstellen', completed: false }
        ]
    },
    {
        id: 3,
        title: 'Sensor-Kalibrierung',
        description: 'Kalibrierung der Temperatursensoren',
        date: '2024-02-20',
        time: '10:00',
        type: 'calibration',
        priority: 'medium',
        status: 'pending',
        assetId: 3, // Konferenzraum 1.01
        assignee: 'Max Mustermann',
        checklist: [
            { text: 'Referenzmessung durchführen', completed: false },
            { text: 'Sensor kalibrieren', completed: false },
            { text: 'Dokumentation aktualisieren', completed: false }
        ]
    },
    {
        id: 4,
        title: 'Gateway-Update',
        description: 'Firmware-Update der Gateway-Systeme',
        date: '2024-02-12',
        time: '16:00',
        type: 'maintenance',
        priority: 'high',
        status: 'completed',
        assetId: 7, // Empfang
        assignee: 'Erika Musterfrau',
        checklist: [
            { text: 'Backup erstellen', completed: true },
            { text: 'Firmware aktualisieren', completed: true },
            { text: 'Funktionstest durchführen', completed: true }
        ]
    }
];

export const useMaintenanceStore = () => {
    const store = useAssetStore();
    const tasks = ref(mockTasks);
    const loading = ref(false);
    const error = ref(null);

    // Computed Properties
    const upcomingTasks = computed(() => {
        const now = new Date();
        return tasks.value
            .filter(task => new Date(task.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    const overdueTasks = computed(() => {
        const now = new Date();
        return tasks.value
            .filter(task => 
                new Date(task.date) < now && 
                task.status !== 'completed'
            );
    });

    // Actions
    const createTask = async (taskData) => {
        try {
            // API-Call würde hier stattfinden
            const newTask = {
                id: tasks.value.length + 1,
                ...taskData,
                status: 'pending'
            };
            tasks.value.push(newTask);
            return newTask;
        } catch (err) {
            error.value = 'Fehler beim Erstellen der Wartungsaufgabe';
            throw err;
        }
    };

    const updateTask = async (taskId, updates) => {
        const index = tasks.value.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks.value[index] = { ...tasks.value[index], ...updates };
            return tasks.value[index];
        }
        throw new Error('Wartungsaufgabe nicht gefunden');
    };

    return {
        tasks,
        loading,
        error,
        upcomingTasks,
        overdueTasks,
        createTask,
        updateTask
    };
}; 