let supabaseUrl = '';
let supabaseKey = '';
let tableName = '';

const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-description');
const taskList = document.getElementById('task-list');
const statusMessage = document.getElementById('status-message');

let editingTaskId = null;

async function init() {
    try {
        const res = await fetch('config.json');
        if (!res.ok) throw new Error('Failed to load config.json');
        const config = await res.json();

        supabaseUrl = config.supabaseUrl;
        supabaseKey = config.supabasePublishableKey;
        tableName = config.tableName;

        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
}

function getHeaders() {
    return {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

function showMessage(msg, isError = false) {
    statusMessage.textContent = msg;
    statusMessage.style.color = isError ? 'red' : 'green';
    setTimeout(() => { statusMessage.textContent = ''; }, 3000);
}

async function loadTasks() {
    try {
        const response = await fetch(`${supabaseUrl}rest/v1/${tableName}?select=*&order=id.asc`, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to load tasks');

        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        showMessage(error.message, true);
    }
}

function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.setAttribute('data-id', task.id);

        taskItem.innerHTML = `
            <h3 class="task-title" style="${task.completed ? 'text-decoration: line-through;' : ''}">${task.title}</h3>
            <p class="task-description">${task.description || ''}</p>
            <p class="task-status">Status: ${task.completed ? 'Completed' : 'Incomplete'}</p>
            <button class="toggle-task" onclick="toggleTask(${task.id}, ${task.completed})">Toggle Status</button>
            <button class="edit-task" onclick="editTask(${task.id}, '${task.title}', '${task.description || ''}')">Edit</button>
            <button class="delete-task" onclick="deleteTask(${task.id})">Delete</button>
            <hr>
        `;
        taskList.appendChild(taskItem);
    });
}

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title) return;

    const taskData = { title, description };

    try {
        let url = `${supabaseUrl}rest/v1/${tableName}`;
        let method = 'POST';

        if (editingTaskId) {
            url = `${url}?id=eq.${editingTaskId}`;
            method = 'PUT';
            taskData.id = editingTaskId;
            taskData.completed = false;
        }

        const response = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });

        if (!response.ok) throw new Error('Failed to save task');

        showMessage(editingTaskId ? 'Task updated!' : 'Task added!');

        taskForm.reset();
        editingTaskId = null;
        document.getElementById('task-submit').textContent = 'Add/Save Task';

        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
});

window.editTask = (id, title, description) => {
    editingTaskId = id;
    titleInput.value = title;
    descInput.value = description;
    document.getElementById('task-submit').textContent = 'Save Changes';
};

window.toggleTask = async (id, currentStatus) => {
    try {
        const response = await fetch(`${supabaseUrl}rest/v1/${tableName}?id=eq.${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ completed: !currentStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');
        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
};

window.deleteTask = async (id) => {
    try {
        const response = await fetch(`${supabaseUrl}rest/v1/${tableName}?id=eq.${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete task');
        showMessage('Task deleted');
        await loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
};

init();