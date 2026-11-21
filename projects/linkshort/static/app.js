const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say = (t, ok) => { const m = $('#msg'); m.textContent = t; m.className = ok ? 'ok' : 'err'; };
async function api(path, opt = {}) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opt });
  const d = r.status === 204 ? null : await r.json();
  if (!r.ok) throw new Error(d?.error || 'Erro inesperado');
  return d;
}
async function load() {
  const [links, s] = await Promise.all([api(`/api/links?q=${encodeURIComponent($('#q').value)}&sort=${$('#sort').value}`), api('/api/stats')]);
  $('#stats').innerHTML = `<div class="card"><b>${s.total_links}</b><span>links criados</span></div><div class="card"><b>${s.total_visits}</b><span>acessos</span></div><div class="card"><b>${esc(s.last_access || '—')}</b><span>último acesso (UTC)</span></div>`;
  $('#top').innerHTML = s.top.map(t => `<li>${esc(t.code)}: ${t.visits}</li>`).join('') || '<li class="mut">Sem acessos ainda</li>';
  $('#hist').innerHTML = s.history.map(h => `<li>${esc(h.day)}: ${h.n}</li>`).join('') || '<li class="mut">Sem acessos ainda</li>';
  $('#list').innerHTML = links.map(l => `<div class="item"><div><p><a href="${esc(l.short_url)}" target="_blank" rel="noopener">${esc(l.short_url)}</a></p>
    <p class="mut">${esc(l.url)}</p><p class="mut">Criado: ${esc(l.created_at)} · ${l.visits} acessos · último: ${esc(l.last_access || '—')}</p></div>
    <div><button class="sec" data-copy="${esc(l.short_url)}">Copiar</button> <button class="sec del" data-del="${l.id}">Excluir</button></div></div>`).join('') || '<p class="mut">Nenhum link encontrado.</p>';
}
$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  try { const l = await api('/api/links', { method: 'POST', body: JSON.stringify({ url: $('#url').value, code: $('#code').value }) });
    say('Link criado: ' + l.short_url, true); e.target.reset(); load(); } catch (x) { say(x.message, false); }
});
$('#list').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.copy) { try { await navigator.clipboard.writeText(b.dataset.copy); say('Link copiado.', true); } catch { say('Não foi possível copiar.', false); } }
  if (b.dataset.del && confirm('Excluir este link? Essa ação não pode ser desfeita.')) {
    try { await api('/api/links/' + b.dataset.del, { method: 'DELETE' }); say('Link excluído.', true); load(); } catch (x) { say(x.message, false); } }
});
$('#q').addEventListener('input', load); $('#sort').addEventListener('change', load); load();
