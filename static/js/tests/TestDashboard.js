import { createApp } from 'vue';
import AssetDashboard from '../components/AssetDashboard.js';
import { mockAssets, mockActivities } from './mockData.js';

// Mock des Asset Stores
const mockStore = {
    assets: { value: mockAssets },
    fetchAssets: async () => {
        console.log('Fetching mock assets...');
        return mockAssets;
    }
};

// Test Component
const TestDashboard = {
    template: `
        <div style="height: 100vh; background: #f5f5f5;">
            <asset-dashboard />
        </div>
    `,
    setup() {
        // Provide mock store
        provide('assetStore', mockStore);
    }
};

// Mount test app
const app = createApp(TestDashboard);
app.component('asset-dashboard', AssetDashboard);
app.mount('#app'); 