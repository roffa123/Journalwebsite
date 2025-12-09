const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db/database');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Handle registration
app.post('/api/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        res.json({ message: 'Registration successful! Please login.' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Handle login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (passwordMatch) {
        res.json({ 
          message: 'Login successful!',
          user: { id: user.id, username: user.username, email: user.email }
        });
      } else {
        res.status(400).json({ error: 'Invalid email or password' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Get all journal entries for a user
app.get('/api/journals/:userId', (req, res) => {
  const userId = req.params.userId;

  db.all(
    'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(rows || []);
    }
  );
});

// Get a single journal entry
app.get('/api/journals/:userId/:entryId', (req, res) => {
  const { userId, entryId } = req.params;

  db.get(
    'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
    [entryId, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json(row);
    }
  );
});

// Create a new journal entry
app.post('/api/journals', (req, res) => {
  const { userId, title, content } = req.body;

  if (!userId || !title || !content) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO journal_entries (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create entry' });
      }
      res.json({ 
        message: 'Entry created successfully!',
        entryId: this.lastID
      });
    }
  );
});

// Update a journal entry
app.put('/api/journals/:userId/:entryId', (req, res) => {
  const { userId, entryId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    'UPDATE journal_entries SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [title, content, entryId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update entry' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ message: 'Entry updated successfully!' });
    }
  );
});

// Delete a journal entry
app.delete('/api/journals/:userId/:entryId', (req, res) => {
  const { userId, entryId } = req.params;

  db.run(
    'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
    [entryId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete entry' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ message: 'Entry deleted successfully!' });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
