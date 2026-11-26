/* Interactive tools for the Nonlinear Control course (EACT 633).
   Paste one of these lines into a page that loads this script:
     <div class="sim nls" data-nls="phase-plane"></div>
         optional: data-preset="ex7" (ex7 ... ex13, star, linear, pendulum, vdp, duffing, relay, quad)
         optional: data-only="ex7,ex8,linear" to limit the list of systems
     <div class="sim nls" data-nls="describing-function"></div>
         optional: data-preset="saturation" (saturation, deadzone, relay, relaydz, hyst, dzhyst, backlash, cubic)
     <div class="sim nls" data-nls="circle"></div>
         optional: data-preset="ex713" (ex713, ex714, c45, ex715, c46a, popov)
   Each tool draws on a canvas and follows the light / dark theme.
*/
(function () {
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function slider(box, label, min, max, step, val, onInput, fmt) {
    var l = el('label'); var out = el('b', {}, fmt ? fmt(val) : val);
    l.appendChild(document.createTextNode(label + ': ')); l.appendChild(out);
    var r = el('input', { type: 'range', min: min, max: max, step: step, value: val, 'aria-label': label });
    r.oninput = function () { out.textContent = fmt ? fmt(+r.value) : r.value; onInput(); };
    l.appendChild(r); box.appendChild(l); r._out = out; r._fmt = fmt;
    r.set = function (v) { r.value = v; out.textContent = fmt ? fmt(+r.value) : r.value; };
    return r;
  }
  function select(box, label, options, val, onChange) {
    var l = el('label', { 'class': 'nls-select' }); l.appendChild(document.createTextNode(label));
    var s = el('select', { 'aria-label': label });
    options.forEach(function (o) { var op = el('option', { value: o[0] }, o[1]); if (o[0] === val) op.selected = true; s.appendChild(op); });
    s.onchange = onChange; l.appendChild(s); box.appendChild(l); return s;
  }
  function button(box, label, onClick) { var b = el('button', { type: 'button' }, label); b.onclick = onClick; box.appendChild(b); return b; }
  function canvas(root, aspect, minH, maxH) { var c = el('canvas'); c._a = aspect; c._min = minH; c._max = maxH; root.appendChild(c); return c; }
  function fit(c) {
    var dpr = window.devicePixelRatio || 1, w = c.clientWidth || 800;
    var h = Math.max(c._min || 300, Math.min(c._max || 520, w * (c._a || 0.62)));
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.height = h + 'px'; }
    var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  var redraws = [];
  window.addEventListener('resize', function () { clearTimeout(window._nlsR); window._nlsR = setTimeout(function () { redraws.forEach(function (f) { f(); }); }, 150); });
  new MutationObserver(function () { redraws.forEach(function (f) { f(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { redraws.forEach(function (f) { f(); }); });
  function onTheme(f) { redraws.push(f); }
  var PINK = '#db2777', ORANGE = '#ea7a1f', GREEN = '#16a34a';

  /* A plotting box: maps data to pixels and draws a grid with tick labels. */
  function Box(ctx, x, y, w, h, xr, yr) {
    var b = { ctx: ctx, x: x, y: y, w: w, h: h, xr: xr, yr: yr };
    b.X = function (v) { return x + (v - xr[0]) / (xr[1] - xr[0]) * w; };
    b.Y = function (v) { return y + h - (v - yr[0]) / (yr[1] - yr[0]) * h; };
    b.iX = function (px) { return xr[0] + (px - x) / w * (xr[1] - xr[0]); };
    b.iY = function (py) { return yr[0] + (y + h - py) / h * (yr[1] - yr[0]); };
    b.grid = function (dx, dy, xl, yl) {
      ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = css('--line'); ctx.fillStyle = css('--muted'); ctx.font = '11.5px Inter, system-ui, sans-serif';
      var v;
      for (v = Math.ceil(xr[0] / dx) * dx; v <= xr[1] + 1e-9; v += dx) { ctx.beginPath(); ctx.moveTo(b.X(v), y); ctx.lineTo(b.X(v), y + h); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(+v.toFixed(2) + '', b.X(v), y + h + 14); }
      for (v = Math.ceil(yr[0] / dy) * dy; v <= yr[1] + 1e-9; v += dy) { ctx.beginPath(); ctx.moveTo(x, b.Y(v)); ctx.lineTo(x + w, b.Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(+v.toFixed(2) + '', x - 5, b.Y(v) + 4); }
      ctx.strokeStyle = css('--muted');
      if (yr[0] < 0 && yr[1] > 0) { ctx.beginPath(); ctx.moveTo(x, b.Y(0)); ctx.lineTo(x + w, b.Y(0)); ctx.stroke(); }
      if (xr[0] < 0 && xr[1] > 0) { ctx.beginPath(); ctx.moveTo(b.X(0), y); ctx.lineTo(b.X(0), y + h); ctx.stroke(); }
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = css('--ink'); ctx.font = 'italic 13px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
      if (xl) ctx.fillText(xl, x + w / 2, y + h + 30);
      if (yl) { ctx.save(); ctx.translate(x - 34, y + h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore(); }
      ctx.restore();
    };
    b.line = function (pts, color, width, dash) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.strokeStyle = color; ctx.lineWidth = width || 2; ctx.setLineDash(dash || []); ctx.beginPath();
      var pen = false;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; if (!p || !isFinite(p[0]) || !isFinite(p[1])) { pen = false; continue; }
        var px = b.X(p[0]), py = b.Y(p[1]);
        if (Math.abs(px) > 1e5 || Math.abs(py) > 1e5) { pen = false; continue; }
        if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
      }
      ctx.stroke(); ctx.restore();
    };
    b.dot = function (px, py, r, fill, stroke) { ctx.beginPath(); ctx.arc(b.X(px), b.Y(py), r, 0, 7); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 1.6; ctx.strokeStyle = stroke; ctx.stroke(); } };
    b.arrow = function (p0, p1, color) {
      var x0 = b.X(p0[0]), y0 = b.Y(p0[1]), x1 = b.X(p1[0]), y1 = b.Y(p1[1]);
      if (x1 < x || x1 > x + w || y1 < y || y1 > y + h) return;
      var a = Math.atan2(y1 - y0, x1 - x0), s = 7;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - s * Math.cos(a - 0.45), y1 - s * Math.sin(a - 0.45)); ctx.lineTo(x1 - s * Math.cos(a + 0.45), y1 - s * Math.sin(a + 0.45)); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
    };
    return b;
  }
  function legend(ctx, x, y, items) {
    ctx.save(); ctx.font = '12px Inter, system-ui, sans-serif'; ctx.textAlign = 'left';
    items.forEach(function (it) { ctx.fillStyle = it[1]; ctx.fillRect(x, y - 5, 14, 3); ctx.fillStyle = css('--ink'); ctx.fillText(it[0], x + 20, y); x += ctx.measureText(it[0]).width + 38; });
    ctx.restore();
  }
  function rk4(f, x, dt) {
    var k1 = f(x), k2 = f([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]]), k3 = f([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]]), k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]]);
    return [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
  }
  function sgn(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }

  var NLS = {};

  /* ============ 1. Phase plane explorer ============ */
  var LIN = {
    ex7: { name: 'Example 7: ẍ + 4ẋ + 2x = 0 (stable node)', A: [0, 1, -2, -4] },
    ex8: { name: 'Example 8: ẍ − 3ẋ + 2x = 0 (unstable node)', A: [0, 1, -2, 3] },
    ex9: { name: 'Example 9: ẍ − ẋ − 2x = 0 (saddle)', A: [0, 1, 2, 1] },
    ex10: { name: 'Example 10: ẍ + ẋ + x = 0 (stable focus)', A: [0, 1, -1, -1] },
    ex11: { name: 'Example 11: ẍ − ẋ + x = 0 (unstable focus)', A: [0, 1, -1, 1] },
    ex12: { name: 'Example 12: ẍ + 3x = 0 (centre)', A: [0, 1, -3, 0] },
    ex13: { name: 'Example 13: ẍ + 2ẋ + x = 0 (degenerate node)', A: [0, 1, -1, -2] },
    star: { name: 'Star node: ẋ = −x', A: [-1, 0, 0, -1] },
    linear: { name: 'Any linear system ẋ = Ax (set A below)', A: [0, 1, -2, -1] }
  };
  var NONLIN = {
    pendulum: { name: 'Pendulum: θ̈ + bθ̇ + sin θ = 0', range: [-7.5, 7.5, -3.5, 3.5], p: ['damping b', 0, 1, 0.02, 0.15], f: function (x, a) { return [x[1], -a * x[1] - Math.sin(x[0])]; }, eq: function () { return [[-2 * Math.PI, 0], [-Math.PI, 0], [0, 0], [Math.PI, 0], [2 * Math.PI, 0]]; } },
    vdp: { name: 'Van der Pol: ẍ − μ(1 − x²)ẋ + x = 0', range: [-4, 4, -4, 4], p: ['μ', 0, 3, 0.05, 1], f: function (x, a) { return [x[1], a * (1 - x[0] * x[0]) * x[1] - x[0]]; }, eq: function () { return [[0, 0]]; } },
    duffing: { name: 'Duffing: ẍ + δẋ − x + x³ = 0', range: [-2.4, 2.4, -2, 2], p: ['damping δ', 0, 1, 0.02, 0.3], f: function (x, a) { return [x[1], -a * x[1] + x[0] - x[0] * x[0] * x[0]]; }, eq: function () { return [[-1, 0], [0, 0], [1, 0]]; } },
    quad: { name: 'ẍ + 0.5ẋ + 2x + x² = 0', range: [-4, 2, -3.5, 3.5], p: null, f: function (x) { return [x[1], -0.5 * x[1] - 2 * x[0] - x[0] * x[0]]; }, eq: function () { return [[0, 0], [-2, 0]]; } },
    relay: { name: 'Relay + 1/s²: c̈ = M sign(r − c), r = 2', range: [0, 4, -2.5, 2.5], p: ['relay output M', 0.2, 2, 0.1, 1.2], f: function (x, a) { return [x[1], a * sgn(2 - x[0])]; }, eq: function () { return [[2, 0]]; } }
  };
  function classify(A) {
    var tr = A[0] + A[3], det = A[0] * A[3] - A[1] * A[2], disc = tr * tr - 4 * det, ev, type;
    if (disc >= 0) { var s = Math.sqrt(disc); ev = [(tr - s) / 2, (tr + s) / 2]; } else { ev = [tr / 2, Math.sqrt(-disc) / 2]; }
    var eps = 1e-9;
    if (Math.abs(det) < eps) type = 'det A = 0: a line of equilibria (A is singular)';
    else if (det < 0) type = 'saddle point (unstable)';
    else if (Math.abs(tr) < eps) type = 'centre (marginally stable)';
    else if (disc < -eps) type = (tr < 0 ? 'stable' : 'unstable') + ' focus';
    else if (Math.abs(disc) <= eps) type = (tr < 0 ? 'stable' : 'unstable') + ((Math.abs(A[1]) < eps && Math.abs(A[2]) < eps) ? ' star node' : ' degenerate node');
    else type = (tr < 0 ? 'stable' : 'unstable') + ' node';
    var evs = disc >= 0 ? 'λ = ' + ev[0].toFixed(3) + ', ' + ev[1].toFixed(3) : 'λ = ' + ev[0].toFixed(3) + ' ± j' + ev[1].toFixed(3);
    return { tr: tr, det: det, disc: disc, ev: ev, type: type, evs: evs };
  }
  function jac(f, p, a) {
    var h = 1e-5, f1 = f([p[0] + h, p[1]], a), f2 = f([p[0] - h, p[1]], a), g1 = f([p[0], p[1] + h], a), g2 = f([p[0], p[1] - h], a);
    return [(f1[0] - f2[0]) / 2 / h, (g1[0] - g2[0]) / 2 / h, (f1[1] - f2[1]) / 2 / h, (g1[1] - g2[1]) / 2 / h];
  }

  NLS['phase-plane'] = function (root) {
    var only = (root.getAttribute('data-only') || '').split(',').filter(Boolean);
    var preset = root.getAttribute('data-preset') || 'ex7';
    root.appendChild(el('h3', {}, 'Phase plane explorer'));
    root.appendChild(el('p', { 'class': 'desc' }, 'Pick a system, then click (or tap) anywhere in the phase plane to start a trajectory there. The grey arrows show the direction field, the dashed lines are the eigenvector directions of a linear system, and the readout classifies each equilibrium from its eigenvalues.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var opts = [];
    Object.keys(LIN).forEach(function (k) { if (!only.length || only.indexOf(k) >= 0) opts.push([k, LIN[k].name]); });
    Object.keys(NONLIN).forEach(function (k) { if (!only.length || only.indexOf(k) >= 0) opts.push([k, NONLIN[k].name]); });
    if (!opts.some(function (o) { return o[0] === preset; })) preset = opts[0][0];
    var sel = select(box, 'System', opts, preset, function () { setup(); clearT(); });
    var abox = el('div', { 'class': 'controls' }); root.appendChild(abox);
    var aS = ['a₁₁', 'a₁₂', 'a₂₁', 'a₂₂'].map(function (n, i) { return slider(abox, n, -4, 4, 0.1, 0, function () { if (sel.value !== 'linear') { sel.value = 'linear'; } clearT(); draw(); }); });
    var pbox = el('div', { 'class': 'controls' }); root.appendChild(pbox);
    var pS = slider(pbox, 'parameter', 0, 1, 0.01, 0, function () { recompute(); draw(); });
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    button(btns, 'Clear trajectories', function () { clearT(); draw(); });
    button(btns, 'Add a ring of starts', function () { ring(); draw(); });
    var c = canvas(root, 0.62, 320, 560); c.style.cursor = 'crosshair';
    var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    var starts = [], trajs = [], anim = null, B = null;

    function sys() {
      var k = sel.value;
      if (LIN[k]) {
        var A = aS.map(function (s) { return +s.value; });
        return { lin: true, A: A, range: [-4, 4, -4, 4], f: function (x) { return [A[0] * x[0] + A[1] * x[1], A[2] * x[0] + A[3] * x[1]]; }, eq: [[0, 0]] };
      }
      var N = NONLIN[k], a = N.p ? +pS.value : 0;
      return { lin: false, range: N.range, f: function (x) { return N.f(x, a); }, eq: N.eq(a), rawf: N.f, a: a };
    }
    function setup() {
      var k = sel.value;
      if (LIN[k] && k !== 'linear') LIN[k].A.forEach(function (v, i) { aS[i].set(v); });
      abox.style.display = LIN[k] ? '' : 'none';
      var N = NONLIN[k];
      if (N && N.p) { pbox.style.display = ''; var l = pS.parentNode; l.firstChild.textContent = N.p[0] + ': '; pS.min = N.p[1]; pS.max = N.p[2]; pS.step = N.p[3]; pS.set(N.p[4]); }
      else pbox.style.display = 'none';
    }
    function integrate(s0, S) {
      var r = S.range, pad = 0.6 * Math.max(r[1] - r[0], r[3] - r[2]);
      function run(sign) {
        var x = s0.slice(), pts = [x], dt = 0.01 * sign;
        for (var i = 0; i < 4000; i++) {
          x = rk4(S.f, x, dt); if (!isFinite(x[0]) || !isFinite(x[1])) break;
          pts.push(x);
          if (x[0] < r[0] - pad || x[0] > r[1] + pad || x[1] < r[2] - pad || x[1] > r[3] + pad) break;
        }
        return pts;
      }
      return { fw: run(1), bw: S.lin ? run(-1) : run(-1).slice(0, 300) };
    }
    function recompute() { var S = sys(); trajs = starts.map(function (s) { return integrate(s, S); }); }
    function clearT() { starts = []; trajs = []; if (anim) cancelAnimationFrame(anim); anim = null; }
    function ring() {
      var S = sys(), r = S.range;
      for (var i = 0; i < 12; i++) { var a = i / 12 * 2 * Math.PI; starts.push([(r[0] + r[1]) / 2 + 0.42 * (r[1] - r[0]) * Math.cos(a), (r[2] + r[3]) / 2 + 0.42 * (r[3] - r[2]) * Math.sin(a)]); }
      recompute();
    }
    function draw(dotIdx) {
      var F = fit(c), ctx = F.ctx, S = sys(), r = S.range;
      var L = 56, Rm = 14, T = 12, Bm = 42, W = F.w - L - Rm, H = F.h - T - Bm;
      // keep equal scaling: shrink the wider axis range to fit the box aspect
      var sx = W / (r[1] - r[0]), sy = H / (r[3] - r[2]), s = Math.min(sx, sy);
      var cx = (r[0] + r[1]) / 2, cy = (r[2] + r[3]) / 2, hx = W / s / 2, hy = H / s / 2;
      B = Box(ctx, L, T, W, H, [cx - hx, cx + hx], [cy - hy, cy + hy]);
      var step = (2 * hx) > 12 ? 2 : (2 * hx) > 5 ? 1 : 0.5;
      B.grid(step, step, 'x₁', 'x₂');
      // direction field
      ctx.save(); ctx.strokeStyle = css('--muted'); ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
      var nx = Math.max(12, Math.round(W / 34)), ny = Math.round(nx * H / W);
      for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) {
        var x0 = B.xr[0] + (i + 0.5) / nx * (B.xr[1] - B.xr[0]), y0 = B.yr[0] + (j + 0.5) / ny * (B.yr[1] - B.yr[0]);
        var d = S.f([x0, y0]), dx = d[0] * s, dy = -d[1] * s, n = Math.hypot(dx, dy);
        if (n < 1e-9) continue;
        dx = dx / n * 9; dy = dy / n * 9;
        var px = B.X(x0), py = B.Y(y0);
        ctx.beginPath(); ctx.moveTo(px - dx, py - dy); ctx.lineTo(px + dx, py + dy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + dx, py + dy); ctx.lineTo(px + dx - 0.45 * (dx * 0.9 - dy * 0.5), py + dy - 0.45 * (dy * 0.9 + dx * 0.5)); ctx.stroke();
      }
      ctx.restore();
      var txt = '';
      if (S.lin) {
        var C = classify(S.A);
        if (C.disc >= 0 && Math.abs(C.det) > 1e-9) {
          [C.ev[0], C.ev[1]].forEach(function (lam, k) {
            var v = Math.abs(S.A[1]) > 1e-9 ? [S.A[1], lam - S.A[0]] : (Math.abs(S.A[2]) > 1e-9 ? [lam - S.A[3], S.A[2]] : (k ? [0, 1] : [1, 0]));
            if (Math.abs(S.A[1]) < 1e-9 && Math.abs(S.A[2]) < 1e-9 && Math.abs(C.disc) < 1e-9) return;
            var n = Math.hypot(v[0], v[1]); v = [v[0] / n * 20, v[1] / n * 20];
            B.line([[-v[0], -v[1]], [v[0], v[1]]], k ? PINK : ORANGE, 2, [7, 5]);
          });
        }
        B.dot(0, 0, 5, C.tr < 0 && C.det > 0 ? css('--ink') : css('--bg'), css('--ink'));
        txt = 'tr A = ' + C.tr.toFixed(2) + ', det A = ' + C.det.toFixed(2) + '   ·   ' + C.evs + '   ·   Origin: ' + C.type;
      } else {
        var parts = [];
        S.eq.forEach(function (p) {
          if (p[0] < B.xr[0] || p[0] > B.xr[1]) return;
          var J = jac(S.rawf, p, S.a), C = classify(J), st = C.tr < -1e-9 && C.det > 0;
          if (sel.value === 'relay') { B.dot(p[0], p[1], 5, css('--bg'), css('--ink')); parts.push('(2, 0): the relay switches here; trajectories around it are closed curves'); return; }
          B.dot(p[0], p[1], 5, st ? css('--ink') : css('--bg'), css('--ink'));
          parts.push('(' + (+p[0].toFixed(2)) + ', ' + p[1] + '): ' + C.type);
        });
        txt = 'Equilibria from the linearization (Jacobian) at each point: ' + parts.join('   ·   ');
        if (sel.value === 'relay') { B.line([[2, -10], [2, 10]], PINK, 1.4, [6, 4]); }
      }
      trajs.forEach(function (tr, k) {
        B.line(tr.bw, css('--muted'), 1.2, [3, 4]);
        B.line(tr.fw, css('--accent'), 2.2);
        var n = tr.fw.length, i = Math.min(n - 2, 25);
        if (n > 30) B.arrow(tr.fw[i], tr.fw[i + 1], css('--accent'));
        B.dot(starts[k][0], starts[k][1], 3.5, css('--accent'));
      });
      if (dotIdx != null && trajs.length) {
        var last = trajs[trajs.length - 1].fw, p = last[Math.min(dotIdx, last.length - 1)];
        B.dot(p[0], p[1], 6, css('--gold'), css('--ink'));
      }
      info.textContent = txt + (starts.length ? '' : '   ·   Click the plane to start a trajectory.');
    }
    function play() {
      if (anim) cancelAnimationFrame(anim);
      var k = 0, n = trajs[trajs.length - 1].fw.length;
      (function tick() { draw(k); k += 4; if (k < n) anim = requestAnimationFrame(tick); else { anim = null; draw(); } })();
    }
    c.addEventListener('click', function (e) {
      if (!B) return; var rc = c.getBoundingClientRect(), px = e.clientX - rc.left, py = e.clientY - rc.top;
      if (px < B.x || px > B.x + B.w || py < B.y || py > B.y + B.h) return;
      var s0 = [B.iX(px), B.iY(py)]; starts.push(s0); trajs.push(integrate(s0, sys())); play();
    });
    setup(); ring(); draw(); onTheme(function () { draw(); });
  };

  /* ============ 2. Describing function explorer ============ */
  function memStep(kind, par) {
    return function (x, y) {
      if (kind === 'hyst') { if (x >= par.h) return 1; if (x <= -par.h) return -1; return y; }
      if (kind === 'dzhyst') { if (x >= par.on) return 1; if (x <= -par.on) return -1; if (Math.abs(x) < par.off) return 0; return y; }
      if (kind === 'backlash') { return Math.min(Math.max(y, x - par.b), x + par.b); }
      return y;
    };
  }
  var DFN = {
    saturation: { name: 'Saturation (K = 1, S = 1)', f: function (x) { return Math.max(-1, Math.min(1, x)); }, xr: 2.5, yr: 1.6 },
    deadzone: { name: 'Dead zone (K = 1, D/2 = 0.5)', f: function (x) { return Math.abs(x) > 0.5 ? x - sgn(x) * 0.5 : 0; }, xr: 2.5, yr: 2 },
    relay: { name: 'Ideal relay (M = 1)', f: function (x) { return sgn(x); }, xr: 2.5, yr: 1.6 },
    relaydz: { name: 'Relay with dead zone (M = 1, a = 0.5)', f: function (x) { return Math.abs(x) > 0.5 ? sgn(x) : 0; }, xr: 2.5, yr: 1.6 },
    hyst: { name: 'Relay with hysteresis (M = 1, h = 0.4)', mem: memStep('hyst', { h: 0.4 }), xr: 2.5, yr: 1.6 },
    dzhyst: { name: 'Relay with dead zone and hysteresis (on 0.8, off 0.4)', mem: memStep('dzhyst', { on: 0.8, off: 0.4 }), xr: 2.5, yr: 1.6 },
    backlash: { name: 'Backlash (K = 1, gap 2b = 0.8)', mem: memStep('backlash', { b: 0.4 }), xr: 2.5, yr: 2 },
    cubic: { name: 'Cubic y = x³', f: function (x) { return x * x * x; }, xr: 2, yr: 4 }
  };
  function dfWave(nl, X, n) {
    n = n || 720; var th = [], xs = [], ys = [], y = 0, i;
    for (i = 0; i < 2 * n; i++) {
      var t = 2 * Math.PI * (i + 0.5) / n, x = X * Math.sin(t);
      y = nl.mem ? nl.mem(x, y) : nl.f(x);
      if (i >= n) { th.push(t - 2 * Math.PI); xs.push(x); ys.push(y); }
    }
    var A = 0, Bc = 0;
    for (i = 0; i < n; i++) { A += ys[i] * Math.sin(th[i]); Bc += ys[i] * Math.cos(th[i]); }
    A *= 2 / n; Bc *= 2 / n;
    return { th: th, x: xs, y: ys, A1: A, B1: Bc, N: [A / X, Bc / X] };
  }

  NLS['describing-function'] = function (root) {
    var preset = root.getAttribute('data-preset') || 'saturation';
    root.appendChild(el('h3', {}, 'Describing function explorer'));
    root.appendChild(el('p', { 'class': 'desc' }, 'Top: a sine of amplitude X enters the nonlinearity; the plot shows the output (blue), its fundamental (pink dashed) and the describing function K_N. Bottom: the polar plot of G(jω) = K/(jω(jω+1)(jω+2)) and the critical locus −1/K_N(X). Each crossing predicts a limit cycle.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var opts = Object.keys(DFN).map(function (k) { return [k, DFN[k].name]; });
    if (!DFN[preset]) preset = 'saturation';
    var sel = select(box, 'Nonlinearity', opts, preset, function () { draw(); });
    var sX = slider(box, 'input amplitude X', 0.05, 4, 0.05, 1.5, function () { draw(); });
    var sK = slider(box, 'plant gain K', 1, 40, 0.5, 10, function () { draw(); });
    var c1 = canvas(root, 0.4, 240, 340);
    var r1 = el('div', { 'class': 'readout' }); root.appendChild(r1);
    var c2 = canvas(root, 0.55, 300, 480);
    var r2 = el('div', { 'class': 'readout' }); root.appendChild(r2);

    function G(w, K) { // K/(jw(jw+1)(jw+2))
      var re = -3 * w * w, im = w * (2 - w * w); // denominator = jw(jw+1)(jw+2) = -3w^2 + j(2w - w^3)
      var d = re * re + im * im; return [K * re / d, -K * im / d];
    }
    function phaseG(w) { return -Math.PI / 2 - Math.atan(w) - Math.atan(w / 2); }
    function locus(nl) {
      var pts = [], X;
      for (var i = 0; i <= 400; i++) {
        X = 0.03 * Math.pow(400, i / 400);
        var N = dfWave(nl, X, 720).N, m2 = N[0] * N[0] + N[1] * N[1];
        if (m2 < 1e-8) { pts.push(null); continue; }
        pts.push({ X: X, p: [-N[0] / m2, N[1] / m2], N: N });
      }
      return pts;
    }
    function crossings(L, K) {
      var out = [], prev = null;
      L.forEach(function (q) {
        if (!q) { prev = null; return; }
        var ang = Math.atan2(q.p[1], q.p[0]); if (ang > 0) ang -= 2 * Math.PI; // in (-2π, 0]
        var lo = 1e-4, hi = 1e3, w = null;
        if (ang < phaseG(lo) && ang > phaseG(hi)) {
          for (var k = 0; k < 60; k++) { var mid = Math.sqrt(lo * hi); if (phaseG(mid) > ang) lo = mid; else hi = mid; }
          w = Math.sqrt(lo * hi);
        }
        var d = null;
        if (w != null) { var g = G(w, K); d = Math.hypot(g[0], g[1]) - Math.hypot(q.p[0], q.p[1]); }
        if (prev && prev.d != null && d != null && sgn(prev.d) !== sgn(d) && d !== 0) {
          var f = prev.d / (prev.d - d);
          out.push({ X: prev.X + f * (q.X - prev.X), w: prev.w + f * (w - prev.w), p: [prev.p[0] + f * (q.p[0] - prev.p[0]), prev.p[1] + f * (q.p[1] - prev.p[1])], stable: prev.d > 0 });
        }
        prev = { X: q.X, d: d, w: w, p: q.p };
      });
      return out;
    }
    function draw() {
      var nl = DFN[sel.value], X = +sX.value, K = +sK.value;
      var W = dfWave(nl, X), ink = css('--ink'), mut = css('--muted'), acc = css('--accent');
      // ---- top: characteristic and waveforms
      var g = fit(c1), ctx = g.ctx, pad = 44, cw = Math.min(g.h - 40, g.w * 0.34);
      var Bc = Box(ctx, pad, 12, cw, g.h - 46, [-nl.xr, nl.xr], [-nl.yr, nl.yr]);
      Bc.grid(1, nl.yr > 2 ? 1 : 0.5, 'x', 'y');
      var ch = [], xx;
      if (nl.mem) {
        var Wc = dfWave(nl, nl.xr * 0.95, 400); for (var i = 0; i < Wc.x.length; i++) ch.push([Wc.x[i], Wc.y[i]]); ch.push(ch[0]);
        Bc.line(ch, mut, 1.4, [4, 4]);
      } else { for (xx = -nl.xr; xx <= nl.xr; xx += nl.xr / 300) ch.push([xx, nl.f(xx)]); Bc.line(ch, mut, 1.6); }
      var used = W.x.map(function (v, i) { return [v, W.y[i]]; }); used.push(used[0]);
      Bc.line(used, acc, 3);
      var x0 = pad + cw + 60, Bw = Box(ctx, x0, 12, g.w - x0 - 12, g.h - 46, [0, 2 * Math.PI], [-Math.max(nl.yr, X), Math.max(nl.yr, X)]);
      Bw.grid(Math.PI / 2, nl.yr > 2 || X > 2 ? 1 : 0.5, 'ωt (0 to 2π)', null);
      Bw.line(W.th.map(function (t, i) { return [t, W.x[i]]; }), mut, 1.4);
      Bw.line(W.th.map(function (t, i) { return [t, W.y[i]]; }), acc, 2.6);
      Bw.line(W.th.map(function (t) { return [t, W.A1 * Math.sin(t) + W.B1 * Math.cos(t)]; }), PINK, 2, [6, 5]);
      var mag = Math.hypot(W.N[0], W.N[1]), ph = Math.atan2(W.N[1], W.N[0]) * 180 / Math.PI;
      r1.textContent = 'X = ' + X.toFixed(2) + ':  K_N = ' + mag.toFixed(3) + (Math.abs(ph) > 0.05 ? ' ∠ ' + ph.toFixed(1) + '°' : ' (real)') + '   ·   grey: input X sin ωt and the full characteristic; blue: output and the part of the characteristic in use; pink: fundamental.';
      // ---- bottom: Nyquist and locus
      var h = fit(c2); ctx = h.ctx;
      var L = locus(nl), cr = crossings(L, K);
      var R = Math.max(2.5, K / 6 * 2.2);
      var Bn = Box(ctx, 50, 12, h.w - 66, h.h - 48, [-R, 0.25 * R], [-0.75 * R, 0.35 * R]);
      var step = R > 8 ? 2 : R > 4 ? 1 : 0.5;
      Bn.grid(step, step, 'Re', 'Im');
      var gp = []; for (var k2 = 0; k2 <= 600; k2++) { var w = 0.05 * Math.pow(600, k2 / 600); gp.push(G(w, K)); }
      Bn.line(gp, acc, 2.6);
      var segs = [], cur = [];
      L.forEach(function (q) { if (q) cur.push(q.p); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
      segs.forEach(function (sg) { Bn.line(sg, PINK, 2.6); });
      var Nx = W.N, m2 = Nx[0] * Nx[0] + Nx[1] * Nx[1];
      if (m2 > 1e-8) Bn.dot(-Nx[0] / m2, Nx[1] / m2, 6, css('--gold'), ink);
      cr.forEach(function (q) { Bn.dot(q.p[0], q.p[1], 7, 'rgba(0,0,0,0)', q.stable ? GREEN : ORANGE); });
      legend(ctx, 60, h.h - 8, [['G(jω)', acc], ['−1/K_N(X)', PINK]]);
      var t = cr.length ? cr.map(function (q) { return 'limit cycle at X ≈ ' + q.X.toFixed(2) + ', ω ≈ ' + q.w.toFixed(2) + ' rad/s (period ' + (2 * Math.PI / q.w).toFixed(2) + ' s), ' + (q.stable ? 'stable (green ring)' : 'unstable (orange ring)') + ((q.p[0] < -R || q.p[1] < -0.75 * R || q.p[1] > 0.35 * R) ? ', outside the plot' : ''); }).join('   ·   ') : 'No crossing: no limit cycle is predicted for this K.';
      r2.textContent = 'K = ' + K + ':  ' + t + '   ·   The filled dot is −1/K_N at the current X.';
    }
    draw(); onTheme(draw);
  };

  // ---------- circle criterion ----------
  function pmul(a, b) { var r = [], i, j; for (i = 0; i < a.length + b.length - 1; i++) r.push(0); for (i = 0; i < a.length; i++) for (j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]; return r; }
  function pval(c, w) { // polynomial (highest power first) at s = jw, returns [re, im]
    var re = 0, im = 0; for (var i = 0; i < c.length; i++) { var nr = -im * w, ni = re * w; re = nr + c[i]; im = ni; } return [re, im];
  }
  var CIRC = {
    ex713: { name: 'G = 4/((s+1)(s/2+1)(s/3+1))  (stable)', num: [4], den: pmul(pmul([1, 1], [0.5, 1]), [1 / 3, 1]), m: 0, a: 0, b: 1.1 },
    ex714: { name: 'G = 4/((s−1)(s/2+1)(s/3+1))  (1 unstable pole)', num: [4], den: pmul(pmul([1, -1], [0.5, 1]), [1 / 3, 1]), m: 1, a: 0.3, b: 0.325 },
    c45: { name: 'G = 4/((s−1)(s/3+1)(s/5+1))  (1 unstable pole)', num: [4], den: pmul(pmul([1, -1], [1 / 3, 1]), [0.2, 1]), m: 1, a: 0.27, b: 0.44 },
    ex715: { name: 'G = (s+2)/((s+1)(s−1))  (1 unstable pole)', num: [1, 2], den: [1, 0, -1], m: 1, a: 0.55, b: 1 },
    c46a: { name: 'G = 1/((s+1)(s+2))  (stable)', num: [1], den: [1, 3, 2], m: 0, a: 0, b: 15 },
    popov: { name: 'G = 1/(s² + s + 1)  (stable)', num: [1], den: [1, 1, 1], m: 0, a: 0, b: 2.9 }
  };
  NLS['circle'] = function (root) {
    var preset = root.getAttribute('data-preset') || 'ex713';
    if (!CIRC[preset]) preset = 'ex713';
    root.appendChild(el('h3', {}, 'Circle criterion explorer'));
    root.appendChild(el('p', { 'class': 'desc' }, 'Pick a linear part G(s) and a sector [α, β] for the nonlinearity. The tool draws the Nyquist plot of G(jω) (solid for ω ≥ 0, dashed for ω < 0) and the forbidden region of the circle criterion, and checks the right case: the disk through −1/α and −1/β, the line Re = −1/β when α = 0, or the inside of the disk when α < 0 < β.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var sel = select(box, 'Linear part', Object.keys(CIRC).map(function (k) { return [k, CIRC[k].name]; }), preset, function () { var P = CIRC[sel.value]; sA.set(P.a); sB.set(P.b); draw(); });
    var f3 = function (v) { return (+v).toFixed(3); };
    var sA = slider(box, 'α (lower slope)', -3, 2, 0.001, CIRC[preset].a, function () { draw(); }, f3);
    var sB = slider(box, 'β (upper slope)', 0.01, 20, 0.001, CIRC[preset].b, function () { draw(); }, f3);
    var cv = canvas(root, 0.62, 300, 520);
    var out = el('div', { 'class': 'readout' }); root.appendChild(out);
    function curve(P) {
      var pts = [], i, w;
      for (i = 0; i <= 1600; i++) { w = 1e-3 * Math.pow(1e6, i / 1600); var n = pval(P.num, w), d = pval(P.den, w), dd = d[0] * d[0] + d[1] * d[1]; pts.push([(n[0] * d[0] + n[1] * d[1]) / dd, (n[1] * d[0] - n[0] * d[1]) / dd]); }
      return pts;
    }
    function winding(pos, c) { // full contour: ω from −∞ to ∞ (mirror image first), CCW positive
      var full = pos.slice().reverse().map(function (p) { return [p[0], -p[1]]; }).concat(pos), tot = 0;
      for (var i = 1; i < full.length; i++) {
        var a0 = Math.atan2(full[i - 1][1], full[i - 1][0] - c), a1 = Math.atan2(full[i][1], full[i][0] - c), da = a1 - a0;
        if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; tot += da;
      }
      return Math.round(tot / (2 * Math.PI));
    }
    function draw() {
      var P = CIRC[sel.value], a = +sA.value, b = +sB.value, pos = curve(P), ink = css('--ink'), acc = css('--accent');
      var all = pos.concat(pos.map(function (p) { return [p[0], -p[1]]; }));
      var minRe = Math.min.apply(null, pos.map(function (p) { return p[0]; }));
      var verdict = '', ok = false, c = null, r = null, mode;
      if (b <= a) { verdict = 'Choose β > α.'; mode = 'none'; }
      else if (Math.abs(a) < 5e-4) {
        mode = 'line';
        if (P.m > 0) verdict = 'α = 0 needs a stable G, but G has ' + P.m + ' unstable pole. Use α > 0 (the disk case).';
        else { ok = minRe > -1 / b; verdict = 'min Re G(jω) = ' + minRe.toFixed(3) + (ok ? ' > ' : ' ≤ ') + '−1/β = ' + (-1 / b).toFixed(3) + (ok ? ': absolutely stable for every nonlinearity in [0, ' + b.toFixed(3) + '].' : ': the test fails. Largest β here is ' + (-1 / minRe).toFixed(3) + '.'); }
      } else {
        c = -(1 / a + 1 / b) / 2; r = Math.abs(1 / a - 1 / b) / 2;
        var dmin = Infinity, dmax = 0; all.forEach(function (p) { var d = Math.hypot(p[0] - c, p[1]); if (d < dmin) dmin = d; if (d > dmax) dmax = d; });
        if (a > 0) {
          mode = 'disk'; var n = winding(pos, c);
          ok = dmin > r && n === P.m;
          verdict = 'Disk centre ' + c.toFixed(3) + ', radius ' + r.toFixed(3) + '. Closest approach of the plot: ' + dmin.toFixed(3) + (dmin > r ? ' (outside, good)' : ' (the plot enters the disk)') + '. Anticlockwise encirclements: ' + n + ', needed: ' + P.m + '. ' + (ok ? 'Absolutely stable for every nonlinearity in [' + a.toFixed(3) + ', ' + b.toFixed(3) + '].' : 'The test fails.');
        } else {
          mode = 'inside';
          if (P.m > 0) verdict = 'α < 0 needs a stable G, but G has ' + P.m + ' unstable pole.';
          else { ok = dmax < r * (1 - 1e-4); verdict = 'Disk centre ' + c.toFixed(3) + ', radius ' + r.toFixed(3) + '. Farthest point of the plot: ' + dmax.toFixed(3) + (ok ? ' (inside): absolutely stable for every nonlinearity in [' + a.toFixed(3) + ', ' + b.toFixed(3) + '].' : ' (outside the disk): the test fails.'); }
        }
      }
      // view with equal scaling
      var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      if (c != null && r < 30) { x0 = Math.min(x0, c - r); x1 = Math.max(x1, c + r); y0 = Math.min(y0, -r); y1 = Math.max(y1, r); }
      if (mode === 'line') x0 = Math.min(x0, -1 / b);
      x0 = Math.min(x0, -0.2); x1 = Math.max(x1, 0.2);
      var g = fit(cv), ctx = g.ctx, L = 52, T = 12, Wd = g.w - L - 14, Ht = g.h - T - 44;
      var mx = (x1 - x0) * 0.08 + 0.05, my = (y1 - y0) * 0.08 + 0.05; x0 -= mx; x1 += mx; y0 -= my; y1 += my;
      var sc = Math.min(Wd / (x1 - x0), Ht / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      var xr = [cx - Wd / sc / 2, cx + Wd / sc / 2], yr = [cy - Ht / sc / 2, cy + Ht / sc / 2];
      var B = Box(ctx, L, T, Wd, Ht, xr, yr), span = xr[1] - xr[0];
      var st = span > 16 ? 4 : span > 8 ? 2 : span > 4 ? 1 : span > 2 ? 0.5 : span > 0.8 ? 0.2 : 0.1;
      B.grid(st, st, 'Re', 'Im');
      ctx.save(); ctx.beginPath(); ctx.rect(L, T, Wd, Ht); ctx.clip();
      ctx.fillStyle = 'rgba(219,39,119,0.14)';
      if (mode === 'disk') { ctx.beginPath(); ctx.arc(B.X(c), B.Y(0), r * sc, 0, 7); ctx.fill(); }
      if (mode === 'line') ctx.fillRect(L, T, B.X(-1 / b) - L, Ht);
      if (mode === 'inside') { ctx.beginPath(); ctx.rect(L, T, Wd, Ht); ctx.moveTo(B.X(c) + r * sc, B.Y(0)); ctx.arc(B.X(c), B.Y(0), r * sc, 0, 2 * Math.PI, true); ctx.fill('evenodd'); }
      ctx.restore();
      if (mode === 'disk' || mode === 'inside') { var cp = []; for (var k = 0; k <= 200; k++) cp.push([c + r * Math.cos(k * Math.PI / 100), r * Math.sin(k * Math.PI / 100)]); B.line(cp, PINK, 2); }
      if (mode === 'line') B.line([[-1 / b, yr[0]], [-1 / b, yr[1]]], PINK, 2);
      B.line(pos.map(function (p) { return [p[0], -p[1]]; }), acc, 1.5, [5, 4]);
      B.line(pos, acc, 2.6);
      var mid = Math.round(pos.length * 0.45); B.arrow(pos[mid - 4], pos[mid], acc);
      if (mode === 'disk' || mode === 'inside') { B.dot(-1 / a, 0, 4, PINK); B.dot(-1 / b, 0, 4, PINK); }
      legend(ctx, L + 6, g.h - 8, [['G(jω)', acc], ['forbidden region boundary', PINK]]);
      out.textContent = verdict;
      out.style.color = ok ? GREEN : '';
    }
    draw(); onTheme(draw);
  };

  window.NLS = NLS;
  function boot() { document.querySelectorAll('.nls[data-nls]').forEach(function (r) { var f = NLS[r.getAttribute('data-nls')]; if (f && !r._done) { r._done = 1; f(r); } }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
