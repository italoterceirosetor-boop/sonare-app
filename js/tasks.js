// ============= TAREFAS E PRÁTICA =============

const Tasks = {
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  currentFilter: 'pending',

  init() {
    document.getElementById('taskAddBtn').addEventListener('click', () => this.addTask());
    document.getElementById('taskInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.addTask();
    });
    // Data padrão: hoje
    document.getElementById('taskDate').valueAsDate = new Date();

    document.querySelectorAll('.task-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.task-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
    this.render();
  },

  addTask() {
    const input = document.getElementById('taskInput');
    const category = document.getElementById('taskCategory').value;
    const date = document.getElementById('taskDate').value;
    const text = input.value.trim();
    if (!text) return;
    this.tasks.push({
      id: 'task_' + Date.now(),
      text,
      category,
      dueDate: date,
      done: false,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    input.value = '';
    this.render();
    SonareApp.toast('Tarefa adicionada!');
  },

  toggle(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    task.completedAt = task.done ? new Date().toISOString() : null;
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    if (task.done) {
      SonareApp.toast('✓ Tarefa concluída!');
    }
    this.render();
    SonareApp.updateProgress();
  },

  remove(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    this.render();
  },

  render() {
    const list = document.getElementById('taskList');
    if (!list) return;
    list.innerHTML = '';
    let filtered = this.tasks;
    if (this.currentFilter === 'pending') {
      filtered = this.tasks.filter(t => !t.done);
    } else if (this.currentFilter === 'done') {
      filtered = this.tasks.filter(t => t.done);
    }
    // Ordenar por data (mais próximo primeiro) e por status
    filtered.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    if (!filtered.length) {
      list.innerHTML = `<p class="muted" style="text-align:center;padding:20px">
        ${this.currentFilter === 'done' ? 'Nenhuma tarefa concluída ainda.' :
          this.currentFilter === 'pending' ? 'Nenhuma tarefa pendente! 🎉' : 'Nenhuma tarefa. Adicione uma acima!'}
      </p>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    filtered.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item' + (task.done ? ' done' : '');
      const catLabels = { study: 'Estudo', practice: 'Prática', repertoire: 'Repertório', theory: 'Teoria' };
      const overdue = !task.done && task.dueDate && task.dueDate < today;
      const isToday = !task.done && task.dueDate === today;
      const dateLabel = task.dueDate ? new Date(task.dueDate + 'T00:00').toLocaleDateString('pt-BR') : 'Sem data';
      item.innerHTML = `
        <div class="task-check ${task.done ? 'checked' : ''}" data-id="${task.id}"></div>
        <div class="task-info">
          <div class="task-text">${task.text}</div>
          <div class="task-meta">
            <span class="badge">${catLabels[task.category] || task.category}</span>
            <span style="${overdue ? 'color:#e76f51' : isToday ? 'color:#f4a261' : ''}">
              📅 ${dateLabel} ${overdue ? '(atrasada)' : isToday ? '(hoje)' : ''}
            </span>
          </div>
        </div>
        <button class="task-delete" data-del="${task.id}">🗑</button>
      `;
      item.querySelector('.task-check').addEventListener('click', () => this.toggle(task.id));
      item.querySelector('.task-delete').addEventListener('click', () => {
        if (confirm('Excluir tarefa?')) this.remove(task.id);
      });
      list.appendChild(item);
    });
  }
};
