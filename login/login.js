// Array gambar dari folder asset
const images = [
  '../asset/login1.jpg',
  '../asset/login2.jpg',
  '../asset/login3.jpg',
  '../asset/gallery1.png'
];

let currentImageIndex = 0;

// Fungsi untuk mengubah gambar
function changeImage() {
  const rightDiv = document.querySelector('.right');
  rightDiv.style.backgroundImage = `url('${images[currentImageIndex]}')`;
  currentImageIndex = (currentImageIndex + 1) % images.length;
}

// Set gambar pertama saat halaman load
window.addEventListener('load', function() {
  changeImage();
  // Auto-slide setiap 3 detik
  setInterval(changeImage, 3000);
});

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  // User database dengan role
  const users = {
    "admin": { password: "12345", role: "admin", name: "Admin Pelatih" },
    "pelatih": { password: "password123", role: "admin", name: "Pelatih" },
    "superadmin": { password: "super123", role: "superadmin", name: "Super Admin" }
  };

  if(users[username] && users[username].password === password) {
    // Store user info in localStorage
    localStorage.setItem('userEmail', username);
    localStorage.setItem('userRole', users[username].role);
    localStorage.setItem('userName', users[username].name);
    
    // Log login activity
    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('id-ID'),
      admin: username,
      type: 'login',
      description: `${users[username].name} login ke sistem`,
      detail: `Role: ${users[username].role}`
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
    
    alert("Login berhasil! Mengarahkan...");
    
    // Redirect based on role
    setTimeout(function() {
      if (users[username].role === 'superadmin') {
        window.location.href = '../superadmin/admin-dashboard.html';
      } else {
        window.location.href = '../admin/home.html';
      }
    }, 1000);
  } else {
    alert("Username atau password salah!");
  }
