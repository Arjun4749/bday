/* ============================================================
   app.js — Main Application Logic
   Language: JavaScript ES2022 (async/await, fetch API,
             Intersection Observer, Web Audio API)
   ============================================================ */

'use strict';

// ── STATE ──────────────────────────────────────────────────────
const state = {
  currentPage: 0,
  letterOpened: false,
  candlesBlown: [false, false, false],
  cakeCut: false,
  musicPlaying: false,
  wishes: [],
  wishIndex: 0,
};

// ── DOM REFS ───────────────────────────────────────────────────
const pages      = document.querySelectorAll('.page');
const dots       = document.querySelectorAll('.dot');
const musicFab   = document.getElementById('musicFab');
const bgAudio    = document.getElementById('bgAudio');
const confettiC  = document.getElementById('confettiCanvas');

// ── NAVIGATION ─────────────────────────────────────────────────
function goTo(index) {
  pages[state.currentPage].classList.remove('active');
  dots[state.currentPage].classList.remove('active');
  state.currentPage = index;
  pages[index].classList.add('active');
  dots[index].classList.add('active');

  // Trigger reveals on page 0
  if (index === 0) triggerReveals();
  // Load wishes on page 2
  if (index === 2) loadWishes();
  // Animate timeline on page 2
  if (index === 2) setTimeout(animateTimeline, 300);
}

// ── REVEAL ANIMATIONS ──────────────────────────────────────────
function triggerReveals() {
  const els = document.querySelectorAll('#p0 .reveal');
  els.forEach((el, i) => {
    setTimeout(() => el.classList.add('show'), i * 140 + 100);
  });
}

// ── DYNAMIC QUOTE (calls Node.js /api/quote or fallback) ───────
async function loadQuote() {
  const el = document.getElementById('dynamicQuote');
  const fallbacks = [
    "You are every reason, every hope and every dream I've ever had.",
    "In you I found the love of my life and my closest, truest friend.",
    "If I know what love is, it is because of you.",
    "You are my sun, my moon, and all my stars.",
    "Whatever our souls are made of, yours and mine are the same.",
  ];

  try {
    const res  = await fetch('/api/quote');
    const data = await res.json();
    typewrite(el, `"${data.quote}"`);
  } catch {
    // Offline or no server — use fallback
    const q = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    typewrite(el, `"${q}"`);
  }
}

function typewrite(el, text, speed = 28) {
  el.textContent = '';
  let i = 0;
  function next() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(next, speed);
    }
  }
  next();
}

// ── WISHES (calls Node.js /api/wishes or fallback) ─────────────
async function loadWishes() {
  const fallback = [
    "May every star in the sky shine just for you tonight. 🌟",
    "You are the poem I never knew how to write. 💌",
    "Every year with you is the best year of my life. 🥂",
    "In a universe of billions, I'd choose you every time. 💖",
    "You make ordinary moments feel extraordinary. ✨",
    "My love for you grows deeper with every heartbeat. 🌹",
  ];

  try {
    const res  = await fetch('/api/wishes');
    const data = await res.json();
    state.wishes = data.wishes;
  } catch {
    state.wishes = fallback;
  }

  cycleWishes();
}

function cycleWishes() {
  const el = document.getElementById('currentWish');
  if (!el || state.wishes.length === 0) return;

  function show() {
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = state.wishes[state.wishIndex % state.wishes.length];
      state.wishIndex++;
      el.style.opacity = '1';
    }, 500);
  }

  show();
  setInterval(show, 4000);
}

// ── TIMELINE OBSERVER ──────────────────────────────────────────
function animateTimeline() {
  const cards = document.querySelectorAll('.tl-card');
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.style.transition = 'all .7s cubic-bezier(.34,1.56,.64,1)';
      card.classList.add('visible');
    }, i * 200);
  });
}

// ── LETTER ─────────────────────────────────────────────────────
function openLetter() {
  if (state.letterOpened) return;
  state.letterOpened = true;

  const env  = document.getElementById('envelope');
  const card = document.getElementById('letterCard');

  env.style.transition = 'all .6s ease';
  env.style.transform  = 'scale(0) rotate(10deg)';
  env.style.opacity    = '0';

  setTimeout(() => {
    env.classList.add('hidden');
    card.classList.remove('hidden');
  }, 600);
}

// ── MUSIC ──────────────────────────────────────────────────────
musicFab.addEventListener('click', () => {
  if (state.musicPlaying) {
    bgAudio.pause();
    musicFab.textContent = '🎵';
  } else {
    bgAudio.play().catch(() => {});
    musicFab.textContent = '🔇';
  }
  state.musicPlaying = !state.musicPlaying;
});

// ── CAKE ───────────────────────────────────────────────────────
function blowCandle(index) {
  if (state.candlesBlown[index]) return;
  state.candlesBlown[index] = true;

  const flame = document.getElementById(`flame${index + 1}`);
  flame.style.transition = 'all .4s ease';
  flame.style.opacity    = '0';
  flame.style.transform  = 'scale(.1)';
  setTimeout(() => flame.style.display = 'none', 400);

  // Smoke particles
  const candle = document.getElementById(`candle${index + 1}Group`);
  const box    = candle.getBoundingClientRect();
  emitSmoke(box.left + box.width / 2, box.top + 10, 6);
}

