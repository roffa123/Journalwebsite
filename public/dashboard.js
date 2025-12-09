let currentUser = null;
let currentEntry = null;
let entries = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    currentUser = auth.getUser();
    document.getElementById('username').textContent = currentUser.username || currentUser.email;

    // Load entries
    loadEntries();

    // Event listeners
    document.getElementById('newEntryBtn').addEventListener('click', openNewEntryModal);
    document.getElementById('createEntryBtn').addEventListener('click', createNewEntry);
    document.getElementById('saveBtn').addEventListener('click', saveCurrentEntry);
    document.getElementById('deleteBtn').addEventListener('click', deleteCurrentEntry);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.querySelector('.close').addEventListener('click', closeModal);

    // Close modal on outside click
    document.getElementById('newEntryModal').addEventListener('click', (e) => {
        if (e.target.id === 'newEntryModal') {
            closeModal();
        }
    });
});

// Load all entries for current user
async function loadEntries() {
    try {
        const response = await fetch(`/api/journals/${currentUser.id}`);
        if (response.ok) {
            entries = await response.json();
            renderEntriesList();
        }
    } catch (error) {
        console.error('Error loading entries:', error);
    }
}

// Render entries list in sidebar
function renderEntriesList() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';

    if (entries.length === 0) {
        entriesList.innerHTML = '<li style="padding: 20px; text-align: center; color: #999;">No entries yet</li>';
        return;
    }

    entries.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="entry-title">${escapeHtml(entry.title)}</span>
            <span class="entry-preview">${escapeHtml(entry.content.substring(0, 50))}...</span>
        `;
        li.addEventListener('click', () => loadEntry(entry));
        entriesList.appendChild(li);
    });
}

// Load and display a single entry
function loadEntry(entry) {
    currentEntry = entry;
    document.getElementById('entryTitle').value = entry.title;
    document.getElementById('entryContent').value = entry.content;
    document.getElementById('entryDate').textContent = new Date(entry.created_at).toLocaleString();
    
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('editorArea').style.display = 'flex';

    // Update active state in sidebar
    document.querySelectorAll('.entries-list li').forEach(li => li.classList.remove('active'));
    event.target.closest('li')?.classList.add('active');
}

// Open new entry modal
function openNewEntryModal() {
    document.getElementById('newEntryTitle').value = '';
    document.getElementById('newEntryContent').value = '';
    document.getElementById('newEntryModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('newEntryModal').style.display = 'none';
}

// Create new entry
async function createNewEntry() {
    const title = document.getElementById('newEntryTitle').value.trim();
    const content = document.getElementById('newEntryContent').value.trim();

    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/journals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                title: title,
                content: content
            })
        });

        if (response.ok) {
            const data = await response.json();
            closeModal();
            loadEntries();
            alert('Entry created successfully!');
        } else {
            alert('Failed to create entry');
        }
    } catch (error) {
        console.error('Error creating entry:', error);
        alert('Error creating entry');
    }
}

// Save current entry
async function saveCurrentEntry() {
    if (!currentEntry) return;

    const title = document.getElementById('entryTitle').value.trim();
    const content = document.getElementById('entryContent').value.trim();

    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`/api/journals/${currentUser.id}/${currentEntry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (response.ok) {
            loadEntries();
            alert('Entry saved successfully!');
        } else {
            alert('Failed to save entry');
        }
    } catch (error) {
        console.error('Error saving entry:', error);
        alert('Error saving entry');
    }
}

// Delete current entry
async function deleteCurrentEntry() {
    if (!currentEntry) return;

    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
        const response = await fetch(`/api/journals/${currentUser.id}/${currentEntry.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            currentEntry = null;
            loadEntries();
            document.getElementById('emptyState').style.display = 'flex';
            document.getElementById('editorArea').style.display = 'none';
            alert('Entry deleted successfully!');
        } else {
            alert('Failed to delete entry');
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
        window.location.href = '/';
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
