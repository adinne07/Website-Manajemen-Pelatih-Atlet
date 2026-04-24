// Super Admin Dashboard JavaScript

let allKontigen = [];
let allAdmins = [];
let activityLog = [];
let currentMonitoringTab = 'pelatih';

document.addEventListener('DOMContentLoaded', function() {
  loadUserInfo();
  loadAllData();
  renderDashboard();
  setupEventListeners();
});

// Load user info
function loadUserInfo() {
  const userEmail = localStorage.getItem('userEmail') || 'Unknown';
  const userName = localStorage.getItem('userName') || 'Super Admin';
  document.getElementById('userInfo').textContent = userName + ' (' + userEmail + ')';
}

// Load all data from localStorage
function loadAllData() {
  // Load all kontingen
  const kontigenData = localStorage.getItem('kontigenData');
  if (kontigenData) {
    allKontigen = JSON.parse(kontigenData);
  }

  // Load activity log
  const savedLog = localStorage.getItem('activityLog');
  if (savedLog) {
    activityLog = JSON.parse(savedLog);
  }

  // Load admins
  const savedAdmins = localStorage.getItem('systemAdmins');
  if (savedAdmins) {
    allAdmins = JSON.parse(savedAdmins);
  } else {
    // Default admins
    allAdmins = [
      { username: 'admin', password: '12345', name: 'Admin Pelatih', kontingen: '' },
      { username: 'pelatih', password: 'password123', name: 'Pelatih', kontingen: '' }
    ];
    saveAdmins();
  }
}

// Save data
function saveAllData() {
  localStorage.setItem('kontigenData', JSON.stringify(allKontigen));
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

function saveAdmins() {
  localStorage.setItem('systemAdmins', JSON.stringify(allAdmins));
}

// Log activity
function logActivity(type, description, detail = '') {
  const log = {
    id: Date.now(),
    timestamp: new Date().toLocaleString('id-ID'),
    admin: localStorage.getItem('userEmail'),
    type: type,
    description: description,
    detail: detail
  };

  activityLog.unshift(log);
  // Keep only last 100 logs
  if (activityLog.length > 100) {
    activityLog = activityLog.slice(0, 100);
  }

  saveAllData();
}

// Setup event listeners
function setupEventListeners() {
  const addAdminForm = document.getElementById('addAdminForm');
  if (addAdminForm) {
    addAdminForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addNewAdmin();
    });
  }
}

// ===== PAGE SWITCHING =====
function switchPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Remove active from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected page
  const page = document.getElementById(pageName);
  if (page) {
    page.classList.add('active');
  }

  // Mark nav item active
  event.target.classList.add('active');

  // Render content
  switch(pageName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'kontingen':
      renderKontigenManagement();
      break;
    case 'admin':
      renderAdminManagement();
      break;
    case 'monitoring':
      renderMonitoring();
      break;
    case 'activity':
      renderActivityLog();
      break;
  }
}

