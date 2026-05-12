/*
  Requirement: Populate the resource detail page and discussion forum.
*/

// --- Global Data Store ---
let currentResourceId = null;
let currentComments = [];

// --- Element Selections ---
const resourceTitle = document.querySelector("#resource-title");
const resourceDescription = document.querySelector("#resource-description");
const resourceLink = document.querySelector("#resource-link");
const commentList = document.querySelector("#comment-list");
const commentForm = document.querySelector("#comment-form");
const newComment = document.querySelector("#new-comment");

// --- Functions ---

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderResourceDetails(resource) {
  resourceTitle.textContent = resource.title;
  resourceDescription.textContent = resource.description;
  resourceLink.href = resource.link;
}

function createCommentArticle(comment) {
  const article = document.createElement("article");

  const text = document.createElement("p");
  text.textContent = comment.text;

  const footer = document.createElement("footer");
  footer.textContent = `Posted by: ${comment.author}`;

  article.appendChild(text);
  article.appendChild(footer);

  return article;
}

function renderComments() {
  commentList.innerHTML = "";

  currentComments.forEach(function (comment) {
    const article = createCommentArticle(comment);
    commentList.appendChild(article);
  });
}

function handleAddComment(event) {
  event.preventDefault();

  const commentText = newComment.value.trim();

  if (commentText === "") {
    return;
  }

  fetch("./api/index.php?action=comment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: "Student",
      text: commentText
    })
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      const comment = result.data || {
        id: result.id,
        resource_id: currentResourceId,
        author: "Student",
        text: commentText,
        created_at: ""
      };

      currentComments.push(comment);
      renderComments();
      newComment.value = "";
    });
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();

  if (!currentResourceId) {
    resourceTitle.textContent = "Resource not found.";
    return;
  }

  try {
    const [resourceResponse, commentsResponse] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
    ]);

    const resourceResult = await resourceResponse.json();
    const commentsResult = await commentsResponse.json();

    const resource = resourceResult.data;

    if (!resource || Array.isArray(resource)) {
      resourceTitle.textContent = "Resource not found.";
      return;
    }

    currentComments = commentsResult.data || [];

    renderResourceDetails(resource);
    renderComments();

    commentForm.addEventListener("submit", handleAddComment);
  } catch (error) {
    resourceTitle.textContent = "Resource not found.";
  }
}

// --- Initial Page Load ---
initializePage();