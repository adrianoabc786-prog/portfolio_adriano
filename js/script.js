/* Portfólio Adriano Veloso: JavaScript puro, organizado por funcionalidade */
'use strict';
document.documentElement.classList.add('js');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const safe = fn => { try { fn(); } catch (e) { console.error(`[portfólio] ${fn.name}:`, e); } };

/* ---- Projetos: preencha "repo" com o link do GitHub quando publicar (vazio = botão desativado) ---- */
const PROJECTS = [
  { id: 'text2qr', nome: 'Text2QR — Text to QR Code Generator', tags: ['c'], langs: ['C'], c: ['#5b49e6', '#2563eb'], sigla: 'QR',
    tech: ['libqrencode', 'libpng', 'Makefile', 'Terminal'], repo: '', demo: 'tab-qr',
    desc: 'Aplicação de terminal em C que transforma texto, frases ou URLs em QR Codes reais, salvos em PNG e SVG.',
    problema: 'Gerar um QR Code costuma exigir sites de terceiros. Este programa faz isso localmente, sem enviar o conteúdo para a internet.',
    objetivo: 'Praticar C com bibliotecas externas, manipulação de arquivos, tratamento de erros e código organizado em funções.',
    funcs: ['Aceita qualquer texto, inclusive acentos (UTF-8)', 'Saída em PNG, SVG ou ambos, informando o caminho criado', 'Valida entrada vazia e tamanho máximo', 'Pré-visualização no terminal e modo interativo'],
    org: 'src/main.c com funções independentes (validate_input, build_qr, write_png, write_svg, preview, generate), Makefile e testes em shell (tests/run_tests.sh).',
    uso: ['sudo apt install build-essential libqrencode-dev libpng-dev', 'cd projects/text2qr && make', './text2qr "https://exemplo.com"', 'make test'] },
  { id: 'linkshort', nome: 'LinkShort — Smart URL Shortener', tags: ['python', 'web'], langs: ['Python', 'SQL', 'JavaScript'], c: ['#2563eb', '#0ea5a4'], sigla: 'LS',
    tech: ['Flask', 'SQLite', 'HTML5', 'CSS3', 'JavaScript'], repo: '', demo: 'tab-ls',
    desc: 'Encurtador de links com Flask e SQLite, redirecionamento, histórico e dashboard de acessos.',
    problema: 'URLs longas são ruins de compartilhar e não mostram quantas pessoas as acessaram.',
    objetivo: 'Praticar back-end com banco de dados, validação de entradas, segurança básica e uma interface responsiva.',
    funcs: ['Código aleatório único ou personalizado', 'Redirecionamento 302 e contagem de acessos', 'Histórico, pesquisa, ordenação, copiar e excluir com confirmação', 'Dashboard: total de links e acessos, mais acessados, último acesso'],
    org: 'app.py (fábrica create_app, rotas e API JSON), templates/, static/ e tests/test_app.py. Consultas SQL parametrizadas, só URLs http/https, sem IP nem user-agent armazenados.',
    uso: ['cd projects/linkshort', 'python3 -m venv .venv && source .venv/bin/activate', 'pip install -r requirements.txt && python app.py', 'Abra http://127.0.0.1:5000  ·  testes: python -m unittest discover -s tests'] },
  { id: 'taskflow', nome: 'TaskFlow — Task Management System', tags: ['java'], langs: ['Java'], c: ['#7c3aed', '#db2777'], sigla: 'TF',
    tech: ['Java', 'Swing', 'POO', 'Collections', 'Streams'], repo: '', demo: 'tab-tf',
    desc: 'Gerenciador de tarefas em Java com painel Kanban gráfico e persistência em arquivo.',
    problema: 'Acompanhar tarefas em listas soltas dificulta ver o que está pendente, em andamento ou concluído.',
    objetivo: 'Praticar orientação a objetos, separação de responsabilidades, Collections e persistência de dados.',
    funcs: ['Criar, editar e excluir (com confirmação)', 'Prioridade, categoria e status', 'Kanban de três colunas com movimentação entre elas', 'Busca por título, filtro por prioridade, contadores e percentual concluído'],
    org: 'Pacote taskflow: Task, Status, Priority (modelo), TaskRepository (arquivo), TaskService (regras) e KanbanApp (Swing). Testes em test/TaskServiceTest.java.',
    uso: ['Requer JDK 17+', 'cd projects/taskflow', './build.sh        (abre o app)', './build.sh test   (roda os testes)'] }
];

function themeToggle() {
  const root = document.documentElement, btn = $('#themeBtn');
  let saved = null;
  try { saved = localStorage.getItem('tema'); } catch (_) {}
  root.dataset.theme = saved || 'dark';
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('tema', next); } catch (_) {}
  });
}

function mobileMenu() {
  const b = $('#burger'), m = $('#menu');
  const set = o => { m.classList.toggle('open', o); b.setAttribute('aria-expanded', o); };
  b.addEventListener('click', () => set(!m.classList.contains('open')));
  m.addEventListener('click', e => e.target.tagName === 'A' && set(false));
  document.addEventListener('keydown', e => e.key === 'Escape' && set(false));
}

function scrollEffects() {
  const h = $('#header'), p = $('#progress'), t = $('#topBtn');
  const on = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    h.classList.toggle('scrolled', y > 20);
    t.classList.toggle('show', y > 600);
    p.style.width = (max > 0 ? y / max * 100 : 0) + '%';
  };
  addEventListener('scroll', on, { passive: true }); on();
  t.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  const links = $$('.menu a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => io.observe(s));
}

function reveal() {
  const io = new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.rv').forEach(el => io.observe(el));
}

function typing() {
  const el = $('#typed'), text = 'Estudante de Engenharia de Software';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
  let i = 0;
  const step = () => { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(step, 55); };
  setTimeout(step, 600);
}

