
let kontigenList = [];

document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuth()) return;

  loadUserInfo();
  loadKontigenData();
  migrateOldKontingenData();
  renderKontigenCards();
  setupFormHandlers();

  IU_startOnlineTracker();
  updateCurrentUserOnlineStatus();

  setInterval(updateCurrentUserOnlineStatus, 10000);
});

// =========================================================
// HELPER NOTIFICATION
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

function checkAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userEmail = localStorage.getItem('userEmail');
  const userUsername = localStorage.getItem('userUsername');

  if (isLoggedIn !== 'true' || (!userEmail && !userUsername)) {
    notify('Silakan login terlebih dahulu!', 'error', 1200)
      .then(function () {
        window.location.href = '../auth/login.html';
      });

    return false;
  }

  return true;
}

function getCurrentUserKey() {
  return (
    localStorage.getItem('userUsername') ||
    localStorage.getItem('userEmail') ||
    localStorage.getItem('userName') ||
    'User'
  );
}

function getCurrentUserName() {
  return (
    localStorage.getItem('userName') ||
    localStorage.getItem('userEmail') ||
    localStorage.getItem('userUsername') ||
    'User'
  );
}

// =========================================================
// ONLINE USER STATUS
// =========================================================

function updateCurrentUserOnlineStatus() {
  const username = localStorage.getItem('userUsername');
  const email = localStorage.getItem('userEmail');
  const name = localStorage.getItem('userName');
  const role = localStorage.getItem('userRole') || 'admin';

  if (!username && !email) return;

  let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];

  onlineUsers = onlineUsers.filter(function (user) {
    return user.username !== username && user.email !== email;
  });

  onlineUsers.push({
    username: username || email,
    email: email || '',
    name: name || username || email,
    role: role,
    lastSeen: new Date().toISOString()
  });

  localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
}

function IU_getCurrentOnlineIdentity() {
  return {
    username: localStorage.getItem('userUsername') || '',
    email: localStorage.getItem('userEmail') || '',
    name: localStorage.getItem('userName') || '',
    role: localStorage.getItem('userRole') || 'admin'
  };
}

function IU_updateOnlineStatus() {
  const current = IU_getCurrentOnlineIdentity();

  if (!current.username && !current.email) return;

  let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];

  onlineUsers = onlineUsers.filter(function (user) {
    return user.username !== current.username && user.email !== current.email;
  });

  onlineUsers.push({
    username: current.username || current.email,
    email: current.email,
    name: current.name || current.username || current.email,
    role: current.role,
    lastSeen: new Date().toISOString()
  });

  localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
}

function IU_startOnlineTracker() {
  IU_updateOnlineStatus();

  if (window.IU_onlineInterval) {
    clearInterval(window.IU_onlineInterval);
  }

  window.IU_onlineInterval = setInterval(IU_updateOnlineStatus, 5000);
}

function IU_setOffline() {
  const current = IU_getCurrentOnlineIdentity();

  let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];

  onlineUsers = onlineUsers.filter(function (user) {
    return user.username !== current.username && user.email !== current.email;
  });

  localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
}

// =========================================================
// ACTIVITY LOG
// =========================================================

function logActivity(type, description, detail = '') {
  const log = {
    id: Date.now(),
    timestamp: new Date().toLocaleString('id-ID'),
    admin: getCurrentUserKey(),
    type: type,
    description: description,
    detail: detail
  };

  let activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];

  activityLog.unshift(log);

  if (activityLog.length > 100) {
    activityLog = activityLog.slice(0, 100);
  }

  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

// =========================================================
// USER INFO
// =========================================================

function loadUserInfo() {
  const userInfo = document.getElementById('userInfo');

  if (userInfo) {
    userInfo.textContent = getCurrentUserName();
  }
}

// =========================================================
// LOAD & SAVE KONTINGEN
// =========================================================

function loadKontigenData() {
  const saved = localStorage.getItem('kontigenData');

  if (saved) {
    try {
      kontigenList = JSON.parse(saved);
    } catch (error) {
      kontigenList = [];
      localStorage.setItem('kontigenData', JSON.stringify(kontigenList));
    }
  } else {
    kontigenList = [];
  }
}

