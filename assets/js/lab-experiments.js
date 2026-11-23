/* Control System Engineering Laboratory (EEE2563): interactive experiments
   ---------------------------------------------------------------
   Every <div class="labsim" data-lab="exp1"></div> on the page becomes a
   simulation with sliders, a results box and one or more Plotly plots.
   The maths runs here in the browser, so students need nothing installed.
   Each experiment is one entry in LAB below:
     params  : the sliders (or number boxes)
     presets : quick buttons that set several sliders at once
     run(p)  : returns { readout, plots: [{data, layout}], table, code }
*/
(function () {
  var root = document.documentElement;
  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function f(x, d) { if (!isFinite(x)) return '–'; var s = (+x).toFixed(d); return s === '-0' || /^-0\.0*$/.test(s) ? s.slice(1) : s; }
  function sig(x, n) { if (!isFinite(x)) return '–'; if (x === 0) return '0'; var d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(Math.abs(x)))); return f(x, Math.min(d, 6)); }
  // engineering notation: 0.00012 s -> "120 µs"
  function eng(x, unit, n) {
    if (!isFinite(x)) return '–'; if (x === 0) return '0 ' + unit;
    var P = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']], a = Math.abs(x);
    for (var i = 0; i < P.length; i++) if (a >= P[i][0] * 0.9995) return sig(x / P[i][0], n || 3) + ' ' + P[i][1] + unit;
    return sig(x / 1e-9, n || 3) + ' n' + unit;
  }
  var PI = Math.PI, DEG = 180 / PI;

  /* ---------- small maths toolkit ---------- */
  function padTo(p, n) { while (p.length < n) p = [0].concat(p); return p; }
  function trim(p) { while (p.length > 1 && Math.abs(p[0]) < 1e-14) p = p.slice(1); return p; }
  function polyAdd(a, b) { var n = Math.max(a.length, b.length); a = padTo(a.slice(), n); b = padTo(b.slice(), n); return a.map(function (v, i) { return v + b[i]; }); }
  function polyMul(a, b) { var r = new Array(a.length + b.length - 1).fill(0); a.forEach(function (x, i) { b.forEach(function (y, j) { r[i + j] += x * y; }); }); return r; }
  function polyScale(a, k) { return a.map(function (v) { return v * k; }); }

  // all roots of a polynomial (Durand–Kerner), returns [[re, im], ...]
  function roots(p) {
    p = trim(p.slice()); var n = p.length - 1; if (n < 1) return [];
    var a = p.map(function (v) { return v / p[0]; });
    var R = 1 + Math.max.apply(null, a.slice(1).map(Math.abs)), z = [];
    for (var i = 0; i < n; i++) z.push([R * Math.cos(2 * PI * i / n + 0.4), R * Math.sin(2 * PI * i / n + 0.4)]);
    function cmul(x, y) { return [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]]; }
    function cdiv(x, y) { var d = y[0] * y[0] + y[1] * y[1] || 1e-300; return [(x[0] * y[0] + x[1] * y[1]) / d, (x[1] * y[0] - x[0] * y[1]) / d]; }
    for (var it = 0; it < 800; it++) {
      var moved = 0;
      for (i = 0; i < n; i++) {
        var v = [1, 0]; for (var k = 1; k <= n; k++) v = [v[0] * z[i][0] - v[1] * z[i][1] + a[k], v[0] * z[i][1] + v[1] * z[i][0]];
        var d = [1, 0]; for (var j = 0; j < n; j++) if (j !== i) d = cmul(d, [z[i][0] - z[j][0], z[i][1] - z[j][1]]);
        var dz = cdiv(v, d); z[i] = [z[i][0] - dz[0], z[i][1] - dz[1]]; moved = Math.max(moved, Math.abs(dz[0]) + Math.abs(dz[1]));
      }
      if (moved < 1e-13 * R) break;
    }
    return z.map(function (c) { return [c[0], Math.abs(c[1]) < 1e-6 * R ? 0 : c[1]]; });
  }
  function isStable(rs) { return rs.every(function (r) { return r[0] < -1e-9; }); }
  function nice(x) { return isFinite(x) ? String(parseFloat(sig(x, 4))) : '–'; }
  function fmtRoot(r) { var re = nice(r[0]); if (!r[1]) return re; return re + (r[1] < 0 ? ' − j' : ' + j') + nice(Math.abs(r[1])); }

  // generic ODE integrator (RK4). deriv(x, t) -> dx/dt; returns samples every 'every' steps
  function rk4(deriv, x0, h, tEnd, every, outFn) {
    var x = x0.slice(), n = Math.round(tEnd / h), res = [];
    for (var k = 0; k <= n; k++) {
      var t = k * h;
      if (k % every === 0) res.push(outFn(x, t));
      var k1 = deriv(x, t), x2 = x.map(function (v, i) { return v + h / 2 * k1[i]; }), k2 = deriv(x2, t + h / 2),
        x3 = x.map(function (v, i) { return v + h / 2 * k2[i]; }), k3 = deriv(x3, t + h / 2),
        x4 = x.map(function (v, i) { return v + h * k3[i]; }), k4 = deriv(x4, t + h);
      x = x.map(function (v, i) { return v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
      if (!isFinite(x[0]) || Math.abs(x[0]) > 1e9) x = x.map(function () { return NaN; });
    }
    return res;
  }

  // unit-step response of num(s)/den(s), sampled at t = 0, dt, ..., tEnd
  function stepTF(num, den, tEnd, dt) {
    den = trim(den.slice()); var n = den.length - 1, a0 = den[0];
    den = den.map(function (v) { return v / a0; }); num = padTo(trim(num.slice()).map(function (v) { return v / a0; }), n + 1);
    var D = num[0], b = num.map(function (v, i) { return v - D * den[i]; });
    // pick an internal step small enough for the fastest pole
    var fast = roots(den).reduce(function (m, r) { return Math.max(m, Math.hypot(r[0], r[1])); }, 1e-9);
    var sub = Math.max(4, Math.ceil(dt * fast / 0.5)), h = dt / sub;
    function deriv(x) { var dx = new Array(n); for (var i = 0; i < n - 1; i++) dx[i] = x[i + 1]; var s = 1; for (i = 0; i < n; i++) s -= den[n - i] * x[i]; dx[n - 1] = s; return dx; }
    var res = rk4(deriv, new Array(n).fill(0), h, tEnd, sub, function (x, t) { var s = D; for (var i = 0; i < n; i++) s += b[n - i] * x[i]; return [t, s]; });
    return { t: res.map(function (r) { return r[0]; }), y: res.map(function (r) { return r[1]; }) };
  }
  function range(a, b, dt) { var r = []; for (var v = a; v <= b + 1e-12; v += dt) r.push(v); return r; }
  function logspace(a, b, n) { var r = []; for (var i = 0; i < n; i++) r.push(Math.pow(10, a + (b - a) * i / (n - 1))); return r; }
  function linInterp(t, y, i, level) { var t0 = t[i - 1], t1 = t[i], y0 = y[i - 1], y1 = y[i]; return y1 === y0 ? t1 : t0 + (level - y0) * (t1 - t0) / (y1 - y0); }
  function crossTime(t, y, level) { for (var i = 1; i < y.length; i++) if ((y[i - 1] - level) * (y[i] - level) <= 0 && y[i] !== y[i - 1]) return linInterp(t, y, i, level); return NaN; }

  // time-domain specifications measured from a step response (final value yss)
  function specs(t, y, yss, band) {
    band = band || 0.02;
    var s = { yss: yss };
    if (!isFinite(yss) || Math.abs(yss) < 1e-12 || y.some(function (v) { return !isFinite(v); })) return null;
    var yn = y.map(function (v) { return v / yss; });
    s.td = crossTime(t, yn, 0.5);
    s.tr1090 = crossTime(t, yn, 0.9) - crossTime(t, yn, 0.1);
    s.tr595 = crossTime(t, yn, 0.95) - crossTime(t, yn, 0.05);
    s.tr0100 = crossTime(t, yn, 1);
    var ip = 0; for (var i = 1; i < yn.length; i++) if (yn[i] > yn[ip]) ip = i;
    s.peak = y[ip]; s.tp = t[ip]; s.Mp = Math.max(0, (yn[ip] - 1) * 100);
    if (s.Mp < 0.05 || ip === yn.length - 1) { s.tp = NaN; s.Mp = Math.max(0, s.Mp); if (ip === yn.length - 1) s.Mp = 0; }
    var last = -1; for (i = 0; i < yn.length; i++) if (Math.abs(yn[i] - 1) > band) last = i;
    s.ts = last === yn.length - 1 ? NaN : (last < 0 ? 0 : t[Math.min(last + 1, t.length - 1)]);
    return s;
  }

  // analytic step response of the standard second-order system
  function step2(wn, z, t) {
    if (Math.abs(z - 1) < 1e-4) return 1 - Math.exp(-wn * t) * (1 + wn * t);
    if (z < 1) { var wd = wn * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + z / Math.sqrt(1 - z * z) * Math.sin(wd * t)); }
    var r = Math.sqrt(z * z - 1), s1 = -wn * (z - r), s2 = -wn * (z + r);
    return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
  }
  function dampingName(z) { return z < 1e-6 ? 'undamped' : Math.abs(z - 1) < 0.005 ? 'critically damped' : z < 1 ? 'underdamped' : 'overdamped'; }

  // complex numbers as [re, im]
  function C(re, im) { return [re, im || 0]; }
  function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function cinv(a) { return cdiv([1, 0], a); }
  function cabs(a) { return Math.hypot(a[0], a[1]); }
  function carg(a) { return Math.atan2(a[1], a[0]); }

  /* ---------- Plotly look (follows the site's light / dark theme) ---------- */
  function colors() { return { a: css('--accent') || '#4f46e5', b: '#db2777', c: css('--gold') || '#0ea5e9', g: '#16a34a', o: '#ea580c', m: css('--muted') || '#64748b', ink: css('--ink') || '#0f172a', grid: css('--plotgrid') || 'rgba(128,128,128,.2)' }; }
  function ax(o) { var c = colors(); return Object.assign({ gridcolor: c.grid, zerolinecolor: c.grid, linecolor: c.grid, automargin: true }, o || {}); }
  function phone() { return window.innerWidth < 640; }
  function layout(o) {
    var c = colors();
    return Object.assign({
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter, system-ui, sans-serif', color: c.ink, size: 12.5 },
      margin: { l: 58, r: 14, t: 38, b: 40 }, showlegend: true,
      legend: { orientation: 'h', x: 0, y: -0.2, yanchor: 'top', bgcolor: 'rgba(0,0,0,0)' },
      hoverlabel: { font: { family: 'JetBrains Mono, monospace', size: 12 } }, height: phone() ? 340 : 380
    }, o);
  }
  var CONFIG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] };
  function line(x, y, name, color, extra) { return Object.assign({ x: x, y: y, name: name, type: 'scatter', mode: 'lines', line: { color: color, width: 2.5 } }, extra || {}); }
  function hline(x0, x1, y, name, color, dash, extra) { return Object.assign({ x: [x0, x1], y: [y, y], name: name, type: 'scatter', mode: 'lines', line: { color: color, width: 1.3, dash: dash || 'dash' }, hoverinfo: 'skip' }, extra || {}); }
  function vline(x, y0, y1, name, color, dash, extra) { return Object.assign({ x: [x, x], y: [y0, y1], name: name, type: 'scatter', mode: 'lines', line: { color: color, width: 1.3, dash: dash || 'dot' }, hoverinfo: 'skip' }, extra || {}); }
  function title(t) { return { text: t, font: { size: 14 } }; }

  // table helper: rows = [[label, v1, v2...]]
  function table(head, rows, cls) {
    return '<div class="lab-table' + (cls ? ' ' + cls : '') + '"><table><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i ? '<td>' + c + '</td>' : '<th scope="row">' + c + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function kv(pairs) { return pairs.map(function (p) { return '<span><b>' + p[0] + '</b> ' + p[1] + '</span>'; }).join(''); }
  function sec(x) { return isFinite(x) ? eng(x, 's') : '–'; }
  function pct(x) { return isFinite(x) ? f(x, 1) + ' %' : '–'; }

  var LAB = {};

  /* ===== Experiment 1: time response of a series RLC circuit ===== */
  LAB.exp1 = {
    params: [
      { name: 'R', label: 'resistance R', unit: 'Ω', min: 20, max: 10000, val: 200, log: true },
      { name: 'L', label: 'inductance L', unit: 'mH', min: 10, max: 500, val: 100, log: true },
      { name: 'C', label: 'capacitance C', unit: 'µF', min: 0.01, max: 1, val: 0.1, log: true }
    ],
    presets: [
      { label: 'Underdamped (ζ = 0.1)', set: { R: 200, L: 100, C: 0.1 } },
      { label: 'Critically damped (ζ = 1)', set: { R: 2000, L: 100, C: 0.1 } },
      { label: 'Overdamped (ζ = 2)', set: { R: 4000, L: 100, C: 0.1 } }
    ],
    run: function (p) {
      var c = colors(), L = p.L * 1e-3, Cc = p.C * 1e-6, R = p.R;
      var wn = 1 / Math.sqrt(L * Cc), z = R / 2 * Math.sqrt(Cc / L), tau = 1 / (z * wn);
      var slow = z < 1 ? z * wn : wn * (z - Math.sqrt(z * z - 1));
      var tEnd = Math.min(Math.max(6 / slow, 8 / wn), 80 / wn), n = 1200, dt = tEnd / n;
      var t = range(0, tEnd, dt), y = t.map(function (x) { return step2(wn, z, x); }), tm = t.map(function (x) { return x * 1e3; });
      var s = specs(t, y, 1), kind = dampingName(z);
      var tr = z < 0.995 ? s.tr0100 : Math.abs(z - 1) < 0.005 ? s.tr595 : s.tr1090;
      var trLabel = z < 0.995 ? 'Rise time t<sub>r</sub> (0–100 %)' : Math.abs(z - 1) < 0.005 ? 'Rise time t<sub>r</sub> (5–95 %)' : 'Rise time t<sub>r</sub> (10–90 %)';
      var th = {};
      if (z < 1) {
        var wd = wn * Math.sqrt(1 - z * z), phi = Math.acos(z);
        th = { td: (1 + 0.7 * z) / wn, tr: (PI - phi) / wd, tp: PI / wd, Mp: 100 * Math.exp(-z * PI / Math.sqrt(1 - z * z)), ts: 4 / (z * wn) };
      }
      var fsq = 1 / (2 * 5 * tau);
      var rows = [
        ['Delay time t<sub>d</sub>', z < 1 ? sec(th.td) + ' <small>(≈)</small>' : '–', sec(s.td)],
        [trLabel, z < 1 ? sec(th.tr) : '–', sec(tr)],
        ['Peak time t<sub>p</sub>', z < 1 ? sec(th.tp) : '–', sec(s.tp)],
        ['Peak overshoot M<sub>p</sub>', z < 1 ? pct(th.Mp) : '0 %', pct(s.Mp)],
        ['Settling time t<sub>s</sub> (2 %)', z < 1 ? sec(th.ts) + ' <small>(≈ 4τ)</small>' : '–', sec(s.ts)]
      ];
      var data = [
        line([0, tm[tm.length - 1]], [1, 1], 'input step (1 V)', c.m, { line: { color: c.m, width: 1.5, dash: 'dash' } }),
        hline(0, tm[tm.length - 1], 1.02, '±2 % band', c.c, 'dot'), hline(0, tm[tm.length - 1], 0.98, '', c.c, 'dot', { showlegend: false }),
        line(tm, y, 'v₀(t) across C', c.a)
      ];
      if (isFinite(s.tp)) data.push({ x: [s.tp * 1e3], y: [s.peak], type: 'scatter', mode: 'markers+text', marker: { color: c.b, size: 9 }, text: ['peak'], textposition: 'top center', name: 'peak', showlegend: false });
      return {
        readout: kv([['ω<sub>n</sub> =', sig(wn, 4) + ' rad/s'], ['ζ =', sig(z, 3) + ' (' + kind + ')'], ['τ = 1/(ζω<sub>n</sub>) =', sec(tau)], ['Use a square wave of at most', eng(fsq, 'Hz') + ' (half period ≥ 5τ)']]),
        plots: [{ data: data, layout: { title: title('Step response of the series RLC circuit'), xaxis: ax({ title: 't (ms)' }), yaxis: ax({ title: 'v₀ (V)', range: [0, Math.max(1.1, s.peak * 1.08 || 1.1)] }) } }],
        table: table(['Specification', 'Theory (formula)', 'From the simulated curve'], rows)
      };
    }
  };

  /* ===== Experiments 2, 3, 4: RC compensating networks ===== */
  function network(kind) {
    var lead = kind === 'lead', lag = kind === 'lag';
    var P = [{ name: 'R1', label: 'R₁', unit: 'kΩ', min: 1, max: 100, val: 15, log: true }];
    if (lag) P.push({ name: 'R2', label: 'R₂', unit: 'Ω', min: 10, max: 5000, val: 100, log: true });
    else P.push({ name: 'R2', label: 'R₂', unit: 'kΩ', min: 0.1, max: 20, val: 1.5, log: true });
    if (kind === 'laglead') { P.push({ name: 'C1', label: 'C₁', unit: 'µF', min: 0.001, max: 0.1, val: 0.01, log: true }); P.push({ name: 'C2', label: 'C₂', unit: 'µF', min: 0.001, max: 0.1, val: 0.01, log: true }); }
    else P.push({ name: 'C', label: 'C', unit: 'µF', min: 0.001, max: 0.1, val: 0.01, log: true });
    P.push({ name: 'f', label: 'test frequency (DSO view)', unit: 'Hz', min: 10, max: 1e6, val: 1000, log: true });
    var manual = lead ? { R1: 15, R2: 1.5, C: 0.01 } : lag ? { R1: 15, R2: 100, C: 0.01 } : { R1: 15, R2: 1.5, C1: 0.01, C2: 0.01 };
    var freqs = kind === 'laglead' ? [10, 20, 50, 100, 200, 500, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6] : [100, 200, 500, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6];
    function H(p, w) {
      var s = C(0, w);
      if (lead) { var R1 = p.R1 * 1e3, R2 = p.R2 * 1e3, Cc = p.C * 1e-6, Z1 = cdiv(C(R1), cadd(C(1), cmul(s, C(R1 * Cc)))); return cdiv(C(R2), cadd(Z1, C(R2))); }
      if (lag) { var r1 = p.R1 * 1e3, r2 = p.R2, cc = p.C * 1e-6, Z2 = cadd(C(r2), cinv(cmul(s, C(cc)))); return cdiv(Z2, cadd(C(r1), Z2)); }
      var a1 = p.R1 * 1e3, a2 = p.R2 * 1e3, c1 = p.C1 * 1e-6, c2 = p.C2 * 1e-6;
      var z1 = cdiv(C(a1), cadd(C(1), cmul(s, C(a1 * c1)))), z2 = cadd(C(a2), cinv(cmul(s, C(c2))));
      return cdiv(z2, cadd(z1, z2));
    }
    return {
      params: P,
      presets: [{ label: 'Manual values', set: Object.assign({ f: 1000 }, manual) }],
      run: function (p) {
        var c = colors(), w = logspace(1, 6.3, 400).map(function (x) { return 2 * PI * x; }), hz = w.map(function (x) { return x / (2 * PI); });
        var mag = [], ph = [];
        w.forEach(function (x) { var h = H(p, x); mag.push(20 * Math.log10(cabs(h))); ph.push(carg(h) * DEG); });
        var hf = H(p, 2 * PI * p.f), gdb = 20 * Math.log10(cabs(hf)), phf = carg(hf) * DEG, dtf = phf / 360 / p.f;
        var info = [];
        if (lead) {
          var R1 = p.R1 * 1e3, R2 = p.R2 * 1e3, T = R1 * p.C * 1e-6, al = R2 / (R1 + R2);
          info = [['α = R₂/(R₁+R₂) =', sig(al, 3)], ['T = R₁C =', sec(T)], ['zero at', eng(1 / (2 * PI * T), 'Hz')], ['pole at', eng(1 / (2 * PI * al * T), 'Hz')],
            ['φ<sub>max</sub> = sin⁻¹((1−α)/(1+α)) =', f(Math.asin((1 - al) / (1 + al)) * DEG, 1) + '°'], ['at f<sub>m</sub> = 1/(2πT√α) =', eng(1 / (2 * PI * T * Math.sqrt(al)), 'Hz')]];
        } else if (lag) {
          var tau = p.R2 * p.C * 1e-6, be = (p.R1 * 1e3 + p.R2) / p.R2;
          info = [['β = (R₁+R₂)/R₂ =', sig(be, 3)], ['τ = R₂C =', sec(tau)], ['pole at 1/(2πβτ) =', eng(1 / (2 * PI * be * tau), 'Hz')], ['zero at 1/(2πτ) =', eng(1 / (2 * PI * tau), 'Hz')],
            ['largest phase lag =', f(Math.asin((be - 1) / (be + 1)) * DEG, 1) + '°'], ['at f<sub>m</sub> = 1/(2πτ√β) =', eng(1 / (2 * PI * tau * Math.sqrt(be)), 'Hz')]];
        } else {
          var A1 = p.R1 * 1e3, A2 = p.R2 * 1e3, C1 = p.C1 * 1e-6, C2 = p.C2 * 1e-6;
          var pr = roots([A1 * C1 * A2 * C2, A1 * C1 + A2 * C2 + A1 * C2, 1]).map(function (r) { return Math.hypot(r[0], r[1]) / (2 * PI); }).sort(function (a, b) { return a - b; });
          var iMin = 0, iMax = 0; ph.forEach(function (v, i) { if (v < ph[iMin]) iMin = i; if (v > ph[iMax]) iMax = i; });
          info = [['zeros at', eng(1 / (2 * PI * A1 * C1), 'Hz') + ' and ' + eng(1 / (2 * PI * A2 * C2), 'Hz')], ['poles at', eng(pr[0], 'Hz') + ' and ' + eng(pr[1], 'Hz')],
            ['largest lag', f(ph[iMin], 1) + '° near ' + eng(hz[iMin], 'Hz')], ['largest lead', '+' + f(ph[iMax], 1) + '° near ' + eng(hz[iMax], 'Hz')]];
        }
        info.push(['At ' + eng(p.f, 'Hz') + ':', f(gdb, 2) + ' dB, ' + f(phf, 1) + '°, Δt = ' + sec(Math.abs(dtf))]);
        var bode = {
          data: [line(hz, mag, 'gain (dB)', c.a, { xaxis: 'x', yaxis: 'y' }), line(hz, ph, 'phase (°)', c.b, { xaxis: 'x', yaxis: 'y2' }),
            { x: [p.f], y: [gdb], type: 'scatter', mode: 'markers', marker: { color: c.c, size: 10, line: { color: '#fff', width: 1 } }, name: 'test frequency', xaxis: 'x', yaxis: 'y' },
            { x: [p.f], y: [phf], type: 'scatter', mode: 'markers', marker: { color: c.c, size: 10, line: { color: '#fff', width: 1 } }, showlegend: false, xaxis: 'x', yaxis: 'y2' }],
          layout: {
            title: title('Bode plot (calculated from the circuit)'), height: phone() ? 420 : 470,
            xaxis: ax({ type: 'log', title: 'frequency (Hz)', anchor: 'y2', exponentformat: 'SI' }),
            yaxis: ax({ title: 'gain (dB)', domain: [0.56, 1] }), yaxis2: ax({ title: 'phase (°)', domain: [0, 0.44] })
          }
        };
        // oscilloscope view: 2 V peak-to-peak input, two periods
        var T0 = 1 / p.f, tt = range(0, 2 * T0, T0 / 200), A = 1, g = cabs(hf), sc = T0 < 1e-3 ? 1e6 : 1e3, un = T0 < 1e-3 ? 'µs' : 'ms';
        var dso = {
          data: [line(tt.map(function (x) { return x * sc; }), tt.map(function (x) { return A * Math.sin(2 * PI * p.f * x); }), 'CH1: Vᵢₙ', c.c),
            line(tt.map(function (x) { return x * sc; }), tt.map(function (x) { return A * g * Math.sin(2 * PI * p.f * x + phf / DEG); }), 'CH2: V₀', c.a)],
          layout: { title: title('Oscilloscope view at ' + eng(p.f, 'Hz') + ' (2 V p-p input)'), xaxis: ax({ title: 't (' + un + ')' }), yaxis: ax({ title: 'V', range: [-1.15, 1.15] }), height: phone() ? 300 : 320 }
        };
        var rows = freqs.map(function (fr) { var h = H(p, 2 * PI * fr), pd = carg(h) * DEG; return [eng(fr, 'Hz'), f(2 * cabs(h), 3), f(20 * Math.log10(cabs(h)), 2), sec(Math.abs(pd / 360 / fr)), f(pd, 1)]; });
        return {
          readout: kv(info), plots: [bode, dso],
          table: '<p class="lab-tcap">Calculated (theoretical) values for your tabular column, with Vᵢ = 2 V p-p. These are not lab readings: compare them with what you measure.</p>' +
            table(['Frequency', 'V₀ (V p-p)', 'Gain (dB)', 'Δt', 'Phase (°)'], rows, 'compact')
        };
      }
    };
  }
  LAB.exp2 = network('lead'); LAB.exp3 = network('lag'); LAB.exp4 = network('laglead');

  /* ===== Experiment 5: PID trainer (example plant) ===== */
  LAB.exp5 = {
    params: [
      { name: 'P', label: 'proportional gain P', min: 0, max: 10, step: 0.1, val: 2 },
      { name: 'I', label: 'integral gain I', min: 0, max: 20, step: 0.1, val: 0 },
      { name: 'D', label: 'derivative gain D', min: 0, max: 1, step: 0.01, val: 0 }
    ],
    presets: [{ label: 'P only', set: { P: 2, I: 0, D: 0 } }, { label: 'PI', set: { P: 2, I: 5, D: 0 } }, { label: 'PD', set: { P: 2, I: 0, D: 0.1 } }, { label: 'PID', set: { P: 2, I: 5, D: 0.1 } }],
    run: function (p) {
      var c = colors(), num = polyScale([p.D, p.P, p.I], 50), den = polyAdd([1, 15, 50, 0], num);
      if (p.I === 0) { num = num.slice(0, 2); den = den.slice(0, 3); }
      var st = isStable(roots(den)), r = stepTF(num, den, 5, 0.005), Vf = r.y, Ve = Vf.map(function (v) { return 1 - v; });
      var vfss = !st ? NaN : (p.I > 0 ? 1 : (50 * p.P) / (50 + 50 * p.P)), vess = 1 - vfss;
      var s = st ? specs(r.t, Vf, vfss) : null;
      return {
        readout: kv([['Meter (steady state):', ''], ['Vᵢ =', '1.000 V'], ['V<sub>f</sub> =', st ? f(vfss, 3) + ' V' : 'unstable'], ['Vₑ =', st ? f(vess, 3) + ' V' : '–'],
          ['overshoot', s ? pct(s.Mp) : '–'], ['settling time (2 %)', s ? sec(s.ts) : '–']]),
        plots: [{
          data: [hline(0, 5, 1, 'Vᵢ (set-point)', c.m, 'dash'), line(r.t, Vf, 'V_f (feedback)', c.a), line(r.t, Ve, 'Vₑ (error)', c.b)],
          layout: { title: title('Response to a 1 V step (example plant)'), xaxis: ax({ title: 't (s)', range: [0, 5] }), yaxis: ax({ title: 'V', range: [-0.6, 1.8] }) }
        }]
      };
    }
  };

  /* ===== Experiment 6: unit step response with MATLAB ===== */
  LAB.exp6 = {
    params: [
      { name: 'wn', label: 'natural frequency ωₙ', unit: 'rad/s', min: 1000, max: 30000, step: 500, val: 10000 },
      { name: 'z', label: 'damping ratio ζ', min: 0.05, max: 2.5, step: 0.05, val: 0.5 }
    ],
    presets: [{ label: 'ζ = 0.1', set: { wn: 10000, z: 0.1 } }, { label: 'ζ = 1', set: { wn: 10000, z: 1 } }, { label: 'ζ = 2', set: { wn: 10000, z: 2 } }],
    run: function (p) {
      var c = colors(), t = range(0, 0.005, 0.000005), tm = t.map(function (x) { return x * 1e3; });
      var curve = function (wn, z) { return t.map(function (x) { return step2(wn, z, x); }); };
      var y = curve(p.wn, p.z), s = specs(t, y, 1);
      var data = [
        line(tm, curve(1e4, 0.1), 'manual: d = [1 2000 1e8]', c.m, { line: { color: c.m, width: 1.2, dash: 'dot' } }),
        line(tm, curve(1e4, 1), 'manual: d1 = [1 20000 1e8]', c.m, { line: { color: c.m, width: 1.2, dash: 'dash' } }),
        line(tm, curve(1e4, 2), 'manual: d2 = [1 40000 1e8]', c.m, { line: { color: c.m, width: 1.2, dash: 'dashdot' } }),
        line(tm, y, 'your system (ζ = ' + p.z + ')', c.a, { line: { color: c.a, width: 3 } })
      ];
      var d1 = 2 * p.z * p.wn, d2 = p.wn * p.wn;
      return {
        readout: kv([['Your system:', dampingName(p.z)], ['rise time (10–90 %)', sec(s.tr1090)], ['peak time', sec(s.tp)], ['overshoot', pct(s.Mp)], ['settling time (2 %)', sec(s.ts)]]),
        plots: [{ data: data, layout: { title: title('Unit step response, t = 0 : 0.000005 : 0.005'), xaxis: ax({ title: 't (ms)' }), yaxis: ax({ title: 'y(t)', range: [0, 2] }) } }],
        code: '% Your system: G(s) = wn^2 / (s^2 + 2*zeta*wn*s + wn^2)\nn = [0 0 ' + sig(d2, 6) + '];\nd = [1 ' + sig(d1, 6) + ' ' + sig(d2, 6) + '];\nt = 0:0.000005:0.005;\ny = step(n, d, t);\nplot(t, y), grid on\nstepinfo(tf(n, d))   % rise time, overshoot, settling time'
      };
    }
  };

  /* ===== Experiment 7: P, PD, PI, PID with MATLAB ===== */
  LAB.exp7 = {
    params: [
      { name: 'Kp', label: 'proportional gain Kp', min: 0, max: 500, step: 1, val: 300 },
      { name: 'Ki', label: 'integral gain Ki', min: 0, max: 500, step: 1, val: 0 },
      { name: 'Kd', label: 'derivative gain Kd', min: 0, max: 100, step: 0.5, val: 0 }
    ],
    presets: [{ label: 'P (300)', set: { Kp: 300, Ki: 0, Kd: 0 } }, { label: 'PD (300, 10)', set: { Kp: 300, Ki: 0, Kd: 10 } }, { label: 'PI (30, 70)', set: { Kp: 30, Ki: 70, Kd: 0 } }, { label: 'PID (350, 300, 50)', set: { Kp: 350, Ki: 300, Kd: 50 } }],
    run: function (p) {
      var c = colors(), tEnd = 2, kind = (p.Kp > 0 ? 'P' : '') + (p.Ki > 0 ? 'I' : '') + (p.Kd > 0 ? 'D' : '');
      kind = { P: 'P', PI: 'PI', PD: 'PD', PID: 'PID', I: 'I only', D: 'D only', ID: 'ID', '': 'no controller' }[kind];
      var num = [p.Kd, p.Kp, p.Ki], den = polyAdd([1, 10, 20, 0], num);
      if (p.Ki === 0) { num = [p.Kd, p.Kp]; den = polyAdd([1, 10, 20], num); }
      var ol = stepTF([1], [1, 10, 20], tEnd, 0.005), any = p.Kp + p.Ki + p.Kd > 0;
      var st = any && isStable(roots(den)), r = any ? stepTF(num, den, tEnd, 0.005) : ol;
      var yss = !any ? 0.05 : !st ? NaN : p.Ki > 0 ? 1 : p.Kp / (20 + p.Kp), s = st || !any ? specs(r.t, r.y, yss) : null;
      var code = 'num = 1; den = [1 10 20];\nplant = tf(num, den);\n';
      if (!any) code += 'step(plant)';
      else code += 'Kp = ' + p.Kp + '; Ki = ' + p.Ki + '; Kd = ' + p.Kd + ';\ncontr = ' + (p.Ki > 0 ? 'tf([Kd Kp Ki], [1 0]);' : 'tf([Kd Kp], 1);') + '\nsys = feedback(contr*plant, 1);\nt = 0:0.01:2;\nstep(sys, t)\nstepinfo(sys)';
      var rows = [['Controller', kind], ['Rise time (10–90 %)', s ? sec(s.tr1090) : '–'], ['Peak time', s ? sec(s.tp) : '–'], ['Peak overshoot', s ? pct(s.Mp) : '–'],
        ['Settling time (2 %)', s && isFinite(s.ts) && s.ts < tEnd ? sec(s.ts) : s ? '> 2 s' : '–'], ['Final value', isFinite(yss) ? f(yss, 3) : 'unstable'], ['Steady-state error', isFinite(yss) ? f(1 - yss, 3) : '–']];
      return {
        readout: kv([['Closed-loop poles:', st || !any ? roots(den).map(function (x) { return fmtRoot(x); }).join(', ') : 'unstable']]),
        plots: [{ data: [hline(0, tEnd, 1, 'set-point', c.m, 'dash'), line(ol.t, ol.y, 'open loop 1/(s²+10s+20)', c.c, { line: { color: c.c, width: 1.6, dash: 'dot' } }), line(r.t, r.y, kind + ' closed loop', c.a)],
          layout: { title: title('Step response'), xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'y(t)' }) } }],
        table: table(['Measure', 'Value'], rows), code: code
      };
    }
  };

  /* ===== Experiment 8: DC position control (Simulink model of Fig. 8.3) ===== */
  function dcPos(p) {
    var Kt = 0.5;
    function d(x) { var e = 1 - x[3], u = p.Kp * e + p.Ki * x[0], v = p.Kc * (u - x[1]) - p.Ke * x[2]; return [e, (v - 0.37 * x[1]) / 0.0015, p.invJ * Kt * x[1], x[2]]; }
    var res = rk4(d, [0, 0, 0, 0], 2.5e-4, p.T, 20, function (x, t) { return [t, x[3], x[1], x[2]]; });
    return { t: res.map(function (r) { return r[0]; }), th: res.map(function (r) { return r[1]; }), ia: res.map(function (r) { return r[2]; }), w: res.map(function (r) { return r[3]; }) };
  }
  LAB.exp8 = {
    params: [
      { name: 'Kp', label: 'position Kp', min: 0.5, max: 30, step: 0.5, val: 5 },
      { name: 'Ki', label: 'position Ki', min: 0, max: 5, step: 0.05, val: 0.2 },
      { name: 'Kc', label: 'current-loop gain Kc', min: 0.5, max: 10, step: 0.1, val: 2 },
      { name: 'invJ', label: '1/J (inertia)', min: 20, max: 300, step: 5, val: 125 },
      { name: 'Ke', label: 'back-emf constant Ke', min: 0.1, max: 2, step: 0.05, val: 0.5 },
      { name: 'T', label: 'simulation time', unit: 's', min: 1, max: 10, step: 0.5, val: 3 }
    ],
    presets: [{ label: 'Manual values (Fig. 8.3)', set: { Kp: 5, Ki: 0.2, Kc: 2, invJ: 125, Ke: 0.5, T: 3 } }],
    run: function (p) {
      var c = colors(), r = dcPos(p), bad = r.th.some(function (v) { return !isFinite(v); });
      var s = bad ? null : specs(r.t, r.th, 1), e = bad ? NaN : 1 - r.th[r.th.length - 1];
      var rows = [['Rise time (10–90 %)', s ? sec(s.tr1090) : '–'], ['Peak time', s ? sec(s.tp) : '–'], ['Settling time (2 %)', s && isFinite(s.ts) ? sec(s.ts) : '> ' + p.T + ' s'],
        ['Maximum overshoot', s ? pct(s.Mp) : '–'], ['Peak value', s ? f(s.peak, 3) + ' rad' : '–'], ['Error at t = ' + p.T + ' s', bad ? 'unstable' : sig(e, 2) + ' rad']];
      return {
        readout: kv([['Reference:', 'step of 1 rad at t = 0'], ['Peak armature current', bad ? '–' : f(Math.max.apply(null, r.ia.map(Math.abs)), 2) + ' A (model units)']]),
        plots: [{ data: [hline(0, p.T, 1, 'reference θ*', c.m, 'dash'), line(r.t, r.th, 'position θ (rad)', c.a), line(r.t, r.th.map(function (v) { return 1 - v; }), 'error θ* − θ', c.b, { line: { color: c.b, width: 1.6 } })],
          layout: { title: title('Position response (Scope)'), xaxis: ax({ title: 't (s)', range: [0, p.T] }), yaxis: ax({ title: 'rad' }) } },
        { data: [line(r.t, r.ia, 'armature current iₐ', c.o), line(r.t, r.w, 'speed ω (rad/s)', c.g, { yaxis: 'y2' })],
          layout: { title: title('Inside the loop: current and speed'), height: phone() ? 300 : 300, xaxis: ax({ title: 't (s)', range: [0, p.T] }), yaxis: ax({ title: 'iₐ' }), yaxis2: ax({ title: 'ω (rad/s)', overlaying: 'y', side: 'right', showgrid: false }), margin: { l: 58, r: 58, t: 38, b: 40 } } }],
        table: table(['Time response specification', 'Simulation'], rows)
      };
    }
  };

  /* ===== Experiment 9a: root locus of K / (s^4 + 8s^3 + 36s^2 + 80s) ===== */
  var RL_DEN = [1, 8, 36, 80, 0];
  var RL_CACHE = null;
  function rlBranches() {
    if (RL_CACHE) return RL_CACHE;
    var Ks = [0].concat(logspace(-1, 3.6, 500)), br = [[], [], [], []], prev = roots(RL_DEN);
    prev.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    Ks.forEach(function (K) {
      var rs = roots(polyAdd(RL_DEN, [K])), used = [], cur = [];
      prev.forEach(function (pv, i) { var best = -1, bd = 1e99; rs.forEach(function (r, j) { if (used.indexOf(j) < 0) { var d = Math.hypot(r[0] - pv[0], r[1] - pv[1]); if (d < bd) { bd = d; best = j; } } }); used.push(best); cur[i] = rs[best]; });
      cur.forEach(function (r, i) { br[i].push(r); }); prev = cur;
    });
    RL_CACHE = br; return br;
  }
  LAB.exp9a = {
    params: [{ name: 'K', label: 'loop gain K', min: 1, max: 1000, val: 50, log: true }],
    run: function (p) {
      var c = colors(), br = rlBranches(), cols = [c.a, c.b, c.g, c.o], cl = roots(polyAdd(RL_DEN, [p.K])), st = isStable(cl), ol = roots(RL_DEN);
      var all = [].concat.apply([], br), data = [{ x: all.map(function (r) { return r[0]; }), y: all.map(function (r) { return r[1]; }), type: 'scatter', mode: 'markers', marker: { color: c.a, size: 3.5 }, name: 'root locus (K from 0 to 4000)', hoverinfo: 'x+y' }];
      data.push({ x: ol.map(function (r) { return r[0]; }), y: ol.map(function (r) { return r[1]; }), type: 'scatter', mode: 'markers', marker: { symbol: 'x', size: 12, color: c.ink, line: { width: 2 } }, name: 'open-loop poles' });
      data.push({ x: cl.map(function (r) { return r[0]; }), y: cl.map(function (r) { return r[1]; }), type: 'scatter', mode: 'markers', marker: { size: 11, color: st ? c.c : '#dc2626', line: { color: '#fff', width: 1.5 } }, name: 'closed-loop poles at K = ' + sig(p.K, 3) });
      return {
        readout: kv([['K =', sig(p.K, 4)], ['closed-loop poles:', cl.map(function (x) { return fmtRoot(x); }).join(', ')], ['closed loop is', st ? '<span class="ok">stable</span>' : '<span class="bad">unstable</span>']]),
        plots: [{ data: data, layout: { title: title('Root locus (s-plane)'), xaxis: ax({ title: 'real axis σ', range: [-9, 4], zeroline: true }), yaxis: ax({ title: 'imaginary axis jω', range: [-8, 8], zeroline: true }), height: phone() ? 380 : 440 } }],
        code: 'num = 1;\nden = [1 8 36 80 0];\nsys = tf(num, den);\nrlocus(sys)\nrlocfind(sys)   % click on the locus to read K\n% closed-loop poles for one K:\nK = ' + sig(p.K, 4) + ';\nroots([1 8 36 80 K])'
      };
    }
  };

  /* ===== Experiment 9b: Bode plot and margins of K(s+10)/(s(s+20)(s^2+2.4s+16)) ===== */
  function bodeG(K, w) {
    var mag = K * Math.hypot(w, 10) / (w * Math.hypot(w, 20) * Math.hypot(16 - w * w, 2.4 * w));
    var ph = Math.atan2(w, 10) * DEG - 90 - Math.atan2(w, 20) * DEG - Math.atan2(2.4 * w, 16 - w * w) * DEG;
    return [mag, ph];
  }
  function bisect(fn, a, b) { var fa = fn(a); for (var i = 0; i < 100; i++) { var m = Math.sqrt(a * b), fm = fn(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return Math.sqrt(a * b); }
  LAB.exp9b = {
    params: [{ name: 'K', label: 'gain K', min: 1, max: 1000, val: 48, log: true }],
    run: function (p) {
      var c = colors(), w = logspace(-2, 2.5, 500), mag = [], ph = [];
      w.forEach(function (x) { var g = bodeG(p.K, x); mag.push(20 * Math.log10(g[0])); ph.push(g[1]); });
      var wgc = NaN, wpc = NaN, i;
      for (i = 1; i < w.length; i++) if (mag[i - 1] >= 0 && mag[i] < 0) { wgc = bisect(function (x) { return 20 * Math.log10(bodeG(p.K, x)[0]); }, w[i - 1], w[i]); break; }
      for (i = 1; i < w.length; i++) if (ph[i - 1] > -180 && ph[i] <= -180) { wpc = bisect(function (x) { return bodeG(p.K, x)[1] + 180; }, w[i - 1], w[i]); break; }
      var pm = isFinite(wgc) ? 180 + bodeG(p.K, wgc)[1] : NaN, gm = isFinite(wpc) ? -20 * Math.log10(bodeG(p.K, wpc)[0]) : Infinity;
      var st = (gm > 0) && (pm > 0);
      var data = [line(w, mag, '|G(jω)| (dB)', c.a, { yaxis: 'y' }), line(w, ph, '∠G(jω) (°)', c.b, { yaxis: 'y2' }),
        hline(w[0], w[w.length - 1], 0, '0 dB', c.m, 'dot', { yaxis: 'y', showlegend: false }), hline(w[0], w[w.length - 1], -180, '−180°', c.m, 'dot', { yaxis: 'y2', showlegend: false })];
      if (isFinite(wgc)) data.push(vline(wgc, -180, 60, 'ω_gc', c.c, 'dash', { yaxis: 'y' }));
      if (isFinite(wpc)) data.push(vline(wpc, -360, 0, 'ω_pc', c.o, 'dash', { yaxis: 'y2' }));
      return {
        readout: kv([['Gain margin GM =', isFinite(gm) ? f(gm, 2) + ' dB' : '∞'], ['Phase margin PM =', f(pm, 2) + '°'], ['ω<sub>pc</sub> =', isFinite(wpc) ? f(wpc, 3) + ' rad/s' : '–'], ['ω<sub>gc</sub> =', isFinite(wgc) ? f(wgc, 3) + ' rad/s' : '–'], ['closed loop is', st ? '<span class="ok">stable</span>' : '<span class="bad">unstable</span>']]),
        plots: [{ data: data, layout: { title: title('Bode plot, K = ' + sig(p.K, 3)), height: phone() ? 440 : 500, xaxis: ax({ type: 'log', title: 'ω (rad/s)', anchor: 'y2' }), yaxis: ax({ title: 'magnitude (dB)', domain: [0.56, 1], range: [-120, 60] }), yaxis2: ax({ title: 'phase (°)', domain: [0, 0.44], range: [-360, 0], dtick: 90 }) } }],
        code: 'K = ' + sig(p.K, 4) + ';\nnum = K*[1 10];\nden = [1 22.4 64 320 0];\nsys = tf(num, den);\n[gm, pm, wpc, wgc] = margin(sys)   % gm is a ratio: 20*log10(gm) gives dB\nmargin(sys)'
      };
    }
  };

  /* ===== Experiment 10: state space, controllability, observability ===== */
  function rank2(m) { var det = m[0][0] * m[1][1] - m[0][1] * m[1][0], sc = Math.max(1, Math.abs(m[0][0]), Math.abs(m[0][1]), Math.abs(m[1][0]), Math.abs(m[1][1])); if (Math.abs(det) > 1e-9 * sc * sc) return 2; return m.some(function (r) { return r.some(function (v) { return Math.abs(v) > 1e-12; }); }) ? 1 : 0; }
  function mat(m) { return '<span class="lab-mat">' + m.map(function (r) { return r.map(function (v) { return nice(v); }).join('&nbsp;&nbsp;'); }).join('<br>') + '</span>'; }
  function polyStr(p) {
    p = trim(p.slice()); var n = p.length - 1, out = '';
    p.forEach(function (c, i) { if (Math.abs(c) < 1e-12) return; var pw = n - i, a = Math.abs(c), cs = (a === 1 && pw > 0) ? '' : nice(a); out += (out ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + cs + (pw > 1 ? 's<sup>' + pw + '</sup>' : pw === 1 ? 's' : ''); });
    return out || '0';
  }
  function ssReport(A, B, Cm, D, num, den) {
    var Qc = [[B[0], A[0][0] * B[0] + A[0][1] * B[1]], [B[1], A[1][0] * B[0] + A[1][1] * B[1]]];
    var Qo = [[Cm[0], Cm[1]], [Cm[0] * A[0][0] + Cm[1] * A[1][0], Cm[0] * A[0][1] + Cm[1] * A[1][1]]];
    var rc = rank2(Qc), ro = rank2(Qo), poles = roots(den), zs = trim(num.slice()).length > 1 ? roots(num) : [];
    var c = colors(), st = isStable(poles), r;
    var slow = poles.reduce(function (m, x) { return Math.min(m, Math.abs(x[0]) || 1e9); }, 1e9), tEnd = st ? Math.min(Math.max(6 / slow, 2), 60) : 5;
    r = stepTF(num, den, tEnd, tEnd / 500);
    var html = '<div class="lab-ss">' +
      '<div><b>A</b> = ' + mat(A) + '</div><div><b>B</b> = ' + mat([[B[0]], [B[1]]]) + '</div><div><b>C</b> = ' + mat([Cm]) + '</div><div><b>D</b> = ' + nice(D) + '</div>' +
      '<div class="wide"><b>G(s)</b> = <span class="lab-frac"><span>' + polyStr(num) + '</span><span>' + polyStr(den) + '</span></span></div>' +
      '<div><b>Q<sub>c</sub></b> = [B&nbsp; AB] = ' + mat(Qc) + '<br>rank = ' + rc + ' → ' + (rc === 2 ? '<span class="ok">controllable</span>' : '<span class="bad">not controllable</span>') + '</div>' +
      '<div><b>Q<sub>o</sub></b> = [C; CA] = ' + mat(Qo) + '<br>rank = ' + ro + ' → ' + (ro === 2 ? '<span class="ok">observable</span>' : '<span class="bad">not observable</span>') + '</div>' +
      '<div class="wide"><b>Poles</b> (eigenvalues of A): ' + poles.map(function (x) { return fmtRoot(x); }).join(', ') + (zs.length ? ' &nbsp; <b>Zeros:</b> ' + zs.map(function (x) { return fmtRoot(x); }).join(', ') : '') + '</div></div>';
    return { html: html, plot: { data: [line(r.t, r.y, 'y(t) for a unit step u', c.a)], layout: { title: title('Step response of the model' + (st ? '' : ' (unstable)')), xaxis: ax({ title: 't (s)' }), yaxis: ax({ title: 'y' }), height: phone() ? 300 : 320 } } };
  }
  LAB.exp10a = {
    params: [
      { name: 'b1', label: 'numerator: s coefficient', type: 'number', val: 2 }, { name: 'b0', label: 'numerator: constant', type: 'number', val: 5 },
      { name: 'a1', label: 'denominator: s coefficient', type: 'number', val: 4 }, { name: 'a0', label: 'denominator: constant', type: 'number', val: 5 }
    ],
    presets: [{ label: 'Manual: num = [2 5], den = [1 4 5]', set: { b1: 2, b0: 5, a1: 4, a0: 5 } }],
    run: function (p) {
      // MATLAB tf2ss gives the controller canonical form
      var A = [[-p.a1, -p.a0], [1, 0]], B = [1, 0], Cm = [p.b1, p.b0], rep = ssReport(A, B, Cm, 0, [p.b1, p.b0], [1, p.a1, p.a0]);
      return { readout: '', html: rep.html, plots: [rep.plot], code: 'num = [' + p.b1 + ' ' + p.b0 + '];\nden = [1 ' + p.a1 + ' ' + p.a0 + '];\n[A, B, C, D] = tf2ss(num, den)\nsys = ss(A, B, C, D);\nrank(ctrb(A, B))\nrank(obsv(A, C))' };
    }
  };
  LAB.exp10b = {
    params: [
      { name: 'a11', label: 'A(1,1)', type: 'number', val: 0 }, { name: 'a12', label: 'A(1,2)', type: 'number', val: 1 },
      { name: 'a21', label: 'A(2,1)', type: 'number', val: -5 }, { name: 'a22', label: 'A(2,2)', type: 'number', val: -4 },
      { name: 'b1', label: 'B(1)', type: 'number', val: 0 }, { name: 'b2', label: 'B(2)', type: 'number', val: 1 },
      { name: 'c1', label: 'C(1)', type: 'number', val: 2 }, { name: 'c2', label: 'C(2)', type: 'number', val: 5 },
      { name: 'd', label: 'D', type: 'number', val: 0 }
    ],
    presets: [{ label: 'Manual: A = [0 1; −5 −4], B = [0; 1], C = [2 5]', set: { a11: 0, a12: 1, a21: -5, a22: -4, b1: 0, b2: 1, c1: 2, c2: 5, d: 0 } }],
    run: function (p) {
      var A = [[p.a11, p.a12], [p.a21, p.a22]], B = [p.b1, p.b2], Cm = [p.c1, p.c2];
      var den = [1, -(p.a11 + p.a22), p.a11 * p.a22 - p.a12 * p.a21];
      var num = [p.c1 * p.b1 + p.c2 * p.b2, -p.c1 * p.b1 * p.a22 + p.c1 * p.a12 * p.b2 + p.c2 * p.a21 * p.b1 - p.c2 * p.b2 * p.a11];
      num = polyAdd(num, polyScale(den, p.d));
      var rep = ssReport(A, B, Cm, p.d, num, den);
      return { readout: '', html: rep.html, plots: [rep.plot], code: 'A = [' + p.a11 + ' ' + p.a12 + '; ' + p.a21 + ' ' + p.a22 + '];\nB = [' + p.b1 + '; ' + p.b2 + '];\nC = [' + p.c1 + ' ' + p.c2 + '];\nD = ' + p.d + ';\n[num, den] = ss2tf(A, B, C, D)\nQc = ctrb(A, B), rank(Qc)\nQo = obsv(A, C), rank(Qo)' };
    }
  };

  /* ===== Experiment 11 (additional): DC position control hardware, example model ===== */
  LAB.exp11 = {
    params: [
      { name: 'K', label: 'error-amplifier gain K', min: 0.2, max: 30, step: 0.1, val: 3 },
      { name: 'deg', label: 'reference step', unit: '°', min: 10, max: 180, step: 5, val: 60 },
      { name: 'Vmax', label: 'amplifier limit ±', unit: 'V', min: 2, max: 24, step: 1, val: 12 },
      { name: 'invJ', label: '1/J (load inertia)', min: 20, max: 300, step: 5, val: 125 }
    ],
    presets: [{ label: 'Example values', set: { K: 3, deg: 60, Vmax: 12, invJ: 125 } }],
    run: function (p) {
      var c = colors(), KPOT = 10, ref = p.deg / DEG, Kt = 0.5, Ke = 0.5, Bf = 0.002, T = 3, sat = false;
      function volt(x) { var v = p.K * KPOT * (ref - x[2]); if (v > p.Vmax) { v = p.Vmax; sat = true; } if (v < -p.Vmax) { v = -p.Vmax; sat = true; } return v; }
      function d(x) { var v = volt(x); return [(v - Ke * x[1] - 0.37 * x[0]) / 0.0015, p.invJ * (Kt * x[0] - Bf * x[1]), x[1]]; }
      var res = rk4(d, [0, 0, 0], 2.5e-4, T, 20, function (x, t) { return [t, x[2] * DEG, volt(x)]; });
      var t = res.map(function (r) { return r[0]; }), th = res.map(function (r) { return r[1]; }), v = res.map(function (r) { return r[2]; });
      var bad = th.some(function (x) { return !isFinite(x); }), s = bad ? null : specs(t, th, p.deg);
      return {
        readout: kv([['Overshoot', s ? pct(s.Mp) : '–'], ['settling time (2 %)', s && isFinite(s.ts) ? sec(s.ts) : '> 3 s'], ['final error', bad ? '–' : f(p.deg - th[th.length - 1], 2) + '°'], ['amplifier', sat ? '<span class="bad">hits its limit</span>' : 'stays linear']]),
        plots: [{ data: [hline(0, T, p.deg, 'reference θᵣ', c.m, 'dash'), line(t, th, 'shaft angle θ₀ (°)', c.a)], layout: { title: title('Shaft position'), xaxis: ax({ title: 't (s)', range: [0, T] }), yaxis: ax({ title: 'degrees' }) } },
          { data: [line(t, v, 'motor voltage (V)', c.o)], layout: { title: title('Amplifier output'), height: phone() ? 260 : 260, xaxis: ax({ title: 't (s)', range: [0, T] }), yaxis: ax({ title: 'V', range: [-p.Vmax * 1.15, p.Vmax * 1.15] }), showlegend: false } }]
      };
    }
  };

  /* ===== Experiment 12 (additional): PID speed control of a DC motor, example model ===== */
  LAB.exp12 = {
    params: [
      { name: 'Kp', label: 'Kp', min: 0, max: 5, step: 0.05, val: 0.2 },
      { name: 'Ki', label: 'Ki', min: 0, max: 20, step: 0.1, val: 2 },
      { name: 'Kd', label: 'Kd', min: 0, max: 0.05, step: 0.001, val: 0 },
      { name: 'TL', label: 'load torque at t = 1.5 s', unit: 'N·m', min: 0, max: 2, step: 0.05, val: 1 },
      { name: 'wref', label: 'speed set-point ω*', unit: 'rad/s', min: 20, max: 200, step: 5, val: 100 }
    ],
    presets: [{ label: 'P only', set: { Kp: 0.2, Ki: 0, Kd: 0 } }, { label: 'PI', set: { Kp: 0.2, Ki: 2, Kd: 0 } }, { label: 'PID', set: { Kp: 0.2, Ki: 2, Kd: 0.002 } }],
    run: function (p) {
      var c = colors(), Kt = 0.5, Ke = 0.5, J = 1 / 125, Bf = 0.002, T = 3, tL = 1.5;
      function load(t) { return t >= tL ? p.TL : 0; }
      function acc(x, t) { return (Kt * x[0] - Bf * x[1] - load(t)) / J; }
      function volt(x, t) { var e = p.wref - x[1]; return p.Kp * e + p.Ki * x[2] - p.Kd * acc(x, t); } // derivative on measurement: no kick
      function d(x, t) { var v = volt(x, t); return [(v - Ke * x[1] - 0.37 * x[0]) / 0.0015, acc(x, t), p.wref - x[1]]; }
      var res = rk4(d, [0, 0, 0], 1e-4, T, 50, function (x, t) { return [t, x[1], volt(x, t)]; });
      var t = res.map(function (r) { return r[0]; }), w = res.map(function (r) { return r[1]; }), v = res.map(function (r) { return r[2]; });
      var bad = w.some(function (x) { return !isFinite(x); }), iL = t.findIndex(function (x) { return x >= tL; });
      var s = bad ? null : specs(t.slice(0, iL), w.slice(0, iL), p.Ki > 0 ? p.wref : w[iL - 1]);
      var dip = bad ? NaN : Math.min.apply(null, w.slice(iL)), wEnd = w[w.length - 1];
      return {
        readout: kv([['Rise time (10–90 %)', s ? sec(s.tr1090) : '–'], ['overshoot', s ? pct(s.Mp) : '–'], ['speed dip after load', bad ? '–' : f(Math.max(0, (s ? s.yss : p.wref) - dip), 1) + ' rad/s'], ['speed error at 3 s', bad ? 'unstable' : f(p.wref - wEnd, 2) + ' rad/s']]),
        plots: [{ data: [hline(0, T, p.wref, 'set-point ω*', c.m, 'dash'), vline(tL, 0, p.wref * 1.5, 'load applied', c.b, 'dot'), line(t, w, 'speed ω (rad/s)', c.a)], layout: { title: title('Motor speed'), xaxis: ax({ title: 't (s)', range: [0, T] }), yaxis: ax({ title: 'rad/s', range: [0, p.wref * 1.5] }) } },
          { data: [line(t, v, 'armature voltage (V)', c.o)], layout: { title: title('Controller output'), height: phone() ? 260 : 260, xaxis: ax({ title: 't (s)', range: [0, T] }), yaxis: ax({ title: 'V' }), showlegend: false } }]
      };
    }
  };

  /* ---------- build the controls and plots on the page ---------- */
  function fmtVal(d, v) {
    if (d.type === 'number') return v;
    if (d.log) return sig(v, 3);
    var dec = String(d.step).indexOf('.') < 0 ? 0 : String(d.step).length - String(d.step).indexOf('.') - 1;
    return (+v).toFixed(dec);
  }
  function snapLog(d, v) { return +sig(v, 3); }
  var live = [];
  document.querySelectorAll('.labsim[data-lab]').forEach(function (box) {
    var ex = LAB[box.dataset.lab]; if (!ex) return;
    var p = {}, inputs = [];
    var ctr = el('div', 'lab-controls' + (ex.params.some(function (d) { return d.type === 'number'; }) ? ' nums' : ''));
    ex.params.forEach(function (d) {
      var lab = el('label'), v = el('b', null, fmtVal(d, d.val)), inp = document.createElement('input');
      p[d.name] = d.val;
      if (d.type === 'number') {
        lab.innerHTML = '<span>' + d.label + '</span>'; inp.type = 'number'; inp.step = 'any'; inp.value = d.val; inp.setAttribute('aria-label', d.label);
        inp.oninput = function () { var x = parseFloat(inp.value); if (isFinite(x)) { p[d.name] = x; schedule(); } };
        inp.setVal = function (x) { inp.value = x; p[d.name] = x; };
        lab.appendChild(inp);
      } else {
        lab.innerHTML = d.label + ' = '; lab.appendChild(v); if (d.unit) lab.appendChild(document.createTextNode(' ' + d.unit));
        inp.type = 'range'; inp.setAttribute('aria-label', d.label);
        if (d.log) {
          inp.min = 0; inp.max = 1000; inp.step = 1;
          var toPos = function (x) { return Math.round(1000 * Math.log(x / d.min) / Math.log(d.max / d.min)); }, toVal = function (k) { return snapLog(d, d.min * Math.pow(d.max / d.min, k / 1000)); };
          inp.value = toPos(d.val);
          inp.oninput = function () { var x = toVal(+inp.value); p[d.name] = x; v.textContent = fmtVal(d, x); schedule(); };
          inp.setVal = function (x) { inp.value = toPos(x); p[d.name] = x; v.textContent = fmtVal(d, x); };
        } else {
          inp.min = d.min; inp.max = d.max; inp.step = d.step; inp.value = d.val;
          inp.oninput = function () { var x = +inp.value; p[d.name] = x; v.textContent = fmtVal(d, x); schedule(); };
          inp.setVal = function (x) { inp.value = x; p[d.name] = x; v.textContent = fmtVal(d, x); };
        }
        lab.appendChild(inp);
      }
      ctr.appendChild(lab); inputs.push({ inp: inp, d: d });
    });
    var bar = el('div', 'lab-presets');
    (ex.presets || []).forEach(function (pr) {
      var b = el('button', null, pr.label); b.type = 'button';
      b.onclick = function () { inputs.forEach(function (o) { if (o.d.name in pr.set) o.inp.setVal(pr.set[o.d.name]); }); draw(); };
      bar.appendChild(b);
    });
    var reset = el('button', 'lab-reset', 'Reset'); reset.type = 'button';
    reset.onclick = function () { inputs.forEach(function (o) { o.inp.setVal(o.d.val); }); draw(); };
    bar.appendChild(reset);
    var read = el('div', 'lab-readout'), extra = el('div', 'lab-extra'), plots = el('div', 'lab-plots'), tbl = el('div'), codeBox = el('div', 'lab-code');
    box.appendChild(ctr); box.appendChild(bar); box.appendChild(read); box.appendChild(extra); box.appendChild(plots); box.appendChild(tbl); box.appendChild(codeBox);
    var pending = false, plotDivs = [], codeText = '';
    function draw() {
      pending = false;
      var res = ex.run(p);
      read.innerHTML = res.readout || ''; read.style.display = res.readout ? '' : 'none';
      extra.innerHTML = res.html || '';
      (res.plots || []).forEach(function (pl, i) {
        if (!plotDivs[i]) { plotDivs[i] = el('div', 'lab-plot'); plots.appendChild(plotDivs[i]); }
        if (window.Plotly) Plotly.react(plotDivs[i], pl.data, layout(pl.layout), CONFIG);
        else plotDivs[i].textContent = 'The plot library did not load. Reload the page.';
      });
      tbl.innerHTML = res.table || '';
      if (res.code) {
        codeText = res.code;
        if (!codeBox.firstChild) {
          codeBox.innerHTML = '<div class="lab-code-head"><span>MATLAB code for these settings</span><button type="button">Copy</button></div><pre><code></code></pre>';
          codeBox.querySelector('button').onclick = function (e) {
            var b = e.target; function ok() { b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); }
            if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(codeText).then(ok); else { var ta = document.createElement('textarea'); ta.value = codeText; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (x) { } ta.remove(); }
          };
        }
        codeBox.querySelector('code').textContent = res.code;
      }
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(draw); } }
    // draw when the simulation scrolls into view (keeps the page fast)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); draw(); live.push(draw); } }, { rootMargin: '400px' });
      io.observe(box);
    } else { draw(); live.push(draw); }
  });

  // redraw when the light / dark theme changes or the screen crosses the phone width
  new MutationObserver(function () { live.forEach(function (d) { d(); }); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', function () { live.forEach(function (d) { d(); }); }); }
  var lastPhone = phone();
  window.addEventListener('resize', function () { if (phone() !== lastPhone) { lastPhone = phone(); live.forEach(function (d) { d(); }); } });
  window.LAB_EXPERIMENTS = LAB; // handy for checking values in the browser console
})();
