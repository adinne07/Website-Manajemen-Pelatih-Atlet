let currentKontigen = {};
let pelatihList = [];
let atletList = [];
let programList = [];
let laporanBulananList = [];
let jadwalList = [];
let absensiData = {};

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
// CURRENT USER HELPER
// =========================================================

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
    localStorage.getItem('userUsername') ||
    localStorage.getItem('userEmail') ||
    'User'
  );
}

function isDataOwner(data) {
  return data.createdBy === getCurrentUserKey();
}

// =========================================================
// ONLINE USER TRACKER
// =========================================================

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

function updateCurrentUserOnlineStatus() {
  IU_updateOnlineStatus();
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

function checkKontingenAccess(kontigen) {
  const currentUser = getCurrentUserKey();
  const isOwner = kontigen.owner === currentUser;
  const isMember = Array.isArray(kontigen.members) && kontigen.members.includes(currentUser);

  return isOwner || isMember;
}

// =========================================================
// STORAGE
// =========================================================

function getKontingenStorageKey() {
  return 'kontingen_' + currentKontigen.code;
}

function loadDetailData() {
  const savedData = localStorage.getItem(getKontingenStorageKey());

  if (savedData) {
    try {
      const data = JSON.parse(savedData);

      pelatihList = data.pelatih || [];
      atletList = data.atlet || [];
      programList = data.program || [];
      laporanBulananList = data.laporanBulanan || [];
      jadwalList = data.jadwal || [];
      absensiData = data.absensi || {};
    } catch (error) {
      pelatihList = [];
      atletList = [];
      programList = [];
      laporanBulananList = [];
      jadwalList = [];
      absensiData = {};
    }
  } else {
    pelatihList = [];
    atletList = [];
    programList = [];
    laporanBulananList = [];
    jadwalList = [];
    absensiData = {};
  }
}

function saveDetailData() {
  const data = {
    pelatih: pelatihList,
    atlet: atletList,
    program: programList,
    laporanBulanan: laporanBulananList,
    jadwal: jadwalList,
    absensi: absensiData
  };

  localStorage.setItem(getKontingenStorageKey(), JSON.stringify(data));
}

// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener('DOMContentLoaded', function () {
  if (!checkAuth()) return;

  IU_startOnlineTracker();
  updateCurrentUserOnlineStatus();
  setInterval(updateCurrentUserOnlineStatus, 10000);

  loadKontigenData();
  loadDetailData();

  loadUserInfo();
  setupEventListeners();
  setTodayDate();

  renderPelatih();
  renderAtlet();
  renderProgram();
  renderLaporanBulanan();
  renderJadwal();

  const absensiDate = document.getElementById('absensiDate');

  if (absensiDate && absensiDate.value) {
    loadAbsensi();
  }
});

// =========================================================
// LOAD KONTINGEN DATA
// =========================================================

function loadKontigenData() {
  const selected = localStorage.getItem('currentKontigen');

  if (!selected) {
    notify('Kontingen tidak ditemukan, kembali ke dashboard.', 'error', 1200)
      .then(function () {
        window.location.href = 'home.html';
      });

    return;
  }

  let selectedKontigen;

  try {
    selectedKontigen = JSON.parse(selected);
  } catch (error) {
    localStorage.removeItem('currentKontigen');

    notify('Data kontingen tidak valid.', 'error', 1200)
      .then(function () {
        window.location.href = 'home.html';
      });

    return;
  }

  const allKontigen = JSON.parse(localStorage.getItem('kontigenData')) || [];

  const validKontigen = allKontigen.find(function (kontigen) {
    return (
      String(kontigen.id) === String(selectedKontigen.id) ||
      String(kontigen.code) === String(selectedKontigen.code)
    );
  });

  if (!validKontigen) {
    localStorage.removeItem('currentKontigen');

    notify('Data kontingen tidak ditemukan.', 'error', 1200)
      .then(function () {
        window.location.href = 'home.html';
      });

    return;
  }

  if (!checkKontingenAccess(validKontigen)) {
    localStorage.removeItem('currentKontigen');

    notify('Anda tidak memiliki akses ke kontingen ini.', 'error', 1200)
      .then(function () {
        window.location.href = 'home.html';
      });

    return;
  }

  currentKontigen = validKontigen;
  localStorage.setItem('currentKontigen', JSON.stringify(currentKontigen));

  displayKontigenInfo();
}

