let currentResourceId = null;
let currentComments = [];

const titleElement = document.getElementById('resource-title');
const descriptionElement = document.getElementById('resource-description');
const linkElement = document.getElementById('resource-link');
const commentList = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const newCommentInput = document.getElementById('new-comment');

function getResourceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function renderResourceDetails(resource) {
    titleElement.textContent = resource.title;
    descriptionElement.textContent = resource.description;
    linkElement.href = resource.link;
}

function createCommentArticle(comment) {
    const article = document.createElement('article');
    const p = document.createElement('p');
    p.textContent = comment.text;
    const footer = document.createElement('footer');
    footer.textContent = `Posted by: ${comment.author}`;
    article.appendChild(p);
    article.appendChild(footer);
    return article;
}

function renderComments() {
    commentList.innerHTML = '';
    currentComments.forEach(comment => {
        const article = createCommentArticle(comment);
        commentList.appendChild(article);
    });
}

async function handleAddComment(event) {
    event.preventDefault();
    const commentText = newCommentInput.value.trim();
    if (!commentText) return;

    try {
        const response = await fetch('./resources/api/index.php?action=comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resource_id: currentResourceId,
                author: 'Student',
                text: commentText
            })
        });
        const result = await response.json();
        if (result.success) {
            currentComments.push({
                id: result.id,
                resource_id: currentResourceId,
                author: 'Student',
                text: commentText
            });
            renderComments();
            newCommentInput.value = '';
        }
    } catch (error) {
        console.error('Error posting comment:', error);
    }
}

async function initializePage() {
    currentResourceId = getResourceIdFromURL();
    if (!currentResourceId) {
        titleElement.textContent = 'Resource not found.';
        return;
    }

    try {
        const [resourceRes, commentsRes] = await Promise.all([
            fetch(`./resources/api/index.php?id=${currentResourceId}`),
            fetch(`./resources/api/index.php?resource_id=${currentResourceId}&action=comments`)
        ]);
        const resourceData = await resourceRes.json();
        const commentsData = await commentsRes.json();

        if (resourceData.success) {
            renderResourceDetails(resourceData.data);
            currentComments = commentsData.success ? commentsData.data : [];
            renderComments();
            commentForm.addEventListener('submit', handleAddComment);
        } else {
            titleElement.textContent = 'Resource not found.';
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        titleElement.textContent = 'Error loading resource.';
    }
}

initializePage();