function saveKontigenData() {
  localStorage.setItem('kontigenData', JSON.stringify(kontigenList));
}

function migrateOldKontingenData() {
  let changed = false;

  kontigenList = kontigenList.map(function (kontigen) {
    if (!kontigen.members) {
      kontigen.members = [];

      if (kontigen.owner) {
        kontigen.members.push(kontigen.owner);
      }

      changed = true;
    }

    if (!kontigen.ownerName) {
      kontigen.ownerName = kontigen.owner || 'User';
      changed = true;
    }

    if (!kontigen.created) {
      kontigen.created = formatDate(new Date());
      changed = true;
    }

    return kontigen;
  });

  if (changed) {
    saveKontigenData();
  }
}

// =========================================================
// FILTER DATA PER USER
// =========================================================

function getMyKontigenList() {
  const currentUser = getCurrentUserKey();

  return kontigenList.filter(function (kontigen) {
    const isOwner = kontigen.owner === currentUser;
    const isMember = Array.isArray(kontigen.members) && kontigen.members.includes(currentUser);

    return isOwner || isMember;
  });
}

function isKontigenOwner(kontigen) {
  return kontigen.owner === getCurrentUserKey();
}

// =========================================================
// RENDER KONTINGEN
// =========================================================

function renderKontigenCards() {
  const grid = document.getElementById('kontigenGrid');

  if (!grid) return;

  grid.innerHTML = '';

  const myKontigenList = getMyKontigenList();

  if (myKontigenList.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>Belum ada kontingen</h3>
        <p>Buat kontingen baru atau masuk menggunakan kode kontingen.</p>
      </div>
    `;
    return;
  }

  myKontigenList.forEach(function (kontigen) {
    const card = createKontigenCard(kontigen);
    grid.appendChild(card);
  });
}

function createKontigenCard(kontigen) {
  const card = document.createElement('div');
  card.className = 'kontingen-card';

  const owner = isKontigenOwner(kontigen);

  const safeId = kontigen.id;
  const safeName = escapeHTML(kontigen.name || 'Kontingen Tanpa Nama');
  const safeCode = escapeHTML(kontigen.code || '-');
  const safeDesc = escapeHTML(kontigen.desc || '');
  const safeAddress = escapeHTML(kontigen.address || '');
  const safeCreated = escapeHTML(kontigen.created || '-');
  const safeOwnerName = escapeHTML(kontigen.ownerName || kontigen.owner || '-');

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title-area">
        <span class="card-badge">${owner ? 'Pemilik' : 'Member'}</span>
        <h3>${safeName}</h3>
      </div>

      <div class="card-actions">
        ${
          owner
            ? `
              <button class="btn-small btn-edit-card" onclick="editKontigen(${safeId})" title="Edit Kontingen">
                ✎
              </button>
              <button class="btn-small btn-delete-card" onclick="deleteKontigen(${safeId})" title="Hapus Kontingen">
                🗑
              </button>
            `
            : `
              <button class="btn-small btn-exit-card" onclick="leaveKontingen(${safeId})" title="Keluar Kontingen">
                🚪
              </button>
            `
        }
      </div>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="info-label">Kode Kontingen</span>
        <span class="card-code">${safeCode}</span>
      </div>

      ${
        safeDesc
          ? `
            <div class="info-block">
              <span class="info-label">Deskripsi</span>
              <p>${safeDesc}</p>
            </div>
          `
          : ''
      }

      ${
        safeAddress
          ? `
            <div class="info-block">
              <span class="info-label">Alamat</span>
              <p>${safeAddress}</p>
            </div>
          `
          : ''
      }

      <div class="card-meta">
        <span>Dibuat: ${safeCreated}</span>
        <span>Pemilik: ${safeOwnerName}</span>
      </div>
    </div>

    <div class="card-footer">
      <button class="btn-footer btn-copy-code" onclick="copyCode('${safeCode}')">
        <span class="btn-icon">📋</span>
        <span>Copy Kode</span>
      </button>

      <button class="btn-footer btn-enter-card" onclick="enterKontingen(${safeId})">
        <span>Masuk</span>
        <span class="btn-icon">→</span>
      </button>
    </div>
  `;

  return card;
}

// =========================================================
// FORM HANDLER
// =========================================================

function setupFormHandlers() {
  const form = document.getElementById('createForm');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      createKontingen();
    });
  }
}

