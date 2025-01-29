export const AssetType = {
    BUILDING: 'building',
    FLOOR: 'floor',
    ROOM: 'room',
    SKYLIGHT: 'skylight',
    WINDOW: 'window',
    DOOR: 'door',
    AREA: 'area',
    DEVICE: 'device',
    EMERGENCY_BUTTON: 'emergency_button',
    SENSOR: 'sensor',
    GATEWAY: 'gateway'
};

export const AssetStatus = {
    OPERATIONAL: 'operational',
    WARNING: 'warning',
    CRITICAL: 'critical',
    MAINTENANCE: 'maintenance',
    OFFLINE: 'offline'
};

export const WindowState = {
    OPEN: 'open',
    CLOSED: 'closed',
    PARTIAL: 'partial',
    ERROR: 'error'
};

export class Asset {
    constructor({
        id,
        type,
        name,
        description,
        image,
        model3d,
        metadata = {},
        parent = null,
        children = [],
        devices = [],
        serialNumber = '',
        manufacturer = '',
        installationDate = null,
        lastMaintenance = null,
        nextMaintenance = null,
        documents = []
    }) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.description = description;
        this.image = image;
        this.model3d = model3d;
        this.metadata = metadata;
        this.parent = parent;
        this.children = children;
        this.devices = devices;
        this.serialNumber = serialNumber;
        this.manufacturer = manufacturer;
        this.installationDate = installationDate;
        this.lastMaintenance = lastMaintenance;
        this.nextMaintenance = nextMaintenance;
        this.documents = documents;
        this.status = {
            health: 100,
            lastUpdate: new Date(),
            alerts: [],
            state: AssetStatus.OPERATIONAL
        };
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    removeChild(childId) {
        const index = this.children.findIndex(child => child.id === childId);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }

    addDevice(device) {
        this.devices.push(device);
    }

    removeDevice(deviceId) {
        const index = this.devices.findIndex(device => device.id === deviceId);
        if (index !== -1) {
            this.devices.splice(index, 1);
        }
    }

    updateStatus() {
        // Berechne Gesundheitsstatus basierend auf Kindern und Geräten
        let totalHealth = 0;
        let items = [...this.children, ...this.devices];
        
        if (items.length === 0) return;

        items.forEach(item => {
            if (item.status) {
                totalHealth += item.status.health;
            }
        });

        this.status.health = Math.round(totalHealth / items.length);
        
        // Update Status basierend auf Gesundheit
        if (this.status.health >= 90) {
            this.status.state = AssetStatus.OPERATIONAL;
        } else if (this.status.health >= 70) {
            this.status.state = AssetStatus.WARNING;
        } else {
            this.status.state = AssetStatus.CRITICAL;
        }

        this.status.lastUpdate = new Date();
    }

    getPath() {
        let path = [this];
        let current = this;
        
        while (current.parent) {
            path.unshift(current.parent);
            current = current.parent;
        }
        
        return path;
    }
} 