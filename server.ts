import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const db = new Database('bookings.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    userName TEXT NOT NULL,
    reason TEXT,
    participants TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/bookings', (req, res) => {
    const { resource, date } = req.query;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];

    if (resource) {
      query += ' AND resource = ?';
      params.push(resource);
    }
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    query += ' ORDER BY date DESC, startTime ASC';

    const stmt = db.prepare(query);
    const bookings = stmt.all(...params);
    res.json(bookings);
  });

  app.post('/api/bookings', (req, res) => {
    const { resource, date, startTime, endTime, userName, reason, participants } = req.body;
    
    // Basic validation
    if (!resource || !date || !startTime || !endTime || !userName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for conflicts
    const conflictStmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE resource = ? AND date = ? AND startTime = ? AND status != 'rejected'
    `);
    const conflict = conflictStmt.get(resource, date, startTime);
    if (conflict) {
      return res.status(409).json({ error: 'Slot already booked or pending' });
    }

    const stmt = db.prepare(`
      INSERT INTO bookings (resource, date, startTime, endTime, userName, reason, participants, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    
    const info = stmt.run(resource, date, startTime, endTime, userName, reason, participants);
    res.status(201).json({ id: info.lastInsertRowid, status: 'pending' });
  });

  app.patch('/api/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const stmt = db.prepare('UPDATE bookings SET status = ? WHERE id = ?');
    const info = stmt.run(status, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
