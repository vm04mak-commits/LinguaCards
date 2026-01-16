import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { TgUser } from '../auth/decorators/telegram-user.decorator';
import { TelegramUser } from '../auth/auth.service';

@ApiTags('users')
@Controller('users')
@UseGuards(TelegramAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  async getMe(@TgUser() telegramUser: TelegramUser) {
    // Find or create user
    const user = await this.usersService.findOrCreateUser(telegramUser);

    // Check premium status
    const isPremium = await this.usersService.isPremium(user.id);

    return {
      ...user,
      is_premium: isPremium,
    };
  }
}
