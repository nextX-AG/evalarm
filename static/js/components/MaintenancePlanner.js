import { ref, computed, onMounted } from 'vue';
import { useAssetStore } from '../stores/assetStore.js';
import { AssetStatus } from '../types/Asset.js';
import MaintenanceTaskForm from './MaintenanceTaskForm.js';
import { useMaintenanceStore } from '../stores/maintenanceStore.js';

export default {
    name: 'MaintenancePlanner',
    components: {
        MaintenanceTaskForm
    },
    template: `
        <div class="content-page">
            <div class="page-header">
                <div class="header-left">
                    <h2>Wartungsplaner</h2>
                    <div class="view-toggle">
                        <button @click="currentView = 'calendar'" :class="{ active: currentView === 'calendar' }">
                            <i class="fas fa-calendar-alt"></i> Kalender
                        </button>
                        <button @click="currentView = 'list'" :class="{ active: currentView === 'list' }">
                            <i class="fas fa-list"></i> Liste
                        </button>
                    </div>
                </div>
                <div class="header-right">
                    <div class="date-navigation" v-if="currentView === 'calendar'">
                        <button @click="previousMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3>{{ currentMonthYear }}</h3>
                        <button @click="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <button @click="createTask" class="button primary">
                        <i class="fas fa-plus"></i> Neue Wartung
                    </button>
                </div>
            </div>

            <div class="page-content">
                <!-- Kalenderansicht -->
                <div v-if="currentView === 'calendar'" class="calendar-view">
                    <div class="calendar-header">
                        <div v-for="day in weekDays" :key="day" class="calendar-day-header">
                            {{ day }}
                        </div>
                    </div>
                    <div class="calendar-grid">
                        <div v-for="date in calendarDays" 
                             :key="date.toISOString()"
                             class="calendar-day"
                             :class="{ 
                                 'other-month': !isCurrentMonth(date),
                                 'has-tasks': hasMaintenanceTasks(date),
                                 'today': isToday(date)
                             }">
                            <div class="day-header">
                                {{ date.getDate() }}
                            </div>
                            <div class="day-content">
                                <div v-for="task in getTasksForDate(date)"
                                     :key="task.id"
                                     class="task-item"
                                     :class="task.priority"
                                     @click="showTaskDetails(task)">
                                    <i :class="getTaskIcon(task.type)"></i>
                                    <span class="task-title">{{ task.title }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Listenansicht -->
                <div v-else class="list-view">
                    <div class="task-filters">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" v-model="searchQuery" placeholder="Wartungen suchen...">
                        </div>
                        <select v-model="statusFilter">
                            <option value="">Alle Status</option>
                            <option value="pending">Ausstehend</option>
                            <option value="completed">Abgeschlossen</option>
                            <option value="overdue">Überfällig</option>
                        </select>
                    </div>

                    <div class="task-list">
                        <div v-for="task in filteredTasks" 
                             :key="task.id"
                             class="task-card"
                             :class="task.priority">
                            <div class="task-header">
                                <div class="task-meta">
                                    <i :class="getTaskIcon(task.type)"></i>
                                    <span class="task-date">{{ formatDate(task.date) }}</span>
                                </div>
                                <div class="task-status" :class="task.status">
                                    {{ task.status }}
                                </div>
                            </div>
                            <div class="task-content">
                                <h3>{{ task.title }}</h3>
                                <p>{{ task.description }}</p>
                            </div>
                            <div class="task-footer">
                                <div class="task-assignee">
                                    <i class="fas fa-user"></i>
                                    {{ task.assignee }}
                                </div>
                                <div class="task-actions">
                                    <button @click="editTask(task)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button @click="completeTask(task)" v-if="task.status === 'pending'">
                                        <i class="fas fa-check"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task Form Modal -->
            <maintenance-task-form 
                v-if="showTaskForm"
                :task="selectedTask"
                @close="closeTaskForm"
                @save="saveTask"
            />
        </div>
    `,
    setup() {
        const store = useMaintenanceStore();
        const currentView = ref('calendar');
        const currentDate = ref(new Date());
        const searchQuery = ref('');
        const statusFilter = ref('');
        const typeFilter = ref('');
        const showTaskForm = ref(false);
        const selectedTask = ref(null);

        // Kalender-Logik
        const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        
        const currentMonthYear = computed(() => {
            return new Intl.DateTimeFormat('de-DE', { 
                month: 'long', 
                year: 'numeric' 
            }).format(currentDate.value);
        });

        const calendarDays = computed(() => {
            const year = currentDate.value.getFullYear();
            const month = currentDate.value.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            // Startdatum (letzter Montag des Vormonats)
            const start = new Date(firstDay);
            start.setDate(start.getDate() - (start.getDay() || 7) + 1);
            
            // Enddatum (erster Sonntag des nächsten Monats)
            const end = new Date(lastDay);
            end.setDate(end.getDate() + (7 - end.getDay()));
            
            const days = [];
            const current = new Date(start);
            
            while (current <= end) {
                days.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            
            return days;
        });

        // Computed Properties
        const filteredTasks = computed(() => {
            return store.tasks.value.filter(task => {
                if (searchQuery.value) {
                    const query = searchQuery.value.toLowerCase();
                    return task.title.toLowerCase().includes(query) ||
                           task.description?.toLowerCase().includes(query);
                }
                if (statusFilter.value && task.status !== statusFilter.value) {
                    return false;
                }
                if (typeFilter.value && task.type !== typeFilter.value) {
                    return false;
                }
                return true;
            });
        });

        // Kalender-Hilfsfunktionen
        const isCurrentMonth = (date) => {
            return date.getMonth() === currentDate.value.getMonth();
        };

        const isToday = (date) => {
            const today = new Date();
            return date.toDateString() === today.toDateString();
        };

        const hasMaintenanceTasks = (date) => {
            return store.tasks.value.some(task => 
                new Date(task.date).toDateString() === date.toDateString()
            );
        };

        const getTasksForDate = (date) => {
            return store.tasks.value.filter(task => 
                new Date(task.date).toDateString() === date.toDateString()
            );
        };

        // Navigation
        const previousMonth = () => {
            currentDate.value = new Date(
                currentDate.value.getFullYear(),
                currentDate.value.getMonth() - 1
            );
        };

        const nextMonth = () => {
            currentDate.value = new Date(
                currentDate.value.getFullYear(),
                currentDate.value.getMonth() + 1
            );
        };

        // Task Form Handling
        const openTaskForm = (task = null) => {
            selectedTask.value = task;
            showTaskForm.value = true;
        };

        const closeTaskForm = () => {
            selectedTask.value = null;
            showTaskForm.value = false;
        };

        const onTaskSaved = (task) => {
            const index = store.tasks.value.findIndex(t => t.id === task.id);
            if (index !== -1) {
                store.tasks.value[index] = task;
            } else {
                store.tasks.value.push(task);
            }
            closeTaskForm();
        };

        // Lifecycle
        onMounted(async () => {
            try {
                const response = await fetch('/api/maintenance-tasks');
                const data = await response.json();
                store.tasks.value = data;
            } catch (error) {
                console.error('Fehler beim Laden der Wartungsaufgaben:', error);
            }
        });

        // Hilfsfunktionen
        const getTaskIcon = (type) => {
            const icons = {
                'inspection': 'fa-search',
                'repair': 'fa-wrench',
                'replacement': 'fa-exchange-alt',
                'calibration': 'fa-sliders-h'
            };
            return `fas ${icons[type] || 'fa-tasks'}`;
        };

        return {
            currentView,
            currentDate,
            searchQuery,
            statusFilter,
            typeFilter,
            showTaskForm,
            selectedTask,
            weekDays,
            currentMonthYear,
            calendarDays,
            filteredTasks,
            isCurrentMonth,
            isToday,
            hasMaintenanceTasks,
            getTasksForDate,
            previousMonth,
            nextMonth,
            openTaskForm,
            closeTaskForm,
            onTaskSaved,
            getTaskIcon,
            tasks: store.tasks,
            upcomingTasks: store.upcomingTasks,
            overdueTasks: store.overdueTasks,
            createTask: store.createTask,
            updateTask: store.updateTask
        };
    }
}; 