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

function getDefaultAccounts() {
  return {
    defaultSuperAdmin: {
      username: 'superadmin',
      password: 'super123',
      role: 'superadmin',
      name: 'Super Admin',
      email: 'superadmin@atlet.local',
      source: 'default'
    },

    defaultAdmins: [
      {
        username: 'admin',
        password: '12345',
        role: 'admin',
        name: 'Admin Pelatih',
        email: 'admin@atlet.local',
        kontingen: '',
        source: 'default'
      },
      {
        username: 'pelatih',
        password: 'password123',
        role: 'admin',
        name: 'Pelatih',
        email: 'pelatih@atlet.local',
        kontingen: '',
        source: 'default'
      }
    ]
  };
}

function getAllUsers() {
  const defaultAccounts = getDefaultAccounts();
  const defaultSuperAdmin = defaultAccounts.defaultSuperAdmin;
  const defaultAdmins = defaultAccounts.defaultAdmins;

  const systemAdmins = JSON.parse(localStorage.getItem('systemAdmins')) || [];
  const registeredUsers = JSON.parse(localStorage.getItem('users')) || [];

  const normalizedSystemAdmins = systemAdmins.map(function (admin) {
    return {
      username: String(admin.username || '').toLowerCase(),
      password: String(admin.password || ''),
      role: admin.role || 'admin',
      name: admin.name || admin.fullname || admin.username,
      email: String(admin.email || admin.username || '').toLowerCase(),
      phone: admin.phone || '',
      kontingen: admin.kontingen || '',
      source: admin.source || 'system'
    };
  });

  const normalizedRegisteredUsers = registeredUsers.map(function (user) {
    return {
      username: String(user.username || '').toLowerCase(),
      password: String(user.password || ''),
      role: user.role || 'admin',
      name: user.fullname || user.name || user.username,
      email: String(user.email || user.username || '').toLowerCase(),
      phone: user.phone || '',
      kontingen: user.kontingen || '',
      source: user.source || 'register'
    };
  });

  return [
    defaultSuperAdmin,
    ...defaultAdmins,
    ...normalizedSystemAdmins,
    ...normalizedRegisteredUsers
  ];
}

function saveLoginSession(user) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', user.email || user.username);
  localStorage.setItem('userUsername', user.username);
  localStorage.setItem('userRole', user.role || 'admin');
  localStorage.setItem('userName', user.name || user.fullname || user.username);

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
      name: user.name || user.fullname || username,
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

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const loginInput = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    const foundUser = getAllUsers().find(function (user) {
      const userUsername = String(user.username || '').toLowerCase();
      const userEmail = String(user.email || '').toLowerCase();

      return userUsername === loginInput || userEmail === loginInput;
    });

    if (!foundUser || String(foundUser.password) !== String(password)) {
      notify('Username/email atau password salah!', 'error', 2200);
      return;
    }

    saveLoginSession(foundUser);

    logActivity(
      'login',
      `${foundUser.name || foundUser.username} login ke sistem`,
      `Role: ${foundUser.role}`
    );

    if (foundUser.role === 'superadmin') {
      notify('Login berhasil! Masuk sebagai Super Admin.', 'success', 1200)
        .then(function () {
          window.location.href = '../superadmin/dashboard.html';
        });
    } else {
      notify('Login berhasil! Selamat datang.', 'success', 1200)
        .then(function () {
          window.location.href = '../admin/home.html';
        });
    }
  });
}