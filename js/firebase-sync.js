/* ============================================================
   SONARE — Firebase Realtime Database sync (tempo real)
   - initFirebase() carrega SDK do CDN (gstatic)
   - escuta /conteudo e /aulas em tempo real
   - atualiza window.SonareConteudo, window.SONGS_LIBRARY, etc.
   - salva no IndexedDB local como fallback offline
   - expõe saveAulaFirebase/saveAlunoFirebase pro admin
============================================================ */

let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;

/**
 * Inicializa Firebase. Retorna Promise que resolve quando tá pronto,
 * ou rejeita se Firebase não configurado / offline.
 */
async function initFirebase() {
  if (!window.FIREBASE_CONFIGURED) {
    console.warn('[firebase] Firebase não configurado ainda. Usando fallback local.');
    return false;
  }
  if (firebaseApp) return true;

  // Carregar SDK do CDN se ainda não carregou
  if (!window.firebase) {
    await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js');
  }

  try {
    firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.FIREBASE_CONFIG);
    firebaseDb = firebase.database();
    firebaseAuth = firebase.auth();

    // Espera o Firebase restaurar a sessão salva (se houver)
    await new Promise((resolve) => {
      const off = firebaseAuth.onAuthStateChanged(() => { off(); resolve(); });
    });

    // No app do aluno: login anônimo. No painel admin NÃO — o professor
    // entra com e-mail e senha (ver admin.html).
    if (!firebaseAuth.currentUser && !window.SONARE_ADMIN_PAGE) {
      await firebaseAuth.signInAnonymously();
    }
    console.log('[firebase] conectado como', firebaseAuth.currentUser?.uid || '(sem login)');
    return true;
  } catch (err) {
    console.warn('[firebase] erro ao iniciar:', err.message);
    firebaseApp = null;
    return false;
  }
}

/* ============================================================
   LOGIN DO PROFESSOR (e-mail + senha do Firebase Auth)
============================================================ */
async function adminLoginFirebase(email, senha) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Sem conexão com o servidor.');
  await firebaseAuth.signInWithEmailAndPassword(email, senha);
  return firebaseAuth.currentUser;
}

async function adminLogoutFirebase() {
  if (firebaseAuth) await firebaseAuth.signOut();
}

/** true se o usuário logado está em /admins/{uid} */
async function isAdminFirebase() {
  const ok = await initFirebase();
  const user = firebaseAuth?.currentUser;
  if (!ok || !user || user.isAnonymous) return false;
  try {
    const snap = await firebaseDb.ref(`/admins/${user.uid}`).once('value');
    return snap.val() === true;
  } catch (e) {
    return false;
  }
}

function currentUserFirebase() {
  return firebaseAuth?.currentUser || null;
}

function isPermissionError(e) {
  return e && (e.code === 'PERMISSION_DENIED' || /permission/i.test(e.message || ''));
}

/* ============================================================
   LOGIN DO ALUNO POR CÓDIGO
   /codigos/{CODIGO} = { alunoId }   (só leitura individual)
   /vinculos/{uid}   = CODIGO        (liga o aparelho ao aluno)
   Retorna o aluno, ou { erro: 'invalido' | 'revogado' | 'offline' }
============================================================ */
async function loginAlunoFirebase(codigo) {
  const ok = await initFirebase();
  const uid = firebaseAuth?.currentUser?.uid;
  if (!ok || !uid) return { erro: 'offline' };
  codigo = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,20}$/.test(codigo)) return { erro: 'invalido' };

  let alunoId;
  try {
    const snap = await firebaseDb.ref(`/codigos/${codigo}`).once('value');
    alunoId = snap.val()?.alunoId;
  } catch (e) {
    return { erro: isPermissionError(e) ? 'invalido' : 'offline' };
  }
  if (!alunoId) return { erro: 'invalido' };

  try {
    await firebaseDb.ref(`/vinculos/${uid}`).set(codigo);
    const snap = await firebaseDb.ref(`/alunos/${alunoId}`).once('value');
    const aluno = snap.val();
    if (!aluno) return { erro: 'invalido' };
    if (aluno.revogado) return { erro: 'revogado' };
    return { ...aluno, id: String(alunoId), codigo };
  } catch (e) {
    // permission_denied aqui = aluno revogado (as regras bloqueiam a leitura)
    return { erro: isPermissionError(e) ? 'revogado' : 'offline' };
  }
}

/**
 * Confere se o aluno logado continua válido (não revogado/excluído).
 * Refaz o vínculo se o aparelho perdeu a sessão anônima.
 * Retorna 'ok' | 'revogado' | 'offline'.
 */
