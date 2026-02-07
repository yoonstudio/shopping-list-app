// ====================================
// 할 일 관리 앱 (Supabase 연동)
// ====================================

// Supabase 설정
const SUPABASE_URL = 'https://vcdivsohwtxwycrcygph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZGl2c29od3R4d3ljcmN5Z3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mzg5MzIsImV4cCI6MjA4NjAxNDkzMn0.fYiccA6YJE1NvpQDOSyHYJY2NR2ndmSK-ytUxcKa-p8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const todoInput = document.getElementById('todoInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

// 전역 변수
let todos = []; // 할 일 배열
let currentFilter = '전체'; // 현재 활성화된 필터

// 상수
const DARK_MODE_KEY = 'darkMode'; // 다크 모드 localStorage 키

// ====================================
// Supabase 데이터 함수
// ====================================

/**
 * Supabase에서 할 일 목록 불러오기
 */
async function loadTodos() {
    try {
        const { data, error } = await supabase
            .from('shopping_items')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        todos = data.map(item => ({
            id: item.id,
            title: item.title,
            category: item.category,
            completed: item.completed,
            createdAt: item.created_at,
            completedAt: item.completed_at
        }));
    } catch (error) {
        console.error('Supabase 로드 실패:', error);
        todos = [];
    }
}

/**
 * Supabase에 할 일 추가
 */
