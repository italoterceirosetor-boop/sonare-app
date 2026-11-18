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
    const aluno = await loginAluno(codigo);
    if (!aluno) {
      $('#erro').textContent = 'Código inválido ou revogado. Confira com seu professor.';
      return;
    }
    bootstrap();
  };

  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#entrar').onclick = submit;
}

/* ============================================================
   RENDER — Lista de aulas (aba Aulas)
============================================================ */
async function renderAulasAdmin() {
  // Sincroniza do Firebase (one-shot) pra ter as aulas mais recentes
  if (window.firebase) {
    try {
      const fbRaw = await new Promise((resolve) => {
        const ref = window.firebase?.database?.()?.ref?.('/aulas');
        if (!ref) return resolve(null);
        ref.once('value', (snap) => resolve(snap.val() || null), () => resolve(null));
      });
      if (fbRaw) {
        const fbAulas = Object.entries(fbRaw).map(([id, a]) => ({ ...a, id }));
        // Mescla com local (Firebase = source of truth)
        const locais = await getAll('aulas');
        const localByCode = new Map(); // não tem codigo, usa id
        for (const fb of fbAulas) {
          const local = locais.find(l => String(l.id) === String(fb.id));
          await put('aulas', { ...fb, id: local?.id || fb.id });
        }
        console.log(`[app] Sincronizou ${fbAulas.length} aulas do Firebase`);
      }
    } catch (e) {
      console.warn('Firebase sync (aulas) falhou:', e.message);
    }
  }

  const todasAulas = await getAll('aulas');

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
    await put('aulas', aula);
    modal.querySelector('#concluir').textContent = aula.concluida ? '✓ Concluída' : 'Marcar como concluída';
    SonareApp.addPracticeMinutes(5);
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
    await logout();
    stopAlarm();
    location.reload();
  };

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
      window.loadAulasFirebase(async (aulas) => {
        // Recarrega lista de aulas na aba atual
        const tabAtiva = document.querySelector('.tab-panel.active');
        if (tabAtiva && tabAtiva.id === 'tab-lessons') {
          // Limpa e regrava aulas no IDB
          await window.SonareDB.clear('aulas');
          for (const a of aulas) await window.SonareDB.put('aulas', a);
          renderAulasAdmin(); // re-renderiza só a lista
        } else {
          await window.SonareDB.clear('aulas');
          for (const a of aulas) await window.SonareDB.put('aulas', a);
        }
      });
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

  // Seed aulas (primeira vez)
  try {
    const seed = await fetch('./data/seed.json').then(r => r.ok ? r.json() : null).catch(() => null);
    if (seed) await seedIfNeeded(seed);
    await renderAulasAdmin();
  } catch {}

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
  if (aluno) {
    bootstrap();
  } else {
    showLogin();
  }
})();
