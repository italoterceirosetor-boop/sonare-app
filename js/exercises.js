// ============= EXERCÍCIOS =============

const Exercises = {
  currentFilter: 'all',
  completedExercises: new Set(JSON.parse(localStorage.getItem('completedExercises') || '[]')),

  init() {
    document.querySelectorAll('.level-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.level-filter .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.level;
        this.render();
      });
    });
    this.render();
  },

  render() {
    const list = document.getElementById('exerciseList');
    if (!list) return;
    list.innerHTML = '';
    const filtered = this.currentFilter === 'all'
      ? EXERCISES
      : EXERCISES.filter(e => e.level === this.currentFilter);

    if (!filtered.length) {
      list.innerHTML = '<p class="muted">Nenhum exercício neste nível ainda.</p>';
      return;
    }

    filtered.forEach(ex => {
      const isDone = this.completedExercises.has(ex.id);
      const item = document.createElement('div');
      item.className = 'exercise-item';
      item.innerHTML = `
        <div class="exercise-header">
          <div>
            <h3>${isDone ? '✓ ' : ''}${ex.title}</h3>
            <div class="exercise-meta">
              <span class="badge ${ex.level}">${this.levelLabel(ex.level)}</span>
              <span>${ex.category}</span>
              <span>⏱ ${ex.duration}</span>
            </div>
          </div>
          <span class="exercise-arrow">▼</span>
        </div>
        <div class="exercise-body">
          <p>${ex.description}</p>
          <h4 style="font-size:14px;margin:12px 0 8px;color:#2a9d8f">Como fazer:</h4>
          <ol class="exercise-steps">
            ${ex.steps.map(s => `<li>${s}</li>`).join('')}
          </ol>
          <p style="background:#0f1729;padding:10px;border-radius:8px;font-size:13px;margin-top:10px">
            <strong>💡 Dica:</strong> ${ex.tip}
          </p>
          <div class="exercise-actions">
            <button class="primary" data-action="done">${isDone ? '✓ Concluído' : 'Marcar como feito'}</button>
            <button class="secondary" data-action="metronome">⏱ Praticar com metrônomo</button>
          </div>
        </div>
      `;
      // Toggle open
      item.querySelector('.exercise-header').addEventListener('click', () => {
        item.classList.toggle('open');
      });
      // Done button
      item.querySelector('[data-action="done"]').addEventListener('click', e => {
        e.stopPropagation();
        if (isDone) {
          this.completedExercises.delete(ex.id);
        } else {
          this.completedExercises.add(ex.id);
        }
        localStorage.setItem('completedExercises', JSON.stringify([...this.completedExercises]));
        SonareApp.toast(isDone ? 'Exercício desmarcado' : '✓ Exercício concluído! +5 min de prática');
        SonareApp.addPracticeMinutes(5);
        this.render();
      });
      // Metronome
      item.querySelector('[data-action="metronome"]').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('metronomeModal').hidden = false;
        document.getElementById('metroBpm').value = 80;
        document.getElementById('metroDisplay').textContent = '80';
        Metronome.bpm = 80;
      });
      list.appendChild(item);
    });
  },

  levelLabel(level) {
    return { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }[level] || level;
  }
};
