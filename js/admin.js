/* ============================================================
   SONARE — Painel Admin
   - CRUD de aulas, alunos (gera código), conteúdo editável
   - Exportar/importar JSON
   - Configurar alarme por aluno (Firebase sync)
============================================================ */

const { getAll, put, del, clear, seedIfNeeded } = window.SonareDB;
const { showToast } = window.SonareAlarm;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const INSTRUMENTOS = ['violão', 'guitarra', 'bateria', 'teclado', 'baixo', 'canto'];
const PROFESSORES = ['Leonel Pollack', 'Lucas Stocco', 'Gesiel'];
const TIPOS = ['video', 'audio', 'pdf', 'texto'];

const escapeHTML = (s) => (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ============================================================
   GERAÇÃO DE CÓDIGO ÚNICO
============================================================ */
function gerarCodigo() {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const nums = '0123456789';
  let l = '', n = '';
  for (let i = 0; i < 4; i++) l += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 4; i++) n += nums[Math.floor(Math.random() * nums.length)];
  return `${l}-${n}`;
}

async function gerarCodigoUnico() {
  const existentes = await getAll('alunos');
  const usados = new Set(existentes.map(a => a.codigo));
  let codigo;
  do { codigo = gerarCodigo(); } while (usados.has(codigo));
  return codigo;
}

const DEFAULT_ALARME_ADMIN = {
  hora: 19,
  minuto: 0,
  dias: [1, 2, 3, 4, 5],
  ativo: true,
};

/* ============================================================
   RENDER PRINCIPAL
============================================================ */
let tab = 'aulas';

async function render() {
  const topbar = `
<div style="display:flex;justify-content:space-between;align-items:center;margin: 0 16px 16px">
      <span style="font-family: var(--mono); font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: var(--cream-dim)">Sonare · Admin</span>
      <span style="display:flex;gap:12px;align-items:center">
        <a class="topbar__action" href="./index.html">← App do aluno</a>
        <button class="btn btn--ghost" id="admin-logout">Sair</button>
      </span>
    </div>

    <div class="admin-tabs">
      <button class="admin-tab ${tab==='aulas'?'admin-tab--active':''}" data-tab="aulas">Aulas</button>
      <button class="admin-tab ${tab==='alunos'?'admin-tab--active':''}" data-tab="alunos">Alunos</button>
      <button class="admin-tab ${tab==='conteudo'?'admin-tab--active':''}" data-tab="conteudo">Conteúdo</button>
      <button class="admin-tab ${tab==='dados'?'admin-tab--active':''}" data-tab="dados">Dados</button>
    </div>
  `;

  $('#app').innerHTML = topbar;
  $('#admin-logout').addEventListener('click', () => window.adminSair && window.adminSair());
  $$('[data-tab]').forEach(b => {
    b.addEventListener('click', () => { tab = b.dataset.tab; render(); });
  });

  if (tab === 'aulas') await renderAulas();
  else if (tab === 'alunos') await renderAlunos();
  else if (tab === 'conteudo') await renderConteudo();
  else await renderDados();
}

