// ===== STATE MANAGEMENT =====
const STATUS_OPTIONS = [
    "Interested",
    "Applied",
    "Phone Screen",
    "Technical Interview",
    "Final Round",
    "Offer Received",
    "Accepted",
    "Rejected",
    "No Reply",
    "Ghosted",
    "Withdrawn"
];

const STATUS_COLORS = {
    "Interested": "bg-blue text-blue-light border-blue",
    "Applied": "bg-purple text-purple-light border-purple",
    "Phone Screen": "bg-cyan text-cyan-light border-cyan",
    "Technical Interview": "bg-yellow text-yellow-light border-yellow",
    "Final Round": "bg-orange text-orange-light border-orange",
    "Offer Received": "bg-green text-green-light border-green",
    "Accepted": "bg-emerald text-emerald-light border-emerald",
    "Rejected": "bg-red text-red-light border-red",
    "No Reply": "bg-gray text-gray-light border-gray",
    "Ghosted": "bg-gray text-gray-light border-gray",
    "Withdrawn": "bg-slate text-slate-light border-slate"
};

let applications = [];
let filteredApplications = [];
let selectedIds = new Set();
let currentView = 'table';
let searchQuery = '';
let statusFilter = '';

// ===== LOCALSTORAGE =====
function saveToLocalStorage() {
    localStorage.setItem('jobTrackerApplications', JSON.stringify(applications));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('jobTrackerApplications');
    if (saved) {
        applications = JSON.parse(saved);
    }
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateDaysSince(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// ===== ANALYTICS =====
function calculateStats() {
    const total = applications.length;
    const statusCounts = {};

    STATUS_OPTIONS.forEach(status => {
        statusCounts[status] = applications.filter(app => app.status === status).length;
    });

    const responded = applications.filter(app =>
        ['Phone Screen', 'Technical Interview', 'Final Round', 'Offer Received', 'Accepted'].includes(app.status)
    ).length;

    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return { total, statusCounts, responseRate };
}

function calculateFollowUps() {
    return applications.filter(app => {
        if (app.status !== 'Applied' && app.status !== 'No Reply') return false;
        const daysSince = calculateDaysSince(app.dateApplied);
        return daysSince !== null && daysSince >= 14;
    });
}

// ===== RENDER FUNCTIONS =====
function renderDashboard() {
    const stats = calculateStats();
    const followUps = calculateFollowUps();
    const container = document.getElementById('dashboard-stats');

    let html = '<div class="stats-grid">';

    // Stat cards
    html += `
        <div class="stat-card glass-hover glow-card">
            <div class="stat-gradient" style="background: linear-gradient(to bottom right, var(--primary), var(--purple));"></div>
            <div class="stat-content">
                <p class="stat-title">Total Tracked</p>
                <p class="stat-value">${stats.total}</p>
            </div>
        </div>
        <div class="stat-card glass-hover glow-card">
            <div class="stat-gradient" style="background: linear-gradient(to bottom right, var(--purple), #ec4899);"></div>
            <div class="stat-content">
                <p class="stat-title">Applied</p>
                <p class="stat-value">${stats.statusCounts['Applied'] || 0}</p>
            </div>
        </div>
        <div class="stat-card glass-hover glow-card">
            <div class="stat-gradient" style="background: linear-gradient(to bottom right, var(--yellow), var(--orange));"></div>
            <div class="stat-content">
                <p class="stat-title">Interviewing</p>
                <p class="stat-value">${(stats.statusCounts['Phone Screen'] || 0) + (stats.statusCounts['Technical Interview'] || 0) + (stats.statusCounts['Final Round'] || 0)}</p>
            </div>
        </div>
        <div class="stat-card glass-hover glow-card">
            <div class="stat-gradient" style="background: linear-gradient(to bottom right, var(--green), var(--emerald));"></div>
            <div class="stat-content">
                <p class="stat-title">Response Rate</p>
                <p class="stat-value">${stats.responseRate}%</p>
            </div>
        </div>
    `;

    html += '</div>';

    // Status breakdown
    html += '<div class="status-breakdown"><h3>Status Breakdown</h3><div class="status-grid">';
    Object.entries(stats.statusCounts).forEach(([status, count]) => {
        if (count > 0) {
            const colorClass = getStatusColorClass(status);
            html += `
                <div class="status-item">
                    <span class="status-badge ${colorClass}">${status}</span>
                    <span class="status-count">${count}</span>
                </div>
            `;
        }
    });
    html += '</div></div>';

    // Follow-ups
    if (followUps.length > 0) {
        html += `
            <div class="follow-up-alert">
                <div class="follow-up-header">
                    <svg class="icon" style="color: var(--warning);" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <h3>Follow-up Needed</h3>
                </div>
                <p class="follow-up-text">${followUps.length} application${followUps.length !== 1 ? 's' : ''} with no reply for 14+ days</p>
                <div class="follow-up-list">
                    ${followUps.slice(0, 3).map(app => `
                        <div class="follow-up-item">• <strong>${app.company}</strong> - ${app.jobTitle}</div>
                    `).join('')}
                    ${followUps.length > 3 ? `<div class="follow-up-item" style="color: var(--muted); font-style: italic;">+${followUps.length - 3} more...</div>` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function getStatusColorClass(status) {
    const colorMap = {
        "Interested": "bg-blue text-blue-light border-blue",
        "Applied": "bg-purple text-purple-light border-purple",
        "Phone Screen": "bg-cyan text-cyan-light border-cyan",
        "Technical Interview": "bg-yellow text-yellow-light border-yellow",
        "Final Round": "bg-orange text-orange-light border-orange",
        "Offer Received": "bg-green text-green-light border-green",
        "Accepted": "bg-emerald text-emerald-light border-emerald",
        "Rejected": "bg-red text-red-light border-red",
        "No Reply": "bg-gray text-gray-light border-gray",
        "Ghosted": "bg-gray text-gray-light border-gray",
        "Withdrawn": "bg-slate text-slate-light border-slate"
    };
    return colorMap[status] || '';
}

function filterApplications() {
    filteredApplications = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.notes?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = !statusFilter || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
}

function renderTableView() {
    filterApplications();
    const wrapper = document.getElementById('applications-table-wrapper');

    if (applications.length === 0 && !searchQuery && !statusFilter) {
        // Empty state
        wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 class="empty-title">Start Tracking Your Applications</h3>
                <p class="empty-text">Add your first job application to get started. You can track company, job title, status, and more!</p>
                <div class="empty-actions">
                    <button onclick="addNewApplication()" class="add-btn" style="justify-content: center;">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Your First Application</span>
                    </button>
                    <p style="font-size: 0.875rem; color: var(--muted);">
                        Or press <kbd class="kbd">Cmd/Ctrl + K</kbd> to quick-add
                    </p>
                </div>
                <div class="empty-tips">
                    <p>Quick Tips:</p>
                    <ul>
                        <li>• Click any cell to edit inline</li>
                        <li>• Use Tab to navigate between fields</li>
                        <li>• Track interview dates and follow-ups</li>
                        <li>• Export to JSON anytime</li>
                    </ul>
                </div>
            </div>
        `;
        return;
    }

    if (filteredApplications.length === 0) {
        wrapper.innerHTML = `
            <div class="table-wrapper">
                <table class="applications-table">
                    <thead><tr>
                        <th><input type="checkbox" disabled></th>
                        <th>Company</th><th>Job Title</th><th>Salary</th><th>Status</th>
                        <th>Link</th><th>Date Applied</th><th>Notes</th><th></th>
                    </tr></thead>
                    <tbody>
                        <tr><td colspan="9" style="text-align: center; padding: 3rem; color: var(--muted);">
                            No applications found. Try adjusting your filters.
                        </td></tr>
                    </tbody>
                </table>
            </div>
        `;
        return;
    }

    let html = '<div class="table-wrapper"><table class="applications-table"><thead><tr>';
    html += `
        <th><input type="checkbox" id="select-all" ${filteredApplications.length > 0 && selectedIds.size === filteredApplications.length ? 'checked' : ''}></th>
        <th>Company</th>
        <th>Job Title</th>
        <th>Salary</th>
        <th>Status</th>
        <th>Link</th>
        <th>Date Applied</th>
        <th>Notes</th>
        <th></th>
    `;
    html += '</tr></thead><tbody>';

    filteredApplications.forEach(app => {
        html += `
            <tr>
                <td><input type="checkbox" class="row-checkbox" data-id="${app.id}" ${selectedIds.has(app.id) ? 'checked' : ''}></td>
                <td><div class="editable-cell" contenteditable="true" data-id="${app.id}" data-field="company">${app.company || ''}</div></td>
                <td><div class="editable-cell" contenteditable="true" data-id="${app.id}" data-field="jobTitle">${app.jobTitle || ''}</div></td>
                <td><div class="editable-cell" contenteditable="true" data-id="${app.id}" data-field="salary">${app.salary || ''}</div></td>
                <td>
                    <select class="status-select" data-id="${app.id}" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem; color: var(--foreground);">
                        ${STATUS_OPTIONS.map(status => `<option value="${status}" ${app.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                </td>
                <td>${app.link ? `<a href="${app.link}" target="_blank" class="cell-link">Link</a>` : '<div class="editable-cell" contenteditable="true" data-id="' + app.id + '" data-field="link"></div>'}</td>
                <td><input type="date" class="form-input" style="background: transparent; border: none; padding: 0.25rem; font-size: 0.875rem;" data-id="${app.id}" data-field="dateApplied" value="${app.dateApplied ? new Date(app.dateApplied).toISOString().split('T')[0] : ''}"></td>
                <td><div class="editable-cell" contenteditable="true" data-id="${app.id}" data-field="notes">${app.notes || ''}</div></td>
                <td>
                    <div class="row-actions">
                        <button class="icon-btn delete" onclick="deleteApplication('${app.id}')" title="Delete">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    wrapper.innerHTML = html;

    // Attach event listeners
    attachTableEventListeners();
}

function attachTableEventListeners() {
    // Select all checkbox
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedIds = new Set(filteredApplications.map(app => app.id));
            } else {
                selectedIds.clear();
            }
            updateBulkActionsBar();
            renderTableView();
        });
    }

    // Row checkboxes
    document.querySelectorAll('.row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                selectedIds.add(id);
            } else {
                selectedIds.delete(id);
            }
            updateBulkActionsBar();
            renderTableView();
        });
    });

    // Editable cells
    document.querySelectorAll('.editable-cell').forEach(cell => {
        cell.addEventListener('blur', (e) => {
            const id = e.target.dataset.id;
            const field = e.target.dataset.field;
            const value = e.target.textContent.trim();
            updateApplicationField(id, field, value);
        });
    });

    // Status selects
    document.querySelectorAll('.status-select[data-id]').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            updateApplicationField(id, 'status', e.target.value);
        });
    });

    // Date inputs
    document.querySelectorAll('input[type="date"][data-id]').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            updateApplicationField(id, 'dateApplied', e.target.value);
        });
    });
}

