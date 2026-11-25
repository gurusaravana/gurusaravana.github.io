/* Course mind map with OBE (outcome-based education) mapping.

   How to use on any course page:
     <div class="cmap" id="map">
       <script type="application/json"> { ...course data... } </script>
     </div>
     <script src="../assets/js/course-map.js"></script>

   The JSON inside the div holds everything: the outcomes (COs), the
   programme outcomes (POs/PSOs) and the modules with their lessons.
   Each lesson lists "co" (main outcomes, from the course plan) and
   "also" (outcomes the lesson supports). Edit the JSON, not this file.

   What it draws:
     - a mind map (wide screens) or a branching list (phones); clicking a
       topic opens that lesson,
     - outcome buttons that highlight which topics build each CO,
     - a topic × CO mapping table and the CO × PO/PSO table. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent, svg) {
    var e = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function coClass(id) { return 'c-' + id.toLowerCase(); }
  var LEVEL = { H: 'High', M: 'Medium', L: 'Low' };

  function build(box) {
    var src = box.querySelector('script[type="application/json"]');
    if (!src) return;
    var D;
    try { D = JSON.parse(src.textContent); } catch (e) { box.insertAdjacentHTML('beforeend', '<p class="note">Course map data has a typing error: ' + e.message + '</p>'); return; }
    var CO = {}; D.outcomes.forEach(function (o) { CO[o.id] = o; });
    var lessons = [];
    D.modules.forEach(function (m) { m.lessons.forEach(function (l) { l.mod = m; lessons.push(l); }); });
    var state = { co: null };

    /* ---------- outcome buttons ---------- */
    var bar = el('div', { 'class': 'cmap-cos', role: 'group', 'aria-label': 'Highlight topics by course outcome' }, box);
    var allBtn = el('button', { type: 'button', 'data-co': '', 'aria-pressed': 'true', text: 'All topics' }, bar);
    D.outcomes.forEach(function (o) {
      var b = el('button', { type: 'button', 'data-co': o.id, 'aria-pressed': 'false', title: o.text, 'class': coClass(o.id) }, bar);
      el('i', {}, b); b.appendChild(document.createTextNode(o.id));
    });

    /* ---------- mind map (SVG) ---------- */
    var stage = el('div', { 'class': 'cmap-stage' }, box);
    var svgWrap = el('div', { 'class': 'cmap-svg' }, stage);
    var tree = el('div', { 'class': 'cmap-tree' }, stage);
    var info = el('div', { 'class': 'cmap-info', 'aria-live': 'polite' }, box);

    var W = 1160, cx = W / 2, rowH = 34, gap = 22, pad = 26;
    var rootW = 150, modW = 136, colX = 885;   // lessons start at cx + (colX - cx)
    var sides = [[], []];                      // 0 = right, 1 = left
    D.modules.forEach(function (m, i) { sides[i < Math.ceil(D.modules.length / 2) ? 0 : 1].push(m); });
    sides[1].reverse();                        // clockwise: M1 top-right ... last module top-left
    function sideH(list) { var n = 0; list.forEach(function (m) { n += m.lessons.length; }); return n * rowH + (list.length - 1) * gap; }
    var H = Math.max(sideH(sides[0]), sideH(sides[1])) + 2 * pad, cy = H / 2;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Mind map of course topics. Select a topic to open its lesson.' }, svgWrap, true);
    el('defs', { html: '<linearGradient id="cmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#db2777"/></linearGradient>' }, svg, true);
    var gLinks = el('g', { 'class': 'links' }, svg, true);
    var gNodes = el('g', {}, svg, true);

    function curve(x1, y1, x2, y2) { var mx = (x1 + x2) / 2; return 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2; }

    var root = el('g', { 'class': 'root' }, gNodes, true);
    el('rect', { x: cx - rootW / 2, y: cy - 34, width: rootW, height: 68, rx: 20 }, root, true);
    var rl = (D.title || 'Course').split('\n');
    rl.forEach(function (t, i) { el('text', { x: cx, y: cy + (i - (rl.length - 1) / 2) * 18 + 5, 'text-anchor': 'middle', text: t }, root, true); });

    var nodes = [];   // {lesson, g, link, li}
    var order = 0;
    sides.forEach(function (list, s) {
      var dir = s === 0 ? 1 : -1;
      var y = cy - sideH(list) / 2;
      list.forEach(function (m) {
        var top = y, n = m.lessons.length, my = top + (n * rowH) / 2;
        var mx = cx + dir * 185;
        el('path', { d: curve(cx + dir * rootW / 2, cy, mx - dir * modW / 2, my), 'class': 'lk lk-mod', style: '--d:' + (order++ * 40) + 'ms' }, gLinks, true);
        var ma = el('a', { href: '#' + (m.anchor || 'lessons'), 'class': 'mod' }, gNodes, true);
        el('title', { text: 'Module ' + m.n + ': ' + m.title }, ma, true);
        el('rect', { x: mx - modW / 2, y: my - 24, width: modW, height: 48, rx: 14 }, ma, true);
        el('text', { x: mx, y: my - 5, 'text-anchor': 'middle', 'class': 'mn', text: 'MODULE ' + m.n }, ma, true);
        el('text', { x: mx, y: my + 13, 'text-anchor': 'middle', text: m.short || m.title }, ma, true);
        m.lessons.forEach(function (l, i) {
          var ly = top + i * rowH + rowH / 2;
          var lx = dir > 0 ? colX : W - colX;
          var link = el('path', { d: curve(mx + dir * modW / 2, my, lx, ly), 'class': 'lk', style: '--d:' + (order * 40 + 120) + 'ms' }, gLinks, true);
          var a = el('a', { href: l.href, 'class': 'lesson', style: '--d:' + (order++ * 40 + 200) + 'ms' }, gNodes, true);
          el('title', { text: 'Lesson ' + l.n + ': ' + l.title + ' (' + l.co.concat(l.also || []).join(', ') + ')' }, a, true);
          var r = el('rect', { y: ly - 13, height: 26, rx: 13 }, a, true);
          var c = el('circle', { cy: ly, r: 10 }, a, true);
          var num = el('text', { y: ly + 4, 'text-anchor': 'middle', 'class': 'ln', text: l.n }, a, true);
          var tx = el('text', { y: ly + 4.5, text: l.label || l.title }, a, true);
          var dots = l.co.map(function (id) { return { id: id, main: true }; }).concat((l.also || []).map(function (id) { return { id: id, main: false }; }));
          var dEls = dots.map(function (d) { return el('circle', { cy: ly, r: 4.6, 'class': 'dot ' + coClass(d.id) + (d.main ? '' : ' sup') }, a, true); });
          nodes.push({ l: l, a: a, link: link, place: function () {
            var tw = tx.getComputedTextLength ? tx.getComputedTextLength() : 0;
            if (!tw) tw = (l.label || l.title).length * 6.6;
            var w = 30 + tw + 10 + dots.length * 12 + 6;
            var x0 = dir > 0 ? lx : lx - w;
            r.setAttribute('x', x0); r.setAttribute('width', w);
            c.setAttribute('cx', x0 + 13); num.setAttribute('x', x0 + 13);
            tx.setAttribute('x', x0 + 30);
            dEls.forEach(function (d, k) { d.setAttribute('cx', x0 + 30 + tw + 12 + k * 12); });
          } });
        });
        y += n * rowH + gap;
      });
    });
    function placeAll() { nodes.forEach(function (n) { n.place(); }); }

    /* ---------- branching list (phones) ---------- */
    el('div', { 'class': 'ct-root', text: (D.title || '').replace('\n', ' ') }, tree);
    D.modules.forEach(function (m) {
      var md = el('div', { 'class': 'ct-mod' }, tree);
      var mh = el('div', { 'class': 'ct-mhead' }, md);
      el('span', { 'class': 'mcode', text: m.n }, mh); el('b', { text: m.title }, mh);
      var ul = el('ul', {}, md);
      m.lessons.forEach(function (l) {
        var li = el('li', {}, ul);
        var a = el('a', { href: l.href }, li);
        el('span', { 'class': 'n', text: (l.n < 10 ? '0' : '') + l.n }, a);
        el('span', { 'class': 't', text: l.title }, a);
        var tags = el('span', { 'class': 'tags' }, a);
        l.co.forEach(function (id) { el('span', { 'class': 'cotag ' + coClass(id), text: id }, tags); });
        (l.also || []).forEach(function (id) { el('span', { 'class': 'cotag sup ' + coClass(id), text: id, title: 'Supports ' + id }, tags); });
        nodes.filter(function (n) { return n.l === l; })[0].li = li;
      });
    });

    /* ---------- tables ---------- */
    var tw1 = el('div', { 'class': 'cmap-tables' }, box);
    el('h3', { text: 'Topic to outcome mapping' }, tw1);
    el('p', { 'class': 'note', html: '<b class="mk">●</b> main outcome (from the course plan lesson table) &nbsp; <b class="mk">○</b> the topic also supports this outcome. Select a column heading to highlight it on the map.' }, tw1);
    var wrap1 = el('div', { 'class': 'tblwrap' }, tw1);
    var t1 = el('table', { 'class': 'tbl cmap-tbl' }, wrap1);
    var hr = el('tr', {}, el('thead', {}, t1));
    el('th', { text: 'Lesson' }, hr);
    D.outcomes.forEach(function (o) {
      var th = el('th', { 'class': 'co ' + coClass(o.id), 'data-col': o.id }, hr);
      el('button', { type: 'button', 'data-co': o.id, title: o.text, text: o.id }, th);
    });
    var tb = el('tbody', {}, t1);
    D.modules.forEach(function (m) {
      var tr = el('tr', { 'class': 'modrow' }, tb);
      el('td', { colspan: D.outcomes.length + 1, text: 'Module ' + m.n + ' · ' + m.title }, tr);
      m.lessons.forEach(function (l) {
        var row = el('tr', {}, tb);
        var td = el('td', {}, row); el('a', { href: l.href, text: l.n + '. ' + l.title }, td);
        D.outcomes.forEach(function (o) {
          var v = l.co.indexOf(o.id) >= 0 ? '●' : (l.also || []).indexOf(o.id) >= 0 ? '○' : '';
          el('td', { 'class': 'co ' + coClass(o.id), 'data-col': o.id, text: v, 'aria-label': v === '●' ? 'main' : v ? 'supports' : 'no' }, row);
        });
      });
    });
    var cnt = el('tr', { 'class': 'sum' }, el('tfoot', {}, t1));
    el('td', { text: 'Lessons per outcome (main + supporting)' }, cnt);
    D.outcomes.forEach(function (o) {
      var a = lessons.filter(function (l) { return l.co.indexOf(o.id) >= 0; }).length;
      var b = lessons.filter(function (l) { return (l.also || []).indexOf(o.id) >= 0; }).length;
      el('td', { 'class': 'co ' + coClass(o.id), 'data-col': o.id, text: a + (b ? ' + ' + b : '') }, cnt);
    });

    if (D.po) {
      el('h3', { text: 'Outcome to programme outcome mapping (CO–PO and CO–PSO)' }, tw1);
      el('p', { 'class': 'note', text: 'H = high, M = medium, L = low, – = not mapped. From Tables 2a and 2b of the course plan. Hover a heading for the full programme outcome.' }, tw1);
      var wrap2 = el('div', { 'class': 'tblwrap' }, tw1);
      var t2 = el('table', { 'class': 'tbl cmap-tbl cmap-po' }, wrap2);
      var h2 = el('tr', {}, el('thead', {}, t2));
      el('th', { text: 'CO' }, h2);
      D.po.forEach(function (p) { el('th', { title: p.id + ': ' + p.name, text: p.id }, h2); });
      var b2 = el('tbody', {}, t2);
      D.outcomes.forEach(function (o) {
        var r = el('tr', { 'data-row': o.id, 'class': coClass(o.id) }, b2);
        var td = el('td', {}, r); el('button', { type: 'button', 'data-co': o.id, title: o.text, html: '<i></i>' + o.id }, td);
        D.po.forEach(function (p) { var v = (o.map || {})[p.id]; el('td', { 'class': v ? 'lv lv-' + v : 'lv', text: v || '–', title: v ? o.id + ' → ' + p.id + ': ' + LEVEL[v] : '' }, r); });
      });
    }

    /* ---------- highlighting ---------- */
    function infoFor(l) {
      var s = '<div class="ih"><span class="pill">Lesson ' + l.n + '</span><b>' + l.title + '</b></div><ul class="ico">';
      l.co.concat(l.also || []).forEach(function (id) {
        var o = CO[id], main = l.co.indexOf(id) >= 0;
        s += '<li class="' + coClass(id) + '"><i></i><b>' + id + '</b>' + (main ? '' : ' <span class="muted">(supports)</span>') + ' ' + o.text + ' <span class="bl">' + o.bloom + '</span></li>';
      });
      return s + '</ul><a class="go" href="' + l.href + '">Open lesson ' + l.n + ' →</a>';
    }
    function infoCO(id) {
      var o = CO[id];
      var main = lessons.filter(function (l) { return l.co.indexOf(id) >= 0; });
      var sup = lessons.filter(function (l) { return (l.also || []).indexOf(id) >= 0; });
      var list = function (a) { return a.map(function (l) { return '<a href="' + l.href + '">' + l.n + '. ' + (l.label || l.title) + '</a>'; }).join(''); };
      var s = '<div class="ih ' + coClass(id) + '"><span class="pill co"><i></i>' + id + '</span><b>' + o.text + '</b><span class="bl">Bloom: ' + o.bloom + '</span></div>';
      s += '<div class="irow"><span class="k">Main topics</span><span class="v">' + list(main) + '</span></div>';
      if (sup.length) s += '<div class="irow"><span class="k">Also built in</span><span class="v">' + list(sup) + '</span></div>';
      if (o.assess) s += '<div class="irow"><span class="k">Assessed in</span><span class="v plain">' + o.assess + '</span></div>';
      if (o.map && D.po) {
        var pm = D.po.filter(function (p) { return o.map[p.id]; }).map(function (p) { return '<span class="pochip lv-' + o.map[p.id] + '" title="' + p.name + '">' + p.id + ' · ' + LEVEL[o.map[p.id]] + '</span>'; }).join('');
        s += '<div class="irow"><span class="k">Programme outcomes</span><span class="v plain">' + pm + '</span></div>';
      }
      return s;
    }
    function defaultInfo() {
      return '<p class="note">Select a topic to open its lesson. Choose an outcome above (CO1 to CO6) to light up the topics that build it. ' +
        'Coloured dots on each topic show its outcomes: a filled dot is a main outcome, a ring means the topic also supports it.</p>';
    }
    function apply() {
      var id = state.co;
      box.classList.toggle('filtering', !!id);
      box.querySelectorAll('[data-co]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-co') || null) === id)); });
      nodes.forEach(function (n) {
        var hit = id && n.l.co.indexOf(id) >= 0, sup = id && (n.l.also || []).indexOf(id) >= 0;
        [n.a, n.link, n.li].forEach(function (e) {
          e.classList.remove('hit', 'sup', 'dim');
          e.classList.remove.apply(e.classList, D.outcomes.map(function (o) { return 'h-' + o.id.toLowerCase(); }));
          if (!id) return;
          e.classList.add(hit ? 'hit' : sup ? 'sup' : 'dim');
          if (hit || sup) e.classList.add('h-' + id.toLowerCase());
        });
      });
      box.querySelectorAll('[data-col]').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-col') === id); });
      box.querySelectorAll('[data-row]').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-row') === id); });
      info.innerHTML = id ? infoCO(id) : defaultInfo();
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-co]');
      if (!b) return;
      var id = b.getAttribute('data-co') || null;
      state.co = state.co === id ? null : id;
      apply();
      if (b.closest('.cmap-tables')) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    nodes.forEach(function (n) {
      var show = function () { info.innerHTML = infoFor(n.l); };
      var back = function () { info.innerHTML = state.co ? infoCO(state.co) : defaultInfo(); };
      n.a.addEventListener('mouseenter', show); n.a.addEventListener('focus', show);
      n.a.addEventListener('mouseleave', back); n.a.addEventListener('blur', back);
    });

    var m = /^#co([1-9])$/i.exec(location.hash);
    if (m && CO['CO' + m[1]]) { state.co = 'CO' + m[1]; setTimeout(function () { box.scrollIntoView(); }, 50); }
    apply();
    placeAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAll);
    window.addEventListener('resize', placeAll);
    requestAnimationFrame(function () { box.classList.add('ready'); });
  }

  document.querySelectorAll('.cmap').forEach(build);
})();