// =========================================================
// MODAL
// =========================================================

function openCreateModal() {
  const modal = document.getElementById('createModal');

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

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
  }
});

// =========================================================
// CREATE KONTINGEN
// =========================================================

function createKontingen() {
  const nameInput = document.getElementById('kontigenName');
  const descInput = document.getElementById('kontigenDesc');
  const addressInput = document.getElementById('kontigenAddress');

  const name = nameInput ? nameInput.value.trim() : '';
  const desc = descInput ? descInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  if (!name) {
    notify('Nama kontingen tidak boleh kosong!', 'warning');
    return;
  }

  let code = generateCode();

  while (kontigenList.some(function (kontigen) {
    return kontigen.code === code;
  })) {
    code = generateCode();
  }

  const currentUser = getCurrentUserKey();
  const currentName = getCurrentUserName();

  const newKontigen = {
    id: Date.now(),
    name: name,
    desc: desc,
    address: address,
    code: code,
    created: formatDate(new Date()),
    owner: currentUser,
    ownerName: currentName,
    members: [currentUser]
  };

  kontigenList.push(newKontigen);
  saveKontigenData();

  logActivity('create', `Membuat kontingen: ${name}`, `Kode: ${code}`);

  const form = document.getElementById('createForm');

  if (form) {
    form.reset();
  }

  closeModal('createModal');
  renderKontigenCards();

  notify(`Kontingen "${name}" berhasil dibuat! Kode: ${code}`, 'success');
}

// =========================================================
// GENERATE CODE
// =========================================================

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

// =========================================================
// COPY CODE
// =========================================================

function copyCode(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(function () {
        notify(`Kode ${code} sudah dicopy!`, 'success');
      })
      .catch(function () {
        fallbackCopyCode(code);
      });

    return;
  }

  fallbackCopyCode(code);
}

function fallbackCopyCode(code) {
  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';

  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    notify(`Kode ${code} sudah dicopy!`, 'success');
  } catch (error) {
    notify('Kode gagal dicopy. Silakan copy manual.', 'error');
  }

  textarea.remove();
}

// =========================================================
// EDIT KONTINGEN
// =========================================================

function editKontigen(id) {
  const kontigen = kontigenList.find(function (item) {
    return item.id === id;
  });

  if (!kontigen) {
    notify('Kontingen tidak ditemukan!', 'error');
    return;
  }

  if (!isKontigenOwner(kontigen)) {
    notify('Anda tidak bisa mengedit kontingen ini karena Anda bukan pemilik.', 'error');
    return;
  }

  const newName = prompt('Ubah nama kontingen:', kontigen.name);

  if (!newName || newName.trim() === '') {
    return;
  }

  const oldName = kontigen.name;
  kontigen.name = newName.trim();

  saveKontigenData();

  const currentKontigen = JSON.parse(localStorage.getItem('currentKontigen') || 'null');

  if (currentKontigen && String(currentKontigen.id) === String(kontigen.id)) {
    localStorage.setItem('currentKontigen', JSON.stringify(kontigen));
  }

  logActivity('edit', `Ubah nama kontingen dari "${oldName}" ke "${kontigen.name}"`);
  renderKontigenCards();

  notify('Nama kontingen berhasil diperbarui.', 'success');
}

// =========================================================
// DELETE KONTINGEN
// =========================================================

