import { ref } from 'vue';

export default {
    name: 'Header',
    props: {
        tenant: {
            type: Object,
            required: true
        }
    },
    template: `
        <header class="header-container">
            <div class="header-content">
                <div class="header-left">
                    <img :src="tenant.logo" :alt="tenant.name" class="tenant-logo">
                    <span class="platform-title">SOS Platform</span>
                </div>
                <div class="header-right">
                    powered by nextX AG
                </div>
            </div>
        </header>
    `
}; 