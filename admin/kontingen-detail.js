// Kontingen Detail JavaScript

let currentKontigen = {};
let pelatihList = [];
let atletList = [];
let programList = [];
let jadwalList = [];
let absensiData = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadKontigenData();
  loadUserInfo();
  setupEventListeners();
  setupFormHandlers();
  setTodayDate();
});

// Load kontingen data from localStorage
function loadKontigenData() {
  const selected = localStorage.getItem('currentKontigen');

  if (selected) {
    currentKontigen = JSON.parse(selected);
    displayKontigenInfo();
  } else {
    // fallback kalau belum ada data
    alert('Kontingen tidak ditemukan, kembali ke dashboard');
    window.location.href = 'home.html';
  }
}
// Display kontingen info
function displayKontigenInfo() {
  document.getElementById('kontigenName').textContent = currentKontigen.name;
  document.getElementById('kontigenAddress').textContent = currentKontigen.address;
  document.getElementById('kontigenCode').textContent = currentKontigen.code;
  document.getElementById('breadcrumbTitle').textContent = ' / ' + currentKontigen.name;
}

// Load user info
function loadUserInfo() {
  const userEmail = localStorage.getItem('userEmail') || 'Admin User';
  document.getElementById('userInfo').textContent = userEmail;
}

// Setup event listeners
function setupEventListeners() {
  // Form submissions
  const pelatihForm = document.getElementById('addPelatihForm');
  if (pelatihForm) {
    pelatihForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addPelatih();
    });
  }

  const atletForm = document.getElementById('addAtletForm');
  if (atletForm) {
    atletForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addAtlet();
    });
  }

  const programForm = document.getElementById('uploadProgramForm');
  if (programForm) {
    programForm.addEventListener('submit', function(e) {
      e.preventDefault();
      uploadProgram();
    });
  }

  const jadwalForm = document.getElementById('addJadwalForm');
  if (jadwalForm) {
    jadwalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addJadwal();
    });
  }

  // Close modal when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

function setupFormHandlers() {
  // Already handled in setupEventListeners
}

// Set today's date for absensi
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('absensiDate').value = today;
}

// ===== TAB FUNCTIONS =====
function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Remove active class from buttons
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  document.getElementById(tabName).classList.add('active');

  // Add active class to clicked button
  event.target.classList.add('active');
}

// ===== MODAL FUNCTIONS =====
function openAddPelatihModal() {
  document.getElementById('addPelatihModal').classList.add('show');
}

function openAddAtletModal() {
  document.getElementById('addAtletModal').classList.add('show');
}

function openUploadProgramModal() {
  document.getElementById('uploadProgramModal').classList.add('show');
}

