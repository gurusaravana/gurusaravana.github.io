/* Industrial Automation and Robotics (EACT536): interactive simulations
   ---------------------------------------------------------------
   Paste ONE of these lines on a page that loads this file:
     <div class="sim" data-rsim="geneva"></div>    Geneva indexing mechanism (Lesson 1)
     <div class="sim" data-rsim="station"></div>   one machine with a buffer: discrete events (Lesson 2)
     <div class="sim" data-rsim="payback"></div>   robot investment: pay-back and rate of return (Lesson 3)
     <div class="sim" data-rsim="arm2r"></div>     two-link planar arm: forward and inverse kinematics (Lessons 4 and 5)
   Everything runs in the browser; nothing to install.
*/
(function () {
  var PI = Math.PI;
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function slider(box, label, min, max, step, val, unit, onInput) {
    var l = el('label'), out = el('b', {}, val + (unit || ''));
    l.appendChild(document.createTextNode(label + ': ')); l.appendChild(out);
    var r = el('input', { type: 'range', min: min, max: max, step: step, value: val, 'aria-label': label });
    r.oninput = function () { out.textContent = r.value + (unit || ''); onInput(); };
    r.set = function (v) { r.value = v; out.textContent = r.value + (unit || ''); };
    l.appendChild(r); box.appendChild(l); return r;
  }
  function numbox(box, label, val, step, onInput) {
    var l = el('label', {}, label + '<br>');
    var r = el('input', { type: 'number', value: val, step: step || 'any', 'aria-label': label, style: 'width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit;font-size:14px' });
    r.oninput = onInput; l.appendChild(r); box.appendChild(l); return r;
  }
  function button(box, text, onClick) { var b = el('button', { type: 'button' }, text); b.onclick = onClick; box.appendChild(b); return b; }
  function canvas(root, hfun) { var c = el('canvas'); c._hf = hfun; root.appendChild(c); return c; }
  function fit(c) {
    var dpr = window.devicePixelRatio || 1, w = c.clientWidth || 800, h = c._hf(w);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.height = h + 'px'; }
    var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.font = '12px Inter, system-ui, sans-serif'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    return { ctx: ctx, w: w, h: h };
  }
  function col(name, fb) { return css(name) || fb; }
  var redraws = [];
  window.addEventListener('resize', function () { clearTimeout(window._rsR); window._rsR = setTimeout(function () { redraws.forEach(function (f) { f(); }); }, 150); });
  new MutationObserver(function () { redraws.forEach(function (f) { f(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { redraws.forEach(function (f) { f(); }); });

  // Simple x-y plot inside a box. series: [{x:[], y:[], color, width, dash, name, step}]
  function plot(ctx, b, series, o) {
    var L = b.x + 50, R = b.x + b.w - 12, T = b.y + 26, B = b.y + b.h - 38;
    function X(v) { return L + (v - o.xmin) / (o.xmax - o.xmin) * (R - L); }
    function Y(v) { return T + (1 - (v - o.ymin) / (o.ymax - o.ymin)) * (B - T); }
    ctx.lineWidth = 1; ctx.strokeStyle = col('--plotgrid', col('--line', '#ddd')); ctx.fillStyle = col('--muted', '#666');
    var ny = o.ny || 4, nx = o.nx || 5;
    for (var i = 0; i <= ny; i++) { var yv = o.ymin + (o.ymax - o.ymin) * i / ny, yy = Y(yv); ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(R, yy); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(o.yfmt ? o.yfmt(yv) : +yv.toFixed(2), L - 6, yy + 4); }
    for (i = 0; i <= nx; i++) { var xv = o.xmin + (o.xmax - o.xmin) * i / nx, xx = X(xv); ctx.beginPath(); ctx.moveTo(xx, T); ctx.lineTo(xx, B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(o.xfmt ? o.xfmt(xv) : +xv.toFixed(1), xx, B + 15); }
    ctx.textAlign = 'center'; ctx.fillText(o.xlabel || '', (L + R) / 2, B + 31);
    ctx.save(); ctx.translate(b.x + 12, (T + B) / 2); ctx.rotate(-PI / 2); ctx.fillText(o.ylabel || '', 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(L, T - 3, R - L, B - T + 6); ctx.clip();
    series.forEach(function (s) {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2.2; ctx.setLineDash(s.dash || []); ctx.beginPath();
      for (var k = 0; k < s.x.length; k++) {
        var px = X(s.x[k]), py = Y(s.y[k]);
        if (!k) ctx.moveTo(px, py); else if (s.step) { ctx.lineTo(px, Y(s.y[k - 1])); ctx.lineTo(px, py); } else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
      if (s.dot) { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(s.dot[0]), Y(s.dot[1]), 5, 0, 2 * PI); ctx.fill(); }
    });
    ctx.restore();
    var lx = L, ly = b.y + 11; ctx.textAlign = 'left';
    series.forEach(function (s) { if (!s.name) return; var w = ctx.measureText(s.name).width + 34; if (lx + w > R) { lx = L; ly += 15; } ctx.fillStyle = s.color; ctx.fillRect(lx, ly - 4, 14, 3); ctx.fillStyle = col('--ink', '#111'); ctx.fillText(s.name, lx + 19, ly); lx += w; });
    return { X: X, Y: Y };
  }

  var SIMS = {};

  /* 1. Geneva mechanism ------------------------------------------------------------ */
  SIMS.geneva = function (root) {
    root.appendChild(el('h3', {}, 'Geneva mechanism: index and dwell'));
    root.appendChild(el('p', { 'class': 'desc' }, 'The driver turns at constant speed. While its pin is inside a slot the wheel (and the dial table on it) turns by one slot; for the rest of the turn the locking disc holds it still so the stations can work. Change the number of slots and watch the index and dwell angles.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var ns = slider(box, 'Number of slots n', 3, 8, 1, 6, '', redraw);
    var sp = slider(box, 'Driver speed', 5, 60, 1, 20, ' rpm', function () {});
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var playing = true, pb = button(btns, 'Pause', function () { playing = !playing; pb.textContent = playing ? 'Pause' : 'Play'; if (playing) loop(); });
    var c = canvas(root, function (w) { return w < 640 ? 640 : 330; });
    var info = el('div', { 'class': 'readout' }); root.appendChild(info);
    var phi = -2.2, last = 0;
    function wheelAngle(ph, n) {
      var lam = Math.sin(PI / n), beta = PI / 2 - PI / n;
      var rev = Math.floor((ph + PI) / (2 * PI)), rel = ph - rev * 2 * PI, off;
      // slot angle measured from the line of centres; the wheel turns the opposite way to the driver
      if (rel < -beta) off = PI / n; else if (rel > beta) off = -PI / n;
      else { off = Math.atan2(lam * Math.sin(rel), -1 + lam * Math.cos(rel)) - PI; off = ((off + 3 * PI) % (2 * PI)) - PI; }
      return { psi: -rev * 2 * PI / n + off, engaged: Math.abs(rel) <= beta, rel: rel };
    }
    function drawMech(ctx, cx, cy, size, n) {
      var cdist = size, R = cdist * Math.cos(PI / n), r = cdist * Math.sin(PI / n), rl = Math.min(0.42 * cdist, R * 0.6), hw = Math.max(5, 0.05 * cdist), rin = cdist - r - hw * 1.3;
      var dx = cx - cdist, w = wheelAngle(phi, n), rot = PI + w.psi;
      var ink = col('--ink', '#111'), acc = col('--accent', '#0077b6'), gold = col('--gold', '#ea7a1f');
      var cosd = (R * R + cdist * cdist - rl * rl) / (2 * R * cdist), dl = Math.acos(Math.max(-1, Math.min(1, cosd))), ds = Math.asin(hw / R);
      ctx.beginPath();
      for (var k = 0; k < n; k++) {
        var th = rot + k * 2 * PI / n, ux = Math.cos(th), uy = Math.sin(th), vx = -uy, vy = ux, outer = Math.sqrt(R * R - hw * hw);
        var p1 = [cx + ux * outer - vx * hw, cy + uy * outer - vy * hw];
        if (!k) ctx.moveTo(p1[0], p1[1]); else ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(cx + ux * rin - vx * hw, cy + uy * rin - vy * hw);
        ctx.arc(cx + ux * rin, cy + uy * rin, hw, th - PI / 2, th + PI / 2, true);
        ctx.lineTo(cx + ux * outer + vx * hw, cy + uy * outer + vy * hw);
        var bth = th + PI / n;
        ctx.arc(cx, cy, R, th + ds, bth - dl, false);
        var bx = cx + cdist * Math.cos(bth), by = cy + cdist * Math.sin(bth);
        var q1 = [cx + R * Math.cos(bth - dl), cy + R * Math.sin(bth - dl)], q2 = [cx + R * Math.cos(bth + dl), cy + R * Math.sin(bth + dl)];
        ctx.arc(bx, by, rl, Math.atan2(q1[1] - by, q1[0] - bx), Math.atan2(q2[1] - by, q2[0] - bx), true);
        ctx.arc(cx, cy, R, bth + dl, th + 2 * PI / n - ds, false);
      }
      ctx.closePath();
      ctx.fillStyle = col('--accent-soft', '#e0f2fe'); ctx.fill(); ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2 * PI); ctx.fillStyle = acc; ctx.fill();
      // marker on the wheel (a "part" on the dial)
      ctx.beginPath(); ctx.arc(cx + 0.55 * R * Math.cos(rot + PI / n), cy + 0.55 * R * Math.sin(rot + PI / n), 6, 0, 2 * PI); ctx.fillStyle = col('--signal', '#db2777'); ctx.fill();
      // driver: locking disc with relief toward the pin
      var ld = rl - 3, rel = Math.acos(Math.min(1, (r * r + ld * ld - (cdist - R) * (cdist - R)) / (2 * r * ld))) || 0.9;
      rel = Math.max(0.5, Math.min(1.4, PI / 2 - PI / n + 0.25));
      ctx.beginPath(); ctx.arc(dx, cy, ld, phi + rel, phi - rel + 2 * PI, false);
      ctx.quadraticCurveTo(dx + 0.25 * ld * Math.cos(phi), cy + 0.25 * ld * Math.sin(phi), dx + ld * Math.cos(phi + rel), cy + ld * Math.sin(phi + rel));
      ctx.fillStyle = 'rgba(234,122,31,.18)'; ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.stroke();
      var px = dx + r * Math.cos(phi), py = cy + r * Math.sin(phi);
      ctx.strokeStyle = gold; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx, cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, Math.max(4, hw * 0.8), 0, 2 * PI); ctx.fillStyle = gold; ctx.fill();
      ctx.beginPath(); ctx.arc(dx, cy, 6, 0, 2 * PI); ctx.fillStyle = ink; ctx.fill();
      ctx.fillStyle = w.engaged ? acc : col('--muted', '#666'); ctx.textAlign = 'center'; ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.fillText(w.engaged ? 'INDEXING: wheel turns' : 'DWELL: wheel locked', cx - cdist / 2, cy + R + 26);
      ctx.font = '12px Inter, system-ui, sans-serif';
      return w;
    }
    function redraw() {
      var n = +ns.value, f = fit(c), ctx = f.ctx, wide = f.w >= 640;
      var size = wide ? Math.min(0.16 * f.w, 125) : Math.min(f.w * 0.36, 150);
      var cx = wide ? 0.04 * f.w + size * 1.9 : f.w / 2 + size * 0.5, cy = wide ? f.h / 2 - 6 : size * 1.15;
      var w = drawMech(ctx, cx, cy, size, n);
      // plot of wheel angle against driver angle over one turn
      var xs = [], ys = [], beta = PI / 2 - PI / n;
      for (var k = 0; k <= 360; k++) { var a = -PI + 2 * PI * k / 360; xs.push(a * 180 / PI); ys.push(-wheelAngle(a, n).psi * 180 / PI); }
      var rel = w.rel, box = wide ? { x: 0.54 * f.w, y: 20, w: 0.46 * f.w - 4, h: f.h - 30 } : { x: 0, y: size * 2.5, w: f.w, h: f.h - size * 2.5 - 4 };
      plot(ctx, box, [{ x: xs, y: ys, color: col('--accent', '#0077b6'), name: 'wheel angle', dot: [rel * 180 / PI, -wheelAngle(rel, n).psi * 180 / PI] }], { xmin: -180, xmax: 180, ymin: -240 / n, ymax: 240 / n, nx: 6, ny: 4, xlabel: 'driver angle from the line of centres (°)', ylabel: 'wheel angle (°)', yfmt: function (v) { return Math.round(v); }, xfmt: function (v) { return Math.round(v); } });
      var idx = 180 - 360 / n;
      info.textContent = 'n = ' + n + ' slots  ·  wheel turns ' + (360 / n).toFixed(1) + '° per index  ·  index: ' + idx.toFixed(0) + '° of the driver turn (' + (idx / 3.6).toFixed(1) + ' %)  ·  dwell: ' + (360 - idx).toFixed(0) + '°  ·  at ' + sp.value + ' rpm one cycle takes ' + (60 / sp.value).toFixed(2) + ' s, dwell ' + ((360 - idx) / 360 * 60 / sp.value).toFixed(2) + ' s';
    }
    function loop(t) {
      if (!playing) return;
      if (t && last) phi += (t - last) / 1000 * (+sp.value) * 2 * PI / 60;
      last = t || 0; redraw();
      if (root.isConnected) requestAnimationFrame(loop);
    }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { playing = false; pb.textContent = 'Play'; redraw(); } else requestAnimationFrame(loop);
    redraws.push(redraw);
  };

  /* 2. One machine with a buffer: discrete event simulation ------------------------- */
  SIMS.station = function (root) {
    root.appendChild(el('h3', {}, 'Discrete event simulation: one machine and its buffer'));
    root.appendChild(el('p', { 'class': 'desc' }, 'Parts arrive at random (on average every 1/λ minutes) and wait in a buffer of limited size. The machine takes a random time (mean 1/μ) per part and sometimes breaks down. The state only changes at events, so the plot is a staircase. Press “New random run” to see how much one run can differ from the next.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var lam = slider(box, 'Arrival rate λ', 0.2, 1.5, 0.05, 0.8, ' parts/min', run);
    var mu = slider(box, 'Service rate μ', 0.4, 2, 0.05, 1, ' parts/min', run);
    var cap = slider(box, 'Buffer size K', 1, 20, 1, 8, ' parts', run);
    var mtbf = slider(box, 'Mean time between failures', 30, 600, 10, 120, ' min', run);
    var mttr = slider(box, 'Mean repair time', 0, 30, 1, 8, ' min', run);
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var seed = 7; button(btns, 'New random run', function () { seed = (seed * 9301 + 49297) % 233280; run(); });
    var c = canvas(root, function (w) { return w < 640 ? 330 : 340; });
    var info = el('div', { 'class': 'readout', style: 'white-space:pre-wrap' }); root.appendChild(info);
    var last;
    function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function run() {
      var R = rng(seed), ex = function (m) { return -Math.log(1 - R()) * m; };
      var Tend = 480, t = 0, n = 0, K = +cap.value, up = true, busy = false;
      var nextA = ex(1 / +lam.value), nextD = Infinity, nextF = +mttr.value > 0 ? ex(+mtbf.value) : Infinity, nextR = Infinity, remain = 0;
      var tx = [0], ny = [0], done = 0, lost = 0, busyT = 0, downT = 0, area = 0, downs = [];
      while (true) {
        var tn = Math.min(nextA, nextD, nextF, nextR, Tend);
        area += n * (tn - t); if (busy && up) busyT += tn - t; if (!up) downT += tn - t;
        t = tn; if (t >= Tend) break;
        if (t === nextA) { if (n < K + 1) { n++; if (!busy && up) { busy = true; nextD = t + ex(1 / +mu.value); } } else lost++; nextA = t + ex(1 / +lam.value); }
        else if (t === nextD) { n--; done++; busy = false; nextD = Infinity; if (n > 0) { busy = true; nextD = t + ex(1 / +mu.value); } }
        else if (t === nextF) { up = false; downs.push([t, 0]); if (busy) { remain = nextD - t; nextD = Infinity; } nextF = Infinity; nextR = t + ex(+mttr.value); }
        else if (t === nextR) { up = true; downs[downs.length - 1][1] = t; nextR = Infinity; nextF = t + ex(+mtbf.value); if (busy) nextD = t + remain; else if (n > 0) { busy = true; nextD = t + ex(1 / +mu.value); } }
        tx.push(t); ny.push(n);
      }
      if (downs.length && !downs[downs.length - 1][1]) downs[downs.length - 1][1] = Tend;
      tx.push(Tend); ny.push(n);
      last = { tx: tx, ny: ny, downs: downs, K: K };
      draw();
      var rho = +lam.value / +mu.value;
      info.textContent = 'Over an 8-hour shift (480 min): ' + done + ' parts finished (' + (done / 8).toFixed(1) + ' per hour), ' + lost + ' arrivals turned away because the buffer was full.\n' +
        'Machine busy ' + (100 * busyT / Tend).toFixed(0) + ' % of the time, broken down ' + (100 * downT / Tend).toFixed(0) + ' %.  Average parts in the system: ' + (area / Tend).toFixed(2) + '.\n' +
        'Utilisation ρ = λ/μ = ' + rho.toFixed(2) + (rho < 1 ? '. Queueing theory (M/M/1, endless buffer, no failures) predicts L = ρ/(1 − ρ) = ' + (rho / (1 - rho)).toFixed(2) + ' parts.' : '. With ρ ≥ 1 the machine cannot keep up: the buffer fills and parts are lost.');
    }
    function draw() {
      if (!last) return;
      var f = fit(c), ctx = f.ctx, top = last.K + 1;
      var p = plot(ctx, { x: 0, y: 0, w: f.w, h: f.h }, [], { xmin: 0, xmax: 480, ymin: 0, ymax: top, nx: 8, ny: Math.min(top, 7), xlabel: 'time (min)', ylabel: 'parts at the station', yfmt: function (v) { return Math.round(v); }, xfmt: function (v) { return Math.round(v); } });
      ctx.fillStyle = 'rgba(234,122,31,.22)';
      last.downs.forEach(function (d) { ctx.fillRect(p.X(d[0]), p.Y(top), p.X(d[1]) - p.X(d[0]), p.Y(0) - p.Y(top)); });
      plot(ctx, { x: 0, y: 0, w: f.w, h: f.h }, [{ x: last.tx, y: last.ny, color: col('--accent', '#0077b6'), width: 1.8, step: true, name: 'parts in buffer + machine' }, { x: [0, 480], y: [top, top], color: col('--signal', '#db2777'), dash: [6, 4], width: 1.4, name: 'full (K + 1)' }, { x: [0, 0], y: [0, 0], color: 'rgba(234,122,31,.6)', width: 6, name: 'machine down' }], { xmin: 0, xmax: 480, ymin: 0, ymax: top, nx: 8, ny: Math.min(top, 7), xlabel: '', ylabel: '', yfmt: function () { return ''; }, xfmt: function () { return ''; } });
    }
    run(); redraws.push(draw);
  };

  /* 3. Robot investment: pay-back and rate of return -------------------------------- */
  SIMS.payback = function (root) {
    root.appendChild(el('h3', {}, 'Is the robot worth buying? Pay-back period and rate of return'));
    root.appendChild(el('p', { 'class': 'desc' }, 'The default numbers are the worked example in the notes (money in Rs). Change any value; the steps of the calculation and the yearly cash position update at once.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var I = {
      robot: numbox(box, 'Robot + accessories', 1200000, 10000, calc), inst: numbox(box, 'Installation cost', 300000, 10000, calc),
      lab: numbox(box, 'Labour saving per hour', 100, 1, calc), mat: numbox(box, 'Material saving per hour', 15, 1, calc),
      om: numbox(box, 'Operating + maintenance per hour', 20, 1, calc), hpd: numbox(box, 'Hours per day', 24, 1, calc),
      dpy: numbox(box, 'Working days per year', 200, 1, calc), tax: numbox(box, 'Tax rate (%)', 30, 1, calc),
      life: numbox(box, 'Techno-economic life (years)', 6, 1, calc), bank: numbox(box, 'Bank interest rate (%)', 10, 0.5, calc)
    };
    var c = canvas(root, function (w) { return w < 640 ? 300 : 300; });
    var info = el('div', { 'class': 'readout', style: 'white-space:pre-wrap;font-family:var(--mono, monospace);font-size:13px' }); root.appendChild(info);
    var res;
    function v(k) { var x = parseFloat(I[k].value); return isFinite(x) ? x : 0; }
    function money(x) { return 'Rs ' + Math.round(x).toLocaleString('en-IN'); }
    function calc() {
      var F = v('robot') + v('inst'), hrs = v('hpd') * v('dpy'), B = (v('lab') + v('mat')) * hrs, C = v('om') * hrs, life = Math.max(1, v('life')), D = F / life;
      var A = B - C - D, G = Math.max(0, A) * v('tax') / 100, Inet = A - G, E = (B - C - G) > 0 ? F / (B - C - G) : Infinity, H = Inet / F * 100;
      res = { F: F, cash: B - C - G, life: life, E: E };
      var ok = E < life && H > v('bank');
      info.textContent =
        'Capital investment      F = ' + money(F) + '\n' +
        'Running hours per year      = ' + hrs.toLocaleString('en-IN') + ' h\n' +
        'Savings per year        B = ' + money(B) + '\n' +
        'Operating cost per year C = ' + money(C) + '\n' +
        'Depreciation per year   D = F / life = ' + money(D) + '\n' +
        'Net savings             A = B − C − D = ' + money(A) + '\n' +
        'Tax on net savings      G = ' + v('tax') + ' % of A = ' + money(G) + '\n' +
        'Pay-back period         E = F / (B − C − G) = ' + (isFinite(E) ? E.toFixed(2) + ' years' : 'never') + '  (life ' + life + ' years)\n' +
        'Rate of return          H = (A − G) / F = ' + H.toFixed(2) + ' %  (bank ' + v('bank') + ' %)\n' +
        (ok ? '→ Buy: it pays back within its life and earns more than the bank rate.' : '→ Not justified on these numbers: ' + (E >= life ? 'pay-back is longer than the robot\'s life. ' : '') + (H <= v('bank') ? 'the return is below the bank rate.' : ''));
      draw();
    }
    function draw() {
      if (!res) return;
      var f = fit(c), ctx = f.ctx, yrs = Math.max(res.life, Math.min(15, isFinite(res.E) ? Math.ceil(res.E) + 1 : res.life)), xs = [], ys = [];
      for (var k = 0; k <= yrs * 4; k++) { xs.push(k / 4); ys.push((-res.F + res.cash * k / 4) / 1e5); }
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys.concat([1]));
      var series = [{ x: xs, y: ys, color: col('--accent', '#0077b6'), name: 'cumulative cash position (lakh Rs)' }, { x: [0, yrs], y: [0, 0], color: col('--muted', '#666'), width: 1.2, dash: [5, 4] }, { x: [res.life, res.life], y: [lo, hi], color: col('--gold', '#ea7a1f'), width: 1.6, dash: [6, 4], name: 'end of robot life' }];
      if (isFinite(res.E) && res.E <= yrs) series.push({ x: [res.E], y: [0], color: col('--signal', '#db2777'), dot: [res.E, 0], name: 'pay-back' });
      plot(ctx, { x: 0, y: 0, w: f.w, h: f.h }, series, { xmin: 0, xmax: yrs, ymin: lo, ymax: hi, nx: Math.min(yrs, 8), ny: 4, xlabel: 'years after purchase', ylabel: 'lakh Rs', yfmt: function (v) { return v.toFixed(1); }, xfmt: function (v) { return +v.toFixed(1); } });
    }
    calc(); redraws.push(draw);
  };

  /* 4. Two-link planar arm --------------------------------------------------------- */
  SIMS.arm2r = function (root) {
    root.appendChild(el('h3', {}, 'Two-link planar arm: forward and inverse kinematics'));
    root.appendChild(el('p', { 'class': 'desc' }, '<b>Forward:</b> move the joint sliders and read the tip position. <b>Inverse:</b> click or drag inside the shaded workspace to place the target; the joint angles are solved for you, with the other (mirror) solution drawn faintly.'));
    var box = el('div', { 'class': 'controls' }); root.appendChild(box);
    var a1 = slider(box, 'Link length a₁', 0.2, 1.5, 0.05, 1, ' m', draw);
    var a2 = slider(box, 'Link length a₂', 0.2, 1.5, 0.05, 0.5, ' m', draw);
    var t1 = slider(box, 'Joint angle θ₁', -180, 180, 1, 30, '°', function () { mode = 'fk'; draw(); });
    var t2 = slider(box, 'Joint angle θ₂', -180, 180, 1, 60, '°', function () { mode = 'fk'; draw(); });
    var btns = el('div', { 'class': 'btns' }); root.appendChild(btns);
    var mode = 'fk', elbow = 1, target = null;
    var eb = button(btns, 'Elbow: up (θ₂ > 0)', function () { elbow = -elbow; eb.textContent = elbow > 0 ? 'Elbow: up (θ₂ > 0)' : 'Elbow: down (θ₂ < 0)'; if (target) solve(target[0], target[1]); draw(); });
    button(btns, 'Reset to the example (30°, 60°)', function () { a1.set(1); a2.set(0.5); t1.set(30); t2.set(60); mode = 'fk'; target = null; draw(); });
    var c = canvas(root, function (w) { return w < 640 ? Math.max(340, w * 0.95) : 420; });
    c.style.touchAction = 'none'; c.style.cursor = 'crosshair';
    var info = el('div', { 'class': 'readout', style: 'white-space:pre-wrap;font-family:var(--mono, monospace);font-size:13px' }); root.appendChild(info);
    var view = null, alt = null, reach = true;
    function solve(x, y) {
      var A1 = +a1.value, A2 = +a2.value, r2 = x * x + y * y, cth = (r2 - A1 * A1 - A2 * A2) / (2 * A1 * A2);
      reach = Math.abs(cth) <= 1;
      if (!reach) { var r = Math.sqrt(r2), rr = Math.max(Math.abs(A1 - A2) + 1e-6, Math.min(A1 + A2 - 1e-6, r)); x *= rr / r; y *= rr / r; r2 = rr * rr; cth = (r2 - A1 * A1 - A2 * A2) / (2 * A1 * A2); }
      cth = Math.max(-1, Math.min(1, cth));
      function sol(sg) { var q2 = sg * Math.acos(cth), q1 = Math.atan2(y, x) - Math.atan2(A2 * Math.sin(q2), A1 + A2 * Math.cos(q2)); q1 = Math.atan2(Math.sin(q1), Math.cos(q1)); return [q1 * 180 / PI, q2 * 180 / PI]; }
      var s1 = sol(elbow), s2 = sol(-elbow);
      t1.set(Math.round(s1[0])); t2.set(Math.round(s1[1])); alt = s2;
      // keep the exact solution for drawing
      t1._exact = s1[0]; t2._exact = s1[1];
    }
    function pointer(e) {
      if (!view) return; var rc = c.getBoundingClientRect(), px = e.clientX - rc.left, py = e.clientY - rc.top;
      var x = (px - view.ox) / view.sc, y = (view.oy - py) / view.sc; target = [x, y]; mode = 'ik'; solve(x, y); draw();
    }
    var down = false;
    c.addEventListener('pointerdown', function (e) { down = true; c.setPointerCapture(e.pointerId); pointer(e); });
    c.addEventListener('pointermove', function (e) { if (down) pointer(e); });
    c.addEventListener('pointerup', function () { down = false; });
    function draw() {
      var f = fit(c), ctx = f.ctx, A1 = +a1.value, A2 = +a2.value, Rm = A1 + A2;
      var sc = Math.min(f.w, f.h) / (2 * Rm + 0.5), ox = f.w / 2, oy = f.h / 2;
      view = { sc: sc, ox: ox, oy: oy };
      function P(x, y) { return [ox + x * sc, oy - y * sc]; }
      var ink = col('--ink', '#111'), mut = col('--muted', '#666'), acc = col('--accent', '#0077b6'), gold = col('--gold', '#ea7a1f'), sig = col('--signal', '#db2777');
      // workspace annulus
      ctx.beginPath(); ctx.arc(ox, oy, Rm * sc, 0, 2 * PI); ctx.arc(ox, oy, Math.abs(A1 - A2) * sc, 0, 2 * PI, true);
      ctx.fillStyle = 'rgba(0,119,182,.09)'; ctx.fill('evenodd'); ctx.strokeStyle = 'rgba(0,119,182,.45)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
      // axes and grid ticks
      ctx.strokeStyle = mut; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, oy); ctx.lineTo(f.w - 8, oy); ctx.moveTo(ox, 8); ctx.lineTo(ox, f.h - 8); ctx.stroke();
      ctx.fillStyle = mut; ctx.textAlign = 'left'; ctx.fillText('x₀', f.w - 22, oy - 6); ctx.fillText('y₀', ox + 6, 18);
      for (var m = -Math.floor(Rm); m <= Math.floor(Rm); m++) { if (!m) continue; var q = P(m, 0); ctx.fillRect(q[0] - 0.5, oy - 4, 1, 8); ctx.textAlign = 'center'; ctx.fillText(m + ' m', q[0], oy + 16); }
      var q1 = (t1._exact != null && mode === 'ik' ? t1._exact : +t1.value) * PI / 180, q2 = (t2._exact != null && mode === 'ik' ? t2._exact : +t2.value) * PI / 180;
      if (mode === 'fk') { t1._exact = t2._exact = null; alt = null; target = null; }
      function arm(q1, q2, faint) {
        var e = [A1 * Math.cos(q1), A1 * Math.sin(q1)], tp = [e[0] + A2 * Math.cos(q1 + q2), e[1] + A2 * Math.sin(q1 + q2)];
        var p0 = P(0, 0), p1 = P(e[0], e[1]), p2 = P(tp[0], tp[1]);
        ctx.globalAlpha = faint ? 0.28 : 1;
        ctx.lineWidth = faint ? 5 : 9; ctx.strokeStyle = acc; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
        ctx.lineWidth = faint ? 4 : 7; ctx.strokeStyle = gold; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
        [p0, p1].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], faint ? 5 : 7, 0, 2 * PI); ctx.fillStyle = col('--surface', '#fff'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ink; ctx.stroke(); });
        ctx.beginPath(); ctx.arc(p2[0], p2[1], 5, 0, 2 * PI); ctx.fillStyle = ink; ctx.fill();
        ctx.globalAlpha = 1; return { e: e, tp: tp, p1: p1, p2: p2 };
      }
      if (alt && mode === 'ik') arm(alt[0] * PI / 180, alt[1] * PI / 180, true);
      var r = arm(q1, q2, false);
      // angle arcs
      ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(ox, oy, 28, 0, -q1, q1 > 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(r.p1[0], r.p1[1], 24, -q1, -(q1 + q2), q2 > 0); ctx.stroke();
      if (target) { var tg = P(target[0], target[1]); ctx.strokeStyle = sig; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tg[0] - 7, tg[1] - 7); ctx.lineTo(tg[0] + 7, tg[1] + 7); ctx.moveTo(tg[0] + 7, tg[1] - 7); ctx.lineTo(tg[0] - 7, tg[1] + 7); ctx.stroke(); }
      var x = r.tp[0], y = r.tp[1], c12 = Math.cos(q1 + q2), s12 = Math.sin(q1 + q2);
      function n(v) { var s = v.toFixed(3); return (v >= 0 ? ' ' : '') + (s === '-0.000' ? ' 0.000' : s); }
      info.textContent = (mode === 'ik' ? (reach ? 'Inverse kinematics: target reached. ' : 'Target outside the workspace: the arm stretches towards it. ') + 'Other solution: θ₁ = ' + alt[0].toFixed(1) + '°, θ₂ = ' + alt[1].toFixed(1) + '°\n' : 'Forward kinematics.\n') +
        'θ₁ = ' + (q1 * 180 / PI).toFixed(1) + '°, θ₂ = ' + (q2 * 180 / PI).toFixed(1) + '°   →   tip x = ' + x.toFixed(3) + ' m, y = ' + y.toFixed(3) + ' m, reach r = ' + Math.hypot(x, y).toFixed(3) + ' m\n' +
        'T = A₁A₂ = [' + n(c12) + ' ' + n(-s12) + '  0 ' + n(x) + ' ]\n' +
        '           [' + n(s12) + ' ' + n(c12) + '  0 ' + n(y) + ' ]\n' +
        '           [  0.000   0.000  1  0.000 ]\n' +
        '           [  0.000   0.000  0  1.000 ]\n' +
        'Workspace: ' + Math.abs(A1 - A2).toFixed(2) + ' m ≤ r ≤ ' + (A1 + A2).toFixed(2) + ' m';
    }
    draw(); redraws.push(draw);
  };

  document.querySelectorAll('.sim[data-rsim]').forEach(function (root) {
    var f = SIMS[root.getAttribute('data-rsim')];
    if (f) f(root); else root.textContent = 'Unknown simulation: ' + root.getAttribute('data-rsim');
  });
})();
