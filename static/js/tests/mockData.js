export const mockAssets = [
    {
        id: 1,
        type: 'building',
        name: 'Hauptgebäude',
        status: {
            state: 'operational',
            health: 95,
            lastUpdate: new Date()
        }
    },
    {
        id: 2,
        type: 'window',
        name: 'Fenster 1.OG',
        status: {
            state: 'critical',
            health: 45,
            lastUpdate: new Date()
        }
    },
    {
        id: 3,
        type: 'sensor',
        name: 'Temperatursensor',
        status: {
            state: 'warning',
            health: 75,
            lastUpdate: new Date()
        }
    }
];

export const mockActivities = [
    {
        id: 1,
        type: 'maintenance',
        asset: { id: 2, name: 'Fenster 1.OG' },
        description: 'Wartung durchgeführt',
        timestamp: new Date()
    },
    {
        id: 2,
        type: 'alert',
        asset: { id: 3, name: 'Temperatursensor' },
        description: 'Batterie schwach',
        timestamp: new Date(Date.now() - 3600000) // 1 Stunde alt
    }
]; 