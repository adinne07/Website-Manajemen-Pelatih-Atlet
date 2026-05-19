
let allKontigen = [];
let allAdmins = [];
let activityLog = [];
let currentMonitoringTab = 'pelatih';

const IU_ONLINE_TIMEOUT = 30000;

// =========================================================
// NOTIFICATION HELPER
// =========================================================

function notify(message, type = 'info', duration = 2200) {
  if (typeof showToast === 'function') {
    return showToast(message, type, duration);
  }

  alert(message);
  return Promise.resolve(true);
}

function askConfirm(message) {
  if (typeof customConfirm === 'function') {
    return customConfirm(message);
  }

  return Promise.resolve(confirm(message));
}

// =========================================================
// AUTH CHECK
// =========================================================

function checkSuperAdminAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');
  const userUsername = localStorage.getItem('userUsername');

  if (isLoggedIn !== 'true' || (!userEmail && !userUsername)) {
    notify('Silakan login terlebih dahulu.', 'error', 1200)
      .then(function () {
        window.location.href = '../auth/login.html';
      });

    return false;
  }

  if (userRole !== 'superadmin' && userUsername !== 'superadmin') {
    notify('Akses ditolak! Halaman ini hanya untuk Super Admin.', 'error', 1400)
      .then(function () {
        window.location.href = '../admin/home.html';
      });

    return false;
  }

  return true;
}

// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener('DOMContentLoaded', function () {
  if (!checkSuperAdminAuth()) return;

  loadUserInfo();
  loadAllData();
  setupEventListeners();
  renderDashboard();

  setInterval(function () {
    const activePage = document.querySelector('.page.active');

    if (activePage && activePage.id === 'admin') {
      renderAdminManagement();
    }
  }, 3000);
});

// =========================================================
// USER INFO
// =========================================================

function loadUserInfo() {
  const userInfo = document.getElementById('userInfo');

  if (!userInfo) return;

  const userEmail = localStorage.getItem('userEmail') || 'superadmin@atlet.local';
  const userName = localStorage.getItem('userName') || 'Super Admin';

  userInfo.textContent = `${userName} (${userEmail})`;
}

// =========================================================
// LOAD & SAVE DATA
// =========================================================

function loadAllData() {
  const savedKontigen = localStorage.getItem('kontigenData');
  const savedActivity = localStorage.getItem('activityLog');

  try {
    allKontigen = savedKontigen ? JSON.parse(savedKontigen) : [];
  } catch (error) {
    allKontigen = [];
  }

  try {
    activityLog = savedActivity ? JSON.parse(savedActivity) : [];
  } catch (error) {
    activityLog = [];
  }

  loadAllAdmins();
}

