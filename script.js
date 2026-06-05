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
let editingIndex = null;

const PENCIL_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
const CHECK_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;

function normalizeUrl(url) {
  return url.trim().toLowerCase().replace(/\/$/, '');
}

function isDuplicate(url) {
  return bookmarks.some(b => normalizeUrl(b.url) === normalizeUrl(url));
}

function saveToStorage() {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

    items.forEach(({ title, url, category: cat, index }) => {
      const li = document.createElement('li');
      li.className = 'bookmark-item';

      if (index === editingIndex) {
        li.classList.add('editing');
        li.innerHTML = `
          <div class="card-actions">
            <button class="card-btn save-btn" data-index="${index}" disabled>${CHECK_SVG}</button>
            <button class="card-btn cancel-btn">✕</button>
          </div>
          <input class="edit-input edit-title" type="text" value="${escapeHtml(title)}" placeholder="Title" />
          <input class="edit-input edit-url" type="url" value="${escapeHtml(url)}" placeholder="https://example.com" />
          <span class="edit-error" id="edit-url-error"></span>
          <input class="edit-input edit-category" type="text" value="${escapeHtml(cat)}" placeholder="Category" />
        `;
      } else {
        li.innerHTML = `
          <div class="card-actions">
            <button class="card-btn edit-btn" data-index="${index}">${PENCIL_SVG}</button>
            <button class="card-btn remove-btn" data-index="${index}">✕</button>
          </div>
          <span class="bookmark-title">${escapeHtml(title)}</span>
          <a class="bookmark-url" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>
          <span class="category-tag">${escapeHtml(cat)}</span>
        `;
      }

      ul.appendChild(li);
    });

    section.appendChild(ul);
    bookmarkList.appendChild(section);
  });

  if (editingIndex !== null) attachEditListeners();
}

function attachEditListeners() {
  const titleEl = bookmarkList.querySelector('.edit-title');
  const urlEl = bookmarkList.querySelector('.edit-url');
  const categoryEl = bookmarkList.querySelector('.edit-category');
  const saveBtn = bookmarkList.querySelector('.save-btn');
  const errorEl = document.getElementById('edit-url-error');

  function validate() {
    const title = titleEl.value.trim();
    const url = urlEl.value.trim();
    const category = categoryEl.value.trim();

    if (!title || !url || !category) {
      saveBtn.disabled = true;
      urlEl.classList.remove('input-error');
      errorEl.textContent = '';
      return;
    }

    try { new URL(url); } catch {
      saveBtn.disabled = true;
      urlEl.classList.add('input-error');
      errorEl.textContent = 'Invalid URL format.';
      return;
    }

    const isDup = bookmarks.some(
      (b, i) => i !== editingIndex && normalizeUrl(b.url) === normalizeUrl(url)
    );

    if (isDup) {
      saveBtn.disabled = true;
      urlEl.classList.add('input-error');
      errorEl.textContent = 'This URL is already saved.';
      return;
    }

    urlEl.classList.remove('input-error');
    errorEl.textContent = '';
    saveBtn.disabled = false;
  }

  [titleEl, urlEl, categoryEl].forEach(el => {
    el.addEventListener('input', validate);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!saveBtn.disabled) saveEdit(editingIndex);
      }
    });
  });

  validate();
}

function saveEdit(index) {
  const titleEl = bookmarkList.querySelector('.edit-title');
  const urlEl = bookmarkList.querySelector('.edit-url');
  const categoryEl = bookmarkList.querySelector('.edit-category');

  bookmarks[index] = {
    title: titleEl.value.trim(),
    url: urlEl.value.trim(),
    category: categoryEl.value.trim(),
  };

  editingIndex = null;
  saveToStorage();
  renderBookmarks();
}

function cancelEdit() {
  if (editingIndex === null) return;
  editingIndex = null;
  renderBookmarks();
}

// ── Add form ──────────────────────────────────────────────

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

// ── Bookmark list actions ─────────────────────────────────

bookmarkList.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    editingIndex = parseInt(editBtn.dataset.index, 10);
    renderBookmarks();
    return;
  }

  const removeBtn = e.target.closest('.remove-btn');
  if (removeBtn) {
    const index = parseInt(removeBtn.dataset.index, 10);
    bookmarks.splice(index, 1);
    editingIndex = null;
    saveToStorage();
    renderBookmarks();

    const currentUrl = urlInput.value.trim();
    if (currentUrl && !isDuplicate(currentUrl)) {
      urlError.textContent = '';
      urlInput.classList.remove('input-error');
      submitBtn.disabled = false;
    }
    return;
  }

  const saveBtn = e.target.closest('.save-btn');
  if (saveBtn) {
    saveEdit(parseInt(saveBtn.dataset.index, 10));
    return;
  }

  if (e.target.closest('.cancel-btn')) {
    cancelEdit();
  }
});

// Outside click cancels edit
document.addEventListener('pointerdown', (e) => {
  if (editingIndex === null) return;
  const editingCard = bookmarkList.querySelector('.bookmark-item.editing');
  if (editingCard && !editingCard.contains(e.target)) cancelEdit();
});

// Typing in search cancels edit first
searchInput.addEventListener('input', () => {
  if (editingIndex !== null) cancelEdit();
  renderBookmarks();
});

renderBookmarks();
