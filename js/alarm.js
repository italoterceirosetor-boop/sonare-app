/* ============================================================
   SONARE — Alarme full-screen + Notification API
   - Overlay full-screen dentro do app
   - Notification API quando app está em background
   - Config persistida em IndexedDB
============================================================ */

const ALARM_COOLDOWN_MS = 5 * 60 * 1000;   // 5 min entre disparos
let audioEl = null;
let tickHandle = null;
let lastFiredKey = null;

function alarmAudio() {
  if (audioEl) return audioEl;
  audioEl = new Audio('assets/alarm.mp3');
  audioEl.loop = true;
  return audioEl;
}

function alarmPad(n) { return String(n).padStart(2, '0'); }

function alarmNowKey(date, cfg) {
  return `${date.getDay()}-${alarmPad(cfg.hora)}:${alarmPad(cfg.minuto)}`;
}

/* ============================================================
   OVERLAY FULL-SCREEN
============================================================ */
function alarmEnsureOverlay() {
  let el = document.getElementById('alarm-overlay');
  if (el) return el;

  el = document.createElement('div');
  el.id = 'alarm-overlay';
  el.className = 'alarm';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-live', 'assertive');
  el.innerHTML = `
    <div class="alarm__icon" aria-hidden="true">!</div>
    <h1 class="alarm__title">Hora de <em>estudar</em>!</h1>
    <p class="alarm__sub">Não dá pra fugir — abre uma aula e confirma que vai começar.</p>
    <button class="alarm__btn" id="alarm-confirm">Confirmar que vou estudar</button>
    <div class="alarm__clock" id="alarm-clock"></div>
  `;
  document.body.appendChild(el);

  el.querySelector('#alarm-confirm').addEventListener('click', async () => {
    // Salva cooldown no aluno logado + IDB
    if (window.SonareAlarmConfig) {
      window.SonareAlarmConfig.ultimaConfirmacao = Date.now();
    }
    await window.SonareDB.setConfig({ ultimaConfirmacao: Date.now() });
    alarmStop();
    alarmShowToast('Boa! Voltamos a esconder o alarme por 5 minutos.');
  });

  return el;
}

function alarmOpenOverlay() {
  const el = alarmEnsureOverlay();
  el.classList.add('is-active');
  // Travar o scroll da página por baixo
  document.body.style.overflow = 'hidden';
  // Tentar fullscreen em dispositivos que permitam
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  // Tocar som em loop
  alarmAudio().play().catch(() => {});
  // Vibrar (se suportado)
  if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]);

  // Atualizar relógio
  const clock = el.querySelector('#alarm-clock');
  const tick = () => {
    const d = new Date();
    clock.textContent = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} · ${d.toLocaleDateString('pt-BR')}`;
  };
  alarmTick();
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(tick, 1000);
}

function alarmCloseOverlay() {
  const el = document.getElementById('alarm-overlay');
  if (el) el.classList.remove('is-active');
  document.body.style.overflow = '';
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
  if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }
}

function alarmStop() {
  alarmCloseOverlay();
  lastFiredKey = null;
}

/* ============================================================
   NOTIFICATION (app em background)
============================================================ */
async function alarmRequestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function alarmFireNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification('Sonare — Hora de estudar!', {
    body: 'Toca no aviso para abrir a aula de hoje.',
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
    tag: 'sonare-alarm',
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 600],
  });
  n.onclick = () => {
    window.focus();
    n.close();
    alarmOpenOverlay();
  };
}

/* ============================================================
   TICK: decide se deve disparar alarme (config vem do aluno logado)
============================================================ */
async function alarmTick() {
  // Pega config do aluno logado (vem do Firebase ou do IDB cache)
  let cfg = window.SonareAlarmConfig;

  if (!cfg) {
    // Fallback: lê do IndexedDB (cache local do aluno)
    cfg = await window.SonareDB.getConfig();
  }

  if (!cfg || !cfg.ativo) return;

  const now = new Date();
  const key = alarmNowKey(now, cfg);

  // Cooldown (após confirmação do aluno)
  if (cfg.ultimaConfirmacao && (Date.now() - cfg.ultimaConfirmacao) < ALARM_COOLDOWN_MS) {
    return;
  }

  if (lastFiredKey === key) return; // já tocou hoje nesse horário

  // Confere dia da semana
  if (cfg.dias && !cfg.dias.includes(now.getDay())) return;

  // Confere hora
  if (now.getHours() !== cfg.hora) return;
  if (now.getMinutes() !== cfg.minuto) return;

  // Confere segundos (janela de 30s pra não perder)
  if (now.getSeconds() > 30) return;

  lastFiredKey = key;

  if (document.hidden) {
    alarmFireNotification();
  } else {
    alarmOpenOverlay();
  }
}

function alarmStartLoop() {
  alarmRequestPermission();
  alarmTick();
  setInterval(alarmTick, 1000 * 30); // a cada 30s
  // Re-verifica imediatamente quando volta ao foreground
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastFiredKey = null; // permite re-disparar ao voltar
      alarmTick();
    }
  });
}

/* ============================================================
   TOAST utilitário
============================================================ */
function alarmShowToast(msg, duration = 3000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

window.SonareAlarm = { stopAlarm: alarmStop, startAlarmLoop: alarmStartLoop, showToast: alarmShowToast };
