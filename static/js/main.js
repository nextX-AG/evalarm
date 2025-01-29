// Vue.js App
import { createApp } from 'vue'
import Dashboard from './components/Dashboard.js';
import ModelViewer from './components/ModelViewer.js';
import Devices from './components/Devices.js';
import Alarms from './components/Alarms.js';

const app = createApp({
    data() {
        return {
            currentView: 'dashboard',
            sidebarCollapsed: false
        }
    },
    methods: {
        setView(view) {
            this.currentView = view;
        }
    }
});

// Komponenten global registrieren
app.component('dashboard-component', Dashboard);
app.component('model-viewer', ModelViewer);
app.component('devices-component', Devices);
app.component('alarms-component', Alarms);

app.mount('#app'); 