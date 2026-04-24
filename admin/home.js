// Home Page JavaScript - Sistem Kontingen Sederhana

let kontigenList = [];

document.addEventListener('DOMContentLoaded', function() {
  loadUserInfo();
  renderKontigenCards();
  setupFormHandlers();
  loadKontigenData();
});

// Log activity for super admin tracking
function logActivity(type, description, detail = '') {
  const log = {
    id: Date.now(),
    timestamp: new Date().toLocaleString('id-ID'),
    admin: localStorage.getItem('userEmail'),
    type: type,
    description: description,
    detail: detail
  };

  let activityLog = [];
  const saved = localStorage.getItem('activityLog');
  if (saved) {
    activityLog = JSON.parse(saved);
  }

  activityLog.unshift(log);
  if (activityLog.length > 100) {
    activityLog = activityLog.slice(0, 100);
  }

  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

// Load user info
function loadUserInfo() {
  const userEmail = localStorage.getItem('userEmail') || 'User';
  document.getElementById('userInfo').textContent = userEmail;
}

// Load kontingen data from localStorage
function loadKontigenData() {
  const saved = localStorage.getItem('kontigenData');
  if (saved) {
    kontigenList = JSON.parse(saved);
  }
}

// Save kontingen data to localStorage
function saveKontigenData() {
  localStorage.setItem('kontigenData', JSON.stringify(kontigenList));
}

// Render kontingen cards
function renderKontigenCards() {
  const grid = document.getElementById('kontigenGrid');
  grid.innerHTML = '';

  if (kontigenList.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>Belum ada kontingen</h3>
        <p>Buat kontingen baru atau masuk dengan kode</p>
      </div>
    `;
    return;
  }

  kontigenList.forEach(kontigen => {
    const card = createKontigenCard(kontigen);
    grid.appendChild(card);
  });
}

// Create kontingen card
function createKontigenCard(kontigen) {
  const card = document.createElement('div');
  card.className = 'kontingen-card';
  
  card.innerHTML = `
    <div class="card-header">
      <h3>${kontigen.name}</h3>
      <div class="card-actions">
        <button class="btn-small" onclick="editKontigen(${kontigen.id})" title="Edit">✎</button>
        <button class="btn-small" onclick="deleteKontigen(${kontigen.id})" title="Hapus">🗑</button>
      </div>
    </div>
    <div class="card-body">
      <p><strong>Kode:</strong></p>
      <div class="card-code">${kontigen.code}</div>
      ${kontigen.desc ? `<p style="margin-top: 12px;"><strong>Deskripsi:</strong><br>${kontigen.desc}</p>` : ''}
      <p style="margin-top: 12px; font-size: 12px; color: #999;">Dibuat: ${kontigen.created}</p>
    </div>
    <div class="card-footer">
      <button class="btn-footer" onclick="copyCode('${kontigen.code}')">📋 Copy Kode</button>
      <button class="btn-footer btn-footer-enter" onclick="enterKontingen(${kontigen.id})">Masuk →</button>
    </div>
  `;

  return card;
}

// Setup form handlers
function setupFormHandlers() {
  const form = document.getElementById('createForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      createKontingen();
    });
  }
}

// Modal functions
function openCreateModal() {
  document.getElementById('createModal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
  }
});

// Create kontingen
function createKontingen() {
  const name = document.getElementById('kontigenName').value;
  const desc = document.getElementById('kontigenDesc').value;

  if (!name) {
    alert('Nama kontingen tidak boleh kosong!');
    return;
  }

  // Generate code
  const code = generateCode();

  const newKontigen = {
    id: Date.now(),
    name: name,
    desc: desc,
    code: code,
    created: formatDate(new Date()),
    owner: localStorage.getItem('userEmail') || 'User'
  };

  kontigenList.push(newKontigen);
  saveKontigenData();
  logActivity('create', `Membuat kontingen: ${name}`, `Kode: ${code}`);

  // Reset form
  document.getElementById('createForm').reset();
  closeModal('createModal');

  // Render
  renderKontigenCards();

  alert(`✅ Kontingen "${name}" berhasil dibuat!\n\nKode: ${code}\n\nBagikan kode ini ke teman untuk join.`);
}

// Generate unique code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Copy code to clipboard
function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert('✅ Kode ' + code + ' sudah dicopy!');
  });
}

// Edit kontigen
function editKontigen(id) {
  const kontigen = kontigenList.find(k => k.id === id);
  if (!kontigen) return;

  const newName = prompt('Ubah nama kontingen:', kontigen.name);
  if (newName) {
    const oldName = kontigen.name;
    kontigen.name = newName;
    saveKontigenData();
    logActivity('edit', `Ubah nama kontingen dari "${oldName}" ke "${newName}"`);
    renderKontigenCards();
  }
}

// Delete kontigen
function deleteKontigen(id) {
  if (confirm('Yakin ingin menghapus kontingen ini?')) {
    const kontigen = kontigenList.find(k => k.id === id);
    kontigenList = kontigenList.filter(k => k.id !== id);
    localStorage.removeItem('kontingen_' + kontigen.code);
    saveKontigenData();
    logActivity('delete', `Menghapus kontingen: ${kontigen.name}`);
    renderKontigenCards();
    alert('✅ Kontingen dihapus');
  }
}

// Join kontingen with code
function joinKontingen() {
  const code = document.getElementById('joinCode').value.trim().toUpperCase();

  if (!code) {
    alert('Masukkan kode kontingen!');
    return;
  }

  const kontigen = kontigenList.find(k => k.code === code);
  if (kontigen) {
    logActivity('join', `Masuk ke kontingen: ${kontigen.name}`, `Kode: ${code}`);
    enterKontingen(kontigen.id);
  } else {
    alert('❌ Kode kontingen tidak ditemukan.\n\nMohon periksa kembali kode yang Anda masukkan.');
    document.getElementById('joinCode').value = '';
  }
}

// Enter kontingen
function enterKontingen(id) {
  const kontigen = kontigenList.find(k => k.id === id);
  if (!kontigen) return;

  // Save selected kontigen
  localStorage.setItem('currentKontigen', JSON.stringify(kontigen));

  // Redirect to kontingen page
  window.location.href = 'kontingen-detail.html';
}

// Logout
function logout() {
  if (confirm('Yakin ingin logout?')) {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentKontigen');
    window.location.href = '../login/login.html';
  }
}

// Format date
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
}
