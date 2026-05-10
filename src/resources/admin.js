let resources = [];

const resourceForm = document.getElementById('resource-form');
const resourcesTbody = document.getElementById('resources-tbody');
const submitButton = document.getElementById('add-resource');

function createResourceRow(resource) {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.textContent = resource.title;

    const tdDesc = document.createElement('td');
    tdDesc.textContent = resource.description;

    const tdLink = document.createElement('td');
    const a = document.createElement('a');
    a.href = resource.link;
    a.target = '_blank';
    a.textContent = resource.link;
    tdLink.appendChild(a);

    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.dataset.id = resource.id;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = resource.id;

    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdTitle);
    tr.appendChild(tdDesc);
    tr.appendChild(tdLink);
    tr.appendChild(tdActions);

    return tr;
}

function renderTable() {
    resourcesTbody.innerHTML = '';
    resources.forEach(resource => {
        const tr = createResourceRow(resource);
        resourcesTbody.appendChild(tr);
    });
}

async function handleAddResource(event) {
    event.preventDefault();
    const title = document.getElementById('resource-title').value.trim();
    const description = document.getElementById('resource-description').value.trim();
    const link = document.getElementById('resource-link').value.trim();

    if (!title || !link) return;

    const isUpdate = submitButton.textContent === 'Update Resource';
    const id = submitButton.dataset.editId;

    const method = isUpdate ? 'PUT' : 'POST';
    const body = isUpdate ? JSON.stringify({ id, title, description, link }) 
                          : JSON.stringify({ title, description, link });

    const response = await fetch('./resources/api/index.php', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: body
    });
    const result = await response.json();

    if (result.success) {
        if (isUpdate) {
            const index = resources.findIndex(r => r.id == id);
            resources[index] = { id, title, description, link };
            submitButton.textContent = 'Add Resource';
            delete submitButton.dataset.editId;
        } else {
            resources.push({ id: result.id, title, description, link });
        }
        renderTable();
        resourceForm.reset();
    }
}

async function handleTableClick(event) {
    const target = event.target;

    if (target.classList.contains('delete-btn')) {
        const id = target.dataset.id;
        const response = await fetch(`./resources/api/index.php?id=${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            resources = resources.filter(r => r.id != id);
            renderTable();
        }
    }

    if (target.classList.contains('edit-btn')) {
        const id = target.dataset.id;
        const resource = resources.find(r => r.id == id);
        document.getElementById('resource-title').value = resource.title;
        document.getElementById('resource-description').value = resource.description;
        document.getElementById('resource-link').value = resource.link;
        submitButton.textContent = 'Update Resource';
        submitButton.dataset.editId = id;
    }
}

async function loadAndInitialize() {
    const response = await fetch('./resources/api/index.php');
    const result = await response.json();
    if (result.success) {
        resources = result.data;
        renderTable();
    }
    resourceForm.addEventListener('submit', handleAddResource);
    resourcesTbody.addEventListener('click', handleTableClick);
}

loadAndInitialize();