// Focus blur
window.addEventListener('blur', () => {
  document.getElementById('viewer-blur').classList.add('blur');
});
window.addEventListener('focus', () => {
  document.getElementById('viewer-blur').classList.remove('blur');
});

// Watermark (Mock IP, you can inject real one from backend)
const ip = '192.168.0.1'; // Example IP or use server-side render
const date = new Date().toLocaleString();
const id = window.location.pathname.split('/').pop() || 'guest';
document.getElementById('watermark').textContent = `${ip} | ${date} | ${id}`;

// Key protection
document.addEventListener('keydown', e => {
  if (
    (e.ctrlKey && ['s', 'S', 'u', 'U'].includes(e.key)) ||
    e.key === 'PrintScreen' || e.keyCode === 44
  ) {
    e.preventDefault();
    alert('This action is blocked and logged.');
  }
});

// Bubble background animation
const canvas = document.getElementById('bubbles-bg');
const ctx = canvas.getContext('2d');
let bubbles = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function createBubbles() {
  bubbles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 8 + 2,
    dx: (Math.random() - 0.5) * 0.5,
    dy: -Math.random() * 0.5 - 0.1
  }));
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,255,255,0.2)';
  bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    b.x += b.dx;
    b.y += b.dy;
    if (b.y < -b.r) {
      b.y = canvas.height + b.r;
      b.x = Math.random() * canvas.width;
    }
  });
  requestAnimationFrame(draw);
}
createBubbles();
draw();

// Fullscreen
const overlay = document.getElementById('fullscreen-overlay');
function openFullscreen(element) {
  overlay.innerHTML = '<span class="close-btn"><i class="fas fa-times-circle"></i></span>';
  overlay.appendChild(element);
  overlay.style.display = 'flex';
}
function closeFullscreen() {
  overlay.style.display = 'none';
  overlay.innerHTML = '<span class="close-btn"><i class="fas fa-times-circle"></i></span>';
}
document.addEventListener('click', e => {
  if (e.target.closest('.close-btn')) closeFullscreen();
});

// Accordion
function toggleAccordion(type) {
  const content = document.getElementById('accordion-' + type);
  content.classList.toggle('open');
}
