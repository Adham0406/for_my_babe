/* ============================================================
   MY LOVE - tunda o'sib chiqadigan gullar maydoni
   Sof JavaScript + Canvas. Hech qanday kutubxona kerak emas.
   Qayta boshlash: sahifaga bosing yoki SPACE.
   ============================================================ */
(() => {
  "use strict";
 
  // ----------------------- SOZLAMALAR -----------------------
  const CONFIG = {
    roses: 83,            // atirgullar soni
    sunflowers: 23,       // kungaboqarlar soni
    eyebrow: "Forever & Always",
    title: "My Love",
    // null bo'lsa, matn avtomatik gullar soniga qarab yoziladi
    lines: [
      "I planted a garden of roses and sunflowers just for you.",
      "Not one of them will ever wilt.",
      "Neither will how I feel about you.",
    ],
    textAt: 7.5,          // matn paydo bo'ladigan vaqt (soniya)
    pollen: 80,           // uchib yuruvchi changlar soni
  };
 
  // URL orqali o'zgartirish mumkin:
  //  index.html?title=Salom&eyebrow=Sizga&msg=Birinchi qator|Ikkinchi qator
  const params = new URLSearchParams(location.search);
  if (params.get("title"))   CONFIG.title = params.get("title");
  if (params.get("eyebrow")) CONFIG.eyebrow = params.get("eyebrow");
  if (params.get("msg"))     CONFIG.lines = params.get("msg").split("|");
  if (!CONFIG.lines || CONFIG.lines.length === 0) {
    CONFIG.lines = [
      "I planted a garden of roses and sunflowers just for you.",
      "Not one of them will ever wilt.",
      "Neither will how I feel about you.",
    ];
  }
 
  // ----------------------- YORDAMCHILAR -----------------------
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => {
    const c1 = 1.5, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
 
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const seed = params.get("seed");
  const rand = seed ? mulberry32(+seed) : Math.random;
  const rr = (a, b) => lerp(a, b, rand());
 
  const mix = (c, to, k) => [
    c[0] + (to[0] - c[0]) * k,
    c[1] + (to[1] - c[1]) * k,
    c[2] + (to[2] - c[2]) * k,
  ];
  const WHITE = [255, 255, 255], BLACK = [0, 0, 0];
  const rgba = (c, a = 1) =>
    `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
 
  // ----------------------- GUL RASMLARI (sprite) -----------------------
  // Gul boshlari bir marta alohida canvasga chizib olinadi, keyin tez ishlatiladi.
  const SPRITE = 180;
 
  function makeSprite(draw) {
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE;
    draw(c.getContext("2d"), SPRITE / 2, SPRITE / 2, SPRITE / 2 * 0.95);
    return c;
  }
 
  function drawRose(ctx, cx, cy, R, base) {
    const p = {
      dark: mix(base, BLACK, 0.28),
      mid: base,
      mid2: mix(base, WHITE, 0.12),
      light: mix(base, WHITE, 0.3),
      edge: mix(base, BLACK, 0.6),
    };
    const rings = [
      { n: 9, d: 0.62, r: 0.40, c: p.dark },
      { n: 8, d: 0.46, r: 0.36, c: p.mid },
      { n: 7, d: 0.30, r: 0.30, c: p.mid2 },
      { n: 5, d: 0.15, r: 0.22, c: p.light },
    ];
    let rot = rand() * TAU;
    for (const ring of rings) {
      for (let i = 0; i < ring.n; i++) {
        const a = rot + (i * TAU) / ring.n;
        const x = cx + Math.cos(a) * ring.d * R;
        const y = cy + Math.sin(a) * ring.d * R;
        const pr = ring.r * R;
        const g = ctx.createRadialGradient(
          x - Math.cos(a) * pr * 0.35, y - Math.sin(a) * pr * 0.35, 0, x, y, pr);
        g.addColorStop(0, rgba(mix(ring.c, WHITE, 0.2)));
        g.addColorStop(1, rgba(ring.c));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, pr, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(p.edge, 0.32);
        ctx.lineWidth = R * 0.022;
        ctx.stroke();
      }
      rot += 0.55;
    }
    // O'rtadagi spiral
    ctx.strokeStyle = rgba(p.edge, 0.55);
    ctx.lineWidth = R * 0.03;
    ctx.beginPath();
    for (let t = 0; t < 13; t += 0.2) {
      const r = R * (0.02 + 0.017 * t);
      ctx.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
    }
    ctx.stroke();
  }
 
  function drawSunflower(ctx, cx, cy, R) {
    const layers = [
      { n: 20, len: 1.0, w: 0.13, c: [222, 142, 0], off: 0 },
      { n: 20, len: 0.92, w: 0.12, c: [247, 188, 12], off: Math.PI / 20 },
    ];
    for (const L of layers) {
      for (let i = 0; i < L.n; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(L.off + (i * TAU) / L.n);
        const g = ctx.createLinearGradient(R * 0.25, 0, R * L.len, 0);
        g.addColorStop(0, rgba(mix(L.c, BLACK, 0.25)));
        g.addColorStop(1, rgba(mix(L.c, WHITE, 0.1)));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(R * 0.25, 0);
        ctx.quadraticCurveTo(R * 0.62, -L.w * R * 1.7, R * L.len, 0);
        ctx.quadraticCurveTo(R * 0.62, L.w * R * 1.7, R * 0.25, 0);
        ctx.fill();
        ctx.restore();
      }
    }
    // Markaziy disk
    const d = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.38);
    d.addColorStop(0, "#6b4216");
    d.addColorStop(0.7, "#3a2210");
    d.addColorStop(1, "#24140a");
    ctx.fillStyle = d;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.38, 0, TAU); ctx.fill();
    // Urug'lar (fillotaksis)
    const golden = Math.PI * (3 - Math.sqrt(5));
    ctx.fillStyle = "rgba(190,130,60,.55)";
    for (let i = 1; i < 110; i++) {
      const r = R * 0.36 * Math.sqrt(i / 110);
      const a = i * golden;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, R * 0.022, 0, TAU);
      ctx.fill();
    }
  }
 
  const ROSE_COLORS = [
    { c: [226, 118, 140], w: 35 }, // pushti
    { c: [214, 88, 122],  w: 20 }, // to'q pushti
    { c: [238, 164, 142], w: 15 }, // shaftoli
    { c: [246, 234, 216], w: 15 }, // oq-krem
    { c: [200, 68, 82],   w: 15 }, // qizil
  ];
  function pickRoseColor() {
    const total = ROSE_COLORS.reduce((s, x) => s + x.w, 0);
    let r = rand() * total;
    for (const x of ROSE_COLORS) { if ((r -= x.w) <= 0) return x.c; }
    return ROSE_COLORS[0].c;
  }
 
  let roseSprites = [], sunSprites = [];
  function buildSprites() {
    roseSprites = [];
    for (const rc of ROSE_COLORS) {
      const list = [];
      for (let v = 0; v < 3; v++) {
        list.push({ img: makeSprite((c, x, y, R) => drawRose(c, x, y, R, rc.c)), color: rc.c });
      }
      roseSprites.push(list);
    }
    sunSprites = [0, 1, 2].map(() => makeSprite((c, x, y, R) => drawSunflower(c, x, y, R)));
  }
 
  // ----------------------- SAHNA -----------------------
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, sc = 1;
  let flowers = [], grassBack = [], grassFront = [], pollen = [];
 
  function bez(p0, p1, p2, u) {
    const k = 1 - u;
    return k * k * p0 + 2 * k * u * p1 + u * u * p2;
  }
 
  function makeFlower(type, x, depth) {
    const isSun = type === "sun";
    const R = lerp(9, 40, depth) * sc * rr(0.85, 1.15) * (isSun ? 1.08 : 1);
    const headY = H * lerp(0.1, 0.8, Math.pow(depth, 0.9)) + rr(-0.03, 0.03) * H;
    const bend = rr(-0.09, 0.09) * H;
    const dx = rr(-0.035, 0.035) * W;
    const sprite = isSun
      ? { img: sunSprites[(rand() * 3) | 0], color: [247, 188, 12] }
      : (() => { const l = roseSprites[(rand() * roseSprites.length) | 0]; return l[(rand() * 3) | 0]; })();
    const leaves = [];
    const nLeaves = depth > 0.45 ? 3 + ((rand() * 2) | 0) : (rand() < 0.5 ? 1 : 0);
    for (let i = 0; i < nLeaves; i++) {
      leaves.push({ u: rr(0.2, 0.78), side: rand() < 0.5 ? -1 : 1, len: rr(0.8, 1.2) });
    }
    return {
      depth, R, sprite, isSun, leaves,
      x0: x, y0: H + 10,
      x2: x + dx, y2: headY,
      cx: x + dx * 0.4 + bend, cy: lerp(H + 10, headY, 0.55),
      delay: rr(0.2, 3.6),
      grow: rr(2.0, 2.8),
      bloom: rr(1.2, 1.6),
      phase: rand() * TAU,
      speed: rr(0.5, 1.0),
      amp: rr(6, 14) * sc * lerp(0.6, 1.2, depth),
      rot0: rand() * TAU,
      alpha: lerp(0.32, 1, Math.pow(depth, 0.7)),
      stemW: lerp(0.9, 3.2, depth) * sc,
      stem: [rr(40, 70), rr(110, 150), rr(60, 90)],
    };
  }
 
  function buildScene() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sc = clamp(Math.min(W / 1100, H / 700), 0.55, 1.5);
 
    buildSprites();
 
    // Gullar: atirgul va kungaboqarlar aralash, x bo'yicha teng taqsimlangan
    const total = CONFIG.roses + CONFIG.sunflowers;
    const types = [];
    for (let i = 0; i < CONFIG.roses; i++) types.push("rose");
    for (let i = 0; i < CONFIG.sunflowers; i++) types.push("sun");
    for (let i = types.length - 1; i > 0; i--) {         // aralashtirish
      const j = (rand() * (i + 1)) | 0;
      [types[i], types[j]] = [types[j], types[i]];
    }
    flowers = types.map((type, i) => {
      const x = ((i + rand()) / total) * (W + 80) - 40;
      return makeFlower(type, x, rand());
    }).sort((a, b) => a.depth - b.depth);
 
    // O't
    const mkGrass = (n, hMin, hMax, dark) => Array.from({ length: n }, () => ({
      x: rr(-20, W + 20),
      h: rr(hMin, hMax) * sc,
      w: rr(3, 7) * sc,
      lean: rr(-0.35, 0.35),
      phase: rand() * TAU,
      delay: rr(0, 2.6),
      col: mix([34, 98, 52], [14, 48, 30], rand() * 0.8 + dark),
    }));
    grassBack = mkGrass(Math.round(W / 4), 50, 130, 0.25);
    grassFront = mkGrass(Math.round(W / 5), 30, 95, 0);
 
    // Changlar / o't uchqunlari
    pollen = Array.from({ length: CONFIG.pollen }, () => ({
      x: rand() * W, y: rr(0.05, 0.95) * H,
      vx: rr(-6, 6), vy: rr(-12, -2),
      r: rr(0.6, 1.9), ph: rand() * TAU, sp: rr(0.8, 2.2),
    }));
  }
 
  // ----------------------- CHIZISH -----------------------
  function stemPoint(f, u, t) {
    const sway = Math.sin(t * f.speed + f.phase) * f.amp * Math.pow(u, 1.6);
    return [bez(f.x0, f.cx, f.x2, u) + sway, bez(f.y0, f.cy, f.y2, u)];
  }
 
  function drawGlow(t) {
    const g = ctx.createRadialGradient(W / 2, H * 0.47, 0, W / 2, H * 0.47, Math.max(W, H) * 0.42);
    const k = 0.9 + 0.1 * Math.sin(t * 0.8);
    g.addColorStop(0, `rgba(190,120,85,${0.30 * k})`);
    g.addColorStop(0.5, `rgba(120,70,60,${0.12 * k})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
 
  function drawGrass(list, t, alpha) {
    for (const b of list) {
      const g = easeOutCubic(clamp((t - b.delay) / 2.2));
      if (g <= 0) continue;
      const sway = Math.sin(t * 0.9 + b.phase) * 7 * sc * g;
      const hh = b.h * g;
      const tx = b.x + b.lean * hh + sway;
      const ty = H - hh;
      ctx.fillStyle = rgba(b.col, alpha);
      ctx.beginPath();
      ctx.moveTo(b.x - b.w / 2, H + 4);
      ctx.quadraticCurveTo(b.x - b.w / 2 + b.lean * hh * 0.2, H - hh * 0.55, tx, ty);
      ctx.quadraticCurveTo(b.x + b.w / 2 + b.lean * hh * 0.2, H - hh * 0.55, b.x + b.w / 2, H + 4);
      ctx.fill();
    }
  }
 
  function drawLeaf(x, y, ang, len, col, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = rgba(col, alpha);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0);
    ctx.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0);
    ctx.fill();
    ctx.restore();
  }
 
  function drawFlower(f, t) {
    const lt = t - f.delay;
    if (lt <= 0) return;
    const p = easeOutCubic(clamp(lt / f.grow));
    const bloomT = clamp((lt - f.grow * 0.85) / f.bloom);
    const green = mix([62, 138, 76], [14, 40, 24], 1 - f.depth * 0.9);
 
    // Poya
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = rgba(green, f.alpha);
    ctx.lineWidth = f.stemW;
    ctx.beginPath();
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const [x, y] = stemPoint(f, (i / steps) * p, t);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
 
    // Barglar
    const leafCol = mix(green, WHITE, 0.12);
    for (const L of f.leaves) {
      const lg = clamp((p - L.u) / 0.25);
      if (lg <= 0) continue;
      const [xa, ya] = stemPoint(f, L.u, t);
      const [xb, yb] = stemPoint(f, Math.min(1, L.u + 0.02), t);
      const tang = Math.atan2(yb - ya, xb - xa);
      const len = lerp(12, 44, f.depth) * sc * L.len * easeOutCubic(lg);
      drawLeaf(xa, ya, tang + L.side * 0.75, len, leafCol, f.alpha);
    }
 
    // Bosh (g'unchadan gulga)
    const [hx, hy] = stemPoint(f, p, t);
    if (bloomT <= 0) {
      if (p > 0.2) {
        ctx.fillStyle = rgba(mix(f.sprite.color || [200, 80, 90], BLACK, 0.2), f.alpha);
        ctx.beginPath();
        ctx.ellipse(hx, hy, f.R * 0.16 * p, f.R * 0.24 * p, 0, 0, TAU);
        ctx.fill();
      }
      return;
    }
    const b = easeOutBack(bloomT);
    const breathe = 1 + 0.025 * Math.sin(t * 1.3 + f.phase);
    const size = f.R * 2 * b * breathe;
    const tilt = Math.sin(t * f.speed + f.phase) * 0.12 + (f.isSun ? t * 0.03 : 0);
 
    // Yumshoq nur (faqat yaqin gullar)
    if (f.depth > 0.5) {
      const gl = ctx.createRadialGradient(hx, hy, 0, hx, hy, f.R * 1.7);
      const gc = f.sprite.color || [255, 190, 90];
      gl.addColorStop(0, rgba(gc, 0.16 * b));
      gl.addColorStop(1, rgba(gc, 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(hx, hy, f.R * 1.7, 0, TAU); ctx.fill();
    }
 
    ctx.save();
    ctx.globalAlpha = f.alpha * clamp(bloomT * 2.5);
    ctx.translate(hx, hy);
    ctx.rotate(f.rot0 + tilt);
    ctx.drawImage(f.sprite.img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
 
  function drawPollen(t, dt) {
    const fade = clamp((t - 1.5) / 4);
    for (const q of pollen) {
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.y < -10) { q.y = H + 10; q.x = rand() * W; }
      if (q.x < -10) q.x = W + 10;
      if (q.x > W + 10) q.x = -10;
      const tw = 0.5 + 0.5 * Math.sin(t * q.sp + q.ph);
      ctx.fillStyle = `rgba(255,222,170,${0.75 * tw * fade})`;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
    }
  }
 
  // ----------------------- TSIKL -----------------------
  const els = {
    card: document.getElementById("card"),
    veil: document.getElementById("veil"),
    eyebrow: document.getElementById("eyebrow"),
    title: document.getElementById("title"),
    poem: document.getElementById("poem"),
  };
  els.eyebrow.textContent = CONFIG.eyebrow;
  els.title.textContent = CONFIG.title;
  els.poem.innerHTML = "";
  CONFIG.lines.forEach((text, i) => {
    const d = document.createElement("div");
    d.className = "line";
    d.textContent = text;
    d.style.transitionDelay = `${0.9 + i * 0.55}s`;
    els.poem.appendChild(d);
  });
 
  let t0 = performance.now(), last = t0, textShown = false;
 
  function frame(now) {
    const t = (now - t0) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
 
    ctx.fillStyle = "#040406";
    ctx.fillRect(0, 0, W, H);
    drawGlow(t);
    drawGrass(grassBack, t, 0.5);
    for (const f of flowers) drawFlower(f, t);
    drawGrass(grassFront, t, 0.85);
    drawPollen(t, dt);
 
    if (!textShown && t > CONFIG.textAt) {
      textShown = true;
      els.card.classList.add("show");
      els.veil.classList.add("show");
    }
    requestAnimationFrame(frame);
  }
 
  function restart() {
    t0 = performance.now(); last = t0; textShown = false;
    els.card.classList.remove("show");
    els.veil.classList.remove("show");
    buildScene();
  }
 
  let rz;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(buildScene, 150);
  });
  canvas.addEventListener("click", restart);
  window.addEventListener("keydown", (e) => { if (e.code === "Space") restart(); });
 
  buildScene();
  requestAnimationFrame(frame);
})();