/* ============================================================
   SONARE — Gerenciador de conteúdo editável
   Carrega conteudo.json (do servidor) ou seed.json (fallback),
   com cache no IndexedDB. Injeta em window.SonareConteudo.
============================================================ */

const SONARE_CONTEUDO_INDEX = 'sonare-conteudo-cache';

async function fetchJSON(url) {
  try {
    const resp = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}

async function loadConteudo() {
  // 1. SEMPRE tenta Firebase primeiro (fonte de verdade)
  try {
    if (window.initFirebase) {
      const fbOk = await window.initFirebase();
      if (fbOk) {
        // Espera o Firebase retornar dados (com timeout de 5s)
        const conteudoFb = await new Promise((resolve) => {
          let done = false;
          const ref = window.firebase?.database?.()?.ref?.('/conteudo');
          if (!ref) { resolve(null); return; }
          ref.once('value', (snap) => {
            if (done) return;
            done = true;
            resolve(snap.val());
          });
          setTimeout(() => { if (!done) { done = true; resolve(null); } }, 5000);
        });
        console.log('[conteudo.js] Firebase retornou:', conteudoFb ? Object.keys(conteudoFb) : 'null');
        // Listener em tempo real vai continuar escutando mudanças
        const fb = window.firebase?.database?.();
        if (fb) {
          fb.ref('/conteudo').on('value', (snap) => {
            const data = snap.val();
            if (data) aplicarConteudo(data);
          });
        }

        if (conteudoFb && Object.keys(conteudoFb).length > 0) {
          aplicarConteudo(conteudoFb);
          return conteudoFb;
        }
      }
    }
  } catch (e) {
    console.warn('[conteudo.js] Firebase falhou, usando fallback:', e.message);
  }

  // Fallback: conteudo.json / seed.json
  let conteudo = await fetchJSON('./data/conteudo.json');
  if (!conteudo) conteudo = await fetchJSON('./data/seed.json');
  if (!conteudo) conteudo = { version: '0', teoria: {}, exercicios: [], licoes: [], musicas: [] };

  // Cache no IndexedDB
  if (window.SonareDB?.put) {
    try {
      await window.SonareDB.put('conteudo', { key: SONARE_CONTEUDO_INDEX, data: conteudo, updatedAt: Date.now() });
    } catch (e) {}
  }

  aplicarConteudo(conteudo);
  console.log('[conteudo.js] Conteúdo fallback carregado:',
    conteudo.musicas?.length || 0, 'músicas,',
    conteudo.exercicios?.length || 0, 'exercícios,',
    conteudo.licoes?.length || 0, 'lições,',
    Object.keys(conteudo.teoria || {}).length, 'tópicos');
  return conteudo;
}

// Função auxiliar que aplica o conteúdo em todas as vars globais
function aplicarConteudo(conteudo) {
  if (!conteudo) return;
  window.SonareConteudo = conteudo;
  // O Firebase às vezes devolve lista como objeto {0:...,1:...}; e não guarda
  // lista vazia. Se a parte não veio, mantém o conteúdo de fábrica (sonare-data.js).
  const lista = (v) => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === 'object' ? Object.values(v).filter(Boolean) : null);
  const musicas = lista(conteudo.musicas);
  const exercicios = lista(conteudo.exercicios);
  const licoes = lista(conteudo.licoes);
  // (sonare-data.js declara com "var", então isto troca o que as telas leem)
  if (musicas) window.SONGS_LIBRARY = musicas;
  if (conteudo.teoria && typeof conteudo.teoria === 'object') window.THEORY_CONTENT = conteudo.teoria;
  if (exercicios) window.EXERCISES = exercicios;
  if (licoes) window.LESSONS = licoes;
  // Cache local
  if (window.SonareDB?.put) {
    window.SonareDB.put('conteudo', { key: SONARE_CONTEUDO_INDEX, data: conteudo, updatedAt: Date.now() }).catch(() => {});
  }
  // Re-renderiza a aba atual do aluno se o SonareApp já tiver carregado
  if (typeof SonareApp !== 'undefined' && SonareApp.atualizarConteudo) {
    SonareApp.atualizarConteudo();
  }
}

window.loadConteudo = loadConteudo;