function renderBoardView() {
    filterApplications();
    const container = document.getElementById('kanban-board');

    const columns = [
        'Interested',
        'Applied',
        'Phone Screen',
        'Technical Interview',
        'Final Round',
        'Offer Received',
        'Rejected'
    ];

    let html = '';
    columns.forEach(status => {
        const cards = filteredApplications.filter(app => app.status === status);
        html += `
            <div class="kanban-column" data-status="${status}">
                <div class="kanban-column-header">
                    <span class="kanban-column-title">${status}</span>
                    <span class="kanban-column-count">${cards.length}</span>
                </div>
                <div class="kanban-cards" data-status="${status}">
                    ${cards.map(app => `
                        <div class="kanban-card" draggable="true" data-id="${app.id}">
                            <div class="kanban-card-company">${app.company}</div>
                            <div class="kanban-card-title">${app.jobTitle}</div>
                            ${app.salary ? `<div class="kanban-card-title">${app.salary}</div>` : ''}
                            <div class="kanban-card-footer">
                                <div class="kanban-card-date">${app.dateApplied ? formatDate(app.dateApplied) : 'No date'}</div>
                                <div class="kanban-card-actions">
                                    <button class="icon-btn delete" onclick="deleteApplication('${app.id}')" title="Delete">
                                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    attachDragAndDropListeners();
}

function attachDragAndDropListeners() {
    let draggedElement = null;

    document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.classList.add('dragging');
        });

        card.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });

    document.querySelectorAll('.kanban-cards').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement) {
                const newStatus = column.dataset.status;
                const id = draggedElement.dataset.id;
                updateApplicationField(id, 'status', newStatus);
                showToast('Status updated successfully', 'success');
            }
        });
    });
}

function updateBulkActionsBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const countEl = document.getElementById('selected-count');

    if (selectedIds.size > 0) {
        bar.style.display = 'flex';
        countEl.textContent = `${selectedIds.size} selected`;
    } else {
        bar.style.display = 'none';
    }
}

// ===== CRUD OPERATIONS =====
function addNewApplication() {
    const newApp = {
        id: generateId(),
        company: 'New Company',
        jobTitle: 'Position',
        status: 'Interested',
        dateApplied: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    applications.unshift(newApp);
    saveToLocalStorage();
    renderCurrentView();
    renderDashboard();
    showToast('Application added', 'success');
}

function updateApplicationField(id, field, value) {
    const app = applications.find(a => a.id === id);
    if (app) {
        app[field] = value;
        app.updatedAt = new Date().toISOString();
        saveToLocalStorage();
        renderCurrentView();
        renderDashboard();
    }
}

function deleteApplication(id) {
    if (confirm('Delete this application?')) {
        applications = applications.filter(app => app.id !== id);
        selectedIds.delete(id);
        saveToLocalStorage();
        renderCurrentView();
        renderDashboard();
        updateBulkActionsBar();
        showToast('Application deleted', 'success');
    }
}

function bulkDeleteApplications() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} application(s)?`)) return;

    applications = applications.filter(app => !selectedIds.has(app.id));
    selectedIds.clear();
    saveToLocalStorage();
    renderCurrentView();
    renderDashboard();
    updateBulkActionsBar();
    showToast(`Deleted ${selectedIds.size} application(s)`, 'success');
}

function bulkUpdateStatus(status) {
    if (selectedIds.size === 0) return;

    applications.forEach(app => {
        if (selectedIds.has(app.id)) {
            app.status = status;
            app.updatedAt = new Date().toISOString();
        }
    });

    saveToLocalStorage();
    selectedIds.clear();
    renderCurrentView();
    renderDashboard();
    updateBulkActionsBar();
    showToast(`Updated ${selectedIds.size} application(s)`, 'success');
}

// ===== VIEW MANAGEMENT =====
function switchView(view) {
    currentView = view;

    document.getElementById('table-view').style.display = view === 'table' ? 'block' : 'none';
    document.getElementById('board-view').style.display = view === 'board' ? 'block' : 'none';

    document.getElementById('table-view-btn').classList.toggle('active', view === 'table');
    document.getElementById('board-view-btn').classList.toggle('active', view === 'board');

    renderCurrentView();
}

function renderCurrentView() {
    if (currentView === 'table') {
        renderTableView();
    } else {
        renderBoardView();
    }
}

// ===== IMPORT/EXPORT =====
function exportApplications() {
    const dataStr = JSON.stringify(applications, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Applications exported', 'success');
}

function importApplications(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                applications = imported;
                saveToLocalStorage();
                renderCurrentView();
                renderDashboard();
                showToast(`Imported ${imported.length} application(s)`, 'success');
            } else {
                showToast('Invalid file format', 'error');
            }
        } catch (error) {
            showToast('Error importing file', 'error');
        }
    };
    reader.readAsText(file);
}

// ===== MODALS =====
function openQuickAddModal() {
    document.getElementById('quick-add-modal').style.display = 'flex';
    document.getElementById('qa-company').focus();
}

function closeQuickAddModal() {
    document.getElementById('quick-add-modal').style.display = 'none';
    document.getElementById('quick-add-form').reset();
}

function openHelpModal() {
    document.getElementById('help-modal').style.display = 'flex';
}

function closeHelpModal() {
    document.getElementById('help-modal').style.display = 'none';
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? '<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
        : '<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>';

    toast.innerHTML = `${icon}<div class="toast-message">${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderDashboard();
    renderCurrentView();

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCurrentView();
    });

    // Status filter
    document.getElementById('status-filter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        renderCurrentView();
    });

    // View toggle
    document.getElementById('table-view-btn').addEventListener('click', () => switchView('table'));
    document.getElementById('board-view-btn').addEventListener('click', () => switchView('board'));

    // Import/Export
    document.getElementById('export-btn').addEventListener('click', exportApplications);
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importApplications(e.target.files[0]);
        }
    });

    // Add button
    document.getElementById('add-application-btn').addEventListener('click', addNewApplication);

    // FAB
    document.getElementById('fab').addEventListener('click', openQuickAddModal);

    // Quick Add Modal
    document.getElementById('help-btn').addEventListener('click', openHelpModal);
    document.getElementById('quick-add-close').addEventListener('click', closeQuickAddModal);
    document.getElementById('quick-add-cancel').addEventListener('click', closeQuickAddModal);
    document.getElementById('help-close').addEventListener('click', closeHelpModal);

    document.getElementById('quick-add-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            id: generateId(),
            company: document.getElementById('qa-company').value,
            jobTitle: document.getElementById('qa-jobtitle').value,
            status: document.getElementById('qa-status').value,
            link: document.getElementById('qa-link').value || null,
            salary: document.getElementById('qa-salary').value || null,
            dateApplied: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        applications.unshift(formData);
        saveToLocalStorage();
        renderCurrentView();
        renderDashboard();
        closeQuickAddModal();
        showToast('Application added', 'success');
    });

    // Bulk actions
    document.getElementById('bulk-delete-btn').addEventListener('click', bulkDeleteApplications);
    document.getElementById('clear-selection-btn').addEventListener('click', () => {
        selectedIds.clear();
        updateBulkActionsBar();
        renderCurrentView();
    });
    document.getElementById('bulk-status-select').addEventListener('change', (e) => {
        if (e.target.value) {
            bulkUpdateStatus(e.target.value);
            e.target.value = '';
        }
    });

    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            closeQuickAddModal();
            closeHelpModal();
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + K - Quick Add
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openQuickAddModal();
        }

        // / - Focus search
        if (e.key === '/' && !e.target.matches('input, textarea, [contenteditable]')) {
            e.preventDefault();
            document.getElementById('search-input').focus();
        }

        // ? - Show help
        if (e.key === '?' && !e.target.matches('input, textarea, [contenteditable]')) {
            e.preventDefault();
            openHelpModal();
        }

        // Escape - Close modals
        if (e.key === 'Escape') {
            closeQuickAddModal();
            closeHelpModal();
        }
    });

    // Initialize visual effects
    // Flow field background
    if (typeof initFlowFieldBackground === 'function') {
        initFlowFieldBackground();
    }

    // Glowing effects on stat cards (after dashboard is rendered)
    setTimeout(() => {
        if (typeof initGlowingEffects === 'function') {
            initGlowingEffects();
        }
    }, 100);
});

