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

      // Future tables can be added here
      // `CREATE TABLE IF NOT EXISTS user_stats (...)`
      // `CREATE TABLE IF NOT EXISTS predictions (...)`
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

  // Generic query methods
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
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
