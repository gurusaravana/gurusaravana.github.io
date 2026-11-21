/* Live simulations for course pages.
   To add one to any course page, paste ONE of these lines where you want it:
     <div class="sim" data-sim="second-order"></div>
     <div class="sim" data-sim="pid"></div>
     <div class="sim" data-sim="spring"></div>
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
    var h = c._h === 'spring' ? Math.max(380, Math.min(440, w * 0.55)) : Math.max(250, Math.min(c._h, w * 0.62));
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
    ctx.strokeStyle = css('--line'); ctx.fillStyle = css('--muted');
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

  document.querySelectorAll('.sim[data-sim]').forEach(function (root) {
    var f = SIMS[root.getAttribute('data-sim')];
    if (f) f(root); else root.textContent = 'Unknown simulation: ' + root.getAttribute('data-sim');
  });
})();
