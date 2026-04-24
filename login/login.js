// Array gambar dari folder asset
const images = [
  '../asset/bola.jpg',
  '../asset/badminton2hd.jpg',
  '../asset/lari3.jpg',
  '../asset/silat.jpg'
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

  if(username === "admin" && password === "12345") {
    alert("Login berhasil!");
  } else {
    alert("Username atau password salah!");
  }
});