/* ============================================================
   AULAS
============================================================ */
async function renderAulas() {
  // NOTA: Firebase sync REMOVIDO — causava duplicação.
  // Aulas ficam só no IndexedDB local.
  const aulas = await getAll('aulas');

  const form = `
    <div class="card" style="cursor: default;">
      <h3 class="card__title" style="margin-bottom: 16px;">Nova aula</h3>
      <form id="form-aula">
        <div class="row">
          <div class="field">
            <label class="field__label">Título</label>
            <input class="field__input" name="titulo" required />
          </div>
          <div class="field">
            <label class="field__label">Tipo</label>
            <select class="field__select" name="tipo" id="form-tipo">
              ${TIPOS.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="field__label">Instrumento</label>
            <select class="field__select" name="instrumento">
              <option value="">—</option>
              ${INSTRUMENTOS.map(i => `<option value="${i}">${i}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field__label">Professor</label>
            <select class="field__select" name="professor">
              <option value="">—</option>
              ${PROFESSORES.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field__label">Nível</label>
            <select class="field__select" name="nivel">
              <option value="">— (todos)</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field__label">Mídia (URL: vídeo, áudio, PDF ou link)</label>
          <input class="field__input" name="midia" placeholder="https://..." />
        </div>
        <div class="field" id="bloco-texto" style="display: none;">
          <label class="field__label">Texto da aula (se tipo = texto)</label>
          <textarea class="field__textarea" name="texto"></textarea>
        </div>
        <div class="field">
          <label class="field__label">Descrição curta</label>
          <input class="field__input" name="descricao" />
        </div>
        <button type="submit" class="btn btn--gold btn--block">Adicionar aula</button>
      </form>
    </div>
  `;

  const lista = `
    <p class="section-title">Aulas publicadas (${aulas.length})</p>
    ${aulas.length === 0 ? '<div class="empty-state"><strong>Nenhuma aula publicada</strong>Adicione a primeira acima.</div>' : ''}
    ${aulas.sort((a,b) => (a.ordem||0) - (b.ordem||0)).map(a => `
      <div class="list-item">
        <div>
          <div class="list-item__title">${escapeHTML(a.titulo)}</div>
          <div class="list-item__sub">${a.tipo} · ${a.instrumento || '—'} · ${a.professor || '—'}${a.nivel ? ' · ' + escapeHTML(a.nivel) : ''}</div>
        </div>
        <div class="list-item__actions">
          <button class="btn btn--danger" data-del="${a.id}">Excluir</button>
        </div>
      </div>
    `).join('')}
  `;

  $('#app').insertAdjacentHTML('beforeend', form + lista);

  $('#form-tipo').addEventListener('change', (e) => {
    $('#bloco-texto').style.display = e.target.value === 'texto' ? 'block' : 'none';
  });

  $('#form-aula').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const aula = {
      titulo: fd.get('titulo').trim(),
      tipo: fd.get('tipo'),
      instrumento: fd.get('instrumento'),
      professor: fd.get('professor'),
      nivel: fd.get('nivel') || null,
      midia: fd.get('midia').trim(),
      texto: fd.get('texto').trim(),
      descricao: fd.get('descricao').trim(),
      ordem: Date.now(),
      criadaEm: Date.now(),
      concluida: false,
    };
    await smartSave('aulas', aula, window.saveAulaFirebase);
    showToast('Aula adicionada.');
    render();
  });

  $$('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta aula?')) return;
      const id = btn.dataset.del;
      await smartDelete('aulas', id, window.deleteAulaFirebase);
      showToast('Aula excluída.');
      render();
    });
  });
}

/* ============================================================
   ALUNOS (com configuração de alarme)
============================================================ */
async function renderAlunos() {
  // Firebase é a fonte da verdade: a lista mostra SÓ os alunos que estão lá
  // (antes misturava alunos que existiam só neste aparelho, como os de
  // demonstração, e os códigos deles não funcionavam pro aluno).
  let avisoOffline = '';
  if (window.FIREBASE_CONFIGURED && window.firebase) {
    try {
      const snap = await window.firebase.database().ref('/alunos').once('value');
      const fbList = snap.val() || {};
      await clear('alunos');
      for (const [id, a] of Object.entries(fbList)) {
        if (a && a.codigo) await put('alunos', { ...a, id: String(id) });
      }
      console.log(`[admin] ${Object.keys(fbList).length} alunos do Firebase`);
    } catch (e) {
      console.warn('Firebase (alunos) falhou:', e.message);
      avisoOffline = '<div class="empty-state"><strong>Sem conexão com o servidor</strong>Mostrando a última lista salva neste aparelho. Alterações podem não chegar aos alunos.</div>';
    }
  }

  const alunos = await getAll('alunos');

  const form = `
    <div class="card" style="cursor: default;">
      <h3 class="card__title" style="margin-bottom: 16px;">Novo aluno</h3>
      <form id="form-aluno">
        <div class="field">
          <label class="field__label">Nome do aluno</label>
          <input class="field__input" name="nome" required />
        </div>
        <div class="field">
          <label class="field__label">Nível</label>
          <select class="field__select" name="nivel">
            <option value="">— (vê tudo)</option>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </div>
        <button type="submit" class="btn btn--gold btn--block">Cadastrar e gerar código</button>
      </form>
    </div>
  `;

  const lista = `
    ${avisoOffline}
    <p class="section-title">Alunos cadastrados (${alunos.length})</p>
    ${alunos.length === 0 ? '<div class="empty-state"><strong>Nenhum aluno</strong>Cadastre o primeiro acima.</div>' : ''}
    ${alunos.sort((a,b) => a.nome.localeCompare(b.nome)).map(a => {
      const alarme = a.alarme || DEFAULT_ALARME_ADMIN;
      const diasLabel = ['D','S','T','Q','Q','S','S'].map((l, i) =>
        alarme.dias.includes(i) ? l : '·'
      ).join(' ');
      const horaStr = String(alarme.hora).padStart(2,'0') + ':' + String(alarme.minuto).padStart(2,'0');
      const alarmeStr = alarme.ativo ? '🔔 ' + horaStr + ' ' + diasLabel : '🔕 desativado';
      return `
      <div class="list-item" style="opacity: ${a.revogado ? '0.4' : '1'}">
        <div style="flex: 1; min-width: 0;">
          <div class="list-item__title">${escapeHTML(a.nome)}</div>
          <div class="list-item__sub">${a.revogado ? 'revogado' : 'ativo'}${a.nivel ? ' · ' + escapeHTML(a.nivel) : ''}</div>
          <div class="list-item__sub" style="margin-top: 4px; color: var(--gold); font-size: .85rem;">${alarmeStr}</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
          <span class="list-item__code">${escapeHTML(a.codigo)}</span>
          <button class="btn btn--ghost" data-copy="${escapeHTML(a.codigo)}">Copiar</button>
          <button class="btn btn--gold" data-alarme="${a.id}">⏰ Alarme</button>
          <button class="btn btn--danger" data-rev="${a.id}">${a.revogado ? 'Reativar' : 'Revogar'}</button>
          <button class="btn btn--ghost" data-del-aluno="${a.id}" style="background: transparent; border: 1px solid var(--danger); color: var(--danger);">🗑 Excluir</button>
        </div>
      </div>`;
    }).join('')}
  `;

  $('#app').insertAdjacentHTML('beforeend', form + lista);

  $('#form-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Trava contra duplo clique (debounce 2s)
    if (window._alunoSubmitting) {
      showToast('Aguarde, processando...');
      return;
    }
    window._alunoSubmitting = true;
    setTimeout(() => { window._alunoSubmitting = false; }, 2000);

    // Trava o botão pra evitar duplo submit visualmente
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const fd = new FormData(e.target);
    const codigo = await gerarCodigoUnico();
    const nomeDigitado = fd.get('nome').trim();
    // Verifica se já existe aluno com esse nome (case-insensitive)
    const existente = alunos.find(a => a.nome && a.nome.toLowerCase() === nomeDigitado.toLowerCase());
    if (existente) {
      showToast(`Já existe "${existente.nome}" (código: ${existente.codigo}). Use um nome diferente.`);
      window._alunoSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    // Id único (o "maior + 1" podia repetir id entre aparelhos e sobrescrever aluno)
    const novoId = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    console.log('[admin] Cadastrando aluno. id=', novoId, 'alunosCount=', alunos.length);
    const aluno = {
      id: novoId,
      nome: nomeDigitado,
      codigo,
      criadoEm: Date.now(),
      revogado: false,
      nivel: fd.get('nivel') || null,
      alarme: { ...DEFAULT_ALARME_ADMIN },
    };
    // Salva no Firebase primeiro: se falhar, o código não funcionaria pro aluno
    if (window.FIREBASE_CONFIGURED && window.saveAlunoFirebase) {
      try {
        await window.saveAlunoFirebase(aluno);
      } catch (err) {
        showToast('Não consegui salvar no servidor. Verifique a internet e tente de novo.');
        window._alunoSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
    }
    await put('alunos', aluno);
    showToast(`Aluno cadastrado. Código: ${codigo}`);
    // Limpa o form antes do render
    e.target.reset();
    // Re-habilita o botão após render
    setTimeout(() => {
      window._alunoSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }, 100);
    render();
  });

  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast('Código copiado.');
      } catch {
        showToast('Não consegui copiar. Anote manualmente.');
      }
    });
  });

  $$('[data-rev]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.rev;
      // id pode ser number (IndexedDB) ou string (Firebase): compara como texto
      const aluno = alunos.find(a => String(a.id) === id);
      if (!aluno) return;
      aluno.revogado = !aluno.revogado;
      await smartSave('alunos', aluno, window.saveAlunoFirebase); // re-habilitado pros saves do Firebase
      showToast(aluno.revogado ? 'Código revogado.' : 'Código reativado.');
      render();
    });
  });

  $$('[data-del-aluno]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir PERMANENTEMENTE este aluno do banco? Esta ação não pode ser desfeita.')) return;
      const aluno = alunos.find(a => String(a.id) === btn.dataset.delAluno);
      if (!aluno) return;
      // Remove do IndexedDB
      try { await window.SonareDB.del('alunos', aluno.id); } catch (e) {}
      // Remove do Firebase (antes só removia se o id fosse texto — alunos
      // criados com id numérico "voltavam" na próxima sincronização)
      if (window.deleteAlunoFirebase) {
        try { await window.deleteAlunoFirebase(aluno.id); } catch (e) { console.warn('[admin] excluir no Firebase:', e.message); }
      }
      showToast('Aluno excluído.');
      render();
    });
  });

  $$('[data-alarme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.alarme;
      // dataset sempre retorna string; alunos do IndexedDB usam number
      // Convertemos pra number pra comparar direito
      const idNum = Number(id);
      const aluno = alunos.find(a => a.id === idNum || a.id === id);
      if (!aluno) return;
      openAlarmeModal(aluno);
    });
  });
}

function openAlarmeModal(aluno) {
  const existente = document.getElementById('alarme-modal');
  if (existente) existente.remove();
  const alarme = aluno.alarme || { ...DEFAULT_ALARME_ADMIN };
  const modal = document.createElement('div');
  modal.id = 'alarme-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" data-close>&times;</button>
      <h2 style="margin-bottom: 8px;">⏰ Alarme de estudo</h2>
      <p style="color: var(--cream-dim); margin-bottom: 20px;">Aluno: <strong style="color: var(--gold)">${escapeHTML(aluno.nome)}</strong></p>
      <form id="form-alarme">
        <div class="row">
          <div class="field">
            <label class="field__label">Hora</label>
            <input class="field__input" type="number" name="hora" min="0" max="23" value="${alarme.hora}" required />
          </div>
          <div class="field">
            <label class="field__label">Minuto</label>
            <input class="field__input" type="number" name="minuto" min="0" max="59" value="${alarme.minuto}" required />
          </div>
        </div>
        <div class="field">
          <label class="field__label">Dias da semana</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
            ${['D','S','T','Q','Q','S','S'].map((l, i) => `
              <button type="button" class="btn dia-btn" data-dia="${i}" style="${alarme.dias.includes(i) ? 'background: var(--gold); color: var(--ink);' : 'background: var(--ink-3); color: var(--cream-dim);'}">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="field" style="display:flex;align-items:center;gap:10px;margin-top:12px;">
          <input type="checkbox" id="alarme-ativo" ${alarme.ativo ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--gold);" />
          <label for="alarme-ativo" style="font-family: var(--mono); font-size: .8rem; letter-spacing: .1em; text-transform: uppercase; color: var(--cream-dim);">Alarme ativo</label>
        </div>
        <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap;">
          <button type="submit" class="btn btn--gold btn-big">Salvar</button>
          <button type="button" class="btn btn--danger btn-big" data-desativar>🔕 Desativar alarme</button>
          <button type="button" class="btn btn--ghost btn-big" data-close>Cancelar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  let diasSelecionados = new Set(alarme.dias);

  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelectorAll('[data-dia]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = Number(btn.dataset.dia);
      if (diasSelecionados.has(d)) {
        diasSelecionados.delete(d);
        btn.style.background = 'var(--ink-3)';
        btn.style.color = 'var(--cream-dim)';
      } else {
        diasSelecionados.add(d);
        btn.style.background = 'var(--gold)';
        btn.style.color = 'var(--ink)';
      }
    });
  });

  modal.querySelector('[data-desativar]').addEventListener('click', async () => {
    aluno.alarme = { ...aluno.alarme, ativo: false };
    await smartSave('alunos', aluno, window.saveAlunoFirebase); // re-habilitado pros saves do Firebase
    showToast('Alarme desativado.');
    modal.remove();
    render();
  });

  modal.querySelector('#form-alarme').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    aluno.alarme = {
      hora: parseInt(fd.get('hora')),
      minuto: parseInt(fd.get('minuto')),
      dias: [...diasSelecionados].sort(),
      ativo: modal.querySelector('#alarme-ativo').checked,
    };
    await smartSave('alunos', aluno, window.saveAlunoFirebase); // re-habilitado pros saves do Firebase
    showToast('Alarme salvo.');
    modal.remove();
    render();
  });
}