function blowAllCandles() {
  [0, 1, 2].forEach((i) => setTimeout(() => blowCandle(i), i * 350));

  setTimeout(() => {
    const allOut = state.candlesBlown.every(Boolean);
    if (allOut) {
      document.getElementById('blowHint').textContent = '🌬️ All wishes made! ✨';
      document.getElementById('blowBtn').disabled = true;
      document.getElementById('blowBtn').style.opacity = '.4';
      setTimeout(() => showModal('💨🕯️✨', 'Wish Made!', 'May every dream of yours come true, My Love! 💖'), 1200);
    }
  }, 1500);
}

function cutTheCake() {
  if (state.cakeCut) return;
  state.cakeCut = true;

  // Animate cut line
  const svg  = document.getElementById('cakeSVG');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '190'); line.setAttribute('y1', '90');
  line.setAttribute('x2', '190'); line.setAttribute('y2', '390');
  line.setAttribute('stroke', 'rgba(255,255,255,0.7)');
  line.setAttribute('stroke-width', '3');
  line.setAttribute('stroke-dasharray', '300');
  line.setAttribute('stroke-dashoffset', '300');
  line.style.transition = 'stroke-dashoffset .8s ease';
  svg.appendChild(line);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => { line.setAttribute('stroke-dashoffset', '0'); });
  });

  setTimeout(() => {
    launchConfetti();
    showModal('🎂🔪🎉', 'Cake Cut!', 'Here\'s to sweetness forever, My Love! 🎂💕');
    document.getElementById('cutBtn').disabled = true;
    document.getElementById('cutBtn').style.opacity = '.4';
  }, 900);
}

function resetCake() {
  state.candlesBlown = [false, false, false];
  state.cakeCut = false;

  [1, 2, 3].forEach(i => {
    const f = document.getElementById(`flame${i}`);
    f.style.display = '';
    f.style.opacity = '1';
    f.style.transform = '';
  });

  document.getElementById('blowHint').textContent = '🕯️ Candles are lit — close your eyes and make a wish!';
  document.getElementById('blowBtn').disabled = false;
  document.getElementById('blowBtn').style.opacity = '1';
  document.getElementById('cutBtn').disabled = false;
  document.getElementById('cutBtn').style.opacity = '1';

  // Remove cut line if exists
  const oldLine = document.querySelector('#cakeSVG line');
  if (oldLine) oldLine.remove();
}

// ── SMOKE PARTICLES ────────────────────────────────────────────
function emitSmoke(x, y, count) {
  const container = document.getElementById('smokeContainer');
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      s.className = 'smoke';
      s.style.cssText = `
        left:${x + (Math.random() - .5) * 14}px;
        top:${y}px;
        animation-delay:${Math.random() * .3}s;
      `;
      container.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }, i * 80);
  }
}

// ── MODAL ──────────────────────────────────────────────────────
function showModal(emoji, title, msg) {
  document.getElementById('modalEmoji').textContent = emoji;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent   = msg;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  confettiC.style.display = 'none';
}

// ── CONFETTI ───────────────────────────────────────────────────
function launchConfetti() {
  confettiC.width  = innerWidth;
  confettiC.height = innerHeight;
  confettiC.style.display = 'block';

  const cctx   = confettiC.getContext('2d');
  const colors = ['#e8476a','#ffd700','#f07aab','#a78bfa','#ffffff','#ff6b9d','#38bdf8'];
  const shapes = ['rect','circle','triangle'];

  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * 300,
    w: 6 + Math.random() * 10,
    h: 4 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    vx: (Math.random() - .5) * 5,
    vy: 2.5 + Math.random() * 5,
    rot: Math.random() * 360,
    rotV: (Math.random() - .5) * 9,
    alpha: 1,
  }));

  let frame = 0;
  function draw() {
    cctx.clearRect(0, 0, confettiC.width, confettiC.height);
    pieces.forEach(p => {
      p.x   += p.vx; p.y += p.vy; p.rot += p.rotV;
      if (frame > 150) p.alpha -= .012;
      if (p.y > innerHeight + 20) { p.y = -20; p.x = Math.random() * innerWidth; }

      cctx.save();
      cctx.globalAlpha = Math.max(0, p.alpha);
      cctx.fillStyle   = p.color;
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot * Math.PI / 180);

      if (p.shape === 'rect') {
        cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'circle') {
        cctx.beginPath();
        cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        cctx.fill();
      } else {
        cctx.beginPath();
        cctx.moveTo(0, -p.h);
        cctx.lineTo(p.w / 2, p.h / 2);
        cctx.lineTo(-p.w / 2, p.h / 2);
        cctx.closePath();
        cctx.fill();
      }
      cctx.restore();
    });

    frame++;
    if (pieces.some(p => p.alpha > 0)) requestAnimationFrame(draw);
    else confettiC.style.display = 'none';
  }
  draw();
}

// ── KEYBOARD NAV ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' && state.currentPage < 3) goTo(state.currentPage + 1);
  if (e.key === 'ArrowLeft'  && state.currentPage > 0) goTo(state.currentPage - 1);
});

// ── INIT ───────────────────────────────────────────────────────
(async function init() {
  // Trigger page-0 reveals
  setTimeout(triggerReveals, 200);
  // Load dynamic quote
  await loadQuote();
  // Rotate quote every 8 seconds
  setInterval(loadQuote, 8000);
})();

// Expose to HTML onclick
window.goTo        = goTo;
window.openLetter  = openLetter;
window.blowAllCandles = blowAllCandles;
window.cutTheCake  = cutTheCake;
window.resetCake   = resetCake;
window.closeModal  = closeModal;
