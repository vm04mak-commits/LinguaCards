import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService, TelegramUser } from '../auth.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Dev mode: allow requests without Telegram auth for development
    const isDev = process.env.NODE_ENV !== 'production';

    // Get initData from header or query
    const initData =
      request.headers['x-telegram-init-data'] ||
      request.query.initData ||
      request.body?.initData;

    if (!initData) {
      // In dev mode, create a mock user
      if (isDev) {
        request.telegramUser = {
          id: 123456789,
          first_name: 'Dev',
          last_name: 'User',
          username: 'devuser',
          language_code: 'ru',
        };
        return true;
      }
      throw new UnauthorizedException('Missing Telegram authentication data');
    }

    try {
      // Validate and extract user data
      const user: TelegramUser = this.authService.validateTelegramAuth(initData);

      // Attach user to request
      request.telegramUser = user;

      return true;
    } catch (error) {
      // In dev mode, use mock user if validation fails
      if (isDev) {
        request.telegramUser = {
          id: 123456789,
          first_name: 'Dev',
          last_name: 'User',
          username: 'devuser',
          language_code: 'ru',
        };
        return true;
      }
      throw new UnauthorizedException('Invalid Telegram authentication');
    }
  }
}

// Decorator to get Telegram user from request
export const TelegramUserDecorator = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const existingParameters = Reflect.getMetadata('parameters', target, propertyKey) || [];
    existingParameters.push(parameterIndex);
    Reflect.defineMetadata('parameters', existingParameters, target, propertyKey);
  };
};