/* ============================================================
   DADOS
============================================================ */
async function renderDados() {
  const aulas = await getAll('aulas');
  const alunos = await getAll('alunos');

  const html = `
    <p class="section-title">Conteúdo Geral (auto-update pro aluno)</p>
    <div class="card" style="cursor: default;">
      <p class="card__desc">Baixa o arquivo <code>data/conteudo.json</code> com teoria, exercícios, lições e músicas editadas na aba "Conteúdo".</p>
      <button class="btn btn--gold btn--block" id="exportar-conteudo">📦 Exportar Conteúdo Geral (conteudo.json)</button>
    </div>

    <p class="section-title">Exportar conteúdo</p>
    <div class="card" style="cursor: default;">
      <p class="card__desc">Baixa um arquivo <code>aulas.json</code> com todas as aulas.</p>
      <button class="btn btn--gold btn--block" id="exportar">Baixar aulas.json</button>
    </div>

    <p class="section-title">Importar conteúdo</p>
    <div class="card" style="cursor: default;">
      <p class="card__desc">Substitui todas as aulas deste dispositivo pelo arquivo importado.</p>
      <input type="file" id="importar" accept=".json" class="field__input" />
    </div>

    <p class="section-title">Resumo</p>
    <div class="card" style="cursor: default;">
      <div class="card__meta">
        <span>${aulas.length} aulas</span>
        <span>· ${alunos.length} alunos</span>
      </div>
    </div>

    <p class="section-title">Zona perigosa</p>
    <div class="card" style="cursor: default;">
      <p class="card__desc">Apaga TUDO deste dispositivo. Não tem volta.</p>
      <button class="btn btn--danger btn--block" id="apagar-tudo">Apagar todos os dados</button>
    </div>
  `;

  $('#app').insertAdjacentHTML('beforeend', html);

  $('#exportar-conteudo').addEventListener('click', async () => {
    if (!window.SonareConteudo) {
      try { await loadConteudo(); } catch {}
    }
    const conteudo = window.SonareConteudo || { teoria: {}, exercicios: [], licoes: [], musicas: [] };
    conteudo.version = new Date().toISOString();
    const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conteudo-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo baixado.');
  });

  $('#exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ aulas }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aulas-sonare-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo baixado.');
  });

  $('#importar').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      await clear('aulas');
      for (const aula of data.aulas || []) {
        delete aula.id;
        await put('aulas', aula);
      }
      showToast(`Importado: ${data.aulas?.length || 0} aulas.`);
      render();
    } catch {
      showToast('Arquivo inválido.');
    }
  });

  $('#apagar-tudo').addEventListener('click', async () => {
    if (!confirm('Tem certeza? Isso apaga todas as aulas e alunos deste dispositivo.')) return;
    if (!confirm('Última chance. Continuar?')) return;
    await clear('aulas');
    await clear('alunos');
    await clear('sessoes');
    await clear('config');
    showToast('Tudo apagado.');
    render();
  });
}

