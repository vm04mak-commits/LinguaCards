import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

@Module({
  providers: [AuthService, TelegramAuthGuard],
  exports: [AuthService, TelegramAuthGuard],
})
export class AuthModule {}
