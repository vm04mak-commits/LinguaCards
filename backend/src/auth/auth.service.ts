import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

@Injectable()
export class AuthService {
  /**
   * Validates Telegram WebApp initData
   * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  validateTelegramAuth(initData: string): TelegramUser {
    if (!initData) {
      throw new UnauthorizedException('Missing initData');
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    try {
      // Parse initData
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      if (!hash) {
        throw new UnauthorizedException('Missing hash in initData');
      }

      // Create data-check-string
      const dataCheckArr = [];
      for (const [key, value] of urlParams.entries()) {
        dataCheckArr.push(`${key}=${value}`);
      }
      dataCheckArr.sort();
      const dataCheckString = dataCheckArr.join('\n');

      // Generate secret key
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Generate hash
      const calculatedHash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Verify hash
      if (calculatedHash !== hash) {
        throw new UnauthorizedException('Invalid hash');
      }

      // Check auth_date (data should not be older than 24 hours)
      const authDate = parseInt(urlParams.get('auth_date') || '0');
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 86400; // 24 hours

      if (currentTime - authDate > maxAge) {
        throw new UnauthorizedException('initData is too old');
      }

      // Parse user data
      const userJson = urlParams.get('user');
      if (!userJson) {
        throw new UnauthorizedException('Missing user data');
      }

      const user: TelegramUser = JSON.parse(userJson);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Telegram auth validation error:', error);
      throw new UnauthorizedException('Invalid Telegram authentication');
    }
  }

  /**
   * For development/testing only - bypasses validation
   */
  mockTelegramUser(): TelegramUser {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock auth is not allowed in production');
    }

    return {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en',
    };
  }
}
