/* ============================================================
   bg.js — Cinematic Canvas Background + Cursor Trail
   Language: Vanilla JavaScript (ES6+, Canvas API, WebGL-style
             layered rendering, particle systems)
   ============================================================ */

(function () {
  // ── BG CANVAS ──────────────────────────────────────────────
  const bg  = document.getElementById('bgCanvas');
  const ctx = bg.getContext('2d');

  // ── TRAIL CANVAS ───────────────────────────────────────────
  const trail  = document.getElementById('trailCanvas');
  const tctx   = trail.getContext('2d');
  let mouse    = { x: innerWidth / 2, y: innerHeight / 2 };
  let trailPts = [];

  function resize() {
    bg.width = trail.width = innerWidth;
    bg.height = trail.height = innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── MOUSE / TOUCH ──────────────────────────────────────────
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }, { passive: true });

  // ── PARTICLES ──────────────────────────────────────────────
  const COLORS = ['#e8476a','#f07aab','#d4a843','#f9a7c7','#ff6b9d','#ffd700','#c4b5fd'];

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Floating hearts
  const hearts = Array.from({ length: 32 }, () => ({
    x: rnd(0, 1600), y: rnd(0, 1000),
    size: rnd(10, 36),
    vx: rnd(-0.4, 0.4), vy: -(rnd(0.35, 0.9)),
    opacity: rnd(0.07, 0.28),
    wobble: rnd(0, Math.PI * 2),
    wobbleAmp: rnd(0.3, 1.0),
    wobbleSpeed: rnd(0.015, 0.04),
    color: pick(COLORS),
    pulse: rnd(0, Math.PI * 2),
    pulseSpeed: rnd(0.03, 0.06),
  }));

  // Stars
  const stars = Array.from({ length: 160 }, () => ({
    x: rnd(0, 1600), y: rnd(0, 1000),
    r: rnd(0.4, 2.2),
    twinkle: rnd(0, Math.PI * 2),
    speed: rnd(0.015, 0.05),
  }));

  // Light rays
  const rays = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    speed: rnd(0.001, 0.003) * (Math.random() > .5 ? 1 : -1),
    opacity: rnd(0.012, 0.035),
    width: rnd(20, 55),
  }));

  // Orbs
  const orbs = [
    { cx: .35, cy: .4, r: .22, color: 'rgba(232,71,106,', op: .06 },
    { cx: .65, cy: .6, r: .18, color: 'rgba(212,168,67,', op: .05 },
    { cx: .5,  cy: .5, r: .30, color: 'rgba(240,122,171,', op: .04 },
  ];

  // ── DRAW HEART ─────────────────────────────────────────────
  function drawHeart(x, y, s, color, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle   = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * .25);
    ctx.bezierCurveTo(x, y - s * .5,  x - s, y - s * .5, x - s, y + s * .1);
    ctx.bezierCurveTo(x - s, y + s * .7, x, y + s * 1.2, x, y + s * 1.2);
    ctx.bezierCurveTo(x, y + s * 1.2, x + s, y + s * .7, x + s, y + s * .1);
    ctx.bezierCurveTo(x + s, y - s * .5, x, y - s * .5, x, y + s * .25);
    ctx.fill();
    ctx.restore();
  }

  // ── CURSOR TRAIL ───────────────────────────────────────────
  function updateTrail() {
    trailPts.push({ x: mouse.x, y: mouse.y, life: 1.0 });
    if (trailPts.length > 28) trailPts.shift();
    trailPts.forEach(p => p.life -= 0.04);
    trailPts = trailPts.filter(p => p.life > 0);

    tctx.clearRect(0, 0, trail.width, trail.height);

    // Heart cursor
    tctx.save();
    tctx.font = '20px serif';
    tctx.fillStyle = '#e8476a';
    tctx.globalAlpha = 0.9;
    tctx.fillText('❤️', mouse.x - 10, mouse.y + 8);
    tctx.restore();

    // Trail dots
    trailPts.forEach((p, i) => {
      tctx.save();
      tctx.globalAlpha = p.life * 0.5;
      tctx.fillStyle = COLORS[i % COLORS.length];
      tctx.beginPath();
      tctx.arc(p.x, p.y, p.life * 5, 0, Math.PI * 2);
      tctx.fill();
      tctx.restore();
    });
  }

  // ── MAIN RENDER LOOP ───────────────────────────────────────
  let t = 0;

  function render() {
    const W = bg.width, H = bg.height;
    ctx.clearRect(0, 0, W, H);

    // 1. Deep background
    const bgGrad = ctx.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .45, Math.max(W, H));
    bgGrad.addColorStop(0,   '#2e0c20');
    bgGrad.addColorStop(.45, '#1a0a14');
    bgGrad.addColorStop(1,   '#080306');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Soft orbs (depth)
    orbs.forEach(o => {
      const pulse = o.op + .015 * Math.sin(t * .018);
      const g = ctx.createRadialGradient(W * o.cx, H * o.cy, 0, W * o.cx, H * o.cy, Math.min(W, H) * o.r);
      g.addColorStop(0,  o.color + pulse + ')');
      g.addColorStop(1,  o.color + '0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    // 3. Light rays
    rays.forEach(r => {
      r.angle += r.speed;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(r.angle);
      const rg = ctx.createLinearGradient(0, -H, 0, H);
      rg.addColorStop(0,   'rgba(212,168,67,0)');
      rg.addColorStop(.5,  `rgba(212,168,67,${r.opacity})`);
      rg.addColorStop(1,   'rgba(212,168,67,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(-r.width / 2, -H, r.width, H * 2);
      ctx.restore();
    });

    // 4. Stars
    stars.forEach(s => {
      s.twinkle += s.speed;
      const a = .15 + .65 * Math.abs(Math.sin(s.twinkle));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x % W, s.y % H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Floating hearts
    hearts.forEach(h => {
      h.x += h.vx + Math.sin(h.wobble) * h.wobbleAmp * .3;
      h.y += h.vy;
      h.wobble += h.wobbleSpeed;
      h.pulse  += h.pulseSpeed;
      const pulsedSize = h.size * (1 + .08 * Math.sin(h.pulse));
      const pulsedOp   = h.opacity * (1 + .2 * Math.sin(h.pulse * 1.3));
      if (h.y < -60)  { h.y = H + 60; h.x = Math.random() * W; }
      if (h.x < -80)  h.x = W + 80;
      if (h.x > W+80) h.x = -80;
      drawHeart(h.x, h.y, pulsedSize, h.color, pulsedOp);
    });

    // 6. Horizontal light sweep
    const sweep = ctx.createLinearGradient(0, H * .4, W, H * .6);
    const swOp  = .018 + .012 * Math.sin(t * .012);
    sweep.addColorStop(0,   'rgba(255,100,150,0)');
    sweep.addColorStop(.3,  `rgba(255,100,150,${swOp})`);
    sweep.addColorStop(.7,  `rgba(212,168,67,${swOp * .8})`);
    sweep.addColorStop(1,   'rgba(212,168,67,0)');
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, W, H);

    // 7. Ripple rings
    for (let i = 0; i < 4; i++) {
      const rr = 60 + i * 80 + 25 * Math.sin(t * .012 + i * 1.2);
      ctx.save();
      ctx.globalAlpha = .035 - i * .007;
      ctx.strokeStyle = '#e8476a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    updateTrail();
    t++;
    requestAnimationFrame(render);
  }

  render();

  // ── FALLING PETALS ─────────────────────────────────────────
  const pContainer = document.getElementById('petals');
  const petalEmoji = ['🌸','🌺','🌹','🌷','💐','🏵️'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'petal';
    el.textContent = pick(petalEmoji);
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      font-size: ${12 + Math.random() * 16}px;
      animation-duration: ${7 + Math.random() * 9}s;
      animation-delay: ${Math.random() * 12}s;
    `;
    pContainer.appendChild(el);
  }

})();
