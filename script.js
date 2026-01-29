class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.showHistory = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDate();
        this.renderTasks();
        this.updateStats();
    }

    setupEventListeners() {
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const taskList = document.getElementById('taskList');
        const showHistory = document.getElementById('showHistory');

        addTaskBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                this.setFilter(button.dataset.filter);
                this.updateFilterButtons(button);
            });
        });

        taskList.addEventListener('click', (event) => {
            const target = event.target;
            const taskItem = target.closest('.task-item');
            if (!taskItem) return;

            const taskId = Number(taskItem.dataset.id);
            if (target.classList.contains('task-checkbox')) {
                this.toggleTask(taskId);
            }
            if (target.classList.contains('task-delete')) {
                this.deleteTask(taskId);
            }
        });

        showHistory.addEventListener('change', (event) => {
            this.showHistory = event.target.checked;
            this.renderTasks();
            this.updateStats();
        });
    }

    updateDate() {
        const dateElement = document.getElementById('currentDate');
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const today = new Date();
        dateElement.textContent = today.toLocaleDateString('es-ES', options);
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            this.showMessage('Por favor, escribe una tarea');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        taskInput.value = '';
        taskInput.focus();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    }

    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showMessage('No hay tareas completadas para eliminar');
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar ${completedCount} tarea(s) completada(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.renderTasks();
    }

    updateFilterButtons(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-pressed', 'true');
    }

    getFilteredTasks() {
        const today = new Date().toDateString();
        const visibleTasks = this.showHistory
            ? this.tasks
            : this.tasks.filter(task => new Date(task.createdAt).toDateString() === today);

        switch (this.currentFilter) {
            case 'completed':
                return visibleTasks.filter(t => t.completed);
            case 'pending':
                return visibleTasks.filter(t => !t.completed);
            default:
                return visibleTasks;
        }
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <button class="task-checkbox ${task.completed ? 'checked' : ''}" 
                        type="button"
                        aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}"></button>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <span class="task-time">${this.formatTime(task.createdAt)}</span>
                <button class="task-delete" type="button" aria-label="Eliminar tarea">×</button>
            </li>
        `).join('');
    }

    updateStats() {
        const totalTasks = document.getElementById('totalTasks');
        const completedTasks = document.getElementById('completedTasks');
        const pendingTasks = document.getElementById('pendingTasks');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');

        const visibleTasks = this.getFilteredTasks();
        const total = visibleTasks.length;
        const completed = visibleTasks.filter(t => t.completed).length;
        const pending = total - completed;

        totalTasks.textContent = total;
        completedTasks.textContent = completed;
        pendingTasks.textContent = pending;

        const totalCompleted = this.tasks.filter(t => t.completed).length;
        clearCompletedBtn.disabled = totalCompleted === 0;
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins} min`;
        if (diffHours < 24) return `hace ${diffHours} h`;
        if (diffDays < 7) return `hace ${diffDays} d`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message) {
        const toastRegion = document.getElementById('toastRegion');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'toast';
        messageDiv.textContent = message;
        toastRegion.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }

    saveTasks() {
        localStorage.setItem('dailyTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('dailyTasks');
        if (saved) {
            try {
                const tasks = JSON.parse(saved);
                return Array.isArray(tasks) ? tasks : [];
            } catch (e) {
                console.error('Error loading tasks:', e);
                return [];
            }
        }
        return [];
    }
}

let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});
