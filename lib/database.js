const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../ghostbot.db');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize the database and create all tables
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');

        // Create all tables
        this.createTables()
          .then(() => {
            console.log('Database tables initialized');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  // Create all application tables
  async createTables() {
    await this.runMigrations();

    const tables = [
      // Gym sessions table
      `CREATE TABLE IF NOT EXISTS gym_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        workout TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        UNIQUE(user_id, date)
      )`,

      // User gym goals table
      `CREATE TABLE IF NOT EXISTS user_gym_goals (
        user_id TEXT PRIMARY KEY,
        weekly_goal INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // PC parts monitoring tables
      `CREATE TABLE IF NOT EXISTS monitored_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_url TEXT UNIQUE NOT NULL,
        list_name TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS pc_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        part_type TEXT NOT NULL,
        part_name TEXT NOT NULL,
        part_url TEXT,
        last_notified_price REAL,
        last_notified_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (list_id) REFERENCES monitored_lists (id)
      )`,

      `CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_id INTEGER NOT NULL,
        price REAL NOT NULL,
        merchant TEXT,
        availability TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (part_id) REFERENCES pc_parts (id)
      )`,
    ];

    for (const tableSQL of tables) {
      await new Promise((resolve, reject) => {
        this.db.run(tableSQL, (err) => {
          if (err) {
            console.error('Error creating table:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  // Run database migrations
  async runMigrations() {
    try {
      // Check if pc_parts has the new columns
      const tableInfo = await new Promise((resolve, reject) => {
        this.db.all('PRAGMA table_info(pc_parts)', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const hasLastNotifiedPrice = tableInfo.some((col) => col.name === 'last_notified_price');
      const hasLastNotifiedAt = tableInfo.some((col) => col.name === 'last_notified_at');

      // Add columns if they don't exist
      if (!hasLastNotifiedPrice) {
        await new Promise((resolve, reject) => {
          this.db.run('ALTER TABLE pc_parts ADD COLUMN last_notified_price REAL', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log('Migration: Added last_notified_price column to pc_parts');
      }

      if (!hasLastNotifiedAt) {
        await new Promise((resolve, reject) => {
          this.db.run('ALTER TABLE pc_parts ADD COLUMN last_notified_at TEXT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log('Migration: Added last_notified_at column to pc_parts');
      }
    } catch (error) {
      // Table might not exist yet, which is fine
      if (!error.message.includes('no such table')) {
        console.error('Error running migrations:', error);
      }
    }
  }

  // Generic query methods
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