function displayKontigenInfo() {
  const kontigenName = document.getElementById('kontigenName');
  const kontigenAddress = document.getElementById('kontigenAddress');
  const kontigenCode = document.getElementById('kontigenCode');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');

  if (kontigenName) {
    kontigenName.textContent = currentKontigen.name || 'Nama Kontingen Tidak Ditemukan';
  }

  if (kontigenAddress) {
    kontigenAddress.textContent =
      currentKontigen.address ||
      currentKontigen.desc ||
      'Alamat belum diisi';
  }

  if (kontigenCode) {
    kontigenCode.textContent = currentKontigen.code || '-';
  }

  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = ' / ' + (currentKontigen.name || 'Kontingen Detail');
  }
}

function loadUserInfo() {
  const userInfo = document.getElementById('userInfo');

  if (userInfo) {
    userInfo.textContent = getCurrentUserName();
  }
}

// =========================================================
// EVENT LISTENER
// =========================================================

function setupEventListeners() {
  const pelatihForm = document.getElementById('addPelatihForm');
  const atletForm = document.getElementById('addAtletForm');
  const programForm = document.getElementById('uploadProgramForm');
  const laporanForm = document.getElementById('uploadLaporanForm');
  const jadwalForm = document.getElementById('addJadwalForm');

  if (pelatihForm) {
    pelatihForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addPelatih();
    });
  }

  if (atletForm) {
    atletForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addAtlet();
    });
  }

  if (programForm) {
    programForm.addEventListener('submit', function (e) {
      e.preventDefault();
      uploadProgram();
    });
  }

  if (laporanForm) {
    laporanForm.addEventListener('submit', function (e) {
      e.preventDefault();
      uploadLaporanBulanan();
    });
  }

  if (jadwalForm) {
    jadwalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addJadwal();
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

function setTodayDate() {
  const absensiDate = document.getElementById('absensiDate');

  if (absensiDate) {
    absensiDate.value = new Date().toISOString().split('T')[0];
  }
}

// =========================================================
// TAB
// =========================================================

function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');

  tabs.forEach(function (tab) {
    tab.classList.remove('active');
  });

  buttons.forEach(function (button) {
    button.classList.remove('active');
  });

  const selectedTab = document.getElementById(tabName);

  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }

  loadDetailData();

  if (tabName === 'data-pelatih') renderPelatih();
  if (tabName === 'data-atlet') renderAtlet();
  if (tabName === 'program-latihan') renderProgram();
  if (tabName === 'absensi') loadAbsensi();
  if (tabName === 'jadwal') renderJadwal();
  if (tabName === 'laporan-bulanan') renderLaporanBulanan();
}

// =========================================================
// MODAL
// =========================================================

function openAddPelatihModal() {
  openModal('addPelatihModal');
}

function openAddAtletModal() {
  openModal('addAtletModal');
}

function openUploadProgramModal() {
  openModal('uploadProgramModal');
}

function openUploadLaporanModal() {
  openModal('uploadLaporanModal');
}

function openAddJadwalModal() {
  openModal('addJadwalModal');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);

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

function editKontigenInfo() {
  notify('Informasi kontingen tidak dapat diubah dari halaman detail.', 'info');
}

// =========================================================
// FILE HELPER
// =========================================================

function fileToDataURL(file) {
  return new Promise(function (resolve, reject) {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      resolve(e.target.result);
    };

    reader.onerror = function () {
      reject(new Error('Gagal membaca file.'));
    };

    reader.readAsDataURL(file);
  });
}

function getFileIcon(fileType) {
  const type = String(fileType || '').toLowerCase();

  if (type.includes('pdf')) return '📄';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return '📊';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) return '🖼️';

  return '📋';
}

