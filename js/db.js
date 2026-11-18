/* ============================================================
   SONARE — Wrapper IndexedDB
   Stores: aulas, alunos, config, sessoes
============================================================ */

const DB_NAME = 'sonare-db';
const DB_VERSION = 1;

const STORES = {
  aulas: { key: 'id', autoIncrement: true },
  alunos: { key: 'id', autoIncrement: true },
  sessoes: { key: 'key' },         // key: 'aluno' (código aluno logado)
  config: { key: 'key' },         // key: 'alarme' (config do lembrete)
  conteudo: { key: 'key' },       // key: 'sonare-conteudo-cache'
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const [name, opts] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, {
            keyPath: opts.key,
            autoIncrement: opts.autoIncrement || false,
          });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(storeName, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(storeName) {
  const store = await tx(storeName);
  return reqToPromise(store.getAll());
}

async function dbGet(storeName, key) {
  const store = await tx(storeName);
  return reqToPromise(store.get(key));
}

async function dbPut(storeName, value) {
  const store = await tx(storeName, 'readwrite');
  return reqToPromise(store.put(value));
}

async function dbDel(storeName, key) {
  const store = await tx(storeName, 'readwrite');
  return reqToPromise(store.delete(key));
}

async function dbClear(storeName) {
  const store = await tx(storeName, 'readwrite');
  return reqToPromise(store.clear());
}

/* ============================================================
   SESSÃO DO ALUNO
============================================================ */
async function dbGetAlunoLogado() {
  const session = await dbGet('sessoes', 'aluno');
  if (!session) return null;
  const aluno = await dbGet('alunos', session.alunoId);
  return aluno || null;
}

/**
 * Login do aluno por código.
 * Com Firebase configurado, o servidor é quem valida: o app NÃO baixa
 * mais a lista de alunos. Retorna o aluno ou { erro: 'invalido' | 'revogado' | 'offline' }.
 */
async function dbLoginAluno(codigo) {
  codigo = String(codigo || '').trim().toUpperCase();
  let aluno;

  if (window.FIREBASE_CONFIGURED && window.loginAlunoFirebase) {
    const r = await window.loginAlunoFirebase(codigo);
    if (r.erro) return r;
    aluno = r;
    // Guarda só o próprio aluno no aparelho
    await dbClear('alunos');
    await dbPut('alunos', aluno);
  } else {
    // Modo sem servidor (desenvolvimento): procura nos alunos locais
    const alunos = await dbGetAll('alunos');
    aluno = alunos.find(a => a.codigo && a.codigo.toUpperCase() === codigo);
    if (!aluno) return { erro: 'invalido' };
    if (aluno.revogado) return { erro: 'revogado' };
  }

  await dbPut('sessoes', { key: 'aluno', alunoId: aluno.id, codigo, loginAt: Date.now() });
  return aluno;
}

/** Sessão salva (alunoId + código), ou null */
async function dbGetSessao() {
  return (await dbGet('sessoes', 'aluno')) || null;
}

async function dbLogout() {
  await dbDel('sessoes', 'aluno');
}

/* ============================================================
   CONFIG DO ALARME
============================================================ */
const DEFAULT_CONFIG = {
  key: 'alarme',
  hora: 19,
  minuto: 0,
  dias: [1,2,3,4,5],
  ativo: true,
  ultimaConfirmacao: 0,
};

async function dbGetConfig() {
  const cfg = await dbGet('config', 'alarme');
  return cfg || { ...DEFAULT_CONFIG };
}

async function dbSetConfig(partial) {
  const current = await dbGetConfig();
  const next = { ...current, ...partial, key: 'alarme' };
  await dbPut('config', next);
  return next;
}

/* ============================================================
   SEED INICIAL (primeiro acesso do aluno)
============================================================ */
async function dbSeedIfNeeded(seedData) {
  const existing = await dbGetAll('aulas');
  if (existing.length > 0) return;

  for (const aula of seedData.aulas || []) {
    delete aula.id;
    await dbPut('aulas', aula);
  }

  const alunos = await dbGetAll('alunos');
  if (alunos.length === 0 && seedData.alunos?.length) {
    for (const aluno of seedData.alunos) {
      delete aluno.id;
      await dbPut('alunos', aluno);
    }
  }
}

// Expor tudo globalmente
window.SonareDB = {
  getAll: dbGetAll, get: dbGet, put: dbPut, del: dbDel, clear: dbClear,
  getAlunoLogado: dbGetAlunoLogado, loginAluno: dbLoginAluno, logout: dbLogout,
  getSessao: dbGetSessao,
  getConfig: dbGetConfig, setConfig: dbSetConfig,
  seedIfNeeded: dbSeedIfNeeded,
};
