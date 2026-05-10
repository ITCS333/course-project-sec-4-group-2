const resourceListSection = document.getElementById('resource-list-section');

function createResourceArticle(resource) {
    const article = document.createElement('article');

    const title = document.createElement('h3');
    title.textContent = resource.title;

    const desc = document.createElement('p');
    desc.textContent = resource.description;

    const link = document.createElement('a');
    link.href = `details.html?id=${resource.id}`;
    link.target = '_blank';
    link.textContent = 'View Resource & Discussion';

    article.appendChild(title);
    article.appendChild(desc);
    article.appendChild(link);

    return article;
}

async function loadResources() {
    try {
        const response = await fetch('./resources/api/index.php');
        const result = await response.json();

        if (result.success) {
            resourceListSection.innerHTML = '';
            result.data.forEach(resource => {
                const article = createResourceArticle(resource);
                resourceListSection.appendChild(article);
            });
        } else {
            resourceListSection.innerHTML = '<p>No resources found.</p>';
        }
    } catch (error) {
        console.error('Error loading resources:', error);
        resourceListSection.innerHTML = '<p>Error loading resources.</p>';
    }
}

loadResources();