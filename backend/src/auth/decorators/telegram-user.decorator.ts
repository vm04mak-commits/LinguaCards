import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegramUser } from '../auth.service';

export const TgUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TelegramUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.telegramUser;
  },
);