/* ============================================================
   CONTEÚDO (Teoria + Exercícios + Lições + Músicas)
============================================================ */
let conteudoSubTab = 'teoria';
let conteudoDraft = null;

async function renderConteudo() {
  if (!window.SonareConteudo) {
    try { await loadConteudo(); } catch {}
  }
  const c = window.SonareConteudo || { teoria: {}, exercicios: [], licoes: [], musicas: [] };

  const subTabs = `
    <div class="admin-tabs" style="margin-bottom: 16px">
      <button class="admin-tab ${conteudoSubTab==='teoria'?'admin-tab--active':''}" data-sub="teoria">Teoria (${Object.keys(c.teoria||{}).length})</button>
      <button class="admin-tab ${conteudoSubTab==='exercicios'?'admin-tab--active':''}" data-sub="exercicios">Exercícios (${(c.exercicios||[]).length})</button>
      <button class="admin-tab ${conteudoSubTab==='licoes'?'admin-tab--active':''}" data-sub="licoes">Lições (${(c.licoes||[]).length})</button>
      <button class="admin-tab ${conteudoSubTab==='musicas'?'admin-tab--active':''}" data-sub="musicas">Músicas (${(c.musicas||[]).length})</button>
    </div>
  `;

  let conteudo = '';
  if (conteudoSubTab === 'teoria') conteudo = renderTeoriaEditor(c.teoria || {});
  else if (conteudoSubTab === 'exercicios') conteudo = renderExerciciosEditor(c.exercicios || []);
  else if (conteudoSubTab === 'licoes') conteudo = renderLicoesEditor(c.licoes || []);
  else if (conteudoSubTab === 'musicas') conteudo = renderMusicasEditor(c.musicas || []);

  $('#app').insertAdjacentHTML('beforeend', subTabs + conteudo);

  $$('[data-sub]').forEach(b => {
    b.addEventListener('click', () => { conteudoSubTab = b.dataset.sub; render(); });
  });

  $$('.teoria-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.dataset.topic;
      const t = (window.SonareConteudo.teoria || {})[topic] || { title: topic, html: '' };
      openEditorModal(`Teoria: ${t.title}`, [
        { name: 'title', label: 'Título', type: 'text', value: t.title || '' },
        { name: 'nivel', label: 'Nível (deixe vazio pra todos)', type: 'select', value: t.nivel || '', options: [
          { value: '', label: '— (todos os níveis)' },
          { value: 'iniciante', label: 'Iniciante' },
          { value: 'intermediario', label: 'Intermediário' },
          { value: 'avancado', label: 'Avançado' },
        ] },
        { name: 'html',  label: 'Conteúdo (use a barra de ferramentas acima do editor)', type: 'richtext', value: t.html || '' },
      ], async (vals) => {
        const novoConteudo = { ...(window.SonareConteudo || {}) };
        novoConteudo.teoria = { ...(novoConteudo.teoria || {}), [topic]: { title: vals.title, html: vals.html, nivel: vals.nivel || null } };
        novoConteudo.version = new Date().toISOString();
        await saveConteudoLocal(novoConteudo);
        showToast('Tópico salvo.');
        render();
      });
    });
  });

  $$('.teoria-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const novo = prompt('Nome do novo tópico (ex: rhythm):');
      if (!novo) return;
      const novoConteudo = { ...(window.SonareConteudo || {}) };
      novoConteudo.teoria = { ...(novoConteudo.teoria || {}), [novo]: { title: novo, html: '<h3>' + novo + '</h3><p>...</p>' } };
      novoConteudo.version = new Date().toISOString();
      saveConteudoLocal(novoConteudo).then(() => render());
    });
  });

  $$('.exerc-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const lista = (window.SonareConteudo.exercicios || []);
      const ex = lista.find(e => e.id === id);
      if (!ex) return;
      openEditorModal(`Editar exercício: ${ex.title}`, [
        { name: 'title', label: 'Título', type: 'text', value: ex.title || '' },
        { name: 'level', label: 'Nível', type: 'select', value: ex.level || 'beginner', options: [
          { value: 'beginner', label: 'Iniciante' },
          { value: 'intermediate', label: 'Intermediário' },
          { value: 'advanced', label: 'Avançado' },
        ] },
        { name: 'duration', label: 'Duração', type: 'text', value: ex.duration || '' },
        { name: 'category', label: 'Categoria', type: 'text', value: ex.category || '' },
        { name: 'description', label: 'Descrição', type: 'textarea', value: ex.description || '', rows: 4 },
        { name: 'steps', label: 'Passos (um por linha)', type: 'textarea', value: (ex.steps || []).join('\n'), rows: 6 },
        { name: 'tip', label: 'Dica', type: 'textarea', value: ex.tip || '', rows: 3 },
      ], async (vals) => {
        const novoConteudo = { ...window.SonareConteudo };
        novoConteudo.exercicios = lista.map(e => e.id === id ? {
          ...e, title: vals.title, level: vals.level, duration: vals.duration,
          category: vals.category, description: vals.description,
          steps: vals.steps.split('\n').map(s => s.trim()).filter(Boolean),
          tip: vals.tip,
        } : e);
        novoConteudo.version = new Date().toISOString();
        await saveConteudoLocal(novoConteudo);
        showToast('Exercício salvo.');
        render();
      });
    });
  });

  $$('.exerc-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const novoConteudo = { ...window.SonareConteudo };
      const id = 'ex_' + Date.now();
      novoConteudo.exercicios = [...(novoConteudo.exercicios || []), {
        id, title: 'Novo exercício', level: 'beginner', duration: '10 min',
        category: 'Geral', description: '', steps: [], tip: '',
      }];
      saveConteudoLocal(novoConteudo).then(() => render());
    });
  });

  $$('.exerc-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir este exercício?')) return;
      const id = btn.dataset.id;
      const novoConteudo = { ...window.SonareConteudo };
      novoConteudo.exercicios = (novoConteudo.exercicios || []).filter(e => e.id !== id);
      await saveConteudoLocal(novoConteudo);
      showToast('Exercício excluído.');
      render();
    });
  });

  $$('.lic-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const lista = (window.SonareConteudo.licoes || []);
      const l = lista.find(x => x.id === id);
      if (!l) return;
      openEditorModal(`Editar lição: ${l.title}`, [
        { name: 'title', label: 'Título', type: 'text', value: l.title || '' },
        { name: 'level', label: 'Nível', type: 'select', value: l.level || 'beginner', options: [
          { value: 'beginner', label: 'Iniciante' },
          { value: 'intermediate', label: 'Intermediário' },
          { value: 'advanced', label: 'Avançado' },
        ] },
        { name: 'duration', label: 'Duração', type: 'text', value: l.duration || '' },
        { name: 'order', label: 'Ordem', type: 'number', value: l.order || 1 },
        { name: 'summary', label: 'Resumo', type: 'textarea', value: l.summary || '', rows: 3 },
        { name: 'content', label: 'Conteúdo da lição (use a barra de ferramentas)', type: 'richtext', value: l.content || '', rows: 18 },
      ], async (vals) => {
        const novoConteudo = { ...window.SonareConteudo };
        novoConteudo.licoes = lista.map(x => x.id === id ? {
          ...x, ...vals, order: parseInt(vals.order) || 1,
        } : x);
        novoConteudo.version = new Date().toISOString();
        await saveConteudoLocal(novoConteudo);
        showToast('Lição salva.');
        render();
      });
    });
  });

  $$('.lic-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const novoConteudo = { ...window.SonareConteudo };
      const id = 'l_' + Date.now();
      novoConteudo.licoes = [...(novoConteudo.licoes || []), {
        id, order: (novoConteudo.licoes?.length || 0) + 1,
        title: 'Nova lição', level: 'beginner', duration: '20 min',
        summary: '', content: '<h3>Nova lição</h3><p>...</p>',
      }];
      saveConteudoLocal(novoConteudo).then(() => render());
    });
  });

  $$('.lic-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta lição?')) return;
      const id = btn.dataset.id;
      const novoConteudo = { ...window.SonareConteudo };
      novoConteudo.licoes = (novoConteudo.licoes || []).filter(x => x.id !== id);
      await saveConteudoLocal(novoConteudo);
      showToast('Lição excluída.');
      render();
    });
  });

  $$('.mus-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const lista = (window.SonareConteudo.musicas || []);
      const m = lista.find(x => x.id === id);
      if (!m) return;
      openEditorModal(`Editar música: ${m.title}`, [
        { name: 'title', label: 'Título', type: 'text', value: m.title || '' },
        { name: 'artist', label: 'Artista', type: 'text', value: m.artist || '' },
        { name: 'category', label: 'Categoria', type: 'select', value: m.category || 'popular', options: [
          { value: 'popular', label: 'Popular' },
          { value: 'mpb', label: 'MPB' },
          { value: 'rock', label: 'Rock' },
          { value: 'sertanejo', label: 'Sertanejo' },
          { value: 'gospel', label: 'Gospel' },
          { value: 'bossa', label: 'Bossa Nova' },
          { value: 'infantil', label: 'Infantil' },
        ] },
        { name: 'key', label: 'Tom (C, D, G...)', type: 'text', value: m.key || 'C' },
        { name: 'bpm', label: 'BPM', type: 'number', value: m.bpm || 120 },
        { name: 'nivel', label: 'Nível (deixe vazio pra todos)', type: 'select', value: m.nivel || '', options: [
          { value: '', label: '— (todos os níveis)' },
          { value: 'iniciante', label: 'Iniciante' },
          { value: 'intermediario', label: 'Intermediário' },
          { value: 'avancado', label: 'Avançado' },
        ] },
        { name: 'lyrics', label: 'Letra com cifras entre [colchetes]', type: 'textarea', value: m.lyrics || '', rows: 18 },
      ], async (vals) => {
        const novoConteudo = { ...window.SonareConteudo };
        novoConteudo.musicas = lista.map(x => x.id === id ? {
          ...x, ...vals, bpm: parseInt(vals.bpm) || 120,
        } : x);
        novoConteudo.version = new Date().toISOString();
        await saveConteudoLocal(novoConteudo);
        showToast('Música salva.');
        render();
      });
    });
  });

  $$('.mus-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const novoConteudo = { ...window.SonareConteudo };
      const id = 'm_' + Date.now();
      novoConteudo.musicas = [...(novoConteudo.musicas || []), {
        id, title: 'Nova música', artist: 'Desconhecido', category: 'popular',
        key: 'C', bpm: 120,
        lyrics: '[Intro] C\n\n[Verso]\nC      G\n...',
      }];
      saveConteudoLocal(novoConteudo).then(() => render());
    });
  });

  $$('.mus-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta música?')) return;
      const id = btn.dataset.id;
      const novoConteudo = { ...window.SonareConteudo };
      novoConteudo.musicas = (novoConteudo.musicas || []).filter(x => x.id !== id);
      await saveConteudoLocal(novoConteudo);
      showToast('Música excluída.');
      render();
    });
  });
}