// ===== DASHBOARD =====
function renderDashboard() {
  // Calculate statistics
  let totalPelatih = 0;
  let totalAtlet = 0;

  allKontigen.forEach(k => {
    const data = localStorage.getItem('kontingen_' + k.code);
    if (data) {
      const parsed = JSON.parse(data);
      totalPelatih += (parsed.pelatih || []).length;
      totalAtlet += (parsed.atlet || []).length;
    }
  });

  // Update stat cards
  document.getElementById('totalKontingen').textContent = allKontigen.length;
  document.getElementById('totalPelatih').textContent = totalPelatih;
  document.getElementById('totalAtlet').textContent = totalAtlet;
  document.getElementById('totalAdmin').textContent = allAdmins.length;

  // Render recent activity
  renderRecentActivity();
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivity');
  container.innerHTML = '';

  if (activityLog.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada aktivitas</div>';
    return;
  }

  activityLog.slice(0, 10).forEach(log => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-time">${log.timestamp}</div>
      <div class="activity-title">${log.admin} - ${log.type}</div>
      <div class="activity-desc">${log.description}</div>
    `;
    container.appendChild(item);
  });
}

// ===== KONTINGEN MANAGEMENT =====
function renderKontigenManagement() {
  const container = document.getElementById('kontiigenList');
  container.innerHTML = '';

  if (allKontigen.length === 0) {
    container.innerHTML = '<div class="empty-state">Tidak ada kontingen</div>';
    return;
  }

  allKontigen.forEach(kontigen => {
    // Get kontingen data
    const data = localStorage.getItem('kontingen_' + kontigen.code);
    let pelatih = 0, atlet = 0;
    
    if (data) {
      const parsed = JSON.parse(data);
      pelatih = (parsed.pelatih || []).length;
      atlet = (parsed.atlet || []).length;
    }

    const item = document.createElement('div');
    item.className = 'kontingen-item';
    item.innerHTML = `
      <div class="kontingen-info">
        <h4>${kontigen.name}</h4>
        <p><strong>Kode:</strong> ${kontigen.code}</p>
        <p><strong>Pemilik:</strong> ${kontigen.owner}</p>
        <p><strong>Pelatih:</strong> ${pelatih} | <strong>Atlet:</strong> ${atlet}</p>
        <p style="font-size: 12px; color: #999;">Dibuat: ${kontigen.created}</p>
      </div>
      <div class="kontingen-actions">
        <button class="btn-secondary" onclick="viewKontigenDetail('${kontigen.code}')">View</button>
        <button class="btn-danger" onclick="deleteKontigen('${kontigen.code}')">Delete</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function deleteKontigen(code) {
  if (confirm('Yakin ingin menghapus kontingen ini? Data akan hilang!')) {
    allKontigen = allKontigen.filter(k => k.code !== code);
    localStorage.removeItem('kontingen_' + code);
    saveAllData();
    logActivity('delete', `Menghapus kontingen ${code}`);
    renderKontigenManagement();
    alert('✅ Kontingen dihapus');
  }
}

// ===== ADMIN MANAGEMENT =====
function renderAdminManagement() {
  const tbody = document.getElementById('adminList');
  tbody.innerHTML = '';

  if (allAdmins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada admin</td></tr>';
    return;
  }

  allAdmins.forEach(admin => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${admin.username}</td>
      <td>${admin.name}</td>
      <td><span style="background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px;">Active</span></td>
      <td>${admin.kontingen || '-'}</td>
      <td>
        <button class="btn-secondary" onclick="editAdmin('${admin.username}')" style="margin-right: 5px;">Edit</button>
        <button class="btn-danger" onclick="deleteAdmin('${admin.username}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function openAddAdminModal() {
  document.getElementById('addAdminForm').reset();
  document.getElementById('addAdminModal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function addNewAdmin() {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const name = document.getElementById('newName').value;

  if (!username || !password || !name) {
    alert('Semua field harus diisi!');
    return;
  }

  // Check if username already exists
  if (allAdmins.find(a => a.username === username)) {
    alert('Username sudah terdaftar!');
    return;
  }

  const newAdmin = {
    username: username,
    password: password,
    name: name,
    kontingen: ''
  };

  allAdmins.push(newAdmin);
  saveAdmins();
  logActivity('create', `Menambahkan admin baru: ${username}`);
  
  closeModal('addAdminModal');
  renderAdminManagement();
  alert('✅ Admin baru ditambahkan');
}

function deleteAdmin(username) {
  if (confirm('Yakin ingin menghapus admin ini?')) {
    allAdmins = allAdmins.filter(a => a.username !== username);
    saveAdmins();
    logActivity('delete', `Menghapus admin: ${username}`);
    renderAdminManagement();
    alert('✅ Admin dihapus');
  }
}

// ===== MONITORING =====
function renderMonitoring() {
  switchMonitoringTab('pelatih');
}

function switchMonitoringTab(tab) {
  currentMonitoringTab = tab;
  
  // Update button active state
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Render content
  const container = document.getElementById('monitoringContent');
  container.innerHTML = '';

  let html = '';

  if (tab === 'pelatih') {
    html = '<h3>📊 Daftar Semua Pelatih</h3><table class="admin-table"><thead><tr><th>Kontingen</th><th>Nama</th><th>Usia</th><th>TTL</th></tr></thead><tbody>';
    
    allKontigen.forEach(k => {
      const data = localStorage.getItem('kontingen_' + k.code);
      if (data) {
        const parsed = JSON.parse(data);
        (parsed.pelatih || []).forEach(p => {
          html += `<tr><td>${k.name}</td><td>${p.nama}</td><td>${p.usia || '-'}</td><td>${p.ttl || '-'}</td></tr>`;
        });
      }
    });

    html += '</tbody></table>';
  } else if (tab === 'atlet') {
    html = '<h3>📊 Daftar Semua Atlet</h3><table class="admin-table"><thead><tr><th>Kontingen</th><th>Nama</th><th>Usia</th><th>TTL</th></tr></thead><tbody>';
    
    allKontigen.forEach(k => {
      const data = localStorage.getItem('kontingen_' + k.code);
      if (data) {
        const parsed = JSON.parse(data);
        (parsed.atlet || []).forEach(a => {
          html += `<tr><td>${k.name}</td><td>${a.nama}</td><td>${a.usia || '-'}</td><td>${a.ttl || '-'}</td></tr>`;
        });
      }
    });

    html += '</tbody></table>';
  } else if (tab === 'absensi') {
    html = '<h3>📊 Ringkasan Absensi</h3><table class="admin-table"><thead><tr><th>Kontingen</th><th>Total Record</th></tr></thead><tbody>';
    
    allKontigen.forEach(k => {
      const data = localStorage.getItem('kontingen_' + k.code);
      if (data) {
        const parsed = JSON.parse(data);
        const total = Object.keys(parsed.absensi || {}).length;
        html += `<tr><td>${k.name}</td><td>${total}</td></tr>`;
      }
    });

    html += '</tbody></table>';
  }

  container.innerHTML = html;
}

// ===== ACTIVITY LOG =====
function renderActivityLog() {
  const tbody = document.getElementById('activityLog');
  tbody.innerHTML = '';

  if (activityLog.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada log aktivitas</td></tr>';
    return;
  }

  activityLog.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.timestamp}</td>
      <td>${log.admin}</td>
      <td>${log.type}</td>
      <td>${log.description}</td>
      <td><small>${log.detail}</small></td>
    `;
    tbody.appendChild(row);
  });
}

function filterActivity() {
  const date = document.getElementById('filterDate').value;
  const type = document.getElementById('filterType').value;

  const filtered = activityLog.filter(log => {
    const logDate = log.timestamp.split(' ')[0];
    const matchDate = !date || logDate === date;
    const matchType = !type || log.type === type;
    return matchDate && matchType;
  });

  const tbody = document.getElementById('activityLog');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada log yang sesuai</td></tr>';
    return;
  }

  filtered.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.timestamp}</td>
      <td>${log.admin}</td>
      <td>${log.type}</td>
      <td>${log.description}</td>
      <td><small>${log.detail}</small></td>
    `;
    tbody.appendChild(row);
  });
}

// ===== EXPORT DATA =====
function exportData(type, format) {
  let data = [];
  let filename = `export_${type}_${new Date().getTime()}`;

  if (type === 'atlet') {
    allKontigen.forEach(k => {
      const kontigenData = localStorage.getItem('kontingen_' + k.code);
      if (kontigenData) {
        const parsed = JSON.parse(kontigenData);
        (parsed.atlet || []).forEach(a => {
          data.push({
            'Kontingen': k.name,
            'Nama': a.nama,
            'Usia': a.usia,
            'TTL': a.ttl,
            'Prestasi': a.prestasi
          });
        });
      }
    });
  } else if (type === 'jadwal') {
    allKontigen.forEach(k => {
      const kontigenData = localStorage.getItem('kontingen_' + k.code);
      if (kontigenData) {
        const parsed = JSON.parse(kontigenData);
        (parsed.jadwal || []).forEach(j => {
          data.push({
            'Kontingen': k.name,
            'Nama Pertandingan': j.nama,
            'Tanggal': j.tanggal,
            'Jam': j.jam,
            'Tempat': j.tempat
          });
        });
      }
    });
  }

  if (format === 'csv') {
    exportCSV(data, filename);
  } else if (format === 'excel') {
    exportExcel(data, filename);
  }

  logActivity('export', `Export ${type} ke ${format}`);
}

function exportCSV(data, filename) {
  if (data.length === 0) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';

  data.forEach(row => {
    const values = headers.map(h => `"${row[h] || ''}"`);
    csv += values.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '.csv';
  link.click();
}

function exportExcel(data, filename) {
  if (data.length === 0) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  // Simple Excel-like format (CSV with .xls extension)
  const headers = Object.keys(data[0]);
  let content = headers.join('\t') + '\n';

  data.forEach(row => {
    const values = headers.map(h => row[h] || '');
    content += values.join('\t') + '\n';
  });

  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '.xls';
  link.click();
}

// ===== SETTINGS =====
function backupData() {
  const backup = {
    kontigen: allKontigen,
    admins: allAdmins,
    activity: activityLog,
    timestamp: new Date().toLocaleString('id-ID')
  };

  // Backup all kontingen data
  allKontigen.forEach(k => {
    backup['kontingen_' + k.code] = localStorage.getItem('kontingen_' + k.code);
  });

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'athlete_backup_' + Date.now() + '.json';
  link.click();

  logActivity('backup', 'Backup data sistem');
  alert('✅ Backup berhasil didownload');
}

function restoreData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
      try {
        const backup = JSON.parse(event.target.result);
        
        // Restore data
        allKontigen = backup.kontigen || [];
        allAdmins = backup.admins || [];
        activityLog = backup.activity || [];

        saveAllData();
        saveAdmins();

        // Restore kontingen data
        Object.keys(backup).forEach(key => {
          if (key.startsWith('kontingen_')) {
            localStorage.setItem(key, backup[key]);
          }
        });

        logActivity('restore', 'Restore data dari backup');
        alert('✅ Data berhasil di-restore');
        location.reload();
      } catch (error) {
        alert('❌ Error membaca file backup: ' + error.message);
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

function clearOldLogs() {
  if (confirm('Yakin ingin menghapus log aktivitas lama? (Keep 50 terbaru)')) {
    if (activityLog.length > 50) {
      activityLog = activityLog.slice(0, 50);
      saveAllData();
      logActivity('system', 'Membersihkan log lama');
      alert('✅ Log lama dihapus');
    } else {
      alert('Tidak ada log yang perlu dihapus');
    }
  }
}

function clearAllData() {
  if (confirm('⚠️ PERHATIAN: Ini akan menghapus SEMUA data!\n\nApakah Anda yakin?')) {
    if (confirm('Ini adalah operasi terakhir! Tekan OK untuk mengkonfirmasi.')) {
      localStorage.clear();
      alert('✅ Semua data dihapus. Halaman akan di-reload...');
      location.reload();
    }
  }
}

// ===== UTILITIES =====
function logout() {
  if (confirm('Yakin ingin logout?')) {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '../login/login.html';
  }
}
