/*
  Requirement: Make the "Manage Resources" page interactive.
*/

// --- Global Data Store ---
let resources = [];
let editingResourceId = null;

// --- Element Selections ---
const resourceForm = document.querySelector("#resource-form");
const resourcesTbody = document.querySelector("#resources-tbody");

// --- Functions ---

function createResourceRow(resource) {
  const row = document.createElement("tr");

  const titleCell = document.createElement("td");
  titleCell.textContent = resource.title;

  const descriptionCell = document.createElement("td");
  descriptionCell.textContent = resource.description;

  const linkCell = document.createElement("td");
  linkCell.textContent = resource.link;

  const actionsCell = document.createElement("td");

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.className = "edit-btn";
  editButton.dataset.id = resource.id;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.className = "delete-btn";
  deleteButton.dataset.id = resource.id;

  actionsCell.appendChild(editButton);
  actionsCell.appendChild(deleteButton);

  row.appendChild(titleCell);
  row.appendChild(descriptionCell);
  row.appendChild(linkCell);
  row.appendChild(actionsCell);

  return row;
}

function renderTable(resourceArray) {
  const dataToRender = resourceArray || resources;

  resourcesTbody.innerHTML = "";

  dataToRender.forEach(function (resource) {
    const row = createResourceRow(resource);
    resourcesTbody.appendChild(row);
  });
}

function handleAddResource(event) {
  event.preventDefault();

  const titleInput = document.querySelector("#resource-title");
  const descriptionInput = document.querySelector("#resource-description");
  const linkInput = document.querySelector("#resource-link");
  const submitButton = document.querySelector("#add-resource");

  const title = titleInput.value;
  const description = descriptionInput.value;
  const link = linkInput.value;

  if (editingResourceId !== null) {
    fetch("./api/index.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: editingResourceId,
        title: title,
        description: description,
        link: link
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function () {
        resources = resources.map(function (resource) {
          if (String(resource.id) === String(editingResourceId)) {
            return {
              id: editingResourceId,
              title: title,
              description: description,
              link: link
            };
          }

          return resource;
        });

        renderTable();
        resourceForm.reset();
        submitButton.textContent = "Add Resource";
        editingResourceId = null;
      });

    return;
  }

  fetch("./api/index.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: title,
      description: description,
      link: link
    })
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      const newResource = {
        id: result.id,
        title: title,
        description: description,
        link: link
      };

      resources.push(newResource);
      renderTable();
      resourceForm.reset();
    });
}

function handleTableClick(event) {
  const target = event.target;
  const id = target.dataset.id;

  if (target.classList.contains("delete-btn")) {
    fetch(`./api/index.php?id=${id}`, {
      method: "DELETE"
    })
      .then(function (response) {
        return response.json();
      })
      .then(function () {
        resources = resources.filter(function (resource) {
          return String(resource.id) !== String(id);
        });

        renderTable();
      });
  }

  if (target.classList.contains("edit-btn")) {
    const resource = resources.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!resource) {
      return;
    }

    document.querySelector("#resource-title").value = resource.title;
    document.querySelector("#resource-description").value = resource.description;
    document.querySelector("#resource-link").value = resource.link;

    document.querySelector("#add-resource").textContent = "Update Resource";
    editingResourceId = resource.id;
  }
}

async function loadAndInitialize() {
  const response = await fetch("./api/index.php");
  const result = await response.json();

  resources = result.data || [];

  renderTable();

  if (!loadAndInitialize._listenersAttached) {
    resourceForm.addEventListener("submit", handleAddResource);
    resourcesTbody.addEventListener("click", handleTableClick);
    loadAndInitialize._listenersAttached = true;
  }
}

// --- Initial Page Load ---
loadAndInitialize();