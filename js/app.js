/* ============================================================
   SONARE — Bootstrap principal
   - Login por código (aluno)
   - Renderiza lista de aulas (aba Aulas) e detalhe da aula
   - Inicializa SonareApp (tabs, modais, progresso, alarme)
============================================================ */

// alarm.js e db.js são carregados como scripts clássicos e expõem window.SonareAlarm / window.SonareDB
const { getAll, put, getAlunoLogado, loginAluno, logout, seedIfNeeded } = window.SonareDB;
const { startAlarmLoop, stopAlarm } = window.SonareAlarm;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const escapeHTML = (s) => (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ============================================================
   LOGIN
============================================================ */
function showLogin() {
  $('#login-screen').style.display = '';
  $('#app-screen').style.display = 'none';
  const input = $('#codigo');
  input.value = '';
  $('#erro').textContent = '';
  input.focus();

  // Animação das barras é feita puramente em CSS (pulseLeft/pulseRight)
  // definida em <style> dentro do index.html

  input.addEventListener('input', () => {
    let v = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4, 8);
    input.value = v;
  }, { once: false });

  const submit = async () => {
    const codigo = input.value.trim();
    if (!codigo) { $('#erro').textContent = 'Digite um código.'; return; }
    const btn = $('#entrar');
    btn.disabled = true;
    $('#erro').textContent = 'Conferindo...';
    let r;
    try {
      r = await loginAluno(codigo);
    } finally {
      btn.disabled = false;
    }
    if (!r || r.erro) {
      $('#erro').textContent = {
        revogado: 'Este código foi desativado. Fale com seu professor.',
        offline: 'Sem conexão. Conecte à internet pra entrar pela primeira vez.',
      }[r?.erro] || 'Código inválido. Confira com seu professor.';
      return;
    }
    $('#erro').textContent = '';
    bootstrap();
  };

  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#entrar').onclick = submit;
}

/* ============================================================
   RENDER — Lista de aulas (aba Aulas)
============================================================ */
/* Aulas concluídas ficam guardadas à parte (por id), pra não se perderem
   quando a lista de aulas é recarregada do servidor. */
function getAulasConcluidas() {
  try { return new Set(JSON.parse(localStorage.getItem('aulasConcluidas') || '[]').map(String)); }
  catch { return new Set(); }
}
function setAulaConcluida(id, feita) {
  const s = getAulasConcluidas();
  feita ? s.add(String(id)) : s.delete(String(id));
  localStorage.setItem('aulasConcluidas', JSON.stringify([...s]));
  window.SonareProgresso?.salvar();
}

/** Substitui as aulas do aparelho pela lista do servidor (inclusive remoções). */
async function substituirAulasLocais(aulas) {
  await window.SonareDB.clear('aulas');
  for (const a of aulas) await put('aulas', { ...a, id: String(a.id) });
}

async function renderAulasAdmin(opts = {}) {
  // Sincroniza do Firebase (one-shot) pra ter as aulas mais recentes
  if (opts.sync !== false && window.FIREBASE_CONFIGURED && window.firebase) {
    try {
      const snap = await window.firebase.database().ref('/aulas').once('value');
      const fbAulas = Object.entries(snap.val() || {}).map(([id, a]) => ({ ...a, id }));
      await substituirAulasLocais(fbAulas);
    } catch (e) {
      console.warn('Firebase sync (aulas) falhou — usando aulas salvas:', e.message);
    }
  }

  const concluidas = getAulasConcluidas();
  const todasAulas = (await getAll('aulas')).map(a => ({ ...a, concluida: concluidas.has(String(a.id)) }));

  // Filtra por nível do aluno (se aluno não tem nível, vê tudo)
  const aluno = await getAlunoLogado();
  const nivelAluno = aluno?.nivel || null;
  const aulas = nivelAluno
    ? todasAulas.filter(a => !a.nivel || a.nivel === nivelAluno)
    : todasAulas;

  const container = $('#aulas-admin-list');
  if (!container) return;
  if (aulas.length === 0) {
    container.innerHTML = `<div class="empty-state"><strong>Nenhuma aula no seu nível</strong>${nivelAluno ? `Seu nível é "${nivelAluno}". Peça pro professor publicar conteúdo deste nível.` : 'Peça pro seu professor publicar conteúdo pelo painel admin.'}</div>`;
    return;
  }
  container.innerHTML = aulas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(a => `
    <article class="lesson-card ${a.concluida ? 'done' : ''}" data-id="${a.id}">
      <div class="lesson-card-head">
        <div>
          <h3 class="lesson-card-title">${escapeHTML(a.titulo)}</h3>
          <div class="lesson-card-meta">
            ${a.tipo ? `<span>${a.tipo}</span>` : ''}
            ${a.instrumento ? `<span> · ${escapeHTML(a.instrumento)}</span>` : ''}
            ${a.professor ? `<span> · ${escapeHTML(a.professor)}</span>` : ''}
            ${a.concluida ? `<span> · ✓ concluída</span>` : ''}
          </div>
        </div>
      </div>
      ${a.descricao ? `<p style="color: var(--cream-dim); font-size: .85rem; margin-top: 8px;">${escapeHTML(a.descricao)}</p>` : ''}
    </article>
  `).join('');

  $$('.lesson-card[data-id]').forEach(card => {
    card.addEventListener('click', () => renderAula(card.dataset.id));
  });
}