function downloadBase64File(fileData, fileName) {
  if (!fileData) {
    notify('File lama tidak memiliki data download. Upload ulang file agar bisa didownload.', 'warning');
    return;
  }

  const link = document.createElement('a');
  link.href = fileData;
  link.download = fileName || 'file-download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =========================================================
// PELATIH
// =========================================================

async function addPelatih() {
  const nama = document.getElementById('pelatihNama').value.trim();
  const usia = document.getElementById('pelatihUsia').value.trim();
  const ttl = document.getElementById('pelatihTTL').value;
  const prestasi = document.getElementById('pelatihPrestasi').value.trim();
  const foto = document.getElementById('pelatihFoto').files[0];

  if (!nama) {
    notify('Nama pelatih harus diisi!', 'warning');
    return;
  }

  try {
    const fotoData = foto
      ? await fileToDataURL(foto)
      : 'https://via.placeholder.com/280x200?text=No+Photo';

    const pelatih = {
      id: Date.now(),
      nama: nama,
      usia: usia,
      ttl: ttl,
      prestasi: prestasi,
      foto: fotoData,
      createdBy: getCurrentUserKey(),
      createdByName: getCurrentUserName(),
      createdAt: new Date().toISOString()
    };

    pelatihList.push(pelatih);
    saveDetailData();

    document.getElementById('addPelatihForm').reset();
    closeModal('addPelatihModal');

    renderPelatih();

    notify('Data pelatih berhasil disimpan.', 'success');
  } catch (error) {
    notify('Gagal menyimpan foto pelatih.', 'error');
  }
}

function renderPelatih() {
  const grid = document.getElementById('pelatihGrid');

  if (!grid) return;

  grid.innerHTML = '';

  if (pelatihList.length === 0) {
    grid.innerHTML = '<div class="empty-state">Belum ada data pelatih</div>';
    return;
  }

  pelatihList.forEach(function (pelatih) {
    const card = createDataCard(pelatih, 'pelatih');
    grid.appendChild(card);
  });
}

function editPelatih(id) {
  const pelatih = pelatihList.find(function (item) {
    return item.id === id;
  });

  if (!pelatih) {
    notify('Data pelatih tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(pelatih)) {
    notify('Anda tidak dapat mengubah data ini karena bukan pembuat data.', 'error');
    return;
  }

  const newNama = prompt('Ubah nama pelatih:', pelatih.nama);

  if (newNama && newNama.trim() !== '') {
    pelatih.nama = newNama.trim();

    saveDetailData();
    renderPelatih();

    notify('Data pelatih berhasil diubah.', 'success');
  }
}

function deletePelatih(id) {
  const pelatih = pelatihList.find(function (item) {
    return item.id === id;
  });

  if (!pelatih) {
    notify('Data pelatih tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(pelatih)) {
    notify('Anda tidak dapat menghapus data ini karena bukan pembuat data.', 'error');
    return;
  }

  askConfirm('Hapus data pelatih ini?')
    .then(function (confirmed) {
      if (!confirmed) return;

      pelatihList = pelatihList.filter(function (item) {
        return item.id !== id;
      });

      saveDetailData();
      renderPelatih();

      notify('Data pelatih berhasil dihapus.', 'success');
    });
}

// =========================================================
// ATLET
// =========================================================

async function addAtlet() {
  const nama = document.getElementById('atletNama').value.trim();
  const usia = document.getElementById('atletUsia').value.trim();
  const ttl = document.getElementById('atletTTL').value;
  const prestasi = document.getElementById('atletPrestasi').value.trim();
  const foto = document.getElementById('atletFoto').files[0];

  if (!nama) {
    notify('Nama atlet harus diisi!', 'warning');
    return;
  }

  try {
    const fotoData = foto
      ? await fileToDataURL(foto)
      : 'https://via.placeholder.com/280x200?text=No+Photo';

    const atlet = {
      id: Date.now(),
      nama: nama,
      usia: usia,
      ttl: ttl,
      prestasi: prestasi,
      foto: fotoData,
      createdBy: getCurrentUserKey(),
      createdByName: getCurrentUserName(),
      createdAt: new Date().toISOString()
    };

    atletList.push(atlet);
    saveDetailData();

    document.getElementById('addAtletForm').reset();
    closeModal('addAtletModal');

    renderAtlet();

    notify('Data atlet berhasil disimpan.', 'success');
  } catch (error) {
    notify('Gagal menyimpan foto atlet.', 'error');
  }
}

function renderAtlet() {
  const grid = document.getElementById('atletGrid');

  if (!grid) return;

  grid.innerHTML = '';

  if (atletList.length === 0) {
    grid.innerHTML = '<div class="empty-state">Belum ada data atlet</div>';
    return;
  }

  atletList.forEach(function (atlet) {
    const card = createDataCard(atlet, 'atlet');
    grid.appendChild(card);
  });
}

function editAtlet(id) {
  const atlet = atletList.find(function (item) {
    return item.id === id;
  });

  if (!atlet) {
    notify('Data atlet tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(atlet)) {
    notify('Anda tidak dapat mengubah data ini karena bukan pembuat data.', 'error');
    return;
  }

  const newNama = prompt('Ubah nama atlet:', atlet.nama);

  if (newNama && newNama.trim() !== '') {
    atlet.nama = newNama.trim();

    saveDetailData();
    renderAtlet();

    notify('Data atlet berhasil diubah.', 'success');
  }
}

function deleteAtlet(id) {
  const atlet = atletList.find(function (item) {
    return item.id === id;
  });

  if (!atlet) {
    notify('Data atlet tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(atlet)) {
    notify('Anda tidak dapat menghapus data ini karena bukan pembuat data.', 'error');
    return;
  }

  askConfirm('Hapus data atlet ini?')
    .then(function (confirmed) {
      if (!confirmed) return;

      atletList = atletList.filter(function (item) {
        return item.id !== id;
      });

      saveDetailData();
      renderAtlet();

      notify('Data atlet berhasil dihapus.', 'success');
    });
}

// =========================================================
// DATA CARD
// =========================================================

function createDataCard(data, type) {
  const card = document.createElement('div');
  card.className = 'data-card';

  const usia = data.usia ? `Usia: ${escapeHTML(data.usia)} tahun` : '';
  const ttl = data.ttl ? `TTL: ${formatDate(new Date(data.ttl))}` : '';
  const owner = isDataOwner(data);

  const editFunction = type === 'pelatih' ? 'editPelatih' : 'editAtlet';
  const deleteFunction = type === 'pelatih' ? 'deletePelatih' : 'deleteAtlet';

  card.innerHTML = `
    <img src="${data.foto}" alt="${escapeHTML(data.nama)}">

    <div class="data-card-content">
      <h4>${escapeHTML(data.nama)}</h4>

      ${usia ? `<p>${usia}</p>` : ''}
      ${ttl ? `<p>${ttl}</p>` : ''}

      ${
        data.prestasi
          ? `<p><strong>Prestasi:</strong> ${escapeHTML(data.prestasi).substring(0, 80)}${data.prestasi.length > 80 ? '...' : ''}</p>`
          : ''
      }

      <p style="font-size: 12px; color: #777; margin-top: 8px;">
        Dibuat oleh: ${escapeHTML(data.createdByName || data.createdBy || '-')}
      </p>

      <div class="data-card-actions">
        ${
          owner
            ? `
              <button onclick="${editFunction}(${data.id})">✎ Edit</button>
              <button class="delete" onclick="${deleteFunction}(${data.id})">🗑 Hapus</button>
            `
            : `
              <button disabled style="opacity: 0.5; cursor: not-allowed;">🔒 Tidak bisa diedit</button>
            `
        }
      </div>
    </div>
  `;

  return card;
}

// =========================================================
// PROGRAM LATIHAN
// =========================================================

function uploadProgram() {
  const nama = document.getElementById('programNama').value.trim();
  const desc = document.getElementById('programDesc').value.trim();
  const file = document.getElementById('programFile').files[0];

  if (!nama || !file) {
    notify('Nama program dan file harus diisi!', 'warning');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const program = {
      id: Date.now(),
      nama: nama,
      desc: desc,
      fileName: file.name,
      fileType: file.type || file.name.split('.').pop(),
      fileData: e.target.result,
      uploadDate: formatDate(new Date()),
      createdBy: getCurrentUserKey(),
      createdByName: getCurrentUserName(),
      createdAt: new Date().toISOString()
    };

    programList.push(program);
    saveDetailData();

    document.getElementById('uploadProgramForm').reset();
    closeModal('uploadProgramModal');

    renderProgram();

    notify('Program latihan berhasil disimpan.', 'success');
  };

  reader.onerror = function () {
    notify('Gagal membaca file program latihan.', 'error');
  };

  reader.readAsDataURL(file);
}

function renderProgram() {
  const list = document.getElementById('programList');

  if (!list) return;

  list.innerHTML = '';

  if (programList.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada file program latihan</div>';
    return;
  }

  programList.forEach(function (program) {
    const icon = getFileIcon(program.fileType || program.fileName || '');
    const owner = isDataOwner(program);

    const item = document.createElement('div');
    item.className = 'program-item';

    item.innerHTML = `
      <div style="display: flex; align-items: flex-start; flex: 1;">
        <div class="program-item-icon">${icon}</div>

        <div class="program-info">
          <h4>${escapeHTML(program.nama)}</h4>
          <p>File: ${escapeHTML(program.fileName || '-')}</p>
          <p>Tanggal: ${escapeHTML(program.uploadDate || '-')}</p>

          ${program.desc ? `<p>${escapeHTML(program.desc)}</p>` : ''}

          <p style="font-size: 12px; color: #777; margin-top: 8px;">
            Dibuat oleh: ${escapeHTML(program.createdByName || program.createdBy || '-')}
          </p>
        </div>
      </div>

      <div class="program-actions">
        <button onclick="downloadFile(${program.id})">📥 Download</button>

        ${
          owner
            ? `<button class="delete" onclick="deleteProgram(${program.id})">🗑 Hapus</button>`
            : `<button disabled style="opacity: 0.5; cursor: not-allowed;">🔒 Tidak bisa dihapus</button>`
        }
      </div>
    `;

    list.appendChild(item);
  });
}

function downloadFile(id) {
  const program = programList.find(function (item) {
    return item.id === id;
  });

  if (!program) {
    notify('File tidak ditemukan.', 'error');
    return;
  }

  downloadBase64File(program.fileData, program.fileName || 'program-latihan');
}

function deleteProgram(id) {
  const program = programList.find(function (item) {
    return item.id === id;
  });

  if (!program) {
    notify('Program tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(program)) {
    notify('Anda tidak dapat menghapus program ini karena bukan pembuat data.', 'error');
    return;
  }

  askConfirm('Hapus file program latihan ini?')
    .then(function (confirmed) {
      if (!confirmed) return;

      programList = programList.filter(function (item) {
        return item.id !== id;
      });

      saveDetailData();
      renderProgram();

      notify('Program berhasil dihapus.', 'success');
    });
}

function downloadProgram() {
  if (programList.length === 0) {
    notify('Belum ada program latihan untuk didownload.', 'warning');
    return;
  }

  programList.forEach(function (program) {
    if (program.fileData) {
      downloadBase64File(program.fileData, program.fileName || 'program-latihan');
    }
  });
}

// =========================================================
// LAPORAN BULANAN
// =========================================================

function uploadLaporanBulanan() {
  const nama = document.getElementById('laporanNama').value.trim();
  const desc = document.getElementById('laporanDesc').value.trim();
  const file = document.getElementById('laporanFile').files[0];

  if (!nama || !file) {
    notify('Nama laporan dan file harus diisi!', 'warning');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const laporan = {
      id: Date.now(),
      nama: nama,
      desc: desc,
      fileName: file.name,
      fileType: file.type || file.name.split('.').pop(),
      fileData: e.target.result,
      uploadDate: formatDate(new Date()),
      createdBy: getCurrentUserKey(),
      createdByName: getCurrentUserName(),
      createdAt: new Date().toISOString()
    };

    laporanBulananList.push(laporan);
    saveDetailData();

    document.getElementById('uploadLaporanForm').reset();
    closeModal('uploadLaporanModal');

    renderLaporanBulanan();

    notify('Laporan bulanan berhasil disimpan.', 'success');
  };

  reader.onerror = function () {
    notify('Gagal membaca file laporan bulanan.', 'error');
  };

  reader.readAsDataURL(file);
}

function renderLaporanBulanan() {
  const list = document.getElementById('laporanBulananList');

  if (!list) return;

  list.innerHTML = '';

  if (laporanBulananList.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada file laporan bulanan</div>';
    return;
  }

  laporanBulananList.forEach(function (laporan) {
    const icon = getFileIcon(laporan.fileType || laporan.fileName || '');
    const owner = isDataOwner(laporan);

    const item = document.createElement('div');
    item.className = 'program-item';

    item.innerHTML = `
      <div style="display: flex; align-items: flex-start; flex: 1;">
        <div class="program-item-icon">${icon}</div>

        <div class="program-info">
          <h4>${escapeHTML(laporan.nama)}</h4>
          <p>File: ${escapeHTML(laporan.fileName || '-')}</p>
          <p>Tanggal: ${escapeHTML(laporan.uploadDate || '-')}</p>

          ${laporan.desc ? `<p>${escapeHTML(laporan.desc)}</p>` : ''}

          <p style="font-size: 12px; color: #777; margin-top: 8px;">
            Dibuat oleh: ${escapeHTML(laporan.createdByName || laporan.createdBy || '-')}
          </p>
        </div>
      </div>

      <div class="program-actions">
        <button onclick="downloadLaporanFile(${laporan.id})">📥 Download</button>

        ${
          owner
            ? `<button class="delete" onclick="deleteLaporanBulanan(${laporan.id})">🗑 Hapus</button>`
            : `<button disabled style="opacity: 0.5; cursor: not-allowed;">🔒 Tidak bisa dihapus</button>`
        }
      </div>
    `;

    list.appendChild(item);
  });
}

function downloadLaporanFile(id) {
  const laporan = laporanBulananList.find(function (item) {
    return item.id === id;
  });

  if (!laporan) {
    notify('File laporan tidak ditemukan.', 'error');
    return;
  }

  downloadBase64File(laporan.fileData, laporan.fileName || 'laporan-bulanan');
}

function deleteLaporanBulanan(id) {
  const laporan = laporanBulananList.find(function (item) {
    return item.id === id;
  });

  if (!laporan) {
    notify('Laporan tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(laporan)) {
    notify('Anda tidak dapat menghapus laporan ini karena bukan pembuat data.', 'error');
    return;
  }

  askConfirm('Hapus file laporan bulanan ini?')
    .then(function (confirmed) {
      if (!confirmed) return;

      laporanBulananList = laporanBulananList.filter(function (item) {
        return item.id !== id;
      });

      saveDetailData();
      renderLaporanBulanan();

      notify('Laporan bulanan berhasil dihapus.', 'success');
    });
}

function downloadLaporanBulanan() {
  if (laporanBulananList.length === 0) {
    notify('Belum ada laporan bulanan untuk didownload.', 'warning');
    return;
  }

  laporanBulananList.forEach(function (laporan) {
    if (laporan.fileData) {
      downloadBase64File(laporan.fileData, laporan.fileName || 'laporan-bulanan');
    }
  });
}

// =========================================================
// ABSENSI
// =========================================================

function loadAbsensi() {
  const dateInput = document.getElementById('absensiDate');
  const container = document.getElementById('absensiContainer');

  if (!dateInput || !container) return;

  const date = dateInput.value;

  if (!date) {
    container.innerHTML = '<div class="empty-state">Pilih tanggal absensi terlebih dahulu</div>';
    return;
  }

  loadDetailData();

  if (atletList.length === 0) {
    container.innerHTML = '<div class="empty-state">Tambahkan atlet terlebih dahulu</div>';
    return;
  }

  renderAbsensiTable(date);
}

function renderAbsensiTable(date) {
  const container = document.getElementById('absensiContainer');

  if (!container) return;

  let html = `
    <div class="absensi-container">
      <table class="absensi-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Atlet</th>
            <th>Status</th>
            <th>Keterangan</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
  `;

  atletList.forEach(function (atlet, index) {
    const key = `${date}-${atlet.id}`;
    let record = absensiData[key];

    if (typeof record === 'string') {
      record = {
        status: record,
        createdBy: getCurrentUserKey(),
        createdByName: getCurrentUserName(),
        updatedAt: new Date().toISOString()
      };

      absensiData[key] = record;
      saveDetailData();
    }

    const status = record?.status || 'hadir';
    const hasRecord = !!record;
    const owner = !hasRecord || record.createdBy === getCurrentUserKey();

    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(atlet.nama)}</td>

        <td>
          <select
            class="absensi-status-select"
            onchange="updateAbsensi('${date}', ${atlet.id}, this.value)"
            ${owner ? '' : 'disabled'}
          >
            <option value="hadir" ${status === 'hadir' ? 'selected' : ''}>Hadir</option>
            <option value="absen" ${status === 'absen' ? 'selected' : ''}>Absen</option>
            <option value="izin" ${status === 'izin' ? 'selected' : ''}>Izin</option>
          </select>
        </td>

        <td>
          <span class="status-${status}">${String(status).toUpperCase()}</span>
        </td>

        <td>
          ${escapeHTML(record?.createdByName || record?.createdBy || '-')}
          ${owner ? '' : '<br><small>🔒 Tidak bisa diubah</small>'}
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
  const key = `${date}-${atletId}`;
  const existingRecord = absensiData[key];

  if (existingRecord && existingRecord.createdBy !== getCurrentUserKey()) {
    notify('Anda tidak dapat mengubah absensi ini karena bukan pembuat data.', 'error');
    renderAbsensiTable(date);
    return;
  }

  absensiData[key] = {
    status: status,
    createdBy: existingRecord?.createdBy || getCurrentUserKey(),
    createdByName: existingRecord?.createdByName || getCurrentUserName(),
    updatedAt: new Date().toISOString()
  };

  saveDetailData();
  renderAbsensiTable(date);

  notify('Absensi berhasil diperbarui.', 'success', 1200);
}

// =========================================================
// JADWAL
// =========================================================

function addJadwal() {
  const no = document.getElementById('jadwalNo').value.trim();
  const nama = document.getElementById('jadwalNama').value.trim();
  const tanggal = document.getElementById('jadwalTanggal').value;
  const jam = document.getElementById('jadwalJam').value;
  const tempat = document.getElementById('jadwalTempat').value.trim();

  if (!no || !nama || !tanggal) {
    notify('No, nama, dan tanggal harus diisi!', 'warning');
    return;
  }

  const jadwal = {
    id: Date.now(),
    no: no,
    nama: nama,
    tanggal: tanggal,
    jam: jam,
    tempat: tempat,
    createdBy: getCurrentUserKey(),
    createdByName: getCurrentUserName(),
    createdAt: new Date().toISOString()
  };

  jadwalList.push(jadwal);
  saveDetailData();

  document.getElementById('addJadwalForm').reset();
  closeModal('addJadwalModal');

  renderJadwal();

  notify('Jadwal pertandingan berhasil disimpan.', 'success');
}

function renderJadwal() {
  const list = document.getElementById('jadwalList');

  if (!list) return;

  list.innerHTML = '';

  if (jadwalList.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada jadwal pertandingan</div>';
    return;
  }

  jadwalList.forEach(function (jadwal) {
    const owner = isDataOwner(jadwal);
    const item = document.createElement('div');

    item.className = 'jadwal-item';

    item.innerHTML = `
      <div class="jadwal-info">
        <h4>[${escapeHTML(jadwal.no)}] ${escapeHTML(jadwal.nama)}</h4>

        <p><strong>Tanggal:</strong> ${formatDate(new Date(jadwal.tanggal))}</p>
        ${jadwal.jam ? `<p><strong>Jam:</strong> ${escapeHTML(jadwal.jam)}</p>` : ''}
        ${jadwal.tempat ? `<p><strong>Tempat:</strong> ${escapeHTML(jadwal.tempat)}</p>` : ''}

        <p style="font-size: 12px; color: #777; margin-top: 8px;">
          Dibuat oleh: ${escapeHTML(jadwal.createdByName || jadwal.createdBy || '-')}
        </p>
      </div>

      <div class="jadwal-actions">
        ${
          owner
            ? `
              <button onclick="editJadwal(${jadwal.id})">✎ Edit</button>
              <button onclick="deleteJadwal(${jadwal.id})" style="color: #ef4444; border-color: #fecaca;">🗑 Hapus</button>
            `
            : `
              <button disabled style="opacity: 0.5; cursor: not-allowed;">🔒 Tidak bisa diedit</button>
            `
        }
      </div>
    `;

    list.appendChild(item);
  });
}

function editJadwal(id) {
  const jadwal = jadwalList.find(function (item) {
    return item.id === id;
  });

  if (!jadwal) {
    notify('Jadwal tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(jadwal)) {
    notify('Anda tidak dapat mengubah jadwal ini karena bukan pembuat data.', 'error');
    return;
  }

  const newNama = prompt('Ubah nama pertandingan:', jadwal.nama);

  if (newNama && newNama.trim() !== '') {
    jadwal.nama = newNama.trim();

    saveDetailData();
    renderJadwal();

    notify('Jadwal berhasil diubah.', 'success');
  }
}

function deleteJadwal(id) {
  const jadwal = jadwalList.find(function (item) {
    return item.id === id;
  });

  if (!jadwal) {
    notify('Jadwal tidak ditemukan.', 'error');
    return;
  }

  if (!isDataOwner(jadwal)) {
    notify('Anda tidak dapat menghapus jadwal ini karena bukan pembuat data.', 'error');
    return;
  }

  askConfirm('Hapus jadwal ini?')
    .then(function (confirmed) {
      if (!confirmed) return;

      jadwalList = jadwalList.filter(function (item) {
        return item.id !== id;
      });

      saveDetailData();
      renderJadwal();

      notify('Jadwal berhasil dihapus.', 'success');
    });
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
// HELPER
// =========================================================

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return '-';
  }

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return date.toLocaleDateString('id-ID', options);
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}