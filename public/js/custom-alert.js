
(function () {
  const nativeAlert = window.alert;
  const nativeConfirm = window.confirm;

  function detectAlertType(message) {
    const text = String(message || '').toLowerCase();

    if (
      text.includes('berhasil') ||
      text.includes('success') ||
      text.includes('sukses') ||
      text.includes('selamat') ||
      text.includes('login berhasil') ||
      text.includes('✅')
    ) {
      return 'success';
    }

    if (
      text.includes('gagal') ||
      text.includes('error') ||
      text.includes('salah') ||
      text.includes('tidak ditemukan') ||
      text.includes('tidak sesuai') ||
      text.includes('belum terdaftar') ||
      text.includes('password salah') ||
      text.includes('❌')
    ) {
      return 'error';
    }

    if (
      text.includes('hapus') ||
      text.includes('yakin') ||
      text.includes('peringatan') ||
      text.includes('perhatian') ||
      text.includes('logout') ||
      text.includes('warning') ||
      text.includes('konfirmasi') ||
      text.includes('⚠')
    ) {
      return 'warning';
    }

    return 'info';
  }

  function getToastIcon(type) {
    if (type === 'success') return '✓';
    if (type === 'error') return '!';
    if (type === 'warning') return '!';
    return 'i';
  }

  function getToastTitle(type) {
    if (type === 'success') return 'Berhasil';
    if (type === 'error') return 'Gagal';
    if (type === 'warning') return 'Konfirmasi';
    return 'Informasi';
  }

  function cleanMessage(message) {
    return String(message || '')
      .replace(/[✅❌⚠️]/g, '')
      .trim();
  }

  function getOrCreateToastContainer() {
    let container = document.querySelector('.custom-toast-container');

    if (!container) {
      container = document.createElement('div');
      container.className = 'custom-toast-container';
      document.body.appendChild(container);
    }

    return container;
  }

  function removeToast(toast, resolve, value) {
    if (!toast || toast.classList.contains('hide')) return;

    toast.classList.remove('show');
    toast.classList.add('hide');

    setTimeout(function () {
      toast.remove();

      if (typeof resolve === 'function') {
        resolve(value);
      }
    }, 260);
  }

  function showToastNotification(message, type, duration) {
    return new Promise(function (resolve) {
      const finalType = type || detectAlertType(message);
      const finalDuration = duration || 2200;
      const container = getOrCreateToastContainer();

      const toast = document.createElement('div');
      toast.className = `custom-toast custom-toast-${finalType}`;

      toast.innerHTML = `
        <div class="custom-toast-icon">${getToastIcon(finalType)}</div>
        <div class="custom-toast-content">
          <div class="custom-toast-title">${getToastTitle(finalType)}</div>
          <div class="custom-toast-message">${cleanMessage(message)}</div>
        </div>
      `;

      container.appendChild(toast);

      setTimeout(function () {
        toast.classList.add('show');
      }, 20);

      setTimeout(function () {
        removeToast(toast, resolve, true);
      }, finalDuration);
    });
  }

  function showToastConfirm(message, type, title) {
    return new Promise(function (resolve) {
      const finalType = type || 'warning';
      const finalTitle = title || 'Konfirmasi';
      const container = getOrCreateToastContainer();

      const toast = document.createElement('div');
      toast.className = `custom-toast custom-toast-confirm custom-toast-${finalType}`;

      toast.innerHTML = `
        <div class="custom-toast-icon">${getToastIcon(finalType)}</div>

        <div class="custom-toast-content">
          <div class="custom-toast-title">${finalTitle}</div>
          <div class="custom-toast-message">${cleanMessage(message)}</div>

          <div class="custom-toast-actions">
            <button type="button" class="custom-toast-btn cancel" data-confirm="false">
              Batal
            </button>
            <button type="button" class="custom-toast-btn confirm" data-confirm="true">
              Ya
            </button>
          </div>
        </div>
      `;

      container.appendChild(toast);

      setTimeout(function () {
        toast.classList.add('show');
      }, 20);

      const cancelButton = toast.querySelector('[data-confirm="false"]');
      const confirmButton = toast.querySelector('[data-confirm="true"]');

      cancelButton.addEventListener('click', function () {
        removeToast(toast, resolve, false);
      });

      confirmButton.addEventListener('click', function () {
        removeToast(toast, resolve, true);
      });
    });
  }

  window.showToast = function (message, type, duration) {
    return showToastNotification(
      message,
      type || detectAlertType(message),
      duration || 2200
    );
  };

  window.showAlert = function (message, type, title) {
    return showToastNotification(
      message,
      type || detectAlertType(message),
      2200
    );
  };

  window.showConfirm = function (message, type, title) {
    return showToastConfirm(
      message,
      type || 'warning',
      title || 'Konfirmasi'
    );
  };

  window.customConfirm = function (message, type, title) {
    return showToastConfirm(
      message,
      type || 'warning',
      title || 'Konfirmasi'
    );
  };

  window.alert = function (message) {
    showToastNotification(
      message,
      detectAlertType(message),
      2200
    );
  };

  window.nativeAlert = nativeAlert;
  window.nativeConfirm = nativeConfirm;
})();