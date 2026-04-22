// Array gambar dari folder asset
const images = [
  '../asset/bg lg 1.jpg',
  '../asset/bg lg 2.jpg',
  '../asset/bg lg 3.jpg',
  '../asset/bg lg 4.jpg'
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

document.getElementById("registerForm").addEventListener("submit", function(e) {
  e.preventDefault();

  let fullname = document.getElementById("fullname").value.trim();
  let email = document.getElementById("email").value.trim();
  let username = document.getElementById("username").value.trim();
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirmPassword").value;
  let phone = document.getElementById("phone").value.trim();
  let agreeTerms = document.getElementById("agreeTerms").checked;

  // Validasi
  if (!fullname) {
    alert("Nama lengkap tidak boleh kosong!");
    return;
  }

  if (!email || !isValidEmail(email)) {
    alert("Email tidak valid!");
    return;
  }

  if (!username || username.length < 3) {
    alert("Username minimal 3 karakter!");
    return;
  }

  if (!password || password.length < 6) {
    alert("Password minimal 6 karakter!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Password tidak cocok!");
    return;
  }

  if (!agreeTerms) {
    alert("Anda harus setuju dengan Syarat & Ketentuan!");
    return;
  }

  // Jika semua validasi lolos
  alert("Registrasi berhasil!\n\nData:\n- Nama: " + fullname + "\n- Email: " + email + "\n- Username: " + username);
  
  // Reset form
  document.getElementById("registerForm").reset();
});

// Fungsi untuk validasi email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
