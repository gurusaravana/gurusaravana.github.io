/* Live simulations for course pages.
   To add one to any course page, paste ONE of these lines where you want it:
     <div class="sim" data-sim="second-order"></div>
     <div class="sim" data-sim="pid"></div>
     <div class="sim" data-sim="spring"></div>
     <div class="sim" data-sim="pendulum"></div>
     <div class="sim" data-sim="first-order"></div>
     <div class="sim" data-sim="tank"></div>
     <div class="sim" data-sim="frequency"></div>
     <div class="sim" data-sim="rlc"></div>
     <div class="sim" data-sim="rc-ladder"></div>
     <div class="sim" data-sim="two-mass"></div>
     <div class="sim" data-sim="laplace"></div>
*/
(function () {
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }

  function slider(box, label, min, max, step, val, unit, onInput) {
    var l = el('label'); var out = el('b', {}, val + (unit || ''));
    l.appendChild(document.createTextNode(label + ': ')); l.appendChild(out);
    var r = el('input', { type: 'range', min: min, max: max, step: step, value: val, 'aria-label': label });
    r.oninput = function () { out.textContent = r.value + (unit || ''); onInput(); };
    l.appendChild(r); box.appendChild(l); return r;
  }

  function canvas(root, h) {
    var c = el('canvas'); c._h = h || 360; root.appendChild(c); return c;
  }
  // Size the canvas to its on-screen width (sharp text on phones and retina screens).
  function fit(c) {
    var dpr = window.devicePixelRatio || 1, w = c.clientWidth || 900;
    var h = c._h === 'tank' ? (w < 560 ? 580 : 420) : c._h === 'pendulum' ? (w >= 640 ? Math.min(460, w * 0.48) : Math.max(560, w * 1.5)) : c._h === 'spring' ? Math.max(380, Math.min(440, w * 0.55)) : Math.max(250, Math.min(c._h, w * 0.62));
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.height = h + 'px'; }
    var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  // Draw one or more series on a time plot inside box {x, y, w, h}.
  function plot(ctx, box, series, opt) {
    var L = box.x + 46, R = box.x + box.w - 12, T = box.y + 28, B = box.y + box.h - 38;
    var tmax = opt.tmax, ymin = opt.ymin, ymax = opt.ymax, ny = opt.ny || 5;
    function X(t) { return L + (t / tmax) * (R - L); }
    function Y(y) { return T + (1 - (y - ymin) / (ymax - ymin)) * (B - T); }
    ctx.font = '12px Inter, system-ui, sans-serif'; ctx.lineWidth = 1;
    ctx.strokeStyle = css('--plotgrid') || css('--line'); ctx.fillStyle = css('--muted');
    for (var i = 0; i <= ny; i++) {
      var yv = ymin + (ymax - ymin) * i / ny, yy = Y(yv);
      ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(R, yy); ctx.stroke();
      ctx.textAlign = 'right'; ctx.fillText(+yv.toFixed(2) + '', L - 7, yy + 4);
    }
    for (i = 0; i <= 5; i++) {
      var tv = tmax * i / 5, xx = X(tv);
      ctx.beginPath(); ctx.moveTo(xx, T); ctx.lineTo(xx, B); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillText(+tv.toFixed(1) + '', xx, B + 16);
    }
    ctx.textAlign = 'center'; ctx.fillText(opt.xlabel || 'time (s)', (L + R) / 2, B + 32);
    ctx.save(); ctx.beginPath(); ctx.rect(L, T - 2, R - L, B - T + 4); ctx.clip();
    series.forEach(function (s) {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2.5; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      s.t.forEach(function (t, k) { var y = Math.max(ymin - 1, Math.min(ymax + 1, s.y[k])); k ? ctx.lineTo(X(t), Y(y)) : ctx.moveTo(X(t), Y(y)); });
      ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.restore();
    var lx = L, ly = box.y + 12;
    series.forEach(function (s) {
      if (!s.name) return;
      var wdt = ctx.measureText(s.name).width + 40;
      if (lx + wdt > R) { lx = L; ly += 16; }
      ctx.fillStyle = s.color; ctx.fillRect(lx, ly - 4, 14, 3);
      ctx.fillStyle = css('--ink'); ctx.textAlign = 'left'; ctx.fillText(s.name, lx + 20, ly);
      lx += wdt;
    });
  }

  var redraws = [];
  window.addEventListener('resize', function () { clearTimeout(window._simR); window._simR = setTimeout(function () { redraws.forEach(function (f) { f(); }); }, 150); });
  function onTheme(f) { redraws.push(f); }
  new MutationObserver(function () { redraws.forEach(function (f) { f(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { redraws.forEach(function (f) { f(); }); });

  var SIMS = {};

  /* 1. Second-order system step response */
  SIMS['second-order'] = function (root) {
    root.appendChild(el('h3', {}, 'Second-order system: step response'));
    root.appendChild(el('p', { 'class': 'desc' }, 'G(s) = &omega;<sub>n</sub>&sup2; / (s&sup2; + 2&zeta;&omega;<sub>n</sub>s + &omega;<sub>n</sub>&sup2;). Move the sliders to see how damping and natural frequency change overshoot and settling time.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var z = slider(box, 'Damping ratio ζ', 0.05, 2, 0.05, 0.3, '', draw);
    var w = slider(box, 'Natural frequency ωn', 0.5, 5, 0.1, 2, ' rad/s', draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    function draw() {
      var zeta = +z.value, wn = +w.value, dt = 0.005, tmax = 10, x = 0, v = 0, t = [], y = [], u = [];
      for (var k = 0; k * dt <= tmax; k++) {
        t.push(k * dt); y.push(x); u.push(1);
        var a = wn * wn * (1 - x) - 2 * zeta * wn * v; v += a * dt; x += v * dt;
      }
      var peak = Math.max.apply(null, y), os = Math.max(0, (peak - 1) * 100), ts = 0;
      for (var i = y.length - 1; i >= 0; i--) if (Math.abs(y[i] - 1) > 0.02) { ts = t[i]; break; }
      var f = fit(c); plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ t: t, y: u, color: css('--muted'), dash: [6, 5], width: 1.5, name: 'Input (unit step)' }, { t: t, y: y, color: css('--accent'), name: 'Output y(t)' }], { tmax: tmax, ymin: 0, ymax: 2, ny: 4 });
      info.textContent = 'Overshoot: ' + os.toFixed(1) + ' %   ·   2% settling time: ' + (ts >= tmax - 0.01 ? '> 10' : ts.toFixed(2)) + ' s   ·   ' + (zeta < 1 ? 'Underdamped' : zeta === 1 ? 'Critically damped' : 'Overdamped');
    }
    draw(); onTheme(draw);
  };

  /* 2. PID control of a first-order process with dead time */
  SIMS['pid'] = function (root) {
    root.appendChild(el('h3', {}, 'PID controller tuning'));
    root.appendChild(el('p', { 'class': 'desc' }, 'Process: G(s) = K e<sup>&minus;Ls</sup> / (&tau;s + 1) with K = 1, &tau; = 5 s. Tune K<sub>p</sub>, K<sub>i</sub> and K<sub>d</sub> to follow a set-point step of 1.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var kp = slider(box, 'Kp', 0, 10, 0.1, 2, '', draw);
    var ki = slider(box, 'Ki', 0, 3, 0.05, 0.4, '', draw);
    var kd = slider(box, 'Kd', 0, 5, 0.1, 0.5, '', draw);
    var L = slider(box, 'Dead time L', 0, 3, 0.1, 1, ' s', draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    function draw() {
      var dt = 0.01, tmax = 40, tau = 5, K = 1, n = Math.round(+L.value / dt), buf = [], y = 0, I = 0, ep = 1, t = [], Y = [], U = [], R = [], iae = 0;
      for (var k = 0; k * dt <= tmax; k++) {
        var e = 1 - y; I += e * dt; var D = k ? (e - ep) / dt : 0; ep = e;
        var u = +kp.value * e + +ki.value * I + +kd.value * D; u = Math.max(-10, Math.min(10, u));
        buf.push(u); var ud = buf.length > n ? buf[buf.length - 1 - n] : 0;
        y += dt * (K * ud - y) / tau; iae += Math.abs(e) * dt;
        t.push(k * dt); Y.push(y); U.push(u); R.push(1);
      }
      var f = fit(c); plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ t: t, y: R, color: css('--muted'), dash: [6, 5], width: 1.5, name: 'Set-point' }, { t: t, y: U, color: css('--gold'), width: 1.5, name: 'Controller output u' }, { t: t, y: Y, color: css('--accent'), name: 'Process output y' }], { tmax: tmax, ymin: -0.5, ymax: 2.5, ny: 6 });
      var peak = Math.max.apply(null, Y);
      info.textContent = 'Overshoot: ' + Math.max(0, (peak - 1) * 100).toFixed(1) + ' %   ·   Integral absolute error (IAE): ' + iae.toFixed(2) + (peak > 2.4 ? '   ·   Unstable or very oscillatory: reduce the gains' : '');
    }
    draw(); onTheme(draw);
  };

  /* 3. Mass-spring-damper animation */
  SIMS['spring'] = function (root) {
    root.appendChild(el('h3', {}, 'Mass–spring–damper animation'));
    root.appendChild(el('p', { 'class': 'desc' }, 'm&#7821; + c&#7819; + kx = 0. The mass is pulled 1 m and released. Press Play and change the values to see free vibration and damping.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var m = slider(box, 'Mass m', 0.5, 5, 0.1, 1, ' kg', reset);
    var k = slider(box, 'Spring stiffness k', 1, 40, 1, 10, ' N/m', reset);
    var cc = slider(box, 'Damping c', 0, 10, 0.1, 0.6, ' N·s/m', reset);
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var play = el('button', { type: 'button' }, '▶ Play'), rs = el('button', { type: 'button' }, '↺ Reset');
    btns.appendChild(play); btns.appendChild(rs);
    var c = canvas(root, 'spring');
    var x, v, t, hist, running = false, last = 0;
    function reset() { x = 1; v = 0; t = 0; hist = { t: [0], y: [1] }; render(); }
    function step(dt) { var h = 0.002; for (var s = 0; s < dt / h; s++) { var a = (-+cc.value * v - +k.value * x) / +m.value; v += a * h; x += v * h; t += h; } hist.t.push(t); hist.y.push(x); }
    function render() {
      var f = fit(c), ctx = f.ctx, W = f.w;
      var wallX = 24, mid = 70, scale = Math.min(150, W * 0.22), home = W / 2 - 30, bx = home + x * scale, bw = Math.min(70, W * 0.14);
      ctx.fillStyle = css('--line'); ctx.fillRect(wallX - 12, 15, 12, 110);
      ctx.strokeStyle = css('--muted'); ctx.lineWidth = 2; ctx.beginPath();
      var coils = 12, sx = wallX, ex = bx, seg = (ex - sx) / (coils + 2);
      ctx.moveTo(sx, mid); ctx.lineTo(sx + seg, mid);
      for (var i = 0; i < coils; i++) ctx.lineTo(sx + seg * (i + 1.5), mid + (i % 2 ? 16 : -16));
      ctx.lineTo(ex - seg, mid); ctx.lineTo(ex, mid); ctx.stroke();
      ctx.fillStyle = css('--accent'); ctx.fillRect(bx, mid - 30, bw, 60);
      ctx.fillStyle = '#fff'; ctx.font = '600 15px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('m', bx + bw / 2, mid + 5);
      ctx.strokeStyle = css('--muted'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(home, 12); ctx.lineTo(home, 128); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css('--muted'); ctx.font = '12px Inter, sans-serif'; ctx.fillText('x = 0', home, 142);
      plot(ctx, { x: 0, y: 150, w: W, h: f.h - 150 }, [{ t: hist.t, y: hist.y, color: css('--accent'), name: 'Displacement x(t) in m' }], { tmax: 15, ymin: -1.5, ymax: 1.5, ny: 6 });
    }
    function loop(ts) { if (!running) return; var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; step(dt); render(); if (t > 15) { running = false; play.textContent = '▶ Play'; return; } requestAnimationFrame(loop); }
    play.onclick = function () { if (t > 15) reset(); running = !running; play.textContent = running ? '❚❚ Pause' : '▶ Play'; if (running) { last = performance.now(); requestAnimationFrame(loop); } };
    rs.onclick = function () { running = false; play.textContent = '▶ Play'; reset(); };
    reset(); onTheme(render);
  };

  /* 4. Damped pendulum with live phase portrait (drag the bob, or click the phase plane) */
  SIMS['pendulum'] = function (root) {
    root.appendChild(el('h3', {}, 'Damped pendulum and phase portrait'));
    root.appendChild(el('p', { 'class': 'desc' }, '&theta;&#776; = &minus;(g/L) sin&theta; &minus; c&theta;&#775;. <b>Drag the bob</b> and let go (a flick gives it speed), or <b>click anywhere on the phase portrait</b> to start from that angle and angular velocity. The grey arrows show the direction of motion everywhere in the phase plane.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var g = slider(box, 'Gravity g', 1, 20, 0.1, 9.8, ' m/s²', field);
    var L = slider(box, 'Length L', 0.5, 20, 0.1, 10, ' m', field);
    var c = slider(box, 'Damping c', 0, 1, 0.01, 0.05, ' 1/s', field);
    var opts = el('label', { style: 'display:flex;align-items:center;gap:8px' });
    var col = el('input', { type: 'checkbox', checked: 'checked' }); opts.appendChild(col); opts.appendChild(document.createTextNode('Colour the trail by speed'));
    box.appendChild(opts);
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var play = el('button', { type: 'button' }, '❚❚ Pause'), clr = el('button', { type: 'button' }, 'Clear trail');
    btns.appendChild(play); btns.appendChild(clr);
    var cv = canvas(root, 'pendulum'); cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
    var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    var th = 2.2, w = 0, trail = [], running = true, drag = false, last = 0, lay = null, bg = null, moved = [];
    function acc(a, v) { return -(+g.value / +L.value) * Math.sin(a) - +c.value * v; }
    function rk4(h) {
      var k1a = w, k1v = acc(th, w), k2a = w + h / 2 * k1v, k2v = acc(th + h / 2 * k1a, w + h / 2 * k1v),
          k3a = w + h / 2 * k2v, k3v = acc(th + h / 2 * k2a, w + h / 2 * k2v), k4a = w + h * k3v, k4v = acc(th + h * k3a, w + h * k3v);
      th += h / 6 * (k1a + 2 * k2a + 2 * k3a + k4a); w += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
    function wmax() { return 1.25 * 2 * Math.sqrt(+g.value / +L.value); }   // a bit above the separatrix peak
    function layout(W, H) {
      var wide = W >= 640, pw = wide ? W * 0.42 : W, ph = wide ? H : H * 0.4;
      return { wide: wide, pend: { x: 0, y: 0, w: pw, h: ph }, phase: wide ? { x: pw + 16, y: 10, w: W - pw - 26, h: H - 46 } : { x: 46, y: ph + 10, w: W - 58, h: H - ph - 46 } };
    }
    function P(a, v) { var p = lay.phase, m = wmax(); return [p.x + (a + Math.PI) / (2 * Math.PI) * p.w, p.y + (1 - (v + m) / (2 * m)) * p.h]; }
    function field() { bg = null; trail = []; }
    function drawField(ctx) {
      var p = lay.phase, m = wmax();
      ctx.strokeStyle = css('--line'); ctx.lineWidth = 1; ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = css('--muted'); ctx.globalAlpha = 0.35;
      var nx = 21, ny = 13;
      for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) {
        var a = -Math.PI + (i + 0.5) * 2 * Math.PI / nx, v = -m + (j + 0.5) * 2 * m / ny;
        var da = v, dv = acc(a, v), s = Math.hypot(da / Math.PI, dv / (m * 2)) || 1;
        var q = P(a, v), len = Math.min(p.w / nx, p.h / ny) * 0.42;
        var ux = (da / Math.PI) / s * len, uy = -(dv / (m * 2)) / s * len * (p.h / p.w) * 2;
        var n = Math.hypot(ux, uy) || 1; ux = ux / n * len; uy = uy / n * len;
        ctx.beginPath(); ctx.moveTo(q[0] - ux, q[1] - uy); ctx.lineTo(q[0] + ux, q[1] + uy); ctx.stroke();
        ctx.beginPath(); ctx.arc(q[0] + ux, q[1] + uy, 1.4, 0, 7); ctx.fill && (ctx.fillStyle = css('--muted'), ctx.fill());
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = css('--muted'); ctx.font = '12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
      [['−π', -Math.PI], ['−π/2', -Math.PI / 2], ['0', 0], ['π/2', Math.PI / 2], ['π', Math.PI]].forEach(function (t) { var q = P(t[1], -m); ctx.fillText(t[0], q[0], p.y + p.h + 15); });
      ctx.fillText('angle θ (rad)', p.x + p.w / 2, p.y + p.h + 31);
      ctx.save(); ctx.translate(p.x - 30, p.y + p.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('angular velocity ω (rad/s)', 0, 0); ctx.restore();
      ctx.textAlign = 'right'; [m, 0, -m].forEach(function (v) { var q = P(-Math.PI, v); ctx.fillText(v.toFixed(1), p.x - 4, q[1] + 4); });
      ctx.strokeStyle = css('--line'); ctx.beginPath(); var z = P(-Math.PI, 0), z2 = P(Math.PI, 0); ctx.moveTo(z[0], z[1]); ctx.lineTo(z2[0], z2[1]); ctx.stroke();
    }
    function render() {
      var f = fit(cv), ctx = f.ctx; lay = layout(f.w, f.h);
      drawField(ctx);
      // trail in phase plane
      ctx.lineWidth = 2.2;
      var m = wmax();
      for (var i = 1; i < trail.length; i++) {
        var a0 = trail[i - 1], a1 = trail[i];
        if (Math.abs(a1[0] - a0[0]) > Math.PI) continue;          // wrapped across ±π
        var q0 = P(a0[0], a0[1]), q1 = P(a1[0], a1[1]);
        ctx.globalAlpha = 0.15 + 0.85 * i / trail.length;
        ctx.strokeStyle = col.checked ? 'hsl(' + (200 - Math.min(1, Math.abs(a1[1]) / m) * 200) + ',75%,50%)' : css('--accent');
        ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var cur = P(wrap(th), w); ctx.fillStyle = css('--gold'); ctx.beginPath(); ctx.arc(cur[0], cur[1], 5, 0, 7); ctx.fill();
      // pendulum
      var p = lay.pend, ox = p.x + p.w / 2, oy = p.y + p.h * 0.48, r = Math.min(p.w, p.h) * 0.38;
      var bx = ox + r * Math.sin(th), by = oy + r * Math.cos(th);
      ctx.strokeStyle = css('--line'); ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ox, oy, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = css('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = css('--ink'); ctx.beginPath(); ctx.arc(ox, oy, 4, 0, 7); ctx.fill();
      ctx.fillStyle = drag ? css('--gold') : css('--accent'); ctx.beginPath(); ctx.arc(bx, by, Math.max(12, r * 0.09), 0, 7); ctx.fill();
      var E = 0.5 * w * w * +L.value + +g.value * (1 - Math.cos(th));
      info.textContent = 'θ = ' + wrap(th).toFixed(2) + ' rad   ·   ω = ' + w.toFixed(2) + ' rad/s   ·   ' + (E > 2 * +g.value ? 'Rotating over the top' : 'Swinging back and forth') + '   ·   Small-angle period ≈ ' + (2 * Math.PI * Math.sqrt(+L.value / +g.value)).toFixed(2) + ' s';
    }
    function tick(ts) {
      var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
      if (running && !drag) { for (var s = 0; s < 8; s++) rk4(dt / 8); trail.push([wrap(th), w]); if (trail.length > 900) trail.shift(); }
      render(); requestAnimationFrame(tick);
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointerdown', function (e) {
      var q = pos(e), p = lay.phase;
      if (q[0] >= p.x && q[0] <= p.x + p.w && q[1] >= p.y && q[1] <= p.y + p.h) {
        var m = wmax(); th = -Math.PI + (q[0] - p.x) / p.w * 2 * Math.PI; w = m - (q[1] - p.y) / p.h * 2 * m; trail = []; return;
      }
      drag = true; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; moved = []; move(e);
    });
    function move(e) {
      if (!drag) return; var q = pos(e), p = lay.pend, ox = p.x + p.w / 2, oy = p.y + p.h * 0.48;
      th = Math.atan2(q[0] - ox, q[1] - oy); w = 0; moved.push([performance.now(), th]); if (moved.length > 6) moved.shift(); trail = [];
    }
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', function () {
      if (!drag) return; drag = false; cv.style.cursor = 'grab';
      if (moved.length > 1) { var a = moved[0], b = moved[moved.length - 1], dt = (b[0] - a[0]) / 1000; if (dt > 0) w = Math.max(-wmax(), Math.min(wmax(), wrap(b[1] - a[1]) / dt)); }
    });
    play.onclick = function () { running = !running; play.textContent = running ? '❚❚ Pause' : '▶ Play'; };
    clr.onclick = function () { trail = []; };
    onTheme(render);
    requestAnimationFrame(tick);
  };


  /* 5. First-order plus dead-time (FOPDT) step response */
  SIMS['first-order'] = function (root) {
    root.appendChild(el('h3', {}, 'First-order process with dead time'));
    root.appendChild(el('p', { 'class': 'desc' }, 'G(s) = K<sub>p</sub> e<sup>&minus;&theta;s</sup> / (&tau;s + 1). A step of size &Delta;u is applied at t = 2 s. The dot marks 63.2 % of the final change, reached at t = 2 + &theta; + &tau;.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var K = slider(box, 'Process gain Kp', 0.2, 3, 0.1, 1.5, '', draw);
    var tau = slider(box, 'Time constant τ', 0.5, 15, 0.5, 5, ' s', draw);
    var th = slider(box, 'Dead time θ', 0, 8, 0.5, 2, ' s', draw);
    var du = slider(box, 'Input step Δu', 0.5, 2, 0.1, 1, '', draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    function draw() {
      var k = +K.value, ta = +tau.value, the = +th.value, d = +du.value, tmax = 40, t = [], y = [], u = [];
      for (var i = 0; i <= 800; i++) { var tt = tmax * i / 800; t.push(tt); u.push(tt >= 2 ? d : 0); var s = tt - 2 - the; y.push(s > 0 ? k * d * (1 - Math.exp(-s / ta)) : 0); }
      var f = fit(c), top = Math.max(3.2, k * d * 1.15);
      plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ t: t, y: u, color: css('--muted'), dash: [6, 5], width: 1.5, name: 'Input u(t)' }, { t: t, y: y, color: css('--accent'), name: 'Output y(t)' }], { tmax: tmax, ymin: 0, ymax: top, ny: 4 });
      var ctx = f.ctx, L = 46, R = f.w - 12, T = 28, B = f.h - 38, t63 = 2 + the + ta, y63 = 0.632 * k * d;
      if (t63 < tmax) { var X = L + t63 / tmax * (R - L), Y = T + (1 - y63 / top) * (B - T); ctx.fillStyle = css('--gold'); ctx.beginPath(); ctx.arc(X, Y, 5, 0, 7); ctx.fill(); ctx.strokeStyle = css('--gold'); ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, B); ctx.stroke(); ctx.setLineDash([]); }
      info.textContent = 'Final change Δy = Kp·Δu = ' + (k * d).toFixed(2) + '   ·   63.2 % reached at t = ' + t63.toFixed(1) + ' s   ·   ~98 % settled at t ≈ ' + (2 + the + 4 * ta).toFixed(1) + ' s';
    }
    draw(); onTheme(draw);
  };

  /* 6. Gravity-drained tank: animated level, manual or PI level control */
  SIMS['tank'] = function (root) {
    root.appendChild(el('h3', {}, 'Tank level: open loop and level control'));
    root.appendChild(el('p', { 'class': 'desc' }, 'A &middot; dh/dt = q<sub>in</sub> &minus; c<sub>v</sub>&radic;h. In <b>Manual</b> you set the inlet valve yourself. In <b>Auto</b> a PI controller moves the inlet valve to hold the level at the set-point. Try opening the outlet valve (a disturbance) in both modes.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var vin = slider(box, 'Inlet valve (manual)', 0, 100, 1, 50, ' %', function () {});
    var cv = slider(box, 'Outlet valve', 10, 100, 1, 50, ' %', function () {});
    var sp = slider(box, 'Level set-point', 0.5, 4.5, 0.1, 2.5, ' m', function () {});
    var kc = slider(box, 'Controller gain Kc', 1, 60, 1, 20, ' %/m', function () {});
    var ti = slider(box, 'Integral time τI', 2, 60, 1, 15, ' s', function () {});
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var mode = el('button', { type: 'button' }, 'Mode: Manual'), play = el('button', { type: 'button' }, '❚❚ Pause'), rs = el('button', { type: 'button' }, '↺ Reset');
    btns.appendChild(mode); btns.appendChild(play); btns.appendChild(rs);
    var c = canvas(root, 'tank'); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    var A = 1.0, H = 5, h, I, auto = false, running = true, t, hist, last = 0, vpos = 50, flowPhase = 0;
    function reset() { h = 1.5; I = 0; t = 0; vpos = +vin.value; hist = { t: [], h: [], s: [], v: [] }; }
    function step(dt) {
      var hh = 0.01;
      for (var s = 0; s < dt / hh; s++) {
        if (auto) { var e = +sp.value - h; I += e * hh; vpos = Math.max(0, Math.min(100, 50 + +kc.value * (e + I / +ti.value))); if ((vpos === 0 || vpos === 100)) I -= e * hh; }
        else vpos = +vin.value;
        var qin = 0.004 * vpos, qout = 0.0024 * +cv.value * Math.sqrt(Math.max(h, 0));
        h = Math.max(0, Math.min(H, h + hh * (qin - qout) / A)); t += hh;
      }
      hist.t.push(t); hist.h.push(h); hist.s.push(auto ? +sp.value : NaN); hist.v.push(vpos / 25);
      if (t > 120) { var k0 = hist.t.findIndex(function (x) { return x >= t - 120; }); ['t', 'h', 's', 'v'].forEach(function (k) { hist[k] = hist[k].slice(k0); }); }
    }
    function render() {
      var f = fit(c), ctx = f.ctx, W = f.w, Hc = f.h, narrow = W < 560;
      var tw = narrow ? W * 0.36 : 150, th = narrow ? 170 : Hc - 84, tx = narrow ? (W - tw) / 2 : 70, ty = 44;
      var accent = css('--accent'), ink = css('--ink'), muted = css('--muted'), sig = css('--signal') || css('--gold');
      // inlet pipe + valve
      ctx.strokeStyle = muted; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - 50, ty - 10); ctx.lineTo(tx + tw * 0.3, ty - 10); ctx.lineTo(tx + tw * 0.3, ty + 4); ctx.stroke();
      ctx.fillStyle = css('--gold'); ctx.beginPath(); ctx.moveTo(tx - 30, ty - 20); ctx.lineTo(tx - 30, ty); ctx.lineTo(tx - 10, ty - 20); ctx.lineTo(tx - 10, ty); ctx.closePath(); ctx.fill();
      ctx.fillStyle = muted; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('inlet ' + vpos.toFixed(0) + '%', tx - 20, ty - 26);
      // falling stream
      if (vpos > 1) { ctx.strokeStyle = accent; ctx.globalAlpha = .7; ctx.lineWidth = 1 + vpos / 25; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -flowPhase; ctx.beginPath(); ctx.moveTo(tx + tw * 0.3, ty + 4); ctx.lineTo(tx + tw * 0.3, ty + th - (h / H) * th); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      // tank
      var lv = (h / H) * th;
      ctx.fillStyle = accent; ctx.globalAlpha = .35; ctx.fillRect(tx, ty + th - lv, tw, lv); ctx.globalAlpha = 1;
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath();
      for (var x = 0; x <= tw; x += 4) { var yy = ty + th - lv + Math.sin((x + flowPhase * 2) / 12) * 2; x ? ctx.lineTo(tx + x, yy) : ctx.moveTo(tx, yy); } ctx.stroke();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + th); ctx.lineTo(tx + tw, ty + th); ctx.lineTo(tx + tw, ty); ctx.stroke();
      if (auto) { var sy = ty + th - (+sp.value / H) * th; ctx.strokeStyle = ink; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx - 6, sy); ctx.lineTo(tx + tw + 6, sy); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText('SP', tx + tw + 8, sy + 4); }
      // outlet
      ctx.strokeStyle = muted; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx + tw, ty + th - 8); ctx.lineTo(tx + tw + 50, ty + th - 8); ctx.stroke();
      ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.fillText('outlet ' + cv.value + '%', tx + tw + 30, ty + th + 14);
      ctx.fillStyle = ink; ctx.font = '600 14px Inter, sans-serif'; ctx.fillText('h = ' + h.toFixed(2) + ' m', tx + tw / 2, ty + th + 34);
      if (auto) { ctx.fillStyle = css('--gold'); ctx.font = '600 12px Inter, sans-serif'; ctx.fillText('LC', tx - 30, ty + 60); ctx.strokeStyle = css('--gold'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx - 30, ty + 56, 14, 0, 7); ctx.stroke(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(tx - 30, ty + 42); ctx.lineTo(tx - 20, ty - 2); ctx.moveTo(tx - 16, ty + 56); ctx.lineTo(tx, ty + 56); ctx.stroke(); ctx.setLineDash([]); }
      var bx = narrow ? 0 : tx + tw + 90, by = narrow ? th + ty + 48 : 0;
      var t0 = hist.t.length ? hist.t[0] : 0, tt = hist.t.map(function (x) { return x - t0; });
      plot(ctx, { x: bx, y: by, w: W - bx, h: Hc - by }, [{ t: tt, y: hist.s, color: ink, dash: [6, 5], width: 1.5, name: 'Set-point' }, { t: tt, y: hist.v, color: css('--gold'), width: 1.5, name: 'Inlet valve ÷ 25' }, { t: tt, y: hist.h, color: accent, name: 'Level h (m)' }], { tmax: 120, ymin: 0, ymax: 5, ny: 5, xlabel: 'time (s), last 2 minutes' });
      info.textContent = auto ? 'Auto: the controller holds the level. Error = ' + (+sp.value - h).toFixed(2) + ' m' : 'Manual: the level settles where inflow equals outflow, h = (qin / cv)². Steady level for these valves ≈ ' + Math.min(H, Math.pow(0.004 * +vin.value / (0.0024 * +cv.value), 2)).toFixed(2) + ' m';
    }
    function loop(ts) { var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; if (running && root.isConnected) { step(dt * 4); flowPhase += dt * 40; render(); } requestAnimationFrame(loop); }
    mode.onclick = function () { auto = !auto; I = 0; if (!auto) { vin.value = Math.round(vpos); vin.dispatchEvent(new Event('input')); } mode.textContent = 'Mode: ' + (auto ? 'Auto (PI)' : 'Manual'); mode.classList.toggle('on', auto); };
    play.onclick = function () { running = !running; play.textContent = running ? '❚❚ Pause' : '▶ Play'; };
    rs.onclick = function () { reset(); render(); };
    reset(); render(); onTheme(render); requestAnimationFrame(loop);
  };

  /* 7. Frequency response of a first-order process: sine in, sine out */
  SIMS['frequency'] = function (root) {
    root.appendChild(el('h3', {}, 'Frequency response: sine in, sine out'));
    root.appendChild(el('p', { 'class': 'desc' }, 'A sine wave of frequency &omega; enters G(s) = K / (&tau;s + 1). After the start-up transient the output is a sine of the same frequency, smaller by the amplitude ratio AR = K/&radic;(1+&omega;&sup2;&tau;&sup2;) and delayed by the phase lag &phi; = &minus;tan<sup>&minus;1</sup>(&omega;&tau;).'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var w = slider(box, 'Input frequency ω', 0.05, 3, 0.05, 0.4, ' rad/s', draw);
    var tau = slider(box, 'Time constant τ', 0.5, 10, 0.5, 3, ' s', draw);
    var K = slider(box, 'Gain K', 0.5, 2, 0.1, 1, '', draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    function draw() {
      var om = +w.value, ta = +tau.value, k = +K.value, tmax = 40, dt = 0.01, y = 0, T = [], U = [], Y = [];
      for (var i = 0; i * dt <= tmax; i++) { var tt = i * dt, u = Math.sin(om * tt); T.push(tt); U.push(u); Y.push(y); y += dt * (k * u - y) / ta; }
      var f = fit(c); plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ t: T, y: U, color: css('--muted'), width: 1.5, dash: [6, 5], name: 'Input sin(ωt)' }, { t: T, y: Y, color: css('--accent'), name: 'Output y(t)' }], { tmax: tmax, ymin: -2, ymax: 2, ny: 4 });
      var ar = k / Math.sqrt(1 + om * om * ta * ta), ph = -Math.atan(om * ta) * 180 / Math.PI;
      info.textContent = 'Amplitude ratio AR = ' + ar.toFixed(3) + '   ·   Phase lag φ = ' + ph.toFixed(1) + '°   ·   Corner frequency 1/τ = ' + (1 / ta).toFixed(2) + ' rad/s';
    }
    draw(); onTheme(draw);
  };


  function select(box, label, options, onChange) {
    var l = el('label'); l.appendChild(document.createTextNode(label + ': '));
    var s = el('select', { 'aria-label': label, style: 'display:block;width:100%;margin-top:4px;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit' });
    options.forEach(function (o) { var op = el('option', { value: o[0] }, o[1]); s.appendChild(op); });
    s.onchange = onChange; l.appendChild(s); box.appendChild(l); return s;
  }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function range(arrs, pad) { var lo = Infinity, hi = -Infinity; arrs.forEach(function (a) { a.forEach(function (v) { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); }); if (hi - lo < 1e-9) { hi += 1; lo -= 1; } var p = (hi - lo) * (pad || 0.1); return [lo - p, hi + p]; }
  function r2(v) { return Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2); }

  /* 8. Series RLC circuit: step response of the capacitor, resistor or inductor voltage */
  SIMS['rlc'] = function (root) {
    root.appendChild(el('h3', {}, 'Series RLC circuit: step response'));
    root.appendChild(el('p', { 'class': 'desc' }, 'A 1 V step is applied to a series RLC circuit. V<sub>C</sub>/V = (1/LC) / (s&sup2; + (R/L)s + 1/LC). Change R, L and C and see how &omega;<sub>n</sub> = 1/&radic;(LC) and &zeta; = (R/2)&radic;(C/L) shape the response. Pick which voltage to watch.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var R = slider(box, 'Resistance R', 0.2, 40, 0.2, 4, ' Ω', draw);
    var L = slider(box, 'Inductance L', 0.1, 5, 0.1, 1, ' H', draw);
    var C = slider(box, 'Capacitance C', 0.01, 1, 0.01, 0.25, ' F', draw);
    var out = select(box, 'Output voltage', [['c', 'Capacitor, V_C'], ['r', 'Resistor, V_R'], ['l', 'Inductor, V_L']], draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    function draw() {
      var r = +R.value, l = +L.value, cc = +C.value, wn = 1 / Math.sqrt(l * cc), z = r / 2 * Math.sqrt(cc / l);
      var tmax = Math.min(60, Math.max(1, 10 / Math.max(z * wn, 0.15 * wn))), n = 4000, dt = tmax / n, q = 0, i = 0, T = [], Y = [], U = [], I = [];
      for (var k = 0; k <= n; k++) {
        var vc = q / cc, vr = r * i, vl = 1 - vr - vc;
        T.push(k * dt); U.push(1); I.push(i); Y.push(out.value === 'c' ? vc : out.value === 'r' ? vr : vl);
        var h = dt / 4; for (var j = 0; j < 4; j++) { var di = (1 - r * i - q / cc) / l; i += di * h; q += i * h; }
      }
      var rg = range([Y, U, I], 0.08), f = fit(c);
      plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ t: T, y: U, color: css('--muted'), dash: [6, 5], width: 1.5, name: 'Input v(t) = 1 V' }, { t: T, y: I, color: css('--gold'), width: 1.5, name: 'Current i(t) (A)' }, { t: T, y: Y, color: css('--accent'), name: out.value === 'c' ? 'V_C(t)' : out.value === 'r' ? 'V_R(t)' : 'V_L(t)' }], { tmax: tmax, ymin: rg[0], ymax: rg[1], ny: 5 });
      var num = out.value === 'c' ? r2(1 / (l * cc)) : out.value === 'r' ? r2(r / l) + 's' : 's²', den = '(s² + ' + r2(r / l) + 's + ' + r2(1 / (l * cc)) + ')';
      info.textContent = 'ωn = ' + r2(wn) + ' rad/s   ·   ζ = ' + z.toFixed(3) + ' (' + (z < 1 ? 'underdamped' : z === 1 ? 'critically damped' : 'overdamped') + ')   ·   ' + (out.value === 'c' ? 'V_C' : out.value === 'r' ? 'V_R' : 'V_L') + '/V = ' + num + ' / ' + den;
    }
    draw(); onTheme(draw);
  };

  /* 9. Two-loop RC ladder: loading effect */
  SIMS['rc-ladder'] = function (root) {
    root.appendChild(el('h3', {}, 'Two-loop RC network: the loading effect'));
    root.appendChild(el('p', { 'class': 'desc' }, 'E<sub>o</sub>/E<sub>i</sub> = 1 / [(R<sub>1</sub>C<sub>1</sub>s + 1)(R<sub>2</sub>C<sub>2</sub>s + 1) + R<sub>1</sub>C<sub>2</sub>s]. The dashed curve is what you would get if the second RC stage did not draw current from the first: just the product of two first-order lags. The extra R<sub>1</sub>C<sub>2</sub>s term is the <b>loading effect</b>. Make R<sub>2</sub> large or C<sub>2</sub> small and the two curves meet.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var R1 = slider(box, 'R1', 0.1, 10, 0.1, 1, ' kΩ', draw), C1 = slider(box, 'C1', 0.1, 10, 0.1, 1, ' mF', draw);
    var R2 = slider(box, 'R2', 0.1, 10, 0.1, 1, ' kΩ', draw), C2 = slider(box, 'C2', 0.1, 10, 0.1, 1, ' mF', draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    function draw() {
      var t1 = +R1.value * +C1.value, t2 = +R2.value * +C2.value, t12 = +R1.value * +C2.value;
      var a2 = t1 * t2, a1 = t1 + t2 + t12, tmax = Math.min(400, Math.max(5, 6 * a1)), n = 3000, dt = tmax / n;
      var x = 0, v = 0, u1 = 0, u2 = 0, T = [], Y = [], Yn = [], U = [];
      for (var k = 0; k <= n; k++) {
        T.push(k * dt); Y.push(x); Yn.push(u2); U.push(1);
        var hh = dt / 4; for (var j = 0; j < 4; j++) { var acc = (1 - a1 * v - x) / a2; v += acc * hh; x += v * hh; u1 += hh * (1 - u1) / t1; u2 += hh * (u1 - u2) / t2; }
      }
      var f = fit(c);
      plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ t: T, y: U, color: css('--muted'), dash: [6, 5], width: 1.5, name: 'Input Ei = 1 V' }, { t: T, y: Yn, color: css('--gold'), dash: [4, 4], width: 2, name: 'Without loading' }, { t: T, y: Y, color: css('--accent'), name: 'Actual Eo(t)' }], { tmax: tmax, ymin: 0, ymax: 1.2, ny: 6 });
      info.textContent = 'Eo/Ei = 1 / (' + r2(a2) + 's² + ' + r2(a1) + 's + 1)   ·   R1C1 = ' + r2(t1) + ' s, R2C2 = ' + r2(t2) + ' s, loading term R1C2 = ' + r2(t12) + ' s';
    }
    draw(); onTheme(draw);
  };

  /* 10. Two-mass translational system (animated) */
  SIMS['two-mass'] = function (root) {
    root.appendChild(el('h3', {}, 'Two-mass mechanical system'));
    root.appendChild(el('p', { 'class': 'desc' }, 'M<sub>1</sub> is tied to the wall by K<sub>1</sub> and B<sub>1</sub>, and to M<sub>2</sub> by the coupling spring K and damper B. M<sub>2</sub> has friction B<sub>2</sub> to ground. A step force F pushes M<sub>2</sub> to the right. Press Play, then change the values and watch both masses.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var M1 = slider(box, 'M1', 0.2, 5, 0.1, 1, ' kg', reset), M2 = slider(box, 'M2', 0.2, 5, 0.1, 1, ' kg', reset);
    var K1 = slider(box, 'K1', 0, 40, 1, 10, ' N/m', reset), K = slider(box, 'Coupling K', 1, 40, 1, 10, ' N/m', reset);
    var B1 = slider(box, 'B1', 0, 10, 0.1, 0.5, ' N·s/m', reset), B = slider(box, 'Coupling B', 0, 10, 0.1, 0.5, ' N·s/m', reset);
    var B2 = slider(box, 'B2', 0, 10, 0.1, 0.5, ' N·s/m', reset), F = slider(box, 'Force F', 1, 20, 1, 10, ' N', reset);
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var play = el('button', { type: 'button' }, '▶ Play'), rs = el('button', { type: 'button' }, '↺ Reset');
    btns.appendChild(play); btns.appendChild(rs);
    var c = canvas(root, 'spring'); var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    var x1, v1, x2, v2, t, H, running = false, last = 0, TM = 20;
    function reset() { x1 = v1 = x2 = v2 = t = 0; H = { t: [0], a: [0], b: [0] }; render(); }
    function step(dt) {
      var h = 0.001;
      for (var s = 0; s < dt / h; s++) {
        var a1 = (-(+B1.value) * v1 - (+B.value) * (v1 - v2) - (+K1.value) * x1 - (+K.value) * (x1 - x2)) / +M1.value;
        var a2 = (+F.value - (+B2.value) * v2 - (+B.value) * (v2 - v1) - (+K.value) * (x2 - x1)) / +M2.value;
        v1 += a1 * h; v2 += a2 * h; x1 += v1 * h; x2 += v2 * h; t += h;
      }
      H.t.push(t); H.a.push(x1); H.b.push(x2);
    }
    function spring(ctx, xa, xb, y, n) { var seg = (xb - xa) / (n + 2); ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xa + seg, y); for (var i = 0; i < n; i++) ctx.lineTo(xa + seg * (i + 1.5), y + (i % 2 ? 9 : -9)); ctx.lineTo(xb - seg, y); ctx.lineTo(xb, y); ctx.stroke(); }
    function damper(ctx, xa, xb, y) { var m = (xa + xb) / 2; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(m - 6, y); ctx.moveTo(m - 14, y - 9); ctx.lineTo(m + 4, y - 9); ctx.moveTo(m - 14, y + 9); ctx.lineTo(m + 4, y + 9); ctx.moveTo(m - 14, y - 9); ctx.lineTo(m - 14, y + 9); ctx.moveTo(m - 6, y - 6); ctx.lineTo(m - 6, y + 6); ctx.moveTo(m - 6, y); ctx.lineTo(xb, y); ctx.stroke(); }
    function render() {
      var f = fit(c), ctx = f.ctx, W = f.w, top = 20, bh = 64, gy = top + bh + 8;
      var scale = Math.min(60, W * 0.06), bw = Math.min(64, W * 0.12), gap = Math.min(Math.max(90, W * 0.2), (W - 16 - 2 * bw - 60 - 2.2 * scale) / 1.8);
      var wall = 16, h1 = wall + gap, h2 = h1 + bw + gap * 0.8, p1 = h1 + x1 * scale, p2 = h2 + x2 * scale;
      var ink = css('--ink'), mu = css('--muted');
      ctx.fillStyle = css('--line'); ctx.fillRect(4, top - 6, 12, bh + 18); ctx.fillRect(4, gy, W - 8, 3);
      ctx.strokeStyle = mu; ctx.lineWidth = 1.6;
      spring(ctx, wall, p1, top + 18, 8); damper(ctx, wall, p1, top + 46);
      spring(ctx, p1 + bw, p2, top + 18, 8); damper(ctx, p1 + bw, p2, top + 46);
      ctx.fillStyle = css('--accent'); ctx.fillRect(p1, top, bw, bh); ctx.fillStyle = css('--gold'); ctx.fillRect(p2, top, bw, bh);
      ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M1', p1 + bw / 2, top + bh / 2 + 5); ctx.fillText('M2', p2 + bw / 2, top + bh / 2 + 5);
      ctx.fillStyle = mu; ctx.font = '11px Inter, sans-serif'; ctx.fillText('K1, B1', (wall + p1) / 2, top - 2); ctx.fillText('K, B', (p1 + bw + p2) / 2, top - 2); ctx.fillText('B2 (friction)', p2 + bw / 2, gy + 16);
      ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 2; var ax = p2 + bw + 6; ctx.beginPath(); ctx.moveTo(ax, top + bh / 2); ctx.lineTo(ax + 36, top + bh / 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax + 42, top + bh / 2); ctx.lineTo(ax + 32, top + bh / 2 - 6); ctx.lineTo(ax + 32, top + bh / 2 + 6); ctx.fill(); ctx.textAlign = 'left'; ctx.fillText('F', ax + 14, top + bh / 2 - 8);
      var rg = range([H.a, H.b, [0]], 0.15);
      plot(ctx, { x: 0, y: gy + 24, w: W, h: f.h - gy - 24 }, [{ t: H.t, y: H.a, color: css('--accent'), name: 'x1(t), M1 (m)' }, { t: H.t, y: H.b, color: css('--gold'), name: 'x(t), M2 (m)' }], { tmax: TM, ymin: Math.min(0, rg[0]), ymax: Math.max(0.1, rg[1]), ny: 4 });
      var k1 = +K1.value, k = +K.value, fv = +F.value;
      info.textContent = k1 > 0 ? 'Final positions: x1 = F/K1 = ' + (fv / k1).toFixed(2) + ' m, x = F/K1 + F/K = ' + (fv / k1 + fv / k).toFixed(2) + ' m (dampers do not change where the masses settle, only how they get there)' : 'K1 = 0: nothing holds the masses to the wall, so they keep moving under the force.';
    }
    function loop(ts) { if (!running) return; var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; step(dt); render(); if (t > TM) { running = false; play.textContent = '▶ Play'; return; } requestAnimationFrame(loop); }
    play.onclick = function () { if (t > TM) reset(); running = !running; play.textContent = running ? '❚❚ Pause' : '▶ Play'; if (running) { last = performance.now(); requestAnimationFrame(loop); } };
    rs.onclick = function () { running = false; play.textContent = '▶ Play'; reset(); };
    reset(); onTheme(render);
  };

  /* 11. Partial fractions explorer: the three root cases */
  SIMS['laplace'] = function (root) {
    root.appendChild(el('h3', {}, 'Partial fractions explorer'));
    root.appendChild(el('p', { 'class': 'desc' }, 'Pick a case and move the poles. The page expands F(s) into partial fractions, and the plot shows f(t) (solid) and each term of the expansion (dashed). Real poles give exponentials; complex poles give a damped sinusoid.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var mode = select(box, 'Case', [['d', '1: real and distinct roots'], ['r', '2: real and repeated roots'], ['c', '3: complex-conjugate roots']], draw);
    var A = slider(box, 'a (or α)', 0.2, 4, 0.1, 1, '', draw), B = slider(box, 'b (or β)', 0.2, 6, 0.1, 2, '', draw);
    var c = canvas(root); var info = el('div', { 'class': 'readout', style: 'white-space:pre-wrap' }); root.appendChild(info);
    function draw() {
      var a = +A.value, b = +B.value, m = mode.value, tmax = 8, T = [], Fs = [], t1 = [], t2 = [], t3 = [], txt;
      if (m === 'd' && Math.abs(a - b) < 0.05) b = a + 0.1;
      for (var k = 0; k <= 600; k++) {
        var t = tmax * k / 600, f1, f2, f3 = NaN;
        if (m === 'd') { var K1 = 1 / (b - a), K2 = 1 / (a - b); f1 = K1 * Math.exp(-a * t); f2 = K2 * Math.exp(-b * t); }
        else if (m === 'r') { var D = b - a; if (Math.abs(D) < 0.05) D = 0.1; f1 = t * Math.exp(-a * t) / D; f2 = -Math.exp(-a * t) / (D * D); f3 = Math.exp(-b * t) / (D * D); }
        else { f1 = Math.exp(-a * t) * Math.sin(b * t) / b; f2 = NaN; }
        T.push(t); t1.push(f1); t2.push(f2); t3.push(f3); Fs.push(f1 + (isNaN(f2) ? 0 : f2) + (isNaN(f3) ? 0 : f3));
      }
      if (m === 'd') txt = 'F(s) = 1 / ((s + ' + a.toFixed(1) + ')(s + ' + b.toFixed(1) + '))  =  ' + (1 / (b - a)).toFixed(3) + '/(s + ' + a.toFixed(1) + ')  +  ' + (1 / (a - b)).toFixed(3) + '/(s + ' + b.toFixed(1) + ')\nf(t) = ' + (1 / (b - a)).toFixed(3) + ' e^(−' + a.toFixed(1) + 't) + ' + (1 / (a - b)).toFixed(3) + ' e^(−' + b.toFixed(1) + 't)     (residues Ki = lim (s + pi)F(s))';
      else if (m === 'r') { var D2 = Math.abs(b - a) < 0.05 ? 0.1 : b - a; txt = 'F(s) = 1 / ((s + ' + a.toFixed(1) + ')² (s + ' + b.toFixed(1) + '))  =  ' + (1 / D2).toFixed(3) + '/(s + ' + a.toFixed(1) + ')²  +  ' + (-1 / (D2 * D2)).toFixed(3) + '/(s + ' + a.toFixed(1) + ')  +  ' + (1 / (D2 * D2)).toFixed(3) + '/(s + ' + b.toFixed(1) + ')\nThe repeated pole gives a t·e^(−at) term; K2 needs the derivative formula.'; }
      else txt = 'F(s) = 1 / ((s + ' + a.toFixed(1) + ')² + ' + b.toFixed(1) + '²)  →  f(t) = (1/' + b.toFixed(1) + ') e^(−' + a.toFixed(1) + 't) sin(' + b.toFixed(1) + 't)\nα = ' + a.toFixed(1) + ' sets the decay, β = ' + b.toFixed(1) + ' rad/s sets the oscillation (poles at −α ± jβ).';
      var rg = range([Fs, t1, t2.filter(isFinite), t3.filter(isFinite)], 0.1), f = fit(c);
      var series = [{ t: T, y: t1, color: css('--gold'), dash: [5, 4], width: 1.6, name: m === 'c' ? 'Damped sinusoid' : 'Term 1' }];
      if (m !== 'c') series.push({ t: T, y: t2, color: css('--signal') || css('--muted'), dash: [2, 4], width: 1.6, name: 'Term 2' });
      if (m === 'r') series.push({ t: T, y: t3, color: css('--muted'), dash: [8, 4], width: 1.6, name: 'Term 3' });
      series.push({ t: T, y: Fs, color: css('--accent'), name: 'f(t)' });
      plot(f.ctx, { x: 0, y: 0, w: f.w, h: f.h }, series, { tmax: tmax, ymin: rg[0], ymax: rg[1], ny: 4 });
      info.textContent = txt;
    }
    draw(); onTheme(draw);
  };

  document.querySelectorAll('.sim[data-sim]').forEach(function (root) {
    var f = SIMS[root.getAttribute('data-sim')];
    if (f) f(root); else root.textContent = 'Unknown simulation: ' + root.getAttribute('data-sim');
  });
})();
