/**
 * Neural Cursor — Immersive 3D-style 2D canvas overlay
 *
 * Features:
 *  • Floating neural nodes + dynamic connection lines
 *  • Cursor proximity: elastic stretch of nearby lines toward cursor
 *  • 3-second idle → smooth liquid morph (Bezier wave mesh)
 *  • Particle splash on morph trigger
 *  • Circular energy ripple waves from cursor
 *  • Reverse morph on cursor move
 *  • Pulsing glow, depth-based opacity
 */
(function () {
  // ── Canvas Setup ──────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'neural-cursor-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '9998',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Colour Helpers ────────────────────────────────────────────────────────
  // ── Dynamic Admin Colors ──────────────────────────────
  function hexToRgbStr(hex) {
    if (!hex) return '0, 245, 255';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let r = parseInt(c.substring(0, 2), 16) || 0;
    let g = parseInt(c.substring(2, 4), 16) || 0;
    let b = parseInt(c.substring(4, 6), 16) || 0;
    return `${r}, ${g}, ${b}`;
  }

  function getCyan() {
    return (window.bgSettings && window.bgSettings.cursorColor) 
      ? hexToRgbStr(window.bgSettings.cursorColor) 
      : '0, 245, 255';
  }

  function getPurple() {
    return (window.bgSettings && window.bgSettings.cursorSecondaryColor) 
      ? hexToRgbStr(window.bgSettings.cursorSecondaryColor) 
      : '0, 180, 255';
  }

  function accent(a = 1) { return `rgba(${getCyan()},${a})`; }
  function secondary(a = 1) { return `rgba(${getPurple()},${a})`; }

  function mix(t, a = 1) {
    const c1 = getCyan().split(',').map(Number);
    const c2 = getPurple().split(',').map(Number);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── Math helpers ──────────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Node Generation ───────────────────────────────────────────────────────
  const NODE_COUNT = 60;
  const CONNECT_DIST = 160;
  const CURSOR_ATTRACT = 130;  // px radius where nodes feel the cursor
  const ATTRACT_STRENGTH = 0.18;

  const nodes = [];
  function initNodes() {
    nodes.length = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      nodes.push({
        x, y,
        ox: x, oy: y,          // original ("home") position
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 2 + Math.random() * 2,
        depth: 0.3 + Math.random() * 0.7,  // depth-based opacity multiplier
        lx: x, ly: y,          // liquid-morph displaced position
      });
    }
  }
  initNodes();

  // ── Mouse & State ─────────────────────────────────────────────────────────
  let mx = -999, my = -999;
  let pmx = -999, pmy = -999;
  let isLiquid = false;
  let morphProgress = 0;   // 0 = neural, 1 = liquid
  let idleTimer = null;
  let lastMoveTime = Date.now();

  window.addEventListener('mousemove', e => {
    pmx = mx; pmy = my;
    mx = e.clientX; my = e.clientY;
    lastMoveTime = Date.now();

    // Cancel idle timer and reverse liquid morph
    clearTimeout(idleTimer);
    if (isLiquid) isLiquid = false;

    // Start idle countdown
    idleTimer = setTimeout(() => {
      isLiquid = true;
      spawnSplash(mx, my);
    }, 3000);

    // Emit ripple on move
    const spd = dist(mx, my, pmx, pmy);
    if (spd > 5) { addRipple(mx, my, clamp(spd, 6, 22)); }
  });

  // ── Ripples ───────────────────────────────────────────────────────────────
  const ripples = [];
  function addRipple(x, y, strength) {
    ripples.push({ x, y, r: 0, maxR: 80 + strength * 3, strength, alpha: 1 });
  }

  function updateRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 2.5 + rp.strength * 0.1;
      rp.alpha = Math.max(0, 1 - rp.r / rp.maxR);
      if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }

      // Draw energy ring
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = accent(rp.alpha * 0.6);
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = accent(rp.alpha);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // ── Particles (Splash) ────────────────────────────────────────────────────
  const particles = [];
  function spawnSplash(x, y) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.018 + Math.random() * 0.02,
        r: 2 + Math.random() * 3,
        t: Math.random(), // mix amount for colour
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.06; // gravity
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = mix(p.t, p.life * 0.9);
      ctx.shadowBlur = 10;
      ctx.shadowColor = mix(p.t, 1);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── Liquid Displacement ───────────────────────────────────────────────────
  let waveTime = 0;
  function computeLiquidPos(node, t) {
    const waveX = node.ox + Math.sin(waveTime * 1.2 + node.oy * 0.015) * 18 * t;
    const waveY = node.oy + Math.cos(waveTime * 0.9 + node.ox * 0.015) * 18 * t;
    return { x: waveX, y: waveY };
  }

  // ── Main Draw Loop ────────────────────────────────────────────────────────
  function draw() {
    requestAnimationFrame(draw);

    if (window.bgSettings && window.bgSettings.enabled === false) {
      if (canvas.style.opacity !== '0') {
        canvas.style.transition = 'opacity 0.6s ease';
        canvas.style.opacity = '0';
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    } else {
      if (canvas.style.opacity === '0') canvas.style.opacity = '1';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    waveTime += 0.016;

    // Morph progress: lerp toward target
    const morphTarget = isLiquid ? 1 : 0;
    morphProgress = lerp(morphProgress, morphTarget, 0.04);

    // ── Update Nodes ────────────────────────────────────────────────────────
    nodes.forEach(n => {
      // Drift gently
      n.x += n.vx; n.y += n.vy;

      // Soft bounce off edges
      if (n.x < 0 || n.x > canvas.width) { n.vx *= -1; n.x = clamp(n.x, 0, canvas.width); }
      if (n.y < 0 || n.y > canvas.height) { n.vy *= -1; n.y = clamp(n.y, 0, canvas.height); }

      // Cursor elastic attraction
      const d = dist(n.x, n.y, mx, my);
      if (d < CURSOR_ATTRACT && d > 1) {
        const force = ATTRACT_STRENGTH * (1 - d / CURSOR_ATTRACT);
        n.vx += (mx - n.x) / d * force;
        n.vy += (my - n.y) / d * force;
      }

      // Dampen velocity
      n.vx *= 0.96; n.vy *= 0.96;

      // Liquid displaced position
      const liq = computeLiquidPos(n, morphProgress);
      n.lx = lerp(n.x, liq.x, morphProgress);
      n.ly = lerp(n.y, liq.y, morphProgress);
    });

    // ── Draw Connections ─────────────────────────────────────────────────────
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = dist(a.lx, a.ly, b.lx, b.ly);
        if (d > CONNECT_DIST) continue;

        const proximity = 1 - d / CONNECT_DIST;
        const depthAlpha = (a.depth + b.depth) * 0.5;
        const alpha = proximity * 0.55 * depthAlpha + morphProgress * 0.1;

        // Mouse proximity effect on line  
        const dma = dist(a.lx, a.ly, mx, my);
        const dmb = dist(b.lx, b.ly, mx, my);
        const glowBoost = (dma < 140 || dmb < 140) ? 1.6 : 1;

        ctx.beginPath();

        if (morphProgress > 0.05) {
          // Liquid mode: draw Bezier curve with wave-displaced control points
          const cpx = (a.lx + b.lx) / 2 + Math.sin(waveTime + i) * 18 * morphProgress;
          const cpy = (a.ly + b.ly) / 2 + Math.cos(waveTime + j) * 18 * morphProgress;
          ctx.moveTo(a.lx, a.ly);
          ctx.quadraticCurveTo(cpx, cpy, b.lx, b.ly);
          // ctx.lineWidth = (1.5 + morphProgress * 2) * glowBoost;
          // ctx.strokeStyle = mix(morphProgress * 0.7, alpha * glowBoost);
          ctx.shadowColor = mix(morphProgress, 1);
        } else {
          // Neural mode: straight elastic lines
          ctx.moveTo(a.lx, a.ly);
          ctx.lineTo(b.lx, b.ly);
          // ctx.lineWidth = (0.8 + proximity) * glowBoost;
          // ctx.strokeStyle = accent(alpha * glowBoost);
          ctx.shadowColor = accent(2);
        }

        ctx.shadowBlur = 6 * glowBoost;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // ── Draw Cursor Proximity Elastic Threads ────────────────────────────────
    if (mx > 0) {
      nodes.forEach(n => {
        const d = dist(n.lx, n.ly, mx, my);
        if (d > CURSOR_ATTRACT * 1.2) return;

        const t = 1 - d / (CURSOR_ATTRACT * 1.2);
        ctx.beginPath();
        ctx.moveTo(n.lx, n.ly);

        // Elastic — stretch midpoint toward cursor
        const cpx = n.lx + (mx - n.lx) * 0.5;
        const cpy = n.ly + (my - n.ly) * 0.5;
        ctx.quadraticCurveTo(cpx, cpy, mx, my);
        ctx.strokeStyle = accent(t * 0.45);
        ctx.lineWidth = t * 2.5;
        ctx.shadowColor = accent(1);
        ctx.shadowBlur = 12 * t;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Cursor glow dot
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 14);
      grad.addColorStop(0, accent(0.9));
      grad.addColorStop(0.4, mix(0.4, 0.4));
      grad.addColorStop(1, accent(0));
      ctx.beginPath();
      ctx.arc(mx, my, 14, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowBlur = 20;
      ctx.shadowColor = accent(1);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── Draw Nodes ───────────────────────────────────────────────────────────
    nodes.forEach(n => {
      const pulse = 0.7 + Math.sin(waveTime * 2 + n.ox) * 0.3;
      const dToCursor = dist(n.lx, n.ly, mx, my);
      const glow = dToCursor < CURSOR_ATTRACT ? 1.8 : 1;
      const a = n.depth * pulse * 0.85 * glow;
      const col = morphProgress > 0.5 ? mix(morphProgress - 0.5, a) : accent(a);

      ctx.beginPath();
      ctx.arc(n.lx, n.ly, n.r * glow, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10 * glow;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // ── Ripples ───────────────────────────────────────────────────────────────
    updateRipples();

    // ── Particles ─────────────────────────────────────────────────────────────
    updateParticles();

    // ── Logo ↔ Neural Node Connections ─────────────────────────────
    drawLogoConnections();
  }

  draw();

  // ── Logo ↔ Neural Connection Renderer ────────────────────────────
  // Reads 3D logo positions (projected to 2D) from bg.js every frame
  // and weaves them into the cursor neural network visually.
  function drawLogoConnections() {
    const logos = window.bgLogoPositions;
    if (!logos || logos.length === 0) return;

    const LOGO_CONNECT_DIST = 220; // Max distance for logo↔node line
    const LOGO_LOGO_DIST = 260; // Max distance for logo↔logo line

    logos.forEach((logo, li) => {
      if (!logo || !logo.visible) return;

      // ─ Logo ↔ Canvas Nodes ─────────────────────────
      nodes.forEach(n => {
        const d = dist(logo.x, logo.y, n.lx, n.ly);
        if (d > LOGO_CONNECT_DIST) return;
        const t = 1 - d / LOGO_CONNECT_DIST;

        ctx.beginPath();
        ctx.moveTo(logo.x, logo.y);
        if (morphProgress > 0.05) {
          // Wavy in liquid mode
          const cpx = (logo.x + n.lx) / 2 + Math.sin(waveTime + li) * 20 * morphProgress;
          const cpy = (logo.y + n.ly) / 2 + Math.cos(waveTime + li) * 20 * morphProgress;
          ctx.quadraticCurveTo(cpx, cpy, n.lx, n.ly);
          ctx.strokeStyle = mix(morphProgress * 0.6, t * 0.35);
        } else {
          ctx.lineTo(n.lx, n.ly);
          ctx.strokeStyle = accent(t * 0.35);
        }
        ctx.lineWidth = t * 1.8;
        ctx.shadowBlur = 8 * t;
        ctx.shadowColor = accent(0.8);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // ─ Logo ↔ Logo ─────────────────────────────
      for (let lj = li + 1; lj < logos.length; lj++) {
        const logo2 = logos[lj];
        if (!logo2 || !logo2.visible) continue;
        const d = dist(logo.x, logo.y, logo2.x, logo2.y);
        if (d > LOGO_LOGO_DIST) continue;
        const t = 1 - d / LOGO_LOGO_DIST;

        ctx.beginPath();
        ctx.moveTo(logo.x, logo.y);
        ctx.lineTo(logo2.x, logo2.y);
        ctx.strokeStyle = mix(0.4, t * 0.28);
        ctx.lineWidth = t * 1.5;
        ctx.shadowBlur = 6 * t;
        ctx.shadowColor = accent(0.6);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ─ Logo Anchor Glow Dot ─────────────────────
      ctx.beginPath();
      ctx.arc(logo.x, logo.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = accent(0.75);
      ctx.shadowBlur = 14;
      ctx.shadowColor = accent(1);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  window.addEventListener('resize', initNodes);
})();