function saveAllData() {
  localStorage.setItem('kontigenData', JSON.stringify(allKontigen));
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

function saveAdmins() {
  const customAdmins = allAdmins.filter(function (admin) {
    return admin.source === 'system';
  });

  localStorage.setItem('systemAdmins', JSON.stringify(customAdmins));
}

// =========================================================
// ADMIN DATA
// =========================================================

function loadAllAdmins() {
  const defaultAdmins = [
    {
      username: 'admin',
      password: '12345',
      name: 'Admin Pelatih',
      email: 'admin@atlet.local',
      role: 'admin',
      kontingen: '',
      source: 'default'
    },
    {
      username: 'pelatih',
      password: 'password123',
      name: 'Pelatih',
      email: 'pelatih@atlet.local',
      role: 'admin',
      kontingen: '',
      source: 'default'
    }
  ];

  const systemAdmins = JSON.parse(localStorage.getItem('systemAdmins')) || [];
  const registeredUsers = JSON.parse(localStorage.getItem('users')) || [];

  const normalizedSystemAdmins = systemAdmins.map(function (admin) {
    return {
      username: String(admin.username || '').toLowerCase(),
      password: String(admin.password || ''),
      name: admin.name || admin.fullname || admin.username,
      email: String(admin.email || admin.username || '').toLowerCase(),
      role: admin.role || 'admin',
      kontingen: admin.kontingen || '',
      source: 'system'
    };
  });

  const normalizedRegisteredUsers = registeredUsers.map(function (user) {
    return {
      username: String(user.username || '').toLowerCase(),
      password: String(user.password || ''),
      name: user.fullname || user.name || user.username,
      email: String(user.email || user.username || '').toLowerCase(),
      role: user.role || 'admin',
      kontingen: user.kontingen || '',
      source: 'register'
    };
  });

  const merged = [
    ...defaultAdmins,
    ...normalizedSystemAdmins,
    ...normalizedRegisteredUsers
  ];

  const unique = [];

  merged.forEach(function (admin) {
    if (!admin.username) return;

    const exists = unique.some(function (item) {
      return item.username === admin.username;
    });

    if (!exists) {
      unique.push(admin);
    }
  });

  allAdmins = unique;
}

// =========================================================
// EVENT LISTENERS
// =========================================================

function setupEventListeners() {
  const addAdminForm = document.getElementById('addAdminForm');

  if (addAdminForm) {
    addAdminForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addAdmin();
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

// =========================================================
// PAGE SWITCHING
// =========================================================

function switchPage(pageId) {
  loadAllData();

  document.querySelectorAll('.page').forEach(function (page) {
    page.classList.remove('active');
  });

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add('active');
  }

  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'kontingen') renderKontingenManagement();
  if (pageId === 'admin') renderAdminManagement();
  if (pageId === 'monitoring') renderMonitoring();
  if (pageId === 'activity') renderActivityLog();
}

// =========================================================
// DASHBOARD
// =========================================================

function renderDashboard() {
  loadAllData();

  const totalKontingen = document.getElementById('totalKontingen');
  const totalPelatih = document.getElementById('totalPelatih');
  const totalAtlet = document.getElementById('totalAtlet');
  const totalAdmin = document.getElementById('totalAdmin');

  let pelatihCount = 0;
  let atletCount = 0;

  allKontigen.forEach(function (kontigen) {
    const detail = getKontingenDetail(kontigen.code);

    pelatihCount += (detail.pelatih || []).length;
    atletCount += (detail.atlet || []).length;
  });

  if (totalKontingen) totalKontingen.textContent = allKontigen.length;
  if (totalPelatih) totalPelatih.textContent = pelatihCount;
  if (totalAtlet) totalAtlet.textContent = atletCount;
  if (totalAdmin) totalAdmin.textContent = allAdmins.length;

  renderRecentActivity();
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivity');

  if (!container) return;

  const recent = activityLog.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada aktivitas</div>';
    return;
  }

  container.innerHTML = recent.map(function (log) {
    return `
      <div class="activity-item">
        <div>
          <strong>${escapeHTML(log.description || '-')}</strong>
          <p>${escapeHTML(log.timestamp || '-')} - ${escapeHTML(log.admin || '-')}</p>
        </div>
        <span class="activity-type">${escapeHTML(log.type || 'info')}</span>
      </div>
    `;
  }).join('');
}

// =========================================================
// KONTINGEN MANAGEMENT
// =========================================================

