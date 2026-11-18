/* ============================================================
   SONARE — Progresso do aluno na nuvem
   O app guarda o progresso no localStorage (minutos praticados,
   tarefas, exercícios/lições/aulas concluídas, músicas tocadas,
   ritmos personalizados). Este módulo copia isso para
   /alunos/{id}/progresso no Firebase, para:
   - o aluno não perder tudo ao trocar de celular ou limpar o navegador;
   - o professor acompanhar no painel admin.
============================================================ */

const SonareProgresso = (() => {
  // Chaves do localStorage que fazem parte do progresso
  const CHAVES = [
    'practiceData', 'tasks', 'completedExercises', 'completedLessons',
    'playedSongs', 'customSongs', 'aulasConcluidas', 'sonare-ritmos-custom',
  ];

  let alunoId = null;
  let timer = null;
  let carregando = false;

  const ler = (k) => {
    try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; }
  };
  const vazio = (v) => v == null || (Array.isArray(v) ? v.length === 0 : typeof v === 'object' && Object.keys(v).length === 0);

  // Qualquer gravação dessas chaves agenda um envio pro servidor.
  // (Pelo protótipo: "localStorage.setItem = ..." gravaria um item chamado setItem.)
  try {
    const setItemOriginal = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      setItemOriginal.call(this, k, v);
      if (this === window.localStorage && !carregando && CHAVES.includes(k)) salvar();
    };
  } catch (e) { /* sem interceptação: salva no login e ao fechar */ }

  /** Envia o progresso (com espera de 3s pra juntar várias mudanças) */
  function salvar() {
    if (!alunoId || !window.FIREBASE_CONFIGURED) return;
    clearTimeout(timer);
    timer = setTimeout(enviarAgora, 3000);
  }

  async function enviarAgora() {
    clearTimeout(timer);
    if (!alunoId || !window.firebase?.database) return;
    const dados = { updatedAt: Date.now() };
    // Guardado como texto JSON: o Firebase não aceita alguns caracteres em chaves
    for (const k of CHAVES) {
      const v = localStorage.getItem(k);
      if (v != null) dados[k.replace(/[^a-zA-Z0-9_]/g, '_')] = v;
    }
    try {
      await window.firebase.database().ref(`/alunos/${alunoId}/progresso`).set(dados);
    } catch (e) {
      console.warn('[progresso] não consegui enviar (fica salvo no aparelho):', e.message);
    }
  }

  /**
   * Ao entrar: traz o progresso do servidor.
   * - minutos por dia: fica o maior valor (nunca perde treino);
   * - o resto: só preenche o que estiver vazio neste aparelho
   *   (não ressuscita o que o aluno apagou aqui).
   */
  async function carregar(id) {
    alunoId = String(id);
    if (!window.FIREBASE_CONFIGURED || !window.firebase?.database) return;
    let remoto;
    try {
      const snap = await window.firebase.database().ref(`/alunos/${alunoId}/progresso`).once('value');
      remoto = snap.val();
    } catch (e) {
      console.warn('[progresso] não consegui baixar:', e.message);
      return;
    }

    carregando = true;
    let mudou = false;
    try {
      for (const k of CHAVES) {
        const txt = remoto?.[k.replace(/[^a-zA-Z0-9_]/g, '_')];
        if (!txt) continue;
        let r;
        try { r = JSON.parse(txt); } catch { continue; }
        const local = ler(k);
        if (k === 'practiceData') {
          const junto = { ...(r || {}) };
          for (const [dia, min] of Object.entries(local || {})) junto[dia] = Math.max(junto[dia] || 0, min || 0);
          if (JSON.stringify(junto) !== JSON.stringify(local)) {
            localStorage.setItem(k, JSON.stringify(junto));
            mudou = true;
          }
        } else if (vazio(local) && !vazio(r)) {
          localStorage.setItem(k, txt);
          mudou = true;
        }
      }
    } finally {
      carregando = false;
    }

    if (mudou) atualizarTela();
    salvar(); // manda de volta o que este aparelho tinha a mais
  }

  /** Os módulos leem o localStorage só ao abrir: recarrega o que mudou */
  function atualizarTela() {
    try {
      if (typeof Tasks !== 'undefined') { Tasks.tasks = ler('tasks') || []; Tasks.render?.(); }
      if (typeof Exercises !== 'undefined') { Exercises.completedExercises = new Set(ler('completedExercises') || []); Exercises.render?.(); }
      if (typeof Lessons !== 'undefined') { Lessons.completedLessons = new Set(ler('completedLessons') || []); Lessons.render?.(); }
      if (typeof Songs !== 'undefined') { Songs.playedSongs = ler('playedSongs') || []; Songs.customSongs = ler('customSongs') || []; Songs.render?.(); }
      if (typeof Ritmos !== 'undefined') Ritmos.loadCustomizations?.();
      if (typeof SonareApp !== 'undefined') { SonareApp.updateProgress?.(); SonareApp.renderWeeklyChart?.(); }
    } catch (e) {
      console.warn('[progresso] atualizar tela:', e);
    }
  }

  // Ao fechar/minimizar o app, envia o que estiver pendente
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && alunoId) enviarAgora();
  });

  return { carregar, salvar, enviarAgora, CHAVES };
})();

window.SonareProgresso = SonareProgresso;