function deleteKontigen(id) {
  const kontigen = kontigenList.find(function (item) {
    return item.id === id;
  });

  if (!kontigen) {
    notify('Kontingen tidak ditemukan!', 'error');
    return;
  }

  if (!isKontigenOwner(kontigen)) {
    notify('Anda tidak bisa menghapus kontingen ini karena Anda bukan pemilik.', 'error');
    return;
  }

  askConfirm('Yakin ingin menghapus kontingen ini? Semua data kontingen akan hilang.')
    .then(function (confirmed) {
      if (!confirmed) return;

      kontigenList = kontigenList.filter(function (item) {
        return item.id !== id;
      });

      localStorage.removeItem('kontingen_' + kontigen.code);

      const currentKontigen = JSON.parse(localStorage.getItem('currentKontigen') || 'null');

      if (currentKontigen && String(currentKontigen.id) === String(kontigen.id)) {
        localStorage.removeItem('currentKontigen');
      }

      saveKontigenData();

      logActivity('delete', `Menghapus kontingen: ${kontigen.name}`);

      renderKontigenCards();

      notify('Kontingen berhasil dihapus.', 'success');
    });
}

// =========================================================
// JOIN KONTINGEN DENGAN KODE
// =========================================================

function joinKontingen() {
  const codeInput = document.getElementById('joinCode');

  if (!codeInput) return;

  const code = codeInput.value.trim().toUpperCase();

  if (!code) {
    notify('Masukkan kode kontingen!', 'warning');
    return;
  }

  const kontigen = kontigenList.find(function (item) {
    return item.code === code;
  });

  if (!kontigen) {
    notify('Kode kontingen tidak ditemukan. Mohon periksa kembali kode yang Anda masukkan.', 'error');
    codeInput.value = '';
    return;
  }

  const currentUser = getCurrentUserKey();

  if (!Array.isArray(kontigen.members)) {
    kontigen.members = [];
  }

  const alreadyJoined =
    kontigen.owner === currentUser ||
    kontigen.members.includes(currentUser);

  if (!alreadyJoined) {
    kontigen.members.push(currentUser);
    saveKontigenData();

    logActivity('join', `Masuk ke kontingen: ${kontigen.name}`, `Kode: ${code}`);

    notify(`Berhasil masuk ke kontingen "${kontigen.name}".`, 'success', 1000)
      .then(function () {
        codeInput.value = '';
        renderKontigenCards();
        enterKontingen(kontigen.id);
      });

    return;
  }

  notify(`Anda sudah tergabung dalam kontingen "${kontigen.name}".`, 'info', 1000)
    .then(function () {
      codeInput.value = '';
      renderKontigenCards();
      enterKontingen(kontigen.id);
    });
}

// =========================================================
// LEAVE KONTINGEN
// =========================================================

function leaveKontingen(id) {
  const kontigen = kontigenList.find(function (item) {
    return item.id === id;
  });

  if (!kontigen) {
    notify('Kontingen tidak ditemukan!', 'error');
    return;
  }

  const currentUser = getCurrentUserKey();

  if (kontigen.owner === currentUser) {
    notify('Pemilik tidak bisa keluar dari kontingen. Jika ingin menghapus, gunakan tombol hapus.', 'error');
    return;
  }

  askConfirm(`Yakin ingin keluar dari kontingen "${kontigen.name}"?`)
    .then(function (confirmed) {
      if (!confirmed) return;

      kontigen.members = kontigen.members.filter(function (member) {
        return member !== currentUser;
      });

      saveKontigenData();

      logActivity('leave', `Keluar dari kontingen: ${kontigen.name}`, `Kode: ${kontigen.code}`);

      renderKontigenCards();

      notify('Anda berhasil keluar dari kontingen.', 'success');
    });
}

// =========================================================
// ENTER KONTINGEN
// =========================================================

function enterKontingen(id) {
  const kontigen = kontigenList.find(function (item) {
    return item.id === id;
  });

  if (!kontigen) {
    notify('Kontingen tidak ditemukan!', 'error');
    return;
  }

  localStorage.setItem('currentKontigen', JSON.stringify(kontigen));

  window.location.href = 'kontingen-detail.html';
}

// =========================================================
// LOGOUT
// =========================================================

function logout() {
  askConfirm('Yakin ingin logout?')
    .then(function (confirmed) {
      if (!confirmed) return;

      IU_setOffline();

      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userUsername');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('currentKontigen');

      notify('Anda berhasil logout.', 'success', 800)
        .then(function () {
          window.location.href = '../auth/login.html';
        });
    });
}

// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(date) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return date.toLocaleDateString('id-ID', options);
}

// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}