function renderTeoriaEditor(teoria) {
  const topics = Object.entries(teoria);
  return `
    <div class="card" style="cursor: default;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 class="card__title">Tópicos de Teoria</h3>
        <button class="btn btn--gold teoria-add-btn">+ Novo tópico</button>
      </div>
      ${topics.map(([key, t]) => `
        <div class="list-item">
          <div>
            <div class="list-item__title">${escapeHTML(t.title || key)}</div>
            <div class="list-item__sub"><code>${escapeHTML(key)}</code></div>
          </div>
          <div class="list-item__actions">
            <button class="btn btn--ghost teoria-edit-btn" data-topic="${escapeHTML(key)}">Editar</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderExerciciosEditor(exercicios) {
  return `
    <div class="card" style="cursor: default;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 class="card__title">Exercícios</h3>
        <button class="btn btn--gold exerc-add-btn">+ Novo exercício</button>
      </div>
      ${exercicios.map(e => `
        <div class="list-item">
          <div>
            <div class="list-item__title">${escapeHTML(e.title)}</div>
            <div class="list-item__sub">${escapeHTML(e.level || '')} · ${escapeHTML(e.duration || '')} · ${escapeHTML(e.category || '')}</div>
          </div>
          <div class="list-item__actions">
            <button class="btn btn--ghost exerc-edit-btn" data-id="${escapeHTML(e.id)}">Editar</button>
            <button class="btn btn--danger exerc-del-btn" data-id="${escapeHTML(e.id)}">Excluir</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLicoesEditor(licoes) {
  return `
    <div class="card" style="cursor: default;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 class="card__title">Lições / Apostilas</h3>
        <button class="btn btn--gold lic-add-btn">+ Nova lição</button>
      </div>
      ${licoes.sort((a,b) => (a.order||0) - (b.order||0)).map(l => `
        <div class="list-item">
          <div>
            <div class="list-item__title">${escapeHTML(l.title)}</div>
            <div class="list-item__sub">${escapeHTML(l.level || '')} · ${escapeHTML(l.duration || '')} · ordem ${l.order || '?'}</div>
          </div>
          <div class="list-item__actions">
            <button class="btn btn--ghost lic-edit-btn" data-id="${escapeHTML(l.id)}">Editar</button>
            <button class="btn btn--danger lic-del-btn" data-id="${escapeHTML(l.id)}">Excluir</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMusicasEditor(musicas) {
  return `
    <div class="card" style="cursor: default;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 class="card__title">Músicas / Cifras</h3>
        <button class="btn btn--gold mus-add-btn">+ Nova música</button>
      </div>
      ${musicas.map(m => `
        <div class="list-item">
          <div>
            <div class="list-item__title">${escapeHTML(m.title)}</div>
            <div class="list-item__sub">${escapeHTML(m.artist || '')} · ${escapeHTML(m.category || '')} · ${escapeHTML(m.key || '')} · ${m.bpm || '?'}bpm</div>
          </div>
          <div class="list-item__actions">
            <button class="btn btn--ghost mus-edit-btn" data-id="${escapeHTML(m.id)}">Editar</button>
            <button class="btn btn--danger mus-del-btn" data-id="${escapeHTML(m.id)}">Excluir</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openEditorModal(title, fields, onSave) {
  const existing = document.getElementById('editor-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'editor-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content wide">
      <button class="modal-close" data-close>&times;</button>
      <h2 style="margin-bottom: 20px;">${escapeHTML(title)}</h2>
      <form id="editor-form">
        ${fields.map(f => {
          if (f.type === 'richtext') {
            return `
              <div class="editor-field">
                <label class="editor-field__label">${escapeHTML(f.label)}</label>
                <div class="editor-toolbar" data-rt="${f.name}">
                  <button type="button" data-cmd="bold" title="Negrito"><b>B</b></button>
                  <button type="button" data-cmd="italic" title="Itálico"><i>I</i></button>
                  <button type="button" data-cmd="underline" title="Sublinhado"><u>U</u></button>
                  <span class="sep"></span>
                  <button type="button" data-cmd="formatBlock" data-arg="h2" title="Título">H<sub>2</sub></button>
                  <button type="button" data-cmd="formatBlock" data-arg="h3" title="Subtítulo">H<sub>3</sub></button>
                  <button type="button" data-cmd="formatBlock" data-arg="p" title="Parágrafo">¶</button>
                  <span class="sep"></span>
                  <button type="button" data-cmd="insertUnorderedList" title="Lista">• Lista</button>
                  <button type="button" data-cmd="insertOrderedList" title="Lista numerada">1. Lista</button>
                  <button type="button" data-cmd="formatBlock" data-arg="blockquote" title="Citação">❝</button>
                  <span class="sep"></span>
                  <button type="button" data-cmd="createLink" title="Link">🔗 Link</button>
                  <button type="button" data-cmd="removeFormat" title="Limpar formatação">⌫</button>
                </div>
                <div class="editor-area" name="${f.name}" contenteditable="true" data-rt-editor="${f.name}">${f.value || ''}</div>
                <textarea name="${f.name}" hidden></textarea>
              </div>`;
          }
          if (f.type === 'textarea') {
            return `
              <div class="editor-field">
                <label class="editor-field__label">${escapeHTML(f.label)}</label>
                <textarea class="field__textarea" name="${f.name}" rows="${f.rows || 4}">${escapeHTML(f.value || '')}</textarea>
              </div>`;
          }
          if (f.type === 'select') {
            return `
              <div class="editor-field">
                <label class="editor-field__label">${escapeHTML(f.label)}</label>
                <select class="field__select" name="${f.name}">${(f.options||[]).map(o => `<option value="${escapeHTML(o.value)}" ${o.value===f.value?'selected':''}>${escapeHTML(o.label)}</option>`).join('')}</select>
              </div>`;
          }
          return `
            <div class="editor-field">
              <label class="editor-field__label">${escapeHTML(f.label)}</label>
              <input class="editor-field__input" type="${f.type || 'text'}" name="${f.name}" value="${escapeHTML(String(f.value || ''))}" />
            </div>`;
        }).join('')}
        <div style="display:flex;gap:8px;margin-top:20px">
          <button type="button" class="btn btn--ghost btn-big" data-close>Cancelar</button>
          <button type="submit" class="btn btn--gold btn-big">Salvar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelectorAll('[data-rt]').forEach(toolbar => {
    const editor = toolbar.parentElement.querySelector('[data-rt-editor]');
    const hidden = toolbar.parentElement.querySelector('textarea');
    toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const arg = btn.dataset.arg;
        if (cmd === 'createLink') {
          const url = prompt('URL do link:', 'https://');
          if (!url) return;
          editor.focus();
          document.execCommand('createLink', false, url);
        } else {
          editor.focus();
          document.execCommand(cmd, false, arg || null);
        }
        hidden.value = editor.innerHTML;
      });
    });
  });

  modal.querySelector('#editor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const vals = {};
    new FormData(e.target).forEach((v, k) => { if (v) vals[k] = v; });
    modal.querySelectorAll('[data-rt-editor]').forEach(editor => {
      vals[editor.getAttribute('data-rt-editor')] = editor.innerHTML;
    });
    modal.remove();
    await onSave(vals);
  });
}