async function addTodoToDB(todo) {
    try {
        const { data, error } = await supabase
            .from('shopping_items')
            .insert({
                title: todo.title,
                category: todo.category,
                completed: todo.completed,
                created_at: todo.createdAt
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Supabase 추가 실패:', error);
        return null;
    }
}

/**
 * Supabase에서 할 일 업데이트
 */
async function updateTodoInDB(id, updates) {
    try {
        const dbUpdates = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

        const { error } = await supabase
            .from('shopping_items')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Supabase 업데이트 실패:', error);
    }
}

/**
 * Supabase에서 할 일 삭제
 */
async function deleteTodoFromDB(id) {
    try {
        const { error } = await supabase
            .from('shopping_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Supabase 삭제 실패:', error);
    }
}

// ====================================
// 할 일 CRUD 함수
// ====================================

// 할 일 추가 함수
async function addTodo() {
    const title = todoInput.value.trim();
    const category = categorySelect.value;

    // 입력 검증
    if (title === '') {
        alert('할 일을 입력해주세요!');
        return;
    }

    // 새로운 할 일 객체 생성
    const newTodo = {
        title: title,
        category: category,
        completed: false,
        createdAt: new Date().toISOString()
    };

    // Supabase에 저장
    const saved = await addTodoToDB(newTodo);
    if (saved) {
        todos.push({
            id: saved.id,
            title: saved.title,
            category: saved.category,
            completed: saved.completed,
            createdAt: saved.created_at,
            completedAt: saved.completed_at
        });
    }

    // 입력 필드 초기화
    todoInput.value = '';
    todoInput.focus();

    // 목록 렌더링
    renderTodos();
}

// 진행률 업데이트 함수
function updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressBar');

    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    // 텍스트 업데이트
    progressText.textContent = `${completed}/${total} 완료`;
    progressPercent.textContent = `${percentage}%`;

    // 진행률 바 업데이트
    progressBar.style.width = `${percentage}%`;
}

// 할 일 목록 렌더링 함수
function renderTodos() {
    // 목록 초기화
    todoList.innerHTML = '';

    // 필터링된 할 일 목록
    const filteredTodos = currentFilter === '전체'
        ? todos
        : todos.filter(todo => todo.category === currentFilter);

    // 할 일이 없는 경우
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<div class="empty-message">할 일이 없습니다.</div>';
        // 진행률 업데이트는 항상 실행
        updateProgress();
        return;
    }

    // 각 할 일 항목 생성
    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;

        // 완료된 항목에 클래스 추가
        if (todo.completed) {
            todoItem.classList.add('completed');
        }

        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''}>
            <span class="category-badge category-${todo.category}">${todo.category}</span>
            <span class="todo-title" data-id="${todo.id}">${todo.title}</span>
            <button class="edit-btn" data-id="${todo.id}">✎</button>
            <button class="delete-btn" data-id="${todo.id}">×</button>
        `;

        // 체크박스 이벤트 리스너
        const checkbox = todoItem.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        // 수정 버튼 이벤트 리스너
        const editBtn = todoItem.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editTodo(todo.id));

        // 삭제 버튼 이벤트 리스너
        const deleteBtn = todoItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        todoList.appendChild(todoItem);
    });

    // 진행률 업데이트
    updateProgress();
}

// 할 일 완료 상태 토글 함수
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;

        // 완료 시간 기록
        if (todo.completed) {
            todo.completedAt = new Date().toISOString();
        } else {
            todo.completedAt = null;
        }

        // Supabase에 업데이트
        await updateTodoInDB(id, {
            completed: todo.completed,
            completedAt: todo.completedAt
        });

        // 목록 렌더링
        renderTodos();
    }
}

// 할 일 삭제 함수
async function deleteTodo(id) {
    // 삭제 확인
    if (confirm('정말 삭제하시겠습니까?')) {
        // Supabase에서 삭제
        await deleteTodoFromDB(id);

        // 배열에서 제거
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos.splice(index, 1);
        }

        // 목록 렌더링
        renderTodos();
    }
}

// 할 일 수정 함수
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    if (!todoItem) return;

    // 이미 수정 모드인 경우 방지
    if (todoItem.classList.contains('editing')) return;

    // 수정 모드 클래스 추가
    todoItem.classList.add('editing');

    // 현재 내용 저장
    const titleSpan = todoItem.querySelector('.todo-title');
    const currentTitle = todo.title;
    const currentCategory = todo.category;

    // 수정 UI로 변경
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

    // 입력 필드에 포커스
    editInput.focus();
    editInput.select();

    // 저장 함수
    const save = async () => {
        const newTitle = editInput.value.trim();
        const newCategory = editCategory.value;

        if (newTitle === '') {
            alert('할 일을 입력해주세요!');
            editInput.focus();
            return;
        }

        // 데이터 업데이트
        todo.title = newTitle;
        todo.category = newCategory;

        // Supabase에 저장
        await updateTodoInDB(id, { title: newTitle, category: newCategory });

        // 목록 렌더링
        renderTodos();
    };

    // 취소 함수
    const cancel = () => {
        renderTodos();
    };

    // 이벤트 리스너
    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cancel);

    // Enter 키로 저장
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            save();
        }
    });

    // Escape 키로 취소
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancel();
        }
    });
}

// 필터 변경 함수
function setFilter(filter) {
    currentFilter = filter;

    // 모든 필터 버튼에서 active 클래스 제거
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));

    // 클릭된 버튼에 active 클래스 추가
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // 목록 렌더링
    renderTodos();
}

// 이벤트 리스너
addBtn.addEventListener('click', addTodo);

// Enter 키 이벤트
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// ====================================
// 다크 모드 함수
// ====================================

/**
 * 다크 모드 설정 저장
 */
function saveDarkMode(isDark) {
    try {
        localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
    } catch (error) {
        console.error('다크 모드 설정 저장 실패:', error);
    }
}

/**
 * 다크 모드 설정 불러오기
 */
function loadDarkMode() {
    try {
        const data = localStorage.getItem(DARK_MODE_KEY);
        return data ? JSON.parse(data) : false;
    } catch (error) {
        console.error('다크 모드 설정 로드 실패:', error);
        return false;
    }
}

/**
 * 다크 모드 토글
 */
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // 아이콘 변경
    if (isDark) {
        darkModeToggle.textContent = '☀️';
    } else {
        darkModeToggle.textContent = '🌙';
    }

    // 설정 저장
    saveDarkMode(isDark);
}

/**
 * 다크 모드 초기화
 */
function initDarkMode() {
    const isDark = loadDarkMode();
    const darkModeToggle = document.getElementById('darkModeToggle');

    if (isDark) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    } else {
        darkModeToggle.textContent = '🌙';
    }

    // 토글 버튼 이벤트 리스너
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase에서 데이터 로드
    await loadTodos();

    // 필터 버튼 이벤트 리스너
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            setFilter(filter);
        });
    });

    // 다크 모드 초기화
    initDarkMode();

    // 목록 렌더링
    renderTodos();

    // 입력 필드에 포커스
    todoInput.focus();
});
