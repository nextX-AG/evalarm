export default {
    name: 'Dashboard',
    template: `
        <div class="dashboard">
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Aktive Geräte</h3>
                    <div class="metric-value">24</div>
                    <div class="metric-change positive">
                        <span>+2</span>
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Online</h3>
                    <div class="metric-value">22</div>
                    <div class="metric-change">
                        <span>92%</span>
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Aktive Alarme</h3>
                    <div class="metric-value">3</div>
                    <div class="metric-change">
                        <span>+1</span>
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Batterie kritisch</h3>
                    <div class="metric-value">2</div>
                    <div class="metric-change negative">
                        <span>-1</span>
                    </div>
                </div>
            </div>

            <div class="active-alarms">
                <h2>Aktive Alarme</h2>
                <div class="alarm-list">
                    <div class="no-alarms">
                        Keine aktiven Alarme
                    </div>
                </div>
            </div>
        </div>
    `
}; 