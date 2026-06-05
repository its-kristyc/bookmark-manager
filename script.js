const form = document.getElementById('bookmark-form');
const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const categoryInput = document.getElementById('category');
const urlError = document.getElementById('url-error');
const submitBtn = document.getElementById('submit-btn');
const bookmarkList = document.getElementById('bookmark-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');

let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

function normalizeUrl(url) {
  return url.trim().toLowerCase().replace(/\/$/, '');
}

function isDuplicate(url) {
  return bookmarks.some(b => normalizeUrl(b.url) === normalizeUrl(url));
}

function saveToStorage() {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function renderBookmarks() {
  const query = searchInput.value.trim().toLowerCase();
  bookmarkList.innerHTML = '';

  const filtered = bookmarks
    .map((bookmark, index) => ({ ...bookmark, index }))
    .filter(({ title, url }) =>
      !query || title.toLowerCase().includes(query) || url.toLowerCase().includes(query)
    );

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  const grouped = {};
  filtered.forEach((bookmark) => {
    const cat = bookmark.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(bookmark);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    const section = document.createElement('li');
    section.className = 'category-section';
    section.innerHTML = `<h3 class="category-heading">${escapeHtml(category)}</h3>`;

    const ul = document.createElement('ul');
    ul.className = 'category-items';

    items.forEach(({ title, url, index }) => {
      const li = document.createElement('li');
      li.className = 'bookmark-item';
      li.innerHTML = `
        <button class="remove-btn" aria-label="Remove bookmark" data-index="${index}">✕</button>
        <span class="bookmark-title">${escapeHtml(title)}</span>
        <a class="bookmark-url" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>
      `;
      ul.appendChild(li);
    });

    section.appendChild(ul);
    bookmarkList.appendChild(section);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

urlInput.addEventListener('input', () => {
  const url = urlInput.value.trim();
  if (url && isDuplicate(url)) {
    urlError.textContent = 'This URL is already saved.';
    urlInput.classList.add('input-error');
    submitBtn.disabled = true;
  } else {
    urlError.textContent = '';
    urlInput.classList.remove('input-error');
    submitBtn.disabled = false;
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const category = categoryInput.value.trim();

  if (isDuplicate(url)) {
    urlError.textContent = 'This URL is already saved.';
    urlInput.classList.add('input-error');
    submitBtn.disabled = true;
    return;
  }

  bookmarks.unshift({ title, url, category });
  saveToStorage();
  renderBookmarks();
  form.reset();
  urlError.textContent = '';
  urlInput.classList.remove('input-error');
  submitBtn.disabled = false;
});

bookmarkList.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;

  const index = parseInt(btn.dataset.index, 10);
  bookmarks.splice(index, 1);
  saveToStorage();
  renderBookmarks();

  // re-validate in case the removed URL was the duplicate
  const currentUrl = urlInput.value.trim();
  if (currentUrl && !isDuplicate(currentUrl)) {
    urlError.textContent = '';
    urlInput.classList.remove('input-error');
    submitBtn.disabled = false;
  }
});

searchInput.addEventListener('input', renderBookmarks);

renderBookmarks();
