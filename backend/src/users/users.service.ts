import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TelegramUser } from '../auth/auth.service';
import { LIMITS_CONFIG } from '../config/limits.config';

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string;
  is_premium: boolean;
  premium_until: Date | null;
  daily_cards_limit: number;
  daily_translations: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  /**
   * Find or create user from Telegram data
   */
  async findOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    // Try to find existing user
    const existingUser = await this.findByTelegramId(telegramUser.id);

    if (existingUser) {
      // Update user info if changed
      return this.updateUser(existingUser.id, {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code,
      });
    }

    // Create new user
    return this.createUser(telegramUser);
  }

  /**
   * Find user by Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId],
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by database ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create new user
   */
  private async createUser(telegramUser: TelegramUser): Promise<User> {
    const result = await this.db.query<User>(
      `INSERT INTO users (
        telegram_id, username, first_name, last_name, language_code
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        telegramUser.id,
        telegramUser.username || null,
        telegramUser.first_name,
        telegramUser.last_name || null,
        telegramUser.language_code || 'en',
      ],
    );

    return result.rows[0];
  }

  /**
   * Update user
   */
  async updateUser(
    id: number,
    data: Partial<{
      username: string;
      first_name: string;
      last_name: string;
      language_code: string;
      is_premium: boolean;
      premium_until: Date;
      daily_cards_limit: number;
      daily_translations: number;
    }>,
  ): Promise<User> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await this.db.query<User>(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Check if user is premium
   */
  async isPremium(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    if (!user.is_premium) return false;

    // Check if premium is still valid
    if (user.premium_until) {
      const now = new Date();
      if (now > user.premium_until) {
        // Premium expired, update user
        await this.updateUser(userId, {
          is_premium: false,
          premium_until: null,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Grant premium access
   */
  async grantPremium(
    userId: number,
    duration: 'day' | 'month' | 'lifetime',
  ): Promise<User> {
    let premiumUntil: Date | null = null;

    if (duration !== 'lifetime') {
      premiumUntil = new Date();
      if (duration === 'day') {
        premiumUntil.setDate(premiumUntil.getDate() + 1);
      } else if (duration === 'month') {
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);
      }
    }

    return this.updateUser(userId, {
      is_premium: true,
      premium_until: premiumUntil,
    });
  }

  /**
   * Get daily limit info for user
   * Returns cards studied today, limit, and whether limit is exceeded
   */
  async getDailyLimitInfo(userId: number): Promise<{
    cardsStudiedToday: number;
    dailyLimit: number;
    remainingCards: number;
    isLimitExceeded: boolean;
    isPremium: boolean;
  }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isPremium = await this.isPremium(userId);

    // Premium users have no limits
    if (isPremium) {
      return {
        cardsStudiedToday: 0,
        dailyLimit: -1, // unlimited
        remainingCards: -1, // unlimited
        isLimitExceeded: false,
        isPremium: true,
      };
    }

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.query(
      `SELECT cards_studied FROM daily_stats WHERE user_id = $1 AND date = $2`,
      [userId, today],
    );

    const cardsStudiedToday = result.rows[0]?.cards_studied || 0;
    // Use config as default, user.daily_cards_limit only if explicitly set differently (for special users)
    const dailyLimit = LIMITS_CONFIG.FREE_DAILY_CARDS_LIMIT;
    const remainingCards = Math.max(0, dailyLimit - cardsStudiedToday);
    const isLimitExceeded = cardsStudiedToday >= dailyLimit;

    return {
      cardsStudiedToday,
      dailyLimit,
      remainingCards,
      isLimitExceeded,
      isPremium: false,
    };
  }

  /**
   * Reset daily limit for user (after purchase)
   */
  async resetDailyLimit(userId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.db.query(
      `UPDATE daily_stats SET cards_studied = 0 WHERE user_id = $1 AND date = $2`,
      [userId, today],
    );
  }
}