function renderKontingenManagement() {
  const container = document.getElementById('kontiigenList');

  if (!container) return;

  loadAllData();

  if (allKontigen.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada kontingen</div>';
    return;
  }

  container.innerHTML = '';

  allKontigen.forEach(function (kontigen) {
    const detail = getKontingenDetail(kontigen.code);

    const item = document.createElement('div');
    item.className = 'kontingen-admin-card';

    item.innerHTML = `
      <div class="kontingen-admin-info">
        <h3>${escapeHTML(kontigen.name || '-')}</h3>
        <p><strong>Kode:</strong> ${escapeHTML(kontigen.code || '-')}</p>
        <p><strong>Pemilik:</strong> ${escapeHTML(kontigen.ownerName || kontigen.owner || '-')}</p>
        <p><strong>Alamat:</strong> ${escapeHTML(kontigen.address || '-')}</p>
        <p><strong>Jumlah Pelatih:</strong> ${(detail.pelatih || []).length}</p>
        <p><strong>Jumlah Atlet:</strong> ${(detail.atlet || []).length}</p>
      </div>

      <div class="kontingen-admin-actions">
        <button class="btn-danger" onclick="deleteKontingenBySuperAdmin(${kontigen.id})">
          🗑 Hapus
        </button>
      </div>
    `;

    container.appendChild(item);
  });
}

function deleteKontingenBySuperAdmin(id) {
  const kontigen = allKontigen.find(function (item) {
    return item.id === id;
  });

  if (!kontigen) {
    notify('Kontingen tidak ditemukan.', 'error');
    return;
  }

  askConfirm(`Yakin ingin menghapus kontingen "${kontigen.name}"? Semua data di dalamnya akan ikut terhapus.`)
    .then(function (confirmed) {
      if (!confirmed) return;

      allKontigen = allKontigen.filter(function (item) {
        return item.id !== id;
      });

      localStorage.removeItem('kontingen_' + kontigen.code);
      localStorage.setItem('kontigenData', JSON.stringify(allKontigen));

      logActivity('delete', `Super Admin menghapus kontingen: ${kontigen.name}`, `Kode: ${kontigen.code}`);

      renderKontingenManagement();
      renderDashboard();

      notify('Kontingen berhasil dihapus.', 'success');
    });
}

// =========================================================
// ADMIN MANAGEMENT
// =========================================================

function openAddAdminModal() {
  const modal = document.getElementById('addAdminModal');

  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);

  if (modal) {
    modal.classList.remove('show');
  }
}