/* ============================================================
   RENDER — Detalhe da aula (modal inline)
============================================================ */
async function renderAula(id) {
  const aulas = await getAll('aulas');
  // Compara id como string ou number (Firebase pode vir string, IndexedDB number)
  const aula = aulas.find(a => String(a.id) === String(id));
  if (aula) aula.concluida = getAulasConcluidas().has(String(aula.id));
  if (!aula) {
    console.warn('[aula] não encontrada, id=', id, 'aulas=', aulas.map(a => a.id));
    return;
  }

  const media = renderMedia(aula);
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content wide">
      <button class="modal-close">&times;</button>
      <h2>${escapeHTML(aula.titulo)}</h2>
      <div class="lesson-card-meta" style="margin-bottom: 16px;">
        ${aula.instrumento ? `<span>${escapeHTML(aula.instrumento)}</span>` : ''}
        ${aula.professor ? `<span> · ${escapeHTML(aula.professor)}</span>` : ''}
      </div>
      ${aula.descricao ? `<p style="color: var(--cream-dim); margin-bottom: 16px;">${escapeHTML(aula.descricao)}</p>` : ''}
      ${media}
      <div class="lesson-detail-actions">
        <button class="secondary" data-close>Voltar</button>
        <button class="primary" id="concluir">${aula.concluida ? '✓ Concluída' : 'Marcar como concluída'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close], .modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#concluir').addEventListener('click', async () => {
    aula.concluida = !aula.concluida;
    setAulaConcluida(aula.id, aula.concluida);
    modal.querySelector('#concluir').textContent = aula.concluida ? '✓ Concluída' : 'Marcar como concluída';
    if (aula.concluida) SonareApp.addPracticeMinutes(5); // não soma minutos ao desmarcar
    SonareApp.updateProgress();
    renderAulasAdmin();
  });
}

function renderMedia(aula) {
  if (aula.tipo === 'texto') {
    return `<div class="lesson-detail-text">${escapeHTML(aula.texto || aula.midia || '')}</div>`;
  }
  if (!aula.midia) return '';
  const url = aula.midia;
  if (aula.tipo === 'video') return `<div class="lesson-detail-body"><video controls src="${escapeHTML(url)}" preload="metadata"></video></div>`;
  if (aula.tipo === 'audio') return `<div class="lesson-detail-body"><audio controls src="${escapeHTML(url)}" preload="metadata"></audio></div>`;
  if (aula.tipo === 'pdf')   return `<div class="lesson-detail-body"><iframe src="${escapeHTML(url)}"></iframe></div>`;
  return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">Abrir conteúdo</a>`;
}

