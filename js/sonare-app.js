// ============= APP PRINCIPAL =============

/**
 * Data 'AAAA-MM-DD' no fuso do aparelho.
 * (toISOString() usa UTC: no Brasil, depois das 21h já virava o dia
 * seguinte, quebrando a sequência e o gráfico semanal.)
 */
function diaLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
window.diaLocal = diaLocal;

const SonareApp = {
  init() {
    this.bindTabs();
    this.bindModals();
    this.bindCards();
    Theory.showTabContent('notes');
    document.querySelectorAll('.theory-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.theory-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Theory.showTabContent(tab.dataset.topic);
      });
    });

    Tuner.init();
    Metronome.init();
    Exercises.init();
    Songs.init();
    Lessons.init();
    Install.init();
    Tasks.init();
    Ritmos.init();
    this.updateProgress();
    this.renderWeeklyChart();
  },

  bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const tabId = 'tab-' + btn.dataset.tab;
        const panel = document.getElementById(tabId);
        if (panel) panel.classList.add('active');
        if (btn.dataset.tab === 'home') this.updateProgress();
      });
    });
  },

  bindModals() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.target.closest('.modal').hidden = true;
      });
    });
    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.hidden = true;
      });
    });
  },

  bindCards() {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const target = card.dataset.jump;
        if (target === 'metronome') {
          document.getElementById('metronomeModal').hidden = false;
        } else if (target === 'qrcode') {
          Install.open();
        } else {
          // Mudar para a aba correspondente
          const btn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
          if (btn) btn.click();
        }
      });
    });
  },

  /** Chamado quando o conteúdo (teoria/exercícios/lições/músicas) chega ou muda no servidor */
  atualizarConteudo() {
    try {
      Exercises.render();
      Lessons.render();
      Songs.render();
      const ativo = document.querySelector('.theory-tab.active');
      Theory.showTabContent(ativo ? ativo.dataset.topic : 'notes');
      this.updateProgress();
    } catch (e) {
      console.warn('[conteudo] re-render:', e);
    }
  },

  toast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { toast.hidden = true; }, 2500);
  },

  // ============= PROGRESSO =============
  addPracticeMinutes(minutes) {
    const data = JSON.parse(localStorage.getItem('practiceData') || '{}');
    const today = diaLocal();
    data[today] = (data[today] || 0) + minutes;
    localStorage.setItem('practiceData', JSON.stringify(data));
    this.updateProgress();
  },

  getPracticeData() {
    return JSON.parse(localStorage.getItem('practiceData') || '{}');
  },

  getStreak() {
    const data = this.getPracticeData();
    const dates = Object.keys(data).sort().reverse();
    if (!dates.length) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = diaLocal(d);
      if (data[key] && data[key] > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  },

  getTotalMinutes() {
    const data = this.getPracticeData();
    return Object.values(data).reduce((a, b) => a + b, 0);
  },

  updateProgress() {
    const streak = this.getStreak();
    const totalMin = this.getTotalMinutes();
    const tasksDone = Tasks.tasks.filter(t => t.done).length;
    const songsPlayed = Songs.playedSongs.length;
    const lessonsDone = Lessons.completedLessons.size;
    const exercisesDone = Exercises.completedExercises.size;

    document.getElementById('statStreak').textContent = streak;
    document.getElementById('statPractice').textContent = totalMin;
    document.getElementById('statTasks').textContent = tasksDone;
    document.getElementById('statSongs').textContent = songsPlayed;
    // Adicionar stats extras se os elementos existirem
    const statLessons = document.getElementById('statLessons');
    if (statLessons) statLessons.textContent = lessonsDone;
    const statExercises = document.getElementById('statExercises');
    if (statExercises) statExercises.textContent = exercisesDone;
  },

  renderWeeklyChart() {
    const chart = document.getElementById('weeklyChart');
    if (!chart) return;
    chart.innerHTML = '';
    const data = this.getPracticeData();
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = diaLocal(d);
      const dayLabel = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()];
      days.push({ label: dayLabel, value: data[key] || 0 });
    }
    const max = Math.max(...days.map(d => d.value), 30);
    days.forEach(d => {
      const div = document.createElement('div');
      div.className = 'week-day';
      const bar = document.createElement('div');
      bar.className = 'week-bar';
      bar.style.height = (d.value > 0 ? Math.max(2, (d.value / max) * 60) : 2) + 'px';
      if (d.value === 0) bar.style.background = 'var(--border)';
      div.appendChild(bar);
      const lbl = document.createElement('div');
      lbl.textContent = d.label;
      div.appendChild(lbl);
      chart.appendChild(div);
    });
  }
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SonareApp.init());
} else {
  SonareApp.init();
}