function renderAdminManagement() {
  const tbody = document.getElementById('adminList');

  if (!tbody) return;

  loadAllData();

  if (allAdmins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada admin</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  allAdmins.forEach(function (admin) {
    const online = IU_isAdminOnline(admin);
    const onlineData = IU_findOnlineData(admin);

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${escapeHTML(admin.username || '-')}</td>
      <td>${escapeHTML(admin.name || '-')}</td>
      <td>
        <span class="status-badge ${online ? 'online' : 'offline'}">
          ${online ? 'Online' : 'Offline'}
        </span>
        <br>
        <small>${online ? 'Aktif sekarang' : 'Terakhir: ' + IU_formatLastSeen(onlineData?.lastSeen)}</small>
      </td>
      <td>${escapeHTML(admin.kontingen || '-')}</td>
      <td>
        ${
          admin.source === 'default'
            ? '<button disabled style="opacity: .5; cursor: not-allowed;">Default</button>'
            : `<button class="btn-danger" onclick="deleteAdmin('${escapeHTML(admin.username)}')">Hapus</button>`
        }
      </td>
    `;

    tbody.appendChild(row);
  });
}

function addAdmin() {
  const usernameInput = document.getElementById('newUsername');
  const passwordInput = document.getElementById('newPassword');
  const nameInput = document.getElementById('newName');

  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  const name = nameInput.value.trim();

  if (!username || !password || !name) {
    notify('Username, password, dan nama wajib diisi.', 'warning');
    return;
  }

  if (username.length < 3) {
    notify('Username minimal 3 karakter.', 'warning');
    return;
  }

  if (password.length < 5) {
    notify('Password minimal 5 karakter.', 'warning');
    return;
  }

  loadAllData();

  const exists = allAdmins.some(function (admin) {
    return admin.username === username;
  });

  if (exists || username === 'superadmin') {
    notify('Username sudah digunakan.', 'error');
    return;
  }

  const newAdmin = {
    id: Date.now(),
    username: username,
    password: password,
    name: name,
    email: username + '@atlet.local',
    role: 'admin',
    kontingen: '',
    source: 'system',
    createdAt: new Date().toISOString()
  };

  const systemAdmins = JSON.parse(localStorage.getItem('systemAdmins')) || [];
  systemAdmins.push(newAdmin);

  localStorage.setItem('systemAdmins', JSON.stringify(systemAdmins));

  logActivity('create', `Menambahkan admin baru: ${name}`, `Username: ${username}`);

  closeModal('addAdminModal');

  const form = document.getElementById('addAdminForm');

  if (form) {
    form.reset();
  }

  loadAllData();
  renderAdminManagement();
  renderDashboard();

  notify('Admin baru berhasil ditambahkan.', 'success');
}

function deleteAdmin(username) {
  if (username === 'admin' || username === 'pelatih') {
    notify('Admin default tidak bisa dihapus.', 'error');
    return;
  }

  askConfirm(`Yakin ingin menghapus admin "${username}"?`)
    .then(function (confirmed) {
      if (!confirmed) return;

      let systemAdmins = JSON.parse(localStorage.getItem('systemAdmins')) || [];
      let registeredUsers = JSON.parse(localStorage.getItem('users')) || [];
      let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];

      systemAdmins = systemAdmins.filter(function (admin) {
        return admin.username !== username;
      });

      registeredUsers = registeredUsers.filter(function (user) {
        return user.username !== username;
      });

      onlineUsers = onlineUsers.filter(function (user) {
        return user.username !== username;
      });

      localStorage.setItem('systemAdmins', JSON.stringify(systemAdmins));
      localStorage.setItem('users', JSON.stringify(registeredUsers));
      localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));

      logActivity('delete', `Menghapus admin: ${username}`);

      loadAllData();
      renderAdminManagement();
      renderDashboard();

      notify('Admin berhasil dihapus.', 'success');
    });
}

// =========================================================
// MONITORING
// =========================================================

function renderMonitoring() {
  switchMonitoringTab('pelatih');
}

function switchMonitoringTab(tab) {
  currentMonitoringTab = tab;

  document.querySelectorAll('.tab-button').forEach(function (btn) {
    btn.classList.remove('active');
  });

  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }

  const container = document.getElementById('monitoringContent');

  if (!container) return;

  loadAllData();

  let html = '';

  if (tab === 'pelatih') {
    html = `
      <h3>📊 Daftar Semua Pelatih</h3>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Kontingen</th>
            <th>Nama</th>
            <th>Usia</th>
            <th>TTL</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
    `;

    allKontigen.forEach(function (kontigen) {
      const detail = getKontingenDetail(kontigen.code);

      (detail.pelatih || []).forEach(function (pelatih) {
        html += `
          <tr>
            <td>${escapeHTML(kontigen.name || '-')}</td>
            <td>${escapeHTML(pelatih.nama || '-')}</td>
            <td>${escapeHTML(pelatih.usia || '-')}</td>
            <td>${escapeHTML(pelatih.ttl || '-')}</td>
            <td>${escapeHTML(pelatih.createdByName || pelatih.createdBy || '-')}</td>
          </tr>
        `;
      });
    });

    html += '</tbody></table>';
  }

  if (tab === 'atlet') {
    html = `
      <h3>📊 Daftar Semua Atlet</h3>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Kontingen</th>
            <th>Nama</th>
            <th>Usia</th>
            <th>TTL</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
    `;

    allKontigen.forEach(function (kontigen) {
      const detail = getKontingenDetail(kontigen.code);

      (detail.atlet || []).forEach(function (atlet) {
        html += `
          <tr>
            <td>${escapeHTML(kontigen.name || '-')}</td>
            <td>${escapeHTML(atlet.nama || '-')}</td>
            <td>${escapeHTML(atlet.usia || '-')}</td>
            <td>${escapeHTML(atlet.ttl || '-')}</td>
            <td>${escapeHTML(atlet.createdByName || atlet.createdBy || '-')}</td>
          </tr>
        `;
      });
    });

    html += '</tbody></table>';
  }

  if (tab === 'absensi') {
    html = `
      <h3>📊 Ringkasan Absensi</h3>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Kontingen</th>
            <th>Total Record</th>
          </tr>
        </thead>
        <tbody>
    `;

    allKontigen.forEach(function (kontigen) {
      const detail = getKontingenDetail(kontigen.code);
      const total = Object.keys(detail.absensi || {}).length;

      html += `
        <tr>
          <td>${escapeHTML(kontigen.name || '-')}</td>
          <td>${total}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
  }

  container.innerHTML = html;
}

// =========================================================
// ACTIVITY LOG
// =========================================================

function renderActivityLog() {
  const tbody = document.getElementById('activityLog');

  if (!tbody) return;

  loadAllData();

  if (activityLog.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada log aktivitas</td></tr>';
    return;
  }

  tbody.innerHTML = activityLog.map(function (log) {
    return `
      <tr>
        <td>${escapeHTML(log.timestamp || '-')}</td>
        <td>${escapeHTML(log.admin || '-')}</td>
        <td>${escapeHTML(log.type || '-')}</td>
        <td>${escapeHTML(log.description || '-')}</td>
        <td>${escapeHTML(log.detail || '-')}</td>
      </tr>
    `;
  }).join('');
}

function filterActivity() {
  const filterDate = document.getElementById('filterDate')?.value || '';
  const filterType = document.getElementById('filterType')?.value || '';
  const tbody = document.getElementById('activityLog');

  if (!tbody) return;

  loadAllData();

  let filtered = activityLog;

  if (filterType) {
    filtered = filtered.filter(function (log) {
      return log.type === filterType;
    });
  }

  if (filterDate) {
    const selectedDate = new Date(filterDate).toLocaleDateString('id-ID');

    filtered = filtered.filter(function (log) {
      return String(log.timestamp || '').includes(selectedDate);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada data sesuai filter</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (log) {
    return `
      <tr>
        <td>${escapeHTML(log.timestamp || '-')}</td>
        <td>${escapeHTML(log.admin || '-')}</td>
        <td>${escapeHTML(log.type || '-')}</td>
        <td>${escapeHTML(log.description || '-')}</td>
        <td>${escapeHTML(log.detail || '-')}</td>
      </tr>
    `;
  }).join('');
}

// =========================================================
// EXPORT DATA
// =========================================================

function exportData(type, format) {
  loadAllData();

  let data = [];
  let filename = `${type}_${Date.now()}`;

  allKontigen.forEach(function (kontigen) {
    const detail = getKontingenDetail(kontigen.code);

    if (type === 'atlet') {
      (detail.atlet || []).forEach(function (atlet) {
        data.push({
          Kontingen: kontigen.name || '',
          Nama: atlet.nama || '',
          Usia: atlet.usia || '',
          TTL: atlet.ttl || '',
          Prestasi: atlet.prestasi || '',
          DibuatOleh: atlet.createdByName || atlet.createdBy || ''
        });
      });
    }

    if (type === 'pelatih') {
      (detail.pelatih || []).forEach(function (pelatih) {
        data.push({
          Kontingen: kontigen.name || '',
          Nama: pelatih.nama || '',
          Usia: pelatih.usia || '',
          TTL: pelatih.ttl || '',
          Prestasi: pelatih.prestasi || '',
          DibuatOleh: pelatih.createdByName || pelatih.createdBy || ''
        });
      });
    }

    if (type === 'jadwal') {
      (detail.jadwal || []).forEach(function (jadwal) {
        data.push({
          Kontingen: kontigen.name || '',
          No: jadwal.no || '',
          NamaPertandingan: jadwal.nama || '',
          Tanggal: jadwal.tanggal || '',
          Jam: jadwal.jam || '',
          Tempat: jadwal.tempat || '',
          DibuatOleh: jadwal.createdByName || jadwal.createdBy || ''
        });
      });
    }

    if (type === 'program') {
      (detail.program || []).forEach(function (program) {
        data.push({
          Kontingen: kontigen.name || '',
          NamaProgram: program.nama || '',
          File: program.fileName || '',
          TanggalUpload: program.uploadDate || '',
          Deskripsi: program.desc || '',
          DibuatOleh: program.createdByName || program.createdBy || ''
        });
      });
    }

    if (type === 'absensi') {
      Object.keys(detail.absensi || {}).forEach(function (key) {
        const record = detail.absensi[key];

        data.push({
          Kontingen: kontigen.name || '',
          Key: key,
          Status: typeof record === 'string' ? record : record.status || '',
          DibuatOleh: typeof record === 'object' ? record.createdByName || record.createdBy || '' : ''
        });
      });
    }

    if (type === 'pengukuran') {
      data.push({
        Kontingen: kontigen.name || '',
        Keterangan: 'Data hasil tes pengukuran belum tersedia pada struktur data saat ini'
      });
    }
  });

  if (format === 'csv') {
    exportCSV(data, filename);
  } else {
    exportExcel(data, filename);
  }

  logActivity('export', `Export ${type} ke ${format}`);
}

function exportCSV(data, filename) {
  if (data.length === 0) {
    notify('Tidak ada data untuk di-export.', 'warning');
    return;
  }

  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';

  data.forEach(function (row) {
    const values = headers.map(function (header) {
      return `"${String(row[header] || '').replaceAll('"', '""')}"`;
    });

    csv += values.join(',') + '\n';
  });

  downloadTextFile(csv, filename + '.csv', 'text/csv;charset=utf-8;');
  notify('Data CSV berhasil didownload.', 'success');
}

function exportExcel(data, filename) {
  if (data.length === 0) {
    notify('Tidak ada data untuk di-export.', 'warning');
    return;
  }

  const headers = Object.keys(data[0]);
  let content = headers.join('\t') + '\n';

  data.forEach(function (row) {
    const values = headers.map(function (header) {
      return String(row[header] || '');
    });

    content += values.join('\t') + '\n';
  });

  downloadTextFile(content, filename + '.xls', 'application/vnd.ms-excel;charset=utf-8;');
  notify('Data Excel berhasil didownload.', 'success');
}

function downloadTextFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =========================================================
// SETTINGS
// =========================================================

function backupData() {
  loadAllData();

  const backup = {
    kontigen: allKontigen,
    admins: JSON.parse(localStorage.getItem('systemAdmins')) || [],
    users: JSON.parse(localStorage.getItem('users')) || [],
    activity: activityLog,
    onlineUsers: JSON.parse(localStorage.getItem('onlineUsers')) || [],
    timestamp: new Date().toLocaleString('id-ID')
  };

  allKontigen.forEach(function (kontigen) {
    backup['kontingen_' + kontigen.code] = localStorage.getItem('kontingen_' + kontigen.code);
  });

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json'
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'athlete_backup_' + Date.now() + '.json';
  link.click();

  logActivity('backup', 'Backup data sistem');

  notify('Backup berhasil didownload.', 'success');
}

function restoreData() {
  const input = document.createElement('input');

  input.type = 'file';
  input.accept = '.json';

  input.onchange = function (e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const backup = JSON.parse(event.target.result);

        allKontigen = backup.kontigen || [];
        activityLog = backup.activity || [];

        localStorage.setItem('kontigenData', JSON.stringify(allKontigen));
        localStorage.setItem('activityLog', JSON.stringify(activityLog));
        localStorage.setItem('systemAdmins', JSON.stringify(backup.admins || []));
        localStorage.setItem('users', JSON.stringify(backup.users || []));

        Object.keys(backup).forEach(function (key) {
          if (key.startsWith('kontingen_')) {
            localStorage.setItem(key, backup[key]);
          }
        });

        loadAllData();
        renderDashboard();

        notify('Data berhasil direstore.', 'success');
      } catch (error) {
        notify('File backup tidak valid.', 'error');
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

function clearOldLogs() {
  askConfirm('Yakin ingin menghapus log aktivitas lama? Sistem akan menyimpan 50 log terbaru.')
    .then(function (confirmed) {
      if (!confirmed) return;

      if (activityLog.length > 50) {
        activityLog = activityLog.slice(0, 50);
        saveAllData();
        logActivity('system', 'Membersihkan log lama');

        renderActivityLog();

        notify('Log lama berhasil dihapus.', 'success');
      } else {
        notify('Tidak ada log yang perlu dihapus.', 'info');
      }
    });
}

function clearAllData() {
  askConfirm('PERHATIAN: Ini akan menghapus SEMUA data. Apakah Anda yakin?')
    .then(function (confirmed) {
      if (!confirmed) return;

      askConfirm('Konfirmasi terakhir. Semua data akan hilang dari localStorage.')
        .then(function (finalConfirmed) {
          if (!finalConfirmed) return;

          localStorage.clear();

          notify('Semua data dihapus. Halaman akan dimuat ulang.', 'success', 1000)
            .then(function () {
              location.reload();
            });
        });
    });
}

// =========================================================
// LOGOUT
// =========================================================

function logout() {
  askConfirm('Yakin ingin logout?')
    .then(function (confirmed) {
      if (!confirmed) return;

      const username = localStorage.getItem('userUsername');
      const email = localStorage.getItem('userEmail');

      let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];

      onlineUsers = onlineUsers.filter(function (user) {
        return user.username !== username && user.email !== email;
      });

      localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));

      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userUsername');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('currentKontigen');

      notify('Anda berhasil logout.', 'success', 900)
        .then(function () {
          window.location.href = '../auth/login.html';
        });
    });
}

// =========================================================
// ONLINE STATUS
// =========================================================

function IU_getOnlineUsers() {
  return JSON.parse(localStorage.getItem('onlineUsers')) || [];
}

function IU_findOnlineData(admin) {
  const onlineUsers = IU_getOnlineUsers();

  return onlineUsers.find(function (user) {
    return user.username === admin.username || user.email === admin.email;
  });
}

function IU_isAdminOnline(admin) {
  const onlineData = IU_findOnlineData(admin);

  if (!onlineData || !onlineData.lastSeen) {
    return false;
  }

  const lastSeenTime = new Date(onlineData.lastSeen).getTime();
  const now = new Date().getTime();

  return now - lastSeenTime <= IU_ONLINE_TIMEOUT;
}

function IU_formatLastSeen(dateString) {
  if (!dateString) return '-';

  const date = new Date(dateString);

  if (isNaN(date)) return '-';

  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// =========================================================
// ACTIVITY
// =========================================================

function logActivity(type, description, detail = '') {
  const log = {
    id: Date.now(),
    timestamp: new Date().toLocaleString('id-ID'),
    admin: localStorage.getItem('userUsername') || localStorage.getItem('userEmail') || 'Super Admin',
    type: type,
    description: description,
    detail: detail
  };

  activityLog.unshift(log);

  if (activityLog.length > 150) {
    activityLog = activityLog.slice(0, 150);
  }

  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

// =========================================================
// HELPER
// =========================================================

function getKontingenDetail(code) {
  const saved = localStorage.getItem('kontingen_' + code);

  if (!saved) {
    return {
      pelatih: [],
      atlet: [],
      program: [],
      laporanBulanan: [],
      jadwal: [],
      absensi: {}
    };
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    return {
      pelatih: [],
      atlet: [],
      program: [],
      laporanBulanan: [],
      jadwal: [],
      absensi: {}
    };
  }
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}