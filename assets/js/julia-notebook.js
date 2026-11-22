/* Julia notebook pages
   ---------------------------------------------------------------
   Makes a page look and work like a Jupyter notebook:
     * colours the Julia code in every <pre><code class="julia">,
     * adds Copy / Download buttons under each code cell,
     * builds the sliders and the interactive plot for each example
       (<section class="nb" data-nb="first-order"> ... ),
     * when a slider moves, the number in the Julia code changes too,
     * "Download notebook" saves all examples as one .ipynb file.
   The plots are computed here in the browser (JavaScript) with the same
   equations as the Julia code, so visitors do not need Julia installed.
*/
(function () {
  var root = document.documentElement;
  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function f(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString(); }
  function jlNum(x, dec) { var s = (+x).toFixed(dec); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '.0'); else s += '.0'; return s; }
  function decimals(step) { var s = String(step); return s.indexOf('.') < 0 ? 0 : s.length - s.indexOf('.') - 1; }

  /* ---------- Julia syntax colouring ---------- */
  var RX = /(#=[\s\S]*?=#|#[^\n]*)|("(?:\\.|[^"\\])*")|\b(using|import|function|end|for|in|if|elseif|else|while|return|let|begin|do|const|true|false|nothing)\b|(@\w+)|(\b\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([A-Za-z_\u00C0-\u1FFF][\w\u00C0-\u1FFF!]*)(?=\()/g;
  function highlight(code) {
    var out = '', last = 0, m;
    RX.lastIndex = 0;
    while ((m = RX.exec(code))) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'm' : m[5] ? 'n' : 'f';
      out += '<span class="tok-' + cls + '">' + esc(m[0]) + '</span>';
      last = RX.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  /* ---------- small maths toolkit ---------- */
  // Polynomials are arrays, highest power first: s^2 + 3s + 2 -> [1, 3, 2]
  function padTo(p, n) { while (p.length < n) p = [0].concat(p); return p; }
  function polyAdd(a, b) { var n = Math.max(a.length, b.length); a = padTo(a.slice(), n); b = padTo(b.slice(), n); return a.map(function (v, i) { return v + b[i]; }); }
  function polyMul(a, b) { var r = new Array(a.length + b.length - 1).fill(0); a.forEach(function (x, i) { b.forEach(function (y, j) { r[i + j] += x * y; }); }); return r; }
  function trim(p) { while (p.length > 1 && Math.abs(p[0]) < 1e-14) p = p.slice(1); return p; }

  // Complex value of a polynomial at s = j*w
  function evalJw(p, w) {
    var re = 0, im = 0;
    for (var i = 0; i < p.length; i++) { var nr = re * 0 - im * w + p[i], ni = re * w + im * 0; re = nr; im = ni; }
    return [re, im];
  }

  // All roots of a polynomial (Durand–Kerner). Returns [[re, im], ...]
  function roots(p) {
    p = trim(p.slice()); var n = p.length - 1; if (n < 1) return [];
    var a = p.map(function (v) { return v / p[0]; });
    var z = []; for (var i = 0; i < n; i++) z.push([Math.cos(2 * Math.PI * i / n + 0.4) * 0.9 + 0.1, Math.sin(2 * Math.PI * i / n + 0.4) * 0.9]);
    var R = 1 + Math.max.apply(null, a.slice(1).map(Math.abs)); z = z.map(function (c) { return [c[0] * R, c[1] * R]; });
    function cmul(x, y) { return [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]]; }
    function cdiv(x, y) { var d = y[0] * y[0] + y[1] * y[1] || 1e-300; return [(x[0] * y[0] + x[1] * y[1]) / d, (x[1] * y[0] - x[0] * y[1]) / d]; }
    for (var it = 0; it < 500; it++) {
      var moved = 0;
      for (i = 0; i < n; i++) {
        var v = [1, 0]; for (var k = 1; k <= n; k++) v = [v[0] * z[i][0] - v[1] * z[i][1] + a[k], v[0] * z[i][1] + v[1] * z[i][0]];
        var d = [1, 0]; for (var j = 0; j < n; j++) if (j !== i) d = cmul(d, [z[i][0] - z[j][0], z[i][1] - z[j][1]]);
        var dz = cdiv(v, d); z[i] = [z[i][0] - dz[0], z[i][1] - dz[1]]; moved = Math.max(moved, Math.abs(dz[0]) + Math.abs(dz[1]));
      }
      if (moved < 1e-12) break;
    }
    return z.map(function (c) { return [c[0], Math.abs(c[1]) < 1e-7 ? 0 : c[1]]; });
  }
  function stable(rs) { return rs.every(function (r) { return r[0] < -1e-9; }); }
  function fmtRoot(r) { var re = f(r[0], 3); if (!r[1]) return re; return re + (r[1] < 0 ? ' - ' : ' + ') + f(Math.abs(r[1]), 3) + 'im'; }

  // Unit-step response of num(s)/den(s) on t = 0:dt:tEnd (state space + Runge–Kutta 4)
  function stepTF(num, den, tEnd, dt) {
    den = trim(den.slice()); var n = den.length - 1, a0 = den[0];
    den = den.map(function (v) { return v / a0; }); num = padTo(trim(num.slice()).map(function (v) { return v / a0; }), n + 1);
    var D = num[0], b = num.map(function (v, i) { return v - D * den[i]; }); // strictly proper part
    var x = new Array(n).fill(0), t = [], y = [], sub = 8, h = dt / sub;
    function deriv(x) { var dx = new Array(n); for (var i = 0; i < n - 1; i++) dx[i] = x[i + 1]; var s = 1; for (i = 0; i < n; i++) s -= den[n - i] * x[i]; dx[n - 1] = s; return dx; }
    function out(x) { var s = D; for (var i = 0; i < n; i++) s += b[n - i] * x[i]; return s; }
    var steps = Math.round(tEnd / dt);
    for (var k = 0; k <= steps; k++) {
      t.push(k * dt); y.push(out(x));
      for (var s = 0; s < sub; s++) {
        var k1 = deriv(x), x2 = x.map(function (v, i) { return v + h / 2 * k1[i]; }), k2 = deriv(x2),
          x3 = x.map(function (v, i) { return v + h / 2 * k2[i]; }), k3 = deriv(x3),
          x4 = x.map(function (v, i) { return v + h * k3[i]; }), k4 = deriv(x4);
        x = x.map(function (v, i) { return v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
        if (!isFinite(x[0]) || Math.abs(x[0]) > 1e9) { x = x.map(function () { return NaN; }); }
      }
    }
    return { t: t, y: y };
  }
  function range(a, b, dt) { var r = []; for (var v = a; v <= b + 1e-9; v += dt) r.push(+v.toFixed(10)); return r; }
  function logspace(a, b, n) { var r = []; for (var i = 0; i < n; i++) r.push(Math.pow(10, a + (b - a) * i / (n - 1))); return r; }

  /* ---------- Plotly look (follows the site's light / dark theme) ---------- */
  function colors() { return { a: css('--accent') || '#4f46e5', b: '#db2777', c: css('--gold') || '#0ea5e9', m: css('--muted') || '#64748b', ink: css('--ink') || '#0f172a', grid: css('--plotgrid') || 'rgba(128,128,128,.2)' }; }
  function ax(o) { var c = colors(); return Object.assign({ gridcolor: c.grid, zerolinecolor: c.grid, linecolor: c.grid, automargin: true }, o || {}); }
  function layout(o) {
    var c = colors();
    return Object.assign({
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter, system-ui, sans-serif', color: c.ink, size: 12.5 },
      margin: { l: 58, r: 14, t: 38, b: 40 }, showlegend: true,
      legend: { orientation: 'h', x: 0, y: -0.2, yanchor: 'top', bgcolor: 'rgba(0,0,0,0)' },
      hoverlabel: { font: { family: 'JetBrains Mono, monospace', size: 12 } }
    }, o);
  }
  var CONFIG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] };
  function line(x, y, name, color, extra) { return Object.assign({ x: x, y: y, name: name, type: 'scatter', mode: 'lines', line: { color: color, width: 2.5 } }, extra || {}); }
  function hline(x0, x1, y, name, color, dash) { return { x: [x0, x1], y: [y, y], name: name, type: 'scatter', mode: 'lines', line: { color: color, width: 1.5, dash: dash || 'dash' }, hoverinfo: 'skip' }; }
  function vline(x, y0, y1, name, color, dash, extra) { return Object.assign({ x: [x, x], y: [y0, y1], name: name, type: 'scatter', mode: 'lines', line: { color: color, width: 1.5, dash: dash || 'dot' }, hoverinfo: 'skip' }, extra || {}); }
  function phone() { return window.innerWidth < 640; }

  /* ---------- the examples ---------- */
  // Each example: params (sliders = Julia variables) and run(p) -> { stdout, data, layout }
  var NB = {};

  NB['first-order'] = {
    params: [
      { name: 'K', label: 'steady-state gain', min: 0.5, max: 5, step: 0.1, val: 2 },
      { name: 'τ', label: 'time constant (s)', min: 0.2, max: 3, step: 0.1, val: 1.5 }
    ],
    run: function (p) {
      var c = colors(), t = range(0, 10, 0.02), y = t.map(function (x) { return p.K * (1 - Math.exp(-x / p['τ'])); });
      return {
        stdout: 'Final value   = ' + p.K + '\nRise time     ≈ ' + f(2.2 * p['τ'], 2) + ' s\nSettling (2%) ≈ ' + f(4 * p['τ'], 2) + ' s',
        data: [line(t, y, 'y(t)', c.a), hline(0, 10, 0.632 * p.K, '63.2 % of K', c.b), vline(p['τ'], 0, 5.2, 't = τ', c.c)],
        layout: { title: { text: 'First-order step response', font: { size: 14 } }, xaxis: ax({ title: 't (s)', range: [0, 10] }), yaxis: ax({ title: 'y', range: [0, 5.2] }) }
      };
    }
  };

  NB['second-order'] = {
    params: [
      { name: 'ωn', label: 'natural frequency (rad/s)', min: 0.5, max: 5, step: 0.1, val: 2 },
      { name: 'ζ', label: 'damping ratio', min: 0.05, max: 2, step: 0.05, val: 0.4 }
    ],
    run: function (p) {
      var c = colors(), wn = p['ωn'], z = p['ζ'];
      var r = stepTF([wn * wn], [1, 2 * z * wn, wn * wn], 10, 0.01), peak = Math.max.apply(null, r.y), s = '';
      if (z > 0 && z < 1) {
        var wd = wn * Math.sqrt(1 - z * z);
        s += 'Peak overshoot Mp = ' + f(100 * Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)), 1) + ' %\n';
        s += 'Peak time      tp = ' + f(Math.PI / wd, 2) + ' s\n';
        s += 'Settling time  ts ≈ ' + f(4 / (z * wn), 2) + ' s  (2 % band)\n';
      }
      s += 'Measured peak     = ' + f(peak, 3);
      return {
        stdout: s,
        data: [line(r.t, r.y, 'ζ = ' + z, c.a), hline(0, 10, 0.98, '±2 % band', c.m), hline(0, 10, 1.02, '', c.m, 'dash')].map(function (d, i) { if (i === 2) d.showlegend = false; return d; }),
        layout: { title: { text: 'Second-order step response', font: { size: 14 } }, xaxis: ax({ title: 't (s)', range: [0, 10] }), yaxis: ax({ title: 'y', range: [0, 2] }) }
      };
    }
  };

  NB['pid'] = {
    params: [
      { name: 'Kp', label: 'proportional gain', min: 0.1, max: 10, step: 0.1, val: 2 },
      { name: 'Ki', label: 'integral gain', min: 0, max: 3, step: 0.05, val: 0.5 },
      { name: 'Kd', label: 'derivative gain', min: 0, max: 5, step: 0.1, val: 1 }
    ],
    run: function (p) {
      var c = colors(), G = [1, 3, 3, 1], Cn = [p.Kd, p.Kp, p.Ki];
      var den = polyAdd(polyMul([1, 0], G), Cn), r = stepTF(Cn, den, 30, 0.05);
      var rP = stepTF([p.Kp], polyAdd(G, [p.Kp]), 30, 0.05);
      var st = stable(roots(den)), peak = Math.max.apply(null, r.y.filter(isFinite));
      return {
        stdout: 'Peak value         = ' + f(peak, 3) + '\nSteady-state error = ' + (st ? f(1 - r.y[r.y.length - 1], 3) : 'none (output does not settle)') + '\nStable? ' + st,
        data: [line(r.t, r.y, 'PID', c.a), line(rP.t, rP.y, 'P only (Kp = ' + p.Kp + ')', c.b, { line: { color: c.b, width: 2, dash: 'dash' } }), hline(0, 30, 1, 'set-point', c.m, 'dot')],
        layout: { title: { text: 'PID control of 1/(s+1)³', font: { size: 14 } }, xaxis: ax({ title: 't (s)', range: [0, 30] }), yaxis: ax({ title: 'y', range: [-0.5, 2.5] }) }
      };
    }
  };

  // Root locus of 1/(s(s+2)(s+4))
  var locusCache = null;
  function locus() {
    if (locusCache) return locusCache;
    var Ks = [0].concat(logspace(-2, 3.2, 600)), br = [[], [], []], prev = null;
    Ks.forEach(function (K) {
      var rs = roots([1, 6, 8, K]);
      if (prev) { // keep each branch continuous: match to the nearest previous root
        var used = [], ord = [];
        prev.forEach(function (q) { var best = -1, bd = 1e99; rs.forEach(function (r, j) { if (used.indexOf(j) < 0) { var d = Math.hypot(r[0] - q[0], r[1] - q[1]); if (d < bd) { bd = d; best = j; } } }); used.push(best); ord.push(rs[best]); });
        rs = ord;
      } else rs.sort(function (a, b) { return b[0] - a[0]; });
      rs.forEach(function (r, i) { br[i].push(r); }); prev = rs;
    });
    return (locusCache = br);
  }
  NB['root-locus'] = {
    params: [{ name: 'K', label: 'controller gain', min: 0.5, max: 80, step: 0.5, val: 10 }],
    run: function (p) {
      var c = colors(), br = locus(), cl = roots([1, 6, 8, p.K]).sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; }), st = stable(cl);
      var data = br.map(function (b, i) { return { x: b.map(function (r) { return r[0]; }), y: b.map(function (r) { return r[1]; }), type: 'scatter', mode: 'lines', name: 'root locus', showlegend: i === 0, legendgroup: 'l', line: { color: c.a, width: 2 }, hoverinfo: 'skip' }; });
      data.push({ x: [0, -2, -4], y: [0, 0, 0], type: 'scatter', mode: 'markers', name: 'open-loop poles', marker: { symbol: 'x', size: 11, color: c.m, line: { width: 2 } } });
      data.push({ x: cl.map(function (r) { return r[0]; }), y: cl.map(function (r) { return r[1]; }), type: 'scatter', mode: 'markers', name: 'poles at K = ' + p.K, marker: { size: 11, color: c.b }, hovertemplate: '%{x:.3f} %{y:+.3f}j<extra></extra>' });
      var r = stepTF([p.K], [1, 6, 8, p.K], 20, 0.05);
      data.push(line(r.t, r.y, 'step response', c.c, { xaxis: 'x2', yaxis: 'y2' }));
      var two = !phone();
      return {
        stdout: 'Closed-loop poles: [' + cl.map(fmtRoot).join(', ') + ']\n' + (st ? 'Stable' : 'Unstable') + (Math.abs(p.K - 48) < 0.6 ? '  (K = 48 is the critical gain: poles on the jω axis)' : ''),
        data: data,
        layout: {
          height: two ? 420 : 640,
          xaxis: ax(two ? { domain: [0, 0.55], title: 'Real axis', range: [-7, 3] } : { domain: [0, 1], title: 'Real axis', range: [-7, 3], anchor: 'y' }),
          yaxis: ax(two ? { title: 'Imaginary axis', range: [-6, 6] } : { title: 'Imaginary axis', range: [-6, 6], domain: [0.56, 1] }),
          xaxis2: ax(two ? { domain: [0.66, 1], title: 't (s)', anchor: 'y2', range: [0, 20] } : { title: 't (s)', anchor: 'y2', range: [0, 20] }),
          yaxis2: ax(two ? { anchor: 'x2', title: 'y', range: [-0.5, 2] } : { anchor: 'x2', title: 'y', range: [-0.5, 2], domain: [0, 0.3] }),
          annotations: [
            { text: 'Root locus', x: two ? 0.275 : 0.5, y: 1.0, xref: 'paper', yref: 'paper', yanchor: 'bottom', showarrow: false, font: { size: 13 } },
            { text: 'Closed-loop step response', x: two ? 0.83 : 0.5, y: two ? 1.0 : 0.33, xref: 'paper', yref: 'paper', yanchor: 'bottom', showarrow: false, font: { size: 13 } }
          ],
          legend: { orientation: 'h', x: 0, y: two ? -0.22 : -0.12, yanchor: 'top', bgcolor: 'rgba(0,0,0,0)' },
          margin: { l: 58, r: 14, t: 30, b: 40 }
        }
      };
    }
  };

  // Bode plot of K / (s(s+1)(s+5)) with gain and phase margins
  NB['bode'] = {
    params: [{ name: 'K', label: 'loop gain', min: 1, max: 60, step: 1, val: 10 }],
    run: function (p) {
      var c = colors(), w = logspace(-2, 2, 500), den = [1, 6, 5, 0], mag = [], ph = [], off = 0, lastRaw = null;
      w.forEach(function (x) {
        var d = evalJw(den, x), m = p.K / Math.hypot(d[0], d[1]), a = -Math.atan2(d[1], d[0]) * 180 / Math.PI;
        if (lastRaw !== null) { while (a + off - (lastRaw) > 180) off -= 360; while (a + off - lastRaw < -180) off += 360; }
        lastRaw = a + off; mag.push(20 * Math.log10(m)); ph.push(a + off);
      });
      // keep the phase starting near -90°
      var shift = Math.round((-90 - ph[0]) / 360) * 360; ph = ph.map(function (v) { return v + shift; });
      function cross(arr, level) { for (var i = 1; i < arr.length; i++) if ((arr[i - 1] - level) * (arr[i] - level) <= 0) { var fr = (level - arr[i - 1]) / (arr[i] - arr[i - 1]); return { w: Math.pow(10, Math.log10(w[i - 1]) + fr * (Math.log10(w[i]) - Math.log10(w[i - 1]))), i: i, fr: fr }; } return null; }
      var gc = cross(mag, 0), pc = cross(ph, -180), s = '';
      var gmDb = null, pm = null;
      if (pc) { var mAt = mag[pc.i - 1] + pc.fr * (mag[pc.i] - mag[pc.i - 1]); gmDb = -mAt; s += 'Gain margin  = ' + f(gmDb, 2) + ' dB  at ω = ' + f(pc.w, 3) + ' rad/s\n'; }
      if (gc) { var pAt = ph[gc.i - 1] + gc.fr * (ph[gc.i] - ph[gc.i - 1]); pm = 180 + pAt; s += 'Phase margin = ' + f(pm, 2) + '°   at ω = ' + f(gc.w, 3) + ' rad/s'; }
      if (gmDb !== null && pm !== null) s += '\n' + (gmDb > 0 && pm > 0 ? 'Closed loop is stable' : 'Closed loop is UNSTABLE');
      var data = [line(w, mag, '|G(jω)| (dB)', c.a), line(w, ph, '∠G(jω) (deg)', c.b, { xaxis: 'x2', yaxis: 'y2' }),
        hline(0.01, 100, 0, '', c.m, 'dot'), Object.assign(hline(0.01, 100, -180, '', c.m, 'dot'), { xaxis: 'x2', yaxis: 'y2' })];
      data[2].showlegend = data[3].showlegend = false;
      if (pc) { data.push(vline(pc.w, -gmDb, 0, 'gain margin', c.c, 'solid', { line: { color: c.c, width: 3 } })); }
      if (gc) { data.push(vline(gc.w, -180, -180 + pm, 'phase margin', c.c, 'solid', { xaxis: 'x2', yaxis: 'y2', showlegend: !pc, line: { color: c.c, width: 3 } })); }
      return {
        stdout: s,
        data: data,
        layout: {
          height: 520,
          title: { text: 'Bode plot with margins', font: { size: 14 } },
          xaxis: ax({ type: 'log', anchor: 'y', matches: 'x2', showticklabels: false }),
          yaxis: ax({ title: 'Magnitude (dB)', domain: [0.54, 1], range: [-100, 70] }),
          xaxis2: ax({ type: 'log', anchor: 'y2', title: 'ω (rad/s)' }),
          yaxis2: ax({ title: 'Phase (deg)', domain: [0, 0.44], range: [-280, -80], dtick: 45 }),
          legend: { orientation: 'h', x: 0, y: -0.14, yanchor: 'top', bgcolor: 'rgba(0,0,0,0)' }
        }
      };
    }
  };

  // Nonlinear tank with PI level control (same loop as the Julia code)
  function simulateTank(r, Kp, Ki) {
    var A = 2, k = 0.4, qmax = 1, dt = 0.05, tEnd = 200, n = Math.round(tEnd / dt) + 1;
    var t = [], h = new Array(n).fill(0), q = new Array(n).fill(0), integral = 0;
    for (var i = 0; i < n; i++) t.push(+(i * dt).toFixed(4));
    h[0] = 0.5;
    for (i = 0; i < n - 1; i++) {
      var kout = t[i] < 100 ? k : 1.3 * k, e = r - h[i], u = Kp * e + Ki * integral;
      q[i] = Math.min(Math.max(u, 0), qmax);
      if (u === q[i]) integral += e * dt;
      h[i + 1] = Math.max(h[i] + dt * (q[i] - kout * Math.sqrt(h[i])) / A, 0);
    }
    q[n - 1] = q[n - 2];
    return { t: t, h: h, q: q };
  }
  NB['tank'] = {
    params: [
      { name: 'r', label: 'level set-point (m)', min: 0.5, max: 3, step: 0.1, val: 2 },
      { name: 'Kp', label: 'proportional gain', min: 0.1, max: 5, step: 0.1, val: 1.5 },
      { name: 'Ki', label: 'integral gain', min: 0, max: 0.5, step: 0.01, val: 0.1 }
    ],
    run: function (p) {
      var c = colors(), s = simulateTank(p.r, p.Kp, p.Ki), i99 = s.t.findIndex(function (x) { return x >= 99; });
      // thin the data for drawing (every 4th point)
      function thin(a) { return a.filter(function (_, i) { return i % 4 === 0 || i === a.length - 1; }); }
      return {
        stdout: 'Level at t = 99 s : ' + f(s.h[i99], 3) + ' m\nFinal level       : ' + f(s.h[s.h.length - 1], 3) + ' m',
        data: [line(thin(s.t), thin(s.h), 'level h', c.a), hline(0, 200, p.r, 'set-point', c.b), vline(100, 0, 4, 'disturbance', c.m),
          line(thin(s.t), thin(s.q), 'inflow q_in', '#f59e0b', { xaxis: 'x2', yaxis: 'y2' })],
        layout: {
          height: 540,
          title: { text: 'Tank level with PI control', font: { size: 14 } },
          xaxis: ax({ anchor: 'y', matches: 'x2', showticklabels: false, range: [0, 200] }),
          yaxis: ax({ title: 'h (m)', domain: [0.42, 1], range: [0, 4] }),
          xaxis2: ax({ anchor: 'y2', title: 't (s)', range: [0, 200] }),
          yaxis2: ax({ title: 'q (m³/s)', domain: [0, 0.32], range: [0, 1.1] }),
          legend: { orientation: 'h', x: 0, y: -0.14, yanchor: 'top', bgcolor: 'rgba(0,0,0,0)' }
        }
      };
    }
  };

  /* ---------- wire up the page ---------- */
  var cells = [];

  function download(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function copy(text, btn) {
    function done() { var o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = o; }, 1400); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { } ta.remove(); }
  }
  function button(label, fn) { var b = el('button', null, label); b.type = 'button'; b.onclick = function () { fn(b); }; return b; }

  // Every code cell: colour it and add buttons
  document.querySelectorAll('.nb-code').forEach(function (box) {
    var code = box.querySelector('code'), cell = { code: code, text: code.textContent.replace(/^\n+|\s+$/g, ''), file: box.dataset.file || 'example.jl' };
    code.innerHTML = highlight(cell.text);
    var bar = el('div', 'nb-bar');
    bar.appendChild(button('Copy code', function (b) { copy(cell.text, b); }));
    bar.appendChild(button('Download .jl', function () { download(cell.file, cell.text + '\n'); }));
    box.appendChild(bar);
    box._cell = cell; cells.push(cell);
  });

  function setParam(cell, name, val) {
    var nm = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cell.text = cell.text.replace(new RegExp('(^|\\n)(\\s*' + nm + '\\s*=\\s*)(-?\\d+(?:\\.\\d+)?)', 'u'), function (_, a, b) { return a + b + val; });
    cell.code.innerHTML = highlight(cell.text);
  }

  var live = [];
  document.querySelectorAll('.nb[data-nb]').forEach(function (sec) {
    var ex = NB[sec.dataset.nb], out = sec.querySelector('.nb-outbox'), codeBox = sec.querySelector('.nb-code');
    if (!ex || !out) return;
    var cell = codeBox && codeBox._cell, p = {}, inputs = [];
    var ctr = el('div', 'nb-controls');
    ex.params.forEach(function (d) {
      var dec = decimals(d.step), lab = el('label'), v = el('b', null, d.val.toFixed(dec));
      lab.innerHTML = '<code>' + d.name + '</code> = ';
      lab.appendChild(v); lab.appendChild(el('span', 'nb-plabel', ' · ' + d.label));
      var r = document.createElement('input'); r.type = 'range'; r.min = d.min; r.max = d.max; r.step = d.step; r.value = d.val; r.setAttribute('aria-label', d.name + ', ' + d.label);
      p[d.name] = d.val;
      r.oninput = function () { var x = +r.value; p[d.name] = x; v.textContent = x.toFixed(dec); if (cell) setParam(cell, d.name, jlNum(x, dec)); schedule(); };
      lab.appendChild(r); ctr.appendChild(lab); inputs.push({ r: r, d: d });
      if (cell) setParam(cell, d.name, jlNum(d.val, dec));
    });
    var reset = button('Reset', function () { inputs.forEach(function (o) { o.r.value = o.d.val; o.r.oninput(); }); });
    reset.className = 'nb-reset';
    var std = el('pre', 'nb-stdout'), plot = el('div', 'nb-plot');
    out.appendChild(ctr); out.appendChild(reset); out.appendChild(std); out.appendChild(plot);
    var pending = false;
    function draw() {
      pending = false;
      var res = ex.run(p), lay = layout(Object.assign({ height: phone() ? 360 : 400 }, res.layout));
      std.textContent = res.stdout;
      if (window.Plotly) Plotly.react(plot, res.data, lay, CONFIG);
      else plot.textContent = 'The plot library did not load. Check your internet connection and reload the page.';
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(draw); } }
    live.push(draw); draw();
  });

  // Redraw plots when the light / dark theme changes
  new MutationObserver(function () { live.forEach(function (d) { d(); }); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener('change', function () { live.forEach(function (d) { d(); }); }) : null); }
  var lastPhone = phone();
  window.addEventListener('resize', function () { if (phone() !== lastPhone) { lastPhone = phone(); live.forEach(function (d) { d(); }); } });

  /* ---------- Download every example as one Jupyter notebook (.ipynb) ---------- */
  // Read the text now, before the maths renderer turns $...$ into formulas.
  function md(node) {
    var parts = [];
    node.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > div.eq').forEach(function (n) {
      if (n.tagName === 'UL' || n.tagName === 'OL') parts.push([].map.call(n.children, function (li, i) { return (n.tagName === 'OL' ? (i + 1) + '. ' : '- ') + li.textContent.replace(/\s+/g, ' ').trim(); }).join('\n'));
      else parts.push(n.textContent.replace(/\s+/g, ' ').trim());
    });
    return parts.join('\n\n');
  }
  var nbParts = [];
  document.querySelectorAll('[data-ipynb]').forEach(function (sec) {
    var h = sec.querySelector('h2'), mdBox = sec.querySelector('.nb-md'), cb = sec.querySelector('.nb-code');
    nbParts.push({ title: h ? h.textContent.trim() : '', md: mdBox ? md(mdBox) : '', cell: cb && cb._cell });
  });
  function lines(s) { var a = s.split('\n'); return a.map(function (l, i) { return i < a.length - 1 ? l + '\n' : l; }); }
  function buildIpynb() {
    var title = document.querySelector('.course-head h1'), cellsOut = [];
    cellsOut.push({ cell_type: 'markdown', metadata: {}, source: lines('# ' + (title ? title.textContent : 'Julia simulations') + '\n\nControl System Engineering (EEE2510). Run each cell with Shift + Enter. Change the numbers and run the cell again to see what happens.') });
    nbParts.forEach(function (n) {
      cellsOut.push({ cell_type: 'markdown', metadata: {}, source: lines('## ' + n.title + (n.md ? '\n\n' + n.md : '')) });
      if (n.cell) cellsOut.push({ cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: lines(n.cell.text) });
    });
    return JSON.stringify({ cells: cellsOut, metadata: { kernelspec: { display_name: 'Julia', language: 'julia', name: 'julia' }, language_info: { name: 'julia', file_extension: '.jl' } }, nbformat: 4, nbformat_minor: 5 }, null, 1);
  }
  document.querySelectorAll('[data-download-notebook]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); download(b.dataset.downloadNotebook || 'control-systems-julia.ipynb', buildIpynb(), 'application/x-ipynb+json'); });
  });
})();