function openAddJadwalModal() {
  document.getElementById('addJadwalModal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function editKontigenInfo() {
  const newName = prompt('Nama Kontingen:', currentKontigen.name);
  if (newName) {
    currentKontigen.name = newName;
    localStorage.setItem('selectedKontigen', JSON.stringify(currentKontigen));
    displayKontigenInfo();
  }
}

// ===== PELATIH FUNCTIONS =====
function addPelatih() {
  const nama = document.getElementById('pelatihNama').value;
  const usia = document.getElementById('pelatihUsia').value;
  const ttl = document.getElementById('pelatihTTL').value;
  const prestasi = document.getElementById('pelatihPrestasi').value;
  const foto = document.getElementById('pelatihFoto').files[0];

  if (!nama) {
    alert('Nama pelatih harus diisi!');
    return;
  }

  const pelatih = {
    id: Date.now(),
    nama,
    usia,
    ttl,
    prestasi,
    foto: foto ? URL.createObjectURL(foto) : 'https://via.placeholder.com/280x200?text=No+Photo'
  };

  pelatihList.push(pelatih);
  document.getElementById('addPelatihForm').reset();
  closeModal('addPelatihModal');
  renderPelatih();
}

function renderPelatih() {
  const grid = document.getElementById('pelatihGrid');
  grid.innerHTML = '';

  if (pelatihList.length === 0) {
    grid.innerHTML = '<div class="empty-state">Belum ada data pelatih</div>';
    return;
  }

  pelatihList.forEach(pelatih => {
    const card = createDataCard(pelatih, 'pelatih');
    grid.appendChild(card);
  });
}

// ===== ATLET FUNCTIONS =====
function addAtlet() {
  const nama = document.getElementById('atletNama').value;
  const usia = document.getElementById('atletUsia').value;
  const ttl = document.getElementById('atletTTL').value;
  const prestasi = document.getElementById('atletPrestasi').value;
  const foto = document.getElementById('atletFoto').files[0];

  if (!nama) {
    alert('Nama atlet harus diisi!');
    return;
  }

  const atlet = {
    id: Date.now(),
    nama,
    usia,
    ttl,
    prestasi,
    foto: foto ? URL.createObjectURL(foto) : 'https://via.placeholder.com/280x200?text=No+Photo'
  };

  atletList.push(atlet);
  document.getElementById('addAtletForm').reset();
  closeModal('addAtletModal');
  renderAtlet();
}

function renderAtlet() {
  const grid = document.getElementById('atletGrid');
  grid.innerHTML = '';

  if (atletList.length === 0) {
    grid.innerHTML = '<div class="empty-state">Belum ada data atlet</div>';
    return;
  }

  atletList.forEach(atlet => {
    const card = createDataCard(atlet, 'atlet');
    grid.appendChild(card);
  });
}

// Create data card element
function createDataCard(data, type) {
  const card = document.createElement('div');
  card.className = 'data-card';
  
  const usia = data.usia ? `Usia: ${data.usia} tahun` : '';
  const ttl = data.ttl ? `TTL: ${formatDate(new Date(data.ttl))}` : '';

  card.innerHTML = `
    <img src="${data.foto}" alt="${data.nama}">
    <div class="data-card-content">
      <h4>${data.nama}</h4>
      ${usia ? `<p>${usia}</p>` : ''}
      ${ttl ? `<p>${ttl}</p>` : ''}
      ${data.prestasi ? `<p><strong>Prestasi:</strong> ${data.prestasi.substring(0, 50)}...</p>` : ''}
      <div class="data-card-actions">
        <button onclick="edit${type === 'pelatih' ? 'Pelatih' : 'Atlet'}(${data.id})">✎ Edit</button>
        <button class="delete" onclick="delete${type === 'pelatih' ? 'Pelatih' : 'Atlet'}(${data.id})">🗑 Hapus</button>
      </div>
    </div>
  `;

  return card;
}

function editPelatih(id) {
  alert('Edit pelatih dengan ID: ' + id);
}

function deletePelatih(id) {
  if (confirm('Hapus data pelatih ini?')) {
    pelatihList = pelatihList.filter(p => p.id !== id);
    renderPelatih();
  }
}

function editAtlet(id) {
  alert('Edit atlet dengan ID: ' + id);
}

function deleteAtlet(id) {
  if (confirm('Hapus data atlet ini?')) {
    atletList = atletList.filter(a => a.id !== id);
    renderAtlet();
  }
}

// ===== PROGRAM LATIHAN FUNCTIONS =====
function uploadProgram() {
  const nama = document.getElementById('programNama').value;
  const desc = document.getElementById('programDesc').value;
  const file = document.getElementById('programFile').files[0];

  if (!nama || !file) {
    alert('Nama dan file harus diisi!');
    return;
  }

  const program = {
    id: Date.now(),
    nama,
    desc,
    fileName: file.name,
    fileType: file.type,
    uploadDate: formatDate(new Date())
  };

  programList.push(program);
  document.getElementById('uploadProgramForm').reset();
  closeModal('uploadProgramModal');
  renderProgram();
}

function renderProgram() {
  const list = document.getElementById('programList');
  list.innerHTML = '';

  if (programList.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada file program latihan</div>';
    return;
  }

  programList.forEach(program => {
    const icon = getFileIcon(program.fileType);
    const item = document.createElement('div');
    item.className = 'program-item';
    item.innerHTML = `
      <div style="display: flex; align-items: flex-start; flex: 1;">
        <div class="program-item-icon">${icon}</div>
        <div class="program-info">
          <h4>${program.nama}</h4>
          <p>File: ${program.fileName}</p>
          <p>Tanggal: ${program.uploadDate}</p>
          ${program.desc ? `<p>${program.desc}</p>` : ''}
        </div>
      </div>
      <div class="program-actions">
        <button onclick="downloadFile(${program.id})">📥 Download</button>
        <button onclick="deleteProgram(${program.id})" style="color: #ef4444; border-color: #fecaca;">🗑 Hapus</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function getFileIcon(fileType) {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  return '📋';
}

function downloadProgram() {
  if (programList.length === 0) {
    alert('Belum ada file untuk didownload');
    return;
  }
  alert('Fitur download akan diimplementasikan dengan backend');
}

function downloadFile(id) {
  alert('Download file dengan ID: ' + id);
}

function deleteProgram(id) {
  if (confirm('Hapus file ini?')) {
    programList = programList.filter(p => p.id !== id);
    renderProgram();
  }
}

// ===== ABSENSI FUNCTIONS =====
function loadAbsensi() {
  const date = document.getElementById('absensiDate').value;
  if (!date) {
    alert('Pilih tanggal terlebih dahulu');
    return;
  }

  if (atletList.length === 0) {
    document.getElementById('absensiContainer').innerHTML = '<div class="empty-state">Tambahkan atlet terlebih dahulu</div>';
    return;
  }

  renderAbsensiTable(date);
}

function renderAbsensiTable(date) {
  const container = document.getElementById('absensiContainer');
  
  let html = `
    <div class="absensi-container">
      <table class="absensi-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Atlet</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
  `;

  atletList.forEach((atlet, index) => {
    const status = absensiData[`${date}-${atlet.id}`] || 'hadir';
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${atlet.nama}</td>
        <td>
          <select class="absensi-status-select" onchange="updateAbsensi('${date}', ${atlet.id}, this.value)">
            <option value="hadir" ${status === 'hadir' ? 'selected' : ''}>Hadir</option>
            <option value="absen" ${status === 'absen' ? 'selected' : ''}>Absen</option>
            <option value="izin" ${status === 'izin' ? 'selected' : ''}>Izin</option>
          </select>
        </td>
        <td>
          <span class="status-${status}">${status.toUpperCase()}</span>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function updateAbsensi(date, atletId, status) {
  absensiData[`${date}-${atletId}`] = status;
}

// ===== JADWAL FUNCTIONS =====
function addJadwal() {
  const no = document.getElementById('jadwalNo').value;
  const nama = document.getElementById('jadwalNama').value;
  const tanggal = document.getElementById('jadwalTanggal').value;
  const jam = document.getElementById('jadwalJam').value;
  const tempat = document.getElementById('jadwalTempat').value;

  if (!no || !nama || !tanggal) {
    alert('No, nama, dan tanggal harus diisi!');
    return;
  }

  const jadwal = {
    id: Date.now(),
    no,
    nama,
    tanggal,
    jam,
    tempat
  };

  jadwalList.push(jadwal);
  document.getElementById('addJadwalForm').reset();
  closeModal('addJadwalModal');
  renderJadwal();
}

function renderJadwal() {
  const list = document.getElementById('jadwalList');
  list.innerHTML = '';

  if (jadwalList.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada jadwal pertandingan</div>';
    return;
  }

  jadwalList.forEach(jadwal => {
    const item = document.createElement('div');
    item.className = 'jadwal-item';
    item.innerHTML = `
      <div class="jadwal-info">
        <h4>[${jadwal.no}] ${jadwal.nama}</h4>
        <p><strong>Tanggal:</strong> ${formatDate(new Date(jadwal.tanggal))}</p>
        ${jadwal.jam ? `<p><strong>Jam:</strong> ${jadwal.jam}</p>` : ''}
        ${jadwal.tempat ? `<p><strong>Tempat:</strong> ${jadwal.tempat}</p>` : ''}
      </div>
      <div class="jadwal-actions">
        <button onclick="editJadwal(${jadwal.id})">✎ Edit</button>
        <button onclick="deleteJadwal(${jadwal.id})" style="color: #ef4444; border-color: #fecaca;">🗑 Hapus</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function editJadwal(id) {
  alert('Edit jadwal dengan ID: ' + id);
}

function deleteJadwal(id) {
  if (confirm('Hapus jadwal ini?')) {
    jadwalList = jadwalList.filter(j => j.id !== id);
    renderJadwal();
  }
}

// ===== LOGOUT =====
function logout() {
  if (confirm('Yakin ingin logout?')) {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedKontigen');
    window.location.href = '../login/login.html';
  }
}

// ===== HELPER FUNCTIONS =====
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
}