async function checarAlunoFirebase(alunoId, codigo) {
  const ok = await initFirebase();
  const uid = firebaseAuth?.currentUser?.uid;
  if (!ok || !uid) return 'offline';
  try {
    if (!codigo) return 'revogado'; // sessão antiga, sem código salvo: pede login de novo
    const vinc = await firebaseDb.ref(`/vinculos/${uid}`).once('value');
    if (vinc.val() !== codigo) await firebaseDb.ref(`/vinculos/${uid}`).set(codigo);
    const snap = await firebaseDb.ref(`/alunos/${alunoId}`).once('value');
    const aluno = snap.val();
    if (!aluno || aluno.revogado) return 'revogado';
    return 'ok';
  } catch (e) {
    return isPermissionError(e) ? 'revogado' : 'offline';
  }
}

/**
 * (Admin) Recria o índice /codigos a partir de /alunos.
 * Alunos revogados ficam fora do índice.
 */
async function syncCodigosFirebase() {
  await initFirebase();
  const snap = await firebaseDb.ref('/alunos').once('value');
  const alunos = snap.val() || {};
  const codigos = {};
  for (const [id, a] of Object.entries(alunos)) {
    if (a && a.codigo && !a.revogado) {
      codigos[String(a.codigo).toUpperCase()] = { alunoId: String(id) };
    }
  }
  await firebaseDb.ref('/codigos').set(codigos);
  return Object.keys(codigos).length;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ============================================================
   ALUNO: ler conteúdo + aulas em tempo real
============================================================ */

async function loadConteudoFirebase() {
  const ok = await initFirebase();
  if (!ok || !firebaseDb) return null;

  return new Promise((resolve) => {
    const ref = firebaseDb.ref('/conteudo');
    ref.on('value', async (snap) => {
      const data = snap.val();
      console.log('[firebase] conteudo recebido:', data ? Object.keys(data) : 'null');
      if (data) {
        window.SonareConteudo = data;
        window.SONGS_LIBRARY = data.musicas || [];
        window.THEORY_CONTENT = data.teoria || {};
        window.EXERCISES = data.exercicios || [];
        window.LESSONS = data.licoes || [];
        console.log('[firebase] conteudo aplicado:',
          'musicas=', window.SONGS_LIBRARY.length,
          'teoria=', Object.keys(window.THEORY_CONTENT).length,
          'exerc=', window.EXERCISES.length,
          'licoes=', window.LESSONS.length);

        // Cache local como fallback
        if (window.SonareDB?.put) {
          try {
            await window.SonareDB.put('conteudo', {
              key: 'sonare-conteudo-cache',
              data,
              updatedAt: Date.now()
            });
          } catch (e) {}
        }
      }
      resolve(data);
    });
  });
}

function loadAulasFirebase(callback) {
  if (!firebaseDb) return;
  const ref = firebaseDb.ref('/aulas');
  ref.on('value', async (snap) => {
    const data = snap.val() || {};
    const aulas = Object.entries(data)
      .map(([id, a]) => ({ id, ...a }))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    callback(aulas);

    // Cache local
    if (window.SonareDB?.clear) {
      try {
        await window.SonareDB.clear('aulas');
        for (const a of aulas) await window.SonareDB.put('aulas', a);
      } catch (e) {}
    }
  });
}

function loadAlunosFirebase(callback) {
  if (!firebaseDb) return;
  const ref = firebaseDb.ref('/alunos');
  ref.on('value', (snap) => {
    const data = snap.val() || {};
    const alunos = Object.entries(data)
      .map(([id, a]) => ({ id, ...a }));
    callback(alunos);
  });
}

/* ============================================================
   PROFESSOR: salvar conteúdo no Firebase
============================================================ */

async function saveAulaFirebase(aula) {
  await initFirebase();
  const id = aula.id || firebaseDb.ref('/aulas').push().key;
  await firebaseDb.ref(`/aulas/${id}`).set({ ...aula, id, updatedAt: Date.now() });
  return id;
}

async function deleteAulaFirebase(id) {
  await initFirebase();
  await firebaseDb.ref(`/aulas/${id}`).remove();
}

const DEFAULT_ALARME_FB = {
  hora: 19,
  minuto: 0,
  dias: [1, 2, 3, 4, 5], // 0=dom, 1=seg, ..., 6=sab
  ativo: true,
};

async function saveAlunoFirebase(aluno) {
  await initFirebase();
  const id = String(aluno.id || Date.now());
  // update (não set) pra não apagar dados que o aluno grava, como /ritmos
  const { ritmos, ...dados } = aluno;
  await firebaseDb.ref(`/alunos/${id}`).update({ ...dados, id, updatedAt: Date.now() });
  await syncCodigosFirebase();
  return id;
}

async function saveAlunoAlarmeFirebase(alunoId, alarme) {
  await initFirebase();
  await firebaseDb.ref(`/alunos/${alunoId}/alarme`).set({ ...alarme, updatedAt: Date.now() });
}

function loadAlunoAlarmeFirebase(alunoId, callback) {
  if (!firebaseDb) return;
  const ref = firebaseDb.ref(`/alunos/${alunoId}/alarme`);
  ref.on('value', (snap) => {
    const data = snap.val() || DEFAULT_ALARME_FB;
    callback(data);
  });
}

async function deleteAlunoFirebase(id) {
  await initFirebase();
  await firebaseDb.ref(`/alunos/${String(id)}`).remove();
  await syncCodigosFirebase();
}

async function saveConteudoFirebase(conteudo) {
  await initFirebase();
  await firebaseDb.ref('/conteudo').set({ ...conteudo, updatedAt: Date.now() });
}

async function saveTopicoTeoriaFirebase(topicKey, topic) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/teoria/${topicKey}`).set({ ...topic, updatedAt: Date.now() });
}

async function saveExercicioFirebase(exId, exercicio) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/exercicios/${exId}`).set({ ...exercicio, updatedAt: Date.now() });
}