async function saveConteudoLocal(conteudo) {
  window.SonareConteudo = conteudo;
  await window.SonareDB.put('conteudo', { key: 'sonare-conteudo-cache', data: conteudo, updatedAt: Date.now() });
  if (window.saveConteudoFirebase) {
    try {
      await window.saveConteudoFirebase(conteudo);
    } catch (e) {
      console.warn('[admin] Firebase offline — só IDB:', e.message);
    }
  }
}

async function smartSave(store, value, firebaseOp) {
  await put(store, value);
  if (firebaseOp) {
    firebaseOp(value).catch((e) => console.warn(`[admin] Firebase falhou (${store}):`, e.message));
  }
  return value.id || value.key;
}

async function smartDelete(store, id, firebaseOp) {
  await del(store, id);
  if (firebaseOp) {
    firebaseOp(id).catch(e => console.warn('[admin] Firebase delete:', e.message));
  }
}

/* ============================================================
   BOOTSTRAP
============================================================ */
async function bootstrap() {
  try {
    const resp = await fetch('./data/seed.json');
    if (resp.ok) {
      const seed = await resp.json();
      await seedIfNeeded(seed);
    }
  } catch (e) {}

  try { await loadConteudo(); } catch (e) { console.warn('Conteudo:', e); }

  try {
    if (window.SonareDB) await window.SonareDB.del('sessoes', 'aluno');
  } catch (e) {}

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {}
  }

  // Recria o índice de códigos (/codigos) a partir dos alunos.
  // Necessário na primeira vez depois da mudança de segurança.
  if (window.syncCodigosFirebase) {
    try {
      const n = await window.syncCodigosFirebase();
      console.log(`[admin] índice de códigos atualizado (${n} ativos)`);
    } catch (e) {
      console.warn('[admin] não consegui atualizar /codigos:', e.message);
    }
  }

  render();
}

// Só inicia depois que admin.html confirmar o login do professor
let adminIniciado = false;
window.startAdmin = () => {
  if (adminIniciado) return;
  adminIniciado = true;
  bootstrap();
};