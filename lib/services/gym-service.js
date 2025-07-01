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

  // Set or update user's weekly goal
  async setWeeklyGoal(userId, weeklyGoal) {
    const now = new Date().toISOString();

    // Try to update first
    const result = await database.run('UPDATE user_gym_goals SET weekly_goal = ?, updated_at = ? WHERE user_id = ?', [
      weeklyGoal,
      now,
      userId,
    ]);

    // If no rows were updated, insert new record
    if (result && result.changes === 0) {
      await database.run(
        'INSERT INTO user_gym_goals (user_id, weekly_goal, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [userId, weeklyGoal, now, now],
      );
    }

    return { userId, weeklyGoal };
  }

  // Get user's weekly goal
  async getUserWeeklyGoal(userId) {
    const goal = await database.get('SELECT weekly_goal FROM user_gym_goals WHERE user_id = ?', [userId]);
    return goal ? goal.weekly_goal : 3; // Default to 3 times per week
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

  // Helper function to get week start date (Monday) in Montreal timezone
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Get sessions grouped by week for a user
  async getUserSessionsByWeek(userId) {
    const sessions = await this.getUserGymSessions(userId);
    const weekMap = new Map();

    sessions.forEach((session) => {
      const sessionDate = new Date(session.date + 'T00:00:00');
      const weekStart = this.getWeekStart(sessionDate);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey).push(session);
    });

    return weekMap;
  }

  // Calculate weekly streak based on user's goal
  async calculateWeeklyStreak(userId) {
    const weeklyGoal = await this.getUserWeeklyGoal(userId);
    const sessionsByWeek = await this.getUserSessionsByWeek(userId);

    if (sessionsByWeek.size === 0) return 0;

    // Get current week start
    const now = new Date();
    const montrealNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Montreal' }));
    const currentWeekStart = this.getWeekStart(montrealNow);

    let streak = 0;

    // Check weeks going backwards from current week
    while (true) {
      const weekKey = currentWeekStart.toISOString().split('T')[0];
      const weekSessions = sessionsByWeek.get(weekKey) || [];

      if (weekSessions.length >= weeklyGoal) {
        streak++;
        // Move to previous week
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  }

  // Get current week progress
  async getCurrentWeekProgress(userId) {
    const weeklyGoal = await this.getUserWeeklyGoal(userId);
    const sessionsByWeek = await this.getUserSessionsByWeek(userId);

    // Get current week
    const now = new Date();
    const montrealNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Montreal' }));
    const currentWeekStart = this.getWeekStart(montrealNow);
    const weekKey = currentWeekStart.toISOString().split('T')[0];

    const currentWeekSessions = sessionsByWeek.get(weekKey) || [];

    return {
      sessionsThisWeek: currentWeekSessions.length,
      weeklyGoal,
      remaining: Math.max(0, weeklyGoal - currentWeekSessions.length),
      goalMet: currentWeekSessions.length >= weeklyGoal,
    };
  }

  // Get user's max weekly streak
  async getUserMaxWeeklyStreak(userId) {
    const weeklyGoal = await this.getUserWeeklyGoal(userId);
    const sessionsByWeek = await this.getUserSessionsByWeek(userId);

    if (sessionsByWeek.size === 0) return 0;

    // Sort weeks chronologically
    const sortedWeeks = Array.from(sessionsByWeek.keys()).sort();

    let maxStreak = 0;
    let currentStreak = 0;
    let lastWeekStart = null;

    for (const weekKey of sortedWeeks) {
      const weekSessions = sessionsByWeek.get(weekKey);
      const weekStart = new Date(weekKey);

      if (weekSessions.length >= weeklyGoal) {
        if (lastWeekStart === null || weekStart.getTime() - lastWeekStart.getTime() === 7 * 24 * 60 * 60 * 1000) {
          // Consecutive week or first week
          currentStreak++;
        } else {
          // Gap in weeks, reset streak
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
        lastWeekStart = weekStart;
      } else {
        // Goal not met, reset streak
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 0;
        lastWeekStart = null;
      }
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  }

  // Legacy methods for backward compatibility (now use weekly logic)
  async calculateUserStreak(userId) {
    return await this.calculateWeeklyStreak(userId);
  }

  async getUserMaxStreak(userId) {
    return await this.getUserMaxWeeklyStreak(userId);
  }
}

// Create singleton instance
const gymService = new GymService();

module.exports = gymService;
