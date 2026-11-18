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
    firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
    firebaseDb = firebase.database();
    firebaseAuth = firebase.auth();

    // Login anônimo (não precisa email/senha)
    await firebaseAuth.signInAnonymously();
    console.log('[firebase] conectado como', firebaseAuth.currentUser?.uid);
    return true;
  } catch (err) {
    console.warn('[firebase] erro ao iniciar:', err.message);
    return false;
  }
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
  // SEMPRE usa o id local (number) — gera id se não existir
  const id = aluno.id || Date.now().toString();
  await firebaseDb.ref(`/alunos/${id}`).set({ ...aluno, id, createdAt: Date.now() });
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
  await firebaseDb.ref(`/alunos/${id}`).remove();
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
