document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const appContainer = document.querySelector('.app-container');
    const contentView = document.getElementById('content-view');
    const navItems = document.querySelectorAll('.nav-item');
    const searchInput = document.querySelector('.search-bar input');
    const notificationBtn = document.querySelector('.notification-btn');

    // Registration Modal Elements
    const registrationModal = document.getElementById('registration-modal');
    const registrationForm = document.getElementById('registration-form');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-registration');

    // Vessel Management Modal Elements
    const vesselModal = document.getElementById('vessel-modal');
    const vesselManageForm = document.getElementById('vessel-manage-form');
    const closeVesselBtn = document.getElementById('close-vessel-modal');
    const cancelVesselBtn = document.getElementById('cancel-vessel-manage');

    // State management
    let currentView = 'dashboard';
    let currentStatusFilter = null;
    let notifications = [
        { title: 'System Online', message: 'Ocean Master core modules initialized.', time: '09:00', icon: '⚡' }
    ];

    // Mock Data (Stateful)
    let vesselsData = [];
    let containersData = [];
    let logisticsData = [];
    let dashboardStats = {
        vessels: { total: 0, active: 0, trend: '0%' },
        containers: { daily: 0, weekly: 0, total: 0, trend: '0%' },
        averageTime: { gateClear: '0 min', berthTurnaround: '0 hrs', trend: '0' },
        portEfficiency: { overall: '0%', trend: '0%' },
        port: { name: '', location: '' }
    };

    // API Fetch Services
    const fetchVessels = async () => {
        try {
            const response = await fetch('api/vessels.php');
            if (!response.ok) throw new Error('Vessels Sync Failed');
            vesselsData = await response.json();
            return vesselsData;
        } catch (error) {
            console.error('Vessels API Error:', error);
            return [];
        }
    };

    const fetchContainers = async () => {
        try {
            const response = await fetch('api/containers.php');
            if (!response.ok) throw new Error('Containers Sync Failed');
            containersData = await response.json();
            return containersData;
        } catch (error) {
            console.error('Containers API Error:', error);
            return [];
        }
    };

    const fetchLogistics = async () => {
        try {
            const response = await fetch('api/logistics.php');
            if (!response.ok) throw new Error('Logistics Sync Failed');
            logisticsData = await response.json();
            return logisticsData;
        } catch (error) {
            console.error('Logistics API Error:', error);
            return [];
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('api/dashboard_stats.php');
            if (!response.ok) throw new Error('Stats Sync Failed');
            dashboardStats = await response.json();
            return dashboardStats;
        } catch (error) {
            console.error('Stats API Error:', error);
            return dashboardStats;
        }
    };

    const fetchAllData = async () => {
        const apiIndicator = document.querySelector('.api-indicator');
        if (apiIndicator) {
            apiIndicator.innerHTML = '<span class="pulse-cyan"></span> API: Syncing...';
        }

        await Promise.all([
            fetchVessels(), 
            fetchContainers(), 
            fetchLogistics(), 
            fetchDashboardStats()
        ]);

        if (apiIndicator) {
            apiIndicator.innerHTML = '<span class="pulse-green"></span> API: Ready';
        }
    };

    // Live Data Service (Simulation)
    class LiveDataService {
        constructor() {
            this.updateInterval = null;
        }

        start() {
            console.log("Live Data Service Started...");
            this.updateInterval = setInterval(() => {
                this.simulateUpdates();
            }, 5000); // Update every 5 seconds
        }

        stop() {
            if (this.updateInterval) clearInterval(this.updateInterval);
        }

        simulateUpdates() {
            // Replaced manual simulation with strict API fetching
            fetchAllData().then(() => {
                const query = searchInput.value || '';
                if (currentView === 'dashboard') renderDashboard(query);
                if (currentView === 'vessels') renderVessels(query);
                if (currentView === 'containers') renderContainers(query);
                if (currentView === 'logistics') renderLogistics(query);
            });
        }
    }

    const liveService = new LiveDataService();
    liveService.start();

    // Router functions
    const renderDashboard = (filter = '') => {
        const filteredVessels = vesselsData.filter(v => {
            const matchesSearch = v.name.toLowerCase().includes(filter.toLowerCase()) ||
                v.id.toLowerCase().includes(filter.toLowerCase()) ||
                v.type.toLowerCase().includes(filter.toLowerCase());
            const matchesStatus = !currentStatusFilter || v.status === currentStatusFilter;
            return matchesSearch && matchesStatus;
        });

        // Calculate Port Breakdown for Chart
        const statusCounts = vesselsData.reduce((acc, v) => {
            const status = v.status || 'Other';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const statusColors = {
            'Docked': '#00f2ff',
            'Approaching': '#3a86ff',
            'Anchored': '#fbbf24',
            'Departing': '#f472b6'
        };

        const totalVessels = vesselsData.length || 1;
        const chartHtml = Object.entries(statusCounts).map(([status, count]) => {
            const percentage = (count / totalVessels) * 100;
            const color = statusColors[status] || '#8892b0';
            const isSelected = currentStatusFilter === status;
            return `
                <div class="chart-bar-group ${isSelected ? 'selected' : ''}" data-status="${status}">
                    <div class="chart-bar-label">
                        <span>${status}</span>
                        <span>${count}</span>
                    </div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                </div>
            `;
        }).join('');

        contentView.innerHTML = `
            <div class="dashboard-header-simple">
                <h1 class="view-title">Operational Dashboard</h1>
                <p class="view-subtitle">${dashboardStats.port?.name || ''} ${dashboardStats.port?.location ? '• ' + dashboardStats.port.location : ''}</p>
            </div>

        <div class="dashboard-main-layout focused-view">
            <div class="dashboard-full-col">
                <div class="dashboard-analytics-row">
                    <div class="elegant-stats-row centered distribution-focused">
                        <div class="port-distribution-main">
                            <div class="pd-header">
                                <h2>Port Distribution Analysis</h2>
                            </div>
                            <div class="pd-chart-horizontal">
                                ${chartHtml}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="vessels-tracking-elegant card">
                    <div class="card-header">
                        <h2>Real-Time Port Tracking</h2>
                        <div class="api-status-badge">
                            <span class="pulse-green"></span> System Synchronized
                        </div>
                    </div>
                    <div class="vessel-scroll-elegant">
                        <div class="vessel-grid-header">
                            <span>Vessel Identity</span>
                            <span>Current Status</span>
                            <span>Berth Assignment</span>
                            <span style="text-align: right;">Activity</span>
                        </div>
                        ${filteredVessels.length > 0 ? filteredVessels.map(v => `
                            <div class="vessel-row-elegant">
                                <div class="v-main-info">
                                    <span class="v-name">${v.name}</span>
                                    <span class="v-id">${v.id}</span>
                                </div>
                                <div class="v-status-dot ${v.status.toLowerCase()}">${v.status}</div>
                                <div class="v-berth-container">
                                    <span class="v-berth-id">${v.berth}</span>
                                </div>
                                <div class="v-progress-container">
                                    <div class="v-progress-track">
                                        <div class="v-progress-fill" style="width: ${v.progress}%"></div>
                                    </div>
                                    <span class="v-progress-text">${v.progress}%</span>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-msg">No active vessels matching criteria.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
        // Hook up Port Distribution filtering
        const chartGroups = contentView.querySelectorAll('.chart-bar-group');
        chartGroups.forEach(group => {
            group.onclick = (e) => {
                e.stopPropagation();
                const status = group.getAttribute('data-status');
                currentStatusFilter = currentStatusFilter === status ? null : status;
                renderDashboard(searchInput.value);
            };
        });
    };

    const renderVessels = (filter = '') => {
        const filteredVessels = vesselsData.filter(v =>
            v.name.toLowerCase().includes(filter.toLowerCase()) ||
            v.id.toLowerCase().includes(filter.toLowerCase()) ||
            v.type.toLowerCase().includes(filter.toLowerCase())
        );

        contentView.innerHTML = `
            <h1 class="view-title">Vessel Management</h1>
            <div class="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>Vessel ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Origin / Destination</th>
                            <th>Current Status</th>
                            <th>Cargo Type</th>
                            <th>Berth</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredVessels.length > 0 ? filteredVessels.map(v => `
                            <tr>
                                <td><code>${v.id}</code></td>
                                <td class="bold">${v.name}</td>
                                <td>${v.type}</td>
                                <td class="small-text">${v.origin} ➞ ${v.destination}</td>
                                <td><span class="status-pill ${v.status.toLowerCase()}">${v.status}</span></td>
                                <td class="small-text">${v.cargo}</td>
                                <td>${v.berth}</td>
                                <td><button class="action-btn manage-vessel" data-id="${v.id}">Manage</button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No vessels found matching your search.</td></tr>'}
                    </tbody>
                </table>
            </div>
    `;
    };

    const renderContainers = (filter = '') => {
        const filteredContainers = containersData.filter(c =>
            c.id.toLowerCase().includes(filter.toLowerCase()) ||
            c.type.toLowerCase().includes(filter.toLowerCase()) ||
            c.zone.toLowerCase().includes(filter.toLowerCase())
        );

        contentView.innerHTML = `
        < div class="view-header" >
                <h1 class="view-title">Container Inventory</h1>
                <div class="header-actions">
                    <button class="action-btn secondary">Filter</button>
                    <button class="action-btn" id="add-container-btn">+ Register New</button>
                </div>
            </div >

        <div class="container-grid">
            ${filteredContainers.length > 0 ? filteredContainers.map(c => `
                    <div class="container-card">
                        ${c.dg ? '<div class="dg-indicator" title="Dangerous Goods">⚠️ DG</div>' : ''}
                        <div class="c-header">
                            <span class="c-id">${c.id}</span>
                            <span class="c-type-badge">${c.type}</span>
                        </div>
                        <div class="c-body">
                            <div class="c-stat">
                                <span class="label">Owner</span>
                                <span class="value">${c.owner}</span>
                            </div>
                            <div class="c-stat">
                                <span class="label">Status</span>
                                <span class="value status-${c.status.toLowerCase()}">${c.status}</span>
                            </div>
                            <div class="c-stat">
                                <span class="label">Zone / weight</span>
                                <span class="value">${c.zone} / ${c.weight}</span>
                            </div>
                            ${c.temp ? `
                            <div class="c-stat temp-alert">
                                <span class="label">Temp</span>
                                <span class="value">${c.temp}</span>
                            </div>
                            ` : ''}
                        </div>
                        <div class="c-footer">
                            <span class="c-size">${c.size}</span>
                        </div>
                    </div>
                `).join('') : '<div class="card" style="grid-column: 1/-1; text-align:center;">No containers found matching your search.</div>'}
        </div>
    `;

        // Hook up registration button
        const addBtn = document.getElementById('add-container-btn');
        if (addBtn) {
            addBtn.onclick = () => {
                registrationModal.classList.remove('hidden');
            };
        }
    };

    const renderLogistics = (filter = '') => {
        const filteredLogistics = logisticsData.filter(l =>
            l.id.toLowerCase().includes(filter.toLowerCase()) ||
            l.carrier.toLowerCase().includes(filter.toLowerCase()) ||
            l.driver.toLowerCase().includes(filter.toLowerCase()) ||
            l.destination.toLowerCase().includes(filter.toLowerCase())
        );

        const activeTrucks = logisticsData.filter(l => l.status === 'Loading' || l.status === 'En Route').length;
        const queuedUnits = logisticsData.filter(l => l.status === 'Scheduled').length;

        // Calculate Status Breakdown
        const statusCounts = logisticsData.reduce((acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
        }, {});

        const statusColors = {
            'Loading': '#00f2ff',
            'En Route': '#3a86ff',
            'Arrived': '#10b981',
            'Scheduled': '#fbbf24'
        };

        const totalUnits = logisticsData.length || 1;
        const chartHtml = Object.entries(statusCounts).map(([status, count]) => {
            const percentage = (count / totalUnits) * 100;
            const color = statusColors[status] || '#8892b0';
            return `
                <div class="chart-bar-group mini">
                    <div class="chart-bar-label">
                        <span>${status}</span>
                        <span>${count}</span>
                    </div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                </div>
            `;
        }).join('');

        contentView.innerHTML = `
        <h1 class="view-title">Ground Logistics</h1>
            
            <div class="logistics-distribution-header card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h2>Truck Status Overview</h2>
                </div>
                <div class="pd-chart-horizontal mini-chart">
                    ${chartHtml}
                </div>
            </div>

            <div class="logistics-container card">
                <div class="card-header">
                    <h2>Trucking Fleet Status</h2>
                    <input type="text" class="table-search" placeholder="Filter by ID or Carrier..." value="${filter}">
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Unit ID</th>
                            <th>Carrier / Driver</th>
                            <th>Plate / Gate</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>ETA / Completion</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredLogistics.length > 0 ? filteredLogistics.map(l => `
                            <tr>
                                <td><code>${l.id}</code></td>
                                <td class="bold">
                                    <div class="carrier-name">${l.carrier}</div>
                                    <div class="driver-name">${l.driver}</div>
                                </td>
                                <td>
                                    <div class="plate-num">${l.plate}</div>
                                    <div class="gate-id">${l.gate}</div>
                                </td>
                                <td>${l.destination}</td>
                                <td><span class="status-pill ${l.status.toLowerCase().replace(' ', '-')}">${l.status}</span></td>
                                <td>${l.eta}</td>
                                <td><button class="action-btn">Track</button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No logistics units found match search.</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="logistics-stats dashboard-grid" style="margin-top: 2rem;">
                <div class="stat-card">
                    <div class="stat-label">Active Trucks</div>
                    <div class="stat-value">${activeTrucks}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Queued Units</div>
                    <div class="stat-value">${queuedUnits}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Avg Gate Clear Time</div>
                    <div class="stat-value">6.2 min</div>
                </div>
            </div>
    `;

        // Local search listener
        const tableSearch = contentView.querySelector('.table-search');
        if (tableSearch) {
            tableSearch.addEventListener('input', (e) => {
                const query = e.target.value;
                searchInput.value = query; // Sync with global search
                renderLogistics(query);
            });
        }
    };



    const switchView = (view) => {
        currentView = view;

        // Update nav UI
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === view) {
                item.classList.add('active');
            }
        });

        // Add loading state
        contentView.innerHTML = '<div class="loader"></div>';

        // Simulate network delay
        setTimeout(() => {
            const query = searchInput.value;
            switch (view) {
                case 'dashboard': renderDashboard(query); break;
                case 'vessels': renderVessels(query); break;
                case 'containers': renderContainers(query); break;
                case 'logistics': renderLogistics(query); break;

                default:
                    contentView.innerHTML = `< h1 > ${view.charAt(0).toUpperCase() + view.slice(1)} View</h1 > <p>Module under development...</p>`;
            }
        }, 400);
    };

    // Event Listeners
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });

    // Add search input listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (currentView === 'dashboard') renderDashboard(query);
        if (currentView === 'vessels') renderVessels(query);
        if (currentView === 'containers') renderContainers(query);
        if (currentView === 'logistics') renderLogistics(query);
    });

    // Event Delegation for action buttons
    contentView.addEventListener('click', (e) => {
        if (e.target.classList.contains('manage-vessel')) {
            const vesselId = e.target.getAttribute('data-id');
            openVesselModal(vesselId);
        }
    });

    // Vessel Modal Logic
    const openVesselModal = (vesselId) => {
        const vessel = vesselsData.find(v => v.id === vesselId);
        if (!vessel) return;

        document.getElementById('v-m-id').value = vessel.id;
        document.getElementById('v-m-name').textContent = `Manage: ${vessel.name}`;
        document.getElementById('v-m-status').value = vessel.status;
        document.getElementById('v-m-berth').value = vessel.berth;
        document.getElementById('v-m-progress').value = vessel.progress;
        document.getElementById('v-m-cargo').value = vessel.cargo;

        vesselModal.classList.remove('hidden');
    };

    const closeVesselModal = () => {
        vesselModal.classList.add('hidden');
        vesselManageForm.reset();
    };

    closeVesselBtn.onclick = closeVesselModal;
    cancelVesselBtn.onclick = closeVesselModal;

    vesselManageForm.onsubmit = (e) => {
        e.preventDefault();
        const vesselId = document.getElementById('v-m-id').value;
        const vesselIndex = vesselsData.findIndex(v => v.id === vesselId);

        if (vesselIndex !== -1) {
            vesselsData[vesselIndex] = {
                ...vesselsData[vesselIndex],
                status: document.getElementById('v-m-status').value,
                berth: document.getElementById('v-m-berth').value,
                progress: parseInt(document.getElementById('v-m-progress').value),
                cargo: document.getElementById('v-m-cargo').value
            };

            showNotification('Vessel Updated', `${vesselsData[vesselIndex].name} records have been synchronized.`, '🚢');
            closeVesselModal();

            // Re-render current view with existing search query
            const query = searchInput.value;
            if (currentView === 'dashboard') renderDashboard(query);
            if (currentView === 'vessels') renderVessels(query);
        }
    };

    // Registration Logic
    const closeRegistration = () => {
        registrationModal.classList.add('hidden');
        registrationForm.reset();
    };

    closeBtn.onclick = closeRegistration;
    cancelBtn.onclick = closeRegistration;

    registrationForm.onsubmit = (e) => {
        e.preventDefault();

        const newContainer = {
            id: document.getElementById('c-id').value,
            owner: document.getElementById('c-owner').value,
            size: document.getElementById('c-size').value,
            type: document.getElementById('c-type').value,
            zone: document.getElementById('c-zone').value,
            weight: document.getElementById('c-weight').value,
            dg: document.getElementById('c-dg').checked,
            status: 'Processing',
            temp: null
        };

        // Add to data
        containersData.unshift(newContainer);

        // Success feedback
        showNotification('Container Registered', `Unit ${newContainer.id} has been added to inventory.`, '📦');
        closeRegistration();

        // Re-render if in containers view
        if (currentView === 'containers') renderContainers(searchInput.value);
    };

    // Notification System
    const showNotification = (title, message, icon = '🚢', imageUrl = null) => {
        // Add to notification list
        notifications.unshift({ title, message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon, imageUrl });
        const badge = document.querySelector('.notification-btn .badge');
        if (badge) badge.textContent = notifications.length;

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" class="nt-preview-img" alt="Preview">` : `<div class="nt-icon">${icon}</div>`}
            <div class="nt-content">
                <div class="nt-title">${title} <span class="nt-dot"></span></div>
                <div class="nt-message">${message}</div>
            </div>
            <button class="nt-close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Remove after 5 seconds
        const dismiss = () => {
            toast.classList.add('dismiss');
            setTimeout(() => toast.remove(), 500);
        };

        toast.querySelector('.nt-close').onclick = dismiss;
        setTimeout(dismiss, 5000);
    };

    // Notification Dropdown
    const toggleNotifications = () => {
        let panel = document.querySelector('.notification-panel');
        if (panel) {
            panel.remove();
            return;
        }

        panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
        < div class="panel-header" >
                <h3>Notification Center</h3>
                <button class="clear-btn">Clear All</button>
            </div >
        <div class="panel-list">
            ${notifications.map(n => `
                    <div class="panel-item">
                        ${n.imageUrl ? `<img src="${n.imageUrl}" class="nt-preview-img" style="width: 40px; height: 40px;">` : `<span class="n-icon">${n.icon}</span>`}
                        <div class="n-content">
                            <div class="n-title">${n.title}</div>
                            <div class="n-msg">${n.message}</div>
                            <div class="n-time">${n.time}</div>
                        </div>
                    </div>
                `).join('')}
        </div>
    `;
        document.querySelector('.top-actions').appendChild(panel);

        panel.querySelector('.clear-btn').onclick = () => {
            notifications = [];
            document.querySelector('.notification-btn .badge').textContent = '0';
            panel.remove();
        };
    };

    notificationBtn.onclick = (e) => {
        e.stopPropagation();
        toggleNotifications();
    };

    document.addEventListener('click', () => {
        const panel = document.querySelector('.notification-panel');
        if (panel) panel.remove();
    });

    // Auth Service
    class AuthService {
        constructor() {
            this.usersKey = 'ocean_master_users';
            this.sessionKey = 'ocean_master_session';
            this.init();
        }

        init() {
            if (!localStorage.getItem(this.usersKey)) {
                // Seed with a default admin user
                const defaultUsers = [{ username: 'admin', password: 'Password!1' }];
                localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
            }
        }

        getUsers() {
            return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
        }

        register(username, password) {
            const users = this.getUsers();
            if (users.find(u => u.username === username)) {
                return { success: false, message: 'Username already exists' };
            }
            users.push({ username, password });
            localStorage.setItem(this.usersKey, JSON.stringify(users));
            return { success: true };
        }

        login(username, password) {
            const users = this.getUsers();
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                sessionStorage.setItem(this.sessionKey, JSON.stringify({ username }));
                return { success: true };
            }
            return { success: false, message: 'Invalid username or password' };
        }

        logout() {
            sessionStorage.removeItem(this.sessionKey);
            location.reload();
        }

        getCurrentUser() {
            const session = sessionStorage.getItem(this.sessionKey);
            return session ? JSON.parse(session) : null;
        }
    }

    const auth = new AuthService();

    // Auth UI Logic
    const initAuth = () => {
        let isLoginMode = true;
        const authTabs = document.querySelectorAll('.auth-tab');
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const passwordHint = document.getElementById('password-hint');
        const logoutBtn = document.getElementById('logout-btn');

        const updateAuthMode = (mode) => {
            isLoginMode = mode === 'login';

            // Update tabs UI
            authTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.mode === mode);
            });

            // Update form elements
            if (isLoginMode) {
                authSubmitBtn.textContent = 'Authorize Access';
                if (passwordHint) passwordHint.classList.add('hidden');
            } else {
                authSubmitBtn.textContent = 'Create Master Account';
                if (passwordHint) passwordHint.classList.remove('hidden');
            }
        };

        authTabs.forEach(tab => {
            tab.onclick = () => updateAuthMode(tab.dataset.mode);
        });

        // Initialize in login mode
        updateAuthMode('login');

        // Handle logout from both locations
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => {
            btn.onclick = () => {
                showNotification('Session Ending', 'Safely disconnecting from Ocean Master...', '🔒');
                setTimeout(() => auth.logout(), 800);
            };
        });

        // Check for existing session
        const activeUser = auth.getCurrentUser();
        if (activeUser) {
            showApp(activeUser.username);
        }

        function showApp(username) {
            loginOverlay.style.display = 'none';
            appContainer.classList.remove('hidden');
            appContainer.classList.add('fade-in');
            updateProfile(username);
            switchView('dashboard');

            // Trigger Vessel Notification with Image
            setTimeout(() => {
                showNotification(
                    'Vessel Entry Logged',
                    'A new vessel has been synchronized with the port tracking system.',
                    '🚢',
                    'https://images.unsplash.com/photo-1544441893-675973e31d85?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
                );
            }, 3000);
        }

        function updateProfile(name) {
            const profileName = document.querySelector('.user-info .name');
            const avatar = document.querySelector('.avatar');
            if (profileName) profileName.textContent = name;
            if (avatar) {
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                avatar.textContent = initials || '??';
            }
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameVal = document.getElementById('username').value;
            const passwordVal = document.getElementById('password').value;
            const card = document.querySelector('.login-card');

            // Password Validation (Same as before)
            const passRegex = /^[A-Z](?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9]).*$/;

            if (!passRegex.test(passwordVal)) {
                card.classList.add('error-shake');
                showNotification('Security Error', 'Password must start with Uppercase, have 1+ special char, and 1+ number.', '❌');
                setTimeout(() => card.classList.remove('error-shake'), 500);
                return;
            }

            authSubmitBtn.innerHTML = isLoginMode ? 'Authorizing...' : 'Registering...';
            authSubmitBtn.disabled = true;

            setTimeout(() => {
                if (isLoginMode) {
                    const result = auth.login(usernameVal, passwordVal);
                    if (result.success) {
                        loginOverlay.classList.add('fade-out');
                        setTimeout(() => {
                            showApp(usernameVal);
                            showNotification('Access Granted', `Welcome back, ${usernameVal}.`, '⚓');
                        }, 500);
                    } else {
                        card.classList.add('error-shake');
                        showNotification('Auth Failed', result.message, '❌');
                        authSubmitBtn.innerHTML = 'Authorize Access';
                        authSubmitBtn.disabled = false;
                        setTimeout(() => card.classList.remove('error-shake'), 500);
                    }
                } else {
                    const result = auth.register(usernameVal, passwordVal);
                    if (result.success) {
                        showNotification('Account Created', 'Registration successful. You can now login.', '✅');
                        isLoginMode = true;
                        updateAuthMode();
                        authSubmitBtn.disabled = false;
                    } else {
                        card.classList.add('error-shake');
                        showNotification('Registration Error', result.message, '❌');
                        authSubmitBtn.disabled = false;
                        setTimeout(() => card.classList.remove('error-shake'), 500);
                    }
                    authSubmitBtn.innerHTML = isLoginMode ? 'Authorize Access' : 'Create Master Account';
                }
            }, 1000);
        });
    };

    // Initial render
    fetchAllData();
    initAuth();
});