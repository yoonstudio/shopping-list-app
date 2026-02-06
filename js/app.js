// ====================================
// 할 일 관리 앱
// ====================================

const todoInput = document.getElementById('todoInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

let todos = [];
let currentFilter = '전체';

const STORAGE_KEY = 'todoList';
const DARK_MODE_KEY = 'darkMode';

function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
        console.error('localStorage 저장 실패:', error);
    }
}

function loadTodos() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) { todos = JSON.parse(data); } else { todos = []; }
    } catch (error) {
        console.error('localStorage 로드 실패:', error);
        todos = [];
    }
}

function addTodo() {
    const title = todoInput.value.trim();
    const category = categorySelect.value;
    if (title === '') { alert('할 일을 입력해주세요!'); return; }
    const newTodo = {
        id: Date.now() + Math.random(),
        title: title,
        category: category,
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    saveTodos();
    todoInput.value = '';
    todoInput.focus();
    renderTodos();
}

function updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressBar');
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressText.textContent = `${completed}/${total} 완료`;
    progressPercent.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
}

function renderTodos() {
    todoList.innerHTML = '';
    const filteredTodos = currentFilter === '전체'
        ? todos
        : todos.filter(todo => todo.category === currentFilter);
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<div class="empty-message">할 일이 없습니다.</div>';
        updateProgress();
        return;
    }
    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;
        if (todo.completed) { todoItem.classList.add('completed'); }
        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''}>
            <span class="category-badge category-${todo.category}">${todo.category}</span>
            <span class="todo-title" data-id="${todo.id}">${todo.title}</span>
            <button class="edit-btn" data-id="${todo.id}">✎</button>
            <button class="delete-btn" data-id="${todo.id}">×</button>
        `;
        todoItem.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        todoItem.querySelector('.edit-btn').addEventListener('click', () => editTodo(todo.id));
        todoItem.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        todoList.appendChild(todoItem);
    });
    updateProgress();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        if (todo.completed) { todo.completedAt = new Date().toISOString(); } else { delete todo.completedAt; }
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        }
    }
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    if (!todoItem) return;
    if (todoItem.classList.contains('editing')) return;
    todoItem.classList.add('editing');
    const titleSpan = todoItem.querySelector('.todo-title');
    const currentTitle = todo.title;
    const currentCategory = todo.category;
    titleSpan.innerHTML = `
        <input type="text" class="edit-input" value="${currentTitle}">
        <select class="edit-category">
            <option value="업무" ${currentCategory === '업무' ? 'selected' : ''}>업무</option>
            <option value="개인" ${currentCategory === '개인' ? 'selected' : ''}>개인</option>
            <option value="공부" ${currentCategory === '공부' ? 'selected' : ''}>공부</option>
        </select>
        <button class="save-btn">저장</button>
        <button class="cancel-btn">취소</button>
    `;
    const editInput = todoItem.querySelector('.edit-input');
    const editCategory = todoItem.querySelector('.edit-category');
    const saveBtn = todoItem.querySelector('.save-btn');
    const cancelBtn = todoItem.querySelector('.cancel-btn');
    editInput.focus();
    editInput.select();
    const save = () => {
        const newTitle = editInput.value.trim();
        const newCategory = editCategory.value;
        if (newTitle === '') { alert('할 일을 입력해주세요!'); editInput.focus(); return; }
        todo.title = newTitle;
        todo.category = newCategory;
        saveTodos();
        renderTodos();
    };
    const cancel = () => { renderTodos(); };
    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cancel);
    editInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { save(); } });
    editInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cancel(); } });
}

function setFilter(filter) {
    currentFilter = filter;
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
    if (activeBtn) { activeBtn.classList.add('active'); }
    renderTodos();
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { addTodo(); } });

function saveDarkMode(isDark) {
    try { localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark)); }
    catch (error) { console.error('다크 모드 설정 저장 실패:', error); }
}

function loadDarkMode() {
    try { const data = localStorage.getItem(DARK_MODE_KEY); return data ? JSON.parse(data) : false; }
    catch (error) { console.error('다크 모드 설정 로드 실패:', error); return false; }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    saveDarkMode(isDark);
}

function initDarkMode() {
    const isDark = loadDarkMode();
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (isDark) { document.body.classList.add('dark-mode'); darkModeToggle.textContent = '☀️'; }
    else { darkModeToggle.textContent = '🌙'; }
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => { setFilter(btn.getAttribute('data-filter')); });
    });
    initDarkMode();
    renderTodos();
    todoInput.focus();
});
