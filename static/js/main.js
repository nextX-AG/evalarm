// Vue.js App
import { createApp, ref, computed } from 'vue'
import { modules } from './config/modules.js'
import Header from './components/Header.js';
import AssetDashboard from './components/AssetDashboard.js';
import ModelViewer from './components/ModelViewer.js';
import DeviceManager from './components/DeviceManager.js';
import MaintenancePlanner from './components/MaintenancePlanner.js';
import AssetManager from './components/AssetManager.js';
import AssetCreationDialog from './components/AssetCreationDialog.js';

const app = createApp({
    components: {
        'app-header': Header,
        'asset-dashboard': AssetDashboard,
        'asset-manager': AssetManager,
        'model-viewer': ModelViewer,
        'device-manager': DeviceManager,
        'maintenance-planner': MaintenancePlanner,
        'asset-creation-dialog': AssetCreationDialog
    },
    template: `
        <div id="app">
            <app-header :tenant="tenant"></app-header>
            <main>
                <nav class="sidebar">
                    <div class="nav-items">
                        <button v-for="module in sortedModules" 
                                :key="module.id"
                                @click="currentView = module.id" 
                                :class="{ active: currentView === module.id }">
                            <i :class="'fas ' + module.icon"></i> {{ module.name }}
                        </button>
                    </div>
                </nav>
                <div class="content">
                    <component :is="currentModule.component"></component>
                </div>
            </main>
        </div>
    `,
    setup() {
        const currentView = ref('dashboard');
        
        const sortedModules = computed(() => 
            [...modules].sort((a, b) => a.order - b.order)
        );
        
        const currentModule = computed(() => 
            modules.find(m => m.id === currentView.value) || modules[0]
        );

        return {
            currentView,
            sortedModules,
            currentModule,
            tenant: {
                name: 'Kingspan',
                logo: 'http://3.bp.blogspot.com/-8pXz7DL6W4Q/TWLwjUvImqI/AAAAAAAARaM/P8JbD3mhIY0/s1600/Kingspan_Logo_RGB.jpg',
                poweredBy: true
            }
        };
    }
});

app.mount('#app'); 