/* Industrial process simulations (Control System Engineering, EEE2510)
   ---------------------------------------------------------------
   Page: courses/control-system-engineering/industrial-simulations.html
   Guide: HOW-TO-ADD-TEACHING-CONTENT.md, section 18.

   This file adds five simulations to the lab simulation engine in
   assets/js/lab-experiments.js. Load THIS file first, then Plotly, then
   lab-experiments.js. Every <div class="sim labsim" data-lab="ind-tank"></div>
   on a page becomes one simulation:
     ind-tank      level control of a tank that drains through a valve
     ind-twotank   two interacting tanks (level of the second tank)
     ind-temp      steam-heated tank temperature with dead time
     ind-conveyor  conveyor drive speed (dc motor) with a 100 V limit and anti-windup
     ind-tuning    PID tuning workbench: reaction curve, Ziegler-Nichols, Cohen-Coon, AMIGO
   Each entry has  params (sliders / drop-downs), presets (buttons) and run(p).
   To change a default value, find the entry below and change val: for that slider.
   The process values are EXAMPLE values chosen for teaching, not data from a real plant.
*/
(window.LAB_PLUGINS = window.LAB_PLUGINS || []).push(function (LAB, k) {
  var f = k.f, sig = k.sig, kv = k.kv, line = k.line, hline = k.hline, vline = k.vline, ax = k.ax, title = k.title, phone = k.phone, table = k.table, pct = k.pct;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function T(t) { return t.map(function (x) { return x; }); }
  function col(rows, i) { return rows.map(function (r) { return r[i]; }); }
  function bad(y) { return y.some(function (v) { return !isFinite(v); }); }
  function iae(t, e) { var s = 0; for (var i = 1; i < t.length; i++) s += 0.5 * (Math.abs(e[i]) + Math.abs(e[i - 1])) * (t[i] - t[i - 1]); return s; }
  function rk4step(d, x, t, h) {
    var k1 = d(x, t), x2 = x.map(function (v, i) { return v + h / 2 * k1[i]; }), k2 = d(x2, t + h / 2),
      x3 = x.map(function (v, i) { return v + h / 2 * k2[i]; }), k3 = d(x3, t + h / 2),
      x4 = x.map(function (v, i) { return v + h * k3[i]; }), k4 = d(x4, t + h);
    return x.map(function (v, i) { return v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
  }
  function overshootAfter(t, y, t0, y0, y1) { // percent overshoot of a step from y0 to y1 that starts at t0
    var span = y1 - y0, m = 0; if (Math.abs(span) < 1e-9) return 0;
    for (var i = 0; i < t.length; i++) if (t[i] >= t0) m = Math.max(m, (y[i] - y1) / span);
    return 100 * m;
  }
  function settleAfter(t, y, t0, tEnd, y0, y1, band) { // 2 % settling time measured from t0, only up to tEnd
    var span = Math.abs(y1 - y0) || 1, last = -1, i0 = -1;
    for (var i = 0; i < t.length && t[i] < tEnd; i++) { if (t[i] < t0) continue; if (i0 < 0) i0 = i; if (Math.abs(y[i] - y1) > band * span) last = i; }
    if (i0 < 0) return NaN; if (last < 0) return 0; if (last >= t.length - 2 || t[last + 1] >= tEnd - 1e-9) return NaN;
    return t[last + 1] - t0;
  }

  /* ===== 1. Level control of a tank that drains through a valve ===== */
  // A dh/dt = q_in - q_out,  q_in = qmax * v/100,  q_out = k * (outlet opening) * sqrt(h)
  LAB['ind-tank'] = {
    params: [
      { name: 'mode', label: 'controller', type: 'select', val: 1, options: [[0, 'P only'], [1, 'PI'], [2, 'Manual (valve fixed)']] },
      { name: 'Kc', label: 'controller gain K<sub>c</sub>', unit: '% per m', min: 5, max: 200, step: 5, val: 40 },
      { name: 'Ti', label: 'integral time T<sub>i</sub>', unit: 's', min: 10, max: 600, step: 10, val: 120 },
      { name: 'sp', label: 'new level set-point (at t = 50 s)', unit: 'm', min: 0.5, max: 3.5, step: 0.1, val: 2.5 },
      { name: 'dout', label: 'outlet valve opening after t = 600 s', unit: '%', min: 20, max: 100, step: 5, val: 70 },
      { name: 'A', label: 'tank cross-section A', unit: 'm²', min: 0.5, max: 5, step: 0.1, val: 1.5 }
    ],
    presets: [
      { label: 'P only: steady offset', set: { mode: 0, Kc: 40 } },
      { label: 'PI: no offset', set: { mode: 1, Kc: 40, Ti: 120 } },
      { label: 'PI too aggressive', set: { mode: 1, Kc: 200, Ti: 10 } },
      { label: 'No control', set: { mode: 2 } }
    ],
    run: function (p) {
      var c = k.colors(), qmax = 0.1, kout = 0.05 / Math.sqrt(2), out0 = 50, h0 = 2, tauV = 3, tEnd = 1200, tSP = 50, tD = 600, h = 0.25;
      var v0 = 100 * kout * (out0 / 50) * Math.sqrt(h0) / qmax; // valve opening that holds h0 at the start (50 %)
      // states: [level h, valve position v (%), integral of error]
      var x = [h0, v0, 0], rows = [], sat = false, ov = false, I = (p.mode === 1) ? 0 : 0;
      function sp(t) { return t >= tSP ? p.sp : h0; }
      function outlet(t) { return t >= tD ? p.dout : out0; }
      function ctrl(x, t) {
        if (p.mode === 2) return v0;
        var e = sp(t) - x[0], u = v0 + p.Kc * (e + (p.mode === 1 ? x[2] / p.Ti : 0));
        return clamp(u, 0, 100);
      }
      function d(x, t) {
        var u = ctrl(x, t), e = sp(t) - x[0], hh = Math.max(x[0], 0);
        var qin = qmax * clamp(x[1], 0, 100) / 100, qout = kout * (outlet(t) / 50) * Math.sqrt(hh);
        var dh = (qin - qout) / p.A; if (x[0] >= 4 && dh > 0) dh = 0; if (x[0] <= 0 && dh < 0) dh = 0;
        // integrator stops while the controller output is at a limit (anti-windup by clamping)
        var raw = v0 + p.Kc * (e + (p.mode === 1 ? x[2] / p.Ti : 0)), dI = (p.mode === 1 && !((raw >= 100 && e > 0) || (raw <= 0 && e < 0))) ? e : 0;
        return [dh, (u - x[1]) / tauV, dI];
      }
      for (var t = 0, n = 0; t <= tEnd + 1e-9; t += h, n++) {
        if (n % 8 === 0) { var u = ctrl(x, t); if (u >= 99.99 || u <= 0.01) sat = true; if (x[0] >= 3.999) ov = true; rows.push([t, x[0], x[1], qmax * clamp(x[1], 0, 100) / 100 * 1000, kout * (outlet(t) / 50) * Math.sqrt(Math.max(x[0], 0)) * 1000, sp(t)]); }
        x = rk4step(d, x, t, h); x[0] = clamp(x[0], 0, 4);
      }
      var tt = col(rows, 0), lv = col(rows, 1), vv = col(rows, 2), qi = col(rows, 3), qo = col(rows, 4), sps = col(rows, 5);
      var iB = tt.findIndex(function (z) { return z >= tD; }) - 1, offA = p.sp - lv[iB], offB = p.sp - lv[lv.length - 1];
      var R = 2 * Math.sqrt(p.sp) / (kout), tau = p.A * R; // linearised: tau = A * 2 sqrt(h)/k  (s)
      return {
        readout: kv([
          ['offset before disturbance', f(offA * 100, 1) + ' cm'], ['offset at the end', f(offB * 100, 1) + ' cm'],
          ['overshoot', pct(overshootAfter(tt.slice(0, iB), lv.slice(0, iB), tSP, h0, p.sp))],
          ['linearised time constant at the set-point', f(tau, 0) + ' s'],
          ['valve', sat ? '<span class="bad">hits 0 % or 100 %</span>' : 'stays inside its range'], ov ? ['tank', '<span class="bad">overflows (4 m)</span>'] : ['tank', 'no overflow']
        ]),
        plots: [
          { data: [line(tt, sps, 'set-point', c.m, { line: { color: c.m, width: 1.5, dash: 'dash' } }), line(tt, lv, 'level h (m)', c.a), vline(tD, 0, 4, 'outlet valve changed', c.b, 'dot')], layout: { title: title('Tank level'), xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'm', range: [0, 4] }) } },
          { data: [line(tt, vv, 'inlet valve (%)', c.o), line(tt, qi, 'inflow (L/s)', c.g, { yaxis: 'y2', line: { color: c.g, width: 2, dash: 'dot' } }), line(tt, qo, 'outflow (L/s)', c.b, { yaxis: 'y2', line: { color: c.b, width: 2 } })], layout: { title: title('Valve and flows'), height: phone() ? 300 : 300, xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'valve %', range: [-5, 105] }), yaxis2: ax({ title: 'L/s', overlaying: 'y', side: 'right', range: [0, 105], showgrid: false }) } }
        ],
        code: '% Linearised tank model about h0 = ' + p.sp + ' m (MATLAB)\nA = ' + p.A + ';  k = ' + sig(kout, 4) + ';  h0 = ' + p.sp + ';\nR = 2*sqrt(h0)/k;          % flow resistance (s/m^2)\nG = tf(R*0.1/100, [A*R 1]); % level (m) per % valve\nC = pid(' + sig(p.Kc, 3) + ', ' + (p.mode === 1 ? sig(p.Kc / p.Ti, 3) : 0) + ');  % Kc, Ki = Kc/Ti\nstep(feedback(C*G, 1))'
      };
    }
  };

  /* ===== 2. Two interacting tanks (D'Azzo, Houpis and Sheldon, Section 2.11) ===== */
  // A1 dh1/dt = qi - (h1 - h2)/R1 ,  A2 dh2/dt = (h1 - h2)/R1 - h2/R2
  LAB['ind-twotank'] = {
    params: [
      { name: 'mode', label: 'operation', type: 'select', val: 0, options: [[0, 'Open loop: step in inflow'], [1, 'PI control of level h₂']] },
      { name: 'A1', label: 'tank 1 area A₁', unit: 'm²', min: 0.2, max: 4, step: 0.1, val: 1.5 },
      { name: 'A2', label: 'tank 2 area A₂', unit: 'm²', min: 0.2, max: 4, step: 0.1, val: 1 },
      { name: 'R1', label: 'pipe resistance R₁', unit: 's/m²', min: 10, max: 200, step: 5, val: 30 },
      { name: 'R2', label: 'outlet resistance R₂', unit: 's/m²', min: 10, max: 200, step: 5, val: 50 },
      { name: 'Kc', label: 'PI gain K<sub>c</sub>', unit: '(L/s) per m', min: 1, max: 100, step: 1, val: 20 },
      { name: 'Ti', label: 'PI integral time T<sub>i</sub>', unit: 's', min: 10, max: 600, step: 10, val: 150 }
    ],
    presets: [{ label: 'Open-loop step', set: { mode: 0 } }, { label: 'PI control', set: { mode: 1, Kc: 20, Ti: 150 } }, { label: 'PI, high gain', set: { mode: 1, Kc: 80, Ti: 60 } }, { label: 'Equal tanks, equal pipes', set: { A1: 1, A2: 1, R1: 50, R2: 50 } }],
    run: function (p) {
      var c = k.colors(), q0 = 0.01, dq = 0.01, h2sp = 1.0, h = 0.25, tEnd = 1500, tS = 20;
      // starting steady state for inflow q0: h2 = q0 R2, h1 = h2 + q0 R1
      var x = [q0 * (p.R1 + p.R2), q0 * p.R2, 0], rows = [];
      var h2target = p.mode === 0 ? (q0 + dq) * p.R2 : x[1] + 0.5;
      function qin(x, t) {
        if (p.mode === 0) return t >= tS ? q0 + dq : q0;
        var sp = t >= tS ? h2target : x0h2, e = sp - x[1];
        return clamp(q0 + p.Kc / 1000 * (e + x[2] / p.Ti), 0, 0.05);
      }
      var x0h2 = x[1];
      function d(x, t) {
        var q = qin(x, t), sp = t >= tS ? h2target : x0h2;
        return [(q - (x[0] - x[1]) / p.R1) / p.A1, ((x[0] - x[1]) / p.R1 - x[1] / p.R2) / p.A2, p.mode === 1 ? sp - x[1] : 0];
      }
      for (var t = 0, n = 0; t <= tEnd + 1e-9; t += h, n++) { if (n % 8 === 0) rows.push([t, x[0], x[1], qin(x, t) * 1000]); x = rk4step(d, x, t, h); }
      var tt = col(rows, 0), h1 = col(rows, 1), h2 = col(rows, 2), q = col(rows, 3);
      // H2/Qi = R2 / (R1 R2 A1 A2 s^2 + (R2 A1 + R2 A2 + R1 A1) s + 1)
      var a2 = p.R1 * p.R2 * p.A1 * p.A2, a1 = p.R2 * p.A1 + p.R2 * p.A2 + p.R1 * p.A1, disc = Math.sqrt(a1 * a1 - 4 * a2);
      var t1 = (a1 + disc) / 2, t2 = (a1 - disc) / 2, zeta = a1 / (2 * Math.sqrt(a2));
      var s = k.specs(tt.slice(Math.round(tS / (8 * h))).map(function (z) { return z - tS; }), h2.slice(Math.round(tS / (8 * h))).map(function (z) { return z - x0h2; }), h2target - x0h2);
      return {
        readout: kv([
          ['time constants of H₂/Q', f(t1, 0) + ' s and ' + f(t2, 0) + ' s'], ['damping ratio ζ', f(zeta, 3) + ' (always > 1: no overshoot in open loop)'],
          ['steady-state gain h₂/q', f(p.R2, 0) + ' m per m³/s'], ['settling time of h₂ (2 %)', s && isFinite(s.ts) ? f(s.ts, 0) + ' s' : '> run'],
          ['overshoot of h₂', s ? pct(s.Mp) : '–']
        ]),
        plots: [
          { data: [line(tt, h1, 'level h₁ (tank 1)', c.o), line(tt, h2, 'level h₂ (tank 2)', c.a), hline(tS, tEnd, h2target, p.mode === 1 ? 'h₂ set-point' : 'final h₂', c.m, 'dash')], layout: { title: title(p.mode === 1 ? 'Levels under PI control of h₂' : 'Levels after a step in inflow'), xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'm' }) } },
          { data: [line(tt, q, 'inflow q (L/s)', c.g)], layout: { title: title('Inflow'), height: 250, showlegend: false, xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'L/s', range: [0, 52] }) } }
        ],
        code: "% Two interacting tanks, D'Azzo, Houpis and Sheldon (2003), Eqs. (2.118)-(2.120)\nA1 = " + p.A1 + '; A2 = ' + p.A2 + '; R1 = ' + p.R1 + '; R2 = ' + p.R2 + ';\nA = [-1/(R1*A1)  1/(R1*A1);  1/(R1*A2)  -1/(R1*A2)-1/(R2*A2)];\nB = [1/A1; 0];  C = [0 1];  D = 0;\nG = tf(ss(A, B, C, D))     % H2(s)/Qi(s)\npole(G)\nstep(' + dq + '*G)'
      };
    }
  };

  /* ===== 3. Steam-heated tank temperature with dead time (D'Azzo et al., Section 5.2, Example 1) ===== */
  // C dθ/dt = Q(t - L) - (θ - θin)/R ;  steam valve lag τv ;  thermocouple lag τs
  LAB['ind-temp'] = {
    params: [
      { name: 'mode', label: 'controller', type: 'select', val: 3, options: [[0, 'On/off with hysteresis'], [1, 'P'], [2, 'PI'], [3, 'PID']] },
      { name: 'Kc', label: 'gain K<sub>c</sub>', unit: '% per °C', min: 0.5, max: 30, step: 0.5, val: 6 },
      { name: 'Ti', label: 'integral time T<sub>i</sub>', unit: 's', min: 10, max: 600, step: 5, val: 90 },
      { name: 'Td', label: 'derivative time T<sub>d</sub>', unit: 's', min: 0, max: 60, step: 1, val: 12 },
      { name: 'L', label: 'dead time L (mixing and transport)', unit: 's', min: 0, max: 80, step: 1, val: 20 },
      { name: 'band', label: 'on/off hysteresis band', unit: '°C', min: 0, max: 4, step: 0.1, val: 1 },
      { name: 'dT', label: 'drop in inlet temperature at t = 900 s', unit: '°C', min: 0, max: 15, step: 1, val: 8 }
    ],
    presets: [
      { label: 'On/off', set: { mode: 0, band: 1 } }, { label: 'P', set: { mode: 1, Kc: 6 } }, { label: 'PI', set: { mode: 2, Kc: 5, Ti: 120 } },
      { label: 'PID', set: { mode: 3, Kc: 6, Ti: 90, Td: 12 } }, { label: 'Long dead time', set: { L: 60 } }
    ],
    run: function (p) {
      var c = k.colors(), Rth = 1, KQ = 0.5, tau = 300, tauV = 5, tauS = 10, th0 = 50, sp1 = 60, tSP = 60, tD = 900, tEnd = 1800, h = 0.25, N = 8;
      var thIn0 = 25, u0 = (th0 - thIn0) / KQ;    // 50 % valve holds 50 °C
      var nL = Math.round(p.L / h), buf = [], on = false, lastM = th0, dF = 0;
      for (var i = 0; i <= nL; i++) buf.push(u0);
      // states: [tank temperature θ, valve opening v, measured temperature θm, integral, filtered derivative]
      var x = [th0, u0, th0, 0, 0], rows = [], sat = 0, steps = 0, eAbs = 0, prevU = u0;
      function sp(t) { return t >= tSP ? sp1 : th0; }
      function thIn(t) { return t >= tD ? thIn0 - p.dT : thIn0; }
      for (var n = 0, t = 0; t <= tEnd + 1e-9; n++, t = n * h) {
        var e = sp(t) - x[2], u;
        if (p.mode === 0) { if (e > p.band / 2) on = true; else if (e < -p.band / 2) on = false; u = on ? 100 : 0; }
        else {
          // derivative on the measured temperature (no kick when the set-point steps), filtered with Td/10
          var Tf = Math.max(p.Td / 10, h), dm = (x[2] - lastM) / h; dF += h / Tf * (dm - dF); lastM = x[2];
          var D = p.mode === 3 ? -p.Kc * p.Td * dF : 0, I = p.mode >= 2 ? p.Kc / p.Ti * x[3] : 0;
          u = u0 + p.Kc * e + I + D;
          var us = clamp(u, 0, 100);
          if (p.mode >= 2 && !((u > 100 && e > 0) || (u < 0 && e < 0))) x[3] += e * h; // anti-windup
          u = us;
        }
        if (u >= 99.99 || u <= 0.01) sat++;
        steps++;
        buf.push(u); var ud = buf.shift();             // valve command delayed by L
        if (n % N === 0) rows.push([t, x[0], x[2], u, sp(t)]);
        if (t >= tSP) eAbs += Math.abs(sp(t) - x[0]) * h;
        var dv = function (y, tt) { return [(KQ * clamp(y[1], 0, 100) - (y[0] - thIn(tt)) / Rth) / tau, (ud - y[1]) / tauV, (y[0] - y[2]) / tauS]; };
        var y3 = rk4step(dv, [x[0], x[1], x[2]], t, h); x[0] = y3[0]; x[1] = y3[1]; x[2] = y3[2];
      }
      var tt = col(rows, 0), th = col(rows, 1), thm = col(rows, 2), uu = col(rows, 3), sps = col(rows, 4);
      var iB = tt.findIndex(function (z) { return z >= tD; }) - 1, off = sp1 - th[iB], offEnd = sp1 - th[th.length - 1];
      var mx = Math.max.apply(null, th.slice(0, iB)), mn = Math.min.apply(null, th.slice(iB));
      var ts = settleAfter(tt, th, tSP, tD, th0, sp1, 0.05);
      var ampl = 0; if (p.mode === 0) { var tail = th.slice(Math.round(iB * 0.7), iB); ampl = (Math.max.apply(null, tail) - Math.min.apply(null, tail)) / 2; }
      var r = p.mode === 0 ? [['cycling amplitude', '± ' + f(ampl, 2) + ' °C'], ['valve', 'switches between 0 % and 100 %']] :
        [['overshoot', pct(overshootAfter(tt.slice(0, iB), th.slice(0, iB), tSP, th0, sp1))], ['settling time (5 % band)', isFinite(ts) ? f(ts, 0) + ' s' : 'does not settle'],
          ['offset before disturbance', f(off, 2) + ' °C'], ['largest drop after disturbance', f(Math.max(0, sp1 - mn), 2) + ' °C'], ['offset at the end', f(offEnd, 2) + ' °C']];
      r.push(['IAE (from t = 60 s)', f(eAbs, 0) + ' °C·s']);
      return {
        readout: kv(r),
        plots: [
          { data: [line(tt, sps, 'set-point', c.m, { line: { color: c.m, width: 1.5, dash: 'dash' } }), line(tt, th, 'tank temperature θ', c.a), line(tt, thm, 'thermocouple reading θₘ', c.c, { line: { color: c.c, width: 1.5, dash: 'dot' } }), vline(tD, 40, 75, 'inlet gets colder', c.b, 'dot')], layout: { title: title('Tank temperature'), xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: '°C', range: [40, 72] }) } },
          { data: [line(tt, uu, 'steam valve command (%)', c.o)], layout: { title: title('Controller output'), height: 250, showlegend: false, xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: '%', range: [-5, 105] }) } }
        ],
        code: '% Steam-heated tank: first-order lag with dead time, valve and sensor lags\ns = tf(\'s\');\nG = 0.5*exp(-' + p.L + '*s)/((300*s+1)*(5*s+1)*(10*s+1));   % °C per % valve\n' + (p.mode === 0 ? '% on/off control needs a Simulink model with a Relay block (hysteresis ' + p.band + ' °C)' : 'C = pid(' + p.Kc + ', ' + (p.mode >= 2 ? sig(p.Kc / p.Ti, 3) : 0) + ', ' + (p.mode === 3 ? sig(p.Kc * p.Td, 3) : 0) + ');   % Kp, Ki = Kc/Ti, Kd = Kc*Td\nstep(10*feedback(C*G, 1), 1800)')
      };
    }
  };

  /* ===== 4. Conveyor drive: dc motor speed control (Nise, Section 2.8 motor model) ===== */
  LAB['ind-conveyor'] = {
    params: [
      { name: 'Kp', label: 'K<sub>p</sub>', unit: 'V per rad/s', min: 0.1, max: 10, step: 0.1, val: 2 },
      { name: 'Ki', label: 'K<sub>i</sub>', unit: 'V per rad', min: 0, max: 40, step: 0.5, val: 10 },
      { name: 'aw', label: 'anti-windup', type: 'select', val: 1, options: [[1, 'On (integrator stops at the limit)'], [0, 'Off']] },
      { name: 'wref', label: 'belt speed set-point (motor side)', unit: 'rad/s', min: 20, max: 180, step: 5, val: 100 },
      { name: 'TL', label: 'load torque added at t = 4 s', unit: 'N·m', min: 0, max: 15, step: 0.5, val: 8 },
      { name: 'Jl', label: 'belt and load inertia (at the motor)', unit: 'kg·m²', min: 0.05, max: 2, step: 0.05, val: 0.5 }
    ],
    presets: [{ label: 'Anti-windup on', set: { aw: 1, Kp: 2, Ki: 10, wref: 100, TL: 8, Jl: 0.5 } }, { label: 'Anti-windup off', set: { aw: 0, Kp: 2, Ki: 10, wref: 100, TL: 8, Jl: 0.5 } }, { label: 'P only', set: { Ki: 0, wref: 100, TL: 8 } }, { label: 'Heavy load at high speed', set: { wref: 160, TL: 15 } }],
    run: function (p) {
      var c = k.colors(), Ra = 1, La = 0.01, Kt = 0.5, Kb = 0.5, J = 0.02 + p.Jl, Dm = 0.05, Vmax = 100, tL = 4, tEnd = 8, h = 2e-4, N = 50;
      var x = [0, 0, 0], rows = [], satT = 0;   // [armature current, speed, integral of error]
      function TLd(t) { return t >= tL ? p.TL : 0; }
      for (var n = 0, t = 0; t <= tEnd + 1e-9; n++, t = n * h) {
        var e = p.wref - x[1], raw = p.Kp * e + p.Ki * x[2], v = clamp(raw, -Vmax, Vmax);
        if (v !== raw) satT += h;
        if (n % N === 0) rows.push([t, x[1], v, x[0]]);
        var stopI = p.aw === 1 && v !== raw && raw * e > 0;
        var d = function (y, tt) { return [(v - Ra * y[0] - Kb * y[1]) / La, (Kt * y[0] - Dm * y[1] - TLd(tt)) / J, stopI ? 0 : e]; };
        x = rk4step(d, x, t, h);
        if (!isFinite(x[1]) || Math.abs(x[1]) > 1e5) break;
      }
      var tt = col(rows, 0), w = col(rows, 1), vv = col(rows, 2), ia = col(rows, 3);
      var iL = tt.findIndex(function (z) { return z >= tL; }), s = k.specs(tt.slice(0, iL), w.slice(0, iL), p.wref), os = overshootAfter(tt.slice(0, iL), w.slice(0, iL), 0, 0, p.wref);
      var dip = Math.min.apply(null, w.slice(iL)), wEnd = w[w.length - 1], wMax = Vmax / Kb;
      return {
        readout: kv([
          ['overshoot', pct(os)], ['settling time (2 %)', s && isFinite(s.ts) ? f(s.ts, 2) + ' s' : '> 4 s'],
          ['speed dip after the load', f(Math.max(0, p.wref - dip), 1) + ' rad/s'], ['speed error at 8 s', f(p.wref - wEnd, 2) + ' rad/s'],
          ['time at the 100 V limit', f(satT, 2) + ' s'], ['highest possible no-load speed', f(wMax, 0) + ' rad/s']
        ]),
        plots: [
          { data: [hline(0, tEnd, p.wref, 'set-point', c.m, 'dash'), vline(tL, 0, p.wref * 1.6, 'load added', c.b, 'dot'), line(tt, w, 'motor speed ω (rad/s)', c.a)], layout: { title: title('Conveyor drive speed'), xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'rad/s', range: [0, p.wref * 1.6] }) } },
          { data: [line(tt, vv, 'armature voltage (V)', c.o), line(tt, ia, 'armature current (A)', c.g, { yaxis: 'y2', line: { color: c.g, width: 1.8, dash: 'dot' } })], layout: { title: title('Drive voltage (limit ±100 V) and current'), height: phone() ? 300 : 300, xaxis: ax({ title: 't (s)', range: [0, tEnd] }), yaxis: ax({ title: 'V', range: [-110, 110] }), yaxis2: ax({ title: 'A', overlaying: 'y', side: 'right', showgrid: false }) } }
        ],
        code: '% DC motor speed model (Nise 2015, Section 2.8), example values\nRa = 1; La = 0.01; Kt = 0.5; Kb = 0.5; J = ' + sig(J, 3) + '; D = 0.05;\nG = tf(Kt, conv([La Ra], [J D]) + [0 0 Kt*Kb]);   % speed / voltage\nC = pid(' + p.Kp + ', ' + p.Ki + ');\nstep(' + p.wref + '*feedback(C*G, 1), 3)   % linear: ignores the 100 V limit'
      };
    }
  };

  /* ===== 5. PID tuning workbench: reaction curve and three tuning rules ===== */
  var PROC = [
    { name: 'Heat exchanger outlet temperature', K: 1.5, L: 3, lags: [20, 5], unit: 's' },
    { name: 'Column tray temperature (slow, long dead time)', K: 0.8, L: 12, lags: [60, 20, 5], unit: 's' },
    { name: 'Liquid flow loop (fast)', K: 1.0, L: 0.5, lags: [2, 0.5], unit: 's' }
  ];
  function simLoop(pr, Kc, Ti, Td, tEnd, h, tLoad, open) {
    // process: K e^{-Ls} / prod(τ s + 1) ; ideal PID on error, derivative on measurement with filter Td/10
    var n = pr.lags.length, x = new Array(n).fill(0), nL = Math.round(pr.L / h), buf = new Array(nL + 1).fill(0), I = 0, lastY = 0, dF = 0, rows = [], every = Math.max(1, Math.round(tEnd / h / 600));
    for (var i = 0, t = 0; t <= tEnd + 1e-9; i++, t = i * h) {
      var y = pr.K * x[n - 1], u;
      if (open) u = 1; else {
        var e = 1 - y, Tf = Math.max(Td / 10, h), dm = (y - lastY) / h; dF += h / Tf * (dm - dF); lastY = y;
        I += e * h; u = Kc * (e + I / Ti - Td * dF);
      }
      var load = (!open && t >= tLoad) ? -0.5 : 0;  // load disturbance at the process input (half the set-point step, in input units)
      if (i % every === 0) rows.push([t, y, u]);
      buf.push(u + load); var ud = buf.shift();
      // series of first-order lags, exact discretisation for each step
      var inp = ud;
      for (var j = 0; j < n; j++) { var a = Math.exp(-h / pr.lags[j]); x[j] = a * x[j] + (1 - a) * inp; inp = x[j]; }
      if (!isFinite(y) || Math.abs(y) > 1e6) { rows.push([t, NaN, NaN]); break; }
    }
    return rows;
  }
  function reaction(pr) {
    var Ttot = pr.L + pr.lags.reduce(function (a, b) { return a + b; }, 0), tEnd = 6 * Ttot, h = Ttot / 4000;
    var r = simLoop(pr, 0, 1, 0, tEnd, h, 1e9, true), t = col(r, 0), y = col(r, 1), best = 0, bi = 1;
    for (var i = 1; i < y.length; i++) { var sl = (y[i] - y[i - 1]) / (t[i] - t[i - 1]); if (sl > best) { best = sl; bi = i; } }
    var ti = 0.5 * (t[bi] + t[bi - 1]), yi = 0.5 * (y[bi] + y[bi - 1]), L = ti - yi / best, Tt = pr.K / best;
    return { t: t, y: y, L: L, T: Tt, slope: best, tEnd: tEnd };
  }
  function rules(K, L, Tt) {
    var a = L / Tt;
    return {
      zn: { name: 'Ziegler–Nichols (reaction curve)', Kc: 1.2 * Tt / (K * L), Ti: 2 * L, Td: 0.5 * L },
      cc: { name: 'Cohen–Coon', Kc: (Tt / (K * L)) * (4 / 3 + a / 4), Ti: L * (32 + 6 * a) / (13 + 8 * a), Td: 4 * L / (11 + 2 * a) },
      amigo: { name: 'AMIGO (Åström–Hägglund)', Kc: (0.2 + 0.45 * Tt / L) / K, Ti: L * (0.4 * L + 0.8 * Tt) / (L + 0.1 * Tt), Td: 0.5 * L * Tt / (0.3 * L + Tt) }
    };
  }
  LAB['ind-tuning'] = {
    params: [
      { name: 'proc', label: 'process (example model)', type: 'select', val: 0, options: PROC.map(function (q, i) { return [i, q.name]; }) },
      { name: 'rule', label: 'tuning rule shown in the closed-loop plot', type: 'select', val: 0, options: [[0, 'Ziegler–Nichols'], [1, 'Cohen–Coon'], [2, 'AMIGO'], [3, 'All three']] },
      { name: 'detune', label: 'gain multiplier (detuning)', unit: '× rule gain', min: 0.2, max: 1.5, step: 0.05, val: 1 }
    ],
    presets: [{ label: 'Heat exchanger', set: { proc: 0 } }, { label: 'Column tray', set: { proc: 1 } }, { label: 'Flow loop', set: { proc: 2 } }, { label: 'Compare all three rules', set: { rule: 3 } }],
    run: function (p) {
      var c = k.colors(), pr = PROC[p.proc], rc = reaction(pr), R = rules(pr.K, rc.L, rc.T), keys = ['zn', 'cc', 'amigo'], cols = [c.a, c.o, c.g];
      var Ttot = pr.L + pr.lags.reduce(function (a, b) { return a + b; }, 0), tEnd = 8 * Ttot, tLoad = tEnd / 2, h = Ttot / 3000;
      var tangentT = [rc.L, rc.L + rc.T], tangentY = [0, pr.K];
      var data2 = [hline(0, tEnd, 1, 'set-point', c.m, 'dash'), vline(tLoad, 0, 2, 'load disturbance', c.b, 'dot')], rowsT = [];
      keys.forEach(function (kk, i) {
        var g = R[kk], r = simLoop(pr, g.Kc * p.detune, g.Ti, g.Td, tEnd, h, tLoad, false), t = col(r, 0), y = col(r, 1), e = y.map(function (v) { return 1 - v; });
        var iB = t.findIndex(function (z) { return z >= tLoad; });
        var os = bad(y) ? NaN : overshootAfter(t.slice(0, iB), y.slice(0, iB), 0, 0, 1), ts = bad(y) ? NaN : settleAfter(t, y, 0, tLoad, 0, 1, 0.02);
        rowsT.push([g.name, sig(g.Kc * p.detune, 3), sig(g.Ti, 3) + ' ' + pr.unit, sig(g.Td, 3) + ' ' + pr.unit, bad(y) ? '<span class="bad">unstable</span>' : pct(os), isFinite(ts) ? sig(ts, 3) + ' ' + pr.unit : '–', bad(y) ? '–' : sig(iae(t, e), 3)]);
        if (p.rule === 3 || p.rule === i) data2.push(line(t, y, g.name, cols[i]));
      });
      return {
        readout: kv([['From the reaction curve:', ''], ['process gain K =', sig(pr.K, 3)], ['apparent dead time L =', sig(rc.L, 3) + ' ' + pr.unit], ['apparent time constant T =', sig(rc.T, 3) + ' ' + pr.unit], ['L / T =', sig(rc.L / rc.T, 2)]]),
        plots: [
          { data: [line(rc.t, rc.y, 'open-loop step response', c.a), line(tangentT, tangentY, 'tangent at the inflection point', c.b, { line: { color: c.b, width: 1.6, dash: 'dash' } }), hline(0, rc.tEnd, pr.K, 'final value K', c.m, 'dot'), vline(rc.L, 0, pr.K, 'L', c.m, 'dot', { showlegend: false }), vline(rc.L + rc.T, 0, pr.K, 'L + T', c.m, 'dot', { showlegend: false })], layout: { title: title('Step 1: open-loop reaction curve (valve step of 1)'), xaxis: ax({ title: 't (' + pr.unit + ')', range: [0, rc.tEnd * 0.7] }), yaxis: ax({ title: 'output', range: [0, pr.K * 1.1] }) } },
          { data: data2, layout: { title: title('Step 2: closed loop, set-point step at 0 and load disturbance halfway'), xaxis: ax({ title: 't (' + pr.unit + ')', range: [0, tEnd] }), yaxis: ax({ title: 'output', range: [0, 1.9] }) } }
        ],
        table: '<p class="lab-tcap">Controller settings from each rule (ideal PID: u = K<sub>c</sub>[e + (1/T<sub>i</sub>)∫e dt − T<sub>d</sub> dy/dt]) and the closed-loop results</p>' + table(['Rule', 'K<sub>c</sub>', 'T<sub>i</sub>', 'T<sub>d</sub>', 'overshoot', 'settling (2 %)', 'IAE'], rowsT),
        code: "s = tf('s');\nG = " + pr.K + '*exp(-' + pr.L + '*s)/(' + pr.lags.map(function (q) { return '(' + q + '*s+1)'; }).join('*') + ');\nstep(G)              % reaction curve: draw the tangent, read L and T\nK = ' + pr.K + '; L = ' + sig(rc.L, 4) + '; T = ' + sig(rc.T, 4) + ';\nKc = 1.2*T/(K*L); Ti = 2*L; Td = 0.5*L;      % Ziegler-Nichols\nC = pidstd(Kc*' + p.detune + ', Ti, Td);\nstep(feedback(C*G, 1))'
      };
    }
  };
});