function projects() {
  const grid = $('#projectGrid'), dlg = $('#projModal'), body = $('#pmBody');
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  const btn = (txt, ghost, onclick, url) => {
    const l = el(url !== undefined ? 'a' : 'button', 'btn btn-sm' + (ghost ? ' ghost' : '') + (url === '' ? ' off' : ''), txt);
    if (url !== undefined) { l.href = url || '#'; if (url) { l.target = '_blank'; l.rel = 'noopener noreferrer'; } else l.setAttribute('aria-disabled', 'true'); }
    else { l.type = 'button'; l.addEventListener('click', onclick); }
    return l;
  };
  const list = (title, items, ordered) => {
    const d = el('div', 'pm-sec'); d.append(el('h4', '', title));
    const ul = el(ordered ? 'ol' : 'ul'); items.forEach(i => ul.append(el('li', '', i))); d.append(ul); return d;
  };
  const text = (title, t) => { const d = el('div', 'pm-sec'); d.append(el('h4', '', title), el('p', '', t)); return d; };

  function open(p) {
    body.replaceChildren();
    const h = el('h3', '', p.nome); h.id = 'pmTitle';
    const tags = el('ul', 'tags'); p.tech.forEach(t => tags.append(el('li', '', t)));
    body.append(h, el('p', 'demo-flag', 'Desenvolvido e testado localmente · ainda não publicado'), text('Visão geral', p.desc),
      text('Problema que resolve', p.problema), text('Objetivo', p.objetivo), list('Funcionalidades', p.funcs));
    const t = el('div', 'pm-sec'); t.append(el('h4', '', 'Tecnologias utilizadas'), tags);
    body.append(t, text('Organização técnica', p.org), list('Como usar', p.uso, true),
      text('Capturas de tela', 'Ainda não incluídas. Elas serão adicionadas à pasta assets/images depois de executar cada aplicação; use a demonstração interativa para ver o comportamento.'));
    const acts = el('div', 'acts');
    acts.append(btn('Testar demonstração', false, () => { dlg.close(); const tb = $(`[data-tab="${p.demo.slice(4)}"]`); tb && tb.click(); $('#demos').scrollIntoView({ behavior: 'smooth' }); }),
      btn('Código no GitHub', true, null, p.repo));
    body.append(el('p', 'mut tiny', p.repo ? 'Repositório: ' + p.repo : 'Repositório ainda não publicado: o link será cadastrado aqui.'), acts);
    dlg.showModal();
  }
  $('#pmClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  const render = f => {
    grid.replaceChildren();
    PROJECTS.filter(p => f === 'todos' || p.tags.includes(f)).forEach(p => {
      const a = el('article', 'card glass proj');
      const pv = el('div', 'pv', p.sigla); pv.style.setProperty('--a', p.c[0]); pv.style.setProperty('--c', p.c[1]); pv.setAttribute('aria-hidden', 'true');
      const pb = el('div', 'pb'); const tags = el('ul', 'tags'); [...p.langs, ...p.tech.filter(t => !p.langs.includes(t))].forEach(t => tags.append(el('li', '', t)));
      const acts = el('div', 'acts'); acts.append(btn('Ver projeto', false, () => open(p)), btn('Código no GitHub', true, null, p.repo));
      pb.append(el('span', 'demo', 'Não publicado · prévia ilustrativa'), el('h3', '', p.nome), el('p', 'mut', p.desc), tags, acts);
      a.append(pv, pb); grid.append(a);
    });
    if (!grid.children.length) grid.textContent = 'Nenhum projeto nesta categoria.';
  };
  $$('.f').forEach(b => b.addEventListener('click', () => { $$('.f').forEach(x => x.classList.toggle('active', x === b)); render(b.dataset.f); }));
  render('todos');
}

function contactForm() {
  const form = $('#form'), status = $('#status');
  const rules = {
    nome: v => v.trim().length >= 3 || 'Informe seu nome (mín. 3 letras).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Informe um e-mail válido.',
    msg: v => v.trim().length >= 10 || 'Escreva ao menos 10 caracteres.'
  };
  const check = el => {
    const r = rules[el.name](el.value), ok = r === true;
    el.classList.toggle('bad', !ok); el.classList.toggle('ok', ok);
    el.nextElementSibling.textContent = ok ? '' : r; return ok;
  };
  $$('input,textarea', form).forEach(el => el.addEventListener('blur', () => check(el)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = $$('input,textarea', form).map(check).every(Boolean);
    status.className = 'status ' + (ok ? 'ok' : 'err');
    if (!ok) { status.textContent = 'Corrija os campos destacados.'; return; }
    const d = new FormData(form);
    const body = `${d.get('msg')}\n\n${d.get('nome')} (${d.get('email')})`;
    status.textContent = 'Tudo certo! Abrindo seu aplicativo de e-mail…';
    location.href = `mailto:adrianoabc786@gmail.com?subject=${encodeURIComponent('Contato pelo portfólio: ' + d.get('nome'))}&body=${encodeURIComponent(body)}`;
  });
}

function cvDownload() {
  $('#cvBtn').addEventListener('click', async e => {
    if (location.protocol === 'file:') return; // abrindo direto do disco: download nativo
    try {
      const r = await fetch(e.currentTarget.href, { method: 'HEAD' });
      if (!r.ok) throw new Error(r.status);
    } catch (err) {
      e.preventDefault(); alert('Não foi possível baixar o currículo agora. Tente novamente mais tarde.');
    }
  });
}

[themeToggle, mobileMenu, scrollEffects, reveal, typing, projects, contactForm, cvDownload].forEach(safe);
$('#year').textContent = new Date().getFullYear();
