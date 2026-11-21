/* Demonstrações interativas: abas, Text2QR, LinkShort (simulação local) e TaskFlow (localStorage) */
'use strict';
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  const copy = async (t, el) => {
    try { await navigator.clipboard.writeText(t); el.textContent = 'Copiado!'; } catch (_) { el.textContent = 'Não foi possível copiar'; }
    setTimeout(() => (el.textContent = el.dataset.label), 1500);
  };
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };

  /* ---- Abas ---- */
  const tabs = $$('.tab');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { const on = x === t; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); $('#tab-' + x.dataset.tab).hidden = !on; });
  }));

  /* ---- Text2QR ---- */
  function qrDemo() {
    const txt = $('#qrText'), out = $('#qrOut'), err = $('#qrErr'), btns = ['#qrSvg', '#qrPng', '#qrCopy'].map(s => $(s));
    btns.forEach(b => (b.dataset.label = b.textContent));
    let qr = null, original = '';
    const Q = 4, SCALE = 8;
    $('#qrGen').addEventListener('click', () => {
      err.textContent = '';
      const v = txt.value;
      if (!v.trim()) { err.textContent = 'Digite um texto ou URL.'; return; }
      try {
        qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']; // acentos e caracteres especiais
        qr = qrcode(0, 'M'); qr.addData(v, 'Byte'); qr.make(); original = v;
      } catch (e) { qr = null; err.textContent = 'Texto longo demais para um QR Code.'; return; }
      out.innerHTML = svg(qr);
      btns.forEach(b => (b.disabled = false));
    });
    function svg(q) {
      const n = q.getModuleCount(), s = n + 2 * Q; let d = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + Q} ${y + Q}h1v1h-1z`;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s * SCALE}" height="${s * SCALE}" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="QR Code gerado"><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
    }
    $('#qrSvg').addEventListener('click', () => qr && save(new Blob([svg(qr)], { type: 'image/svg+xml' }), 'qrcode.svg'));
    $('#qrPng').addEventListener('click', () => {
      if (!qr) return;
      const n = qr.getModuleCount(), px = (n + 2 * Q) * SCALE, c = document.createElement('canvas'); c.width = c.height = px;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, px, px); g.fillStyle = '#000';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) g.fillRect((x + Q) * SCALE, (y + Q) * SCALE, SCALE, SCALE);
      c.toBlob(b => b ? save(b, 'qrcode.png') : (err.textContent = 'Falha ao gerar o PNG.'), 'image/png');
    });
    $('#qrCopy').addEventListener('click', e => copy(original, e.currentTarget));
  }

  /* ---- LinkShort (simulação local, sem backend) ---- */
  function validateUrl(raw) { // mesma regra do app Flask
    let u = (raw || '').trim();
    if (!u) return [null, 'Informe uma URL.'];
    if (u.length > 2048) return [null, 'URL muito longa.'];
    if (/\s/.test(u)) return [null, 'URL contém espaços ou caracteres inválidos.'];
    if (!u.includes('://')) u = 'https://' + u;
    try {
      const x = new URL(u);
      if (!['http:', 'https:'].includes(x.protocol) || !x.hostname || (!x.hostname.includes('.') && x.hostname !== 'localhost')) throw 0;
      return [u, null];
    } catch (_) { return [null, 'Use uma URL http(s) válida.']; }
  }
  function lsDemo() {
    const list = $('#lsList'), err = $('#lsErr'), KEY = 'ls_demo', A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const reserved = ['api', 'static', 'dashboard', 'health'];
    let links = store.get(KEY, []);
    const rand = () => { const b = crypto.getRandomValues(new Uint8Array(6)); return [...b].map(n => A[n % A.length]).join(''); };
    const draw = () => {
      list.replaceChildren();
      if (!links.length) { const li = document.createElement('li'); li.className = 'mut'; li.textContent = 'Nenhum link gerado ainda.'; list.append(li); return; }
      links.forEach(l => {
        const li = document.createElement('li'), info = document.createElement('div'), acts = document.createElement('div');
        const s = document.createElement('strong'); s.textContent = 'http://localhost:5000/' + l.code;
        const o = document.createElement('div'); o.className = 'mut tiny'; o.textContent = l.url + ' · criado em ' + l.at;
        info.append(s, o); acts.className = 'row';
        const mk = (t, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mini'; b.textContent = b.dataset.label = t; b.addEventListener('click', fn); acts.append(b); };
        mk('Copiar', e => copy(s.textContent, e.currentTarget));
        mk('Testar redirecionamento', () => window.open(l.url, '_blank', 'noopener,noreferrer'));
        mk('Excluir', () => { if (confirm('Excluir este link?')) { links = links.filter(x => x.code !== l.code); store.set(KEY, links); draw(); } });
        li.append(info, acts); list.append(li);
      });
    };
    $('#lsForm').addEventListener('submit', e => {
      e.preventDefault(); err.textContent = '';
      const [url, bad] = validateUrl($('#lsUrl').value);
      if (bad) { err.textContent = bad; return; }
      let code = $('#lsCode').value.trim();
      if (code) {
        if (!/^[A-Za-z0-9_-]{3,32}$/.test(code) || reserved.includes(code.toLowerCase())) { err.textContent = 'Código: 3 a 32 letras, números, - ou _ (palavras reservadas não valem).'; return; }
        if (links.some(l => l.code === code)) { err.textContent = 'Esse código já está em uso.'; return; }
      } else do { code = rand(); } while (links.some(l => l.code === code));
      links.unshift({ code, url, at: new Date().toLocaleString('pt-BR') }); store.set(KEY, links);
      e.target.reset(); draw();
    });
    draw();
  }

  /* ---- TaskFlow (Kanban em localStorage) ---- */
  function tfDemo() {
    const KEY = 'tf_demo', S = [['PENDING', 'Pendentes'], ['IN_PROGRESS', 'Em andamento'], ['DONE', 'Concluídas']], PL = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
    let tasks = store.get(KEY, []);
    const board = $('#tfBoard'), err = $('#tfErr');
    const commit = () => { store.set(KEY, tasks); draw(); };
    const clean = v => { v = (v || '').trim(); return !v ? ['', 'O título não pode ser vazio.'] : v.length > 120 ? ['', 'Máximo de 120 caracteres.'] : [v, '']; };
    function draw() {
      const q = $('#tfSearch').value.trim().toLowerCase(), f = $('#tfFilter').value;
      board.replaceChildren();
      S.forEach(([key, label], i) => {
        const col = document.createElement('div'); col.className = 'kcol';
        const n = tasks.filter(t => t.status === key).length, h = document.createElement('h4'); h.textContent = `${label} (${n})`; col.append(h);
        tasks.filter(t => t.status === key && (!f || t.pri === f) && t.title.toLowerCase().includes(q)).forEach(t => {
          const c = document.createElement('div'); c.className = 'kcard ' + t.pri;
          const b = document.createElement('b'); b.textContent = t.title; const sm = document.createElement('small'); sm.textContent = ` ${t.cat} · ${PL[t.pri]}`;
          const kb = document.createElement('div'); kb.className = 'kb';
          const mk = (txt, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'mini'; x.textContent = txt; x.addEventListener('click', fn); kb.append(x); };
          if (i > 0) mk('◀', () => { t.status = S[i - 1][0]; commit(); });
          if (i < 2) mk('▶', () => { t.status = S[i + 1][0]; commit(); });
          mk('Editar', () => {
            const [v, bad] = clean(prompt('Novo título:', t.title)); if (bad) { if (v !== null) err.textContent = bad; return; }
            const p = (prompt('Prioridade (baixa, média ou alta):', PL[t.pri]) || '').toLowerCase();
            t.title = v; t.pri = { baixa: 'LOW', 'média': 'MEDIUM', media: 'MEDIUM', alta: 'HIGH' }[p] || t.pri; err.textContent = ''; commit();
          });
          mk('Excluir', () => { if (confirm('Excluir "' + t.title + '"?')) { tasks = tasks.filter(x => x.id !== t.id); commit(); } });
          c.append(b, sm, kb); col.append(c);
        });
        board.append(col);
      });
      const done = tasks.filter(t => t.status === 'DONE').length;
      $('#tfStat').textContent = tasks.length ? `${tasks.length} tarefas · ${Math.round(100 * done / tasks.length)}% concluído` : 'Sem tarefas';
    }
    $('#tfForm').addEventListener('submit', e => {
      e.preventDefault(); const [v, bad] = clean($('#tfTitle').value);
      if (bad) { err.textContent = bad; return; }
      err.textContent = '';
      tasks.push({ id: Date.now() + Math.random(), title: v, cat: $('#tfCat').value.trim() || 'Geral', pri: $('#tfPri').value, status: 'PENDING' });
      e.target.reset(); $('#tfPri').value = 'MEDIUM'; commit();
    });
    $('#tfSearch').addEventListener('input', draw); $('#tfFilter').addEventListener('change', draw);
    draw();
  }

  [qrDemo, lsDemo, tfDemo].forEach(fn => { try { fn(); } catch (e) { console.error('[demos]', fn.name, e); } });
})();
