/* Read-only Jupyter notebook viewer
   ---------------------------------
   Shows any .ipynb file on a page, like Jupyter does, without installing anything.
   Students see the text, the code and any saved outputs (printed text, plots, tables).

   HOW TO USE (on any page):
     1. Put the .ipynb file in a "notebooks" folder next to the page.
     2. Add this line where the notebook should appear:
          <div class="ipynb" data-src="notebooks/my-notebook.ipynb"></div>
     3. Near the end of the page, before </body>, add:
          <script src="../../assets/js/ipynb-view.js"></script>
        (and the KaTeX lines in <head> if the notebook has equations).

   Plots only appear if they were saved in the notebook: run all cells in Jupyter,
   press Save, then replace the .ipynb file. */
(function () {
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function src(x) { return Array.isArray(x) ? x.join('') : (x || ''); }
  function stripAnsi(s) { return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, ''); }

  /* ---------- syntax colouring (Julia and Python) ---------- */
  var KW = {
    julia: 'using|import|function|end|for|in|if|elseif|else|while|return|let|begin|do|const|true|false|nothing|struct|mutable|module|try|catch|finally|break|continue|global|local',
    python: 'import|from|as|def|class|return|for|in|if|elif|else|while|with|try|except|finally|raise|lambda|pass|break|continue|and|or|not|is|None|True|False|yield|global'
  };
  function highlight(code, lang) {
    var py = lang === 'python';
    var rx = new RegExp((py ? '(#[^\\n]*)' : '(#=[\\s\\S]*?=#|#[^\\n]*)') +
      '|("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"' + (py ? '|\'(?:\\\\.|[^\'\\\\\\n])*\'' : '') + ')' +
      '|\\b(' + (KW[lang] || KW.julia) + ')\\b|(@\\w+)|(\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?)|([A-Za-z_\\u00C0-\\u1FFF][\\w\\u00C0-\\u1FFF!]*)(?=\\()', 'g');
    var out = '', last = 0, m;
    while ((m = rx.exec(code))) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'm' : m[5] ? 'n' : 'f';
      out += '<span class="tok-' + cls + '">' + esc(m[0]) + '</span>';
      last = rx.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  /* ---------- a small Markdown renderer ---------- */
  function inline(s) {
    var keep = [];
    function hold(html) { keep.push(html); return '\u0000' + (keep.length - 1) + '\u0000'; }
    s = s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, function (m) { return hold(esc(m)); })   // maths: left for KaTeX
         .replace(/`([^`]+)`/g, function (_, c) { return hold('<code>' + esc(c) + '</code>'); });
    s = esc(s)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, a, u) { return /^(https?:|data:image\/|[\w.\/-])/.test(u) ? '<img alt="' + a + '" src="' + u + '">' : a; })
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) { return /^(https?:|mailto:|#|[\w.\/-])/.test(u) ? '<a href="' + u + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>' : t; })
      .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, function (_, a, b) { return '<b>' + (a || b) + '</b>'; })
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<i>$2</i>')
      .replace(/ {2,}\n/g, '<br>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return keep[+i]; });
  }
  function markdown(text) {
    var lines = text.replace(/\r/g, '').split('\n'), html = '', i = 0;
    while (i < lines.length) {
      var l = lines[i], m;
      if (!l.trim()) { i++; continue; }
      if ((m = l.match(/^\s*```\s*(\w*)/))) {                     // fenced code
        var code = []; i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
        i++; html += '<pre class="ipynb-mdcode"><code>' + highlight(code.join('\n'), m[1] || 'julia') + '</code></pre>'; continue;
      }
      if ((m = l.match(/^(#{1,6})\s+(.*)/))) { var n = Math.min(m[1].length + 1, 6); html += '<h' + n + '>' + inline(m[2].replace(/\s*#+\s*$/, '')) + '</h' + n + '>'; i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { html += '<hr>'; i++; continue; }
      if (/^\s*\$\$/.test(l)) {                                    // display maths block
        var eq = [l]; if (!/\$\$.*\$\$/.test(l)) { i++; while (i < lines.length && !/\$\$/.test(lines[i])) eq.push(lines[i++]); eq.push(lines[i] || ''); }
        html += '<div class="eq">' + esc(eq.join('\n')) + '</div>'; i++; continue;
      }
      if (/^\s*>/.test(l)) { var q = []; while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, '')); html += '<blockquote>' + markdown(q.join('\n')) + '</blockquote>'; continue; }
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {   // table
        var row = function (r) { return r.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return inline(c.trim()); }); };
        var head = row(l); i += 2; var body = '';
        while (i < lines.length && /^\s*\|/.test(lines[i])) body += '<tr><td>' + row(lines[i++]).join('</td><td>') + '</td></tr>';
        html += '<div class="ipynb-table"><table><thead><tr><th>' + head.join('</th><th>') + '</th></tr></thead><tbody>' + body + '</tbody></table></div>'; continue;
      }
      if ((m = l.match(/^\s*([-*+]|\d+[.)])\s+/))) {                // lists
        var ol = /\d/.test(m[1]), items = [];
        while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
          var it = lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) it += ' ' + lines[i++].trim();
          items.push('<li>' + inline(it) + '</li>');
        }
        html += (ol ? '<ol>' : '<ul>') + items.join('') + (ol ? '</ol>' : '</ul>'); continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*```|\s*>|\s*\$\$|\s*([-*+]|\d+[.)])\s+)/.test(lines[i])) para.push(lines[i++]);
      if (!para.length) para.push(lines[i++]);
      html += '<p>' + inline(para.join('\n')) + '</p>';
    }
    return html;
  }

  /* ---------- outputs ---------- */
  function outputNode(o) {
    var d = o.data || {};
    if (o.output_type === 'stream') return el('pre', 'nb-stdout' + (o.name === 'stderr' ? ' ipynb-err' : ''), esc(stripAnsi(src(o.text))));
    if (o.output_type === 'error') return el('pre', 'nb-stdout ipynb-err', esc(stripAnsi((o.traceback || []).join('\n') || (o.ename + ': ' + o.evalue))));
    if (d['image/png'] || d['image/jpeg']) {
      var t = d['image/png'] ? 'image/png' : 'image/jpeg', img = el('img', 'ipynb-img');
      img.src = 'data:' + t + ';base64,' + src(d[t]).replace(/\s/g, ''); img.alt = 'Plot output'; img.loading = 'lazy'; return img;
    }
    if (d['image/svg+xml']) { var sv = el('img', 'ipynb-img'); sv.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src(d['image/svg+xml'])); sv.alt = 'Plot output'; return sv; }
    if (d['text/html']) { var h = el('div', 'ipynb-html'); h.innerHTML = src(d['text/html']); h.querySelectorAll('script').forEach(function (s) { s.remove(); }); return h; }
    if (d['text/markdown']) return el('div', 'notes', markdown(src(d['text/markdown'])));
    if (d['text/latex']) return el('div', 'eq', esc(src(d['text/latex'])));
    if (d['text/plain']) return el('pre', 'nb-stdout', esc(stripAnsi(src(d['text/plain']))));
    return null;
  }

  function copy(text, b) {
    var done = function () { var t = b.textContent; b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = t; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {}); else done();
  }

  /* ---------- draw one notebook ---------- */
  function render(box, nb, url) {
    var lang = ((nb.metadata && (nb.metadata.language_info || {}).name) || (nb.metadata && (nb.metadata.kernelspec || {}).language) || 'julia').toLowerCase();
    var cells = nb.cells || [], hasOut = cells.some(function (c) { return c.outputs && c.outputs.length; });
    var file = url.split('/').pop();
    box.innerHTML = '';
    var bar = el('div', 'ipynb-head');
    bar.appendChild(el('div', 'ipynb-file', '<span class="ipynb-badge">' + esc(lang) + '</span><b>' + esc(file) + '</b><span>' + cells.length + ' cells · read-only</span>'));
    var dl = el('a', 'nb-dl', '⬇ Download .ipynb'); dl.href = url; dl.setAttribute('download', file);
    bar.appendChild(dl); box.appendChild(bar);
    if (!hasOut) box.appendChild(el('p', 'ipynb-note', 'This notebook was saved without outputs, so you see the text and code only. Download it and run each cell (Shift + Enter) to make the plots.'));
    var n = 0;
    cells.forEach(function (c) {
      var text = src(c.source);
      if (c.cell_type === 'markdown') { var md = el('div', 'notes ipynb-md', markdown(text)); box.appendChild(md); return; }
      if (c.cell_type !== 'code') { box.appendChild(el('pre', 'nb-stdout', esc(text))); return; }
      n++;
      var row = el('div', 'nb-cell');
      row.appendChild(el('div', 'nb-prompt', 'In [' + (c.execution_count != null ? c.execution_count : ' ') + ']:'));
      var code = el('div', 'nb-code', '<pre><code>' + highlight(text, lang) + '</code></pre>');
      var tools = el('div', 'nb-bar'), cb = el('button', null, 'Copy code'); cb.type = 'button';
      cb.onclick = function () { copy(text, cb); }; tools.appendChild(cb); code.appendChild(tools);
      row.appendChild(code); box.appendChild(row);
      var outs = (c.outputs || []).map(outputNode).filter(Boolean);
      if (outs.length) {
        var orow = el('div', 'nb-cell nb-out');
        orow.appendChild(el('div', 'nb-prompt', c.execution_count != null ? 'Out[' + c.execution_count + ']:' : ''));
        var ob = el('div', 'nb-outbox'); outs.forEach(function (o) { ob.appendChild(o); });
        orow.appendChild(ob); box.appendChild(orow);
      }
    });
    if (window.renderMathInElement) renderMathInElement(box, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'], throwOnError: false });
    else window.addEventListener('load', function () { if (window.renderMathInElement) renderMathInElement(box, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'], throwOnError: false }); });
  }

  document.querySelectorAll('.ipynb[data-src]').forEach(function (box) {
    var url = box.getAttribute('data-src');
    box.innerHTML = '<p class="ipynb-note">Loading the notebook…</p>';
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (nb) { render(box, nb, url); })
      .catch(function () {
        box.innerHTML = '<p class="ipynb-note">The notebook could not be shown here' + (location.protocol === 'file:' ? ' (browsers block this when a page is opened straight from your computer; it works on the live website)' : '') +
          '. <a href="' + esc(url) + '" download>Download it instead</a>.</p>';
      });
  });
})();
