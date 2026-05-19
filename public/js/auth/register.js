const images = [
  '../../../public/assets/login1.jpg',
  '../../../public/assets/login2.jpg',
  '../../../public/assets/login3.jpg',
  '../../../public/assets/gallery1.png'
];

let currentImageIndex = 0;

function changeImage() {
  const rightDiv = document.querySelector('.right');
  if (!rightDiv) return;

  rightDiv.style.backgroundImage = `url('${images[currentImageIndex]}')`;
  currentImageIndex = (currentImageIndex + 1) % images.length;
}

window.addEventListener('load', function () {
  changeImage();
  setInterval(changeImage, 3000);
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function saveLoginSession(user) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', user.email || user.username);
  localStorage.setItem('userUsername', user.username);
  localStorage.setItem('userRole', user.role || 'admin');
  localStorage.setItem('userName', user.fullname || user.name || user.username);

  updateOnlineUser(user, true);
}

function updateOnlineUser(user, isOnline) {
  const username = user.username || user.email;
  const email = user.email || '';

  let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];

  onlineUsers = onlineUsers.filter(function (item) {
    return item.username !== username && item.email !== email;
  });

  if (isOnline) {
    onlineUsers.push({
      username: username,
      email: email,
      name: user.fullname || user.name || username,
      role: user.role || 'admin',
      status: 'online',
      lastLogin: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
  }

  localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
}

function logActivity(type, description, detail = '') {
  const log = {
    id: Date.now(),
    timestamp: new Date().toLocaleString('id-ID'),
    admin: localStorage.getItem('userUsername') || localStorage.getItem('userEmail') || 'Unknown',
    type: type,
    description: description,
    detail: detail
  };

  const activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
  activityLog.unshift(log);

  if (activityLog.length > 100) {
    activityLog.length = 100;
  }

  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

function notify(message, type = 'info', duration = 2200) {
  if (typeof showToast === 'function') {
    return showToast(message, type, duration);
  }

  alert(message);
  return Promise.resolve(true);
}

const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value.trim();

    const agreeTermsElement = document.getElementById('agreeTerms');
    const agreeTerms = agreeTermsElement ? agreeTermsElement.checked : true;

    if (!fullname) {
      notify('Nama lengkap tidak boleh kosong!', 'warning', 2200);
      return;
    }

    if (!email || !isValidEmail(email)) {
      notify('Email tidak valid!', 'error', 2200);
      return;
    }

    if (!username || username.length < 3) {
      notify('Username minimal 3 karakter!', 'warning', 2200);
      return;
    }

    if (!password || password.length < 6) {
      notify('Password minimal 6 karakter!', 'warning', 2200);
      return;
    }

    if (password !== confirmPassword) {
      notify('Password tidak cocok!', 'error', 2200);
      return;
    }

    if (!agreeTerms) {
      notify('Anda harus setuju dengan Syarat & Ketentuan!', 'warning', 2200);
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const systemAdmins = JSON.parse(localStorage.getItem('systemAdmins')) || [];
    const reservedUsernames = ['superadmin', 'admin', 'pelatih'];

    if (reservedUsernames.includes(username)) {
      notify('Username ini sudah disediakan oleh sistem. Silakan gunakan username lain!', 'error', 2200);
      return;
    }

    const userExists = users.some(function (user) {
      return (
        String(user.email || '').toLowerCase() === email ||
        String(user.username || '').toLowerCase() === username
      );
    });

    const adminExists = systemAdmins.some(function (admin) {
      return (
        String(admin.email || '').toLowerCase() === email ||
        String(admin.username || '').toLowerCase() === username
      );
    });

    if (userExists || adminExists) {
      notify('Email atau username sudah digunakan!', 'error', 2200);
      return;
    }

    const newUser = {
      id: Date.now(),
      fullname: fullname,
      name: fullname,
      email: email,
      username: username,
      password: password,
      phone: phone,
      role: 'admin',
      kontingen: '',
      source: 'register',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    saveLoginSession(newUser);

    logActivity(
      'register',
      `${fullname} membuat akun baru`,
      `Username: ${username}`
    );

    notify('Registrasi berhasil! Anda langsung masuk ke dashboard.', 'success', 1200)
      .then(function () {
        window.location.href = '../admin/home.html';
      });
  });
}