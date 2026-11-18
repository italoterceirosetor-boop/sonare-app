// ============= APOSTILAS / LIÇÕES =============

const Lessons = {
  completedLessons: new Set(JSON.parse(localStorage.getItem('completedLessons') || '[]')),
  currentFilter: 'all',

  init() {
    document.querySelectorAll('.lesson-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lesson-filter .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.level;
        this.render();
      });
    });
    this.render();
  },

  render() {
    const list = document.getElementById('lessonList');
    if (!list) return;
    list.innerHTML = '';
    const filtered = this.currentFilter === 'all'
      ? LESSONS
      : LESSONS.filter(l => l.level === this.currentFilter);

    if (!filtered.length) {
      list.innerHTML = '<p class="muted">Nenhuma lição neste nível.</p>';
      return;
    }

    // Estatísticas de progresso
    const total = LESSONS.length;
    const done = this.completedLessons.size;
    const pct = Math.round((done / total) * 100);
    const statsHtml = `
      <div style="background:var(--bg-3);padding:14px;border-radius:8px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <strong>Progresso geral</strong>
          <span style="color:var(--primary);font-weight:600">${done}/${total} (${pct}%)</span>
        </div>
        <div style="background:var(--card);height:8px;border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--primary);transition:width .4s"></div>
        </div>
      </div>
    `;
    list.insertAdjacentHTML('beforeend', statsHtml);

    filtered.forEach(lesson => {
      const isDone = this.completedLessons.has(lesson.id);
      const item = document.createElement('div');
      item.className = 'exercise-item';
      item.innerHTML = `
        <div class="exercise-header">
          <div>
            <h3>${isDone ? '✓ ' : ''}${lesson.title}</h3>
            <div class="exercise-meta">
              <span class="badge ${lesson.level}">${this.levelLabel(lesson.level)}</span>
              <span>⏱ ${lesson.duration}</span>
            </div>
          </div>
          <span class="exercise-arrow">▼</span>
        </div>
        <div class="exercise-body">
          <p style="color:var(--text-muted);font-style:italic">${lesson.summary}</p>
          <div class="lesson-content" data-content="${lesson.id}"></div>
          <div class="exercise-actions">
            <button class="primary" data-action="done">${isDone ? '✓ Concluída' : 'Marcar como lida'}</button>
          </div>
        </div>
      `;
      // Toggle open + lazy render do conteúdo
      const header = item.querySelector('.exercise-header');
      header.addEventListener('click', () => {
        const isOpen = item.classList.toggle('open');
        if (isOpen) {
          const contentDiv = item.querySelector('.lesson-content');
          if (!contentDiv.innerHTML) {
            contentDiv.innerHTML = lesson.content;
          }
        }
      });
      // Done
      item.querySelector('[data-action="done"]').addEventListener('click', e => {
        e.stopPropagation();
        if (isDone) {
          this.completedLessons.delete(lesson.id);
        } else {
          this.completedLessons.add(lesson.id);
          SonareApp.toast('✓ Lição concluída!');
        }
        localStorage.setItem('completedLessons', JSON.stringify([...this.completedLessons]));
        this.render();
        SonareApp.updateProgress();
      });
      list.appendChild(item);
    });
  },

  levelLabel(level) {
    return { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }[level] || level;
  }
};