async function deleteExercicioFirebase(exId) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/exercicios/${exId}`).remove();
}

async function saveLicaoFirebase(lId, licao) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/licoes/${lId}`).set({ ...licao, updatedAt: Date.now() });
}

async function deleteLicaoFirebase(lId) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/licoes/${lId}`).remove();
}

async function saveMusicaFirebase(mId, musica) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/musicas/${mId}`).set({ ...musica, updatedAt: Date.now() });
}

async function deleteMusicaFirebase(mId) {
  await initFirebase();
  await firebaseDb.ref(`/conteudo/musicas/${mId}`).remove();
}

/* ============================================================
   EXPORTAR pra window
============================================================ */

window.initFirebase = initFirebase;
window.adminLoginFirebase = adminLoginFirebase;
window.adminLogoutFirebase = adminLogoutFirebase;
window.isAdminFirebase = isAdminFirebase;
window.currentUserFirebase = currentUserFirebase;
window.loginAlunoFirebase = loginAlunoFirebase;
window.checarAlunoFirebase = checarAlunoFirebase;
window.syncCodigosFirebase = syncCodigosFirebase;
window.loadConteudoFirebase = loadConteudoFirebase;
window.loadAulasFirebase = loadAulasFirebase;
window.loadAlunosFirebase = loadAlunosFirebase;
window.saveAulaFirebase = saveAulaFirebase;
window.deleteAulaFirebase = deleteAulaFirebase;
window.saveAlunoFirebase = saveAlunoFirebase;
window.saveAlunoAlarmeFirebase = saveAlunoAlarmeFirebase;
window.loadAlunoAlarmeFirebase = loadAlunoAlarmeFirebase;
window.deleteAlunoFirebase = deleteAlunoFirebase;
window.saveConteudoFirebase = saveConteudoFirebase;
window.saveTopicoTeoriaFirebase = saveTopicoTeoriaFirebase;
window.saveExercicioFirebase = saveExercicioFirebase;
window.deleteExercicioFirebase = deleteExercicioFirebase;
window.saveLicaoFirebase = saveLicaoFirebase;
window.deleteLicaoFirebase = deleteLicaoFirebase;
window.saveMusicaFirebase = saveMusicaFirebase;
window.deleteMusicaFirebase = deleteMusicaFirebase;

/* ============================================================
   RITMOS E CONQUISTAS POR ALUNO
============================================================ */
async function saveRitmosFirebase(alunoId, data) {
  await initFirebase();
  await firebaseDb.ref(`/alunos/${alunoId}/ritmos`).set({ ...data, updatedAt: Date.now() });
}

function loadRitmosFirebase(alunoId) {
  return new Promise((resolve) => {
    if (!firebaseDb) return resolve(null);
    firebaseDb.ref(`/alunos/${alunoId}/ritmos`).once('value', (snap) => {
      resolve(snap.val() || null);
    }, () => resolve(null));
  });
}



window.saveRitmosFirebase = saveRitmosFirebase;
window.loadRitmosFirebase = loadRitmosFirebase;