/* ============================================================
   BOOTSTRAP — depois do login
============================================================ */
async function bootstrap() {
  const aluno = await getAlunoLogado();
  if (!aluno) return showLogin();

  $('#login-screen').style.display = 'none';
  $('#app-screen').style.display = '';
  document.body.classList.add('app-loaded');

  const primeiroNome = aluno.nome.split(' ')[0];
  $('#aluno-nome').textContent = primeiroNome;
  $('#home-nome').textContent = primeiroNome;

  // Wire up sair
  $('#sair-btn').onclick = async () => {
    if (!confirm('Tem certeza que quer sair?')) return;
    // Envia o progresso e limpa do aparelho (o próximo aluno não herda)
    try { await window.SonareProgresso?.enviarAgora(); } catch {}
    for (const k of window.SonareProgresso?.CHAVES || []) localStorage.removeItem(k);
    await logout();
    stopAlarm();
    location.reload();
  };

  // Traz o progresso salvo na nuvem (troca de celular, navegador limpo...)
  if (window.SonareProgresso) {
    window.SonareProgresso.carregar(aluno.id).catch(e => console.warn('[progresso]', e));
  }

  // Render lista de aulas
  await renderAulasAdmin();

  // Carrega conteúdo editável (teoria/exerc/lições/músicas) do servidor
  // antes de inicializar SonareApp (que precisa de CHORDS, SONGS_LIBRARY etc)
  await loadConteudo();

  // Carrega alarme do aluno logado (do Firebase em tempo real)
  // window.SonareAlarmConfig é usado pelo alarm.js pra checar se deve disparar
  if (window.loadAlunoAlarmeFirebase && aluno?.id) {
    try {
      window.loadAlunoAlarmeFirebase(aluno.id, (cfg) => {
        window.SonareAlarmConfig = cfg;
      });
    } catch (e) {
      console.warn('Alarme Firebase falhou, usando cache local:', e.message);
      const local = await window.SonareDB.getConfig();
      if (local) window.SonareAlarmConfig = local;
    }
  }

  // Inicializa SonareApp (tabs + modais + features)
  SonareApp.init();

  // Escutar aulas em tempo real do Firebase (atualiza IDB quando professor salva)
  if (window.loadAulasFirebase) {
    try {
      // Quando o professor adiciona/exclui uma aula, a lista atualiza na hora
      // (firebase-sync.js já regrava as aulas no aparelho antes de chamar aqui)
      window.loadAulasFirebase(() => renderAulasAdmin({ sync: false }));
    } catch (e) {
      console.warn('Firebase listener:', e.message);
    }
  }

  // Service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.warn('SW falhou:', e);
    }
  }

  // Aulas de exemplo só no modo sem servidor (com Firebase, as aulas vêm de lá;
  // antes as de exemplo apareciam misturadas com as do professor)
  if (!window.FIREBASE_CONFIGURED) {
    try {
      const seed = await fetch('./data/seed.json').then(r => r.ok ? r.json() : null).catch(() => null);
      if (seed) await seedIfNeeded(seed);
      await renderAulasAdmin();
    } catch {}
  }

  // Alarme
  startAlarmLoop();

  // Garante que SonareApp (orquestrador de abas) é inicializado
  // quando o aluno loga (caso DOMContentLoaded já tenha passado)
  if (window.SonareApp && typeof window.SonareApp.init === 'function') {
    try {
      if (!window.__sonareAppInited) {
        window.SonareApp.init();
        window.__sonareAppInited = true;
      }
    } catch (e) {
      console.warn('[bootstrap] SonareApp init falhou:', e);
    }
  }

}

/* ============================================================
   STARTUP
============================================================ */
(async () => {
  const aluno = await getAlunoLogado();
  if (!aluno) return showLogin();
  bootstrap();

  // Em segundo plano: confere no servidor se o código ainda vale.
  // Se o professor revogou/excluiu o aluno, desloga. Sem internet, segue offline.
  if (window.FIREBASE_CONFIGURED && window.checarAlunoFirebase) {
    try {
      const sessao = await window.SonareDB.getSessao();
      const status = await window.checarAlunoFirebase(String(aluno.id), sessao?.codigo);
      if (status === 'revogado') {
        await logout();
        stopAlarm();
        alert('Seu acesso foi desativado ou expirou. Digite o código de novo ou fale com seu professor.');
        location.reload();
      }
    } catch (e) {
      console.warn('[login] checagem falhou:', e);
    }
  }
})();
