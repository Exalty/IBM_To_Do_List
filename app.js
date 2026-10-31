// ===== State =====
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let filter = 'all';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();

  // Allow Enter key to add task
  document.getElementById('taskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
});

// ===== Add Task =====
function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }

  tasks.unshift({
    id: Date.now(),
    text,
    done: false,
    createdAt: new Date().toISOString()
  });

  input.value = '';
  input.focus();
  saveAndRender();
}

// ===== Toggle Done =====
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveAndRender();
  }
}

// ===== Delete Task =====
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAndRender();
}

// ===== Clear Done =====
function clearDone() {
  const hasDone = tasks.some(t => t.done);
  if (!hasDone) return;
  tasks = tasks.filter(t => !t.done);
  saveAndRender();
}

// ===== Set Filter =====
function setFilter(f) {
  filter = f;
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + f).classList.add('active');
  renderTasks();
}

// ===== Save & Render =====
function saveAndRender() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

// ===== Render =====
function renderTasks() {
  const list = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');

  let visible = tasks;
  if (filter === 'active') visible = tasks.filter(t => !t.done);
  if (filter === 'done')   visible = tasks.filter(t => t.done);

  // Stats
  const total  = tasks.length;
  const done   = tasks.filter(t => t.done).length;
  const active = total - done;
  const statsEl = document.getElementById('statsText');
  statsEl.textContent = `${total} tugas • ${active} aktif • ${done} selesai`;

  // Clear Done Button visibility
  document.getElementById('clearBtn').style.display = done > 0 ? 'inline-block' : 'none';

  // Render items
  list.innerHTML = '';

  if (visible.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  visible.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.innerHTML = `
      <input
        type="checkbox"
        class="task-check"
        ${task.done ? 'checked' : ''}
        onchange="toggleTask(${task.id})"
        aria-label="Tandai selesai"
      />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="btn-delete" onclick="deleteTask(${task.id})" aria-label="Hapus tugas">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    `;
    list.appendChild(li);
  });
}

// ===== Escape HTML =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
