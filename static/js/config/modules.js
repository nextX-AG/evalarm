export const modules = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'fa-tachometer-alt',
        component: 'asset-dashboard',
        order: 1
    },
    {
        id: 'assets',
        name: 'Assets',
        icon: 'fa-building',
        component: 'asset-manager',
        order: 2
    },
    {
        id: 'model',
        name: '3D-Modell',
        icon: 'fa-cube',
        component: 'model-viewer',
        order: 3
    },
    {
        id: 'devices',
        name: 'Geräte',
        icon: 'fa-microchip',
        component: 'device-manager',
        order: 4
    },
    {
        id: 'maintenance',
        name: 'Wartung',
        icon: 'fa-tools',
        component: 'maintenance-planner',
        order: 5
    }
]; 