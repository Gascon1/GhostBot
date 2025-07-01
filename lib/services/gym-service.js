const database = require('../database');

class GymService {
  // Log a gym session
  async logGymSession(userId, date, workout) {
    try {
      // Create timestamp in Montreal timezone
      const now = new Date();
      const montrealTimestamp = new Date(now.toLocaleString('en-US', { timeZone: 'America/Montreal' })).toISOString();

      await database.run('INSERT INTO gym_sessions (user_id, date, workout, timestamp) VALUES (?, ?, ?, ?)', [
        userId,
        date,
        workout,
        montrealTimestamp,
      ]);

      return {
        userId,
        date,
        workout,
        timestamp: montrealTimestamp,
      };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('ALREADY_LOGGED_TODAY');
      }
      throw error;
    }
  }

  // Get all gym sessions for a user
  async getUserGymSessions(userId) {
    return await database.all('SELECT * FROM gym_sessions WHERE user_id = ? ORDER BY date DESC', [userId]);
  }

  // Get all users with their gym stats
  async getAllUserStats() {
    return await database.all(`
      SELECT
        user_id,
        COUNT(*) as total_sessions,
        MAX(date) as last_workout_date,
        MIN(date) as first_workout_date
      FROM gym_sessions
      GROUP BY user_id
      ORDER BY total_sessions DESC
    `);
  }

  // Get recent gym sessions from all users
  async getRecentSessions(limit = 10) {
    return await database.all('SELECT * FROM gym_sessions ORDER BY timestamp DESC LIMIT ?', [limit]);
  }

  // Calculate streak for a user
  async calculateUserStreak(userId) {
    const sessions = await this.getUserGymSessions(userId);
    if (!sessions || sessions.length === 0) return 0;

    // Sort by date (most recent first) - they should already be sorted
    const sortedSessions = sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    // Get current date in Montreal timezone
    const now = new Date();
    let currentDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Montreal' }));
    currentDate.setHours(0, 0, 0, 0); // Start of day

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date + 'T00:00:00');
      const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

      if (streak === 0 && daysDiff <= 1) {
        // First session, allow today or yesterday
        streak = 1;
        currentDate = sessionDate;
      } else if (daysDiff === 1) {
        // Consecutive day
        streak++;
        currentDate = sessionDate;
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  }

  // Get user's max streak (calculated from all sessions)
  async getUserMaxStreak(userId) {
    const sessions = await this.getUserGymSessions(userId);
    if (!sessions || sessions.length === 0) return 0;

    // Sort by date (oldest first for max streak calculation)
    const sortedSessions = sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = null;

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date + 'T00:00:00');

      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((sessionDate - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }

      lastDate = sessionDate;
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  }
}

// Create singleton instance
const gymService = new GymService();

module.exports = gymService;
